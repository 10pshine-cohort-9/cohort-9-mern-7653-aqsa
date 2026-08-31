import Note from "../models/note.model.js";
import Task from "../models/task.model.js";
import Category from "../models/category.model.js";
import Folder from "../models/folder.model.js";
import cloudinary from "../config/cloudinary.js";
import mongoose from "mongoose";

const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

export const createNote = async (req, res) => {
  try {
    const { title, pages = [], categories = [], folder = null } = req.body;
    if (categories.length > 0) {
      const categoryCount = await Category.countDocuments({ _id: { $in: categories }, user: req.user._id });
      if (categoryCount !== categories.length) {
        return res.status(400).json({ message: "One or more categories are invalid" });
      }
    }
    if (folder) {
      const folderExists = await Folder.exists({ _id: folder, user: req.user._id });
      if (!folderExists) {
        return res.status(400).json({ message: "Invalid folder" });
      }
    }
    const note = await Note.create({
      user: req.user._id,
      title: title || "Untitled Note",
      pages,
      categories,
      folder: folder || null,
    });
    const populatedNote = await Note.findById(note._id)
      .populate("categories", "name")
      .populate("folder", "name color");
    res.status(201).json({ message: "Note created successfully", note: populatedNote });
  } catch (error) {
    console.error("Create note error:", error);
    res.status(500).json({ message: "Failed to create note", error: error.message });
  }
};

export const getNotes = async (req, res) => {
  try {
    const { search, category, folder, favorite, page = 1, limit = 20 } = req.query;
    const query = { user: req.user._id };
    if (search) {
      const sanitizedSearch = String(search).trim().slice(0, 100);
      const searchRegex = { $regex: escapeRegex(sanitizedSearch), $options: "i" };
      query.$or = [
        { title: searchRegex },
        { "pages.objects.content": searchRegex },
      ];
    }
    if (category) {
      query.categories = category;
    }
    if (folder) {
      query.folder = folder;
    }
    if (favorite === "true") {
      query.isFavorite = true;
    }
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;
    const [notes, total] = await Promise.all([
      Note.find(query)
        .select("-pages")
        .populate("categories", "name")
        .populate("folder", "name color")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      Note.countDocuments(query),
    ]);
    res.status(200).json({
      notes,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error("Get notes error:", error);
    res.status(500).json({ message: "Failed to get notes", error: error.message });
  }
};

export const getNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id })
      .populate("categories", "name")
      .populate("folder", "name color");
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    res.status(200).json({ note });
  } catch (error) {
    console.error("Get note error:", error);
    res.status(500).json({ message: "Failed to get note", error: error.message });
  }
};

export const updateNote = async (req, res) => {
  try {
    const { title, categories, folder, pages } = req.body;
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    if (categories !== undefined) {
      if (categories.length > 0) {
        const categoryCount = await Category.countDocuments({ _id: { $in: categories }, user: req.user._id });
        if (categoryCount !== categories.length) {
          return res.status(400).json({ message: "One or more categories are invalid" });
        }
      }
      note.categories = categories;
    }
    if (folder !== undefined) {
      if (folder) {
        const folderExists = await Folder.exists({ _id: folder, user: req.user._id });
        if (!folderExists) {
          return res.status(400).json({ message: "Invalid folder" });
        }
      }
      note.folder = folder || null;
    }
    if (title !== undefined) {
      note.title = title;
    }
    const oldPages = note.pages;
    if (pages !== undefined) {
      note.pages = pages;
    }
    await note.save();
    if (pages !== undefined) {
      await deleteRemovedCloudinaryMedia(oldPages, pages, req.user._id);
    }
    const updatedNote = await Note.findById(note._id)
      .populate("categories", "name")
      .populate("folder", "name color");
    res.status(200).json({ message: "Note updated successfully", note: updatedNote });
  } catch (error) {
    console.error("Update note error:", error);
    res.status(500).json({ message: "Failed to update note", error: error.message });
  }
};

export const addPage = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
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
    console.error("Add page error:", error);
    res.status(500).json({ message: "Failed to add page", error: error.message });
  }
};

