/**
 * Face Detection Service using @vladmandic/face-api
 * Detects faces in images and returns bounding boxes for image blending
 */

import * as faceapi from "@vladmandic/face-api";
import canvas from "canvas";
import fetch from "node-fetch";
import path from "path";
import fs from "fs";

// Setup canvas for face-api
const { Canvas, Image, ImageData } = canvas;
// @ts-ignore
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;
const MODEL_PATH = path.join(process.cwd(), "node_modules/@vladmandic/face-api/model");

/**
 * Load face detection models (only once)
 */
async function loadModels() {
  if (modelsLoaded) return;
  
  try {
    console.log("[FaceDetection] Loading models from:", MODEL_PATH);
    
    // Load only the models we need for face detection
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
    
    modelsLoaded = true;
    console.log("[FaceDetection] Models loaded successfully");
  } catch (error) {
    console.error("[FaceDetection] Failed to load models:", error);
    throw new Error("Failed to load face detection models");
  }
}

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceDetectionResult {
  success: boolean;
  faceBox?: FaceBox;
  confidence?: number;
  error?: string;
}

/**
 * Detect face in image and return bounding box
 */
export async function detectFace(imageUrl: string): Promise<FaceDetectionResult> {
  try {
    // Load models if not already loaded
    await loadModels();
    
    console.log("[FaceDetection] Fetching image:", imageUrl);
    
    // Fetch image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const buffer = await response.buffer();
    
    // Load image into canvas
    const img = new Image();
    img.src = buffer;
    
    console.log("[FaceDetection] Image loaded, detecting faces...");
    
    // Detect faces
    const detections = await faceapi
      .detectAllFaces(img as any)
      .withFaceLandmarks();
    
    if (!detections || detections.length === 0) {
      console.log("[FaceDetection] No faces detected");
      return {
        success: false,
        error: "No face detected in image",
      };
    }
    
    // Use the first (largest) face
    const detection = detections[0];
    const box = detection.detection.box;
    
    console.log("[FaceDetection] Face detected:", {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      confidence: detection.detection.score,
    });
    
    return {
      success: true,
      faceBox: {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      },
      confidence: detection.detection.score,
    };
  } catch (error: any) {
    console.error("[FaceDetection] Error:", error);
    return {
      success: false,
      error: error.message || "Unknown error during face detection",
    };
  }
}

/**
 * Check if face detection is available
 */
export function isFaceDetectionAvailable(): boolean {
  return fs.existsSync(MODEL_PATH);
}
