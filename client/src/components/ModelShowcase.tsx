import { useState } from "react";
import { useLocation } from "wouter";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Model {
  id: string;
  name: string;
  provider: string;
  pricePerImage: string;
  speciality: string;
  features: string[];
  color: string;
}

const MODELS: Model[] = [
  {
    id: "gpt-image-2",
    name: "GPT Image 2",
    provider: "OpenAI",
    pricePerImage: "$0.04",
    speciality: "Best overall quality",
    features: ["Text rendering", "Multi-turn editing", "Instruction following"],
    color: "from-green-400 to-emerald-500",
  },
  {
    id: "flux-2-pro",
    name: "Flux 2 Pro",
    provider: "Black Forest Labs",
    pricePerImage: "$0.055",
    speciality: "Photorealism king",
    features: ["Skin textures", "Natural lighting", "Material rendering"],
    color: "from-blue-400 to-cyan-500",
  },
  {
    id: "midjourney-v7",
    name: "Midjourney V7",
    provider: "Midjourney",
    pricePerImage: "$0.03",
    speciality: "Artistic styles",
    features: ["Aesthetic coherence", "Style consistency", "Creative prompts"],
    color: "from-purple-400 to-pink-500",
  },
  {
    id: "imagen-4",
    name: "Imagen 4",
    provider: "Google",
    pricePerImage: "$0.04",
    speciality: "Balanced all-round",
    features: ["Fast generation", "Good prompt adherence", "Multiple styles"],
    color: "from-yellow-400 to-orange-500",
  },
  {
    id: "ideogram-3",
    name: "Ideogram V3",
    provider: "Ideogram",
    pricePerImage: "$0.03",
    speciality: "Text in images",
    features: ["Logo design", "Poster text", "UI mockups"],
    color: "from-pink-400 to-rose-500",
  },
  {
    id: "stable-diffusion",
    name: "Stable Diffusion 3.5",
    provider: "Stability AI",
    pricePerImage: "Free",
    speciality: "Open source",
    features: ["Self-hosted", "Fine-tunable", "No restrictions"],
    color: "from-indigo-400 to-violet-500",
  },
];

export function ModelShowcase() {
  const [selectedModel, setSelectedModel] = useState<string>("gpt-image-2");
  const [, setLocation] = useLocation();

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    setLocation(`/ai/image-generator?model=${modelId}`);
  };

  return (
    <section className="py-16 md:py-24 bg-[#090a0a]">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Choose Your AI Model
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Access the most powerful AI image generation models in one place.
            Each model excels at different styles and use cases.
          </p>
        </div>

        {/* Models grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {MODELS.map((model) => (
            <div
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedModel(model.id); } }}
              tabIndex={0}
              role="button"
              aria-pressed={selectedModel === model.id}
              className={`relative p-6 rounded-2xl border transition-all cursor-pointer group ${
                selectedModel === model.id
                  ? "bg-white/10 border-white/30"
                  : "bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20"
              }`}
            >
              {/* Model header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{model.name}</h3>
                  <p className="text-sm text-white/50">{model.provider}</p>
                </div>
                <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${model.color} text-white text-sm font-semibold`}>
                  {model.pricePerImage}
                </div>
              </div>

              {/* Speciality */}
              <p className="text-white/70 mb-4">{model.speciality}</p>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                {model.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-white/60">
                    <Check className="h-4 w-4 text-green-400" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Select button */}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectModel(model.id);
                }}
                variant={selectedModel === model.id ? "default" : "outline"}
                className={`w-full ${
                  selectedModel === model.id
                    ? "bg-white text-gray-900 hover:bg-white/90"
                    : "border-white/20 text-white hover:bg-white/10"
                }`}
              >
                {selectedModel === model.id ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Selected
                  </>
                ) : (
                  <>
                    Select Model
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>

              {/* Selection indicator */}
              {selectedModel === model.id && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                    <Check className="h-4 w-4 text-gray-900" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
