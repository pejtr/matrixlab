import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Loader2, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface EnhanceButtonProps {
  imageUrl: string;
  jobId?: number;
}

/**
 * Enhance Button Component
 * Provides face enhancement using Real-ESRGAN (similar to upscale but optimized for faces)
 * This improves quality after face swap operations
 */
export default function EnhanceButton({ imageUrl, jobId }: EnhanceButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);

  const enhanceMutation = trpc.upscale.upscaleImage.useMutation({
    onSuccess: (result) => {
      setEnhancedUrl(result.outputUrl!);
      toast.success("Face enhanced successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Enhancement failed");
    },
  });

  const handleEnhance = () => {
    setIsOpen(true);
    setEnhancedUrl(null);
    // Use 2x scale for face enhancement (better balance between quality and speed)
    enhanceMutation.mutate({ imageUrl, scale: 2 });
  };

  return (
    <>
      <Button
        size="sm"
        onClick={handleEnhance}
        className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 h-8 w-8 p-0 shadow-lg"
        title="Enhance face quality (AI upscale)"
      >
        <Sparkles className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Face Enhancement (AI Upscale 2x)</DialogTitle>
            <DialogDescription>
              Improve face quality and resolution using Real-ESRGAN AI model
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {enhanceMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-16 h-16 animate-spin text-violet-500 mb-4" />
                <p className="text-lg font-semibold text-gray-700 mb-2">Enhancing face quality...</p>
                <p className="text-sm text-gray-500">This may take 30-60 seconds</p>
                <div className="mt-4 w-64 bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-2 rounded-full animate-pulse" style={{ width: "60%" }} />
                </div>
              </div>
            ) : enhancedUrl ? (
              <>
                {/* Before/After Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">Before Enhancement</p>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Original</span>
                    </div>
                    <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden">
                      <img src={imageUrl} alt="Original" className="w-full" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">After Enhancement</p>
                      <span className="text-xs text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 px-2 py-1 rounded">Enhanced 2x</span>
                    </div>
                    <div className="relative border-2 border-violet-500 rounded-lg overflow-hidden shadow-lg">
                      <img src={enhancedUrl} alt="Enhanced" className="w-full" />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                        ✨ AI Enhanced
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch(enhancedUrl);
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `enhanced-${jobId || Date.now()}.png`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                        toast.success('Enhanced image downloaded!');
                      } catch (error) {
                        toast.error('Download failed');
                      }
                    }}
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Enhanced
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
