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
    await mongoose.connect(process.env.MONGO_TEST_URI);
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
    try {
      if (user?._id) {
        await Sticky.deleteMany({ user: user._id });
        await User.deleteOne({ _id: user._id });
      }
    } finally {
      server.close();
      await mongoose.connection.close();
    }
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
    it("should create a sticky with default color when not provided", async function () {
      const response = await request(app)
        .post("/api/sticky")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          content: "Default color sticky"
        });
      expect(response.status).to.equal(201);
      expect(response.body.sticky.color).to.equal("#fef08a");
      await Sticky.deleteOne({ _id: response.body.sticky._id });
    });
    it("should create a sticky with default position when not provided", async function () {
      const response = await request(app)
        .post("/api/sticky")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          content: "Default position sticky"
        });
      expect(response.status).to.equal(201);
      expect(response.body.sticky.position.x).to.equal(0);
      expect(response.body.sticky.position.y).to.equal(0);
      await Sticky.deleteOne({ _id: response.body.sticky._id });
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
    it("should reject missing content", async function () {
      const response = await request(app)
        .post("/api/sticky")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          title: "No Content Sticky"
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
    it("should return stickies belonging only to authenticated user", async function () {
      const otherHashedPassword = await bcrypt.hash("123456", 10);
      const otherUser = await User.create({
        username: "otherstickyuser",
        email: "otherstickyuser@test.com",
        password: otherHashedPassword,
        provider: "local"
      });
      await Sticky.create({
        user: otherUser._id,
        content: "OtherUserSticky"
      });
      const response = await request(app)
        .get("/api/sticky")
        .set("Cookie", `token=${token}`);
      expect(response.status).to.equal(200);
      const contents = response.body.stickies.map((s) => s.content);
      expect(contents).to.not.include("OtherUserSticky");
      await Sticky.deleteMany({ user: otherUser._id });
      await User.deleteOne({ _id: otherUser._id });
    });
    it("should reject unauthenticated request", async function () {
      const response = await request(app)
        .get("/api/sticky");
      expect(response.status).to.equal(401);
    });
  });
  describe("PUT /api/sticky/:id", function () {
    it("should update a sticky note (all fields)", async function () {
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
    it("should update only the title (partial update)", async function () {
      const response = await request(app)
        .put(`/api/sticky/${sticky._id}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          title: "Partially Updated Title"
        });
      expect(response.status).to.equal(200);
      expect(response.body.sticky.title).to.equal("Partially Updated Title");
      expect(response.body.sticky.content).to.equal("Updated content");
    });
    it("should update only the position (partial update)", async function () {
      const response = await request(app)
        .put(`/api/sticky/${sticky._id}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          position: { x: 50, y: 75 }
        });
      expect(response.status).to.equal(200);
      expect(response.body.sticky.position.x).to.equal(50);
      expect(response.body.sticky.position.y).to.equal(75);
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
    it("should not allow updating another user's sticky", async function () {
      const otherHashedPassword = await bcrypt.hash("123456", 10);
      const otherUser = await User.create({
        username: "stickyupdateother",
        email: "stickyupdateother@test.com",
        password: otherHashedPassword,
        provider: "local"
      });
      const otherSticky = await Sticky.create({
        user: otherUser._id,
        content: "OtherSticky"
      });
      const response = await request(app)
        .put(`/api/sticky/${otherSticky._id}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({ title: "Hacked" });
      expect(response.status).to.equal(404);
      await Sticky.deleteOne({ _id: otherSticky._id });
      await User.deleteOne({ _id: otherUser._id });
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
    it("should reject request without CSRF origin", async function () {
      const response = await request(app)
        .put(`/api/sticky/${sticky._id}`)
        .set("Cookie", `token=${token}`)
        .send({ title: "CSRF Update" });
      expect(response.status).to.equal(403);
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
    it("should not allow deleting another user's sticky", async function () {
      const otherHashedPassword = await bcrypt.hash("123456", 10);
      const otherUser = await User.create({
        username: "stickydelother",
        email: "stickydelother@test.com",
        password: otherHashedPassword,
        provider: "local"
      });
      const otherSticky = await Sticky.create({
        user: otherUser._id,
        content: "OtherStickyToDelete"
      });
      const response = await request(app)
        .delete(`/api/sticky/${otherSticky._id}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`);
      expect(response.status).to.equal(404);
      await Sticky.deleteOne({ _id: otherSticky._id });
      await User.deleteOne({ _id: otherUser._id });
    });
    it("should reject unauthenticated request", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/sticky/${fakeId}`)
        .set("Origin", "http://localhost:5173");
      expect(response.status).to.equal(401);
    });
    it("should reject request without CSRF origin", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/sticky/${fakeId}`)
        .set("Cookie", `token=${token}`);
      expect(response.status).to.equal(403);
    });
  });
});
