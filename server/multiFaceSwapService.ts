import sharp from "sharp";
import fetch from "node-fetch";

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate crop box with margin around face
 */
function calculateCropBox(
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

/**
 * Crop face from image with margin
 */
export async function cropFace(
  imageUrl: string,
  faceBox: FaceBox,
  marginPercent: number = 1.5
): Promise<Buffer> {
  console.log("[MultiFaceSwap] Cropping face:", faceBox);

  // Download image
  const response = await fetch(imageUrl);
  const imageBuffer = Buffer.from(await response.arrayBuffer());

  // Get image dimensions
  const metadata = await sharp(imageBuffer).metadata();
  const imageWidth = metadata.width!;
  const imageHeight = metadata.height!;

  console.log("[MultiFaceSwap] Image dimensions:", imageWidth, "x", imageHeight);

  // Calculate crop box with margin
  const cropBox = calculateCropBox(faceBox, imageWidth, imageHeight, marginPercent);

  console.log("[MultiFaceSwap] Crop box with margin:", cropBox);

  // Crop image
  const croppedBuffer = await sharp(imageBuffer)
    .extract({
      left: cropBox.x,
      top: cropBox.y,
      width: cropBox.width,
      height: cropBox.height,
    })
    .toBuffer();

  console.log("[MultiFaceSwap] Cropped face size:", croppedBuffer.length, "bytes");

  return croppedBuffer;
}

/**
 * Composite swapped face back to original image
 */
export async function compositeFaceBack(
  originalImageUrl: string,
  swappedFaceBuffer: Buffer,
  faceBox: FaceBox,
  marginPercent: number = 1.5
): Promise<Buffer> {
  console.log("[MultiFaceSwap] Compositing face back to original:", faceBox);

  // Download original image
  const response = await fetch(originalImageUrl);
  const originalBuffer = Buffer.from(await response.arrayBuffer());

  // Get image dimensions
  const metadata = await sharp(originalBuffer).metadata();
  const imageWidth = metadata.width!;
  const imageHeight = metadata.height!;

  // Calculate crop box (same as when we cropped)
  const cropBox = calculateCropBox(faceBox, imageWidth, imageHeight, marginPercent);

  // Resize swapped face to match crop box dimensions
  const resizedFace = await sharp(swappedFaceBuffer)
    .resize(cropBox.width, cropBox.height, {
      fit: "cover",
      position: "center",
    })
    .toBuffer();

  console.log("[MultiFaceSwap] Resized swapped face to:", cropBox.width, "x", cropBox.height);

  // Composite swapped face onto original image
  const result = await sharp(originalBuffer)
    .composite([
      {
        input: resizedFace,
        top: cropBox.y,
        left: cropBox.x,
        blend: "over",
      },
    ])
    .toBuffer();

  console.log("[MultiFaceSwap] Composite complete, result size:", result.length, "bytes");

  return result;
}

/**
 * Process multiple faces in an image
 * For each face:
 * 1. Crop with margin
 * 2. Swap face (caller provides swap function)
 * 3. Composite back to original
 */
export async function processMultipleFaces(
  originalImageUrl: string,
  faceBoxes: FaceBox[],
  swapFaceFunction: (croppedFaceBuffer: Buffer) => Promise<Buffer>
): Promise<Buffer> {
  console.log("[MultiFaceSwap] Processing", faceBoxes.length, "faces");

   // Download original image
  const response = await fetch(originalImageUrl);
  let resultBuffer: Buffer = Buffer.from(await response.arrayBuffer()) as Buffer;

  // Process each face sequentially
  for (let i = 0; i < faceBoxes.length; i++) {
    const faceBox = faceBoxes[i];
    console.log(`[MultiFaceSwap] Processing face ${i + 1}/${faceBoxes.length}`);

    try {
      // 1. Crop face from current result
      const croppedFace = await cropFace(originalImageUrl, faceBox);

      // 2. Swap face (call external API)
      console.log(`[MultiFaceSwap] Swapping face ${i + 1}...`);
      const swappedFace = await swapFaceFunction(croppedFace);

      // 3. Composite swapped face back
      // Create temporary URL for current result
      const tempUrl = `data:image/jpeg;base64,${resultBuffer.toString("base64")}`;
      resultBuffer = await compositeFaceBack(tempUrl, swappedFace, faceBox);

      console.log(`[MultiFaceSwap] Face ${i + 1} complete`);
    } catch (error) {
      console.error(`[MultiFaceSwap] Error processing face ${i + 1}:`, error);
      throw error;
    }
  }

  console.log("[MultiFaceSwap] All faces processed successfully");
  return resultBuffer;
}
