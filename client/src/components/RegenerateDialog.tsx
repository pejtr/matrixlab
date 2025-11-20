import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, Upload, Bookmark } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

interface Job {
  id: number;
  sourceImageUrl: string;
  sourceImageKey: string;
  targetMediaUrl: string;
  targetMediaKey: string;
  targetMediaType: "image" | "video";
  resultMediaUrl: string | null;
  status: string;
}

interface RegenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onRegenerate: (newSourceImageKey: string, newSourceImageUrl: string) => Promise<void>;
}

export default function RegenerateDialog({ open, onOpenChange, job, onRegenerate }: RegenerateDialogProps) {
  const [selectedSource, setSelectedSource] = useState<{ key: string; url: string } | null>(null);
  const [newSourceFile, setNewSourceFile] = useState<File | null>(null);
  const [newSourcePreview, setNewSourcePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: savedFaces } = trpc.savedFaces.getMySavedFaces.useQuery(undefined, {
    enabled: open,
  });

  // Reset state when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && job) {
      // Default to original source
      setSelectedSource({ key: job.sourceImageKey, url: job.sourceImageUrl });
      setNewSourceFile(null);
      setNewSourcePreview(null);
    } else {
      setSelectedSource(null);
      setNewSourceFile(null);
      setNewSourcePreview(null);
    }
    onOpenChange(newOpen);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setNewSourceFile(file);
    const reader = new FileReader();
    reader.onload = () => setNewSourcePreview(reader.result as string);
    reader.readAsDataURL(file);
    setSelectedSource(null); // Clear saved face selection
  };

  const handleRegenerate = async () => {
    if (!job) return;

    try {
      setIsUploading(true);

      let sourceKey: string;
      let sourceUrl: string;

      if (newSourceFile) {
        // Upload new source file
        const formData = new FormData();
        formData.append("file", newSourceFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Upload failed");
        const uploadData = await uploadRes.json();
        sourceKey = uploadData.key;
        sourceUrl = uploadData.url;
      } else if (selectedSource) {
        // Use selected saved face or original
        sourceKey = selectedSource.key;
        sourceUrl = selectedSource.url;
      } else {
        toast.error("Please select a source face");
        return;
      }

      await onRegenerate(sourceKey, sourceUrl);
      handleOpenChange(false);
    } catch (error) {
      console.error("Regenerate error:", error);
      toast.error("Failed to regenerate");
    } finally {
      setIsUploading(false);
    }
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl bg-gradient-to-br from-purple-900/95 via-indigo-900/95 to-blue-900/95 backdrop-blur-lg border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Regenerate with Different Face</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Selection Preview */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-white/70 mb-2">Source Face (will be used)</p>
              <div className="relative aspect-square bg-white/10 rounded-lg overflow-hidden">
                <img
                  src={newSourcePreview || selectedSource?.url || job.sourceImageUrl}
                  alt="Source"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div>
              <p className="text-sm text-white/70 mb-2">Target Media (unchanged)</p>
              <div className="relative aspect-square bg-white/10 rounded-lg overflow-hidden">
                <img
                  src={job.targetMediaUrl}
                  alt="Target"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Upload New Face */}
          <div>
            <p className="text-sm font-semibold text-white mb-2">Upload New Face</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Different Face
            </Button>
          </div>

          {/* Saved Faces Selection */}
          {savedFaces && savedFaces.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-white mb-2">Or Choose Saved Face</p>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {/* Original Face */}
                <div
                  onClick={() => {
                    setSelectedSource({ key: job.sourceImageKey, url: job.sourceImageUrl });
                    setNewSourceFile(null);
                    setNewSourcePreview(null);
                  }}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedSource?.key === job.sourceImageKey && !newSourceFile
                      ? "border-pink-500 ring-2 ring-pink-500"
                      : "border-white/20 hover:border-white/40"
                  }`}
                >
                  <img
                    src={job.sourceImageUrl}
                    alt="Original"
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                    <p className="text-[10px] text-white text-center">Original</p>
                  </div>
                </div>

                {/* Saved Faces */}
                {savedFaces.map((face) => (
                  <div
                    key={face.id}
                    onClick={() => {
                      setSelectedSource({ key: face.faceImageKey, url: face.faceImageUrl });
                      setNewSourceFile(null);
                      setNewSourcePreview(null);
                    }}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedSource?.key === face.faceImageKey && !newSourceFile
                        ? "border-pink-500 ring-2 ring-pink-500"
                        : "border-white/20 hover:border-white/40"
                    }`}
                  >
                    <img
                      src={face.faceImageUrl}
                      alt={face.name}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute top-1 left-1">
                      <Bookmark className="h-3 w-3 text-pink-500 fill-pink-500" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                      <p className="text-[10px] text-white text-center truncate">{face.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => handleOpenChange(false)}
              variant="outline"
              className="flex-1 bg-white/10 hover:bg-white/20 border-white/20 text-white"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRegenerate}
              disabled={isUploading || (!newSourceFile && !selectedSource)}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Regenerate"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
