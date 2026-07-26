import { useLocation } from "wouter";
import { Heart, Download, ExternalLink } from "lucide-react";

interface GalleryImage {
  id: string;
  prompt: string;
  style: string;
  aspectRatio: string;
  gradient: string;
}

const GALLERY_IMAGES: GalleryImage[] = [
  { id: "1", prompt: "Futuristic city skyline at sunset", style: "Photorealistic", aspectRatio: "16:9", gradient: "from-blue-500 to-purple-600" },
  { id: "2", prompt: "Mystical forest with glowing mushrooms", style: "Fantasy", aspectRatio: "1:1", gradient: "from-green-500 to-teal-600" },
  { id: "3", prompt: "Abstract geometric art in pastel colors", style: "Abstract", aspectRatio: "3:4", gradient: "from-pink-500 to-rose-600" },
  { id: "4", prompt: "Japanese cherry blossom garden", style: "Anime", aspectRatio: "16:9", gradient: "from-pink-400 to-red-500" },
  { id: "5", prompt: "Steampunk mechanical dragon", style: "Digital Art", aspectRatio: "1:1", gradient: "from-amber-500 to-orange-600" },
  { id: "6", prompt: "Underwater coral reef with tropical fish", style: "Photorealistic", aspectRatio: "3:4", gradient: "from-cyan-500 to-blue-600" },
  { id: "7", prompt: "Cyberpunk street market at night", style: "Sci-Fi", aspectRatio: "16:9", gradient: "from-purple-500 to-pink-600" },
  { id: "8", prompt: "Medieval castle on floating island", style: "Fantasy", aspectRatio: "1:1", gradient: "from-indigo-500 to-violet-600" },
  { id: "9", prompt: "Minimalist mountain landscape", style: "Vector", aspectRatio: "3:4", gradient: "from-gray-500 to-slate-600" },
  { id: "10", prompt: "Vintage space exploration poster", style: "Retro", aspectRatio: "16:9", gradient: "from-red-500 to-orange-600" },
  { id: "11", prompt: "Neon lion portrait in rain", style: "Neon", aspectRatio: "1:1", gradient: "from-purple-600 to-blue-600" },
  { id: "12", prompt: "Watercolor coastal village", style: "Watercolor", aspectRatio: "3:4", gradient: "from-sky-500 to-blue-600" },
];

function GalleryCard({ image, className }: { image: GalleryImage; className?: string }) {
  const [, setLocation] = useLocation();

  return (
    <div
      className={`relative flex-shrink-0 w-72 aspect-video rounded-xl overflow-hidden group cursor-pointer ${className}`}
      onClick={() => setLocation("/ai/image-generator")}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLocation("/ai/image-generator"); } }}
      tabIndex={0}
      role="button"
      aria-label={`Template: ${image.prompt}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${image.gradient}`} />
      <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-xs text-white">
        {image.style}
      </div>
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute inset-0 flex items-center justify-center gap-3">
          <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors" aria-label="Like">
            <Heart className="h-5 w-5 text-white" />
          </button>
          <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors" aria-label="Download">
            <Download className="h-5 w-5 text-white" />
          </button>
          <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors" aria-label="Open full size">
            <ExternalLink className="h-5 w-5 text-white" />
          </button>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-xs text-white/80 line-clamp-2">{image.prompt}</p>
        </div>
      </div>
    </div>
  );
}

const SCROLL_KEYFRAMES = `
@keyframes scroll-left {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes scroll-right {
  0% { transform: translateX(-50%); }
  100% { transform: translateX(0); }
}
.animate-scroll-left {
  animation: scroll-left 30s linear infinite;
}
.animate-scroll-right {
  animation: scroll-right 30s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .animate-scroll-left, .animate-scroll-right {
    animation-play-state: paused;
  }
}
`;

export function ScrollingGallery() {
  return (
    <section className="py-16 md:py-24 bg-[#090a0a] overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: SCROLL_KEYFRAMES }} />

      <div className="container mx-auto px-4 mb-12">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Community Gallery
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            See what others are creating with our AI tools. Get inspired and start
            generating your own masterpieces.
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#090a0a] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#090a0a] to-transparent z-10 pointer-events-none" />

        <div className="flex gap-4 mb-4 animate-scroll-left">
          {[...GALLERY_IMAGES.slice(0, 6), ...GALLERY_IMAGES.slice(0, 6)].map((image, idx) => (
            <GalleryCard key={`row1-${idx}`} image={image} />
          ))}
        </div>

        <div className="flex gap-4 animate-scroll-right">
          {[...GALLERY_IMAGES.slice(6), ...GALLERY_IMAGES.slice(6)].map((image, idx) => (
            <GalleryCard key={`row2-${idx}`} image={image} />
          ))}
        </div>
      </div>
    </section>
  );
}
