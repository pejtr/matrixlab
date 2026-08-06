import { useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { Sparkles, Zap, Shield, Image, Wand2, ArrowRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { useCredits } from "@/contexts/CreditsContext";
import { getLoginUrl } from "@/const";

const AI_MODELS = [
  { id: "gpt-image-2", name: "GPT Image 2", provider: "OpenAI", tag: "Ultra Crisp" },
  { id: "flux-2-pro", name: "Flux 2 Pro", provider: "BFL", tag: "Photorealistic" },
  { id: "midjourney-v7", name: "Midjourney V7", provider: "Midjourney", tag: "Artistic" },
  { id: "imagen-4", name: "Imagen 4", provider: "Google", tag: "High Speed" },
  { id: "ideogram-3", name: "Ideogram V3", provider: "Ideogram", tag: "Typography" },
  { id: "stable-diffusion", name: "SD 3.5 Turbo", provider: "Stability AI", tag: "Creative" },
] as const;

const INSPIRATION_PROMPTS = [
  "A bioluminescent jellyfish floating above a futuristic Tokyo alley at midnight, 8k cinematic",
  "High fashion editorial portrait of a cybernetic warrior in iridescent silk, studio lighting",
  "Surreal floating glass architecture surrounded by golden hour clouds, architectural render",
  "Vintage 1970s film photo of a retro sports car driving on Mars at sunset",
];

export function HeroSection() {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("flux-2-pro");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { balance } = useCredits();

  const handleGenerate = useCallback(() => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    const finalPrompt = prompt.trim() || INSPIRATION_PROMPTS[0];
    setLocation(`/ai/image-generator?prompt=${encodeURIComponent(finalPrompt)}&model=${selectedModel}`);
  }, [isAuthenticated, prompt, selectedModel, setLocation]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  }, [handleGenerate]);

  const modelButtons = useMemo(() => (
    AI_MODELS.map((model) => {
      const isSelected = selectedModel === model.id;
      return (
        <button
          key={model.id}
          onClick={() => setSelectedModel(model.id)}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center gap-2 border ${
            isSelected
              ? "bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-indigo-500/20 border-cyan-400/50 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
              : "bg-white/[0.04] border-white/10 text-white/60 hover:bg-white/[0.08] hover:text-white hover:border-white/20"
          }`}
        >
          <span>{model.name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
            isSelected ? "bg-cyan-400/20 text-cyan-300" : "bg-white/5 text-white/40"
          }`}>
            {model.tag}
          </span>
        </button>
      );
    })
  ), [selectedModel]);

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-12 pb-20">
      {/* Anti-Slop Ambient Lighting Gradients */}
      <div className="absolute top-[-150px] left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[100px] right-1/4 w-[700px] h-[700px] bg-violet-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Subtle Noise Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center">
          
          {/* Anti-Slop Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/15 backdrop-blur-md mb-8 shadow-2xl">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-mono text-xs font-medium tracking-wider text-cyan-300 uppercase">
              Taste-Skill Anti-Slop Engine v2.5
            </span>
            <span className="text-white/30">•</span>
            <span className="text-xs text-white/70">10+ Next-Gen Models</span>
          </div>

          {/* Expressive Editorial Headline */}
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8 leading-[1.05]">
            <span className="block text-white drop-shadow-sm">
              ENGINE FOR BOLD
            </span>
            <span className="bg-gradient-to-r from-cyan-400 via-emerald-300 to-indigo-400 bg-clip-text text-transparent italic">
              VISUAL ARTISTRY
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/75 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
            Generate ultra-high definition artwork, hyper-realistic photos, and original illustrations with total prompt precision and zero generic output.
          </p>

          {/* Studio Prompt Card */}
          <div className="max-w-4xl mx-auto mb-10 p-2 sm:p-3 rounded-2xl bg-black/60 border border-white/15 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative flex items-center">
                <Wand2 className="absolute left-4 h-5 w-5 text-cyan-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Describe your vision (e.g. A neon cybernetic samurai in Kyoto snow)..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-16 pl-12 pr-4 bg-white/[0.03] border-white/10 text-white placeholder:text-white/40 rounded-xl text-base md:text-lg focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/50"
                />
              </div>
              <Button
                onClick={handleGenerate}
                size="lg"
                className="h-16 px-8 bg-gradient-to-r from-cyan-500 via-emerald-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-extrabold text-base rounded-xl transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] flex items-center justify-center gap-2 group"
              >
                <span>GENERATE NOW</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Quick Inspiration Chips */}
            <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2 px-2 text-left">
              <span className="font-mono text-xs text-white/40 flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-amber-400" /> Try prompt:
              </span>
              {INSPIRATION_PROMPTS.map((insp, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(insp)}
                  className="text-xs text-white/60 hover:text-cyan-300 bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1 rounded-lg border border-white/5 transition-all truncate max-w-[260px]"
                >
                  "{insp.substring(0, 35)}..."
                </button>
              ))}
            </div>
          </div>

          {/* Model Selector Ribbon */}
          <div className="flex flex-wrap justify-center gap-2.5 mb-10">
            {modelButtons}
          </div>

          {/* Authenticated Balance Indicator */}
          {isAuthenticated && (
            <div className="inline-flex items-center gap-3 bg-white/[0.06] border border-cyan-500/30 rounded-xl px-5 py-2.5 mb-10 shadow-lg">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-white/80">
                Remaining Credits: <span className="font-mono font-bold text-cyan-300 text-base ml-1">{balance}</span>
              </span>
            </div>
          )}

          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center gap-8 text-xs font-mono text-white/50 tracking-wider uppercase border-t border-white/10 pt-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Sub-Second Latency</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>Commercial Rights</span>
            </div>
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-cyan-400" />
              <span>8K Native Export</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
