import { expect } from "chai";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import app from "../../app.js";
import User from "../../src/models/user.model.js";
import Note from "../../src/models/note.model.js";
import Category from "../../src/models/category.model.js";
import Folder from "../../src/models/folder.model.js";
import Task from "../../src/models/task.model.js";

describe("Note Integration Tests", function () {
  let user;
  let token;
  let note;
  let pageId;
  let category;
  let folder;

  before(async function () {
    await mongoose.connect(process.env.MONGO_TEST_URI);

    const hashedPassword = await bcrypt.hash("123456", 10);

    user = await User.create({
      username: "noteintegration",
      email: "noteintegration@test.com",
      password: hashedPassword,
      provider: "local",
    });

    token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    category = await Category.create({
      user: user._id,
      name: "Test Category",
    });

    folder = await Folder.create({
      user: user._id,
      name: "Test Folder",
      color: "#ffffff",
    });
  });

after(async function () {
  try {
    if (user?._id) {
      await Task.deleteMany({ user: user._id });
      await Note.deleteMany({ user: user._id });
      await Category.deleteMany({ user: user._id });
      await Folder.deleteMany({ user: user._id });
      await User.deleteOne({ _id: user._id });
    }
  } finally {
    await mongoose.connection.close();
  }
});
  describe("POST /api/notes", function () {
    it("should create a note", async function () {
      const response = await request(app)
        .post("/api/notes")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          title: "Test Note",
          categories: [category._id.toString()],
          folder: folder._id.toString(),
          pages: [
            {
              width: 794,
              height: 1123,
              sizePreset: "A4",
              orientation: "portrait",
              background: {
                type: "color",
                value: "#ffffff",
              },
              objects: [],
            },
          ],
        });

      expect(response.status).to.equal(201);
      expect(response.body.message).to.equal("Note created successfully");
      expect(response.body.note).to.exist;
      expect(response.body.note.title).to.equal("Test Note");

      note = await Note.findById(response.body.note._id);
      pageId = note.pages[0]._id.toString();

      expect(note).to.exist;
      expect(note.pages).to.have.length(1);
    });

    it("should reject invalid category", async function () {
      const response = await request(app)
        .post("/api/notes")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          title: "Invalid Category Note",
          categories: [new mongoose.Types.ObjectId().toString()],
        });

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal(
        "One or more categories are invalid"
      );
    });

    it("should reject invalid folder", async function () {
      const response = await request(app)
        .post("/api/notes")
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          title: "Invalid Folder Note",
          folder: new mongoose.Types.ObjectId().toString(),
        });

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal("Invalid folder");
    });

    it("should reject unauthenticated request", async function () {
      const response = await request(app)
        .post("/api/notes")
        .set("Origin", "http://localhost:5173")
        .send({
          title: "Unauthorized Note",
        });

      expect(response.status).to.equal(401);
    });

    it("should reject request without CSRF origin", async function () {
      const response = await request(app)
        .post("/api/notes")
        .set("Cookie", `token=${token}`)
        .send({
          title: "CSRF Note",
        });

      expect(response.status).to.equal(403);
      expect(response.body.message).to.equal("CSRF validation failed");
    });
  });

  describe("GET /api/notes", function () {
    it("should get notes", async function () {
      const response = await request(app)
        .get("/api/notes")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(200);
      expect(response.body.notes).to.be.an("array");
      expect(response.body.notes.length).to.be.greaterThan(0);
      expect(response.body.pagination).to.exist;
    });

    it("should search notes", async function () {
      const response = await request(app)
        .get("/api/notes?search=Test%20Note")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(200);
      expect(response.body.notes).to.be.an("array");
      expect(response.body.notes.length).to.be.greaterThan(0);
    });

    it("should filter by category", async function () {
      const response = await request(app)
        .get(`/api/notes?category=${category._id}`)
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(200);
      expect(response.body.notes).to.be.an("array");
      expect(response.body.notes.length).to.be.greaterThan(0);
    });

    it("should filter by folder", async function () {
      const response = await request(app)
        .get(`/api/notes?folder=${folder._id}`)
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(200);
      expect(response.body.notes).to.be.an("array");
      expect(response.body.notes.length).to.be.greaterThan(0);
    });

    it("should reject unauthenticated request", async function () {
      const response = await request(app)
        .get("/api/notes");

      expect(response.status).to.equal(401);
    });
  });

  describe("GET /api/notes/:id", function () {
    it("should get a single note", async function () {
      const response = await request(app)
        .get(`/api/notes/${note._id}`)
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(200);
      expect(response.body.note).to.exist;
      expect(response.body.note._id).to.equal(note._id.toString());
      expect(response.body.note.title).to.equal("Test Note");
    });

    it("should return 404 for non-existing note", async function () {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/notes/${fakeId}`)
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(404);
      expect(response.body.message).to.equal("Note not found");
    });
  });

  describe("PUT /api/notes/:id", function () {
    it("should update a note", async function () {
      const response = await request(app)
        .put(`/api/notes/${note._id}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          title: "Updated Note",
          categories: [category._id.toString()],
          folder: folder._id.toString(),
        });

      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal("Note updated successfully");
      expect(response.body.note.title).to.equal("Updated Note");
    });

    it("should return 404 for non-existing note", async function () {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/notes/${fakeId}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          title: "Updated",
        });

      expect(response.status).to.equal(404);
      expect(response.body.message).to.equal("Note not found");
    });
  });

  describe("PATCH /api/notes/:id/favorite", function () {
    it("should toggle favorite", async function () {
      const response = await request(app)
        .patch(`/api/notes/${note._id}/favorite`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(200);
      expect(response.body.isFavorite).to.equal(true);
      expect(response.body.message).to.equal("Note added to favorites");
    });

    it("should toggle favorite back", async function () {
      const response = await request(app)
        .patch(`/api/notes/${note._id}/favorite`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(200);
      expect(response.body.isFavorite).to.equal(false);
      expect(response.body.message).to.equal("Note removed from favorites");
    });
  });

  describe("POST /api/notes/:id/pages", function () {
    it("should add a page", async function () {
      const response = await request(app)
        .post(`/api/notes/${note._id}/pages`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          width: 800,
          height: 1000,
          sizePreset: "A4",
          orientation: "landscape",
          background: {
            type: "color",
            value: "#eeeeee",
          },
          objects: [
            {
              type: "text",
              content: "Test object",
              x: 10,
              y: 20,
            },
          ],
        });

      expect(response.status).to.equal(201);
      expect(response.body.message).to.equal("Page added successfully");
      expect(response.body.page).to.exist;
      expect(response.body.page.width).to.equal(800);
      expect(response.body.page.orientation).to.equal("landscape");
    });

    it("should return 404 for non-existing note", async function () {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/notes/${fakeId}/pages`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          objects: [],
        });

      expect(response.status).to.equal(404);
      expect(response.body.message).to.equal("Note not found");
    });
  });

  describe("PUT /api/notes/:id/pages/:pageId", function () {
    it("should update a page", async function () {
      const updatedNote = await Note.findById(note._id);
      const secondPageId = updatedNote.pages[1]._id.toString();

      const response = await request(app)
        .put(`/api/notes/${note._id}/pages/${secondPageId}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          width: 900,
          height: 1100,
          orientation: "portrait",
          objects: [
            {
              type: "text",
              content: "Updated object",
            },
          ],
        });

      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal("Page updated successfully");
      expect(response.body.page.width).to.equal(900);
      expect(response.body.page.height).to.equal(1100);
      expect(response.body.page.objects[0].content).to.equal("Updated object");
    });

    it("should return 404 for non-existing page", async function () {
      const fakePageId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/notes/${note._id}/pages/${fakePageId}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`)
        .send({
          width: 900,
        });

      expect(response.status).to.equal(404);
      expect(response.body.message).to.equal("Page not found");
    });
  });

  describe("DELETE /api/notes/:id/pages/:pageId", function () {
    it("should delete a page", async function () {
      const currentNote = await Note.findById(note._id);
      const pageToDelete = currentNote.pages[1]._id.toString();

      const response = await request(app)
        .delete(`/api/notes/${note._id}/pages/${pageToDelete}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal("Page deleted successfully");
    });

    it("should return 404 for non-existing page", async function () {
      const fakePageId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/notes/${note._id}/pages/${fakePageId}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(404);
      expect(response.body.message).to.equal("Page not found");
    });
  });

  describe("DELETE /api/notes/:id", function () {
    it("should delete a note and unlink it from tasks", async function () {
      const task = await Task.create({
        user: user._id,
        title: "Test Task",
        note: note._id,
      });

      const response = await request(app)
        .delete(`/api/notes/${note._id}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal(
        "Note and its media deleted successfully"
      );

      const deletedNote = await Note.findById(note._id);
      expect(deletedNote).to.equal(null);

      const updatedTask = await Task.findById(task._id);
      expect(updatedTask).to.exist;
      expect(updatedTask.note).to.equal(null);
    });

    it("should return 404 for non-existing note", async function () {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/notes/${fakeId}`)
        .set("Origin", "http://localhost:5173")
        .set("Cookie", `token=${token}`);

      expect(response.status).to.equal(404);
      expect(response.body.message).to.equal("Note not found");
    });

    it("should reject unauthenticated request", async function () {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/notes/${fakeId}`)
        .set("Origin", "http://localhost:5173");

      expect(response.status).to.equal(401);
    });
  });
});