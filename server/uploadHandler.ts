import { Router } from "express";
import multer from "multer";
import { storagePut } from "./storage";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

// Handle file upload
router.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Generate unique file key
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const extension = req.file.originalname.split('.').pop() || 'bin';
    const fileKey = `uploads/${timestamp}-${randomSuffix}.${extension}`;
    const contentType = req.file.mimetype;

    const result = await storagePut(fileKey, req.file.buffer, contentType);

    res.json({
      success: true,
      url: result.url,
      key: result.key,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
