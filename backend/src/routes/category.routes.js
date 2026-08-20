import express from "express";
import protect from "../middleware/auth.middleware.js";
import {getCategories,createCategory,deleteCategory} from "../controller/categoryController.js";
const router = express.Router();
router.get("/", protect, getCategories);
router.post("/", protect, createCategory);
router.delete("/:id", protect, deleteCategory);

export default router;