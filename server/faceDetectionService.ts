import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Detect face in image using Replicate face detection model
 * Returns bounding box coordinates for the first detected face
 */
export async function detectFace(imageUrl: string): Promise<FaceBox | null> {
  try {
    console.log("[FaceDetection] Detecting face in image:", imageUrl);

    // Use Replicate face detection model
    const output = await replicate.run(
      "andreasjansson/face-detection:7a4e1c9f8f8e8e8e8e8e8e8e8e8e8e8e",
      {
        input: {
          image: imageUrl,
        },
      }
    ) as any;

    console.log("[FaceDetection] Raw output:", JSON.stringify(output));

    // Parse output - expecting array of face detections
    if (!output || !Array.isArray(output) || output.length === 0) {
      console.warn("[FaceDetection] No faces detected in image");
      return null;
    }

    // Get first face
    const face = output[0];
    
    // Extract bounding box coordinates
    // Format depends on model output, adjust as needed
    const box: FaceBox = {
      x: face.x || face.left || 0,
      y: face.y || face.top || 0,
      width: face.width || face.w || 0,
      height: face.height || face.h || 0,
    };

    console.log("[FaceDetection] Face detected:", box);
    return box;
  } catch (error) {
    console.error("[FaceDetection] Error detecting face:", error);
    return null;
  }
}

/**
 * Calculate crop box with margin around face
 * @param face Face bounding box
 * @param imageWidth Original image width
 * @param imageHeight Original image height
 * @param marginPercent Margin around face (e.g., 1.5 = 150%)
 */
export function calculateCropBox(
  face: FaceBox,
  imageWidth: number,
  imageHeight: number,
  marginPercent: number = 1.5
): FaceBox {
  // Calculate center of face
  const centerX = face.x + face.width / 2;
  const centerY = face.y + face.height / 2;

  // Calculate new dimensions with margin
  const newWidth = face.width * marginPercent;
  const newHeight = face.height * marginPercent;

  // Calculate new top-left corner (centered on face)
  let x = Math.floor(centerX - newWidth / 2);
  let y = Math.floor(centerY - newHeight / 2);

  // Ensure crop box stays within image bounds
  x = Math.max(0, x);
  y = Math.max(0, y);

  const width = Math.min(newWidth, imageWidth - x);
  const height = Math.min(newHeight, imageHeight - y);

  return {
    x: Math.floor(x),
    y: Math.floor(y),
    width: Math.floor(width),
    height: Math.floor(height),
  };
}
