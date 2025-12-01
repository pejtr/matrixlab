import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Download, Trash2, Bookmark, Upload, Crop } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FullscreenLightboxProps {
  images: Array<{
    url: string;
    id: number;
  }>;
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onDelete?: (id: number) => void;
  onSave?: (imageUrl: string) => void;
  showSave?: boolean;
  onUpload?: () => void;
  showUpload?: boolean;
  onCrop?: (imageUrl: string) => void;
  showCrop?: boolean;
}

export default function FullscreenLightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
  onDelete,
  onSave,
  showSave = false,
  onUpload,
  showUpload = false,
  onCrop,
  showCrop = false,
}: FullscreenLightboxProps) {
  const currentImage = images[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      } else if (e.key === "ArrowRight" && currentIndex < images.length - 1) {
        onNavigate(currentIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, images.length, onClose, onNavigate]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Touch/swipe support for mobile
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0]!.screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0]!.screenX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeThreshold = 50;
      if (touchStartX - touchEndX > swipeThreshold && currentIndex < images.length - 1) {
        // Swipe left - next image
        onNavigate(currentIndex + 1);
      } else if (touchEndX - touchStartX > swipeThreshold && currentIndex > 0) {
        // Swipe right - previous image
        onNavigate(currentIndex - 1);
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentIndex, images.length, onNavigate]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  const handleDownload = async () => {
    if (!currentImage) return;
    try {
      // Use CORS proxy for cross-origin downloads
      const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(currentImage.url)}`;
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'image/*,video/*',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Determine file extension from URL or blob type
      const urlExt = currentImage.url.split('.').pop()?.split('?')[0];
      const blobExt = blob.type.split('/')[1];
      const extension = urlExt || blobExt || 'jpg';
      
      a.download = `faceswap-${Date.now()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/10 h-10 w-10 p-0"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Counter */}
      <div className="absolute top-4 left-4 z-10 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Delete Button */}
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Delete this result?')) {
              onDelete(currentImage.id);
              // Close lightbox if it was the last image
              if (images.length === 1) {
                onClose();
              }
            }
          }}
          className="absolute top-4 right-28 z-10 text-red-500 hover:bg-red-500/20 h-10 w-10 p-0"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      )}

      {/* Save Button (only for source faces) */}
      {showSave && onSave && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onSave(currentImage.url);
          }}
          className="absolute top-4 right-40 z-10 text-green-400 hover:bg-green-500/20 h-10 w-10 p-0"
        >
          <Bookmark className="h-5 w-5" />
        </Button>
      )}

      {/* Upload Button (only for target media) */}
      {showUpload && onUpload && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onUpload();
            onClose();
          }}
          className="absolute top-4 right-52 z-10 text-blue-400 hover:bg-blue-500/20 h-10 w-10 p-0"
          title="Upload new media"
        >
          <Upload className="h-5 w-5" />
        </Button>
      )}

      {/* Crop Button */}
      {showCrop && onCrop && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onCrop(currentImage.url);
          }}
          className="absolute top-4 right-40 z-10 text-yellow-400 hover:bg-yellow-500/20 h-10 w-10 p-0"
          title="Crop image"
        >
          <Crop className="h-5 w-5" />
        </Button>
      )}

      {/* Download Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleDownload();
        }}
        className="absolute top-4 right-16 z-10 text-white hover:bg-white/10 h-10 w-10 p-0"
      >
        <Download className="h-5 w-5" />
      </Button>

      {/* Previous Button */}
      {currentIndex > 0 && (
        <Button
          variant="ghost"
          size="lg"
          onClick={(e) => {
            e.stopPropagation();
            handlePrevious();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/10 h-16 w-16 p-0 rounded-full"
        >
          <ChevronLeft className="h-10 w-10" />
        </Button>
      )}

      {/* Next Button */}
      {currentIndex < images.length - 1 && (
        <Button
          variant="ghost"
          size="lg"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/10 h-16 w-16 p-0 rounded-full"
        >
          <ChevronRight className="h-10 w-10" />
        </Button>
      )}

      {/* Image */}
      <div
        className="relative w-full h-full flex items-center justify-center px-0 py-0 md:px-24 md:py-20"
        onClick={(e) => e.stopPropagation()}
      >
        {currentImage?.url.endsWith('.mp4') || currentImage?.url.endsWith('.webm') || currentImage?.url.endsWith('.mov') ? (
          <video
            src={currentImage.url}
            controls
            autoPlay
            className="w-full h-full md:max-w-full md:max-h-full md:h-full md:w-auto object-cover md:object-contain"
          />
        ) : (
          <img
            src={currentImage?.url}
            alt={`Result ${currentIndex + 1}`}
            className="max-h-[85vh] max-w-[95vw] md:max-h-[80vh] md:max-w-[90vw] object-contain"
          />
        )}
      </div>

      {/* Thumbnail Strip */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-black/50 p-2 rounded-lg max-w-[90vw] overflow-x-auto">
        {images.map((img, idx) => (
          <button
            key={img.id}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(idx);
            }}
            className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
              idx === currentIndex
                ? "border-pink-500 scale-110"
                : "border-white/30 hover:border-white/50"
            }`}
          >
            <img
              src={img.url}
              alt={`Thumbnail ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
