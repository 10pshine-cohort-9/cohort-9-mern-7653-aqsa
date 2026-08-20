import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "notes-app",
    resource_type: "auto",
    allowed_formats: [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "gif",
      "mp3",
      "wav",
      "m4a",
      "mp4",
      "webm",
      "mov",
    ],
  },
});
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});
export default upload;