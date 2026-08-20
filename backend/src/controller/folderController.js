import Folder from "../models/folder.model.js";
import Note from "../models/note.model.js";

export const getFolders = async (req, res) => {
  try {
    const folders = await Folder.find({ user: req.user._id }).sort({ name: 1 });
    const foldersWithCounts = await Promise.all(
      folders.map(async (folder) => {
        const count = await Note.countDocuments({
          user: req.user._id,
          folder: folder._id,
        });
        return {
          ...folder.toObject(),
          notesCount: count,
        };
      })
    );
    res.status(200).json({ folders: foldersWithCounts });
  } catch (error) {
    console.error("Get folders error:", error);
    res.status(500).json({ message: "Failed to fetch folders", error: error.message });
  }
};

export const createFolder = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Folder name is required" });
    }
    const existing = await Folder.findOne({
      user: req.user._id,
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (existing) {
      return res.status(400).json({ message: "A folder with this name already exists" });
    }
    const folder = await Folder.create({
      user: req.user._id,
      name: name.trim(),
      description: description?.trim() || "",
      color: color || "#0040df",
    });
    res.status(201).json({
      message: "Folder created successfully",
      folder: { ...folder.toObject(), notesCount: 0 },
    });
  } catch (error) {
    console.error("Create folder error:", error);
    res.status(500).json({ message: "Failed to create folder", error: error.message });
  }
};

export const deleteFolder = async (req, res) => {
  try {
    const folder = await Folder.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }
    await Note.updateMany(
      { user: req.user._id, folder: req.params.id },
      { $set: { folder: null } }
    );
    res.status(200).json({ message: "Folder deleted successfully" });
  } catch (error) {
    console.error("Delete folder error:", error);
    res.status(500).json({ message: "Failed to delete folder", error: error.message });
  }
};