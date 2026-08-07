import { useMemo } from "react";
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
  ArrowRight,
  Layers,
} from "lucide-react";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  credits: number | string;
  path: string;
  accentColor: string;
  badge: string;
}

const TOOLS: Tool[] = [
  { id: "text-to-image", name: "Text to 8K Image", description: "Generate photorealistic art from descriptive text prompts", icon: <Wand2 className="h-5 w-5" />, credits: 1, path: "/ai/image-generator", accentColor: "from-cyan-500/20 via-blue-500/10 to-transparent border-cyan-400/40 text-cyan-300", badge: "Core Engine" },
  { id: "face-swap", name: "Single & Multi Face Swap", description: "Seamless AI face replacement in high-res photos and video", icon: <RefreshCcw className="h-5 w-5" />, credits: 5, path: "/faceswap", accentColor: "from-violet-500/20 via-purple-500/10 to-transparent border-violet-400/40 text-violet-300", badge: "Popular" },
  { id: "image-to-image", name: "Image-to-Image Remix", description: "Transform image composition, lighting, and style preserving structure", icon: <ImagePlus className="h-5 w-5" />, credits: 2, path: "/ai/image-generator?mode=img2img", accentColor: "from-emerald-500/20 via-teal-500/10 to-transparent border-emerald-400/40 text-emerald-300", badge: "Pro Tool" },
  { id: "style-transfer", name: "Neural Style Transfer", description: "Apply master painter & 3D render styles to existing photos", icon: <Paintbrush className="h-5 w-5" />, credits: 3, path: "/ai/image-generator?mode=style", accentColor: "from-amber-500/20 via-orange-500/10 to-transparent border-amber-400/40 text-amber-300", badge: "Creative" },
  { id: "ai-upscale", name: "4K/8K Super Resolution", description: "Upscale pixel resolution up to 400% with texture synthesis", icon: <ArrowUpCircle className="h-5 w-5" />, credits: "2-4", path: "/ai/image-generator?mode=upscale", accentColor: "from-cyan-500/20 via-teal-500/10 to-transparent border-cyan-400/40 text-cyan-300", badge: "Ultra HD" },
  { id: "bg-removal", name: "AI Background Eraser", description: "Isolate subjects with sub-pixel hair and glass transparency matte", icon: <Eraser className="h-5 w-5" />, credits: 1, path: "/ai/image-generator?mode=bgremove", accentColor: "from-rose-500/20 via-pink-500/10 to-transparent border-rose-400/40 text-rose-300", badge: "Instant" },
  { id: "inpainting", name: "Generative Inpainting", description: "Selectively edit, add, or remove objects inside any photo", icon: <Sparkles className="h-5 w-5" />, credits: 3, path: "/ai/image-generator?mode=inpaint", accentColor: "from-fuchsia-500/20 via-purple-500/10 to-transparent border-fuchsia-400/40 text-fuchsia-300", badge: "Studio" },
  { id: "video-gen", name: "Animate & Video Gen", description: "Bring static images to life with cinematic motion paths", icon: <Video className="h-5 w-5" />, credits: 10, path: "/ai/video-generator", accentColor: "from-indigo-500/20 via-blue-500/10 to-transparent border-indigo-400/40 text-indigo-300", badge: "Cinema AI" },
  { id: "music-gen", name: "AI Soundtrack & Audio", description: "Compose royalty-free background scores matched to visuals", icon: <Music className="h-5 w-5" />, credits: 8, path: "/ai/music-generator", accentColor: "from-yellow-500/20 via-amber-500/10 to-transparent border-yellow-400/40 text-yellow-300", badge: "Audio Synth" },
] as const;

function ToolCard({ tool }: { tool: Tool }) {
  const [, setLocation] = useLocation();

  return (
    <div
      onClick={() => setLocation(tool.path)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLocation(tool.path); } }}
      tabIndex={0}
      role="button"
      className={`group relative p-7 rounded-2xl border transition-all cursor-pointer bg-gradient-to-br ${tool.accentColor} bg-black/60 backdrop-blur-md hover:scale-[1.02] shadow-[0_0_20px_rgba(0,0,0,0.4)] flex flex-col justify-between`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10 text-white group-hover:scale-110 transition-transform">
            {tool.icon}
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md bg-white/10 text-white/70 border border-white/10 font-bold">
            {tool.badge}
          </span>
        </div>

        <h3 className="font-display text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
          {tool.name}
        </h3>
        <p className="text-sm text-white/60 font-light leading-relaxed mb-6">
          {tool.description}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
        <span className="font-mono text-xs text-white/50 bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/5">
          {tool.credits} {typeof tool.credits === 'number' && tool.credits === 1 ? 'credit' : 'credits'}
        </span>
        <div className="flex items-center gap-1 text-xs font-bold text-white/70 group-hover:text-cyan-400 transition-colors">
          <span>Launch Tool</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}

export function ToolsGrid() {
  const toolCards = useMemo(() => (
    TOOLS.map((tool) => <ToolCard key={tool.id} tool={tool} />)
  ), []);

  return (
    <section className="py-24 relative overflow-hidden bg-black/90">
      <div className="container mx-auto px-4 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 border-b border-white/10 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-cyan-400 mb-3 uppercase tracking-widest">
              <Layers className="h-3.5 w-3.5" /> Full Generative Suite
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white">
              AI CREATIVE <span className="text-cyan-400 italic">TOOLKIT</span>
            </h2>
          </div>
          <p className="text-white/60 text-sm max-w-md font-light">
            Professional AI image, video, and audio synthesis tools designed for artists, designers, and creators.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {toolCards}
        </div>

      </div>
    </section>
  );
}
