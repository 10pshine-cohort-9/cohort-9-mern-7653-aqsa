import express from "express";
import protect from "../middleware/auth.middleware.js";
import {getStickies,createSticky,updateSticky,deleteSticky,} from "../controller/stickyController.js";

const router = express.Router();
router.get("/", protect, getStickies);
router.post("/", protect, createSticky);
router.put("/:id", protect, updateSticky);
router.delete("/:id", protect, deleteSticky);
export default router;