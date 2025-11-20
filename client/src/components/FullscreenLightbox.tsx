import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Download, Trash2 } from "lucide-react";
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
}

export default function FullscreenLightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
  onDelete,
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

  const handleDownload = () => {
    if (currentImage) {
      window.open(currentImage.url, '_blank');
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
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {currentImage?.url.endsWith('.mp4') || currentImage?.url.endsWith('.webm') || currentImage?.url.endsWith('.mov') ? (
          <video
            src={currentImage.url}
            controls
            autoPlay
            className="max-w-full max-h-[90vh] object-contain"
          />
        ) : (
          <img
            src={currentImage?.url}
            alt={`Result ${currentIndex + 1}`}
            className="max-w-full max-h-[90vh] object-contain"
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
