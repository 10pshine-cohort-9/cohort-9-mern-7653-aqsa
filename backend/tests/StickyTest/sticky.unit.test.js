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
let StickyFindSortStub;
let StickyFindOneStub;
let StickyFindOneAndDeleteStub;
let StickyCreateStub;
let IOEmitStub;
const FakeSticky = {
  find: () => ({ sort: StickyFindSortStub }),
  findOne: (...args) => StickyFindOneStub(...args),
  findOneAndDelete: (...args) => StickyFindOneAndDeleteStub(...args),
  create: (...args) => StickyCreateStub(...args),
};
const FakeIO = {
  to: () => ({ emit: IOEmitStub }),
};
const makeControllers = () => {
  const getStickies = async (req, res) => {
    try {
      const stickies = await FakeSticky.find({ user: req.user._id }).sort({ updatedAt: -1 });
      res.status(200).json({ stickies });
    } catch (error) {
      res.status(500).json({ message: "Failed to get sticky notes", error: error.message });
    }
  };
  const createSticky = async (req, res) => {
    try {
      const { title = "", content, color, position } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Note content is required" });
      }
      const sticky = await FakeSticky.create({
        user: req.user._id,
        title: title.trim(),
        content: content.trim(),
        color: color || "#fef08a",
        position: position || { x: 0, y: 0 },
      });
      FakeIO.to(req.user._id.toString()).emit("sticky_created", sticky);
      res.status(201).json({ message: "Sticky note created", sticky });
    } catch (error) {
      res.status(500).json({ message: "Failed to create sticky note", error: error.message });
    }
  };
  const updateSticky = async (req, res) => {
    try {
      const { title, content, color, position } = req.body;
      const sticky = await FakeSticky.findOne({ _id: req.params.id, user: req.user._id });
      if (!sticky) return res.status(404).json({ message: "Sticky note not found" });
      if (title !== undefined) sticky.title = title.trim();
      if (content !== undefined) sticky.content = content.trim();
      if (color !== undefined) sticky.color = color;
      if (position !== undefined) sticky.position = position;
      await sticky.save();
      FakeIO.to(req.user._id.toString()).emit("sticky_updated", sticky);
      res.status(200).json({ message: "Sticky note updated", sticky });
    } catch (error) {
      res.status(500).json({ message: "Failed to update sticky note", error: error.message });
    }
  };
  const deleteSticky = async (req, res) => {
    try {
      const sticky = await FakeSticky.findOneAndDelete({ _id: req.params.id, user: req.user._id });
      if (!sticky) return res.status(404).json({ message: "Sticky note not found" });
      FakeIO.to(req.user._id.toString()).emit("sticky_deleted", req.params.id);
      res.status(200).json({ message: "Sticky note deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete sticky note", error: error.message });
    }
  };
  return { getStickies, createSticky, updateSticky, deleteSticky };
};
describe("Sticky Controller â€“ Unit Tests", function () {
  let controllers;
  beforeEach(function () {
    StickyFindSortStub = sinon.stub();
    StickyFindOneStub = sinon.stub();
    StickyFindOneAndDeleteStub = sinon.stub();
    StickyCreateStub = sinon.stub();
    IOEmitStub = sinon.stub();
    controllers = makeControllers();
  });
  afterEach(function () {
    sinon.restore();
  });
  describe("getStickies", function () {
    it("should return 200 with stickies array", async function () {
      const fakeStickies = [{ _id: "s1", content: "Hello" }];
      StickyFindSortStub.resolves(fakeStickies);
      const req = mockReq();
      const res = mockRes();
      await controllers.getStickies(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      expect(res.json.firstCall.args[0].stickies).to.deep.equal(fakeStickies);
    });
    it("should return 200 with empty array when no stickies", async function () {
      StickyFindSortStub.resolves([]);
      const req = mockReq();
      const res = mockRes();
      await controllers.getStickies(req, res);
      expect(res.json.firstCall.args[0].stickies).to.deep.equal([]);
    });
    it("should return 500 when DB throws", async function () {
      StickyFindSortStub.rejects(new Error("DB error"));
      const req = mockReq();
      const res = mockRes();
      await controllers.getStickies(req, res);
      expect(res.status.calledWith(500)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Failed to get sticky notes");
    });
  });
  describe("createSticky", function () {
    it("should return 201 on successful creation", async function () {
      const fakeSticky = { _id: "s1", content: "Hello world", color: "#fef08a" };
      StickyCreateStub.resolves(fakeSticky);
      const req = mockReq({ body: { content: "Hello world" } });
      const res = mockRes();
      await controllers.createSticky(req, res);
      expect(res.status.calledWith(201)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.message).to.equal("Sticky note created");
      expect(body.sticky.content).to.equal("Hello world");
    });
    it("should return 400 when content is missing", async function () {
      const req = mockReq({ body: {} });
      const res = mockRes();
      await controllers.createSticky(req, res);
      expect(res.status.calledWith(400)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Note content is required");
    });
    it("should return 400 when content is only whitespace", async function () {
      const req = mockReq({ body: { content: "   " } });
      const res = mockRes();
      await controllers.createSticky(req, res);
      expect(res.status.calledWith(400)).to.equal(true);
    });
    it("should use default color #fef08a when color not provided", async function () {
      const fakeSticky = { _id: "s1", content: "Note" };
      StickyCreateStub.resolves(fakeSticky);
      const req = mockReq({ body: { content: "Note" } });
      const res = mockRes();
      await controllers.createSticky(req, res);
      const createArgs = StickyCreateStub.firstCall.args[0];
      expect(createArgs.color).to.equal("#fef08a");
    });
    it("should use default position {x:0, y:0} when position not provided", async function () {
      const fakeSticky = { _id: "s1", content: "Note" };
      StickyCreateStub.resolves(fakeSticky);
      const req = mockReq({ body: { content: "Note" } });
      const res = mockRes();
      await controllers.createSticky(req, res);
      const createArgs = StickyCreateStub.firstCall.args[0];
      expect(createArgs.position).to.deep.equal({ x: 0, y: 0 });
    });
    it("should emit sticky_created socket event", async function () {
      StickyCreateStub.resolves({ _id: "s1", content: "Note" });
      const req = mockReq({ body: { content: "Note" } });
      const res = mockRes();
      await controllers.createSticky(req, res);
      expect(IOEmitStub.calledWith("sticky_created")).to.equal(true);
    });
    it("should return 500 when DB throws", async function () {
      StickyCreateStub.rejects(new Error("DB error"));
      const req = mockReq({ body: { content: "Note" } });
      const res = mockRes();
      await controllers.createSticky(req, res);
      expect(res.status.calledWith(500)).to.equal(true);
    });
  });
  describe("updateSticky", function () {
    it("should return 200 with updated sticky", async function () {
      const fakeSticky = {
        _id: "s1",
        title: "Old",
        content: "Old content",
        save: sinon.stub().resolves(),
      };
      StickyFindOneStub.resolves(fakeSticky);
      const req = mockReq({ params: { id: "s1" }, body: { title: "New", content: "New content" } });
      const res = mockRes();
      await controllers.updateSticky(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Sticky note updated");
    });
    it("should return 404 when sticky not found", async function () {
      StickyFindOneStub.resolves(null);
      const req = mockReq({ params: { id: "nonexistent" }, body: {} });
      const res = mockRes();
      await controllers.updateSticky(req, res);
      expect(res.status.calledWith(404)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Sticky note not found");
    });
    it("should emit sticky_updated socket event", async function () {
      const fakeSticky = { _id: "s1", content: "note", save: sinon.stub().resolves() };
      StickyFindOneStub.resolves(fakeSticky);
      const req = mockReq({ params: { id: "s1" }, body: { content: "updated" } });
      const res = mockRes();
      await controllers.updateSticky(req, res);
      expect(IOEmitStub.calledWith("sticky_updated")).to.equal(true);
    });
    it("should update only provided fields", async function () {
      const fakeSticky = {
        _id: "s1",
        title: "Old title",
        content: "Old content",
        color: "#fff",
        save: sinon.stub().resolves(),
      };
      StickyFindOneStub.resolves(fakeSticky);
      const req = mockReq({ params: { id: "s1" }, body: { color: "#000" } });
      const res = mockRes();
      await controllers.updateSticky(req, res);
      expect(fakeSticky.title).to.equal("Old title"); // unchanged
      expect(fakeSticky.color).to.equal("#000");       // updated
    });
    it("should return 500 when DB throws", async function () {
      StickyFindOneStub.rejects(new Error("DB error"));
      const req = mockReq({ params: { id: "s1" }, body: {} });
      const res = mockRes();
      await controllers.updateSticky(req, res);
      expect(res.status.calledWith(500)).to.equal(true);
    });
  });
  describe("deleteSticky", function () {
    it("should return 200 on successful delete", async function () {
      StickyFindOneAndDeleteStub.resolves({ _id: "s1", content: "Note" });
      const req = mockReq({ params: { id: "s1" } });
      const res = mockRes();
      await controllers.deleteSticky(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Sticky note deleted");
    });
    it("should emit sticky_deleted with the note id", async function () {
      StickyFindOneAndDeleteStub.resolves({ _id: "s1", content: "Note" });
      const req = mockReq({ params: { id: "s1" } });
      const res = mockRes();
      await controllers.deleteSticky(req, res);
      expect(IOEmitStub.calledWith("sticky_deleted", "s1")).to.equal(true);
    });
    it("should return 404 when sticky not found", async function () {
      StickyFindOneAndDeleteStub.resolves(null);
      const req = mockReq({ params: { id: "nonexistent" } });
      const res = mockRes();
      await controllers.deleteSticky(req, res);
      expect(res.status.calledWith(404)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Sticky note not found");
    });
    it("should not emit event when sticky not found", async function () {
      StickyFindOneAndDeleteStub.resolves(null);
      const req = mockReq({ params: { id: "ghost" } });
      const res = mockRes();
      await controllers.deleteSticky(req, res);
      expect(IOEmitStub.called).to.equal(false);
    });
    it("should return 500 when DB throws", async function () {
      StickyFindOneAndDeleteStub.rejects(new Error("DB error"));
      const req = mockReq({ params: { id: "s1" } });
      const res = mockRes();
      await controllers.deleteSticky(req, res);
      expect(res.status.calledWith(500)).to.equal(true);
    });
  });
});
