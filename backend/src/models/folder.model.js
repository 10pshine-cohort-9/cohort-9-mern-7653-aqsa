import mongoose from "mongoose";
const folderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    color: {
      type: String,
      default: "#0040df",
    },
  },
  {
    timestamps: true,
  }
);
folderSchema.index({ user: 1, name: 1 }, { unique: true });
const Folder = mongoose.model("Folder", folderSchema);
export default Folder;