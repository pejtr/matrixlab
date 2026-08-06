import { useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { Check, ArrowRight, Sparkles, Cpu, Zap, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Model {
  id: string;
  name: string;
  provider: string;
  pricePerImage: string;
  speciality: string;
  speed: string;
  adherence: string;
  features: string[];
  gradient: string;
  borderGlow: string;
}

const MODELS: Model[] = [
  {
    id: "gpt-image-2",
    name: "GPT Image 2",
    provider: "OpenAI",
    pricePerImage: "$0.04",
    speciality: "Unmatched Prompt Accuracy",
    speed: "0.8s",
    adherence: "99.4%",
    features: ["Complex Multi-Subject Rendering", "Flawless Typography & Logos", "Iterative Image Inpainting"],
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    borderGlow: "hover:border-emerald-400/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]",
  },
  {
    id: "flux-2-pro",
    name: "Flux 2 Pro",
    provider: "Black Forest Labs",
    pricePerImage: "$0.055",
    speciality: "Hyper-Photorealistic Master",
    speed: "1.2s",
    adherence: "98.9%",
    features: ["Sub-surface Skin Scattering", "Natural Ray-Traced Reflections", "PBR Material Textures"],
    gradient: "from-cyan-500/20 via-blue-500/10 to-transparent",
    borderGlow: "hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]",
  },
  {
    id: "midjourney-v7",
    name: "Midjourney V7",
    provider: "Midjourney Studio",
    pricePerImage: "$0.03",
    speciality: "Artistic Direction & Aesthetics",
    speed: "1.5s",
    adherence: "97.5%",
    features: ["Vivid Aesthetic Coherence", "Editorial & Cinematic Lighting", "Surreal Conceptual Styles"],
    gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
    borderGlow: "hover:border-violet-400/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]",
  },
  {
    id: "imagen-4",
    name: "Imagen 4",
    provider: "Google AI",
    pricePerImage: "$0.04",
    speciality: "High-Speed Balanced Engine",
    speed: "0.5s",
    adherence: "98.2%",
    features: ["Ultra-Fast Inference Latency", "High Contrast Color Grading", "Vast Knowledge Base"],
    gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
    borderGlow: "hover:border-amber-400/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]",
  },
  {
    id: "ideogram-3",
    name: "Ideogram V3",
    provider: "Ideogram AI",
    pricePerImage: "$0.03",
    speciality: "Precision Graphic & Typography",
    speed: "0.9s",
    adherence: "99.1%",
    features: ["Perfect Embedded Typography", "Brand Identity & Logo Layouts", "Clean Vector Illustration"],
    gradient: "from-rose-500/20 via-pink-500/10 to-transparent",
    borderGlow: "hover:border-rose-400/50 hover:shadow-[0_0_30px_rgba(244,63,94,0.2)]",
  },
  {
    id: "stable-diffusion",
    name: "SD 3.5 Turbo",
    provider: "Stability AI",
    pricePerImage: "Free",
    speciality: "Open-Source & Uncensored",
    speed: "0.4s",
    adherence: "96.8%",
    features: ["Full ControlNet Compatibility", "Custom LoRA Fine-Tuning", "Zero API Restrictions"],
    gradient: "from-indigo-500/20 via-blue-500/10 to-transparent",
    borderGlow: "hover:border-indigo-400/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]",
  },
] as const;

export function ModelShowcase() {
  const [selectedModelId, setSelectedModelId] = useState("flux-2-pro");
  const [, setLocation] = useLocation();

  const activeModel = useMemo(
    () => MODELS.find((m) => m.id === selectedModelId) || MODELS[1],
    [selectedModelId]
  );

  const handleTryModel = useCallback(() => {
    setLocation(`/ai/image-generator?model=${selectedModelId}`);
  }, [selectedModelId, setLocation]);

  return (
    <section className="py-24 relative overflow-hidden bg-black/80">
      <div className="container mx-auto px-4 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 border-b border-white/10 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-cyan-400 mb-3 uppercase tracking-widest">
              <Cpu className="h-3.5 w-3.5" /> State-of-the-Art Engines
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white">
              CHOOSE YOUR <span className="text-cyan-400 italic">GENERATIVE MODEL</span>
            </h2>
          </div>
          <p className="text-white/60 text-sm max-w-md font-light">
            Every model is benchmarked for fidelity, prompt adherence, and lighting physics. Switch seamlessly with a single click.
          </p>
        </div>

        {/* Model Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {MODELS.map((model) => {
            const isSelected = selectedModelId === model.id;
            return (
              <div
                key={model.id}
                onClick={() => setSelectedModelId(model.id)}
                className={`relative p-7 rounded-2xl border transition-all cursor-pointer bg-gradient-to-br ${model.gradient} ${
                  isSelected
                    ? "bg-black/80 border-cyan-400/80 shadow-[0_0_35px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50 scale-[1.02]"
                    : `bg-black/50 border-white/10 ${model.borderGlow}`
                }`}
              >
                {/* Header info */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <span className="font-mono text-[11px] text-white/40 uppercase tracking-wider block mb-1">
                      {model.provider}
                    </span>
                    <h3 className="font-display text-2xl font-bold text-white tracking-tight">
                      {model.name}
                    </h3>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-white/10 text-cyan-300 font-semibold border border-white/10">
                    {model.pricePerImage}
                  </span>
                </div>

                {/* Speciality Badge */}
                <div className="mb-6 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 font-mono text-xs text-cyan-200/90 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{model.speciality}</span>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-2 mb-6 font-mono text-xs text-white/60">
                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] text-white/40 block">LATENCY</span>
                    <span className="text-white font-bold">{model.speed}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] text-white/40 block">ACCURACY</span>
                    <span className="text-emerald-400 font-bold">{model.adherence}</span>
                  </div>
                </div>

                {/* Feature checklist */}
                <ul className="space-y-2 mb-6">
                  {model.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-white/70">
                      <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Selected Model Quick Trigger Bar */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-black to-slate-950/40 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-300 font-mono text-lg font-bold border border-cyan-400/30">
              {activeModel.name[0]}
            </div>
            <div>
              <div className="text-xs font-mono text-cyan-400 uppercase">Active Selection</div>
              <div className="font-display text-xl font-bold text-white">{activeModel.name} ({activeModel.provider})</div>
            </div>
          </div>
          <Button
            onClick={handleTryModel}
            size="lg"
            className="w-full sm:w-auto h-12 px-6 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <span>LAUNCH WITH {activeModel.name.toUpperCase()}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

      </div>
    </section>
  );
}
