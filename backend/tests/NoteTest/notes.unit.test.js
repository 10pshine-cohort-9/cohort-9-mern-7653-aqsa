import { expect } from "chai";
import sinon from "sinon";
import mongoose from "mongoose";
import NoteModel from "../../src/models/note.model.js";
import CategoryModel from "../../src/models/category.model.js";
import FolderModel from "../../src/models/folder.model.js";
import {
  createNote,
  getNote,
  deleteNote,
  toggleFavorite,
  addPage,
} from "../../src/controller/noteController.js";

function mockRes() {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
}
function mockReq(overrides = {}) {
  return { body: {}, params: {}, query: {}, user: { _id: "user123" }, ...overrides };
}

// Build a chainable populate stub that resolves to `result`
const makePopulateChain = (result) => ({
  populate: () => ({
    populate: () => Promise.resolve(result),
    then: (resolve) => Promise.resolve(result).then(resolve),
  }),
  then: (resolve) => Promise.resolve(result).then(resolve),
  catch: (reject) => Promise.resolve(result).catch(reject),
  session: () => makePopulateChain(result),
});

describe("Note Controller – Unit Tests", function () {
  beforeEach(function () {
    // Stub model static methods before each test
    sinon.stub(NoteModel, "create");
    sinon.stub(NoteModel, "findById").callsFake(() => makePopulateChain(null));
    sinon.stub(NoteModel, "findOne").callsFake(() => makePopulateChain(null));
    sinon.stub(NoteModel, "countDocuments");
    sinon.stub(CategoryModel, "countDocuments");
    sinon.stub(FolderModel, "exists");
  });

  afterEach(function () {
    sinon.restore();
  });

  // ─── createNote ───────────────────────────────────────────────────────────
  describe("createNote", function () {
    it("should return 201 with populated note on success", async function () {
      const fakeNote = { _id: "n1", title: "My Note" };
      NoteModel.create.resolves(fakeNote);
      NoteModel.findById.callsFake(() => makePopulateChain(fakeNote));

      const req = mockReq({ body: { title: "My Note" } });
      const res = mockRes();
      await createNote(req, res);

      expect(res.status.calledWith(201)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Note created successfully");
    });

    it("should default title to 'Untitled Note' when not provided", async function () {
      const fakeNote = { _id: "n1", title: "Untitled Note" };
      NoteModel.create.resolves(fakeNote);
      NoteModel.findById.callsFake(() => makePopulateChain(fakeNote));

      const req = mockReq({ body: {} });
      const res = mockRes();
      await createNote(req, res);

      const createArgs = NoteModel.create.firstCall.args[0];
      expect(createArgs.title).to.equal("Untitled Note");
    });

    it("should return 400 when categories are invalid", async function () {
      CategoryModel.countDocuments.resolves(1); // only 1 found but 2 sent

      const req = mockReq({ body: { categories: ["cat1", "cat2"] } });
      const res = mockRes();
      await createNote(req, res);

      expect(res.status.calledWith(400)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("One or more categories are invalid");
    });

    it("should return 400 when folder does not exist", async function () {
      FolderModel.exists.resolves(null);

      const req = mockReq({ body: { folder: "folderId" } });
      const res = mockRes();
      await createNote(req, res);

      expect(res.status.calledWith(400)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Invalid folder");
    });

    it("should proceed without validating folder when folder is null", async function () {
      const fakeNote = { _id: "n1", title: "No Folder Note" };
      NoteModel.create.resolves(fakeNote);
      NoteModel.findById.callsFake(() => makePopulateChain(fakeNote));

      const req = mockReq({ body: { title: "No Folder Note", folder: null } });
      const res = mockRes();
      await createNote(req, res);

      expect(FolderModel.exists.called).to.equal(false);
      expect(res.status.calledWith(201)).to.equal(true);
    });

    it("should return 500 when DB throws", async function () {
      NoteModel.create.rejects(new Error("DB error"));

      const req = mockReq({ body: { title: "Note" } });
      const res = mockRes();
      await createNote(req, res);

      expect(res.status.calledWith(500)).to.equal(true);
    });
  });

  // ─── getNote ──────────────────────────────────────────────────────────────
  describe("getNote", function () {
    it("should return 200 with note when found", async function () {
      const fakeNote = { _id: "n1", title: "My Note" };
      NoteModel.findOne.callsFake(() => makePopulateChain(fakeNote));

      const req = mockReq({ params: { id: "n1" } });
      const res = mockRes();
      await getNote(req, res);

      expect(res.status.calledWith(200)).to.equal(true);
      expect(res.json.firstCall.args[0].note).to.deep.equal(fakeNote);
    });

    it("should return 404 when note not found", async function () {
      NoteModel.findOne.callsFake(() => makePopulateChain(null));

      const req = mockReq({ params: { id: "nonexistent" } });
      const res = mockRes();
      await getNote(req, res);

      expect(res.status.calledWith(404)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Note not found");
    });

    it("should return 500 when DB throws", async function () {
      NoteModel.findOne.throws(new Error("DB error"));

      const req = mockReq({ params: { id: "n1" } });
      const res = mockRes();
      await getNote(req, res);

      expect(res.status.calledWith(500)).to.equal(true);
    });
  });

  // ─── deleteNote ───────────────────────────────────────────────────────────
  // Production deleteNote uses mongoose.startSession + withTransaction.
  // We stub mongoose.startSession to return a fake session.
  describe("deleteNote", function () {
    let fakeSession;

    beforeEach(function () {
      fakeSession = { endSession: sinon.stub().resolves() };
    });

    it("should return 404 when note not found", async function () {
      fakeSession.withTransaction = sinon.stub().callsFake(async (fn) => {
        NoteModel.findOne.callsFake(() => ({ session: () => Promise.resolve(null) }));
        await fn();
      });
      sinon.stub(mongoose, "startSession").resolves(fakeSession);

      const req = mockReq({ params: { id: "nonexistent" } });
      const res = mockRes();
      await deleteNote(req, res);

      expect(res.status.calledWith(404)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Note not found");
    });

    it("should return 200 on successful delete", async function () {
      const fakeNote = { _id: "n1", pages: [], deleteOne: sinon.stub().resolves() };
      const TaskModel = (await import("../../src/models/task.model.js")).default;
      if (!TaskModel.updateMany.restore) sinon.stub(TaskModel, "updateMany").resolves();

      fakeSession.withTransaction = sinon.stub().callsFake(async (fn) => {
        NoteModel.findOne.callsFake(() => ({ session: () => Promise.resolve(fakeNote) }));
        await fn();
      });
      sinon.stub(mongoose, "startSession").resolves(fakeSession);

      const req = mockReq({ params: { id: "n1" } });
      const res = mockRes();
      await deleteNote(req, res);

      expect(res.status.calledWith(200)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Note and its media deleted successfully");
    });

    it("should return 500 when DB throws", async function () {
      fakeSession.withTransaction = sinon.stub().rejects(new Error("DB error"));
      sinon.stub(mongoose, "startSession").resolves(fakeSession);

      const req = mockReq({ params: { id: "n1" } });
      const res = mockRes();
      await deleteNote(req, res);

      expect(res.status.calledWith(500)).to.equal(true);
    });
  });

  // ─── toggleFavorite ───────────────────────────────────────────────────────
  describe("toggleFavorite", function () {
    it("should return message 'Note added to favorites' when isFavorite becomes true", async function () {
      const note = { _id: "n1", isFavorite: false, save: sinon.stub().resolves() };
      NoteModel.findOne.callsFake(() => makePopulateChain(note));

      const req = mockReq({ params: { id: "n1" } });
      const res = mockRes();
      await toggleFavorite(req, res);

      const body = res.json.firstCall.args[0];
      expect(body.message).to.equal("Note added to favorites");
      expect(note.isFavorite).to.equal(true);
    });

    it("should return message 'Note removed from favorites' when isFavorite becomes false", async function () {
      const note = { _id: "n1", isFavorite: true, save: sinon.stub().resolves() };
      NoteModel.findOne.callsFake(() => makePopulateChain(note));

      const req = mockReq({ params: { id: "n1" } });
      const res = mockRes();
      await toggleFavorite(req, res);

      const body = res.json.firstCall.args[0];
      expect(body.message).to.equal("Note removed from favorites");
      expect(note.isFavorite).to.equal(false);
    });

    it("should return 404 when note not found", async function () {
      NoteModel.findOne.callsFake(() => makePopulateChain(null));

      const req = mockReq({ params: { id: "nonexistent" } });
      const res = mockRes();
      await toggleFavorite(req, res);

      expect(res.status.calledWith(404)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Note not found");
    });

    it("should return 500 when DB throws", async function () {
      NoteModel.findOne.throws(new Error("DB error"));

      const req = mockReq({ params: { id: "n1" } });
      const res = mockRes();
      await toggleFavorite(req, res);

      expect(res.status.calledWith(500)).to.equal(true);
    });
  });

  // ─── addPage ──────────────────────────────────────────────────────────────
  describe("addPage", function () {
    it("should return 201 with the new page using default A4 dimensions", async function () {
      const note = { _id: "n1", pages: [], save: sinon.stub().resolves() };
      NoteModel.findOne.callsFake(() => makePopulateChain(note));

      const req = mockReq({ params: { id: "n1" }, body: {} });
      const res = mockRes();
      await addPage(req, res);

      expect(res.status.calledWith(201)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Page added successfully");
      expect(note.pages[0].width).to.equal(794);
      expect(note.pages[0].height).to.equal(1123);
      expect(note.pages[0].sizePreset).to.equal("A4");
      expect(note.pages[0].orientation).to.equal("portrait");
    });

    it("should use custom dimensions when provided", async function () {
      const note = { _id: "n1", pages: [], save: sinon.stub().resolves() };
      NoteModel.findOne.callsFake(() => makePopulateChain(note));

      const req = mockReq({
        params: { id: "n1" },
        body: { width: 1000, height: 800, sizePreset: "Custom", orientation: "landscape" },
      });
      const res = mockRes();
      await addPage(req, res);

      expect(note.pages[0].width).to.equal(1000);
      expect(note.pages[0].height).to.equal(800);
      expect(note.pages[0].orientation).to.equal("landscape");
    });

    it("should return 404 when note not found", async function () {
      NoteModel.findOne.callsFake(() => makePopulateChain(null));

      const req = mockReq({ params: { id: "nonexistent" }, body: {} });
      const res = mockRes();
      await addPage(req, res);

      expect(res.status.calledWith(404)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Note not found");
    });

    it("should return 500 when DB throws", async function () {
      NoteModel.findOne.throws(new Error("DB error"));

      const req = mockReq({ params: { id: "n1" }, body: {} });
      const res = mockRes();
      await addPage(req, res);

      expect(res.status.calledWith(500)).to.equal(true);
    });
  });
});
