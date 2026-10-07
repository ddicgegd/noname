/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, type MouseEvent, type CSSProperties } from "react";
import { motion } from "motion/react";
import ClawMachine from "./ClawMachine";
import HoloCardPaymentSheet, { type PricingPlan } from "./HoloCardPaymentSheet";
import { HoloCard } from "./HoloCard";

const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Horizon Free",
    price: "$0",
    period: "/mo",
    features: ["3 Active Projects", "Community Support", "Basic UI Components"],
    buttonText: "Get Started",
    bgGradient: "bg-gradient-to-b from-[#38BDF8]/10 to-transparent",
    hoverBorderColor: "rgba(56,189,248,0.55)",
    checkIconColor: "text-primary",
    buttonClass:
      "w-full bg-gradient-to-b from-white/90 via-white/75 to-white/55 border-t border-t-white border-b border-b-slate-300/70 border-x border-x-white/70 backdrop-blur-md shadow-[0_2px_6px_-1px_rgba(0,0,0,0.07),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.04)] text-black rounded-xl py-3.5 font-sans font-semibold hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 active:scale-95 cursor-pointer select-none",
    foilTint: "#5cc8ff",
    glowColor: "rgba(56,189,248,0.30)",
    rimColor: "rgba(56,189,248,0.9)",
  },
  {
    id: "pro",
    name: "Horizon Pro",
    price: "$20",
    period: "/mo",
    features: [
      "Unlimited Projects",
      "Priority 24/7 Support",
      "Custom Domain Binding",
      "Advanced APIs & Integrations",
    ],
    buttonText: "Upgrade to Pro",
    isPopular: true,
    bgGradient: "bg-gradient-to-b from-[#C084FC]/20 to-[#FF9A9E]/20",
    hoverBorderColor: "rgba(192,132,252,0.55)",
    checkIconColor: "text-black",
    buttonClass:
      "w-full bg-gradient-to-b from-[#FF5E3A] via-[#FF4D24] to-[#E03A12] border-t border-t-white/50 border-b border-b-[#A8280A] border-x border-x-[#FF4D24]/80 shadow-[0_4px_16px_rgba(255,77,36,0.35),0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.45)] text-white rounded-xl py-3.5 font-sans font-semibold hover:brightness-105 active:scale-95 transition-all duration-300 cursor-pointer select-none",
    foilTint: "#c084fc",
    glowColor: "rgba(192,132,252,0.32)",
    rimColor: "rgba(192,132,252,0.95)",
  },
];


export default function PricingSection() {
  const [isVerified, setIsVerified] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);

  return (
    <section id="pricing" className="py-24 px-6 sm:px-16 relative">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            className="p-4 sm:p-5 bg-white/50 backdrop-blur-xl rounded-2xl flex flex-col justify-between relative overflow-hidden h-full min-h-[550px] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Subtle light ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#FF4D24]/6 via-transparent to-transparent -z-10 pointer-events-none" />
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#FF4D24]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

            {/* Top pill badge matching HoloCard popular badge */}
            <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 pointer-events-none">
              <span className="bg-white/70 backdrop-blur-md border border-white/80 text-primary shadow-xs text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Anti-Bot
              </span>
            </div>

            <ClawMachine onVerify={setIsVerified} />
          </motion.div>

          {PRICING_PLANS.map((plan) => (
            <div key={plan.id} className="contents">
              <HoloCard plan={plan} isVerified={isVerified} onSelect={setSelectedPlan} />
            </div>
          ))}
        </div>

        <motion.div
          className="mt-8 bg-gradient-to-b from-white/80 via-white/65 to-white/45 backdrop-blur-xl rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between border-t border-t-white border-b border-b-slate-300/60 border-x border-x-white/70 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="absolute inset-0 bg-[#38BDF8]/5 -z-10" />
          <div className="text-left">
            <h4 className="font-display text-xl sm:text-2xl text-black font-bold mb-1">
              Enterprise requirements?
            </h4>
            <p className="font-sans text-sm text-[#555555]">
              Custom SLAs, dedicated account managers, security reviews, and single sign-on.
            </p>
          </div>
          <button className="mt-4 md:mt-0 bg-gradient-to-b from-white/90 via-white/75 to-white/55 border-t border-t-white border-b border-b-slate-300/70 border-x border-x-white/70 backdrop-blur-md shadow-[0_2px_6px_-1px_rgba(0,0,0,0.07),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.04)] text-black rounded-xl px-8 py-3 font-sans font-semibold hover:bg-black hover:text-white hover:border-black active:scale-95 transition-all duration-300 cursor-pointer select-none">
            Contact Sales
          </button>
        </motion.div>

        {/* Hologram Card Payment Sheet (Style B - Floating Glass Deck) */}
        <HoloCardPaymentSheet
          plan={selectedPlan}
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
        />
      </div>
    </section>
  );
}
