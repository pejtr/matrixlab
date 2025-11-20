import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { Loader2, RotateCcw } from "lucide-react";

interface CropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onSave: (croppedImageUrl: string) => Promise<void>;
}

export default function CropDialog({ open, onOpenChange, imageUrl, onSave }: CropDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Load image when dialog opens
  useEffect(() => {
    if (open && imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setImage(img);
        
        // Calculate canvas size to fit in dialog (max 800x600)
        const maxWidth = 800;
        const maxHeight = 600;
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        setCanvasSize({ width, height });
        
        // Initialize crop area to center 80% of image
        const cropWidth = width * 0.8;
        const cropHeight = height * 0.8;
        setCropArea({
          x: (width - cropWidth) / 2,
          y: (height - cropHeight) / 2,
          width: cropWidth,
          height: cropHeight,
        });
      };
      img.src = imageUrl;
    }
  }, [open, imageUrl]);

  // Draw image and crop overlay on canvas
  useEffect(() => {
    if (!canvasRef.current || !image) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    ctx.drawImage(image, 0, 0, canvasSize.width, canvasSize.height);
    
    // Draw dark overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clear crop area (show original image)
    ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    ctx.drawImage(
      image,
      (cropArea.x / canvasSize.width) * image.width,
      (cropArea.y / canvasSize.height) * image.height,
      (cropArea.width / canvasSize.width) * image.width,
      (cropArea.height / canvasSize.height) * image.height,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height
    );
    
    // Draw crop border
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2;
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    
    // Draw corner handles
    const handleSize = 12;
    ctx.fillStyle = "#10b981";
    // Top-left
    ctx.fillRect(cropArea.x - handleSize/2, cropArea.y - handleSize/2, handleSize, handleSize);
    // Top-right
    ctx.fillRect(cropArea.x + cropArea.width - handleSize/2, cropArea.y - handleSize/2, handleSize, handleSize);
    // Bottom-left
    ctx.fillRect(cropArea.x - handleSize/2, cropArea.y + cropArea.height - handleSize/2, handleSize, handleSize);
    // Bottom-right
    ctx.fillRect(cropArea.x + cropArea.width - handleSize/2, cropArea.y + cropArea.height - handleSize/2, handleSize, handleSize);
  }, [image, cropArea, canvasSize]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const dx = x - dragStart.x;
    const dy = y - dragStart.y;
    
    setCropArea(prev => ({
      ...prev,
      x: Math.max(0, Math.min(canvasSize.width - prev.width, prev.x + dx)),
      y: Math.max(0, Math.min(canvasSize.height - prev.height, prev.y + dy)),
    }));
    
    setDragStart({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    if (!image) return;
    
    const cropWidth = canvasSize.width * 0.8;
    const cropHeight = canvasSize.height * 0.8;
    setCropArea({
      x: (canvasSize.width - cropWidth) / 2,
      y: (canvasSize.height - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    });
  };

  const handleSave = async () => {
    if (!image) return;
    
    setIsLoading(true);
    try {
      // Create a new canvas for the cropped image
      const croppedCanvas = document.createElement("canvas");
      const scaleX = image.width / canvasSize.width;
      const scaleY = image.height / canvasSize.height;
      
      croppedCanvas.width = cropArea.width * scaleX;
      croppedCanvas.height = cropArea.height * scaleY;
      
      const ctx = croppedCanvas.getContext("2d");
      if (!ctx) return;
      
      ctx.drawImage(
        image,
        cropArea.x * scaleX,
        cropArea.y * scaleY,
        cropArea.width * scaleX,
        cropArea.height * scaleY,
        0,
        0,
        croppedCanvas.width,
        croppedCanvas.height
      );
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        croppedCanvas.toBlob((b) => resolve(b!), "image/jpeg", 0.95);
      });
      
      // Upload to server
      const formData = new FormData();
      formData.append("file", blob, "cropped.jpg");
      
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      
      // Call onSave with new URL
      await onSave(uploadData.url);
      
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save cropped image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="border border-white/20 rounded cursor-move"
            />
          </div>
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-gradient-to-r from-green-500 to-emerald-500"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
