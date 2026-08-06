import { lazy, Suspense } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { HeroSection } from "@/components/HeroSection";

const ModelShowcase = lazy(() => import("@/components/ModelShowcase").then(m => ({ default: m.ModelShowcase })));
const TemplateExplorer = lazy(() => import("@/components/TemplateExplorer").then(m => ({ default: m.TemplateExplorer })));
const ToolsGrid = lazy(() => import("@/components/ToolsGrid").then(m => ({ default: m.ToolsGrid })));
const PerfectFor = lazy(() => import("@/components/PerfectFor").then(m => ({ default: m.PerfectFor })));
const ScrollingGallery = lazy(() => import("@/components/ScrollingGallery").then(m => ({ default: m.ScrollingGallery })));
const PricingSection = lazy(() => import("@/components/PricingSection").then(m => ({ default: m.PricingSection })));
const FAQ = lazy(() => import("@/components/FAQ").then(m => ({ default: m.FAQ })));
const CTASection = lazy(() => import("@/components/CTASection").then(m => ({ default: m.CTASection })));

function SectionLoader() {
  return <div className="h-32 animate-pulse bg-white/5 rounded-xl mx-4" />;
}

export default function Home() {
  const { loading } = useAuth();

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
      <Suspense fallback={<SectionLoader />}>
        <ModelShowcase />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <TemplateExplorer />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <ToolsGrid />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <PerfectFor />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <ScrollingGallery />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <PricingSection />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <FAQ />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <CTASection />
      </Suspense>
    </div>
  );
}
