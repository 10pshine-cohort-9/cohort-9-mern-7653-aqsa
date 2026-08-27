import { expect } from "chai";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import app from "../../app.js";
import User from "../../src/models/user.model.js";
import Category from "../../src/models/category.model.js";

describe("Category Integration Tests", function () {
  let user;
  let token;
  let category;

  before(async function () {
    await mongoose.connect(process.env.MONGO_URI);

    const hashedPassword = await bcrypt.hash("123456", 10);

    user = await User.create({
      username: "categoryintegration",
      email: "categoryintegration@test.com",
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
    await Category.deleteMany({ user: user._id });
    await User.deleteOne({ _id: user._id });
    await mongoose.connection.close();
  });

  describe("POST /api/categories", function () {
    it("should create a category", async function () {
      const response = await request(app)
        .post("/api/categories")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          name: "Work"
        });

      expect(response.status).to.equal(201);
      expect(response.body.message).to.equal("Category created successfully");
      expect(response.body.category).to.exist;
      expect(response.body.category.name).to.equal("Work");

      category = response.body.category;
    });

    it("should reject empty category name", async function () {
      const response = await request(app)
        .post("/api/categories")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          name: "   "
        });

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal("Category name is required");
    });

    it("should return existing category", async function () {
      const response = await request(app)
        .post("/api/categories")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          name: "work"
        });

      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal("Category already exists");
      expect(response.body.category.name).to.equal("Work");
    });

    it("should reject unauthenticated request", async function () {
      const response = await request(app)
        .post("/api/categories")
        .set("Origin", "http://localhost:5173")
        .send({
          name: "Unauthorized"
        });

      expect(response.status).to.equal(401);
    });

    it("should reject request without CSRF origin", async function () {
      const response = await request(app)
        .post("/api/categories")
        .set("Cookie", `token=${token}`)
        .send({
          name: "CSRF Category"
        });

      expect(response.status).to.equal(403);
      expect(response.body.message).to.equal("CSRF validation failed");
    });
  });

  describe("GET /api/categories", function () {
    it("should get categories", async function () {
      const response = await request(app)
        .get("/api/categories")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(200);
      expect(response.body.categories).to.be.an("array");
      expect(response.body.categories.length).to.be.greaterThan(0);
    });

    it("should reject unauthenticated request", async function () {
      const response = await request(app)
        .get("/api/categories");

      expect(response.status).to.equal(401);
    });
  });

  describe("DELETE /api/categories/:id", function () {
    it("should delete a category", async function () {
      const response = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal("Category deleted successfully");

      const deletedCategory = await Category.findById(category._id);
      expect(deletedCategory).to.equal(null);
    });

    it("should return 404 for non-existing category", async function () {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/categories/${fakeId}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(404);
      expect(response.body.message).to.equal("Category not found");
    });

    it("should reject unauthenticated request", async function () {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/categories/${fakeId}`)
        .set("Origin", "http://localhost:5173");

      expect(response.status).to.equal(401);
    });
  });
});