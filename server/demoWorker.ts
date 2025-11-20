/**
 * Demo Worker Process
 * 
 * This is a simple worker that simulates face swap processing for development/demo purposes.
 * In production, replace this with actual FaceFusion integration.
 */

import { getDb } from "./db";
import { faceSwapJobs } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const DEMO_MODE = process.env.DEMO_MODE === "true" || process.env.NODE_ENV === "development";
const PROCESSING_DELAY = 5000; // 5 seconds simulation

async function processPendingJobs() {
  if (!DEMO_MODE) {
    console.log("[Demo Worker] Not in demo mode, skipping...");
    return;
  }

  const db = await getDb();
  if (!db) {
    console.log("[Demo Worker] Database not available");
    return;
  }

  try {
    // Find pending jobs
    const pendingJobs = await db
      .select()
      .from(faceSwapJobs)
      .where(eq(faceSwapJobs.status, "pending"))
      .limit(5);

    if (pendingJobs.length === 0) {
      return;
    }

    console.log(`[Demo Worker] Found ${pendingJobs.length} pending jobs`);

    for (const job of pendingJobs) {
      console.log(`[Demo Worker] Processing job #${job.id}...`);

      // Update to processing
      await db
        .update(faceSwapJobs)
        .set({ status: "processing" })
        .where(eq(faceSwapJobs.id, job.id));

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAY));

      // In demo mode, we just use the target media as the result
      // In production, this would be the actual FaceFusion output
      await db
        .update(faceSwapJobs)
        .set({
          status: "completed",
          resultMediaKey: job.targetMediaKey,
          resultMediaUrl: job.targetMediaUrl,
          completedAt: new Date(),
        })
        .where(eq(faceSwapJobs.id, job.id));

      console.log(`[Demo Worker] Job #${job.id} completed (demo mode)`);
    }
  } catch (error) {
    console.error("[Demo Worker] Error processing jobs:", error);
  }
}

// Start the worker loop
async function startWorker() {
  console.log("[Demo Worker] Starting in demo mode...");
  console.log("[Demo Worker] Checking for jobs every 3 seconds");

  // Process immediately on start
  await processPendingJobs();

  // Then check every 3 seconds
  setInterval(async () => {
    await processPendingJobs();
  }, 3000);
}

// Auto-start the worker
startWorker().catch(console.error);

export { startWorker, processPendingJobs };
