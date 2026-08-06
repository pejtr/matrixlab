import { useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { Sparkles, Wand2, Palette, Camera, Megaphone, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Template {
  id: string;
  name: string;
  prompt: string;
  style: string;
  thumbnail: string;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  templates: Template[];
}

const CATEGORIES: Category[] = [
  {
    id: "trendy",
    name: "Trendy",
    icon: <Sparkles className="h-4 w-4" />,
    templates: [
      { id: "t1", name: "Studio Ghibli Style", prompt: "Create a beautiful landscape in Studio Ghibli anime style with soft colors and magical atmosphere", style: "Anime", thumbnail: "\u{1F3A8}" },
      { id: "t2", name: "Cyberpunk City", prompt: "Futuristic cyberpunk city at night with neon lights, rain reflections, and flying cars", style: "Sci-Fi", thumbnail: "\u{1F306}" },
      { id: "t3", name: "Watercolor Portrait", prompt: "Elegant portrait in watercolor style with soft brushstrokes and pastel colors", style: "Artistic", thumbnail: "\u{1F3AD}" },
      { id: "t4", name: "Pixel Art Game", prompt: "Retro pixel art game scene with vibrant colors and nostalgic 8-bit aesthetic", style: "Retro", thumbnail: "\u{1F47E}" },
      { id: "t5", name: "Minimalist Logo", prompt: "Clean minimalist logo design with geometric shapes and modern typography", style: "Design", thumbnail: "\u2728" },
    ],
  },
  {
    id: "realistic",
    name: "Realistic",
    icon: <Camera className="h-4 w-4" />,
    templates: [
      { id: "r1", name: "Professional Headshot", prompt: "Professional business headshot with studio lighting and neutral background", style: "Photo", thumbnail: "\u{1F4F8}" },
      { id: "r2", name: "Product Photography", prompt: "High-end product photography with dramatic lighting and clean background", style: "Commercial", thumbnail: "\u{1F4E6}" },
      { id: "r3", name: "Landscape Photo", prompt: "Stunning landscape photograph with golden hour lighting and vivid colors", style: "Nature", thumbnail: "\u{1F304}" },
      { id: "r4", name: "Street Photography", prompt: "Candid street photography capturing urban life with natural lighting", style: "Documentary", thumbnail: "\u{1F3D9}\uFE0F" },
      { id: "r5", name: "Food Photography", prompt: "Appetizing food photography with beautiful plating and warm lighting", style: "Culinary", thumbnail: "\u{1F37D}\uFE0F" },
    ],
  },
  {
    id: "styles",
    name: "Styles",
    icon: <Palette className="h-4 w-4" />,
    templates: [
      { id: "s1", name: "Oil Painting", prompt: "Classical oil painting style with rich textures and dramatic lighting", style: "Classical", thumbnail: "\u{1F5BC}\uFE0F" },
      { id: "s2", name: "Japanese Ukiyo-e", prompt: "Traditional Japanese ukiyo-e woodblock print style with flat colors", style: "Traditional", thumbnail: "\u{1F338}" },
      { id: "s3", name: "Comic Book", prompt: "Bold comic book style with strong outlines and vibrant colors", style: "Pop Art", thumbnail: "\u{1F4A5}" },
      { id: "s4", name: "Pencil Sketch", prompt: "Detailed pencil sketch with intricate shading and fine linework", style: "Drawing", thumbnail: "\u270F\uFE0F" },
      { id: "s5", name: "3D Render", prompt: "High-quality 3D render with realistic materials and global illumination", style: "3D", thumbnail: "\u{1F52E}" },
    ],
  },
  {
    id: "marketing",
    name: "Marketing",
    icon: <Megaphone className="h-4 w-4" />,
    templates: [
      { id: "m1", name: "Social Media Post", prompt: "Eye-catching social media post with bold text and vibrant background", style: "Digital", thumbnail: "\u{1F4F1}" },
      { id: "m2", name: "YouTube Thumbnail", prompt: "Engaging YouTube thumbnail with expressive face and bold typography", style: "Clickbait", thumbnail: "\u{1F3AC}" },
      { id: "m3", name: "Banner Ad", prompt: "Professional banner ad with clear hierarchy and compelling visuals", style: "Advertising", thumbnail: "\u{1F4E2}" },
      { id: "m4", name: "Email Header", prompt: "Clean email header design with brand colors and minimal elements", style: "Corporate", thumbnail: "\u{1F4E7}" },
      { id: "m5", name: "Presentation Slide", prompt: "Modern presentation slide with data visualization and clean layout", style: "Business", thumbnail: "\u{1F4CA}" },
    ],
  },
  {
    id: "fashion",
    name: "Fashion",
    icon: <Shirt className="h-4 w-4" />,
    templates: [
      { id: "f1", name: "Fashion Editorial", prompt: "High-fashion editorial portrait with dramatic lighting and avant-garde styling", style: "Editorial", thumbnail: "\u{1F457}" },
      { id: "f2", name: "Streetwear", prompt: "Urban streetwear photography with gritty aesthetic and bold poses", style: "Urban", thumbnail: "\u{1F9E2}" },
      { id: "f3", name: "Vintage Fashion", prompt: "Retro vintage fashion photography with film grain and warm tones", style: "Vintage", thumbnail: "\u{1F576}\uFE0F" },
      { id: "f4", name: "Luxury Brand", prompt: "Luxury brand campaign with elegant models and premium aesthetic", style: "Luxury", thumbnail: "\u{1F48E}" },
      { id: "f5", name: "Sustainable Fashion", prompt: "Eco-friendly fashion photography with natural elements and earth tones", style: "Eco", thumbnail: "\u{1F33F}" },
    ],
  },
] as const;

function TemplateCard({ template, onUse }: { template: Template; onUse: (t: Template) => void }) {
  return (
    <div
      className="group relative bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/30 transition-all cursor-pointer"
      onClick={() => onUse(template)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onUse(template); } }}
      tabIndex={0}
      role="button"
      aria-label={`Use template: ${template.name}`}
    >
      <div className="aspect-square flex items-center justify-center text-6xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
        {template.thumbnail}
      </div>

      <div className="p-3">
        <h4 className="text-sm font-semibold text-white mb-1 truncate">{template.name}</h4>
        <p className="text-xs text-white/50 truncate">{template.style}</p>
      </div>

      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Button
          size="sm"
          className="bg-white text-gray-900 hover:bg-white/90"
          onClick={(e) => { e.stopPropagation(); onUse(template); }}
        >
          <Wand2 className="h-4 w-4 mr-2" />
          Try it
        </Button>
      </div>
    </div>
  );
}

