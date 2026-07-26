import { useAuth } from "@/_core/hooks/useAuth";
import { HeroSection } from "@/components/HeroSection";
import { ModelShowcase } from "@/components/ModelShowcase";
import { TemplateExplorer } from "@/components/TemplateExplorer";
import { ToolsGrid } from "@/components/ToolsGrid";
import { PerfectFor } from "@/components/PerfectFor";
import { ScrollingGallery } from "@/components/ScrollingGallery";
import { PricingSection } from "@/components/PricingSection";
import { FAQ } from "@/components/FAQ";
import { CTASection } from "@/components/CTASection";

export default function Home() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090a0a]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0a]">
      <HeroSection />
      <ModelShowcase />
      <TemplateExplorer />
      <ToolsGrid />
      <PerfectFor />
      <ScrollingGallery />
      <PricingSection />
      <FAQ />
      <CTASection />
    </div>
  );
}
