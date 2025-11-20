/**
 * Replicate Worker Process
 * Processes face swap jobs using Replicate API
 * Enhanced with detailed logging and timeout mechanisms
 */

import { getFaceSwapJobById, updateFaceSwapJobStatus } from "./db.js";
import { performFaceSwap } from "./replicateService.js";
import { performFaceSwapRunPod, isRunPodConfigured } from "./runpodService.js";
import { storagePut } from "./storage.js";
// Using native fetch (Node.js 18+)

const POLL_INTERVAL = 3000; // Check for new jobs every 3 seconds
const MAX_PROCESSING_TIME = 300000; // 5 minutes max per job
const DOWNLOAD_TIMEOUT = 60000; // 1 minute for file download
const API_CALL_TIMEOUT = 180000; // 3 minutes for API call

/**
 * Timeout wrapper for promises
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

async function downloadFile(url: string): Promise<Buffer> {
  const startTime = Date.now();
  console.log(`[Worker] [Download] Starting download from ${url}`);
  
  try {
    const response = await withTimeout(
      fetch(url),
      DOWNLOAD_TIMEOUT,
      "File download"
    );
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText} (${response.status})`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const duration = Date.now() - startTime;
    
    console.log(`[Worker] [Download] ✓ Downloaded ${buffer.length} bytes in ${duration}ms`);
    return buffer;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Worker] [Download] ✗ Failed after ${duration}ms:`, error);
    throw error;
  }
}

async function processJob(jobId: number) {
  const jobStartTime = Date.now();
  console.log(`\n========================================`);
  console.log(`[Worker] [Job #${jobId}] Starting processing`);
  console.log(`[Worker] [Job #${jobId}] Start time: ${new Date().toISOString()}`);
  console.log(`========================================\n`);

  try {
    // Step 1: Fetch job details
    const fetchStartTime = Date.now();
    console.log(`[Worker] [Job #${jobId}] [Step 1/7] Fetching job details...`);
    
    const job = await getFaceSwapJobById(jobId);
    if (!job) {
      console.error(`[Worker] [Job #${jobId}] ✗ Job not found in database`);
      return;
    }
    
    console.log(`[Worker] [Job #${jobId}] ✓ Job fetched in ${Date.now() - fetchStartTime}ms`);
    console.log(`[Worker] [Job #${jobId}] Status: ${job.status}, Retry count: ${job.retryCount}`);

    if (job.status !== "pending") {
      console.log(`[Worker] [Job #${jobId}] Skipping - already ${job.status}`);
      return;
    }

    // Step 2: Update to processing
    console.log(`[Worker] [Job #${jobId}] [Step 2/7] Updating status to processing...`);
    await updateFaceSwapJobStatus(jobId, "processing", { progress: 10 });
    console.log(`[Worker] [Job #${jobId}] ✓ Status updated (10%)`);

    // Step 3: Prepare for API call
    console.log(`[Worker] [Job #${jobId}] [Step 3/7] Preparing API call...`);
    await updateFaceSwapJobStatus(jobId, "processing", { progress: 30 });
    console.log(`[Worker] [Job #${jobId}] Source: ${job.sourceImageUrl}`);
    console.log(`[Worker] [Job #${jobId}] Target: ${job.targetMediaUrl}`);
    console.log(`[Worker] [Job #${jobId}] Type: ${job.targetMediaType}`);

    // Step 4: Choose service and perform face swap
    const apiStartTime = Date.now();
    console.log(`[Worker] [Job #${jobId}] [Step 4/7] Calling face swap API...`);
    
    let result;
    const useRunPod = isRunPodConfigured() && job.targetMediaType === "video";
    
    if (useRunPod) {
      console.log(`[Worker] [Job #${jobId}] Using RunPod for video face swap`);
      result = await withTimeout(
        performFaceSwapRunPod({
          sourceImageUrl: job.sourceImageUrl,
          targetMediaUrl: job.targetMediaUrl,
          targetMediaType: job.targetMediaType,
        }),
        API_CALL_TIMEOUT,
        "RunPod API call"
      );
    } else {
      console.log(`[Worker] [Job #${jobId}] Using Replicate for image face swap`);
      result = await withTimeout(
        performFaceSwap({
          sourceImageUrl: job.sourceImageUrl,
          targetMediaUrl: job.targetMediaUrl,
          targetMediaType: job.targetMediaType,
          modelPreference: job.modelPreference || "high_quality",
        }),
        API_CALL_TIMEOUT,
        "Replicate API call"
      );
    }

    const apiDuration = Date.now() - apiStartTime;
    console.log(`[Worker] [Job #${jobId}] ✓ API call completed in ${apiDuration}ms`);
    console.log(`[Worker] [Job #${jobId}] Result success: ${result.success}`);

    // Step 5: Update progress after API call
    console.log(`[Worker] [Job #${jobId}] [Step 5/7] Updating progress (70%)...`);
    await updateFaceSwapJobStatus(jobId, "processing", { progress: 70 });

    if (!result.success || (!result.outputUrl && !result.outputBase64)) {
      // Retry logic: retry up to 3 times
      const maxRetries = 3;
      if (job.retryCount < maxRetries) {
        console.log(`[Worker] [Job #${jobId}] ⚠ Failed, scheduling retry ${job.retryCount + 1}/${maxRetries}`);
        console.log(`[Worker] [Job #${jobId}] Error: ${result.error}`);
        await updateFaceSwapJobStatus(jobId, "pending", {
          retryCount: job.retryCount + 1,
          progress: 0,
        });
        return;
      }
      
      console.error(`[Worker] [Job #${jobId}] ✗ Failed after ${maxRetries} retries`);
      console.error(`[Worker] [Job #${jobId}] Final error: ${result.error}`);
      await updateFaceSwapJobStatus(jobId, "failed", {
        errorMessage: result.error || "Face swap failed",
        progress: 0,
      });
      return;
    }

    // Step 6: Download result
    console.log(`[Worker] [Job #${jobId}] [Step 6/7] Downloading result...`);
    await updateFaceSwapJobStatus(jobId, "processing", { progress: 80 });

    let resultBuffer: Buffer;
    if (result.outputUrl) {
      console.log(`[Worker] [Job #${jobId}] Downloading from URL: ${result.outputUrl}`);
      resultBuffer = await downloadFile(result.outputUrl);
    } else if (result.outputBase64) {
      console.log(`[Worker] [Job #${jobId}] Converting base64 to buffer`);
      resultBuffer = Buffer.from(result.outputBase64, 'base64');
      console.log(`[Worker] [Job #${jobId}] ✓ Converted ${resultBuffer.length} bytes`);
    } else {
      throw new Error('No output URL or base64 data');
    }

    // Step 7: Upload to S3
    console.log(`[Worker] [Job #${jobId}] [Step 7/7] Uploading to S3...`);
    await updateFaceSwapJobStatus(jobId, "processing", { progress: 90 });

    const uploadStartTime = Date.now();
    const fileExtension = job.targetMediaType === "video" ? "mp4" : "jpg";
    const resultKey = `results/job-${jobId}-${Date.now()}.${fileExtension}`;
    const contentType = job.targetMediaType === "video" ? "video/mp4" : "image/jpeg";

    console.log(`[Worker] [Job #${jobId}] Uploading ${resultBuffer.length} bytes as ${contentType}`);
    const { url: resultUrl } = await storagePut(resultKey, resultBuffer, contentType);
    const uploadDuration = Date.now() - uploadStartTime;
    
    console.log(`[Worker] [Job #${jobId}] ✓ Uploaded to S3 in ${uploadDuration}ms`);
    console.log(`[Worker] [Job #${jobId}] Result URL: ${resultUrl}`);

    // Final: Mark as completed
    console.log(`[Worker] [Job #${jobId}] Marking as completed...`);
    await updateFaceSwapJobStatus(jobId, "completed", {
      resultMediaUrl: resultUrl,
      resultMediaKey: resultKey,
      progress: 100,
    });

    const totalDuration = Date.now() - jobStartTime;
    console.log(`\n========================================`);
    console.log(`[Worker] [Job #${jobId}] ✓✓✓ COMPLETED SUCCESSFULLY`);
    console.log(`[Worker] [Job #${jobId}] Total time: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}s)`);
    console.log(`[Worker] [Job #${jobId}] End time: ${new Date().toISOString()}`);
    console.log(`========================================\n`);

  } catch (error: any) {
    const totalDuration = Date.now() - jobStartTime;
    console.error(`\n========================================`);
    console.error(`[Worker] [Job #${jobId}] ✗✗✗ FAILED`);
    console.error(`[Worker] [Job #${jobId}] Error: ${error.message}`);
    console.error(`[Worker] [Job #${jobId}] Time elapsed: ${totalDuration}ms`);
    console.error(`[Worker] [Job #${jobId}] Stack:`, error.stack);
    console.error(`========================================\n`);

    await updateFaceSwapJobStatus(jobId, "failed", {
      errorMessage: error.message || "Unknown error",
      progress: 0,
    });
  }
}

async function pollJobs() {
  try {
    // Import withDbRetry and faceSwapJobs dynamically to avoid circular dependencies
    const { withDbRetry } = await import("./db.js");
    const { faceSwapJobs } = await import("../drizzle/schema.js");
    const { eq } = await import("drizzle-orm");

    // Find pending jobs with retry logic
    const pendingJobs = await withDbRetry(async (db) => {
      return await db
        .select()
        .from(faceSwapJobs)
        .where(eq(faceSwapJobs.status, "pending"))
        .limit(5); // Process up to 5 jobs at a time
    });

    if (pendingJobs.length > 0) {
      console.log(`[Worker] Found ${pendingJobs.length} pending job(s)`);
      
      // Process jobs sequentially to avoid overwhelming the API
      for (const job of pendingJobs) {
        await processJob(job.id);
      }
    }
  } catch (error) {
    console.error("[Worker] Error polling jobs:", error);
  }
}

// Main worker loop
console.log("[Replicate Worker] Starting worker process...");
console.log("[Replicate Worker] Polling interval:", POLL_INTERVAL, "ms");
console.log("[Replicate Worker] Max processing time:", MAX_PROCESSING_TIME, "ms");
console.log("[Replicate Worker] API call timeout:", API_CALL_TIMEOUT, "ms");
console.log("[Replicate Worker] Download timeout:", DOWNLOAD_TIMEOUT, "ms");

// Start polling
setInterval(pollJobs, POLL_INTERVAL);

// Initial poll
pollJobs();
