import { useEffect, useRef, useState } from "react";
import { DetectedFace } from "@/hooks/useFaceDetection";

interface FaceDetectionOverlayProps {
  imageUrl: string;
  faces: DetectedFace[];
  selectedFaceIndex: number;
  onFaceSelect: (index: number) => void;
  imageWidth: number;
  imageHeight: number;
}

/**
 * Canvas overlay component that displays green bounding boxes around detected faces
 * Allows user to click on faces to select which one should be protected
 */
export function FaceDetectionOverlay({
  imageUrl,
  faces,
  selectedFaceIndex,
  onFaceSelect,
  imageWidth,
  imageHeight,
}: FaceDetectionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredFaceIndex, setHoveredFaceIndex] = useState<number | null>(null);

  // Draw face bounding boxes on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || faces.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each face box
    faces.forEach((face, index) => {
      const isSelected = index === selectedFaceIndex;
      const isHovered = index === hoveredFaceIndex;

      // Box style
      ctx.strokeStyle = isSelected ? "#10b981" : "#22c55e"; // Green-500 for selected, green-400 for others
      ctx.lineWidth = isSelected ? 4 : isHovered ? 3 : 2;
      ctx.setLineDash(isSelected ? [] : [8, 4]); // Solid for selected, dashed for others

      // Draw rectangle
      ctx.strokeRect(face.x, face.y, face.width, face.height);

      // Draw label background
      const label = isSelected ? "SELECTED" : `Face ${index + 1}`;
      const fontSize = 14;
      ctx.font = `bold ${fontSize}px sans-serif`;
      const textMetrics = ctx.measureText(label);
      const padding = 4;
      const labelWidth = textMetrics.width + padding * 2;
      const labelHeight = fontSize + padding * 2;

      // Position label above face box
      const labelX = face.x;
      const labelY = face.y - labelHeight - 4;

      // Draw label background
      ctx.fillStyle = isSelected ? "#10b981" : "#22c55e";
      ctx.fillRect(labelX, labelY, labelWidth, labelHeight);

      // Draw label text
      ctx.fillStyle = "#ffffff";
      ctx.textBaseline = "top";
      ctx.fillText(label, labelX + padding, labelY + padding);

      // Draw confidence score
      const confidenceText = `${Math.round(face.confidence * 100)}%`;
      ctx.font = `${fontSize - 2}px sans-serif`;
      ctx.fillStyle = isSelected ? "#10b981" : "#22c55e";
      ctx.fillText(
        confidenceText,
        face.x + face.width - ctx.measureText(confidenceText).width - padding,
        face.y + face.height + 4
      );
    });
  }, [faces, selectedFaceIndex, hoveredFaceIndex]);

  // Handle canvas click to select face
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.stopPropagation(); // Prevent triggering parent click handlers (file upload)
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Find clicked face
    const clickedFaceIndex = faces.findIndex(
      (face) =>
        x >= face.x &&
        x <= face.x + face.width &&
        y >= face.y &&
        y <= face.y + face.height
    );

    if (clickedFaceIndex !== -1) {
      onFaceSelect(clickedFaceIndex);
    }
  };

  // Handle mouse move for hover effect
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Find hovered face
    const hoveredIndex = faces.findIndex(
      (face) =>
        x >= face.x &&
        x <= face.x + face.width &&
        y >= face.y &&
        y <= face.y + face.height
    );

    setHoveredFaceIndex(hoveredIndex !== -1 ? hoveredIndex : null);
  };

  const handleMouseLeave = () => {
    setHoveredFaceIndex(null);
  };

  return (
    <canvas
      ref={canvasRef}
      width={imageWidth}
      height={imageHeight}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="absolute inset-0 cursor-pointer z-10"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
      }}
    />
  );
}
