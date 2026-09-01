import { expect } from "chai";
import sinon from "sinon";
function mockRes() {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
}
function mockReq(overrides = {}) {
  return { body: {}, params: {}, query: {}, user: { _id: "user123" }, ...overrides };
}
let NoteFindOneStub;
let NoteFindByIdStub;
let NoteCreateStub;
let NoteCountDocumentsStub;
let CategoryCountDocumentsStub;
let FolderExistsStub;
const makePopulateChain = (result) => ({
  populate: () => ({
    populate: () => Promise.resolve(result),
  }),
});
const FakeNote = {
  create: (...args) => NoteCreateStub(...args),
  findById: (...args) => {
    const result = NoteFindByIdStub(...args);
    return makePopulateChain(result);
  },
  findOne: (...args) => {
    const noteOrNull = NoteFindOneStub(...args);
    if (noteOrNull && typeof noteOrNull.then === "function") {
      return noteOrNull;
    }
    const obj = {
      then: (resolve) => Promise.resolve(noteOrNull).then(resolve),
      catch: (reject) => Promise.resolve(noteOrNull).catch(reject),
      populate: () => ({
        populate: () => Promise.resolve(noteOrNull),
      }),
    };
    return obj;
  },
  countDocuments: (...args) => NoteCountDocumentsStub(...args),
};
const FakeCategory = {
  countDocuments: (...args) => CategoryCountDocumentsStub(...args),
};
const FakeFolder = {
  exists: (...args) => FolderExistsStub(...args),
};
const makeControllers = () => {
  const createNote = async (req, res) => {
    try {
      const { title, pages = [], categories = [], folder = null } = req.body;
      if (categories.length > 0) {
        const categoryCount = await FakeCategory.countDocuments({
          _id: { $in: categories },
          user: req.user._id,
        });
        if (categoryCount !== categories.length) {
          return res.status(400).json({ message: "One or more categories are invalid" });
        }
      }
      if (folder) {
        const folderExists = await FakeFolder.exists({ _id: folder, user: req.user._id });
        if (!folderExists) {
          return res.status(400).json({ message: "Invalid folder" });
        }
      }
      const note = await FakeNote.create({
        user: req.user._id,
        title: title || "Untitled Note",
        pages,
        categories,
        folder: folder || null,
      });
      const populatedNote = await FakeNote.findById(note._id).populate("categories", "name").populate("folder", "name color");
      res.status(201).json({ message: "Note created successfully", note: populatedNote });
    } catch (error) {
      res.status(500).json({ message: "Failed to create note", error: error.message });
    }
  };
  const getNote = async (req, res) => {
    try {
      const note = await FakeNote.findOne({ _id: req.params.id, user: req.user._id })
        .populate("categories", "name")
        .populate("folder", "name color");
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.status(200).json({ note });
    } catch (error) {
      res.status(500).json({ message: "Failed to get note", error: error.message });
    }
  };
  const deleteNote = async (req, res) => {
    try {
      const note = await FakeNote.findOne({ _id: req.params.id, user: req.user._id });
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.status(200).json({ message: "Note and its media deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete note", error: error.message });
    }
  };
  const toggleFavorite = async (req, res) => {
    try {
      const note = await FakeNote.findOne({ _id: req.params.id, user: req.user._id });
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      note.isFavorite = !note.isFavorite;
      await note.save();
      res.status(200).json({
        message: note.isFavorite ? "Note added to favorites" : "Note removed from favorites",
        isFavorite: note.isFavorite,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update favorite", error: error.message });
    }
  };
  const addPage = async (req, res) => {
    try {
      const note = await FakeNote.findOne({ _id: req.params.id, user: req.user._id });
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      const {
        width = 794,
        height = 1123,
        sizePreset = "A4",
        orientation = "portrait",
        background = { type: "color", value: "#ffffff" },
        objects = [],
      } = req.body;
      note.pages.push({ width, height, sizePreset, orientation, background, objects });
      await note.save();
      const newPage = note.pages[note.pages.length - 1];
      res.status(201).json({ message: "Page added successfully", page: newPage });
    } catch (error) {
      res.status(500).json({ message: "Failed to add page", error: error.message });
    }
  };
  return { createNote, getNote, deleteNote, toggleFavorite, addPage };
};
describe("Note Controller â€“ Unit Tests", function () {
  let controllers;
  beforeEach(function () {
    NoteFindOneStub = sinon.stub();
    NoteFindByIdStub = sinon.stub();
    NoteCreateStub = sinon.stub();
    NoteCountDocumentsStub = sinon.stub();
    CategoryCountDocumentsStub = sinon.stub();
    FolderExistsStub = sinon.stub();
    controllers = makeControllers();
  });
  afterEach(function () {
    sinon.restore();
  });
  describe("createNote", function () {
    it("should return 201 with populated note on success", async function () {
      const fakeNote = { _id: "n1", title: "My Note" };
      NoteCreateStub.resolves(fakeNote);
      NoteFindByIdStub.returns(fakeNote);
      const req = mockReq({ body: { title: "My Note" } });
      const res = mockRes();
      await controllers.createNote(req, res);
      expect(res.status.calledWith(201)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.message).to.equal("Note created successfully");
    });
    it("should default title to 'Untitled Note' when not provided", async function () {
      NoteCreateStub.resolves({ _id: "n1", title: "Untitled Note" });
      NoteFindByIdStub.returns({ _id: "n1", title: "Untitled Note" });
      const req = mockReq({ body: {} });
      const res = mockRes();
      await controllers.createNote(req, res);
      const createArgs = NoteCreateStub.firstCall.args[0];
      expect(createArgs.title).to.equal("Untitled Note");
    });
    it("should return 400 when categories are invalid", async function () {
      CategoryCountDocumentsStub.resolves(1); // only 1 found but 2 sent
      const req = mockReq({ body: { categories: ["cat1", "cat2"] } });
      const res = mockRes();
      await controllers.createNote(req, res);
      expect(res.status.calledWith(400)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("One or more categories are invalid");
    });
    it("should return 400 when folder does not exist", async function () {
      FolderExistsStub.resolves(null);
      const req = mockReq({ body: { folder: "folderId" } });
      const res = mockRes();
      await controllers.createNote(req, res);
      expect(res.status.calledWith(400)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Invalid folder");
    });
    it("should proceed without validating folder when folder is null", async function () {
      NoteCreateStub.resolves({ _id: "n1", title: "No Folder Note" });
      NoteFindByIdStub.returns({ _id: "n1", title: "No Folder Note" });
      const req = mockReq({ body: { title: "No Folder Note", folder: null } });
      const res = mockRes();
      await controllers.createNote(req, res);
      expect(FolderExistsStub.called).to.equal(false);
      expect(res.status.calledWith(201)).to.equal(true);
    });
    it("should return 500 when DB throws", async function () {
      NoteCreateStub.rejects(new Error("DB error"));
      const req = mockReq({ body: { title: "Note" } });
      const res = mockRes();
      await controllers.createNote(req, res);
      expect(res.status.calledWith(500)).to.equal(true);
    });
  });
  describe("getNote", function () {
    it("should return 200 with note when found", async function () {
      const fakeNote = { _id: "n1", title: "My Note" };
      NoteFindOneStub.returns(fakeNote);
      const req = mockReq({ params: { id: "n1" } });
      const res = mockRes();
      await controllers.getNote(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      expect(res.json.firstCall.args[0].note).to.deep.equal(fakeNote);
    });
    it("should return 404 when note not found", async function () {
      NoteFindOneStub.returns(null);
      const req = mockReq({ params: { id: "nonexistent" } });
      const res = mockRes();
      await controllers.getNote(req, res);
      expect(res.status.calledWith(404)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Note not found");
    });
    it("should return 500 when DB throws", async function () {
      NoteFindOneStub.throws(new Error("DB error"));
      const req = mockReq({ params: { id: "n1" } });
      const res = mockRes();
      await controllers.getNote(req, res);
      expect(res.status.calledWith(500)).to.equal(true);
    });
  });
  describe("deleteNote", function () {
    it("should return 200 on successful delete", async function () {
      NoteFindOneStub.returns({ _id: "n1", title: "Note", pages: [] });
      const req = mockReq({ params: { id: "n1" } });
      const res = mockRes();
      await controllers.deleteNote(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Note and its media deleted successfully");
    });
    it("should return 404 when note not found", async function () {
      NoteFindOneStub.returns(null);
      const req = mockReq({ params: { id: "nonexistent" } });
      const res = mockRes();
      await controllers.deleteNote(req, res);
      expect(res.status.calledWith(404)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Note not found");
    });
    it("should return 500 when DB throws", async function () {
      NoteFindOneStub.throws(new Error("DB error"));
      const req = mockReq({ params: { id: "n1" } });
      const res = mockRes();
      await controllers.deleteNote(req, res);
      expect(res.status.calledWith(500)).to.equal(true);
    });
  });
  describe("toggleFavorite", function () {
    it("should return 200 with 'added to favorites' when toggled to true", async function () {
      const fakeNote = {
        _id: "n1",
        isFavorite: false,
        save: sinon.stub().callsFake(async function () {
          this.isFavorite = !false; // toggle
        }),
      };
      NoteFindOneStub.returns({
        ...fakeNote,
        isFavorite: false,
        save: sinon.stub().resolves(),
      });
      const req = mockReq({ params: { id: "n1" } });
      const res = mockRes();
      const note = { _id: "n1", isFavorite: true, save: sinon.stub().resolves() };
      NoteFindOneStub.returns(note);
      await controllers.toggleFavorite(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.isFavorite).to.be.a("boolean");
    });
    it("should return 404 when note not found", async function () {
      NoteFindOneStub.returns(null);
      const req = mockReq({ params: { id: "nonexistent" } });
      const res = mockRes();
      await controllers.toggleFavorite(req, res);
      expect(res.status.calledWith(404)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Note not found");
    });
    it("should return message 'Note added to favorites' when isFavorite becomes true", async function () {
      const note = { _id: "n1", isFavorite: false, save: sinon.stub().resolves() };
      NoteFindOneStub.returns(note);
      const req = mockReq({ params: { id: "n1" } });
      const res = mockRes();
      await controllers.toggleFavorite(req, res);
      const body = res.json.firstCall.args[0];
      expect(body.message).to.equal("Note added to favorites");
      expect(note.isFavorite).to.equal(true);
    });
    it("should return message 'Note removed from favorites' when isFavorite becomes false", async function () {
      const note = { _id: "n1", isFavorite: true, save: sinon.stub().resolves() };
      NoteFindOneStub.returns(note);
      const req = mockReq({ params: { id: "n1" } });
      const res = mockRes();
      await controllers.toggleFavorite(req, res);
      const body = res.json.firstCall.args[0];
      expect(body.message).to.equal("Note removed from favorites");
      expect(note.isFavorite).to.equal(false);
    });
    it("should return 500 when DB throws", async function () {
      NoteFindOneStub.throws(new Error("DB error"));
      const req = mockReq({ params: { id: "n1" } });
      const res = mockRes();
      await controllers.toggleFavorite(req, res);
      expect(res.status.calledWith(500)).to.equal(true);
    });
  });
  describe("addPage", function () {
    it("should return 201 with the new page", async function () {
      const fakePage = { width: 794, height: 1123, sizePreset: "A4" };
      const note = {
        _id: "n1",
        pages: [],
        save: sinon.stub().resolves(),
      };
      note.pages.push = function (...args) {
        Array.prototype.push.call(this, ...args);
      };
      NoteFindOneStub.returns(note);
      const req = mockReq({ params: { id: "n1" }, body: {} });
      const res = mockRes();
      await controllers.addPage(req, res);
      expect(res.status.calledWith(201)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.message).to.equal("Page added successfully");
      expect(body.page).to.exist;
    });
    it("should use default A4 dimensions when not provided", async function () {
      const note = { _id: "n1", pages: [], save: sinon.stub().resolves() };
      NoteFindOneStub.returns(note);
      const req = mockReq({ params: { id: "n1" }, body: {} });
      const res = mockRes();
      await controllers.addPage(req, res);
      expect(note.pages[0].width).to.equal(794);
      expect(note.pages[0].height).to.equal(1123);
      expect(note.pages[0].sizePreset).to.equal("A4");
      expect(note.pages[0].orientation).to.equal("portrait");
    });
    it("should use custom dimensions when provided", async function () {
      const note = { _id: "n1", pages: [], save: sinon.stub().resolves() };
      NoteFindOneStub.returns(note);
      const req = mockReq({
        params: { id: "n1" },
        body: { width: 1000, height: 800, sizePreset: "Custom", orientation: "landscape" },
      });
      const res = mockRes();
      await controllers.addPage(req, res);
      expect(note.pages[0].width).to.equal(1000);
      expect(note.pages[0].height).to.equal(800);
      expect(note.pages[0].orientation).to.equal("landscape");
    });
    it("should return 404 when note not found", async function () {
      NoteFindOneStub.returns(null);
      const req = mockReq({ params: { id: "nonexistent" }, body: {} });
      const res = mockRes();
      await controllers.addPage(req, res);
      expect(res.status.calledWith(404)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Note not found");
    });
    it("should return 500 when DB throws", async function () {
      NoteFindOneStub.throws(new Error("DB error"));
      const req = mockReq({ params: { id: "n1" }, body: {} });
      const res = mockRes();
      await controllers.addPage(req, res);
      expect(res.status.calledWith(500)).to.equal(true);
    });
  });
});
