import express from "express";
import upload from "../middleware/upload.middleware.js";
import  protect  from "../middleware/auth.middleware.js";
import { uploadMedia } from "../controller/mediaController.js";
const router = express.Router();
router.post("/", protect, upload.single("file"), uploadMedia);

export default router;