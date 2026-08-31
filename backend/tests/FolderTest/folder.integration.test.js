import { expect } from "chai";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import app from "../../app.js";
import User from "../../src/models/user.model.js";
import Folder from "../../src/models/folder.model.js";
import Note from "../../src/models/note.model.js";

describe("Folder Integration Tests", function () {
  let user;
  let token;
  let folder;

  before(async function () {
    await mongoose.connect(process.env.MONGO_TEST_URI);

    const password = await bcrypt.hash("123456", 10);

    user = await User.create({
      username: "folderintegration",
      email: "folderintegration@test.com",
      password,
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
      await Note.deleteMany({ user: user._id });
      await Folder.deleteMany({ user: user._id });
      await User.deleteOne({ _id: user._id });
    }
  } finally {
    await mongoose.connection.close();
  }
});
  describe("POST /api/folders", function () {
    it("should create a folder", async function () {
      const response = await request(app)
        .post("/api/folders")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          name: "Work",
          description: "Work files",
          color: "#ff0000"
        });

      expect(response.status).to.equal(201);
      expect(response.body.message).to.equal("Folder created successfully");
      expect(response.body.folder.name).to.equal("Work");
      expect(response.body.folder.description).to.equal("Work files");
      expect(response.body.folder.color).to.equal("#ff0000");
      expect(response.body.folder.notesCount).to.equal(0);

      folder = response.body.folder;
    });

    it("should reject empty folder name", async function () {
      const response = await request(app)
        .post("/api/folders")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          name: "   "
        });

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal("Folder name is required");
    });

    it("should reject duplicate folder", async function () {
      const response = await request(app)
        .post("/api/folders")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          name: "work"
        });

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal(
        "A folder with this name already exists"
      );
    });

    it("should reject unauthenticated request", async function () {
      const response = await request(app)
        .post("/api/folders")
        .set("Origin", "http://localhost:5173")
        .send({
          name: "Unauthorized"
        });

      expect(response.status).to.equal(401);
    });
  });

  describe("GET /api/folders", function () {
    it("should get folders", async function () {
      const response = await request(app)
        .get("/api/folders")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(200);
      expect(response.body.folders).to.be.an("array");
      expect(response.body.folders.length).to.be.greaterThan(0);
      expect(response.body.folders[0].notesCount).to.equal(0);
    });

    it("should reject unauthenticated request", async function () {
      const response = await request(app)
        .get("/api/folders");

      expect(response.status).to.equal(401);
    });
  });

  describe("DELETE /api/folders/:id", function () {
    it("should delete a folder", async function () {
      const response = await request(app)
        .delete(`/api/folders/${folder._id}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal("Folder deleted successfully");

      const deletedFolder = await Folder.findById(folder._id);
      expect(deletedFolder).to.equal(null);
    });

    it("should return 404 for non-existing folder", async function () {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/folders/${fakeId}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(404);
      expect(response.body.message).to.equal("Folder not found");
    });

    it("should reject unauthenticated request", async function () {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/folders/${fakeId}`)
        .set("Origin", "http://localhost:5173");

      expect(response.status).to.equal(401);
    });
  });
});