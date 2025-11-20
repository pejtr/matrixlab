import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { Loader2, RotateCcw, Lock, Unlock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onSave: (croppedImageUrl: string) => Promise<void>;
}

type AspectRatio = "free" | "1:1" | "4:3" | "16:9" | "9:16";
type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | null;

export default function CropDialog({ open, onOpenChange, imageUrl, onSave }: CropDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [aspectRatioLocked, setAspectRatioLocked] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("free");

  const getFaceImageBlobMutation = trpc.savedFaces.getFaceImageBlob.useMutation();

  // Load image when dialog opens
  useEffect(() => {
    if (open && imageUrl) {
      // Use tRPC proxy to bypass CORS
      getFaceImageBlobMutation.mutateAsync({ imageUrl })
        .then(({ data, contentType }) => {
          const img = new Image();
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
          img.src = `data:${contentType};base64,${data}`;
        })
        .catch((error) => {
          console.error('Failed to load image:', error);
        });
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
    
    // Draw resize handles (8 points: 4 corners + 4 sides)
    const handleSize = 12;
    ctx.fillStyle = "#10b981";
    
    // Corners
    ctx.fillRect(cropArea.x - handleSize/2, cropArea.y - handleSize/2, handleSize, handleSize); // NW
    ctx.fillRect(cropArea.x + cropArea.width - handleSize/2, cropArea.y - handleSize/2, handleSize, handleSize); // NE
    ctx.fillRect(cropArea.x - handleSize/2, cropArea.y + cropArea.height - handleSize/2, handleSize, handleSize); // SW
    ctx.fillRect(cropArea.x + cropArea.width - handleSize/2, cropArea.y + cropArea.height - handleSize/2, handleSize, handleSize); // SE
    
    // Sides
    ctx.fillRect(cropArea.x + cropArea.width/2 - handleSize/2, cropArea.y - handleSize/2, handleSize, handleSize); // N
    ctx.fillRect(cropArea.x + cropArea.width - handleSize/2, cropArea.y + cropArea.height/2 - handleSize/2, handleSize, handleSize); // E
    ctx.fillRect(cropArea.x + cropArea.width/2 - handleSize/2, cropArea.y + cropArea.height - handleSize/2, handleSize, handleSize); // S
    ctx.fillRect(cropArea.x - handleSize/2, cropArea.y + cropArea.height/2 - handleSize/2, handleSize, handleSize); // W
  }, [image, cropArea, canvasSize]);

  const getHandleAtPosition = (x: number, y: number): ResizeHandle => {
    const handleSize = 12;
    const threshold = handleSize;
    
    // Check corners first
    if (Math.abs(x - cropArea.x) < threshold && Math.abs(y - cropArea.y) < threshold) return "nw";
    if (Math.abs(x - (cropArea.x + cropArea.width)) < threshold && Math.abs(y - cropArea.y) < threshold) return "ne";
    if (Math.abs(x - cropArea.x) < threshold && Math.abs(y - (cropArea.y + cropArea.height)) < threshold) return "sw";
    if (Math.abs(x - (cropArea.x + cropArea.width)) < threshold && Math.abs(y - (cropArea.y + cropArea.height)) < threshold) return "se";
    
    // Check sides
    if (Math.abs(x - (cropArea.x + cropArea.width/2)) < threshold && Math.abs(y - cropArea.y) < threshold) return "n";
    if (Math.abs(x - (cropArea.x + cropArea.width)) < threshold && Math.abs(y - (cropArea.y + cropArea.height/2)) < threshold) return "e";
    if (Math.abs(x - (cropArea.x + cropArea.width/2)) < threshold && Math.abs(y - (cropArea.y + cropArea.height)) < threshold) return "s";
    if (Math.abs(x - cropArea.x) < threshold && Math.abs(y - (cropArea.y + cropArea.height/2)) < threshold) return "w";
    
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const handle = getHandleAtPosition(x, y);
    
    if (handle) {
      setIsResizing(true);
      setActiveHandle(handle);
    } else if (
      x >= cropArea.x &&
      x <= cropArea.x + cropArea.width &&
      y >= cropArea.y &&
      y <= cropArea.y + cropArea.height
    ) {
      setIsDragging(true);
    }
    
    setDragStart({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isResizing && activeHandle) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;
      
      let newCrop = { ...cropArea };
      const originalAspect = cropArea.width / cropArea.height;
      
      switch (activeHandle) {
        case "nw":
          newCrop.x += dx;
          newCrop.y += dy;
          newCrop.width -= dx;
          newCrop.height -= dy;
          break;
        case "ne":
          newCrop.y += dy;
          newCrop.width += dx;
          newCrop.height -= dy;
          break;
        case "sw":
          newCrop.x += dx;
          newCrop.width -= dx;
          newCrop.height += dy;
          break;
        case "se":
          newCrop.width += dx;
          newCrop.height += dy;
          break;
        case "n":
          newCrop.y += dy;
          newCrop.height -= dy;
          if (aspectRatioLocked) newCrop.width = newCrop.height * originalAspect;
          break;
        case "s":
          newCrop.height += dy;
          if (aspectRatioLocked) newCrop.width = newCrop.height * originalAspect;
          break;
        case "w":
          newCrop.x += dx;
          newCrop.width -= dx;
          if (aspectRatioLocked) newCrop.height = newCrop.width / originalAspect;
          break;
        case "e":
          newCrop.width += dx;
          if (aspectRatioLocked) newCrop.height = newCrop.width / originalAspect;
          break;
      }
      
      // Apply aspect ratio lock for corners
      if (aspectRatioLocked && ["nw", "ne", "sw", "se"].includes(activeHandle)) {
        newCrop.height = newCrop.width / originalAspect;
      }
      
      // Constrain to canvas bounds
      newCrop.x = Math.max(0, newCrop.x);
      newCrop.y = Math.max(0, newCrop.y);
      newCrop.width = Math.max(50, Math.min(canvasSize.width - newCrop.x, newCrop.width));
      newCrop.height = Math.max(50, Math.min(canvasSize.height - newCrop.y, newCrop.height));
      
      setCropArea(newCrop);
      setDragStart({ x, y });
    } else if (isDragging) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;
      
      setCropArea(prev => ({
        ...prev,
        x: Math.max(0, Math.min(canvasSize.width - prev.width, prev.x + dx)),
        y: Math.max(0, Math.min(canvasSize.height - prev.height, prev.y + dy)),
      }));
      
      setDragStart({ x, y });
    } else {
      // Update cursor based on handle position
      const handle = getHandleAtPosition(x, y);
      if (canvas) {
        if (handle) {
          const cursors: Record<string, string> = {
            nw: "nw-resize",
            n: "n-resize",
            ne: "ne-resize",
            e: "e-resize",
            se: "se-resize",
            s: "s-resize",
            sw: "sw-resize",
            w: "w-resize",
          };
          canvas.style.cursor = cursors[handle] || "default";
        } else if (
          x >= cropArea.x &&
          x <= cropArea.x + cropArea.width &&
          y >= cropArea.y &&
          y <= cropArea.y + cropArea.height
        ) {
          canvas.style.cursor = "move";
        } else {
          canvas.style.cursor = "default";
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setActiveHandle(null);
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

  const applyAspectRatio = (ratio: AspectRatio) => {
    setAspectRatio(ratio);
    
    if (ratio === "free") {
      setAspectRatioLocked(false);
      return;
    }
    
    setAspectRatioLocked(true);
    
    const ratios: Record<string, number> = {
      "1:1": 1,
      "4:3": 4/3,
      "16:9": 16/9,
      "9:16": 9/16,
    };
    
    const targetRatio = ratios[ratio];
    if (!targetRatio) return;
    
    // Adjust crop area to match aspect ratio
    const currentRatio = cropArea.width / cropArea.height;
    
    if (currentRatio > targetRatio) {
      // Too wide, adjust width
      const newWidth = cropArea.height * targetRatio;
      setCropArea(prev => ({
        ...prev,
        x: prev.x + (prev.width - newWidth) / 2,
        width: newWidth,
      }));
    } else {
      // Too tall, adjust height
      const newHeight = cropArea.width / targetRatio;
      setCropArea(prev => ({
        ...prev,
        y: prev.y + (prev.height - newHeight) / 2,
        height: newHeight,
      }));
    }
  };

  const applyCropPreset = (preset: "instagram-post" | "instagram-story" | "facebook-cover") => {
    const presets: Record<string, { ratio: AspectRatio; size: number }> = {
      "instagram-post": { ratio: "1:1", size: Math.min(canvasSize.width, canvasSize.height) * 0.8 },
      "instagram-story": { ratio: "9:16", size: canvasSize.height * 0.8 },
      "facebook-cover": { ratio: "16:9", size: canvasSize.width * 0.8 },
    };
    
    const config = presets[preset];
    if (!config) return;
    
    applyAspectRatio(config.ratio);
    
    // Set size based on preset
    const ratios: Record<string, number> = {
      "1:1": 1,
      "4:3": 4/3,
      "16:9": 16/9,
      "9:16": 9/16,
    };
    
    const targetRatio = ratios[config.ratio];
    let width, height;
    
    if (preset === "instagram-post") {
      width = height = config.size;
    } else if (preset === "instagram-story") {
      height = config.size;
      width = height * targetRatio;
    } else {
      width = config.size;
      height = width / targetRatio;
    }
    
    setCropArea({
      x: (canvasSize.width - width) / 2,
      y: (canvasSize.height - height) / 2,
      width,
      height,
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
          {/* Aspect Ratio Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
                className="h-8"
              >
                {aspectRatioLocked ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Unlock className="h-4 w-4" />
                )}
              </Button>
              
              <Select value={aspectRatio} onValueChange={(v) => applyAspectRatio(v as AspectRatio)}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="1:1">1:1</SelectItem>
                  <SelectItem value="4:3">4:3</SelectItem>
                  <SelectItem value="16:9">16:9</SelectItem>
                  <SelectItem value="9:16">9:16</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Crop Presets */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyCropPreset("instagram-post")}
                className="h-8 text-xs"
              >
                IG Post
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyCropPreset("instagram-story")}
                className="h-8 text-xs"
              >
                IG Story
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyCropPreset("facebook-cover")}
                className="h-8 text-xs"
              >
                FB Cover
              </Button>
            </div>
          </div>
          
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="border border-white/20 rounded"
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
