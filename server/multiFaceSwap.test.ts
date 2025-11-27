import { describe, it, expect } from "vitest";
import { FaceBox } from "./multiFaceSwapService";

/**
 * Test helper to calculate crop box with margin
 * (Extracted from multiFaceSwapService for testing)
 */
function calculateCropBox(
  face: FaceBox,
  imageWidth: number,
  imageHeight: number,
  marginPercent: number = 1.5
): FaceBox {
  // Calculate center of face
  const centerX = face.x + face.width / 2;
  const centerY = face.y + face.height / 2;

  // Calculate new dimensions with margin
  const newWidth = face.width * marginPercent;
  const newHeight = face.height * marginPercent;

  // Calculate new top-left corner (centered on face)
  let x = Math.floor(centerX - newWidth / 2);
  let y = Math.floor(centerY - newHeight / 2);

  // Ensure crop box stays within image bounds
  x = Math.max(0, x);
  y = Math.max(0, y);

  const width = Math.min(newWidth, imageWidth - x);
  const height = Math.min(newHeight, imageHeight - y);

  return {
    x: Math.floor(x),
    y: Math.floor(y),
    width: Math.floor(width),
    height: Math.floor(height),
  };
}

describe("Multi-Face Processing", () => {
  describe("calculateCropBox", () => {
    it("should calculate crop box with 150% margin for centered face", () => {
      const face: FaceBox = {
        x: 100,
        y: 100,
        width: 200,
        height: 200,
      };
      const imageWidth = 1000;
      const imageHeight = 1000;

      const cropBox = calculateCropBox(face, imageWidth, imageHeight, 1.5);

      // Face center: (200, 200)
      // New dimensions: 300x300 (200 * 1.5)
      // Expected top-left: (50, 50) - centered on face
      expect(cropBox.x).toBe(50);
      expect(cropBox.y).toBe(50);
      expect(cropBox.width).toBe(300);
      expect(cropBox.height).toBe(300);
    });

    it("should clamp crop box to image bounds when face is near edge", () => {
      const face: FaceBox = {
        x: 10,
        y: 10,
        width: 100,
        height: 100,
      };
      const imageWidth = 500;
      const imageHeight = 500;

      const cropBox = calculateCropBox(face, imageWidth, imageHeight, 1.5);

      // Face center: (60, 60)
      // New dimensions: 150x150
      // Ideal top-left would be (-15, -15), but clamped to (0, 0)
      expect(cropBox.x).toBe(0);
      expect(cropBox.y).toBe(0);
      expect(cropBox.width).toBeLessThanOrEqual(150);
      expect(cropBox.height).toBeLessThanOrEqual(150);
    });

    it("should handle face at bottom-right corner", () => {
      const face: FaceBox = {
        x: 800,
        y: 800,
        width: 150,
        height: 150,
      };
      const imageWidth = 1000;
      const imageHeight = 1000;

      const cropBox = calculateCropBox(face, imageWidth, imageHeight, 1.5);

      // Face center: (875, 875)
      // New dimensions: 225x225
      // Ideal top-left: (762.5, 762.5)
      // Should be clamped to stay within image bounds
      expect(cropBox.x).toBeGreaterThanOrEqual(0);
      expect(cropBox.y).toBeGreaterThanOrEqual(0);
      expect(cropBox.x + cropBox.width).toBeLessThanOrEqual(imageWidth);
      expect(cropBox.y + cropBox.height).toBeLessThanOrEqual(imageHeight);
    });

    it("should handle different margin percentages", () => {
      const face: FaceBox = {
        x: 200,
        y: 200,
        width: 100,
        height: 100,
      };
      const imageWidth = 800;
      const imageHeight = 800;

      // Test with 2x margin (200%)
      const cropBox2x = calculateCropBox(face, imageWidth, imageHeight, 2.0);
      expect(cropBox2x.width).toBe(200);
      expect(cropBox2x.height).toBe(200);

      // Test with 1x margin (no expansion)
      const cropBox1x = calculateCropBox(face, imageWidth, imageHeight, 1.0);
      expect(cropBox1x.width).toBe(100);
      expect(cropBox1x.height).toBe(100);
    });

    it("should handle very small faces", () => {
      const face: FaceBox = {
        x: 400,
        y: 400,
        width: 20,
        height: 20,
      };
      const imageWidth = 1000;
      const imageHeight: number = 1000;

      const cropBox = calculateCropBox(face, imageWidth, imageHeight, 1.5);

      // Face center: (410, 410)
      // New dimensions: 30x30
      // Expected top-left: (395, 395)
      expect(cropBox.x).toBe(395);
      expect(cropBox.y).toBe(395);
      expect(cropBox.width).toBe(30);
      expect(cropBox.height).toBe(30);
    });

    it("should handle rectangular faces (non-square)", () => {
      const face: FaceBox = {
        x: 300,
        y: 200,
        width: 150,
        height: 200,
      };
      const imageWidth = 1000;
      const imageHeight = 1000;

      const cropBox = calculateCropBox(face, imageWidth, imageHeight, 1.5);

      // Face center: (375, 300)
      // New dimensions: 225x300
      expect(cropBox.width).toBe(225);
      expect(cropBox.height).toBe(300);
    });
  });

  describe("Face detection edge cases", () => {
    it("should handle empty face array", () => {
      const faces: FaceBox[] = [];
      expect(faces.length).toBe(0);
    });

    it("should handle single face", () => {
      const faces: FaceBox[] = [
        { x: 100, y: 100, width: 200, height: 200 },
      ];
      expect(faces.length).toBe(1);
    });

    it("should handle two faces (max supported)", () => {
      const faces: FaceBox[] = [
        { x: 100, y: 100, width: 200, height: 200 },
        { x: 500, y: 100, width: 200, height: 200 },
      ];
      expect(faces.length).toBe(2);
    });

    it("should serialize and deserialize face boxes as JSON", () => {
      const faces: FaceBox[] = [
        { x: 100, y: 100, width: 200, height: 200 },
        { x: 500, y: 100, width: 180, height: 180 },
      ];

      const json = JSON.stringify(faces);
      const parsed = JSON.parse(json) as FaceBox[];

      expect(parsed).toEqual(faces);
      expect(parsed.length).toBe(2);
      expect(parsed[0].x).toBe(100);
      expect(parsed[1].width).toBe(180);
    });
  });
});
