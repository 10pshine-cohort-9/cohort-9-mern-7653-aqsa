import { expect } from "chai";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import app from "../../app.js";
import User from "../../src/models/user.model.js";
describe("Media Integration Tests", function () {
  let user;
  let token;
  before(async function () {
    await mongoose.connect(process.env.MONGO_TEST_URI);
    const hashedPassword = await bcrypt.hash("123456", 10);
    user = await User.create({
      username: "mediaintegration",
      email: "mediaintegration@test.com",
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
        await User.deleteOne({ _id: user._id });
      }
    } finally {
      await mongoose.connection.close();
    }
  });
  describe("POST /api/media", function () {
    it("should reject unauthenticated request (no token)", async function () {
      const response = await request(app)
        .post("/api/media")
        .set("Origin", "http://localhost:5173");
      expect(response.status).to.equal(401);
      expect(response.body.error).to.equal(
        "Access denied. Please log in."
      );
    });
    it("should reject request without CSRF origin", async function () {
      const response = await request(app)
        .post("/api/media")
        .set("Cookie", `token=${token}`);
      expect(response.status).to.equal(403);
      expect(response.body.message).to.equal("CSRF validation failed");
    });
    it("should reject authenticated request without a file", async function () {
      const response = await request(app)
        .post("/api/media")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`);
      expect([400, 500]).to.include(response.status);
    });
    it("should reject invalid token on media upload", async function () {
      const response = await request(app)
        .post("/api/media")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", "token=badtoken");
      expect(response.status).to.equal(401);
    });
  });
});
