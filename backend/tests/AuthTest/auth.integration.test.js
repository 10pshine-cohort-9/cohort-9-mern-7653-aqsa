import { expect } from "chai";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import http from "http";
import app from "../../app.js";
import User from "../../src/models/user.model.js";
import { initSocket } from "../../src/config/socket.js";
describe("Auth Integration Tests", function () {
  let server;
  let user;
  let token;
  before(async function () {
    await mongoose.connect(process.env.MONGO_TEST_URI);
    server = http.createServer(app);
    initSocket(server);
    await User.deleteOne({ username: "authintegration" });
    await User.deleteOne({ email: "newauthuser@test.com" });
    const hashedPassword = await bcrypt.hash("123456", 10);
    user = await User.create({
      username: "authintegration",
      email: "authintegration@test.com",
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
      server.close();
    }
  });
  describe("POST /api/auth/register", function () {
    it("should register a new user", async function () {
      const response = await request(app)
        .post("/api/auth/register")
        .set("Origin", "http://localhost:5173")
        .send({
          username: "newauthuser",
          email: "newauthuser@test.com",
          password: "123456"
        });
      expect(response.status).to.equal(201);
      expect(response.body.success).to.equal(true);
      expect(response.body.message).to.equal(
        "User registered successfully"
      );
      expect(response.body.user.username).to.equal("newauthuser");
      expect(response.body.user.email).to.equal(
        "newauthuser@test.com"
      );
      expect(response.headers["set-cookie"]).to.exist;
      await User.deleteOne({
        email: "newauthuser@test.com"
      });
    });
    it("should reject invalid registration data", async function () {
      const response = await request(app)
        .post("/api/auth/register")
        .set("Origin", "http://localhost:5173")
        .send({
          username: "a",
          email: "invalid",
          password: "123"
        });
      expect(response.status).to.equal(400);
      expect(response.body.success).to.equal(false);
    });
    it("should reject duplicate email", async function () {
      const response = await request(app)
        .post("/api/auth/register")
        .set("Origin", "http://localhost:5173")
        .send({
          username: "anotheruser",
          email: "authintegration@test.com",
          password: "123456"
        });
      expect(response.status).to.equal(400);
      expect(response.body.success).to.equal(false);
      expect(response.body.error).to.equal(
        "Email already exists"
      );
    });
    it("should reject duplicate username", async function () {
      const response = await request(app)
        .post("/api/auth/register")
        .set("Origin", "http://localhost:5173")
        .send({
          username: "authintegration",
          email: "uniqueemail@test.com",
          password: "123456"
        });
      expect(response.status).to.equal(400);
      expect(response.body.success).to.equal(false);
      expect(response.body.error).to.equal(
        "Username already exists"
      );
    });
    it("should reject request without CSRF origin", async function () {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "csrfuser",
          email: "csrfuser@test.com",
          password: "123456"
        });
      expect(response.status).to.equal(403);
      expect(response.body.success).to.equal(false);
      expect(response.body.message).to.equal(
        "CSRF validation failed"
      );
    });
    it("should reject registration with missing fields", async function () {
      const response = await request(app)
        .post("/api/auth/register")
        .set("Origin", "http://localhost:5173")
        .send({
          username: "onlyusername"
        });
      expect(response.status).to.equal(400);
      expect(response.body.success).to.equal(false);
    });
  });
  describe("POST /api/auth/login", function () {
    it("should login successfully", async function () {
      const response = await request(app)
        .post("/api/auth/login")
        .set("Origin", "http://localhost:5173")
        .send({
          email: "authintegration@test.com",
          password: "123456"
        });
      expect(response.status).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.message).to.equal(
        "User logged in successfully"
      );
      expect(response.body.user.email).to.equal(
        "authintegration@test.com"
      );
      expect(response.headers["set-cookie"]).to.exist;
    });
    it("should reject invalid credentials", async function () {
      const response = await request(app)
        .post("/api/auth/login")
        .set("Origin", "http://localhost:5173")
        .send({
          email: "authintegration@test.com",
          password: "wrongpassword"
        });
      expect(response.status).to.equal(400);
      expect(response.body.success).to.equal(false);
      expect(response.body.error).to.equal(
        "Invalid email or password"
      );
    });
    it("should reject invalid login data", async function () {
      const response = await request(app)
        .post("/api/auth/login")
        .set("Origin", "http://localhost:5173")
        .send({
          email: "invalid",
          password: "123"
        });
      expect(response.status).to.equal(400);
      expect(response.body.success).to.equal(false);
    });
    it("should reject non-existent email", async function () {
      const response = await request(app)
        .post("/api/auth/login")
        .set("Origin", "http://localhost:5173")
        .send({
          email: "doesnotexist@test.com",
          password: "123456"
        });
      expect(response.status).to.equal(400);
      expect(response.body.success).to.equal(false);
      expect(response.body.error).to.equal(
        "Invalid email or password"
      );
    });
    it("should reject request without CSRF origin", async function () {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "authintegration@test.com",
          password: "123456"
        });
      expect(response.status).to.equal(403);
      expect(response.body.success).to.equal(false);
    });
  });
  describe("GET /api/auth/profile", function () {
    it("should return authenticated user", async function () {
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Cookie", `token=${token}`);
      expect(response.status).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.user.email).to.equal(
        "authintegration@test.com"
      );
    });
    it("should return user id and username in profile", async function () {
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Cookie", `token=${token}`);
      expect(response.status).to.equal(200);
      expect(response.body.user).to.have.property("_id");
      expect(response.body.user).to.have.property("username");
    });
    it("should reject unauthenticated request", async function () {
      const response = await request(app)
        .get("/api/auth/profile");
      expect(response.status).to.equal(401);
      expect(response.body.success).to.equal(false);
      expect(response.body.error).to.equal(
        "Access denied. Please log in."
      );
    });
    it("should reject invalid token", async function () {
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Cookie", "token=invalidtoken");
      expect(response.status).to.equal(401);
      expect(response.body.success).to.equal(false);
      expect(response.body.error).to.equal(
        "Invalid or expired token"
      );
    });
    it("should reject expired token", async function () {
      const expiredToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1ms" }
      );
      await new Promise((resolve) => setTimeout(resolve, 10));
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Cookie", `token=${expiredToken}`);
      expect(response.status).to.equal(401);
      expect(response.body.success).to.equal(false);
    });
  });
  describe("POST /api/auth/forgot-password", function () {
    it("should return the same response for an unknown email", async function () {
      const response = await request(app)
        .post("/api/auth/forgot-password")
        .set("Origin", "http://localhost:5173")
        .send({
          email: "unknown@test.com"
        });
      expect(response.status).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.message).to.equal(
        "If an account with that email exists, a password reset otp has been sent."
      );
    });
    it("should return the same response for an existing email", async function () {
      const response = await request(app)
        .post("/api/auth/forgot-password")
        .set("Origin", "http://localhost:5173")
        .send({
          email: user.email
        });
      expect(response.status).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.message).to.equal(
        "If an account with that email exists, a password reset otp has been sent."
      );
    });
  });
  describe("POST /api/auth/reset-password", function () {
    it("should reject invalid OTP", async function () {
      const response = await request(app)
        .post("/api/auth/reset-password")
        .set("Origin", "http://localhost:5173")
        .send({
          email: user.email,
          otp: "000000",
          password: "newpassword"
        });
      expect(response.status).to.equal(400);
      expect(response.body.success).to.equal(false);
      expect(response.body.error).to.equal(
        "Invalid or expired OTP"
      );
    });
    it("should reject reset-password for unknown email with invalid OTP", async function () {
      const response = await request(app)
        .post("/api/auth/reset-password")
        .set("Origin", "http://localhost:5173")
        .send({
          email: "nobody@test.com",
          otp: "999999",
          password: "newpassword"
        });
      expect([400, 429]).to.include(response.status);
      expect(response.body.success).to.equal(false);
    });
  });
  describe("POST /api/auth/logout", function () {
    it("should logout successfully", async function () {
      const response = await request(app)
        .post("/api/auth/logout")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`);
      expect(response.status).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.message).to.equal(
        "Logged out successfully"
      );
    });
    it("should clear cookie on logout", async function () {
      const response = await request(app)
        .post("/api/auth/logout")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`);
      expect(response.status).to.equal(200);
      const cookies = response.headers["set-cookie"];
      expect(cookies).to.exist;
      const tokenCookie = cookies.find((c) => c.startsWith("token="));
      expect(tokenCookie).to.exist;
    });
    it("should reject unauthenticated logout", async function () {
      const response = await request(app)
        .post("/api/auth/logout")
        .set("Origin", "http://localhost:5173");
      expect(response.status).to.equal(401);
      expect(response.body.success).to.equal(false);
    });
  });
});
