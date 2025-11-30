/**
 * Face Detection Service using MediaPipe
 * Detects faces in images and returns bounding boxes for cropping
 */

import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

let faceDetector: FaceDetector | null = null;
let isInitializing = false;

export interface FaceBoundingBox {
  x: number; // top-left x
  y: number; // top-left y
  width: number;
  height: number;
  confidence: number;
}

/**
 * Initialize MediaPipe Face Detector (singleton)
 */
async function initializeFaceDetector(): Promise<FaceDetector> {
  if (faceDetector) {
    return faceDetector;
  }

  if (isInitializing) {
    // Wait for initialization to complete
    await new Promise((resolve) => setTimeout(resolve, 100));
    return initializeFaceDetector();
  }

  isInitializing = true;

  try {
    console.log("[FaceDetection] Initializing MediaPipe...");
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
        delegate: "GPU",
      },
      runningMode: "IMAGE",
      minDetectionConfidence: 0.5,
    });

    console.log("[FaceDetection] MediaPipe initialized successfully");
    return faceDetector;
  } catch (error) {
    console.error("[FaceDetection] Failed to initialize:", error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

/**
 * Detect faces in an image and return bounding boxes
 * @param imageElement - HTMLImageElement or HTMLCanvasElement
 * @param maxFaces - Maximum number of faces to detect (default: 5)
 * @returns Array of face bounding boxes sorted by confidence
 */
export async function detectFaces(
  imageElement: HTMLImageElement | HTMLCanvasElement,
  maxFaces: number = 5
): Promise<FaceBoundingBox[]> {
  try {
    const detector = await initializeFaceDetector();

    console.log("[FaceDetection] Detecting faces...");
    const detections = detector.detect(imageElement);

    if (!detections.detections || detections.detections.length === 0) {
      console.log("[FaceDetection] No faces detected");
      return [];
    }

    console.log(`[FaceDetection] Found ${detections.detections.length} face(s)`);

    // Convert MediaPipe detections to our format
    const faces: FaceBoundingBox[] = detections.detections
      .slice(0, maxFaces)
      .map((detection) => {
        const bbox = detection.boundingBox;
        if (!bbox) {
          return null;
        }

        return {
          x: bbox.originX,
          y: bbox.originY,
          width: bbox.width,
          height: bbox.height,
          confidence: detection.categories?.[0]?.score || 0,
        };
      })
      .filter((face): face is FaceBoundingBox => face !== null)
      .sort((a, b) => b.confidence - a.confidence); // Sort by confidence descending

    return faces;
  } catch (error) {
    console.error("[FaceDetection] Error detecting faces:", error);
    throw error;
  }
}

/**
 * Crop face region from image with margin
 * @param imageElement - Source image
 * @param bbox - Face bounding box
 * @param marginPercent - Margin around face as percentage of face size (default: 50%)
 * @returns Canvas with cropped face
 */
export function cropFaceWithMargin(
  imageElement: HTMLImageElement | HTMLCanvasElement,
  bbox: FaceBoundingBox,
  marginPercent: number = 50
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // Calculate margin
  const marginX = (bbox.width * marginPercent) / 100;
  const marginY = (bbox.height * marginPercent) / 100;

  // Calculate crop region with margin (clamped to image bounds)
  const cropX = Math.max(0, bbox.x - marginX);
  const cropY = Math.max(0, bbox.y - marginY);
  const cropWidth = Math.min(
    imageElement.width - cropX,
    bbox.width + marginX * 2
  );
  const cropHeight = Math.min(
    imageElement.height - cropY,
    bbox.height + marginY * 2
  );

  // Set canvas size to crop region
  canvas.width = cropWidth;
  canvas.height = cropHeight;

  // Draw cropped region
  ctx.drawImage(
    imageElement,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );

  return canvas;
}

/**
 * Composite swapped face back to original image at specified position
 * @param originalImage - Original full image
 * @param swappedFaceCanvas - Swapped face crop
 * @param bbox - Original face bounding box
 * @param marginPercent - Margin used during cropping
 * @returns Canvas with face composited back
 */
export function compositeFaceBack(
  originalImage: HTMLImageElement | HTMLCanvasElement,
  swappedFaceCanvas: HTMLCanvasElement,
  bbox: FaceBoundingBox,
  marginPercent: number = 50
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // Set canvas to original image size
  canvas.width = originalImage.width;
  canvas.height = originalImage.height;

  // Draw original image
  ctx.drawImage(originalImage, 0, 0);

  // Calculate position to paste swapped face
  const marginX = (bbox.width * marginPercent) / 100;
  const marginY = (bbox.height * marginPercent) / 100;
  const pasteX = Math.max(0, bbox.x - marginX);
  const pasteY = Math.max(0, bbox.y - marginY);

  // Draw swapped face on top
  ctx.drawImage(swappedFaceCanvas, pasteX, pasteY);

  return canvas;
}

/**
 * Convert canvas to Blob for upload
 */
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string = "image/jpeg",
  quality: number = 0.95
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Load image from File or URL
 */
export async function loadImage(source: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));

    if (typeof source === "string") {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(source);
    }
  });
}
