/**
 * RunPod API Service for Face Swap
 * Integrates with self-hosted RunPod Serverless worker
 */

export interface RunPodFaceSwapInput {
  sourceImageUrl: string;
  targetMediaUrl: string;
  targetMediaType: "image" | "video";
}

export interface RunPodFaceSwapResult {
  success: boolean;
  outputUrl?: string;
  outputBase64?: string;
  mimeType?: string;
  error?: string;
}

/**
 * Call RunPod Serverless endpoint for face swap
 */
export async function performFaceSwapRunPod(input: RunPodFaceSwapInput): Promise<RunPodFaceSwapResult> {
  const apiKey = process.env.RUNPOD_API_KEY;
  const endpointId = process.env.RUNPOD_ENDPOINT_ID;

  if (!apiKey || !endpointId) {
    return {
      success: false,
      error: "RunPod API not configured. Please set RUNPOD_API_KEY and RUNPOD_ENDPOINT_ID environment variables.",
    };
  }

  try {
    console.log("[RunPod] Starting face swap...");
    console.log("[RunPod] Source:", input.sourceImageUrl);
    console.log("[RunPod] Target:", input.targetMediaUrl);
    console.log("[RunPod] Type:", input.targetMediaType);

    // Call RunPod API
    const response = await fetch(`https://api.runpod.ai/v2/${endpointId}/runsync`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          source_image_url: input.sourceImageUrl,
          target_media_url: input.targetMediaUrl,
          media_type: input.targetMediaType,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[RunPod] API error:", response.status, errorText);
      return {
        success: false,
        error: `RunPod API error: ${response.status} ${errorText}`,
      };
    }

    const result = await response.json();
    console.log("[RunPod] Response:", JSON.stringify(result, null, 2));

    // Check status
    if (result.status === "FAILED") {
      return {
        success: false,
        error: result.error || "Face swap failed",
      };
    }

    if (result.status !== "COMPLETED") {
      return {
        success: false,
        error: `Unexpected status: ${result.status}`,
      };
    }

    // Extract output
    const output = result.output;
    if (!output || output.status !== "success") {
      return {
        success: false,
        error: output?.error || "Face swap failed",
      };
    }

    // Handle base64 output
    if (output.output?.type === "base64") {
      return {
        success: true,
        outputBase64: output.output.data,
        mimeType: output.output.mime_type,
      };
    }

    // Handle URL output (if you implement S3 upload in worker)
    if (output.output?.url) {
      return {
        success: true,
        outputUrl: output.output.url,
      };
    }

    return {
      success: false,
      error: "Invalid output format from RunPod",
    };
  } catch (error: any) {
    console.error("[RunPod] Face swap failed:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred during face swap",
    };
  }
}

/**
 * Check if RunPod API is configured
 */
export function isRunPodConfigured(): boolean {
  return !!process.env.RUNPOD_API_KEY && !!process.env.RUNPOD_ENDPOINT_ID;
}
