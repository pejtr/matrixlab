/**
 * Image Blending Service using Sharp
 * Blends face-swapped result with original body to preserve body proportions
 */

import sharp from "sharp";
import fetch from "node-fetch";
import { detectFace, FaceBox } from "./faceDetectionService";

export interface BlendResult {
  success: boolean;
  imageBuffer?: Buffer;
  error?: string;
}

/**
 * Create a feathered mask for smooth blending
 * Returns a grayscale PNG buffer with soft edges
 */
async function createFeatheredMask(
  width: number,
  height: number,
  faceBox: FaceBox,
  featherRadius: number = 50
): Promise<Buffer> {
  // Expand face box by feather radius for smooth transition
  const expandedBox = {
    x: Math.max(0, faceBox.x - featherRadius),
    y: Math.max(0, faceBox.y - featherRadius),
    width: Math.min(width - faceBox.x, faceBox.width + featherRadius * 2),
    height: Math.min(height - faceBox.y, faceBox.height + featherRadius * 2),
  };

  // Create white rectangle on black background
  const maskSvg = `
    <svg width="${width}" height="${height}">
      <defs>
        <filter id="blur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="${featherRadius / 2}" />
        </filter>
      </defs>
      <rect width="${width}" height="${height}" fill="black"/>
      <rect 
        x="${expandedBox.x}" 
        y="${expandedBox.y}" 
        width="${expandedBox.width}" 
        height="${expandedBox.height}" 
        fill="white"
        filter="url(#blur)"
      />
    </svg>
  `;

  return sharp(Buffer.from(maskSvg))
    .png()
    .toBuffer();
}

/**
 * Blend face-swapped image with original body
 * Uses face detection to create a mask and composite only the face region
 */
export async function blendFaceWithOriginalBody(
  originalImageUrl: string,
  faceSwappedImageUrl: string
): Promise<BlendResult> {
  try {
    console.log("[ImageBlending] Starting blend process");
    console.log("[ImageBlending] Original:", originalImageUrl);
    console.log("[ImageBlending] Face-swapped:", faceSwappedImageUrl);

    // Fetch both images
    const [originalResponse, swappedResponse] = await Promise.all([
      fetch(originalImageUrl),
      fetch(faceSwappedImageUrl),
    ]);

    if (!originalResponse.ok || !swappedResponse.ok) {
      throw new Error("Failed to fetch images");
    }

    const [originalBuffer, swappedBuffer] = await Promise.all([
      originalResponse.buffer(),
      swappedResponse.buffer(),
    ]);

    // Get image dimensions
    const originalMeta = await sharp(originalBuffer).metadata();
    const swappedMeta = await sharp(swappedBuffer).metadata();

    if (!originalMeta.width || !originalMeta.height || !swappedMeta.width || !swappedMeta.height) {
      throw new Error("Failed to get image dimensions");
    }

    console.log("[ImageBlending] Original dimensions:", originalMeta.width, "x", originalMeta.height);
    console.log("[ImageBlending] Swapped dimensions:", swappedMeta.width, "x", swappedMeta.height);

    // Resize swapped image to match original if needed
    let resizedSwappedBuffer = swappedBuffer;
    if (
      swappedMeta.width !== originalMeta.width ||
      swappedMeta.height !== originalMeta.height
    ) {
      console.log("[ImageBlending] Resizing swapped image to match original");
      resizedSwappedBuffer = await sharp(swappedBuffer)
        .resize(originalMeta.width, originalMeta.height, {
          fit: "cover",
          position: "center",
        })
        .toBuffer();
    }

    // Detect face in swapped image
    console.log("[ImageBlending] Detecting face in swapped image");
    const faceDetection = await detectFace(faceSwappedImageUrl);

    if (!faceDetection.success || !faceDetection.faceBox) {
      console.log("[ImageBlending] No face detected, returning swapped image as-is");
      return {
        success: true,
        imageBuffer: resizedSwappedBuffer,
      };
    }

    console.log("[ImageBlending] Face detected:", faceDetection.faceBox);

    // Create feathered mask
    console.log("[ImageBlending] Creating feathered mask");
    const maskBuffer = await createFeatheredMask(
      originalMeta.width,
      originalMeta.height,
      faceDetection.faceBox,
      80 // Feather radius for smooth blending
    );

    // Composite: original body + swapped face using mask
    console.log("[ImageBlending] Compositing images");
    const blendedBuffer = await sharp(originalBuffer)
      .composite([
        {
          input: resizedSwappedBuffer,
          blend: "over",
        },
        {
          input: maskBuffer,
          blend: "dest-in",
        },
      ])
      .jpeg({ quality: 95 })
      .toBuffer();

    console.log("[ImageBlending] Blend complete, output size:", blendedBuffer.length, "bytes");

    return {
      success: true,
      imageBuffer: blendedBuffer,
    };
  } catch (error: any) {
    console.error("[ImageBlending] Error:", error);
    return {
      success: false,
      error: error.message || "Unknown error during image blending",
    };
  }
}

/**
 * Simple wrapper that returns swapped image if blending is disabled
 */
export async function processWithBodyPreservation(
  originalImageUrl: string,
  faceSwappedImageUrl: string,
  preserveBody: boolean
): Promise<BlendResult> {
  if (!preserveBody) {
    // Return swapped image as-is
    try {
      const response = await fetch(faceSwappedImageUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch face-swapped image");
      }
      const buffer = await response.buffer();
      return {
        success: true,
        imageBuffer: buffer,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Apply body preservation blending
  return blendFaceWithOriginalBody(originalImageUrl, faceSwappedImageUrl);
}
