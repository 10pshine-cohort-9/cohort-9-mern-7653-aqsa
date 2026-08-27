import { expect } from "chai";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import http from "http";
import app from "../../app.js";
import User from "../../src/models/user.model.js";
import Task from "../../src/models/task.model.js";
import { initSocket } from "../../src/config/socket.js";

describe("Task Integration Tests", function () {
  let server;
  let user;
  let token;
  let task;

  before(async function () {
    await mongoose.connect(process.env.MONGO_URI);

    server = http.createServer(app);
    initSocket(server);

    const hashedPassword = await bcrypt.hash("123456", 10);

    user = await User.create({
      username: "taskintegration",
      email: "taskintegration@test.com",
      password: hashedPassword,
      provider: "local"
    });

    token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
  });

  after(async function () {
    await Task.deleteMany({ user: user._id });
    await User.deleteOne({ _id: user._id });
    server.close();
    await mongoose.connection.close();
  });

  describe("POST /api/tasks", function () {
    it("should create a task", async function () {
      const response = await request(app)
        .post("/api/tasks")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          title: "Test Task",
          description: "Task description",
          priority: "High"
        });

      expect(response.status).to.equal(201);
      expect(response.body.message).to.equal("Task created successfully");
      expect(response.body.task).to.exist;

      task = await Task.findOne({
        user: user._id,
        title: "Test Task"
      });

      expect(task).to.exist;
    });

    it("should reject empty task title", async function () {
      const response = await request(app)
        .post("/api/tasks")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          title: "   "
        });

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal("Task title is required");
    });

    it("should reject unauthenticated request", async function () {
      const response = await request(app)
        .post("/api/tasks")
        .set("Origin", "http://localhost:5173")
        .send({
          title: "Unauthorized Task"
        });

      expect(response.status).to.equal(401);
    });

    it("should reject request without CSRF origin", async function () {
      const response = await request(app)
        .post("/api/tasks")
        .set("Cookie", `token=${token}`)
        .send({
          title: "CSRF Task"
        });

      expect(response.status).to.equal(403);
      expect(response.body.message).to.equal("CSRF validation failed");
    });
  });

  describe("GET /api/tasks", function () {
    it("should get user tasks", async function () {
      const response = await request(app)
        .get("/api/tasks")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(200);
      expect(response.body.tasks).to.be.an("array");
      expect(response.body.tasks.length).to.be.greaterThan(0);
    });

    it("should filter completed tasks", async function () {
      await Task.findByIdAndUpdate(task._id, {
        completed: true
      });

      const response = await request(app)
        .get("/api/tasks?completed=true")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(200);
      expect(response.body.tasks).to.be.an("array");
      expect(
        response.body.tasks.every(t => t.completed === true)
      ).to.equal(true);
    });

    it("should reject unauthenticated request", async function () {
      const response = await request(app)
        .get("/api/tasks");

      expect(response.status).to.equal(401);
    });
  });

  describe("PUT /api/tasks/:id", function () {
    it("should update a task", async function () {
      const response = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          title: "Updated Task",
          description: "Updated description",
          priority: "Low"
        });

      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal("Task updated successfully");
      expect(response.body.task.title).to.equal("Updated Task");
      expect(response.body.task.description).to.equal("Updated description");
      expect(response.body.task.priority).to.equal("Low");
    });

    it("should reject empty title", async function () {
      const response = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          title: "   "
        });

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal("Task title cannot be empty");
    });

    it("should return 404 for non-existing task", async function () {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/tasks/${fakeId}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          title: "Updated"
        });

      expect(response.status).to.equal(404);
      expect(response.body.message).to.equal("Task not found");
    });
  });

  describe("PATCH /api/tasks/:id/toggle", function () {
    it("should toggle task status", async function () {
      const currentTask = await Task.findById(task._id);

      const response = await request(app)
        .patch(`/api/tasks/${task._id}/toggle`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(200);
      expect(response.body.task.completed).to.equal(!currentTask.completed);
      expect(response.body.message).to.be.oneOf([
        "Task completed",
        "Task marked pending"
      ]);
    });

    it("should return 404 for non-existing task", async function () {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/tasks/${fakeId}/toggle`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(404);
      expect(response.body.message).to.equal("Task not found");
    });
  });

  describe("DELETE /api/tasks/:id", function () {
    it("should delete a task", async function () {
      const response = await request(app)
        .delete(`/api/tasks/${task._id}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal("Task deleted successfully");

      const deletedTask = await Task.findById(task._id);
      expect(deletedTask).to.equal(null);
    });

    it("should return 404 for non-existing task", async function () {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/tasks/${fakeId}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(404);
      expect(response.body.message).to.equal("Task not found");
    });

    it("should reject unauthenticated request", async function () {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/tasks/${fakeId}`)
        .set("Origin", "http://localhost:5173");

      expect(response.status).to.equal(401);
    });
  });
});