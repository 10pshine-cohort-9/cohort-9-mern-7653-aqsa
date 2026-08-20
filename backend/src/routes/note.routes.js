import express from "express";
import protect from "../middleware/auth.middleware.js";
import {createNote,getNotes,getNote,updateNote,deleteNote,toggleFavorite,addPage,updatePage,deletePage,} from "../controller/noteController.js";

const router = express.Router();
router.post("/", protect, createNote);
router.get("/", protect, getNotes);
router.get("/:id", protect, getNote);
router.put("/:id", protect, updateNote);
router.delete("/:id", protect, deleteNote);
router.patch("/:id/favorite", protect, toggleFavorite);
router.post("/:id/pages", protect, addPage);
router.put("/:id/pages/:pageId", protect, updatePage);
router.delete("/:id/pages/:pageId", protect, deletePage);

export default router;