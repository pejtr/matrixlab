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
  onProgress?: (progress: number) => Promise<void>; // Progress callback (0-100)
  preserveBody?: boolean; // If true, return only face cutout (Protect mode)
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
 * Crop face region with margin and apply oval mask
 * Only the face (oval shape) is visible, body is completely hidden
 */
async function cropFaceWithMargin(
  imageBuffer: Buffer,
  bbox: FaceBoundingBox,
  marginPercent: number = 80  // 80% margin for better face detection context
): Promise<{ buffer: Buffer; cropX: number; cropY: number; cropWidth: number; cropHeight: number }> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  
  if (!metadata.width || !metadata.height) {
    throw new Error("Failed to get image dimensions");
  }

  // Calculate margin (80% = enough context for face detection + oval mask)
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

  console.log(`[MultiFace] Cropping face with ${marginPercent}% margin: x=${cropX}, y=${cropY}, w=${cropWidth}, h=${cropHeight}`);

  // Extract rectangular crop first
  const rectCrop = await image
    .extract({
      left: cropX,
      top: cropY,
      width: cropWidth,
      height: cropHeight,
    })
    .toBuffer();

  // Create oval mask (ellipse) to hide body
  // Oval is taller than wide (1:1.3 ratio) to follow face shape
  const centerX = cropWidth / 2;
  const centerY = cropHeight / 2;
  const radiusX = (cropWidth / 2) * 0.55;  // 55% of crop width - enough for face detection
  const radiusY = (cropHeight / 2) * 0.55 * 1.3; // 55% * 1.3 = taller oval
  
  console.log(`[MultiFace] 🔍 OVAL MASK DEBUG:`);
  console.log(`[MultiFace]   - Crop dimensions: ${cropWidth}x${cropHeight}px`);
  console.log(`[MultiFace]   - Oval center: (${centerX}, ${centerY})`);
  console.log(`[MultiFace]   - Oval radius: ${radiusX}x${radiusY}px (55% of crop)`);
  console.log(`[MultiFace]   - Oval will show only ${(0.55 * 100).toFixed(0)}% of crop area`)

  // Create blurred background from original crop
  // This will look more natural than solid color and hide body details
  const blurredBackground = await sharp(rectCrop)
    .blur(50) // Heavy blur to hide body details
    .toBuffer();
  
  console.log(`[MultiFace] 🌫️  Created blurred background from original image`); 
  // Create oval mask (white inside oval, black outside with feathered edges)
  const ovalMask = Buffer.from(
    `<svg width="${cropWidth}" height="${cropHeight}">
      <rect width="${cropWidth}" height="${cropHeight}" fill="black" />
      <defs>
        <radialGradient id="fade" cx="50%" cy="50%" r="50%">
          <stop offset="85%" stop-color="white" stop-opacity="1" />
          <stop offset="100%" stop-color="black" stop-opacity="1" />
        </radialGradient>
      </defs>
      <ellipse cx="${centerX}" cy="${centerY}" rx="${radiusX}" ry="${radiusY}" fill="url(#fade)" />
    </svg>`
  );

  // Composite: blurred background + original image (masked by oval)
  // This keeps face visible inside oval, blurred background outside
  const maskedBuffer = await sharp(blurredBackground)
    .composite([
      {
        input: await sharp(rectCrop)
          .composite([{
            input: ovalMask,
            blend: "dest-in" // Keep only pixels inside oval
          }])
          .toBuffer(),
        blend: "over",
      },
    ])
    .jpeg({ quality: 95 }) // Use JPEG - no transparency needed
    .toBuffer();

  console.log(`[MultiFace] ✓ Applied oval mask - sharp face inside oval, blurred background outside`);
  
  // DEBUG: Save final image to disk for inspection
  const debugPath = `/home/ubuntu/debug-oval-mask-${Date.now()}.jpg`;
  await sharp(maskedBuffer).jpeg({ quality: 95 }).toFile(debugPath);
  console.log(`[MultiFace] 🖼️  DEBUG: Saved final masked image to ${debugPath}`);

  // Return full masked buffer (no tight cropping)
  // This sends the entire crop area with blurred background - no black borders
  return { buffer: maskedBuffer, cropX, cropY, cropWidth, cropHeight };
}

/**
 * Upload buffer to S3 and get public URL
 * This ensures Replicate API can download the actual cropped face image
 */
