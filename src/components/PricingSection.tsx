/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
  bgGradient: string;
  hoverBorderColor: string;
  checkIconColor: string;
  buttonClass: string;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Horizon Free",
    price: "$0",
    period: "/mo",
    features: [
      "3 Active Projects",
      "Community Support",
      "Basic UI Components"
    ],
    buttonText: "Get Started",
    bgGradient: "bg-gradient-to-b from-[#38BDF8]/10 to-transparent",
    hoverBorderColor: "rgba(56, 189, 248, 0.5)",
    checkIconColor: "text-primary",
    buttonClass: "w-full bg-white/50 backdrop-blur-md border border-white/60 shadow-sm text-black rounded-xl py-3.5 font-sans font-semibold hover:bg-primary hover:text-white hover:border-primary transition-colors duration-300"
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
      "Advanced APIs & Integrations"
    ],
    buttonText: "Upgrade to Pro",
    isPopular: true,
    bgGradient: "bg-gradient-to-b from-[#C084FC]/20 to-[#FF9A9E]/20",
    hoverBorderColor: "rgba(192, 132, 252, 0.5)",
    checkIconColor: "text-black",
    buttonClass: "w-full bg-[#FF4D24] text-white border border-[#FF4D24] shadow-sm rounded-xl py-3.5 font-sans font-semibold hover:bg-black hover:border-black transition-colors duration-300"
  }
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-6 sm:px-16 relative">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Copywriting */}
          <motion.div
            className="p-8 sm:p-10 flex flex-col justify-center h-full bg-white/40 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.02)]"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight text-[#111111] mb-4">
              Simple, transparent pricing.
            </h2>
            <p className="font-sans text-base text-[#555555] mb-6">
              Choose the plan that fits your ambition. No hidden setup fees or complex contracts.
            </p>
          </motion.div>

          {/* Dynamic Pricing Cards mapped from Options array */}
          {PRICING_PLANS.map((plan) => (
            <div key={plan.id} className="flex flex-col h-full">
              <motion.div
                className="p-8 sm:p-10 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col relative overflow-hidden group h-full min-h-[550px] cursor-pointer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.08)",
                  borderColor: plan.hoverBorderColor
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 18
                }}
              >
                <div className={`absolute inset-0 ${plan.bgGradient} -z-10`} />
                {plan.isPopular && (
                  <div className="absolute top-4 right-4 bg-white/60 backdrop-blur-md border border-white/80 text-primary shadow-sm text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Popular
                  </div>
                )}
                <h3 className="font-display text-2xl text-black font-bold mb-2">
                  {plan.name}
                </h3>
                <div className="font-display text-5xl text-black font-extrabold mb-6 flex items-baseline">
                  {plan.price}
                  <span className="font-sans text-sm font-medium text-[#555555] ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1 font-sans text-sm text-[#555555]">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <span className={`material-symbols-outlined ${plan.checkIconColor} text-lg font-bold`}>check</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={plan.buttonClass}
                >
                  {plan.buttonText}
                </motion.button>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Enterprise bottom panel */}
        <motion.div
          className="mt-8 bg-white/40 backdrop-blur-xl rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.02)] relative overflow-hidden"
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
          <button className="mt-4 md:mt-0 bg-white/50 backdrop-blur-md border border-white/60 shadow-sm text-black rounded-xl px-8 py-3 font-sans font-semibold hover:bg-black hover:text-white hover:border-black transition-colors duration-300">
            Contact Sales
          </button>
        </motion.div>
      </div>
    </section>
  );
}