export function TemplateExplorer() {
  const [activeCategory, setActiveCategory] = useState("trendy");
  const [, setLocation] = useLocation();

  const activeTemplates = useMemo(
    () => CATEGORIES.find(c => c.id === activeCategory)?.templates || [],
    [activeCategory]
  );

  const handleUseTemplate = useCallback((template: Template) => {
    setLocation(`/ai/image-generator?prompt=${encodeURIComponent(template.prompt)}`);
  }, [setLocation]);

  const categoryTabs = useMemo(() => (
    CATEGORIES.map((category) => (
      <button
        key={category.id}
        onClick={() => setActiveCategory(category.id)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          activeCategory === category.id
            ? "bg-white text-gray-900"
            : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
        }`}
      >
        {category.icon}
        {category.name}
      </button>
    ))
  ), [activeCategory]);

  const templateCards = useMemo(() => (
    activeTemplates.map((template) => (
      <TemplateCard key={template.id} template={template} onUse={handleUseTemplate} />
    ))
  ), [activeTemplates, handleUseTemplate]);

  return (
    <section className="py-16 md:py-24 bg-[#090a0a]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-white/80">Get Inspired</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Explore Templates
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Start with a template and customize it to your needs. Each template includes
            a pre-written prompt to get you started.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categoryTabs}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
          {templateCards}
        </div>

        <div className="text-center mt-8">
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => setLocation("/ai/image-generator")}
          >
            View All Templates
          </Button>
        </div>
      </div>
    </section>
  );
}
