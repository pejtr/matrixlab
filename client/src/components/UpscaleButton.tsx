import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Maximize2, Loader2, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface UpscaleButtonProps {
  imageUrl: string;
}

/**
 * Upscale Button Component
 * Provides 4x image upscaling using Real-ESRGAN
 */
export default function UpscaleButton({ imageUrl }: UpscaleButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null);

  const upscaleMutation = trpc.upscale.upscaleImage.useMutation({
    onSuccess: (result) => {
      setUpscaledUrl(result.outputUrl!);
      toast.success("Image upscaled successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Upscale failed");
    },
  });

  const handleUpscale = () => {
    setIsOpen(true);
    setUpscaledUrl(null);
    upscaleMutation.mutate({ imageUrl, scale: 4 });
  };

  return (
    <>
      <Button
        onClick={handleUpscale}
        variant="outline"
        className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
      >
        <Maximize2 className="mr-2 h-4 w-4" />
        Upscale 4x
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Upscale Image (4x)</DialogTitle>
            <DialogDescription>
              Enhance image resolution using Real-ESRGAN AI model
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {upscaleMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
                <p className="text-sm text-gray-500">Upscaling image... This may take 30-60 seconds</p>
              </div>
            ) : upscaledUrl ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Original</p>
                    <img src={imageUrl} alt="Original" className="w-full rounded-lg border" />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Upscaled (4x)</p>
                    <img src={upscaledUrl} alt="Upscaled" className="w-full rounded-lg border" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => window.open(upscaledUrl, "_blank")}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Upscaled
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
