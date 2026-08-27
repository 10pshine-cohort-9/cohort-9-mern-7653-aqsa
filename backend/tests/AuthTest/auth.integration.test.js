import { expect } from "chai";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import app from "../../app.js";
import User from "../../src/models/user.model.js";

describe("Auth Integration Tests", function () {
  let user;
  let token;

  before(async function () {
    await mongoose.connect(process.env.MONGO_URI);

    const hashedPassword = await bcrypt.hash("123456", 10);

    user = await User.create({
      username: "integrationtest",
      email: "integration@test.com",
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
    await User.deleteOne({ email: "integration@test.com" });
    await User.deleteOne({ email: "newintegration@test.com" });
    await mongoose.connection.close();
  });

  describe("POST /api/auth/register", function () {
    it("should register a user", async function () {
      const response = await request(app)
        .post("/api/auth/register")
        .set("Origin", "http://localhost:5173")
        .send({
          username: "newintegration",
          email: "newintegration@test.com",
          password: "123456"
        });

      expect(response.status).to.equal(201);
      expect(response.body.success).to.equal(true);
      expect(response.body.message).to.equal(
        "User registered successfully"
      );
      expect(response.headers["set-cookie"]).to.exist;
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

    it("should reject registration without CSRF origin", async function () {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "csrfuser",
          email: "csrf@test.com",
          password: "123456"
        });

      expect(response.status).to.equal(403);
      expect(response.body.success).to.equal(false);
      expect(response.body.message).to.equal(
        "CSRF validation failed"
      );
    });
  });

  describe("POST /api/auth/login", function () {
    it("should login successfully", async function () {
      const response = await request(app)
        .post("/api/auth/login")
        .set("Origin", "http://localhost:5173")
        .send({
          email: "integration@test.com",
          password: "123456"
        });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.message).to.equal(
        "User logged in successfully"
      );
      expect(response.headers["set-cookie"]).to.exist;
    });

    it("should reject invalid credentials", async function () {
      const response = await request(app)
        .post("/api/auth/login")
        .set("Origin", "http://localhost:5173")
        .send({
          email: "integration@test.com",
          password: "wrongpassword"
        });

      expect(response.status).to.equal(400);
      expect(response.body.success).to.equal(false);
      expect(response.body.error).to.equal(
        "Invalid email or password"
      );
    });
  });

  describe("GET /api/auth/profile", function () {
    it("should return authenticated user profile", async function () {
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.user.email).to.equal(
        "integration@test.com"
      );
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
  });

  describe("POST /api/auth/forgot-password", function () {
    it("should return error for unknown user", async function () {
      const response = await request(app)
        .post("/api/auth/forgot-password")
        .set("Origin", "http://localhost:5173")
        .send({
          email: "unknown@test.com"
        });

      expect(response.status).to.equal(404);
      expect(response.body.success).to.equal(false);
      expect(response.body.error).to.equal("User not found");
    });
  });

  describe("POST /api/auth/reset-password", function () {
    it("should reject invalid OTP", async function () {
      const response = await request(app)
        .post("/api/auth/reset-password")
        .set("Origin", "http://localhost:5173")
        .send({
          email: "integration@test.com",
          otp: "000000",
          password: "newpassword"
        });

      expect(response.status).to.equal(400);
      expect(response.body.success).to.equal(false);
      expect(response.body.error).to.equal(
        "Invalid or expired OTP"
      );
    });
  });

  describe("POST /api/auth/logout", function () {
    it("should logout authenticated user", async function () {
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

    it("should reject unauthenticated logout", async function () {
      const response = await request(app)
        .post("/api/auth/logout")
        .set("Origin", "http://localhost:5173");

      expect(response.status).to.equal(401);
      expect(response.body.success).to.equal(false);
    });
  });
});