import Sticky from "../models/sticky.model.js";
import { getIO } from "../config/socket.js";

export const getStickies = async (req, res) => {
  try {
    const stickies = await Sticky.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.status(200).json({ stickies });
  } catch (error) {
    res.status(500).json({ message: "Failed to get sticky notes", error: error.message });
  }
};

export const createSticky = async (req, res) => {
  try {
    const { title = "", content, color, position } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Note content is required" });
    }
    const sticky = await Sticky.create({
      user: req.user._id,
      title: title.trim(),
      content: content.trim(),
      color: color || "#fef08a",
      position: position || { x: 0, y: 0 },
    });
    getIO().to(req.user._id.toString()).emit("sticky_created", sticky);
    res.status(201).json({ message: "Sticky note created", sticky });
  } catch (error) {
    res.status(500).json({ message: "Failed to create sticky note", error: error.message });
  }
};

export const updateSticky = async (req, res) => {
  try {
    const { title, content, color, position } = req.body;
    const sticky = await Sticky.findOne({ _id: req.params.id, user: req.user._id });
    if (!sticky) return res.status(404).json({ message: "Sticky note not found" });
    if (title !== undefined) sticky.title = title.trim();
    if (content !== undefined) sticky.content = content.trim();
    if (color !== undefined) sticky.color = color;
    if (position !== undefined) sticky.position = position;
    await sticky.save();
    getIO().to(req.user._id.toString()).emit("sticky_updated", sticky);
    res.status(200).json({ message: "Sticky note updated", sticky });
  } catch (error) {
    res.status(500).json({ message: "Failed to update sticky note", error: error.message });
  }
};

export const deleteSticky = async (req, res) => {
  try {
    const sticky = await Sticky.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!sticky) return res.status(404).json({ message: "Sticky note not found" });
    getIO().to(req.user._id.toString()).emit("sticky_deleted", req.params.id);
    res.status(200).json({ message: "Sticky note deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete sticky note", error: error.message });
  }
};