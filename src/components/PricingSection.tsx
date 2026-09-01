/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, type MouseEvent, type CSSProperties } from "react";
import { motion } from "motion/react";
import ClawMachine from "./ClawMachine";



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
  /** Primary foil color (rgba) */
  foilTint: string;
  /** Glow shadow color (rgba) */
  glowColor: string;
  /** Top rim light color */
  rimColor: string;
}

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

function HoloCard({ plan, isVerified }: { plan: PricingPlan; isVerified: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);   // perspective wrapper
  const cardRef = useRef<HTMLDivElement>(null);   // tilting card
  const foilRef = useRef<HTMLDivElement>(null);   // foil overlay
  const glintRef = useRef<HTMLDivElement>(null);  // specular dot
  const rimRef  = useRef<HTMLDivElement>(null);   // top rim

  // Animation state — no React state, direct DOM manipulation
  const raf = useRef<number>(0);
  const cur = useRef({ px: 50, py: 50, rx: 0, ry: 0, active: 0 });
  const tgt = useRef({ px: 50, py: 50, rx: 0, ry: 0, active: 0 });
  const startTime = useRef(Date.now() + Math.random() * 6000); // stagger per card

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  useEffect(() => {
    const card = cardRef.current;
    const foil = foilRef.current;
    const glint = glintRef.current;
    const rim  = rimRef.current;
    const wrap = wrapRef.current;
    if (!card || !foil || !glint || !rim || !wrap) return;

    const tick = () => {
      const c = cur.current;
      const t = tgt.current;
      const lf = 0.12;

      c.px     = lerp(c.px,     t.px,     lf);
      c.py     = lerp(c.py,     t.py,     lf);
      c.rx     = lerp(c.rx,     t.rx,     lf);
      c.ry     = lerp(c.ry,     t.ry,     lf);
      c.active = lerp(c.active, t.active, lf * 0.8);

      const a = c.active;

      // --- Idle float: gentle sine/cosine bob when not hovered ---
      const elapsed = (Date.now() - startTime.current) / 1000;
      // ~4-6s cycle (+15% speed)
      const idleY  =  Math.sin(elapsed * 0.748) * 6;    // ±6px vertical bob
      const idleRx =  Math.sin(elapsed * 0.633) * 2.5;  // ±2.5° pitch
      const idleRy =  Math.cos(elapsed * 0.483) * 2.0;  // ±2.0° yaw
      // blend: idle fully active at rest, fades out smoothly as cursor takes over
      const idleBlend = 1 - a;
      const finalY  = idleY  * idleBlend;
      const finalRx = c.rx + idleRx * idleBlend;
      const finalRy = c.ry + idleRy * idleBlend;

      // --- Card tilt + float ---
      card.style.transform = `translateY(${finalY.toFixed(2)}px) rotateX(${finalRx.toFixed(2)}deg) rotateY(${finalRy.toFixed(2)}deg)`;

      // --- Sheen position ---
      // Idle: derived from float phase so it moves with the card tilt direction
      const idlePx = 50 + Math.cos(elapsed * 0.483) * 38; // follows yaw phase
      const idlePy = 50 + Math.sin(elapsed * 0.748) * 32; // follows bob phase
      // Blend: idle pos at rest → cursor pos on hover
      const effectPx = lerp(idlePx, c.px, a);
      const effectPy = lerp(idlePy, c.py, a);

      // --- Foil shimmer ---
      // Always visible (dim at idle 0.20), brightens to 0.85 on hover
      foil.style.setProperty("--px", effectPx.toFixed(2));
      foil.style.setProperty("--py", effectPy.toFixed(2));
      foil.style.opacity = lerp(0.24, 0.85, a).toFixed(3);
      foil.style.filter  = `saturate(1.2) hue-rotate(calc((${effectPx.toFixed(2)} - 50) * 1.4deg))`;

      // --- Specular glint ---
      // Faint at idle (0.06), visible on hover (0.187)
      glint.style.backgroundPosition = `${effectPx.toFixed(1)}% ${effectPy.toFixed(1)}%`;
      glint.style.opacity = lerp(0.06, 0.187, a).toFixed(3);

      // --- Rim light ---
      rim.style.opacity = (0.2 + a * 0.55).toFixed(3);

      // --- Colored drop-shadow ---
      // Dim glow at idle (0.096), grows on hover (0.298)
      const glowAlpha = lerp(0.096, 0.298, a).toFixed(3);
      const glowRaw = plan.glowColor.replace(/[\d.]+\)$/, `${glowAlpha})`);
      const shadowSpread = lerp(20, 40, a).toFixed(0);
      const shadowBlur   = lerp(30, 70, a).toFixed(0);
      card.style.boxShadow = `0 ${shadowSpread}px ${shadowBlur}px -8px ${glowRaw}, 0 4px 16px rgba(0,0,0,0.05)`;

      // --- Border ---
      card.style.borderColor = a > 0.01
        ? `color-mix(in srgb, ${plan.hoverBorderColor} ${(a * 100).toFixed(0)}%, rgba(255,255,255,0.6))`
        : "rgba(255,255,255,0.6)";


      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [plan]);


  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const px = ((e.clientX - r.left) / r.width)  * 100;
    const py = ((e.clientY - r.top)  / r.height) * 100;
    // Tilt: ±8° max
    const cx = r.left + r.width  / 2;
    const cy = r.top  + r.height / 2;
    const rx = -((e.clientY - cy) / (r.height / 2)) * 8;
    const ry =  ((e.clientX - cx) / (r.width  / 2)) * 8;
    tgt.current.px = px;
    tgt.current.py = py;
    tgt.current.rx = rx;
    tgt.current.ry = ry;
  };

  const handleMouseEnter = () => { tgt.current.active = 1; };

  const handleMouseLeave = () => {
    tgt.current.px = 50;
    tgt.current.py = 50;
    tgt.current.rx = 0;
    tgt.current.ry = 0;
    tgt.current.active = 0;
  };

  return (
    <div
      ref={wrapRef}
      className="flex flex-col h-full"
      style={{ perspective: "1000px" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* The card — tilt applied via direct DOM style */}
      <div
        ref={cardRef}
        className="p-8 sm:p-10 bg-white/50 backdrop-blur-xl rounded-2xl flex flex-col relative overflow-hidden h-full min-h-[550px] cursor-pointer border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
        style={{ transformStyle: "preserve-3d", willChange: "transform, box-shadow, border-color" }}
      >
        {/* Base gradient — untouched */}
        <div className={`absolute inset-0 ${plan.bgGradient} -z-10`} />

        {/* Foil shimmer — FeralUI style: repeating-linear-gradient + CSS var position */}
        <div
          ref={foilRef}
          className="absolute inset-0 pointer-events-none rounded-2xl opacity-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at calc(var(--px, 50) * 1%) calc(var(--py, 50) * 1%),
                rgba(255,255,255,0.28), rgba(255,255,255,0) 52%),
              repeating-linear-gradient(
                110deg,
                ${plan.foilTint}44 0%,
                rgba(255,255,255,0.20) 10%,
                ${plan.foilTint}33 20%,
                rgba(186,230,253,0.18) 30%,
                ${plan.foilTint}44 40%,
                rgba(255,255,255,0.16) 50%,
                ${plan.foilTint}33 60%,
                rgba(186,230,253,0.20) 70%,
                ${plan.foilTint}44 80%,
                rgba(255,255,255,0.18) 90%,
                ${plan.foilTint}44 100%
              )
            `,
            backgroundSize: "180% 180%, 300% 300%",
            backgroundPosition: "calc(var(--px, 50) * 1%) calc(var(--py, 50) * 1%), calc(var(--px, 50) * -1.2%) calc(var(--py, 50) * 1%)",
            mixBlendMode: "soft-light",
          } as CSSProperties}
        />

        {/* Specular glint — small radial white dot */}
        <div
          ref={glintRef}
          className="absolute inset-0 pointer-events-none rounded-2xl opacity-0"
          style={{
            backgroundImage: "radial-gradient(circle 80px at 50% 50%, rgba(255,255,255,0.7), transparent 65%)",
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Top rim light — 1px bright edge */}
        <div
          ref={rimRef}
          className="absolute inset-x-6 top-0 h-px pointer-events-none rounded-t-2xl"
          style={{
            opacity: 0.2,
            background: `linear-gradient(90deg, transparent, ${plan.rimColor} 35%, ${plan.rimColor} 65%, transparent)`,
          }}
        />

        {/* Card content */}
        <div className="relative z-10 flex flex-col h-full">
          {plan.isPopular && (
            <div className="absolute top-0 right-0 bg-white/60 backdrop-blur-md border border-white/80 text-primary shadow-sm text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Popular
            </div>
          )}
          <h3 className="font-display text-2xl text-black font-bold mb-2">{plan.name}</h3>
          <div className="font-display text-5xl text-black font-extrabold mb-6 flex items-baseline">
            {plan.price}
            <span className="font-sans text-sm font-medium text-[#555555] ml-1">{plan.period}</span>
          </div>
          <ul className="space-y-4 mb-2 flex-1 font-sans text-sm text-[#555555]">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <span className={`material-symbols-outlined ${plan.checkIconColor} text-lg font-bold`}>check</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function PricingSection() {
  const [isVerified, setIsVerified] = useState(false);

  return (
    <section id="pricing" className="py-24 px-6 sm:px-16 relative">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            className="p-3.5 sm:p-4.5 bg-gradient-to-b from-white/80 via-white/65 to-white/45 backdrop-blur-xl rounded-2xl flex flex-col justify-between relative overflow-hidden h-full min-h-[550px] border-t border-t-white border-b border-b-slate-300/60 border-x border-x-white/70 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)]"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Deep glowing background gradients from context (Features Section) */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF4D24]/20 via-transparent to-[#326578]/10 -z-10 pointer-events-none" />
            <div className="absolute inset-0 overflow-hidden opacity-40 -z-10 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 w-[80%] h-[120%] bg-white/40 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
            </div>

            <ClawMachine onVerify={setIsVerified} />
          </motion.div>

          {PRICING_PLANS.map((plan) => (
            <div key={plan.id} className="contents">
              <HoloCard plan={plan} isVerified={isVerified} />
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
      </div>
    </section>
  );
}
