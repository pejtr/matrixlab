import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image as ImageIcon, Upload, Trash2, Loader2, Star, Sparkles, Briefcase, Laugh, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

export interface Template {
  id: string;
  name: string;
  category: "glamour" | "professional" | "casual" | "meme" | "custom";
  type: "image" | "video";
  thumbnailUrl: string;
  mediaUrl: string;
  description?: string;
  isCustom?: boolean;
  customId?: number;
}

// Optimized templates with 4 categories, double the count per category
const sampleTemplates: Template[] = [
  // GLAMOUR (10 templates - double the original count)
  {
    id: "glamour-1",
    name: "Black Elegance",
    category: "glamour",
    type: "image",
    thumbnailUrl: "/templates/740full-anna-mingazova.jpg",
    mediaUrl: "/templates/740full-anna-mingazova.jpg",
    description: "Designer dress, dramatic lighting"
  },
  {
    id: "glamour-2",
    name: "Knee High Boots",
    category: "glamour",
    type: "image",
    thumbnailUrl: "/templates/616f07038ca3961e29c9dea7d234ad5c.jpg",
    mediaUrl: "/templates/616f07038ca3961e29c9dea7d234ad5c.jpg",
    description: "Fashion boots, elegant pose"
  },
  {
    id: "glamour-3",
    name: "Checkered Chic",
    category: "glamour",
    type: "image",
    thumbnailUrl: "/templates/740full-lenka-dragounová.jpg",
    mediaUrl: "/templates/740full-lenka-dragounová.jpg",
    description: "Checkered top, glasses style"
  },
  {
    id: "glamour-4",
    name: "Business Glam",
    category: "glamour",
    type: "image",
    thumbnailUrl: "/templates/1763506830108.jpg",
    mediaUrl: "/templates/1763506830108.jpg",
    description: "Professional elegance"
  },
  {
    id: "glamour-5",
    name: "Blonde Beauty",
    category: "glamour",
    type: "image",
    thumbnailUrl: "/templates/1762462328746.jpg",
    mediaUrl: "/templates/1762462328746.jpg",
    description: "Natural beauty, soft lighting"
  },
  {
    id: "glamour-6",
    name: "White Elegance",
    category: "glamour",
    type: "image",
    thumbnailUrl: "/templates/1686142159320.jpg",
    mediaUrl: "/templates/1686142159320.jpg",
    description: "White blouse, professional"
  },
  {
    id: "glamour-7",
    name: "Street Style",
    category: "glamour",
    type: "image",
    thumbnailUrl: "/templates/a8npbayorrx71.webp",
    mediaUrl: "/templates/a8npbayorrx71.webp",
    description: "Urban fashion, leather jacket"
  },
  {
    id: "glamour-8",
    name: "Studio Portrait",
    category: "glamour",
    type: "image",
    thumbnailUrl: "/templates/IMG_9128.webp",
    mediaUrl: "/templates/IMG_9128.webp",
    description: "Professional studio shot"
  },
  {
    id: "glamour-9",
    name: "Evening Dress",
    category: "glamour",
    type: "image",
    thumbnailUrl: "/templates/OIP(1).webp",
    mediaUrl: "/templates/OIP(1).webp",
    description: "White dress, outdoor"
  },
  {
    id: "glamour-10",
    name: "High Fashion Boots",
    category: "glamour",
    type: "image",
    thumbnailUrl: "/templates/gabriela-in-the-jasmin-knee-boots.webp",
    mediaUrl: "/templates/gabriela-in-the-jasmin-knee-boots.webp",
    description: "Designer boots, luxury setting"
  },

  // PROFESSIONAL (10 templates)
  {
    id: "professional-1",
    name: "Navy Executive",
    category: "professional",
    type: "image",
    thumbnailUrl: "/templates/1000103922.jpg",
    mediaUrl: "/templates/1000103922.jpg",
    description: "Tailored suit, boardroom"
  },
  {
    id: "professional-2",
    name: "Corporate Leader",
    category: "professional",
    type: "image",
    thumbnailUrl: "/templates/1000103926.jpg",
    mediaUrl: "/templates/1000103926.jpg",
    description: "Professional attire, office"
  },
  {
    id: "professional-3",
    name: "Power Suit",
    category: "professional",
    type: "image",
    thumbnailUrl: "/templates/1000103932.jpg",
    mediaUrl: "/templates/1000103932.jpg",
    description: "Confident stance, modern office"
  },
  {
    id: "professional-4",
    name: "Executive Style",
    category: "professional",
    type: "image",
    thumbnailUrl: "/templates/1000103946.jpg",
    mediaUrl: "/templates/1000103946.jpg",
    description: "Elegant business attire"
  },
  {
    id: "professional-5",
    name: "Professional Portrait",
    category: "professional",
    type: "image",
    thumbnailUrl: "/templates/1000103962.jpg",
    mediaUrl: "/templates/1000103962.jpg",
    description: "Corporate headshot"
  },
  {
    id: "professional-6",
    name: "Business Meeting",
    category: "professional",
    type: "image",
    thumbnailUrl: "/templates/1000104064.jpg",
    mediaUrl: "/templates/1000104064.jpg",
    description: "Professional environment"
  },
  {
    id: "professional-7",
    name: "Office Professional",
    category: "professional",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=800&fit=crop",
    description: "Corporate setting"
  },
  {
    id: "professional-8",
    name: "Business Casual",
    category: "professional",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=800&fit=crop",
    description: "Professional environment"
  },
  {
    id: "professional-9",
    name: "Executive Woman",
    category: "professional",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1551843073-4a9a5b6fcd5f?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1551843073-4a9a5b6fcd5f?w=800&h=800&fit=crop",
    description: "Confident professional"
  },
  {
    id: "professional-10",
    name: "Modern Office",
    category: "professional",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&h=800&fit=crop",
    description: "Contemporary workspace"
  },

  // CASUAL (10 templates)
  {
    id: "casual-1",
    name: "Urban Street",
    category: "casual",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=800&fit=crop",
    description: "Denim jacket, cafe background"
  },
  {
    id: "casual-2",
    name: "Coffee Shop",
    category: "casual",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&h=800&fit=crop",
    description: "Leather jacket, cozy interior"
  },
  {
    id: "casual-3",
    name: "Home Comfort",
    category: "casual",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=800&fit=crop",
    description: "Sweater, modern apartment"
  },
  {
    id: "casual-4",
    name: "Park Stroll",
    category: "casual",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=800&fit=crop",
    description: "Casual chic, urban park"
  },
  {
    id: "casual-5",
    name: "Rooftop Sunset",
    category: "casual",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=800&fit=crop",
    description: "Blazer, city terrace"
  },
  {
    id: "casual-6",
    name: "Weekend Vibes",
    category: "casual",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&h=800&fit=crop",
    description: "Everyday look"
  },
  {
    id: "casual-7",
    name: "Outdoor Adventure",
    category: "casual",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop",
    description: "Nature lover"
  },
  {
    id: "casual-8",
    name: "Casual Portrait",
    category: "casual",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&h=800&fit=crop",
    description: "Relaxed and natural"
  },
  {
    id: "casual-9",
    name: "Street Fashion",
    category: "casual",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=800&fit=crop",
    description: "Urban style"
  },
  {
    id: "casual-10",
    name: "Relaxed Style",
    category: "casual",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=800&h=800&fit=crop",
    description: "Casual comfort"
  },

  // MEME (10 templates)
  {
    id: "meme-1",
    name: "Surprised Girl",
    category: "meme",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&h=800&fit=crop",
    description: "Shocked expression"
  },
  {
    id: "meme-2",
    name: "Laughing Beauty",
    category: "meme",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&h=800&fit=crop",
    description: "Pure joy"
  },
  {
    id: "meme-3",
    name: "Sassy Woman",
    category: "meme",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1551843073-4a9a5b6fcd5f?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1551843073-4a9a5b6fcd5f?w=800&h=800&fit=crop",
    description: "Attitude and confidence"
  },
  {
    id: "meme-4",
    name: "Funny Guy",
    category: "meme",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=800&h=800&fit=crop",
    description: "Comedy gold"
  },
  {
    id: "meme-5",
    name: "Confused Man",
    category: "meme",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=800&h=800&fit=crop",
    description: "What just happened?"
  },
  {
    id: "meme-6",
    name: "Excited Woman",
    category: "meme",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&h=800&fit=crop",
    description: "Excitement overload"
  },
  {
    id: "meme-7",
    name: "Thinking Guy",
    category: "meme",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop",
    description: "Deep thoughts"
  },
  {
    id: "meme-8",
    name: "Happy Girl",
    category: "meme",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=800&fit=crop",
    description: "Pure happiness"
  },
  {
    id: "meme-9",
    name: "Serious Look",
    category: "meme",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=800&fit=crop",
    description: "No nonsense"
  },
  {
    id: "meme-10",
    name: "Playful Smile",
    category: "meme",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=800&fit=crop",
    description: "Mischievous grin"
  },
];