async function uploadBufferToS3(buffer: Buffer): Promise<string> {
  const { storagePut } = await import("./storage.js");
  
  // Generate unique key for temporary face crop
  const tempKey = `temp/face-crop-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
  
  console.log(`[MultiFace] Uploading cropped face to S3: ${tempKey}`);
  
  // Upload to S3 and get public URL
  const { url } = await storagePut(tempKey, buffer, "image/png");
  
  console.log(`[MultiFace] ✓ Face crop uploaded to S3: ${url}`);
  
  return url;
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
  // Use "fill" to stretch/fit entire face without cropping
  const resizedSwappedFace = await sharp(swappedFaceBuffer)
    .resize(cropWidth, cropHeight, {
      fit: "fill",  // Stretch to fit exact dimensions (preserve entire face)
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
    
    // FALLBACK: If no faces detected, use center of image as "face"
    let facesToProcess = input.faceBoxes;
    if (facesToProcess.length === 0) {
      console.log(`[MultiFace] ⚠️  No faces detected - using center of image as fallback`);
      const metadata = await sharp(targetBuffer).metadata();
      const imageWidth = metadata.width!;
      const imageHeight = metadata.height!;
      
      // Create a "face box" covering center 40% of image
      const faceWidth = Math.floor(imageWidth * 0.4);
      const faceHeight = Math.floor(imageHeight * 0.4);
      const faceX = Math.floor((imageWidth - faceWidth) / 2);
      const faceY = Math.floor((imageHeight - faceHeight) / 2);
      
      facesToProcess = [{
        x: faceX,
        y: faceY,
        width: faceWidth,
        height: faceHeight,
        confidence: 0.5 // Low confidence to indicate fallback
      }];
      
      console.log(`[MultiFace] Created fallback face box: x=${faceX}, y=${faceY}, w=${faceWidth}, h=${faceHeight}`);
    }

    // Process each face sequentially
    for (let i = 0; i < facesToProcess.length; i++) {
      const bbox = facesToProcess[i];
      console.log(`[MultiFace] Processing face ${i + 1}/${facesToProcess.length} (confidence: ${bbox.confidence.toFixed(2)})`);

      // Report progress for this face (divide 100% by number of faces)
      const faceProgress = Math.floor((i / facesToProcess.length) * 100);
      if (input.onProgress) {
        await input.onProgress(faceProgress);
      }

      try {
        // Step 1: Crop face region from CURRENT image (with previous faces already swapped)
        // Using 80% margin with oval mask - enough context for face detection
        const { buffer: faceCropBuffer, cropX, cropY, cropWidth, cropHeight } = 
          await cropFaceWithMargin(currentBuffer, bbox, 80);

        // Step 2: Upload face crop to S3 to get public URL
        const faceCropUrl = await uploadBufferToS3(faceCropBuffer);

        // Step 3: Perform face swap on cropped face
        console.log(`[MultiFace] Swapping face ${i + 1}...`);
        const swapResult: FaceSwapResult = await performFaceSwap({
          sourceImageUrl: input.sourceImageUrl,
          targetMediaUrl: faceCropUrl,
          targetMediaType: "image",
          modelPreference: input.modelPreference,
          webhookUrl: input.webhookUrl, // Pass webhook URL from input
        });

        if (!swapResult.success || !swapResult.outputUrl) {
          console.error(`[MultiFace] Failed to swap face ${i + 1}:`, swapResult.error);
          continue; // Skip this face, continue with others
        }

        // Step 4: Download swapped face
        const swappedFaceBuffer = await downloadImage(swapResult.outputUrl);

        // Step 5: Composite swapped face back to current image
        // In Protect mode: API received face-only crop and returned swapped face
        // We still need to composite it back to preserve the original body
        currentBuffer = await compositeFaceBack(
          currentBuffer,
          swappedFaceBuffer,
          cropX,
          cropY,
          cropWidth,
          cropHeight
        );
        
        if (input.preserveBody) {
          console.log(`[MultiFace] 🔒 Protect mode: Composited swapped face back to original body`);
        }

        processedFaces++;
        console.log(`[MultiFace] ✓ Face ${i + 1} swapped successfully`);
        
        // Report progress after completing this face
        const completedProgress = Math.floor(((i + 1) / facesToProcess.length) * 100);
        if (input.onProgress) {
          await input.onProgress(completedProgress);
        }
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
