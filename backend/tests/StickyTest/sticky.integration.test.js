import { expect } from "chai";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import http from "http";
import app from "../../app.js";
import User from "../../src/models/user.model.js";
import Sticky from "../../src/models/sticky.model.js";
import { initSocket } from "../../src/config/socket.js";

describe("Sticky Integration Tests", function () {
  let server;
  let user;
  let token;
  let sticky;

  before(async function () {
    await mongoose.connect(process.env.MONGO_URI);

    server = http.createServer(app);
    initSocket(server);

    const hashedPassword = await bcrypt.hash("123456", 10);

    user = await User.create({
      username: "stickyintegration",
      email: "stickyintegration@test.com",
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
    await Sticky.deleteMany({ user: user._id });
    await User.deleteOne({ _id: user._id });
    server.close();
    await mongoose.connection.close();
  });

  describe("POST /api/sticky", function () {
    it("should create a sticky note", async function () {
      const response = await request(app)
        .post("/api/sticky")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          title: "Test Sticky",
          content: "This is a test sticky",
          color: "#ff0000",
          position: {
            x: 100,
            y: 200
          }
        });

      expect(response.status).to.equal(201);
      expect(response.body.message).to.equal("Sticky note created");
      expect(response.body.sticky).to.exist;
      expect(response.body.sticky.title).to.equal("Test Sticky");
      expect(response.body.sticky.content).to.equal("This is a test sticky");
      expect(response.body.sticky.color).to.equal("#ff0000");

      sticky = await Sticky.findOne({
        user: user._id,
        title: "Test Sticky"
      });

      expect(sticky).to.exist;
    });

    it("should reject empty content", async function () {
      const response = await request(app)
        .post("/api/sticky")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          title: "Empty Sticky",
          content: "   "
        });

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal("Note content is required");
    });

    it("should reject unauthenticated request", async function () {
      const response = await request(app)
        .post("/api/sticky")
        .set("Origin", "http://localhost:5173")
        .send({
          title: "Unauthorized Sticky",
          content: "Test content"
        });

      expect(response.status).to.equal(401);
    });

    it("should reject request without CSRF origin", async function () {
      const response = await request(app)
        .post("/api/sticky")
        .set("Cookie", `token=${token}`)
        .send({
          title: "CSRF Sticky",
          content: "Test content"
        });

      expect(response.status).to.equal(403);
      expect(response.body.message).to.equal("CSRF validation failed");
    });
  });

  describe("GET /api/sticky", function () {
    it("should get user sticky notes", async function () {
      const response = await request(app)
        .get("/api/sticky")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(200);
      expect(response.body.stickies).to.be.an("array");
      expect(response.body.stickies.length).to.be.greaterThan(0);
    });

    it("should reject unauthenticated request", async function () {
      const response = await request(app)
        .get("/api/sticky");

      expect(response.status).to.equal(401);
    });
  });

  describe("PUT /api/sticky/:id", function () {
    it("should update a sticky note", async function () {
      const response = await request(app)
        .put(`/api/sticky/${sticky._id}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          title: "Updated Sticky",
          content: "Updated content",
          color: "#00ff00",
          position: {
            x: 300,
            y: 400
          }
        });

      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal("Sticky note updated");
      expect(response.body.sticky.title).to.equal("Updated Sticky");
      expect(response.body.sticky.content).to.equal("Updated content");
      expect(response.body.sticky.color).to.equal("#00ff00");
      expect(response.body.sticky.position.x).to.equal(300);
      expect(response.body.sticky.position.y).to.equal(400);
    });

    it("should return 404 for non-existing sticky", async function () {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/sticky/${fakeId}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          title: "Updated Sticky"
        });

      expect(response.status).to.equal(404);
      expect(response.body.message).to.equal("Sticky note not found");
    });

    it("should reject unauthenticated request", async function () {
      const response = await request(app)
        .put(`/api/sticky/${sticky._id}`)
        .set("Origin", "http://localhost:5173")
        .send({
          title: "Unauthorized Update"
        });

      expect(response.status).to.equal(401);
    });
  });

  describe("DELETE /api/sticky/:id", function () {
    it("should delete a sticky note", async function () {
      const response = await request(app)
        .delete(`/api/sticky/${sticky._id}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal("Sticky note deleted");

      const deletedSticky = await Sticky.findById(sticky._id);
      expect(deletedSticky).to.equal(null);
    });

    it("should return 404 for non-existing sticky", async function () {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/sticky/${fakeId}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(404);
      expect(response.body.message).to.equal("Sticky note not found");
    });

    it("should reject unauthenticated request", async function () {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/sticky/${fakeId}`)
        .set("Origin", "http://localhost:5173");

      expect(response.status).to.equal(401);
    });
  });
});