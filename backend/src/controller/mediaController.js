export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }
    res.status(201).json({
      message: "File uploaded successfully",
      file: {
        url: req.file.path,
        publicId: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        resourceType: req.file.resource_type,
        duration: req.file.duration || null,
      },
    });
  } catch (error) {
    console.error("Upload media error details:", {
      message: error.message,
      http_code: error.http_code,
      stack: error.stack,
    });
    res.status(500).json({
      message: error.message || "Failed to upload media",
    });
  }
};