/**
 * Image Blending Service using Sharp
 * Blends face-swapped result with original body to preserve body proportions
 * 
 * Simplified version without face detection - uses center-crop blending
 */

import sharp from "sharp";
import fetch from "node-fetch";

export interface BlendResult {
  success: boolean;
  imageBuffer?: Buffer;
  error?: string;
}

/**
 * Create a feathered circular mask for center-crop blending
 * Returns a grayscale PNG buffer with soft edges
 */
async function createCenterMask(
  width: number,
  height: number,
  featherRadius: number = 50
): Promise<Buffer> {
  // Calculate center region (60% of image dimensions)
  const centerWidth = Math.floor(width * 0.6);
  const centerHeight = Math.floor(height * 0.6);
  const centerX = Math.floor((width - centerWidth) / 2);
  const centerY = Math.floor((height - centerHeight) / 2);

  // Create white rectangle on black background with blur for feathering
  const maskSvg = `
    <svg width="${width}" height="${height}">
      <defs>
        <filter id="blur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="${featherRadius / 2}" />
        </filter>
      </defs>
      <rect width="${width}" height="${height}" fill="black"/>
      <rect 
        x="${centerX}" 
        y="${centerY}" 
        width="${centerWidth}" 
        height="${centerHeight}" 
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
 * Blend face-swapped image with original body using center-crop mask
 * Preserves body proportions by blending only the center region (face area)
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

    // Create center-crop mask for blending
    console.log("[ImageBlending] Creating center-crop mask");
    const maskBuffer = await createCenterMask(
      originalMeta.width,
      originalMeta.height,
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
