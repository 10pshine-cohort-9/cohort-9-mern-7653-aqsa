import express from "express";
import protect from "../middleware/auth.middleware.js";
import {getFolders,createFolder,deleteFolder} from "../controller/folderController.js";

const router = express.Router();
router.get("/", protect,getFolders);
router.post("/", protect,createFolder);
router.delete("/:id", protect,deleteFolder);

export default router;