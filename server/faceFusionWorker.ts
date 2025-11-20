/**
 * FaceFusion Worker Process
 * 
 * This worker processes face swap jobs using the FaceFusion CLI.
 * Requires FaceFusion to be installed on the system.
 */

import { getDb } from "./db";
import { faceSwapJobs } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "./storage";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import axios from "axios";

// Configuration
const FACEFUSION_ENABLED = process.env.FACEFUSION_ENABLED === "true";
const FACEFUSION_PATH = process.env.FACEFUSION_PATH || "/opt/facefusion";
const FACEFUSION_PYTHON = path.join(FACEFUSION_PATH, "venv/bin/python");
const FACEFUSION_SCRIPT = path.join(FACEFUSION_PATH, "facefusion.py");
const PROCESSING_INTERVAL = 5000; // 5 seconds
const TEMP_DIR = path.join(os.tmpdir(), "faceswap");

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

interface ProcessResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

/**
 * Download a file from URL to local path
 */
async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = await axios({
    method: "GET",
    url: url,
    responseType: "stream",
  });

  const writer = fs.createWriteStream(outputPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

/**
 * Get file extension from URL or filename
 */
function getExtension(urlOrFilename: string): string {
  const cleanUrl = urlOrFilename.split("?")[0];
  const ext = path.extname(cleanUrl).toLowerCase();
  return ext || ".jpg";
}

/**
 * Get MIME type from file extension
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

/**
 * Run FaceFusion CLI to process face swap
 */
async function runFaceFusion(
  sourcePath: string,
  targetPath: string,
  outputPath: string
): Promise<ProcessResult> {
  return new Promise((resolve) => {
    const args = [
      FACEFUSION_SCRIPT,
      "headless-run",
      "--source",
      sourcePath,
      "--target",
      targetPath,
      "--output",
      outputPath,
      "--execution-provider",
      process.env.FACEFUSION_PROVIDER || "cpu", // Use 'cuda' for GPU
    ];

    console.log(`[FaceFusion] Running: ${FACEFUSION_PYTHON} ${args.join(" ")}`);

    const childProcess = spawn(FACEFUSION_PYTHON, args);

    let stdout = "";
    let stderr = "";

    childProcess.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
      console.log(`[FaceFusion] ${data.toString().trim()}`);
    });

    childProcess.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
      console.error(`[FaceFusion] ERROR: ${data.toString().trim()}`);
    });

    childProcess.on("close", (code: number | null) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve({ success: true, outputPath });
      } else {
        resolve({
          success: false,
          error: stderr || `Process exited with code ${code}`,
        });
      }
    });

    childProcess.on("error", (error: Error) => {
      resolve({
        success: false,
        error: error.message,
      });
    });
  });
}

/**
 * Process a single face swap job
 */
async function processJob(jobId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const jobs = await db.select().from(faceSwapJobs).where(eq(faceSwapJobs.id, jobId)).limit(1);
  const job = jobs[0];

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  console.log(`[Worker] Processing job #${jobId}...`);

  // Update status to processing
  await db.update(faceSwapJobs).set({ status: "processing" }).where(eq(faceSwapJobs.id, jobId));

  try {
    // Create temp file paths
    const sourceExt = getExtension(job.sourceImageUrl);
    const targetExt = getExtension(job.targetMediaUrl);
    const sourcePath = path.join(TEMP_DIR, `source_${jobId}${sourceExt}`);
    const targetPath = path.join(TEMP_DIR, `target_${jobId}${targetExt}`);
    const outputPath = path.join(TEMP_DIR, `result_${jobId}${targetExt}`);

    // Download files
    console.log(`[Worker] Downloading source from ${job.sourceImageUrl}...`);
    await downloadFile(job.sourceImageUrl, sourcePath);

    console.log(`[Worker] Downloading target from ${job.targetMediaUrl}...`);
    await downloadFile(job.targetMediaUrl, targetPath);

    // Run FaceFusion
    console.log(`[Worker] Running FaceFusion...`);
    const result = await runFaceFusion(sourcePath, targetPath, outputPath);

    if (result.success && result.outputPath) {
      // Upload result to S3
      console.log(`[Worker] Uploading result to S3...`);
      const resultBuffer = fs.readFileSync(result.outputPath);
      const resultKey = `user-${job.userId}/results/result_${jobId}${targetExt}`;
      const uploadResult = await storagePut(resultKey, resultBuffer, getMimeType(result.outputPath));

      // Update job as completed
      await db
        .update(faceSwapJobs)
        .set({
          status: "completed",
          resultMediaKey: uploadResult.key,
          resultMediaUrl: uploadResult.url,
          completedAt: new Date(),
        })
        .where(eq(faceSwapJobs.id, jobId));

      console.log(`[Worker] Job #${jobId} completed successfully`);
    } else {
      throw new Error(result.error || "FaceFusion processing failed");
    }

    // Cleanup temp files
    [sourcePath, targetPath, outputPath].forEach((filePath) => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (error: any) {
    console.error(`[Worker] Job #${jobId} failed:`, error);

    // Update job as failed
    await db
      .update(faceSwapJobs)
      .set({
        status: "failed",
        errorMessage: error.message || "Unknown error occurred",
      })
      .where(eq(faceSwapJobs.id, jobId));
  }
}

/**
 * Process all pending jobs
 */
async function processPendingJobs(): Promise<void> {
  if (!FACEFUSION_ENABLED) {
    console.log("[Worker] FaceFusion is not enabled. Set FACEFUSION_ENABLED=true to enable.");
    return;
  }

  const db = await getDb();
  if (!db) {
    console.log("[Worker] Database not available");
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

    console.log(`[Worker] Found ${pendingJobs.length} pending jobs`);

    // Process jobs sequentially
    for (const job of pendingJobs) {
      await processJob(job.id);
    }
  } catch (error) {
    console.error("[Worker] Error processing jobs:", error);
  }
}

/**
 * Start the worker loop
 */
async function startWorker(): Promise<void> {
  console.log("[Worker] Starting FaceFusion worker...");
  console.log(`[Worker] FaceFusion enabled: ${FACEFUSION_ENABLED}`);
  console.log(`[Worker] FaceFusion path: ${FACEFUSION_PATH}`);
  console.log(`[Worker] Checking for jobs every ${PROCESSING_INTERVAL / 1000} seconds`);

  // Check if FaceFusion is installed
  if (FACEFUSION_ENABLED && !fs.existsSync(FACEFUSION_SCRIPT)) {
    console.error(`[Worker] ERROR: FaceFusion not found at ${FACEFUSION_SCRIPT}`);
    console.error("[Worker] Please install FaceFusion or set FACEFUSION_ENABLED=false");
    process.exit(1);
  }

  // Process immediately on start
  await processPendingJobs();

  // Then check periodically
  setInterval(async () => {
    await processPendingJobs();
  }, PROCESSING_INTERVAL);
}

// Auto-start the worker
startWorker().catch(console.error);

export { startWorker, processJob };
