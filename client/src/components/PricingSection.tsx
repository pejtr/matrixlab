import { useState } from "react";
import { useLocation } from "wouter";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  credits: number;
  features: string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    credits: 50,
    features: [
      "50 credits per day",
      "Basic AI models",
      "Watermark on exports",
      "Standard generation speed",
      "Community support",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 9,
    priceYearly: 7,
    credits: 1000,
    features: [
      "1,000 credits per month",
      "All AI models",
      "No watermark",
      "Priority generation",
      "Email support",
      "Commercial license",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 29,
    priceYearly: 24,
    credits: 5000,
    popular: true,
    features: [
      "5,000 credits per month",
      "All AI models",
      "No watermark",
      "Fastest generation",
      "API access",
      "Priority support",
      "Commercial license",
      "Batch generation",
    ],
  },
  {
    id: "ultra",
    name: "Ultra",
    priceMonthly: 79,
    priceYearly: 65,
    credits: 20000,
    features: [
      "20,000 credits per month",
      "All AI models",
      "No watermark",
      "Fastest generation",
      "API access",
      "4K generation",
      "Dedicated support",
      "Commercial license",
      "Custom model training",
      "Team collaboration",
    ],
  },
];

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const [, setLocation] = useLocation();

  const handleSelectPlan = async (plan: Plan) => {
    if (plan.id === "free") {
      setLocation("/ai/image-generator");
      return;
    }
    alert(`In production, this would open Stripe checkout for ${plan.name} plan at $${isYearly ? plan.priceYearly : plan.priceMonthly}/mo`);
  };

  return (
    <section className="py-16 md:py-24 bg-[#090a0a]">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-white/80">Simple Pricing</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Start for free, upgrade when you need more. All plans include
            access to our full suite of AI tools.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm ${!isYearly ? "text-white" : "text-white/50"}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            role="switch"
            aria-checked={isYearly}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              isYearly ? "bg-purple-500" : "bg-white/20"
            }`}
          >
            <div
              className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                isYearly ? "left-8" : "left-1"
              }`}
            />
          </button>
          <span className={`text-sm ${isYearly ? "text-white" : "text-white/50"}`}>
            Yearly
            <span className="ml-2 text-xs text-green-400 font-medium">Save 20%</span>
          </span>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-6 rounded-2xl border transition-all ${
                plan.popular
                  ? "bg-gradient-to-b from-purple-500/20 to-pink-500/20 border-purple-500/50"
                  : "bg-white/5 border-white/10 hover:bg-white/8"
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}

              {/* Plan header */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-white">
                    ${isYearly ? plan.priceYearly : plan.priceMonthly}
                  </span>
                  <span className="text-white/50">/mo</span>
                </div>
                <p className="text-sm text-white/50 mt-2">
                  {plan.credits.toLocaleString()} credits per month
                </p>
              </div>

              {/* Features list */}
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-white/70">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              <Button
                onClick={() => handleSelectPlan(plan)}
                variant={plan.popular ? "default" : "outline"}
                className={`w-full ${
                  plan.popular
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    : "border-white/20 text-white hover:bg-white/10"
                }`}
              >
                {plan.id === "free" ? "Get Started" : "Choose Plan"}
              </Button>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-white/50">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-400" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-400" />
            <span>Secure payment via Stripe</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-400" />
            <span>No hidden fees</span>
          </div>
        </div>
      </div>
    </section>
  );
}
