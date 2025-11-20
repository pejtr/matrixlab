/**
 * Replicate Worker Process
 * Processes face swap jobs using Replicate API
 */

import { getFaceSwapJobById, updateFaceSwapJobStatus } from "./db.js";
import { performFaceSwap } from "./replicateService.js";
import { performFaceSwapRunPod, isRunPodConfigured } from "./runpodService.js";
import { storagePut } from "./storage.js";
// Using native fetch (Node.js 18+)

const POLL_INTERVAL = 3000; // Check for new jobs every 3 seconds

async function downloadFile(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function processJob(jobId: number) {
  console.log(`[Replicate Worker] Processing job #${jobId}`);

  try {
    const job = await getFaceSwapJobById(jobId);
    if (!job) {
      console.error(`[Replicate Worker] Job #${jobId} not found`);
      return;
    }

    if (job.status !== "pending") {
      console.log(`[Replicate Worker] Job #${jobId} already processed (${job.status})`);
      return;
    }

    // Update status to processing with initial progress
    await updateFaceSwapJobStatus(jobId, "processing", { progress: 10 });

    // Update progress: preparing
    await updateFaceSwapJobStatus(jobId, "processing", { progress: 30 });

    // Choose service based on configuration and media type
    let result;
    const useRunPod = isRunPodConfigured() && job.targetMediaType === "video";
    
    if (useRunPod) {
      console.log(`[Worker] Using RunPod for video face swap`);
      result = await performFaceSwapRunPod({
        sourceImageUrl: job.sourceImageUrl,
        targetMediaUrl: job.targetMediaUrl,
        targetMediaType: job.targetMediaType,
      });
    } else {
      console.log(`[Worker] Using Replicate for image face swap`);
      result = await performFaceSwap({
        sourceImageUrl: job.sourceImageUrl,
        targetMediaUrl: job.targetMediaUrl,
        targetMediaType: job.targetMediaType,
      });
    }

    // Update progress: face swap completed
    await updateFaceSwapJobStatus(jobId, "processing", { progress: 70 });

    if (!result.success || (!result.outputUrl && !result.outputBase64)) {
      // Retry logic: retry up to 3 times
      const maxRetries = 3;
      if (job.retryCount < maxRetries) {
        console.log(`[Replicate Worker] Job #${jobId} failed, retrying (${job.retryCount + 1}/${maxRetries})`);
        await updateFaceSwapJobStatus(jobId, "pending", {
          retryCount: job.retryCount + 1,
          progress: 0,
        });
        return;
      }
      
      await updateFaceSwapJobStatus(jobId, "failed", {
        errorMessage: result.error || "Face swap failed",
        progress: 0,
      });
      console.error(`[Replicate Worker] Job #${jobId} failed after ${maxRetries} retries:`, result.error);
      return;
    }

    // Update progress: downloading result
    await updateFaceSwapJobStatus(jobId, "processing", { progress: 80 });

    // Get result buffer (either from URL or base64)
    let resultBuffer: Buffer;
    if (result.outputUrl) {
      console.log(`[Worker] Downloading result from ${result.outputUrl}`);
      resultBuffer = await downloadFile(result.outputUrl);
    } else if (result.outputBase64) {
      console.log(`[Worker] Converting base64 result to buffer`);
      resultBuffer = Buffer.from(result.outputBase64, 'base64');
    } else {
      throw new Error('No output URL or base64 data');
    }

    // Upload to S3
    const contentType = job.targetMediaType === "video" ? "video/mp4" : "image/png";
    const fileExtension = job.targetMediaType === "video" ? "mp4" : "png";
    const resultKey = `user-${job.userId}/results/${Date.now()}.${fileExtension}`;

    // Update progress: uploading to S3
    await updateFaceSwapJobStatus(jobId, "processing", { progress: 90 });

    console.log(`[Replicate Worker] Uploading result to S3: ${resultKey}`);
    const uploadResult = await storagePut(resultKey, resultBuffer, contentType);

    // Update job as completed with 100% progress
    await updateFaceSwapJobStatus(jobId, "completed", {
      resultMediaKey: uploadResult.key,
      resultMediaUrl: uploadResult.url,
      completedAt: new Date(),
      progress: 100,
    });

    console.log(`[Replicate Worker] Job #${jobId} completed successfully`);
  } catch (error: any) {
    console.error(`[Replicate Worker] Error processing job #${jobId}:`, error);
    await updateFaceSwapJobStatus(jobId, "failed", {
      errorMessage: error.message || "Unknown error",
    });
  }
}

async function pollForJobs() {
  try {
    const { getDb } = await import("./db.js");
    const { faceSwapJobs } = await import("../drizzle/schema.js");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    if (!db) {
      console.warn("[Replicate Worker] Database not available");
      return;
    }

    // Find pending jobs
    const pendingJobs = await db
      .select()
      .from(faceSwapJobs)
      .where(eq(faceSwapJobs.status, "pending"))
      .limit(5); // Process up to 5 jobs at a time

    if (pendingJobs.length > 0) {
      console.log(`[Replicate Worker] Found ${pendingJobs.length} pending job(s)`);
      
      // Process jobs sequentially to avoid rate limits
      for (const job of pendingJobs) {
        await processJob(job.id);
      }
    }
  } catch (error) {
    console.error("[Replicate Worker] Error polling for jobs:", error);
  }
}

// Start the worker
console.log("[Replicate Worker] Starting worker process...");
console.log("[Replicate Worker] Polling interval:", POLL_INTERVAL, "ms");

// Check if Replicate is configured
import { isReplicateConfigured } from "./replicateService.js";
if (!isReplicateConfigured()) {
  console.error("[Replicate Worker] ERROR: REPLICATE_API_TOKEN not configured!");
  console.error("[Replicate Worker] Please set the environment variable to enable face swap.");
  process.exit(1);
}

// Poll for jobs
setInterval(pollForJobs, POLL_INTERVAL);

// Process any existing pending jobs immediately
pollForJobs();
