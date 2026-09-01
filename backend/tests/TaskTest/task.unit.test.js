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
let TaskFindChainStub;   // what Task.find().populate().sort() resolves to
let TaskFindByIdAndUpdateStub;
let TaskFindOneStub;
let TaskFindOneAndUpdateStub;
let TaskFindOneAndDeleteStub;
let TaskCreateStub;
let TaskFindByIdStub;    // used after create for populate
let IOEmitStub;
const makeChain = (result) => ({
  populate: () => ({
    sort: () => result,
  }),
});
const FakeTask = {
  find: () => makeChain(TaskFindChainStub()),
  findOne: (...args) => TaskFindOneStub(...args),
  findOneAndUpdate: (...args) => TaskFindOneAndUpdateStub(...args),
  findOneAndDelete: (...args) => TaskFindOneAndDeleteStub(...args),
  create: (...args) => TaskCreateStub(...args),
  findById: (id) => ({ populate: () => TaskFindByIdStub(id) }),
  findByIdAndUpdate: (...args) => TaskFindByIdAndUpdateStub(...args),
};
const FakeIO = {
  to: () => ({ emit: IOEmitStub }),
};
const makeControllers = () => {
  const getTasks = async (req, res) => {
    try {
      const { completed, dueDate } = req.query;
      const query = { user: req.user._id };
      if (completed !== undefined) query.completed = completed === "true";
      if (dueDate) {
        const start = new Date(dueDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dueDate);
        end.setHours(23, 59, 59, 999);
        query.dueDate = { $gte: start, $lte: end };
      }
      const tasks = await FakeTask.find(query).populate("note", "title").sort({ createdAt: -1 });
      res.status(200).json({ tasks });
    } catch (error) {
      res.status(500).json({ message: "Failed to get tasks", error: error.message });
    }
  };
  const createTask = async (req, res) => {
    try {
      const { title, description = "", dueDate = null, priority = "Medium", note = null } = req.body;
      if (!title || !title.trim()) {
        return res.status(400).json({ message: "Task title is required" });
      }
      const task = await FakeTask.create({
        user: req.user._id,
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate ? new Date(dueDate) : null,
        priority,
        note: note || null,
      });
      const populatedTask = await FakeTask.findById(task._id).populate("note", "title");
      FakeIO.to(req.user._id.toString()).emit("task_created", populatedTask);
      res.status(201).json({ message: "Task created successfully", task: populatedTask });
    } catch (error) {
      res.status(500).json({ message: "Failed to create task", error: error.message });
    }
  };
  const updateTask = async (req, res) => {
    try {
      const { title, description, completed, dueDate, priority, note } = req.body;
      if (title !== undefined && (!title || !title.trim())) {
        return res.status(400).json({ message: "Task title cannot be empty" });
      }
      const task = await FakeTask.findOne({ _id: req.params.id, user: req.user._id });
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      if (title !== undefined) task.title = title.trim();
      if (description !== undefined) task.description = description.trim();
      if (completed !== undefined) task.completed = completed;
      if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
      if (priority !== undefined) task.priority = priority;
      if (note !== undefined) task.note = note || null;
      await task.save();
      const populatedTask = await FakeTask.findById(task._id).populate("note", "title");
      FakeIO.to(req.user._id.toString()).emit("task_updated", populatedTask);
      res.status(200).json({ message: "Task updated successfully", task: populatedTask });
    } catch (error) {
      res.status(500).json({ message: "Failed to update task", error: error.message });
    }
  };
  const toggleTaskStatus = async (req, res) => {
    try {
      const task = await FakeTask.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        [{ $set: { completed: { $not: "$completed" } } }],
        { new: true }
      );
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      FakeIO.to(req.user._id.toString()).emit("task_updated", task);
      res.status(200).json({
        message: task.completed ? "Task completed" : "Task marked pending",
        task,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle task", error: error.message });
    }
  };
  const deleteTask = async (req, res) => {
    try {
      const task = await FakeTask.findOneAndDelete({ _id: req.params.id, user: req.user._id });
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      FakeIO.to(req.user._id.toString()).emit("task_deleted", req.params.id);
      res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task", error: error.message });
    }
  };
  return { getTasks, createTask, updateTask, toggleTaskStatus, deleteTask };
};
describe("Task Controller â€“ Unit Tests", function () {
  let controllers;
  beforeEach(function () {
    TaskFindChainStub = sinon.stub();
    TaskFindByIdAndUpdateStub = sinon.stub();
    TaskFindOneStub = sinon.stub();
    TaskFindOneAndUpdateStub = sinon.stub();
    TaskFindOneAndDeleteStub = sinon.stub();
    TaskCreateStub = sinon.stub();
    TaskFindByIdStub = sinon.stub();
    IOEmitStub = sinon.stub();
    controllers = makeControllers();
  });
  afterEach(function () {
    sinon.restore();
  });
  describe("getTasks", function () {
    it("should return 200 with tasks array", async function () {
      const fakeTasks = [{ _id: "t1", title: "Task 1" }];
      TaskFindChainStub.returns(Promise.resolve(fakeTasks));
      const req = mockReq({ query: {} });
      const res = mockRes();
      await controllers.getTasks(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      expect(res.json.firstCall.args[0].tasks).to.deep.equal(fakeTasks);
    });
    it("should return 200 with empty array when no tasks", async function () {
      TaskFindChainStub.returns(Promise.resolve([]));
      const req = mockReq({ query: {} });
      const res = mockRes();
      await controllers.getTasks(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      expect(res.json.firstCall.args[0].tasks).to.deep.equal([]);
    });
    it("should return 500 when DB throws", async function () {
      TaskFindChainStub.returns(Promise.reject(new Error("DB error")));
      const req = mockReq({ query: {} });
      const res = mockRes();
      await controllers.getTasks(req, res);
      expect(res.status.calledWith(500)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Failed to get tasks");
    });
  });
  describe("createTask", function () {
    it("should return 201 on successful task creation", async function () {
      const fakeTask = { _id: "t1", title: "Buy milk" };
      TaskCreateStub.resolves(fakeTask);
      TaskFindByIdStub.resolves(fakeTask);
      const req = mockReq({ body: { title: "Buy milk", priority: "High" } });
      const res = mockRes();
      await controllers.createTask(req, res);
      expect(res.status.calledWith(201)).to.equal(true);
      const body = res.json.firstCall.args[0];
      expect(body.message).to.equal("Task created successfully");
      expect(body.task.title).to.equal("Buy milk");
    });
    it("should emit task_created socket event", async function () {
      const fakeTask = { _id: "t1", title: "Buy milk" };
      TaskCreateStub.resolves(fakeTask);
      TaskFindByIdStub.resolves(fakeTask);
      const req = mockReq({ body: { title: "Buy milk" } });
      const res = mockRes();
      await controllers.createTask(req, res);
      expect(IOEmitStub.calledWith("task_created")).to.equal(true);
    });
    it("should return 400 when title is missing", async function () {
      const req = mockReq({ body: {} });
      const res = mockRes();
      await controllers.createTask(req, res);
      expect(res.status.calledWith(400)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Task title is required");
    });
    it("should return 400 when title is only whitespace", async function () {
      const req = mockReq({ body: { title: "   " } });
      const res = mockRes();
      await controllers.createTask(req, res);
      expect(res.status.calledWith(400)).to.equal(true);
    });
    it("should default priority to Medium when not provided", async function () {
      const fakeTask = { _id: "t1", title: "Task", priority: "Medium" };
      TaskCreateStub.resolves(fakeTask);
      TaskFindByIdStub.resolves(fakeTask);
      const req = mockReq({ body: { title: "Task" } });
      const res = mockRes();
      await controllers.createTask(req, res);
      const createArgs = TaskCreateStub.firstCall.args[0];
      expect(createArgs.priority).to.equal("Medium");
    });
    it("should return 500 when DB throws", async function () {
      TaskCreateStub.rejects(new Error("DB error"));
      const req = mockReq({ body: { title: "Task" } });
      const res = mockRes();
      await controllers.createTask(req, res);
      expect(res.status.calledWith(500)).to.equal(true);
    });
  });
  describe("updateTask", function () {
    it("should return 200 with updated task", async function () {
      const fakeTask = {
        _id: "t1",
        title: "Old",
        description: "",
        save: sinon.stub().resolves(),
      };
      TaskFindOneStub.resolves(fakeTask);
      TaskFindByIdStub.resolves({ ...fakeTask, title: "New" });
      const req = mockReq({ params: { id: "t1" }, body: { title: "New" } });
      const res = mockRes();
      await controllers.updateTask(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Task updated successfully");
    });
    it("should return 404 when task not found", async function () {
      TaskFindOneStub.resolves(null);
      const req = mockReq({ params: { id: "nonexistent" }, body: { title: "New" } });
      const res = mockRes();
      await controllers.updateTask(req, res);
      expect(res.status.calledWith(404)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Task not found");
    });
    it("should return 400 when title is an empty string", async function () {
      const req = mockReq({ params: { id: "t1" }, body: { title: "  " } });
      const res = mockRes();
      await controllers.updateTask(req, res);
      expect(res.status.calledWith(400)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Task title cannot be empty");
    });
    it("should emit task_updated socket event after update", async function () {
      const fakeTask = { _id: "t1", title: "Old", save: sinon.stub().resolves() };
      TaskFindOneStub.resolves(fakeTask);
      TaskFindByIdStub.resolves(fakeTask);
      const req = mockReq({ params: { id: "t1" }, body: { completed: true } });
      const res = mockRes();
      await controllers.updateTask(req, res);
      expect(IOEmitStub.calledWith("task_updated")).to.equal(true);
    });
    it("should return 500 when DB throws", async function () {
      TaskFindOneStub.rejects(new Error("DB error"));
      const req = mockReq({ params: { id: "t1" }, body: { title: "New" } });
      const res = mockRes();
      await controllers.updateTask(req, res);
      expect(res.status.calledWith(500)).to.equal(true);
    });
  });
  describe("toggleTaskStatus", function () {
    it("should return 200 with 'Task completed' when toggled to true", async function () {
      TaskFindOneAndUpdateStub.resolves({ _id: "t1", completed: true });
      const req = mockReq({ params: { id: "t1" } });
      const res = mockRes();
      await controllers.toggleTaskStatus(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Task completed");
    });
    it("should return 200 with 'Task marked pending' when toggled to false", async function () {
      TaskFindOneAndUpdateStub.resolves({ _id: "t1", completed: false });
      const req = mockReq({ params: { id: "t1" } });
      const res = mockRes();
      await controllers.toggleTaskStatus(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Task marked pending");
    });
    it("should return 404 when task not found", async function () {
      TaskFindOneAndUpdateStub.resolves(null);
      const req = mockReq({ params: { id: "nonexistent" } });
      const res = mockRes();
      await controllers.toggleTaskStatus(req, res);
      expect(res.status.calledWith(404)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Task not found");
    });
    it("should emit task_updated socket event on toggle", async function () {
      TaskFindOneAndUpdateStub.resolves({ _id: "t1", completed: true });
      const req = mockReq({ params: { id: "t1" } });
      const res = mockRes();
      await controllers.toggleTaskStatus(req, res);
      expect(IOEmitStub.calledWith("task_updated")).to.equal(true);
    });
    it("should return 500 when DB throws", async function () {
      TaskFindOneAndUpdateStub.rejects(new Error("DB error"));
      const req = mockReq({ params: { id: "t1" } });
      const res = mockRes();
      await controllers.toggleTaskStatus(req, res);
      expect(res.status.calledWith(500)).to.equal(true);
    });
  });
  describe("deleteTask", function () {
    it("should return 200 on successful delete", async function () {
      TaskFindOneAndDeleteStub.resolves({ _id: "t1", title: "Task" });
      const req = mockReq({ params: { id: "t1" } });
      const res = mockRes();
      await controllers.deleteTask(req, res);
      expect(res.status.calledWith(200)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Task deleted successfully");
    });
    it("should emit task_deleted socket event", async function () {
      TaskFindOneAndDeleteStub.resolves({ _id: "t1", title: "Task" });
      const req = mockReq({ params: { id: "t1" } });
      const res = mockRes();
      await controllers.deleteTask(req, res);
      expect(IOEmitStub.calledWith("task_deleted", "t1")).to.equal(true);
    });
    it("should return 404 when task not found", async function () {
      TaskFindOneAndDeleteStub.resolves(null);
      const req = mockReq({ params: { id: "nonexistent" } });
      const res = mockRes();
      await controllers.deleteTask(req, res);
      expect(res.status.calledWith(404)).to.equal(true);
      expect(res.json.firstCall.args[0].message).to.equal("Task not found");
    });
    it("should return 500 when DB throws", async function () {
      TaskFindOneAndDeleteStub.rejects(new Error("DB error"));
      const req = mockReq({ params: { id: "t1" } });
      const res = mockRes();
      await controllers.deleteTask(req, res);
      expect(res.status.calledWith(500)).to.equal(true);
    });
    it("should not emit socket event when task not found", async function () {
      TaskFindOneAndDeleteStub.resolves(null);
      const req = mockReq({ params: { id: "ghost" } });
      const res = mockRes();
      await controllers.deleteTask(req, res);
      expect(IOEmitStub.called).to.equal(false);
    });
  });
});
