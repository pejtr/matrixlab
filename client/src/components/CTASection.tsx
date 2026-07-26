import { useLocation } from "wouter";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  const [, setLocation] = useLocation();

  return (
    <section className="py-16 md:py-24 bg-[#090a0a]">
      <div className="container mx-auto px-4">
        <div className="relative max-w-4xl mx-auto">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-3xl blur-3xl" />

          {/* Content */}
          <div className="relative p-8 md:p-12 bg-white/5 border border-white/10 rounded-3xl text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 mb-6">
              <Sparkles className="h-8 w-8 text-white" />
            </div>

            {/* Heading */}
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Create Something Amazing?
            </h2>

            {/* Description */}
            <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8">
              Join thousands of creators using our AI tools to bring their ideas to life.
              Start generating for free today.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => setLocation("/ai/image-generator")}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-8"
              >
                Start Creating Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                onClick={() => setLocation("/pricing")}
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10"
              >
                View Pricing
              </Button>
            </div>

            {/* Trust text */}
            <p className="text-sm text-white/40 mt-6">
              No credit card required • 50 free credits daily
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
