import { useLocation } from "wouter";
import { Briefcase, Palette, Megaphone, Film, GraduationCap, Users } from "lucide-react";

interface UseCase {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  examples: string[];
}

const USE_CASES: UseCase[] = [
  {
    id: "business",
    title: "Business & Startups",
    description: "Create professional visuals for your business without hiring a designer",
    icon: <Briefcase className="h-6 w-6" />,
    examples: ["Product mockups", "Social media content", "Brand assets", "Presentations"],
  },
  {
    id: "creative",
    title: "Creative Professionals",
    description: "Speed up your creative workflow with AI-powered generation",
    icon: <Palette className="h-6 w-6" />,
    examples: ["Concept art", "Illustrations", "Design iterations", "Mood boards"],
  },
  {
    id: "marketing",
    title: "Marketing Teams",
    description: "Generate campaign visuals at scale with consistent quality",
    icon: <Megaphone className="h-6 w-6" />,
    examples: ["Ad creatives", "Blog headers", "Email graphics", "Landing pages"],
  },
  {
    id: "entertainment",
    title: "Entertainment",
    description: "Bring characters and worlds to life with AI generation",
    icon: <Film className="h-6 w-6" />,
    examples: ["Character design", "Storyboards", "Game assets", "Fan art"],
  },
  {
    id: "education",
    title: "Education",
    description: "Create engaging visual content for learning materials",
    icon: <GraduationCap className="h-6 w-6" />,
    examples: ["Educational illustrations", "Infographics", "Presentation visuals", "Course materials"],
  },
  {
    id: "social",
    title: "Social Media Creators",
    description: "Stand out with unique visuals that grab attention",
    icon: <Users className="h-6 w-6" />,
    examples: ["Profile pictures", "Story backgrounds", "Reel thumbnails", "Post graphics"],
  },
];

export function PerfectFor() {
  const [, setLocation] = useLocation();

  return (
    <section className="py-16 md:py-24 bg-[#090a0a]">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Perfect For
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Whether you're a business owner, creative professional, or content creator,
            our AI tools help you work faster and create better visuals.
          </p>
        </div>

        {/* Use cases grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {USE_CASES.map((useCase) => (
            <div
              key={useCase.id}
              onClick={() => setLocation("/ai/image-generator")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLocation("/ai/image-generator"); } }}
              tabIndex={0}
              role="button"
              className="group p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.08] hover:border-white/20 transition-all cursor-pointer"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white mb-4 group-hover:bg-white/20 transition-colors">
                {useCase.icon}
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-white mb-2">
                {useCase.title}
              </h3>
              <p className="text-sm text-white/60 mb-4">
                {useCase.description}
              </p>

              {/* Examples */}
              <div className="flex flex-wrap gap-2">
                {useCase.examples.map((example, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 bg-white/10 rounded text-white/50"
                  >
                    {example}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
