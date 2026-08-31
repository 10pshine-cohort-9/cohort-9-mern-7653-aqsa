import mongoose from "mongoose";

const objectSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["text", "drawing", "image", "audio", "video", "shape"], required: true },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 200 },
    height: { type: Number, default: 100 },
    rotation: { type: Number, default: 0 },
    scaleX: { type: Number, default: 1 },
    scaleY: { type: Number, default: 1 },
    zIndex: { type: Number, default: 0 },
    locked: { type: Boolean, default: false },
    content: { type: String, default: "" },
    drawing: { type: mongoose.Schema.Types.Mixed, default: null },
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
    resourceType: { type: String, default: "" },
    filename: { type: String, default: "" },
    size: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    crop: { type: mongoose.Schema.Types.Mixed, default: null },
    style: { type: mongoose.Schema.Types.Mixed, default: {} },
    charStyles: { type: mongoose.Schema.Types.Mixed, default: {} }, 
  },
  { _id: true, timestamps: true }
);

const pageSchema = new mongoose.Schema(
  {
    width: { type: Number, default: 794 },
    height: { type: Number, default: 1123 },
    sizePreset: { type: String, default: "A4" },
    orientation: { type: String, enum: ["portrait", "landscape"], default: "portrait" },
    background: { type: mongoose.Schema.Types.Mixed, default: { type: "color", value: "#ffffff" } },
    objects: { type: [objectSchema], default: [] },
  },
  { _id: true, timestamps: true }
);

const noteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, trim: true, default: "Untitled Note" },
    pages: { type: [pageSchema], default: [] },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    folder: { type: mongoose.Schema.Types.ObjectId, ref: "Folder", default: null },
    isFavorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Note = mongoose.model("Note", noteSchema);

export default Note;