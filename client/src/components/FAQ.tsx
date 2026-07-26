import { useState } from "react";
import { ChevronDown, Plus, Minus } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How many free credits do I get?",
    answer: "Every new user gets 50 free credits per day. No credit card required. Free credits reset daily at midnight UTC.",
  },
  {
    question: "What AI models are available?",
    answer: "We support GPT Image 2, Flux 2 Pro, Midjourney V7, Imagen 4, Ideogram V3, Stable Diffusion 3.5, Recraft V4, and many more. New models are added regularly.",
  },
  {
    question: "Can I use generated images commercially?",
    answer: "Yes! All images generated with our paid plans come with a full commercial license. Free plan images include a watermark but can still be used commercially with attribution.",
  },
  {
    question: "How does the credit system work?",
    answer: "Different actions cost different amounts of credits. Text-to-image costs 1 credit, image-to-image costs 2 credits, and video generation costs 10 credits. Credits are deducted when you click 'Generate'.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time from your account settings. You'll continue to have access to your plan features until the end of your billing period.",
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer a 7-day money-back guarantee for new subscriptions. If you're not satisfied, contact our support team within 7 days of your purchase for a full refund.",
  },
  {
    question: "Is there an API available?",
    answer: "Yes, API access is available for Pro and Ultra plan subscribers. You can find documentation and API keys in your account dashboard.",
  },
  {
    question: "What image resolutions are supported?",
    answer: "We support resolutions from 512x512 up to 4K (4096x4096) depending on the model. Ultra plan users get access to 4K generation.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16 md:py-24 bg-[#090a0a]">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Everything you need to know about our AI image generation platform.
          </p>
        </div>

        {/* FAQ list */}
        <div className="max-w-3xl mx-auto space-y-4">
          {FAQ_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className="border border-white/10 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                aria-expanded={openIndex === idx}
                aria-controls={`faq-answer-${idx}`}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-white font-medium pr-4">{item.question}</span>
                {openIndex === idx ? (
                  <Minus className="h-5 w-5 text-white/50 flex-shrink-0" />
                ) : (
                  <Plus className="h-5 w-5 text-white/50 flex-shrink-0" />
                )}
              </button>
              {openIndex === idx && (
                <div id={`faq-answer-${idx}`} role="region" className="px-5 pb-5 text-white/60 text-sm leading-relaxed">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="text-center mt-12">
          <p className="text-white/50 mb-4">Still have questions?</p>
          <button className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
            Contact Support →
          </button>
        </div>
      </div>
    </section>
  );
}
