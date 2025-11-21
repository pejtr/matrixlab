/**
 * Replicate API Service for Face Swap
 * Uses easel/advanced-face-swap for images (commercial-grade quality)
 * Uses xrunda/hello for videos (only video-capable model)
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
  modelPreference?: "high_quality" | "permissive"; // Model selection: high_quality (NSFW filter) vs permissive (NSFW allowed)
  webhookUrl?: string; // Optional webhook URL for instant notifications
}

export interface FaceSwapResult {
  success: boolean;
  outputUrl?: string;
  outputBase64?: string;
  mimeType?: string;
  error?: string;
  predictionId?: string; // Replicate prediction ID for webhook tracking
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

    // Use different models based on media type and preference
    let output: any;
    let modelUsed: string;
    let predictionId: string | undefined;
    const modelPreference = input.modelPreference || "high_quality";
    
    if (input.targetMediaType === "video") {
      // For videos, use xrunda/hello model (supports video face swap)
      // Cost: $0.10 per run, ~103 seconds
      modelUsed = "xrunda/hello (video)";
      console.log("[Replicate] Using model: xrunda/hello for VIDEO (cost: $0.10, ~103s)");
      const prediction = await replicate.predictions.create({
        version: "xrunda/hello",
        input: {
          target_face: input.sourceImageUrl,
          input_video: input.targetMediaUrl,
        },
        webhook: input.webhookUrl,
        webhook_events_filter: ["completed"],
      });
      predictionId = prediction.id;
      console.log("[Replicate] Prediction ID:", predictionId);
      
      // Wait for prediction to complete
      output = await replicate.wait(prediction);
      output = output.output;
    } else {
      // For images, choose model based on preference
      if (modelPreference === "permissive") {
        // Use fofr/face-swap-with-ideogram (NSFW-friendly, lower quality)
        modelUsed = "fofr/face-swap-with-ideogram (permissive)";
        console.log("[Replicate] Using model: fofr/face-swap-with-ideogram for IMAGE (NSFW-friendly)");
        const prediction = await replicate.predictions.create({
          model: "fofr/face-swap-with-ideogram",
          input: {
            character_image: input.sourceImageUrl,
            target_image: input.targetMediaUrl,
          },
          webhook: input.webhookUrl,
          webhook_events_filter: ["completed"],
        });
        predictionId = prediction.id;
        console.log("[Replicate] Prediction ID:", predictionId);
        
        // Wait for prediction to complete
        output = await replicate.wait(prediction);
        output = output.output;
      } else {
        // Use easel/advanced-face-swap (commercial-grade, NSFW filter)
        modelUsed = "easel/advanced-face-swap (high quality)";
        console.log("[Replicate] Using model: easel/advanced-face-swap for IMAGE (commercial-grade quality, NSFW filter)");
        
        try {
          const prediction = await replicate.predictions.create({
            model: "easel/advanced-face-swap",
            input: {
              target_image: input.targetMediaUrl,
              swap_image: input.sourceImageUrl,
            },
            webhook: input.webhookUrl,
            webhook_events_filter: ["completed"],
          });
          predictionId = prediction.id;
          console.log("[Replicate] Prediction ID:", predictionId);
          
          // Wait for prediction to complete
          output = await replicate.wait(prediction);
          output = output.output;
          
          // Check if output is empty (NSFW detected)
          const outputUrl = Array.isArray(output) ? output[0] : output;
          if (!outputUrl || outputUrl === "" || (Array.isArray(output) && output.length === 0)) {
            console.log("[Replicate] High-quality model returned empty output (NSFW detected), falling back to permissive model...");
            
            // Fallback to permissive model
            modelUsed = "fofr/face-swap-with-ideogram (fallback)";
            output = await replicate.run(
              "fofr/face-swap-with-ideogram",
              {
                input: {
                  character_image: input.sourceImageUrl,
                  target_image: input.targetMediaUrl,
                },
              }
            );
          }
        } catch (error) {
          console.error("[Replicate] High-quality model failed, falling back to permissive model:", error);
          
          // Fallback to permissive model on error
          modelUsed = "fofr/face-swap-with-ideogram (fallback)";
          output = await replicate.run(
            "fofr/face-swap-with-ideogram",
            {
              input: {
                character_image: input.sourceImageUrl,
                target_image: input.targetMediaUrl,
              },
            }
          );
        }
      }
    }
    
    console.log("[Replicate] Model used:", modelUsed);

    console.log("[Replicate] Raw output:", JSON.stringify(output));

    // Output is typically a URL string or array of URLs
    const outputUrl = Array.isArray(output) ? output[0] : output;
    
    if (typeof outputUrl !== "string") {
      console.error("[Replicate] Unexpected output type:", typeof outputUrl, outputUrl);
    }

    if (!outputUrl || outputUrl === "" || (Array.isArray(output) && output.length === 0)) {
      // Empty output usually means NSFW content was detected
      console.error("[Replicate] Empty output - possible NSFW content detected or invalid input");
      return {
        success: false,
        error: "No output images were generated. This may be due to NSFW content detection or invalid input images. Please try different images.",
      };
    }

    return {
      success: true,
      outputUrl,
      predictionId,
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
