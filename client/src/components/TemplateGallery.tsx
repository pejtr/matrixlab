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

// Sample templates - in production, these would come from a database or API
const sampleTemplates: Template[] = [
  {
    id: "celeb-1",
    name: "Elon Musk",
    category: "celebrity",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=800&fit=crop",
    description: "Business portrait"
  },
  {
    id: "celeb-2",
    name: "Business Woman",
    category: "celebrity",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=800&fit=crop",
    description: "Professional headshot"
  },
  {
    id: "meme-1",
    name: "Surprised Face",
    category: "meme",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop",
    description: "Classic meme expression"
  },
  {
    id: "meme-2",
    name: "Laughing Person",
    category: "meme",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=800&h=800&fit=crop",
    description: "Happy expression"
  },
  {
    id: "scene-1",
    name: "Office Meeting",
    category: "scene",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=800&fit=crop",
    description: "Professional setting"
  },
  {
    id: "scene-2",
    name: "Casual Portrait",
    category: "scene",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=800&fit=crop",
    description: "Outdoor scene"
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
