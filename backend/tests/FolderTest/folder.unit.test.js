import { expect } from "chai";
import sinon from "sinon";
function mockRes() {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
}
function mockReq(overrides = {}) {
  return { body: {}, params: {}, user: { _id: "user123" }, ...overrides };
}
let FolderFindSortStub;
let FolderFindOneStub;
let FolderFindOneAndDeleteStub;
let FolderCreateStub;
let NoteCountDocumentsStub;
let NoteUpdateManyStub;
const FakeFolder = {
  find: () => ({ sort: FolderFindSortStub }),
  findOne: (...args) => FolderFindOneStub(...args),
  findOneAndDelete: (...args) => FolderFindOneAndDeleteStub(...args),
  create: (...args) => FolderCreateStub(...args),
};
const FakeNote = {
  countDocuments: (...args) => NoteCountDocumentsStub(...args),
  updateMany: (...args) => NoteUpdateManyStub(...args),
};
const makeControllers = () => {
  const getFolders = async (req, res) => {
    try {
      const folders = await FakeFolder.find({ user: req.user._id }).sort({ name: 1 });
      const foldersWithCounts = await Promise.all(
        folders.map(async (folder) => {
          const count = await FakeNote.countDocuments({
            user: req.user._id,
            folder: folder._id,
          });
          return { ...folder, notesCount: count };
        })
      );
      res.status(200).json({ folders: foldersWithCounts });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch folders", error: error.message });
    }
  };
  const createFolder = async (req, res) => {
    try {
      const { name, description, color } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Folder name is required" });
      }
      const existing = await FakeFolder.findOne({
        user: req.user._id,
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      });
      if (existing) {
        return res.status(400).json({ message: "A folder with this name already exists" });
      }
      const folder = await FakeFolder.create({
        user: req.user._id,
        name: name.trim(),
        description: description?.trim() || "",
        color: color || "#0040df",
      });
      res.status(201).json({
        message: "Folder created successfully",
        folder: { ...folder, notesCount: 0 },
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create folder", error: error.message });
    }
  };
  const deleteFolder = async (req, res) => {
    try {
      const folder = await FakeFolder.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id,
      });
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      await FakeNote.updateMany(
        { user: req.user._id, folder: req.params.id },
        { $set: { folder: null } }
      );
      res.status(200).json({ message: "Folder deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete folder", error: error.message });
    }
  };
  return { getFolders, createFolder, deleteFolder };
};
describe("Folder Controller â€“ Unit Tests", function () {
  let controllers;
  beforeEach(function () {
    FolderFindSortStub = sinon.stub();
    FolderFindOneStub = sinon.stub();
    FolderFindOneAndDeleteStub = sinon.stub();
    FolderCreateStub = sinon.stub();
    NoteCountDocumentsStub = sinon.stub();
    NoteUpdateManyStub = sinon.stub();
    controllers = makeControllers();
  });
  afterEach(function () {
    sinon.restore();
  });
  describe("getFolders", function () {
    it("should return 200 with folders including notesCount", async function () {
      const fakeFolders = [
        { _id: "f1", name: "Work" },
        { _id: "f2", name: "Personal" },
      ];
      FolderFindSortStub.resolves(fakeFolders);
      NoteCountDocumentsStub.onFirstCall().resolves(3).onSecondCall().resolves(1);
      const req = mockReq();
      const res = mockRes();
      await controllers.getFolders(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.folders).to.have.length(2);
      expect(body.folders[0].notesCount).to.equal(3);
      expect(body.folders[1].notesCount).to.equal(1);
    });
    it("should return 200 with empty array when user has no folders", async function () {
      FolderFindSortStub.resolves([]);
      const req = mockReq();
      const res = mockRes();
      await controllers.getFolders(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      expect(res.json.firstCall.args[0].folders).to.deep.equal([]);
    });
    it("should return 500 when DB throws", async function () {
      FolderFindSortStub.rejects(new Error("DB error"));
      const req = mockReq();
      const res = mockRes();
      await controllers.getFolders(req, res);
      expect(res.status.calledWith(500)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.message).to.equal("Failed to fetch folders");
    });
  });
  describe("createFolder", function () {
    it("should return 201 with the new folder", async function () {
      FolderFindOneStub.resolves(null);
      const fakeFolder = { _id: "f1", name: "Work", description: "", color: "#0040df" };
      FolderCreateStub.resolves(fakeFolder);
      const req = mockReq({ body: { name: "Work" } });
      const res = mockRes();
      await controllers.createFolder(req, res);
      expect(res.status.calledWith(201)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.message).to.equal("Folder created successfully");
      expect(body.folder.name).to.equal("Work");
      expect(body.folder.notesCount).to.equal(0);
    });
    it("should return 400 when name is missing", async function () {
      const req = mockReq({ body: {} });
      const res = mockRes();
      await controllers.createFolder(req, res);
      expect(res.status.calledWith(400)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Folder name is required");
    });
    it("should return 400 when name is only whitespace", async function () {
      const req = mockReq({ body: { name: "   " } });
      const res = mockRes();
      await controllers.createFolder(req, res);
      expect(res.status.calledWith(400)).to.equal(true);
    });
    it("should return 400 when folder name already exists", async function () {
      FolderFindOneStub.resolves({ _id: "f1", name: "Work" });
      const req = mockReq({ body: { name: "Work" } });
      const res = mockRes();
      await controllers.createFolder(req, res);
      expect(res.status.calledWith(400)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("A folder with this name already exists");
    });
    it("should use default color #0040df when color not provided", async function () {
      FolderFindOneStub.resolves(null);
      FolderCreateStub.resolves({ _id: "f1", name: "Work", color: "#0040df" });
      const req = mockReq({ body: { name: "Work" } });
      const res = mockRes();
      await controllers.createFolder(req, res);
      const createArgs = FolderCreateStub.firstCall.args[0];
      expect(createArgs.color).to.equal("#0040df");
    });
    it("should use provided color when given", async function () {
      FolderFindOneStub.resolves(null);
      FolderCreateStub.resolves({ _id: "f1", name: "Work", color: "#ff0000" });
      const req = mockReq({ body: { name: "Work", color: "#ff0000" } });
      const res = mockRes();
      await controllers.createFolder(req, res);
      const createArgs = FolderCreateStub.firstCall.args[0];
      expect(createArgs.color).to.equal("#ff0000");
    });
    it("should trim folder name before saving", async function () {
      FolderFindOneStub.resolves(null);
      FolderCreateStub.resolves({ _id: "f1", name: "Work" });
      const req = mockReq({ body: { name: "  Work  " } });
      const res = mockRes();
      await controllers.createFolder(req, res);
      const createArgs = FolderCreateStub.firstCall.args[0];
      expect(createArgs.name).to.equal("Work");
    });
    it("should return 500 when DB throws on create", async function () {
      FolderFindOneStub.resolves(null);
      FolderCreateStub.rejects(new Error("DB error"));
      const req = mockReq({ body: { name: "Work" } });
      const res = mockRes();
      await controllers.createFolder(req, res);
      expect(res.status.calledWith(500)).to.equal(true);
    });
  });
  describe("deleteFolder", function () {
    it("should return 200 and nullify notes when folder is deleted", async function () {
      FolderFindOneAndDeleteStub.resolves({ _id: "f1", name: "Work" });
      NoteUpdateManyStub.resolves({ modifiedCount: 2 });
      const req = mockReq({ params: { id: "f1" } });
      const res = mockRes();
      await controllers.deleteFolder(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Folder deleted successfully");
      expect(NoteUpdateManyStub.called).to.equal(true);
    });
    it("should return 404 when folder is not found", async function () {
      FolderFindOneAndDeleteStub.resolves(null);
      const req = mockReq({ params: { id: "nonexistent" } });
      const res = mockRes();
      await controllers.deleteFolder(req, res);
      expect(res.status.calledWith(404)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Folder not found");
    });
    it("should not call Note.updateMany when folder is not found", async function () {
      FolderFindOneAndDeleteStub.resolves(null);
      const req = mockReq({ params: { id: "nonexistent" } });
      const res = mockRes();
      await controllers.deleteFolder(req, res);
      expect(NoteUpdateManyStub.called).to.equal(false);
    });
    it("should return 500 when DB throws", async function () {
      FolderFindOneAndDeleteStub.rejects(new Error("DB error"));
      const req = mockReq({ params: { id: "f1" } });
      const res = mockRes();
      await controllers.deleteFolder(req, res);
      expect(res.status.calledWith(500)).to.equal(true);
    });
    it("should delete using both folder id and user id for isolation", async function () {
      FolderFindOneAndDeleteStub.resolves({ _id: "f1", name: "Work" });
      NoteUpdateManyStub.resolves();
      const req = mockReq({ params: { id: "f1" }, user: { _id: "user123" } });
      const res = mockRes();
      await controllers.deleteFolder(req, res);
      const query = FolderFindOneAndDeleteStub.firstCall.args[0];
      expect(query._id).to.equal("f1");
      expect(query.user).to.equal("user123");
    });
  });
});
