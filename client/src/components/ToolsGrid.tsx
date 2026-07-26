import { useLocation } from "wouter";
import {
  Wand2,
  ImagePlus,
  Paintbrush,
  ArrowUpCircle,
  Eraser,
  RefreshCcw,
  Sparkles,
  Video,
  Music,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  credits: number | string;
  path: string;
  color: string;
}

const TOOLS: Tool[] = [
  {
    id: "text-to-image",
    name: "Text to Image",
    description: "Generate images from text descriptions",
    icon: <Wand2 className="h-6 w-6" />,
    credits: 1,
    path: "/ai/image-generator",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "image-to-image",
    name: "Image to Image",
    description: "Transform existing images with AI",
    icon: <ImagePlus className="h-6 w-6" />,
    credits: 2,
    path: "/ai/image-generator?mode=img2img",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "style-transfer",
    name: "Style Transfer",
    description: "Apply artistic styles to your photos",
    icon: <Paintbrush className="h-6 w-6" />,
    credits: 3,
    path: "/ai/image-generator?mode=style",
    color: "from-orange-500 to-yellow-500",
  },
  {
    id: "ai-upscale",
    name: "AI Upscale",
    description: "Increase image resolution up to 4x",
    icon: <ArrowUpCircle className="h-6 w-6" />,
    credits: "2-4",
    path: "/ai/image-generator?mode=upscale",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "bg-removal",
    name: "Background Removal",
    description: "Remove or replace image backgrounds",
    icon: <Eraser className="h-6 w-6" />,
    credits: 1,
    path: "/ai/image-generator?mode=bgremove",
    color: "from-red-500 to-rose-500",
  },
  {
    id: "face-swap",
    name: "Face Swap",
    description: "Swap faces in photos and videos",
    icon: <RefreshCcw className="h-6 w-6" />,
    credits: 5,
    path: "/faceswap",
    color: "from-indigo-500 to-violet-500",
  },
  {
    id: "inpainting",
    name: "Inpainting",
    description: "Edit specific parts of an image",
    icon: <Sparkles className="h-6 w-6" />,
    credits: 3,
    path: "/ai/image-generator?mode=inpaint",
    color: "from-pink-500 to-fuchsia-500",
  },
  {
    id: "video-gen",
    name: "Video Generation",
    description: "Create videos from text or images",
    icon: <Video className="h-6 w-6" />,
    credits: 10,
    path: "/ai/video-generator",
    color: "from-teal-500 to-cyan-500",
  },
  {
    id: "music-gen",
    name: "Music Generation",
    description: "Generate music with AI",
    icon: <Music className="h-6 w-6" />,
    credits: 8,
    path: "/ai/music-generator",
    color: "from-amber-500 to-orange-500",
  },
];

export function ToolsGrid() {
  const [, setLocation] = useLocation();

  return (
    <section className="py-16 md:py-24 bg-[#090a0a]">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            AI-Powered Tools
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Everything you need to create, edit, and enhance your visual content.
            All tools are powered by the latest AI models.
          </p>
        </div>

        {/* Tools grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {TOOLS.map((tool) => (
            <div
              key={tool.id}
              onClick={() => setLocation(tool.path)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLocation(tool.path); } }}
              tabIndex={0}
              role="button"
              className="group relative p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.08] hover:border-white/20 transition-all cursor-pointer"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white flex-shrink-0`}>
                  {tool.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-white/60 mb-3">
                    {tool.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white/40 bg-white/10 px-2 py-1 rounded">
                      {tool.credits} {typeof tool.credits === 'number' && tool.credits === 1 ? 'credit' : 'credits'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hover arrow */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button
            onClick={() => setLocation("/ai")}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Explore All Tools
          </Button>
        </div>
      </div>
    </section>
  );
}
