/**
 * Wan2.2-Animate Service
 * Provides character animation and full body replacement using Replicate API
 * Model: wan-video/wan-2.2-animate-animation
 */

import Replicate from "replicate";

const replicate = process.env.REPLICATE_API_TOKEN 
  ? new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
  : null;

export type WanAnimateMode = "animation" | "replacement";

export interface WanAnimateInput {
  characterImageUrl: string; // Character image to animate or use for replacement
  referenceVideoUrl: string; // Reference video with motion/character to copy
  mode: WanAnimateMode; // "animation" = animate character, "replacement" = replace character in video
  webhookUrl?: string; // Optional webhook URL for instant notifications
}

export interface WanAnimateResult {
  success: boolean;
  outputUrl?: string;
  error?: string;
  predictionId?: string; // Replicate prediction ID for webhook tracking
}

/**
 * Perform character animation or replacement using Wan2.2-Animate model
 */
export async function performWanAnimate(input: WanAnimateInput): Promise<WanAnimateResult> {
  if (!replicate) {
    return {
      success: false,
      error: "Replicate API token not configured. Please set REPLICATE_API_TOKEN environment variable.",
    };
  }

  try {
    console.log("[WanAnimate] Starting Wan Animate...");
    console.log("[WanAnimate] Character:", input.characterImageUrl);
    console.log("[WanAnimate] Reference:", input.referenceVideoUrl);
    console.log("[WanAnimate] Mode:", input.mode);

    // Create prediction with Wan2.2-Animate model
    const prediction = await replicate.predictions.create({
      model: "wan-video/wan-2.2-animate-animation",
      input: {
        character_image: input.characterImageUrl,
        reference_video: input.referenceVideoUrl,
        mode: input.mode, // "animation" or "replacement"
      },
      webhook: input.webhookUrl,
      webhook_events_filter: ["completed"],
    });

    const predictionId = prediction.id;
    console.log("[WanAnimate] Prediction ID:", predictionId);

    // Wait for prediction to complete
    const result = await replicate.wait(prediction);
    const output = result.output;

    console.log("[WanAnimate] Raw output:", JSON.stringify(output));

    // Output is typically a URL string or array of URLs
    const outputUrl = Array.isArray(output) ? output[0] : output;

    if (!outputUrl || outputUrl === "") {
      console.error("[WanAnimate] Empty output");
      return {
        success: false,
        error: "No output video was generated. Please check input images and video.",
      };
    }

    return {
      success: true,
      outputUrl,
      predictionId,
    };
  } catch (error: any) {
    console.error("[WanAnimate] Animation/Replacement failed:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred during Wan Animate",
    };
  }
}

/**
 * Check if Wan Animate is configured
 */
export function isWanAnimateConfigured(): boolean {
  return !!process.env.REPLICATE_API_TOKEN;
}
