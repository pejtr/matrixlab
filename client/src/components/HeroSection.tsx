import { useState } from "react";
import { useLocation } from "wouter";
import { Sparkles, Zap, Shield, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { useCredits } from "@/contexts/CreditsContext";
import { getLoginUrl } from "@/const";

const AI_MODELS = [
  { id: "gpt-image-2", name: "GPT Image 2", provider: "OpenAI" },
  { id: "flux-2-pro", name: "Flux 2 Pro", provider: "Black Forest Labs" },
  { id: "midjourney-v7", name: "Midjourney V7", provider: "Midjourney" },
  { id: "imagen-4", name: "Imagen 4", provider: "Google" },
  { id: "ideogram-3", name: "Ideogram V3", provider: "Ideogram" },
  { id: "stable-diffusion", name: "Stable Diffusion 3.5", provider: "Stability AI" },
];

export function HeroSection() {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-image-2");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { balance } = useCredits();

  const handleGenerate = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (prompt.trim()) {
      setLocation(`/ai/image-generator?prompt=${encodeURIComponent(prompt)}&model=${selectedModel}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900" />
      
      {/* Glow effect */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse,rgba(168,85,247,0.15)_0%,transparent_70%)] pointer-events-none" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px] opacity-30 pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-white/80">AI Image Generator</span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Create Stunning
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              AI Images
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl mx-auto">
            Generate high-quality images from text prompts using the latest AI models.
            Free to start, no signup required.
          </p>

          {/* Prompt input */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Describe the image you want to create..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-14 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 rounded-xl text-lg"
                />
              </div>
              <Button
                onClick={handleGenerate}
                size="lg"
                className="h-14 px-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-lg font-semibold"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Generate
              </Button>
            </div>
          </div>

          {/* Model selector */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {AI_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedModel === model.id
                    ? "bg-white text-gray-900"
                    : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                }`}
              >
                {model.name}
              </button>
            ))}
          </div>

          {/* Credits display for logged in users */}
          {isAuthenticated && (
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 mb-8">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-white/80">
                Credits left: <span className="font-bold text-white">{balance}</span>
              </span>
            </div>
          )}

          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span>Fast Generation</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-400" />
              <span>No Watermark</span>
            </div>
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-blue-400" />
              <span>10+ AI Models</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
