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
  outputBase64?: string;
  mimeType?: string;
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

    // Use different models based on media type
    let output;
    let modelUsed: string;
    
    if (input.targetMediaType === "video") {
      // For videos, use xrunda/hello model (supports video face swap)
      // Cost: $0.10 per run, ~103 seconds
      modelUsed = "xrunda/hello (video)";
      console.log("[Replicate] Using model: xrunda/hello for VIDEO (cost: $0.10, ~103s)");
      output = await replicate.run(
        "xrunda/hello",
        {
          input: {
            target_face: input.sourceImageUrl,
            input_video: input.targetMediaUrl,
          },
        }
      );
    } else {
      // For images, use yan-ops/face_swap (most popular and reliable)
      // Cost: $0.00041 per run, proven with 595K+ runs
      modelUsed = "yan-ops/face_swap (image)";
      console.log("[Replicate] Using model: yan-ops/face_swap for IMAGE (cost: $0.00041, proven)");
      output = await replicate.run(
        "yan-ops/face_swap",
        {
          input: {
            target_image: input.sourceImageUrl,
            swap_image: input.targetMediaUrl,
          },
        }
      );
    }
    
    console.log("[Replicate] Model used:", modelUsed);

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
