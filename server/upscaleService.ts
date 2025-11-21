/**
 * Upscale Service
 * Provides image and video upscaling using Replicate API
 * Uses Real-ESRGAN for 4x resolution enhancement
 */

import Replicate from "replicate";

const replicate = process.env.REPLICATE_API_TOKEN 
  ? new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
  : null;

export interface UpscaleInput {
  imageUrl: string; // Image to upscale
  scale?: number; // Upscale factor (default: 4)
  webhookUrl?: string; // Optional webhook URL for instant notifications
}

export interface UpscaleResult {
  success: boolean;
  outputUrl?: string;
  error?: string;
  predictionId?: string; // Replicate prediction ID for webhook tracking
}

/**
 * Upscale image using Real-ESRGAN model (4x enhancement)
 */
export async function upscaleImage(input: UpscaleInput): Promise<UpscaleResult> {
  if (!replicate) {
    return {
      success: false,
      error: "Replicate API token not configured. Please set REPLICATE_API_TOKEN environment variable.",
    };
  }

  try {
    console.log("[Upscale] Starting image upscale...");
    console.log("[Upscale] Input:", input.imageUrl);
    console.log("[Upscale] Scale:", input.scale || 4);

    // Use Real-ESRGAN model for image upscaling
    // Model: nightmareai/real-esrgan (high-quality 4x upscaling)
    const prediction = await replicate.predictions.create({
      model: "nightmareai/real-esrgan",
      input: {
        image: input.imageUrl,
        scale: input.scale || 4,
        face_enhance: false, // Set to true if upscaling faces specifically
      },
      webhook: input.webhookUrl,
      webhook_events_filter: ["completed"],
    });

    const predictionId = prediction.id;
    console.log("[Upscale] Prediction ID:", predictionId);

    // Wait for prediction to complete
    const result = await replicate.wait(prediction);
    const output = result.output;

    console.log("[Upscale] Raw output:", JSON.stringify(output));

    // Output is typically a URL string
    const outputUrl = typeof output === "string" ? output : (Array.isArray(output) ? output[0] : undefined);

    if (!outputUrl) {
      console.error("[Upscale] Empty output");
      return {
        success: false,
        error: "No output image was generated. Please check input image.",
      };
    }

    return {
      success: true,
      outputUrl,
      predictionId,
    };
  } catch (error: any) {
    console.error("[Upscale] Upscale failed:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred during upscaling",
    };
  }
}

/**
 * Check if upscale is configured
 */
export function isUpscaleConfigured(): boolean {
  return !!process.env.REPLICATE_API_TOKEN;
}