interface TemplateGalleryProps {
  onSelectTemplate: (template: Template) => void;
  selectedTemplates?: Template[];
}

const FAVORITES_KEY = 'faceswap_favorite_templates';

export default function TemplateGallery({ onSelectTemplate, selectedTemplates = [] }: TemplateGalleryProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: customTemplates = [], refetch: refetchCustom } = trpc.customTemplates.getMyTemplates.useQuery();
  const uploadTemplateMutation = trpc.customTemplates.uploadTemplate.useMutation();
  const deleteTemplateMutation = trpc.customTemplates.deleteTemplate.useMutation();

  // Load favorites from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse favorites:', e);
      }
    }
  }, []);

  // Save favorites to localStorage whenever they change
  const toggleFavorite = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const file = files[0];

    try {
      // Upload to server
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await response.json();

      // Create custom template
      const templateName = file.name.replace(/\.[^/.]+$/, "");
      await uploadTemplateMutation.mutateAsync({
        name: templateName,
        mediaKey: url.split('/').pop() || '',
        mediaUrl: url,
        thumbnailUrl: url,
        mediaType: file.type.startsWith('video/') ? 'video' : 'image',
      });

      await refetchCustom();
      toast.success('Template uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload template');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteCustom = async (templateId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await deleteTemplateMutation.mutateAsync({ templateId });
      await refetchCustom();
      toast.success('Template deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete template');
    }
  };

  const allTemplates: Template[] = [
    ...sampleTemplates,
    ...customTemplates.map(ct => ({
      id: `custom-${ct.id}`,
      name: ct.name,
      category: 'custom' as const,
      type: ct.mediaType as 'image' | 'video',
      thumbnailUrl: ct.thumbnailUrl,
      mediaUrl: ct.mediaUrl,
      isCustom: true,
      customId: ct.id,
    }))
  ];

  const categories = [
    { value: "all", label: "All", icon: Zap },
    { value: "glamour", label: "Glamour", icon: Sparkles },
    { value: "professional", label: "Professional", icon: Briefcase },
    { value: "casual", label: "Casual", icon: ImageIcon },
    { value: "meme", label: "Meme", icon: Laugh },
    { value: "custom", label: "Custom", icon: Upload },
  ];

  const renderTemplateGrid = (templates: Template[]) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
      {templates.map((template) => {
        const isSelected = selectedTemplates.some(t => t.id === template.id);
        const isFavorite = favorites.includes(template.id);
        const isHovered = hoveredTemplate === template.id;

        return (
          <div
            key={template.id}
            className="relative group cursor-pointer"
            onClick={() => onSelectTemplate(template)}
            onMouseEnter={() => setHoveredTemplate(template.id)}
            onMouseLeave={() => setHoveredTemplate(null)}
          >
            {/* Main thumbnail - no padding, full width */}
            <div className={`
              relative aspect-square overflow-hidden rounded-lg
              ${isSelected ? 'ring-2 ring-pink-500' : 'ring-1 ring-white/20'}
              transition-all duration-200
            `}>
              <img
                src={template.thumbnailUrl}
                alt={template.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              
              {/* Overlay on hover */}
              <div className={`
                absolute inset-0 bg-black/60 backdrop-blur-sm
                transition-opacity duration-200
                ${isHovered ? 'opacity-100' : 'opacity-0'}
                flex items-center justify-center
              `}>
                <p className="text-white text-xs font-medium text-center px-2">
                  {template.name}
                </p>
              </div>

              {/* Favorite star */}
              <button
                onClick={(e) => toggleFavorite(template.id, e)}
                className={`
                  absolute top-1 right-1 p-1 rounded-full
                  ${isFavorite ? 'bg-yellow-500/90' : 'bg-black/40'}
                  hover:scale-110 transition-all z-10
                `}
              >
                <Star className={`w-3 h-3 ${isFavorite ? 'fill-white text-white' : 'text-white'}`} />
              </button>

              {/* Delete button for custom templates */}
              {template.isCustom && (
                <button
                  onClick={(e) => handleDeleteCustom(template.customId!, e)}
                  className="absolute top-1 left-1 p-1 rounded-full bg-red-500/90 hover:bg-red-600 transition-all z-10"
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute bottom-1 right-1 bg-pink-500 rounded-full p-1">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            {/* Hover zoom preview - enlarged version */}
            {isHovered && (
              <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
                  <img
                    src={template.mediaUrl}
                    alt={template.name}
                    className="w-full h-full object-cover rounded-lg shadow-2xl ring-2 ring-white/50"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
                    <p className="text-white font-semibold">{template.name}</p>
                    {template.description && (
                      <p className="text-white/80 text-sm">{template.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-white/5 border border-white/10">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 text-xs"
              >
                <Icon className="w-3 h-3 mr-1" />
                {cat.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {renderTemplateGrid(allTemplates)}
        </TabsContent>

        <TabsContent value="glamour" className="mt-4">
          {renderTemplateGrid(allTemplates.filter(t => t.category === "glamour"))}
        </TabsContent>

        <TabsContent value="professional" className="mt-4">
          {renderTemplateGrid(allTemplates.filter(t => t.category === "professional"))}
        </TabsContent>

        <TabsContent value="casual" className="mt-4">
          {renderTemplateGrid(allTemplates.filter(t => t.category === "casual"))}
        </TabsContent>

        <TabsContent value="meme" className="mt-4">
          {renderTemplateGrid(allTemplates.filter(t => t.category === "meme"))}
        </TabsContent>

        <TabsContent value="custom" className="mt-4">
          <div className="space-y-4">
            <Button
              onClick={handleUploadClick}
              disabled={isUploading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Custom Template
                </>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {renderTemplateGrid(allTemplates.filter(t => t.category === "custom"))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
