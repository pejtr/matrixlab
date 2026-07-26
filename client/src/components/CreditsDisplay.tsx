import { useCredits } from "@/contexts/CreditsContext";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

interface CreditsDisplayProps {
  showPurchaseButton?: boolean;
  onPurchaseClick?: () => void;
  compact?: boolean;
}

export function CreditsDisplay({
  showPurchaseButton = true,
  onPurchaseClick,
  compact = false,
}: CreditsDisplayProps) {
  const { balance, isLoading, error } = useCredits();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-white/60">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm">
        Error loading credits
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5">
          <Sparkles className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-medium text-white">{balance}</span>
        </div>
        {showPurchaseButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onPurchaseClick}
            className="text-xs text-white/70 hover:text-white hover:bg-white/10"
          >
            Buy Credits
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-white/60">Credits</p>
            <p className="text-2xl font-bold text-white">{balance}</p>
          </div>
        </div>
        {showPurchaseButton && (
          <Button
            onClick={onPurchaseClick ?? (() => {})}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Buy Credits
          </Button>
        )}
      </div>
    </div>
  );
}
