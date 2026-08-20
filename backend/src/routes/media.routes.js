import express from "express";
import upload from "../middleware/upload.middleware.js";
import { uploadMedia } from "../controller/mediaController.js";

const router = express.Router();
router.post("/", upload.single("file"), uploadMedia);
export default router;