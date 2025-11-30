import { useEffect, useRef, useState } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

export interface DetectedFace {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export function useFaceDetection() {
  const [isReady, setIsReady] = useState(false);
  const faceDetectorRef = useRef<FaceDetector | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initializeFaceDetector() {
      try {
        console.log("[FaceDetection] Initializing MediaPipe Face Detector...");

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          minDetectionConfidence: 0.5,
        });

        if (isMounted) {
          faceDetectorRef.current = detector;
          setIsReady(true);
          console.log("[FaceDetection] MediaPipe Face Detector ready");
        }
      } catch (error) {
        console.error("[FaceDetection] Failed to initialize:", error);
      }
    }

    initializeFaceDetector();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Detect faces in an image file
   * Returns up to maxFaces faces, prioritized by size (area) then confidence
   * When maxFaces=1, returns only the largest face (main subject)
   */
  const detectFaces = async (imageFile: File, maxFaces: number = 5): Promise<DetectedFace[]> => {
    if (!faceDetectorRef.current) {
      console.warn("[FaceDetection] Detector not ready");
      return [];
    }

    try {
      // Create image element from file
      const imageUrl = URL.createObjectURL(imageFile);
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = (e) => reject(new Error('Failed to load image'));
        img.src = imageUrl;
      });

      console.log("[FaceDetection] Detecting faces in image:", img.width, "x", img.height);

      // Detect faces
      const detections = faceDetectorRef.current.detect(img);
      
      URL.revokeObjectURL(imageUrl);

      if (!detections || !detections.detections || detections.detections.length === 0) {
        console.log("[FaceDetection] No faces detected");
        return [];
      }

      console.log("[FaceDetection] Found", detections.detections.length, "faces");

      // Convert to our format
      const faces: DetectedFace[] = detections.detections
        .map((detection) => {
          const box = detection.boundingBox;
          if (!box) return null;

          return {
            x: box.originX,
            y: box.originY,
            width: box.width,
            height: box.height,
            confidence: detection.categories?.[0]?.score || 0,
          };
        })
        .filter((face): face is DetectedFace => face !== null);

      // Sort by face area (size) first, then by confidence
      // This ensures we select the main/largest face, not just highest confidence
      faces.sort((a, b) => {
        const areaA = a.width * a.height;
        const areaB = b.width * b.height;
        if (Math.abs(areaA - areaB) > 100) { // Significant size difference
          return areaB - areaA; // Larger face first
        }
        return b.confidence - a.confidence; // Similar size, use confidence
      });

      // Return up to maxFaces (default 5) with largest faces first
      const topFaces = faces.slice(0, maxFaces);
      
      console.log("[FaceDetection] Returning top", topFaces.length, "faces:", topFaces);
      
      return topFaces;
    } catch (error) {
      console.error("[FaceDetection] Error detecting faces:", error instanceof Error ? error.message : String(error));
      return [];
    }
  };

  return {
    isReady,
    detectFaces,
  };
}
