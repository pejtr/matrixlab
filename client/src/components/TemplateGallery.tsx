import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Film, Image as ImageIcon, Laugh } from "lucide-react";

export interface Template {
  id: string;
  name: string;
  category: "celebrity" | "meme" | "scene";
  type: "image" | "video";
  thumbnailUrl: string;
  mediaUrl: string;
  description?: string;
}

// Expanded templates - 60% women, 40% men, diverse attractive types
const sampleTemplates: Template[] = [
  // CELEBRITIES (60% women, 40% men)
  {
    id: "celeb-w1",
    name: "Elegant Woman",
    category: "celebrity",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=800&fit=crop",
    description: "Professional businesswoman"
  },
  {
    id: "celeb-w2",
    name: "Fashion Model",
    category: "celebrity",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=800&fit=crop",
    description: "Runway beauty"
  },
  {
    id: "celeb-w3",
    name: "Glamorous Star",
    category: "celebrity",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=800&fit=crop",
    description: "Red carpet ready"
  },
  {
    id: "celeb-w4",
    name: "Natural Beauty",
    category: "celebrity",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&h=800&fit=crop",
    description: "Fresh and radiant"
  },
  {
    id: "celeb-w5",
    name: "Sophisticated Lady",
    category: "celebrity",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=800&fit=crop",
    description: "Classy and elegant"
  },
  {
    id: "celeb-w6",
    name: "Athletic Beauty",
    category: "celebrity",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&h=800&fit=crop",
    description: "Sporty and fit"
  },
  {
    id: "celeb-m1",
    name: "Handsome Actor",
    category: "celebrity",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=800&fit=crop",
    description: "Leading man"
  },
  {
    id: "celeb-m2",
    name: "Dapper Gentleman",
    category: "celebrity",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop",
    description: "Suave and stylish"
  },
  {
    id: "celeb-m3",
    name: "Rugged Hero",
    category: "celebrity",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=800&fit=crop",
    description: "Masculine charm"
  },
  {
    id: "celeb-m4",
    name: "Business Executive",
    category: "celebrity",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&h=800&fit=crop",
    description: "Power and confidence"
  },

  // MEMES (60% women, 40% men)
  {
    id: "meme-w1",
    name: "Surprised Girl",
    category: "meme",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&h=800&fit=crop",
    description: "Shocked expression"
  },
  {
    id: "meme-w2",
    name: "Laughing Beauty",
    category: "meme",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&h=800&fit=crop",
    description: "Pure joy"
  },
  {
    id: "meme-w3",
    name: "Sassy Woman",
    category: "meme",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1551843073-4a9a5b6fcd5f?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1551843073-4a9a5b6fcd5f?w=800&h=800&fit=crop",
    description: "Attitude and confidence"
  },
  {
    id: "meme-m1",
    name: "Funny Guy",
    category: "meme",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=800&h=800&fit=crop",
    description: "Comedy gold"
  },
  {
    id: "meme-m2",
    name: "Confused Man",
    category: "meme",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=800&h=800&fit=crop",
    description: "What just happened?"
  },

  // SCENES (60% women, 40% men)
  {
    id: "scene-w1",
    name: "Office Professional",
    category: "scene",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=800&fit=crop",
    description: "Corporate setting"
  },
  {
    id: "scene-w2",
    name: "Outdoor Adventure",
    category: "scene",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=800&fit=crop",
    description: "Nature lover"
  },
  {
    id: "scene-w3",
    name: "Casual Portrait",
    category: "scene",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&h=800&fit=crop",
    description: "Relaxed and natural"
  },
  {
    id: "scene-m1",
    name: "Business Meeting",
    category: "scene",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=800&fit=crop",
    description: "Professional environment"
  },
  {
    id: "scene-m2",
    name: "Casual Style",
    category: "scene",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&h=800&fit=crop",
    description: "Everyday look"
  },
];

interface TemplateGalleryProps {
  onSelectTemplate: (template: Template) => void;
  selectedTemplates?: Template[];
}

export default function TemplateGallery({ onSelectTemplate, selectedTemplates = [] }: TemplateGalleryProps) {
  const isSelected = (template: Template) => 
    selectedTemplates.some(t => t.id === template.id);

  const renderTemplateGrid = (category: Template["category"]) => {
    const templates = sampleTemplates.filter(t => t.category === category);
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {templates.map((template) => (
          <Card 
            key={template.id} 
            className={`cursor-pointer transition-all hover:scale-105 ${
              isSelected(template) 
                ? 'ring-2 ring-pink-500 bg-white/20' 
                : 'bg-white/10 hover:bg-white/15'
            } backdrop-blur-lg border-white/20`}
            onClick={() => onSelectTemplate(template)}
          >
            <CardContent className="p-3">
              <div className="relative aspect-square mb-2">
                <img 
                  src={template.thumbnailUrl} 
                  alt={template.name}
                  className="w-full h-full object-cover rounded"
                />
                {template.type === "video" && (
                  <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
                    <Film className="h-4 w-4 text-white" />
                  </div>
                )}
                {isSelected(template) && (
                  <div className="absolute inset-0 bg-pink-500/20 rounded flex items-center justify-center">
                    <div className="bg-pink-500 rounded-full p-2">
                      <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              <h4 className="text-white text-sm font-medium truncate">{template.name}</h4>
              {template.description && (
                <p className="text-white/60 text-xs truncate">{template.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="celebrity" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-lg">
          <TabsTrigger value="celebrity" className="data-[state=active]:bg-pink-500">
            <ImageIcon className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Celebrities</span>
            <span className="md:hidden">Celebs</span>
          </TabsTrigger>
          <TabsTrigger value="meme" className="data-[state=active]:bg-purple-500">
            <Laugh className="h-4 w-4 mr-2" />
            Memes
          </TabsTrigger>
          <TabsTrigger value="scene" className="data-[state=active]:bg-blue-500">
            <Film className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Scenes</span>
            <span className="md:hidden">Scenes</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="celebrity" className="mt-4">
          {renderTemplateGrid("celebrity")}
        </TabsContent>
        
        <TabsContent value="meme" className="mt-4">
          {renderTemplateGrid("meme")}
        </TabsContent>
        
        <TabsContent value="scene" className="mt-4">
          {renderTemplateGrid("scene")}
        </TabsContent>
      </Tabs>
      
      {selectedTemplates.length > 0 && (
        <div className="mt-4 p-3 bg-white/10 backdrop-blur-lg rounded-lg border border-white/20">
          <p className="text-white text-sm">
            {selectedTemplates.length} template{selectedTemplates.length > 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  );
}
