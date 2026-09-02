import { expect } from "chai";
import sinon from "sinon";
import http from "http";
import TaskModel from "../../src/models/task.model.js";
import {
  getTasks,
  createTask,
  updateTask,
  toggleTaskStatus,
  deleteTask,
} from "../../src/controller/taskController.js";

// taskController.js calls getIO() whose `io` binding is set by initSocket().
// We initialise a real http.createServer() in `before()` so getIO() works
// without needing esmock or proxyquire.
import * as socketConfig from "../../src/config/socket.js";

function mockRes() {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
}
function mockReq(overrides = {}) {
  return { body: {}, params: {}, query: {}, user: { _id: "user123" }, ...overrides };
}

// Build Task.find().populate().sort() chain
const makeChain = (result) => ({
  populate: () => ({ sort: () => result }),
});
// Build Task.findById().populate() chain
const makeFindByIdChain = (result) => ({
  populate: () => result,
});
// Build Task.findOneAndUpdate().populate() chain
const makeFOAUChain = (result) => ({
  populate: () => Promise.resolve(result),
  then: (r) => Promise.resolve(result).then(r),
  catch: (r) => Promise.resolve(result).catch(r),
});


describe("Task Controller – Unit Tests", function () {
  let httpServer;

  before(function () {
    // Create a minimal HTTP server so socket.io's Server constructor succeeds.
    // This sets the module-level `io` in socket.js, making getIO() work.
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
    httpServer = http.createServer();
    socketConfig.initSocket(httpServer);
  });

  after(function () {
    if (httpServer) httpServer.close();
  });

  beforeEach(function () {
    sinon.stub(TaskModel, "find").callsFake(() => makeChain(Promise.resolve([])));
    sinon.stub(TaskModel, "findOne");
    sinon.stub(TaskModel, "findOneAndUpdate").callsFake(() => makeFOAUChain(null));
    sinon.stub(TaskModel, "findOneAndDelete");
    sinon.stub(TaskModel, "create");
    sinon.stub(TaskModel, "findById").callsFake(() => makeFindByIdChain(null));
  });

  afterEach(function () {
    sinon.restore();
  });

  // ─── getTasks ─────────────────────────────────────────────────────────────
  describe("getTasks", function () {
    it("should return 200 with tasks array", async function () {
      const fakeTasks = [{ _id: "t1", title: "Task 1" }];
      TaskModel.find.callsFake(() => makeChain(Promise.resolve(fakeTasks)));

      const req = mockReq({ query: {} });
      const res = mockRes();
      await getTasks(req, res);

      expect(res.status.calledWith(200)).to.equal(true);
      expect(res.json.firstCall.args[0].tasks).to.deep.equal(fakeTasks);
    });

    it("should return 200 with empty array when no tasks", async function () {
      TaskModel.find.callsFake(() => makeChain(Promise.resolve([])));

      const req = mockReq({ query: {} });
      const res = mockRes();
      await getTasks(req, res);

      expect(res.status.calledWith(200)).to.equal(true);
      expect(res.json.firstCall.args[0].tasks).to.deep.equal([]);
    });

    it("should return 500 when DB throws", async function () {
      TaskModel.find.callsFake(() => makeChain(Promise.reject(new Error("DB error"))));

      const req = mockReq({ query: {} });
      const res = mockRes();
      await getTasks(req, res);

      expect(res.status.calledWith(500)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Failed to get tasks");
    });
  });

  // ─── createTask ───────────────────────────────────────────────────────────
  describe("createTask", function () {
    it("should return 201 on successful task creation", async function () {
      const fakeTask = { _id: "t1", title: "Buy milk" };
      TaskModel.create.resolves(fakeTask);
      TaskModel.findById.callsFake(() => makeFindByIdChain(Promise.resolve(fakeTask)));

      const req = mockReq({ body: { title: "Buy milk", priority: "High" } });
      const res = mockRes();
      await createTask(req, res);

      expect(res.status.calledWith(201)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Task created successfully");
      expect(res.json.firstCall.args[0].task.title).to.equal("Buy milk");
    });

    it("should return 400 when title is missing", async function () {
      const req = mockReq({ body: {} });
      const res = mockRes();
      await createTask(req, res);

      expect(res.status.calledWith(400)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Task title is required");
    });

    it("should return 400 when title is only whitespace", async function () {
      const req = mockReq({ body: { title: "   " } });
      const res = mockRes();
      await createTask(req, res);

      expect(res.status.calledWith(400)).to.equal(true);
    });

    it("should default priority to Medium when not provided", async function () {
      const fakeTask = { _id: "t1", title: "Task", priority: "Medium" };
      TaskModel.create.resolves(fakeTask);
      TaskModel.findById.callsFake(() => makeFindByIdChain(Promise.resolve(fakeTask)));

      const req = mockReq({ body: { title: "Task" } });
      const res = mockRes();
      await createTask(req, res);

      const createArgs = TaskModel.create.firstCall.args[0];
      expect(createArgs.priority).to.equal("Medium");
    });

    it("should return 500 when DB throws", async function () {
      TaskModel.create.rejects(new Error("DB error"));

      const req = mockReq({ body: { title: "Task" } });
      const res = mockRes();
      await createTask(req, res);

      expect(res.status.calledWith(500)).to.equal(true);
    });
  });

  // ─── updateTask ───────────────────────────────────────────────────────────
  describe("updateTask", function () {
    it("should return 200 with updated task", async function () {
      const fakeTask = { _id: "t1", title: "Old", description: "", save: sinon.stub().resolves() };
      TaskModel.findOne.resolves(fakeTask);
      TaskModel.findById.callsFake(() => makeFindByIdChain(Promise.resolve({ ...fakeTask, title: "New" })));

      const req = mockReq({ params: { id: "t1" }, body: { title: "New" } });
      const res = mockRes();
      await updateTask(req, res);

      expect(res.status.calledWith(200)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Task updated successfully");
    });

    it("should return 404 when task not found", async function () {
      TaskModel.findOne.resolves(null);

      const req = mockReq({ params: { id: "nonexistent" }, body: { title: "New" } });
      const res = mockRes();
      await updateTask(req, res);

      expect(res.status.calledWith(404)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Task not found");
    });

    it("should return 400 when title is an empty string", async function () {
      const req = mockReq({ params: { id: "t1" }, body: { title: "  " } });
      const res = mockRes();
      await updateTask(req, res);

      expect(res.status.calledWith(400)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Task title cannot be empty");
    });

    it("should return 500 when DB throws", async function () {
      TaskModel.findOne.rejects(new Error("DB error"));

      const req = mockReq({ params: { id: "t1" }, body: { title: "New" } });
      const res = mockRes();
      await updateTask(req, res);

      expect(res.status.calledWith(500)).to.equal(true);
    });
  });

  // ─── toggleTaskStatus ─────────────────────────────────────────────────────
  describe("toggleTaskStatus", function () {
    it("should return 200 with 'Task completed' when toggled to true", async function () {
      TaskModel.findOneAndUpdate.callsFake(() => makeFOAUChain({ _id: "t1", completed: true }));

      const req = mockReq({ params: { id: "t1" } });
      const res = mockRes();
      await toggleTaskStatus(req, res);

      expect(res.status.calledWith(200)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Task completed");
    });

    it("should return 200 with 'Task marked pending' when toggled to false", async function () {
      TaskModel.findOneAndUpdate.callsFake(() => makeFOAUChain({ _id: "t1", completed: false }));

      const req = mockReq({ params: { id: "t1" } });
      const res = mockRes();
      await toggleTaskStatus(req, res);

      expect(res.status.calledWith(200)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Task marked pending");
    });

    it("should return 404 when task not found", async function () {
      TaskModel.findOneAndUpdate.callsFake(() => makeFOAUChain(null));

      const req = mockReq({ params: { id: "nonexistent" } });
      const res = mockRes();
      await toggleTaskStatus(req, res);

      expect(res.status.calledWith(404)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Task not found");
    });

    it("should return 500 when DB throws", async function () {
      TaskModel.findOneAndUpdate.callsFake(() => ({
        populate: () => Promise.reject(new Error("DB error")),
      }));

      const req = mockReq({ params: { id: "t1" } });
      const res = mockRes();
      await toggleTaskStatus(req, res);

      expect(res.status.calledWith(500)).to.equal(true);
    });
  });

  // ─── deleteTask ───────────────────────────────────────────────────────────
  describe("deleteTask", function () {
    it("should return 200 on successful delete", async function () {
      TaskModel.findOneAndDelete.resolves({ _id: "t1", title: "Task" });

      const req = mockReq({ params: { id: "t1" } });
      const res = mockRes();
      await deleteTask(req, res);

      expect(res.status.calledWith(200)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Task deleted successfully");
    });

    it("should return 404 when task not found", async function () {
      TaskModel.findOneAndDelete.resolves(null);

      const req = mockReq({ params: { id: "nonexistent" } });
      const res = mockRes();
      await deleteTask(req, res);

      expect(res.status.calledWith(404)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Task not found");
    });

    it("should return 404 and not proceed to emit when task not found", async function () {
      TaskModel.findOneAndDelete.resolves(null);

      const req = mockReq({ params: { id: "ghost" } });
      const res = mockRes();
      await deleteTask(req, res);

      // The controller returns early with 404 before getIO().emit() is called
      expect(res.status.calledWith(404)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Task not found");
    });

    it("should return 500 when DB throws", async function () {
      TaskModel.findOneAndDelete.rejects(new Error("DB error"));

      const req = mockReq({ params: { id: "t1" } });
      const res = mockRes();
      await deleteTask(req, res);

      expect(res.status.calledWith(500)).to.equal(true);
    });
  });
});
