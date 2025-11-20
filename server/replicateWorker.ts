/**
 * Replicate Worker Process
 * Processes face swap jobs using Replicate API
 */

import { getFaceSwapJobById, updateFaceSwapJobStatus } from "./db.js";
import { performFaceSwap } from "./replicateService.js";
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

    // Update status to processing
    await updateFaceSwapJobStatus(jobId, "processing");

    // Perform face swap using Replicate
    const result = await performFaceSwap({
      sourceImageUrl: job.sourceImageUrl,
      targetMediaUrl: job.targetMediaUrl,
      targetMediaType: job.targetMediaType,
    });

    if (!result.success || !result.outputUrl) {
      await updateFaceSwapJobStatus(jobId, "failed", {
        errorMessage: result.error || "Face swap failed",
      });
      console.error(`[Replicate Worker] Job #${jobId} failed:`, result.error);
      return;
    }

    // Download the result from Replicate
    console.log(`[Replicate Worker] Downloading result from ${result.outputUrl}`);
    const resultBuffer = await downloadFile(result.outputUrl);

    // Upload to S3
    const contentType = job.targetMediaType === "video" ? "video/mp4" : "image/png";
    const fileExtension = job.targetMediaType === "video" ? "mp4" : "png";
    const resultKey = `user-${job.userId}/results/${Date.now()}.${fileExtension}`;

    console.log(`[Replicate Worker] Uploading result to S3: ${resultKey}`);
    const uploadResult = await storagePut(resultKey, resultBuffer, contentType);

    // Update job as completed
    await updateFaceSwapJobStatus(jobId, "completed", {
      resultMediaKey: uploadResult.key,
      resultMediaUrl: uploadResult.url,
      completedAt: new Date(),
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
