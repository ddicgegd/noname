/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import HoloCardPaymentSheet, { type PricingPlan } from "./HoloCardPaymentSheet";
import { HoloCard } from "./HoloCard";
import { getSubscriptionPlans } from "../services/subscriptionService";
import { cn } from "@/lib/utils";

const INITIAL_PLANS: PricingPlan[] = [
  {
    id: "free",
    planCode: "ANH_KIM",
    name: "Gói Ánh Kim",
    price: "30.000₫",
    period: "/tháng",
    priceAmount: 30000,
    freeTrialDays: 7,
    targetRank: "SILVER",
    features: [
      "7 ngày dùng thử miễn phí",
      "Giỏ hàng 100 sản phẩm",
      "Hạng hội viên Bạc (Silver)",
      "Hỗ trợ cộng đồng 24/7",
    ],
    buttonText: "Dùng thử 7 ngày",
    bgGradient: "",
    hoverBorderColor: "rgba(0,0,0,0.15)",
    checkIconColor: "text-primary",
    buttonClass:
      "w-full bg-gradient-to-b from-white/90 via-white/75 to-white/55 backdrop-blur-md shadow-[0_2px_6px_-1px_rgba(0,0,0,0.07),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.04)] text-black rounded-xl py-3.5 font-sans font-semibold hover:bg-primary hover:text-white transition-all duration-300 active:scale-95 cursor-pointer select-none outline-none focus:outline-none focus-visible:outline-none border border-black/[0.04] dark:border-white/[0.05]",
    foilTint: "#5cc8ff",
    glowColor: "rgba(56,189,248,0.30)",
    rimColor: "transparent",
  },
  {
    id: "pro",
    planCode: "MA_THUAT",
    name: "Gói Ma Thuật",
    price: "120.000₫",
    period: "/tháng",
    priceAmount: 120000,
    freeTrialDays: 0,
    targetRank: "DIAMOND",
    features: [
      "Chiết khấu 3% toàn bộ đơn hàng",
      "Giỏ hàng không giới hạn",
      "Miễn phí vận chuyển toàn quốc",
      "Hạng hội viên Kim Cương (Diamond)",
    ],
    buttonText: "Nâng cấp Kim Cương",
    isPopular: true,
    bgGradient: "",
    hoverBorderColor: "rgba(0,0,0,0.15)",
    checkIconColor: "text-black",
    buttonClass:
      "w-full bg-gradient-to-b from-[#FF5E3A] via-[#FF4D24] to-[#E03A12] shadow-[0_4px_16px_rgba(255,77,36,0.35),0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.45)] text-white rounded-xl py-3.5 font-sans font-semibold hover:brightness-105 active:scale-95 transition-all duration-300 cursor-pointer select-none outline-none focus:outline-none focus-visible:outline-none border border-black/[0.04] dark:border-white/[0.05]",
    foilTint: "#c084fc",
    glowColor: "rgba(192,132,252,0.32)",
    rimColor: "transparent",
  },
];


export default function PricingSection() {
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);
  const [plans, setPlans] = useState<PricingPlan[]>(INITIAL_PLANS);

  useEffect(() => {
    let isCurrent = true;
    getSubscriptionPlans()
      .then((apiPlans) => {
        if (!isCurrent || !apiPlans || apiPlans.length === 0) return;
        setPlans((prev) =>
          prev.map((p) => {
            const matched = apiPlans.find(
              (ap) =>
                ap.planCode === p.planCode ||
                (p.id === "free" && ap.planCode === "ANH_KIM") ||
                (p.id === "pro" && ap.planCode === "MA_THUAT")
            );
            if (!matched) return p;
            return {
              ...p,
              name: matched.name,
              price: `${matched.priceAmount.toLocaleString("vi-VN")}₫`,
              priceAmount: matched.priceAmount,
              freeTrialDays: matched.freeTrialDays,
              targetRank: matched.targetRank,
            };
          })
        );
      })
      .catch((err) => {
        console.warn("Could not fetch subscription plans:", err);
      });

    return () => {
      isCurrent = false;
    };
  }, []);
  return (
    <section id="pricing" className="py-24 px-6 sm:px-16 relative">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl lg:max-w-5xl mx-auto justify-center">
          {plans.map((plan) => (
            <div key={plan.id} className="contents">
              <HoloCard
                plan={plan}
                className={cn(
                  "transition-all duration-300",
                  selectedPlan?.id === plan.id
                    ? "opacity-20 scale-[0.98] pointer-events-none"
                    : "opacity-100 scale-100"
                )}
                onSelect={(p, rect) => {
                  setOriginRect(rect ?? null);
                  setSelectedPlan(p);
                }}
              />
            </div>
          ))}
        </div>

        <motion.div
          className="mt-8 max-w-4xl lg:max-w-5xl mx-auto bg-gradient-to-b from-white/80 via-white/65 to-white/45 backdrop-blur-xl rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] relative overflow-hidden outline-none focus:outline-none focus-visible:outline-none border border-black/[0.04] dark:border-white/[0.05]"
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
          <button className="mt-4 md:mt-0 bg-gradient-to-b from-white/90 via-white/75 to-white/55 backdrop-blur-md shadow-[0_2px_6px_-1px_rgba(0,0,0,0.07),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.04)] text-black rounded-xl px-8 py-3 font-sans font-semibold hover:bg-black hover:text-white active:scale-95 transition-all duration-300 cursor-pointer select-none outline-none focus:outline-none focus-visible:outline-none border border-black/[0.04] dark:border-white/[0.05]">
            Contact Sales
          </button>
        </motion.div>

        {/* Hologram Card Payment Sheet with FLIP Morphing */}
        <HoloCardPaymentSheet
          plan={selectedPlan}
          originRect={originRect}
          isOpen={!!selectedPlan}
          onClose={() => {
            setSelectedPlan(null);
            setOriginRect(null);
          }}
        />
      </div>
    </section>
  );
}
