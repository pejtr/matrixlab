import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Film, Loader2 } from "lucide-react";

interface AnimateDialogProps {
  open: boolean;
  onClose: () => void;
  onAnimate: (prompt: string) => Promise<void>;
  isAnimating: boolean;
}

const PRESET_PROMPTS = [
  {
    label: "Natural Movement",
    prompt: "Natural facial expressions and subtle head movement",
    icon: "😊",
  },
  {
    label: "Smiling",
    prompt: "Person smiling warmly with gentle eye movement",
    icon: "😄",
  },
  {
    label: "Talking",
    prompt: "Person talking naturally with lip sync and facial expressions",
    icon: "💬",
  },
  {
    label: "Looking Around",
    prompt: "Person looking around slowly, eyes moving left and right",
    icon: "👀",
  },
  {
    label: "Nodding",
    prompt: "Person nodding head in agreement with friendly expression",
    icon: "👍",
  },
  {
    label: "Winking",
    prompt: "Person winking playfully with a slight smile",
    icon: "😉",
  },
];

export default function AnimateDialog({ open, onClose, onAnimate, isAnimating }: AnimateDialogProps) {
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(0);

  const handleAnimate = async () => {
    const prompt = customPrompt.trim() || PRESET_PROMPTS[selectedPreset]!.prompt;
    await onAnimate(prompt);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-xl border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Film className="h-6 w-6 text-pink-400" />
            Animate Result
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Preset Prompts */}
          <div>
            <label className="text-sm font-medium text-white/90 mb-3 block">
              Choose Animation Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_PROMPTS.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedPreset(index);
                    setCustomPrompt(""); // Clear custom prompt when selecting preset
                  }}
                  className={`
                    p-3 rounded-lg border-2 transition-all text-left
                    ${
                      selectedPreset === index && !customPrompt
                        ? "border-pink-500 bg-pink-500/20"
                        : "border-white/20 bg-white/5 hover:bg-white/10"
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{preset.icon}</span>
                    <div>
                      <div className="font-medium text-sm text-white">{preset.label}</div>
                      <div className="text-xs text-white/60 mt-0.5 line-clamp-2">{preset.prompt}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt */}
          <div>
            <label className="text-sm font-medium text-white/90 mb-2 block">
              Or Enter Custom Prompt
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe the animation you want... (e.g., 'Person laughing joyfully with eyes closed')"
              className="w-full h-20 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none text-sm"
            />
            <p className="text-xs text-white/50 mt-2">
              Custom prompts override preset selections
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onClose}
              disabled={isAnimating}
              variant="outline"
              className="flex-1 bg-transparent border-white/30 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAnimate}
              disabled={isAnimating}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              {isAnimating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Film className="mr-2 h-4 w-4" />
                  Generate Animation
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
