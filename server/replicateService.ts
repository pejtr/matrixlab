/**
 * Replicate API Service for Face Swap
 * Uses yan-ops/face_swap model for high-quality face swapping
 */

import Replicate from "replicate";

// Initialize Replicate client
// API key should be provided via environment variable REPLICATE_API_TOKEN
const replicate = process.env.REPLICATE_API_TOKEN 
  ? new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
  : null;

export interface FaceSwapInput {
  sourceImageUrl: string;
  targetMediaUrl: string;
  targetMediaType: "image" | "video";
}

export interface FaceSwapResult {
  success: boolean;
  outputUrl?: string;
  error?: string;
}

/**
 * Perform face swap using Replicate API
 */
export async function performFaceSwap(input: FaceSwapInput): Promise<FaceSwapResult> {
  if (!replicate) {
    return {
      success: false,
      error: "Replicate API token not configured. Please set REPLICATE_API_TOKEN environment variable.",
    };
  }

  try {
    console.log("[Replicate] Starting face swap...");
    console.log("[Replicate] Source:", input.sourceImageUrl);
    console.log("[Replicate] Target:", input.targetMediaUrl);
    console.log("[Replicate] Type:", input.targetMediaType);

    // Use yan-ops/face_swap model for both images and videos
    const output = await replicate.run(
      "yan-ops/face_swap:d5900f9ebed33e7ae6f0f50b10a1c207bb8169e4ba8516d50c7fd3e45d3e0e", // Latest version
      {
        input: {
          swap_image: input.sourceImageUrl,
          target_image: input.targetMediaUrl,
        },
      }
    );

    console.log("[Replicate] Output:", output);

    // Output is typically a URL string or array of URLs
    const outputUrl = Array.isArray(output) ? output[0] : output;
    
    if (typeof outputUrl !== "string") {
      console.error("[Replicate] Unexpected output type:", typeof outputUrl, outputUrl);
    }

    if (!outputUrl) {
      return {
        success: false,
        error: "Invalid output from Replicate API",
      };
    }

    return {
      success: true,
      outputUrl,
    };
  } catch (error: any) {
    console.error("[Replicate] Face swap failed:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred during face swap",
    };
  }
}

/**
 * Check if Replicate API is configured
 */
export function isReplicateConfigured(): boolean {
  return !!process.env.REPLICATE_API_TOKEN;
}
