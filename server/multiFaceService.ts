/**
 * Multi-Face Processing Service
 * Handles face detection, cropping, swapping, and compositing for multiple faces
 */

import sharp from "sharp";
import fetch from "node-fetch";
import { performFaceSwap, FaceSwapResult } from "./replicateService.js";

export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface MultiFaceSwapInput {
  sourceImageUrl: string;
  targetImageUrl: string;
  faceBoxes: FaceBoundingBox[];
  modelPreference?: "high_quality" | "permissive";
  webhookUrl?: string;
}

export interface MultiFaceSwapResult {
  success: boolean;
  outputBuffer?: Buffer;
  error?: string;
  processedFaces: number;
}

/**
 * Download image from URL
 */
async function downloadImage(url: string): Promise<Buffer> {
  console.log(`[MultiFace] Downloading image from ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Crop face region with margin
 */
async function cropFaceWithMargin(
  imageBuffer: Buffer,
  bbox: FaceBoundingBox,
  marginPercent: number = 50
): Promise<{ buffer: Buffer; cropX: number; cropY: number; cropWidth: number; cropHeight: number }> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  
  if (!metadata.width || !metadata.height) {
    throw new Error("Failed to get image dimensions");
  }

  // Calculate margin
  const marginX = Math.floor((bbox.width * marginPercent) / 100);
  const marginY = Math.floor((bbox.height * marginPercent) / 100);

  // Calculate crop region with margin (clamped to image bounds)
  const cropX = Math.max(0, Math.floor(bbox.x - marginX));
  const cropY = Math.max(0, Math.floor(bbox.y - marginY));
  const cropWidth = Math.min(
    metadata.width - cropX,
    Math.floor(bbox.width + marginX * 2)
  );
  const cropHeight = Math.min(
    metadata.height - cropY,
    Math.floor(bbox.height + marginY * 2)
  );

  console.log(`[MultiFace] Cropping face: x=${cropX}, y=${cropY}, w=${cropWidth}, h=${cropHeight}`);

  const croppedBuffer = await image
    .extract({
      left: cropX,
      top: cropY,
      width: cropWidth,
      height: cropHeight,
    })
    .jpeg({ quality: 95 })
    .toBuffer();

  return { buffer: croppedBuffer, cropX, cropY, cropWidth, cropHeight };
}

/**
 * Upload buffer to temporary storage and get URL
 * Uses Replicate's file upload endpoint
 */
async function uploadBufferToReplicate(buffer: Buffer): Promise<string> {
  // Convert buffer to base64 data URL
  const base64 = buffer.toString("base64");
  const dataUrl = `data:image/jpeg;base64,${base64}`;
  return dataUrl;
}

/**
 * Composite swapped face back to original image
 */
async function compositeFaceBack(
  originalBuffer: Buffer,
  swappedFaceBuffer: Buffer,
  cropX: number,
  cropY: number,
  cropWidth: number,
  cropHeight: number
): Promise<Buffer> {
  console.log(`[MultiFace] Compositing face back at x=${cropX}, y=${cropY}`);

  // Resize swapped face to match crop dimensions
  const resizedSwappedFace = await sharp(swappedFaceBuffer)
    .resize(cropWidth, cropHeight, {
      fit: "cover",
      position: "center",
    })
    .toBuffer();

  // Composite swapped face onto original image
  const result = await sharp(originalBuffer)
    .composite([
      {
        input: resizedSwappedFace,
        top: cropY,
        left: cropX,
        blend: "over",
      },
    ])
    .jpeg({ quality: 95 })
    .toBuffer();

  return result;
}

/**
 * Process multiple faces in an image
 * For each face: crop → swap → composite back
 */
export async function processMultiFaceSwap(
  input: MultiFaceSwapInput
): Promise<MultiFaceSwapResult> {
  try {
    console.log(`[MultiFace] Starting multi-face swap with ${input.faceBoxes.length} face(s)`);

    // Download original target image
    const targetBuffer = await downloadImage(input.targetImageUrl);
    let currentBuffer = targetBuffer;

    let processedFaces = 0;

    // Process each face sequentially
    for (let i = 0; i < input.faceBoxes.length; i++) {
      const bbox = input.faceBoxes[i];
      console.log(`[MultiFace] Processing face ${i + 1}/${input.faceBoxes.length} (confidence: ${bbox.confidence.toFixed(2)})`);

      try {
        // Step 1: Crop face region from CURRENT image (with previous faces already swapped)
        const { buffer: faceCropBuffer, cropX, cropY, cropWidth, cropHeight } = 
          await cropFaceWithMargin(currentBuffer, bbox, 50);

        // Step 2: Upload face crop to get URL
        const faceCropUrl = await uploadBufferToReplicate(faceCropBuffer);

        // Step 3: Perform face swap on cropped face
        console.log(`[MultiFace] Swapping face ${i + 1}...`);
        const swapResult: FaceSwapResult = await performFaceSwap({
          sourceImageUrl: input.sourceImageUrl,
          targetMediaUrl: faceCropUrl,
          targetMediaType: "image",
          modelPreference: input.modelPreference,
          webhookUrl: undefined, // No webhook for individual face swaps
        });

        if (!swapResult.success || !swapResult.outputUrl) {
          console.error(`[MultiFace] Failed to swap face ${i + 1}:`, swapResult.error);
          continue; // Skip this face, continue with others
        }

        // Step 4: Download swapped face
        const swappedFaceBuffer = await downloadImage(swapResult.outputUrl);

        // Step 5: Composite swapped face back to current image
        currentBuffer = await compositeFaceBack(
          currentBuffer,
          swappedFaceBuffer,
          cropX,
          cropY,
          cropWidth,
          cropHeight
        );

        processedFaces++;
        console.log(`[MultiFace] ✓ Face ${i + 1} swapped successfully`);
      } catch (error) {
        console.error(`[MultiFace] Error processing face ${i + 1}:`, error);
        // Continue with other faces
      }
    }

    if (processedFaces === 0) {
      return {
        success: false,
        error: "Failed to process any faces",
        processedFaces: 0,
      };
    }

    console.log(`[MultiFace] ✓ Multi-face swap complete: ${processedFaces}/${input.faceBoxes.length} faces processed`);

    return {
      success: true,
      outputBuffer: currentBuffer,
      processedFaces,
    };
  } catch (error: any) {
    console.error("[MultiFace] Error:", error);
    return {
      success: false,
      error: error.message || "Unknown error during multi-face swap",
      processedFaces: 0,
    };
  }
}