export const updatePage = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    const page = note.pages.id(req.params.pageId);
    if (!page) {
      return res.status(404).json({ message: "Page not found" });
    }
    const { width, height, sizePreset, orientation, background, objects } = req.body;
    const oldPageObj = page.toObject();
    if (objects !== undefined) {
      page.objects = objects;
    }
    if (width !== undefined) page.width = width;
    if (height !== undefined) page.height = height;
    if (sizePreset !== undefined) page.sizePreset = sizePreset;
    if (orientation !== undefined) page.orientation = orientation;
    if (background !== undefined) page.background = background;
    await note.save();
    if (objects !== undefined) {
      await deleteRemovedCloudinaryMedia([oldPageObj], [{ ...oldPageObj, objects }], req.user._id);
    }
    res.status(200).json({ message: "Page updated successfully", page });
  } catch (error) {
    console.error("Update page error:", error);
    res.status(500).json({ message: "Failed to update page", error: error.message });
  }
};

export const deletePage = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    const page = note.pages.id(req.params.pageId);
    if (!page) {
      return res.status(404).json({ message: "Page not found" });
    }
    const pageObj = page.toObject();
    page.deleteOne();
    await note.save();
    await deleteMediaFromPages([pageObj], req.user._id);
    res.status(200).json({ message: "Page deleted successfully" });
  } catch (error) {
    console.error("Delete page error:", error);
    res.status(500).json({ message: "Failed to delete page", error: error.message });
  }
};

export const deleteNote = async (req, res) => {
  let session;
  try {
    session = await mongoose.startSession();
    let pagesCopy;
    await session.withTransaction(async () => {
      const note = await Note.findOne({
        _id: req.params.id,
        user: req.user._id,
      }).session(session);
      if (!note) {
        const error = new Error("Note not found");
        error.statusCode = 404;
        throw error;
      }
      pagesCopy = note.pages;
      await Task.updateMany(
        { note: note._id },
        { $set: { note: null } },
        { session }
      );
      await note.deleteOne({ session });
    });
    await deleteMediaFromPages(pagesCopy, req.user._id);
    return res.status(200).json({
      message: "Note and its media deleted successfully",
    });
  } catch (error) {
    console.error("DELETE NOTE ERROR:");
    console.error(error);
    console.error(error.stack);
    if (error.statusCode === 404) {
      return res.status(404).json({
        message: "Note not found",
      });
    }
    return res.status(500).json({
      message: "Failed to delete note",
      error: error.message,
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

export const toggleFavorite = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
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
    console.error("Toggle favorite error:", error);
    res.status(500).json({ message: "Failed to update favorite", error: error.message });
  }
};

const deleteRemovedCloudinaryMedia = async (oldPages, newPages, userId) => {
  const oldMedia = [];
  for (const page of oldPages) {
    for (const object of page.objects || []) {
      if (["image", "audio", "video"].includes(object.type) && object.publicId) {
        oldMedia.push({ publicId: object.publicId, resourceType: object.resourceType });
      }
    }
  }
  const newPublicIds = new Set();
  for (const page of newPages) {
    for (const object of page.objects || []) {
      if (["image", "audio", "video"].includes(object.type) && object.publicId) {
        newPublicIds.add(object.publicId);
      }
    }
  }
  const removedMedia = oldMedia.filter((media) => !newPublicIds.has(media.publicId));
  for (const media of removedMedia) {
    try {
      await cloudinary.uploader.destroy(media.publicId, {
        resource_type: media.resourceType || "image",
      });
    } catch (error) {
      console.error(`Failed to delete Cloudinary file: ${media.publicId}`, error);
    }
  }
};

const deleteMediaFromPages = async (pages, userId) => {
  for (const page of pages) {
    for (const object of page.objects || []) {
      if (["image", "audio", "video"].includes(object.type) && object.publicId) {
        try {
          await cloudinary.uploader.destroy(object.publicId, {
            resource_type: object.resourceType || "image",
          });
        } catch (error) {
          console.error(`Failed to delete Cloudinary file: ${object.publicId}`, error);
        }
      }
    }
  }
};