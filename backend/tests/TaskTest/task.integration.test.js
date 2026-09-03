import { expect } from "chai";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import http from "http";
import app from "../../app.js";
import User from "../../src/models/user.model.js";
import Task from "../../src/models/task.model.js";
import Note from "../../src/models/note.model.js";
import { initSocket } from "../../src/config/socket.js";
describe("Task Integration Tests", function () {
  let server;
  let user;
  let token;
  let task;
  let note;
  before(async function () {
    await mongoose.connect(process.env.MONGO_TEST_URI);
    server = http.createServer(app);
    initSocket(server);
    const existingUser = await User.findOne({ username: "taskintegration" });
    if (existingUser) {
      await Task.deleteMany({ user: existingUser._id });
      await Note.deleteMany({ user: existingUser._id });
      await User.deleteOne({ _id: existingUser._id });
    }
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
    note = await Note.create({
      user: user._id,
      title: "Task Note",
      pages: []
    });
  });
  after(async function () {
    try {
      if (user?._id) {
        await Task.deleteMany({ user: user._id });
        await Note.deleteMany({ user: user._id });
        await User.deleteOne({ _id: user._id });
      }
    } finally {
      server.close();
      await mongoose.connection.close();
    }
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
    it("should create a task with a dueDate", async function () {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);
      const response = await request(app)
        .post("/api/tasks")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          title: "Task With Due Date",
          dueDate: dueDate.toISOString()
        });
      expect(response.status).to.equal(201);
      expect(response.body.task).to.exist;
      expect(response.body.task.dueDate).to.exist;
      await Task.deleteOne({ _id: response.body.task._id });
    });
    it("should create a task linked to a note", async function () {
      const response = await request(app)
        .post("/api/tasks")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          title: "Task With Note",
          note: note._id.toString()
        });
      expect(response.status).to.equal(201);
      expect(response.body.task).to.exist;
      expect(response.body.task.note).to.exist;
      expect(response.body.task.note._id).to.equal(note._id.toString());
      await Task.deleteOne({ _id: response.body.task._id });
    });
    it("should create a task with default priority Medium when not specified", async function () {
      const response = await request(app)
        .post("/api/tasks")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          title: "Default Priority Task"
        });
      expect(response.status).to.equal(201);
      expect(response.body.task.priority).to.equal("Medium");
      await Task.deleteOne({ _id: response.body.task._id });
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
    it("should reject missing task title", async function () {
      const response = await request(app)
        .post("/api/tasks")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({});
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
    it("should filter pending (incomplete) tasks", async function () {
      await Task.findByIdAndUpdate(task._id, { completed: false });
      const completedTask = await Task.create({
        user: user._id,
        title: "Completed Task",
        completed: true
      });
      const response = await request(app)
        .get("/api/tasks?completed=false")
        .set("Cookie", `token=${token}`);
      expect(response.status).to.equal(200);
      expect(
        response.body.tasks.every(t => t.completed === false)
      ).to.equal(true);
      await Task.deleteOne({ _id: completedTask._id });
    });
    it("should filter tasks by dueDate", async function () {
      const today = new Date();
      const dueDateStr = today.toISOString().split("T")[0];
      const dueDateTask = await Task.create({
        user: user._id,
        title: "Due Today Task",
        dueDate: new Date(dueDateStr)
      });
      const response = await request(app)
        .get(`/api/tasks?dueDate=${dueDateStr}`)
        .set("Cookie", `token=${token}`);
      expect(response.status).to.equal(200);
      expect(response.body.tasks).to.be.an("array");
      const taskIds = response.body.tasks.map((t) => t._id);
      expect(taskIds).to.include(dueDateTask._id.toString());
      await Task.deleteOne({ _id: dueDateTask._id });
    });
    it("should return tasks only for the authenticated user", async function () {
      const otherHashedPassword = await bcrypt.hash("123456", 10);
      const otherUser = await User.create({
        username: "othertaskuser",
        email: "othertaskuser@test.com",
        password: otherHashedPassword,
        provider: "local"
      });
      await Task.create({ user: otherUser._id, title: "OtherUserTask" });
      const response = await request(app)
        .get("/api/tasks")
        .set("Cookie", `token=${token}`);
      expect(response.status).to.equal(200);
      const titles = response.body.tasks.map((t) => t.title);
      expect(titles).to.not.include("OtherUserTask");
      await Task.deleteMany({ user: otherUser._id });
      await User.deleteOne({ _id: otherUser._id });
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
    it("should update task completed status", async function () {
      const response = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          completed: true
        });
      expect(response.status).to.equal(200);
      expect(response.body.task.completed).to.equal(true);
    });
    it("should update task to link a note", async function () {
      const response = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          note: note._id.toString()
        });
      expect(response.status).to.equal(200);
      expect(response.body.task.note).to.exist;
    });
    it("should update task to unlink a note (set null)", async function () {
      const response = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          note: null
        });
      expect(response.status).to.equal(200);
      expect(response.body.task.note).to.equal(null);
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
    it("should not allow updating another user's task", async function () {
      const otherHashedPassword = await bcrypt.hash("123456", 10);
      const otherUser = await User.create({
        username: "taskupdateother",
        email: "taskupdateother@test.com",
        password: otherHashedPassword,
        provider: "local"
      });
      const otherTask = await Task.create({
        user: otherUser._id,
        title: "OtherTask"
      });
      const response = await request(app)
        .put(`/api/tasks/${otherTask._id}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({ title: "Hacked" });
      expect(response.status).to.equal(404);
      await Task.deleteOne({ _id: otherTask._id });
      await User.deleteOne({ _id: otherUser._id });
    });
    it("should reject request without CSRF origin", async function () {
      const response = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set("Cookie", `token=${token}`)
        .send({ title: "CSRF Update" });
      expect(response.status).to.equal(403);
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
    it("should toggle task status back to original", async function () {
      const currentTask = await Task.findById(task._id);
      const response = await request(app)
        .patch(`/api/tasks/${task._id}/toggle`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`);
      expect(response.status).to.equal(200);
      expect(response.body.task.completed).to.equal(!currentTask.completed);
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
    it("should reject unauthenticated toggle", async function () {
      const response = await request(app)
        .patch(`/api/tasks/${task._id}/toggle`)
        .set("Origin", "http://localhost:5173");
      expect(response.status).to.equal(401);
    });
    it("should reject toggle without CSRF origin", async function () {
      const response = await request(app)
        .patch(`/api/tasks/${task._id}/toggle`)
        .set("Cookie", `token=${token}`);
      expect(response.status).to.equal(403);
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
    it("should not allow deleting another user's task", async function () {
      const otherHashedPassword = await bcrypt.hash("123456", 10);
      const otherUser = await User.create({
        username: "taskdelother",
        email: "taskdelother@test.com",
        password: otherHashedPassword,
        provider: "local"
      });
      const otherTask = await Task.create({
        user: otherUser._id,
        title: "OtherUserTask"
      });
      const response = await request(app)
        .delete(`/api/tasks/${otherTask._id}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`);
      expect(response.status).to.equal(404);
      await Task.deleteOne({ _id: otherTask._id });
      await User.deleteOne({ _id: otherUser._id });
    });
    it("should reject unauthenticated request", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/tasks/${fakeId}`)
        .set("Origin", "http://localhost:5173");
      expect(response.status).to.equal(401);
    });
    it("should reject delete without CSRF origin", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/tasks/${fakeId}`)
        .set("Cookie", `token=${token}`);
      expect(response.status).to.equal(403);
    });
  });
});
