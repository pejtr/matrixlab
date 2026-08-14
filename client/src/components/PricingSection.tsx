import { useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { Check, Sparkles, Zap, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  credits: number;
  features: string[];
  popular?: boolean;
  gradient: string;
  accentBorder: string;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    credits: 50,
    features: ["50 free daily credits", "Basic AI image models", "Standard generation queue", "Personal usage license", "Community Discord access"],
    gradient: "from-white/[0.04] to-transparent",
    accentBorder: "border-white/10 hover:border-white/20",
  },
  {
    id: "starter",
    name: "Creator",
    priceMonthly: 9,
    priceYearly: 7,
    credits: 1000,
    features: ["1,000 credits / month", "Access to Flux 2 Pro & GPT Image 2", "Zero watermarks on 8K exports", "Priority fast queue", "Commercial rights included", "Email support"],
    gradient: "from-cyan-500/10 via-blue-500/5 to-transparent",
    accentBorder: "border-cyan-400/30 hover:border-cyan-400/60",
  },
  {
    id: "pro",
    name: "Pro Studio",
    priceMonthly: 29,
    priceYearly: 24,
    credits: 5000,
    popular: true,
    features: ["5,000 credits / month", "All models (Midjourney V7, SD 3.5)", "Single & Multi-Face Swap engine", "Sub-second turbo generation", "REST API & Webhook access", "Priority VIP support", "Commercial license"],
    gradient: "from-cyan-500/20 via-emerald-500/10 to-indigo-500/20",
    accentBorder: "border-cyan-400/80 shadow-[0_0_35px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50",
  },
  {
    id: "ultra",
    name: "Agency Ultra",
    priceMonthly: 79,
    priceYearly: 65,
    credits: 20000,
    features: ["20,000 credits / month", "Unrestricted 8K super resolution", "Unlimited Face Swap jobs", "Dedicated GPU infrastructure", "Full API & Custom LoRA training", "Dedicated Account Manager", "Team seat sharing"],
    gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
    accentBorder: "border-violet-400/40 hover:border-violet-400/70",
  },
] as const;

function PlanCard({ plan, isYearly, onSelect }: { plan: Plan; isYearly: boolean; onSelect: (plan: Plan) => void }) {
  return (
    <div
      className={`relative p-7 rounded-2xl border transition-all bg-black/60 backdrop-blur-xl flex flex-col justify-between ${plan.gradient} ${plan.accentBorder} ${
        plan.popular ? "scale-[1.02]" : ""
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-400 to-emerald-400 text-black text-[11px] font-mono font-extrabold rounded-full uppercase tracking-wider shadow-lg">
          ★ MOST POPULAR
        </div>
      )}

      <div>
        <div className="text-center mb-6">
          <span className="font-mono text-xs text-white/50 uppercase tracking-widest block mb-1">
            {plan.name}
          </span>
          <div className="flex items-baseline justify-center gap-1">
            <span className="font-mono text-4xl font-extrabold text-white">
              ${isYearly ? plan.priceYearly : plan.priceMonthly}
            </span>
            <span className="font-mono text-xs text-white/50">/mo</span>
          </div>
          <div className="mt-3 p-2 rounded-xl bg-white/[0.04] border border-white/5 font-mono text-xs text-cyan-300 font-semibold">
            {plan.credits.toLocaleString()} Credits / Mo
          </div>
        </div>

        <ul className="space-y-3 mb-8">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs text-white/70">
              <Check className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        onClick={() => onSelect(plan)}
        size="lg"
        className={`w-full h-12 text-xs font-mono font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
          plan.popular
            ? "bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
        }`}
      >
        <span>{plan.id === "free" ? "GET STARTED FREE" : `SELECT ${plan.name.toUpperCase()}`}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(true);
  const [, setLocation] = useLocation();

  const handleSelectPlan = useCallback((plan: Plan) => {
    if (plan.id === "free") {
      setLocation("/ai/image-generator");
      return;
    }
    alert(`Stripe Checkout simulator: Plan ${plan.name} at $${isYearly ? plan.priceYearly : plan.priceMonthly}/mo selected.`);
  }, [isYearly, setLocation]);

  const toggleBilling = useCallback(() => setIsYearly(prev => !prev), []);

  const planCards = useMemo(() => (
    PLANS.map((plan) => (
      <PlanCard key={plan.id} plan={plan} isYearly={isYearly} onSelect={handleSelectPlan} />
    ))
  ), [isYearly, handleSelectPlan]);

  return (
    <section className="py-24 relative overflow-hidden bg-black/95">
      <div className="container mx-auto px-4 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-cyan-400 mb-3 uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" /> Transparent Pricing
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white mb-4">
            CHOOSE YOUR <span className="text-cyan-400 italic">CREATIVE POWER</span>
          </h2>
          <p className="text-white/60 text-base font-light">
            Flexible monthly plans or yearly billing with instant savings. Cancel or upgrade anytime.
          </p>

          {/* Billing Switcher */}
          <div className="inline-flex items-center gap-4 mt-8 p-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md">
            <span className={`text-xs font-mono font-semibold px-3 py-1 rounded-full ${!isYearly ? "bg-white/20 text-white" : "text-white/50"}`}>
              Monthly
            </span>
            <button
              onClick={toggleBilling}
              role="switch"
              aria-checked={isYearly}
              className={`relative w-12 h-6 rounded-full transition-colors ${isYearly ? "bg-cyan-400" : "bg-white/20"}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-black rounded-full transition-transform ${isYearly ? "left-6" : "left-0.5"}`} />
            </button>
            <span className={`text-xs font-mono font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 ${isYearly ? "bg-cyan-400/20 text-cyan-300" : "text-white/50"}`}>
              <span>Yearly</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-400 text-black font-bold">SAVE 20%</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
          {planCards}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-8 text-xs font-mono text-white/50 tracking-wider uppercase border-t border-white/10 pt-8 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Instant Activation</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            <span>No Unused Credit Expiry</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Cancel Anytime</span>
          </div>
        </div>

      </div>
    </section>
  );
}
