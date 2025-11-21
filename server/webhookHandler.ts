import { Request, Response } from "express";
import crypto from "crypto";
import { getDb } from "./db";
import { faceSwapJobs } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "./storage";

const WEBHOOK_SECRET = process.env.REPLICATE_WEBHOOK_SECRET || "";

/**
 * Verify Replicate webhook signature
 * https://replicate.com/docs/webhooks#webhook-signing
 */
function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  if (!secret) {
    console.warn("[Webhook] No REPLICATE_WEBHOOK_SECRET configured");
    return false;
  }

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  const expectedSignature = hmac.digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Download file from URL and upload to S3
 */
async function downloadAndUploadToS3(
  url: string,
  fileKey: string
): Promise<{ key: string; url: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get("content-type") || "application/octet-stream";

  return await storagePut(fileKey, Buffer.from(buffer), contentType);
}

/**
 * Handle Replicate webhook notifications
 * POST /api/replicate-webhook
 */
export async function handleReplicateWebhook(req: Request, res: Response) {
  try {
    // Get signature from header
    const signature = req.headers["replicate-signature"] as string;
    if (!signature) {
      console.warn("[Webhook] Missing replicate-signature header");
      return res.status(401).json({ error: "Missing signature" });
    }

    // Verify signature
    const rawBody = JSON.stringify(req.body);
    const isValid = verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET);
    if (!isValid) {
      console.warn("[Webhook] Invalid signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const payload = req.body;
    console.log("[Webhook] Received valid webhook:", {
      id: payload.id,
      status: payload.status,
    });

    // Extract prediction ID from webhook payload
    const predictionId = payload.id;
    if (!predictionId) {
      console.warn("[Webhook] Missing prediction ID");
      return res.status(400).json({ error: "Missing prediction ID" });
    }

    // Find job by prediction ID
    const db = await getDb();
    if (!db) {
      console.error("[Webhook] Database not available");
      return res.status(500).json({ error: "Database error" });
    }

    const jobs = await db
      .select()
      .from(faceSwapJobs)
      .where(eq(faceSwapJobs.predictionId, predictionId))
      .limit(1);

    if (jobs.length === 0) {
      console.warn("[Webhook] Job not found for prediction:", predictionId);
      return res.status(404).json({ error: "Job not found" });
    }

    const job = jobs[0];
    console.log("[Webhook] Found job #" + job.id);

    // Update job based on webhook status
    if (payload.status === "succeeded") {
      // Download result and upload to S3
      const output = payload.output;
      if (!output || (Array.isArray(output) && output.length === 0)) {
        console.error("[Webhook] No output in webhook payload");
        await db
          .update(faceSwapJobs)
          .set({
            status: "failed",
            errorMessage: "No output images were generated",
          })
          .where(eq(faceSwapJobs.id, job.id));
        return res.status(200).json({ success: true });
      }

      const resultUrl = Array.isArray(output) ? output[0] : output;
      const fileExtension = job.targetMediaType === "video" ? "mp4" : "jpg";
      const resultKey = `results/${job.userId}-${Date.now()}.${fileExtension}`;

      try {
        const { url: s3Url } = await downloadAndUploadToS3(resultUrl, resultKey);

        await db
          .update(faceSwapJobs)
          .set({
            status: "completed",
            resultMediaUrl: s3Url,
            resultMediaKey: resultKey,
            progress: 100,
          })
          .where(eq(faceSwapJobs.id, job.id));

        console.log("[Webhook] ✓ Job #" + job.id + " completed via webhook");
      } catch (error) {
        console.error("[Webhook] Failed to download/upload result:", error);
        await db
          .update(faceSwapJobs)
          .set({
            status: "failed",
            errorMessage: "Failed to download result: " + (error as Error).message,
          })
          .where(eq(faceSwapJobs.id, job.id));
      }
    } else if (payload.status === "failed" || payload.status === "canceled") {
      await db
        .update(faceSwapJobs)
        .set({
          status: "failed",
          errorMessage: payload.error || "Prediction failed",
        })
        .where(eq(faceSwapJobs.id, job.id));

      console.log("[Webhook] ✗ Job #" + job.id + " failed via webhook");
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
