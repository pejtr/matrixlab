import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SavedFacesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFace: (faceImageUrl: string) => void;
}

export default function SavedFacesDialog({ open, onOpenChange, onSelectFace }: SavedFacesDialogProps) {
  const [newFaceName, setNewFaceName] = useState("");
  const utils = trpc.useUtils();

  const { data: savedFaces, isLoading } = trpc.savedFaces.getMySavedFaces.useQuery(undefined, {
    enabled: open,
  });

  const deleteFaceMutation = trpc.savedFaces.deleteFace.useMutation({
    onSuccess: () => {
      utils.savedFaces.getMySavedFaces.invalidate();
      toast.success("Face deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete face");
    },
  });

  const handleSelectFace = (faceImageUrl: string) => {
    onSelectFace(faceImageUrl);
    onOpenChange(false);
    toast.success("Face loaded!");
  };

  const handleDeleteFace = (faceId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this saved face?")) {
      deleteFaceMutation.mutate({ faceId });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-purple-900/95 via-indigo-900/95 to-blue-900/95 backdrop-blur-lg border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Saved Faces</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-white/70" />
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {/* Show up to 5 faces */}
              {Array.from({ length: 5 }).map((_, index) => {
                const face = savedFaces?.[index];
                if (face) {
                  return (
                <div
                  key={face.id}
                  className="relative group cursor-pointer bg-white/10 rounded-lg p-2 hover:bg-white/20 transition-colors"
                  onClick={() => handleSelectFace(face.faceImageUrl)}
                >
                  <img
                    src={face.faceImageUrl}
                    alt={face.name}
                    className="w-full h-32 object-cover rounded"
                  />
                  <p className="text-xs text-center mt-1 text-white/90 truncate">{face.name}</p>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeleteFace(face.id, e)}
                    className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                    </div>
                  );
                } else {
                  // Empty slot - upload new face
                  return (
                    <div
                      key={`empty-${index}`}
                      className="relative cursor-pointer bg-white/5 rounded-lg p-2 hover:bg-white/10 transition-colors border-2 border-dashed border-white/20 hover:border-pink-500"
                      onClick={() => {
                        onOpenChange(false);
                        document.querySelector<HTMLInputElement>('input[type="file"][accept*="image"]')?.click();
                      }}
                    >
                      <div className="w-full h-32 flex items-center justify-center rounded">
                        <div className="text-center">
                          <div className="text-4xl text-white/40 mb-1">+</div>
                          <p className="text-xs text-white/60">Add Face</p>
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}

          <div className="pt-4 border-t border-white/20">
            <p className="text-sm text-white/70 mb-2">
              {savedFaces && savedFaces.length > 0 && (
                <span className="font-semibold">{savedFaces.length} / 8 saved faces</span>
              )}
              {savedFaces && savedFaces.length >= 8 && (
                <span className="text-yellow-400 block mt-1">⚠️ Maximum limit reached. Delete a face to add new ones.</span>
              )}
            </p>
            <p className="text-xs text-white/60">
              Tip: After uploading a source face, you can save it by clicking the bookmark icon
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
