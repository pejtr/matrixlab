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
    console.log('[Upload] Received upload request');
    
    if (!req.file) {
      console.error('[Upload] No file in request');
      return res.status(400).json({ error: "No file provided" });
    }

    console.log('[Upload] File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.buffer.length,
    });

    // Generate unique file key
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const extension = req.file.originalname.split('.').pop() || 'bin';
    const fileKey = `uploads/${timestamp}-${randomSuffix}.${extension}`;
    const contentType = req.file.mimetype;

    console.log('[Upload] Uploading to S3:', { fileKey, contentType, bufferSize: req.file.buffer.length });
    const result = await storagePut(fileKey, req.file.buffer, contentType);
    console.log('[Upload] Upload successful:', result);

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
