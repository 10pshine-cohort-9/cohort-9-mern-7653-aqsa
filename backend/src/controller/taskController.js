import Task from "../models/task.model.js";
import { getIO } from "../config/socket.js";

export const getTasks = async (req, res) => {
  try {
    const { completed, dueDate } = req.query;
    const query = { user: req.user._id };
    if (completed !== undefined) {
      query.completed = completed === "true";
    }
    if (dueDate) {
      const start = new Date(dueDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dueDate);
      end.setHours(23, 59, 59, 999);
      query.dueDate = { $gte: start, $lte: end };
    }
    const tasks = await Task.find(query)
      .populate("note", "title")
      .sort({ createdAt: -1 });
    res.status(200).json({ tasks });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ message: "Failed to get tasks", error: error.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description = "", dueDate = null, priority = "Medium", note = null } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }
    const task = await Task.create({
      user: req.user._id,
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate ? new Date(dueDate) : null,
      priority,
      note: note || null,
    });
    const populatedTask = await Task.findById(task._id).populate("note", "title");
    getIO().to(req.user._id.toString()).emit("task_created", populatedTask);
    res.status(201).json({ message: "Task created successfully", task: populatedTask });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ message: "Failed to create task", error: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { title, description, completed, dueDate, priority, note } = req.body;
    if (title !== undefined && (!title || !title.trim())) {
      return res.status(400).json({ message: "Task title cannot be empty" });
    }
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
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
    const populatedTask = await Task.findById(task._id).populate("note", "title");
    getIO().to(req.user._id.toString()).emit("task_updated", populatedTask);
    res.status(200).json({ message: "Task updated successfully", task: populatedTask });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ message: "Failed to update task", error: error.message });
  }
};

export const toggleTaskStatus = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      [ { $set: { completed: { $not: "$completed" } } } ],
      { new: true, updatePipeline: true } // <-- Add updatePipeline: true here
    ).populate("note", "title");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    getIO().to(req.user._id.toString()).emit("task_updated", task);
    res.status(200).json({
      message: task.completed ? "Task completed" : "Task marked pending",
      task,
    });
  } catch (error) {
    console.error("Toggle task error:", error);
    res.status(500).json({ message: "Failed to toggle task", error: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    getIO().to(req.user._id.toString()).emit("task_deleted", req.params.id);
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ message: "Failed to delete task", error: error.message });
  }
};