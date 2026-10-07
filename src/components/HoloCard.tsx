/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, type MouseEvent, type CSSProperties } from "react";
import { type PricingPlan } from "./HoloCardPaymentSheet";

export interface HoloCardProps {
  plan: PricingPlan;
  isVerified?: boolean;
  onSelect?: (plan: PricingPlan) => void;
  compact?: boolean;
  hideButton?: boolean;
  overridePrice?: string;
  overridePeriod?: string;
  className?: string;
}

export function HoloCard({
  plan,
  isVerified = false,
  onSelect,
  compact = false,
  hideButton = false,
  overridePrice,
  overridePeriod,
  className,
}: HoloCardProps) {
  const wrapRef = useRef<HTMLDivElement>(null); // perspective wrapper
  const cardRef = useRef<HTMLDivElement>(null); // tilting card
  const foilRef = useRef<HTMLDivElement>(null); // foil overlay
  const glintRef = useRef<HTMLDivElement>(null); // specular dot
  const rimRef = useRef<HTMLDivElement>(null); // top rim

  // Animation state — direct DOM manipulation for 60fps performance
  const raf = useRef<number>(0);
  const cur = useRef({ px: 50, py: 50, rx: 0, ry: 0, active: 0 });
  const tgt = useRef({ px: 50, py: 50, rx: 0, ry: 0, active: 0 });
  const startTime = useRef(Date.now() + Math.random() * 6000); // stagger per card

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  useEffect(() => {
    const card = cardRef.current;
    const foil = foilRef.current;
    const glint = glintRef.current;
    const rim = rimRef.current;
    const wrap = wrapRef.current;
    if (!card || !foil || !glint || !rim || !wrap) return;

    const tick = () => {
      const c = cur.current;
      const t = tgt.current;
      const lf = 0.12;

      c.px = lerp(c.px, t.px, lf);
      c.py = lerp(c.py, t.py, lf);
      c.rx = lerp(c.rx, t.rx, lf);
      c.ry = lerp(c.ry, t.ry, lf);
      c.active = lerp(c.active, t.active, lf * 0.8);

      const a = c.active;

      // --- Idle float: gentle sine/cosine bob when not hovered ---
      const elapsed = (Date.now() - startTime.current) / 1000;
      const idleY = Math.sin(elapsed * 0.748) * (compact ? 3 : 6);
      const idleRx = Math.sin(elapsed * 0.633) * (compact ? 1.5 : 2.5);
      const idleRy = Math.cos(elapsed * 0.483) * (compact ? 1.2 : 2.0);
      const idleBlend = 1 - a;
      const finalY = idleY * idleBlend;
      const finalRx = c.rx + idleRx * idleBlend;
      const finalRy = c.ry + idleRy * idleBlend;

      // --- Card tilt + float ---
      card.style.transform = `translateY(${finalY.toFixed(2)}px) rotateX(${finalRx.toFixed(2)}deg) rotateY(${finalRy.toFixed(2)}deg)`;

      // --- Sheen position ---
      const idlePx = 50 + Math.cos(elapsed * 0.483) * 38;
      const idlePy = 50 + Math.sin(elapsed * 0.748) * 32;
      const effectPx = lerp(idlePx, c.px, a);
      const effectPy = lerp(idlePy, c.py, a);

      // --- Foil shimmer ---
      foil.style.setProperty("--px", effectPx.toFixed(2));
      foil.style.setProperty("--py", effectPy.toFixed(2));
      foil.style.opacity = lerp(0.48, 0.88, a).toFixed(3);
      foil.style.filter = `saturate(1.2) hue-rotate(calc((${effectPx.toFixed(2)} - 50) * 1.4deg))`;
      // --- Specular glint ---
      glint.style.backgroundPosition = `${effectPx.toFixed(1)}% ${effectPy.toFixed(1)}%`;
      glint.style.opacity = lerp(0.06, 0.187, a).toFixed(3);

      // --- Rim light ---
      rim.style.opacity = (0.2 + a * 0.55).toFixed(3);

      // --- Shadows & Borders ---
      if (a > 0.02) {
        card.style.boxShadow = `${plan.glowColor} 0px ${lerp(20, 36, a).toFixed(0)}px ${lerp(30, 48, a).toFixed(0)}px -8px, rgba(0,0,0,0.06) 0px 4px 16px`;
        card.style.borderColor = plan.hoverBorderColor;
      } else {
        card.style.borderColor = defaultBorderColor;
      }
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [plan, compact]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    tgt.current.px = nx * 100;
    tgt.current.py = ny * 100;

    const maxTilt = compact ? 8 : 12;
    tgt.current.rx = (0.5 - ny) * (maxTilt * 2);
    tgt.current.ry = (nx - 0.5) * (maxTilt * 2);
  };

  const handleMouseEnter = () => {
    tgt.current.active = 1;
  };

  const handleMouseLeave = () => {
    tgt.current.px = 50;
    tgt.current.py = 50;
    tgt.current.rx = 0;
    tgt.current.ry = 0;
    tgt.current.active = 0;
  };
  const currentPrice = overridePrice ?? plan.price;
  const currentPeriod = overridePeriod ?? plan.period;
  const defaultBorderColor =
    plan.id === "free" ? "rgba(56, 189, 248, 0.35)" : "rgba(192, 132, 252, 0.4)";
  return (
    <div
      ref={wrapRef}
      className={`flex flex-col h-full ${className ?? ""}`}
      style={{ perspective: "1000px" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* The card — tilt applied via direct DOM style */}
      <div
        ref={cardRef}
        onClick={() => onSelect?.(plan)}
        className={`${
          compact ? "p-5 sm:p-6 min-h-[380px]" : "p-8 sm:p-10 min-h-[550px]"
        } bg-white/50 dark:bg-neutral-900/40 backdrop-blur-xl rounded-2xl flex flex-col relative overflow-hidden h-full ${
          onSelect ? "cursor-pointer" : ""
        } border shadow-[0_8px_32px_rgba(0,0,0,0.04)]`}
        style={{
          transformStyle: "preserve-3d",
          borderColor: defaultBorderColor,
          willChange: "transform, box-shadow, border-color",
        }}
      >
        {/* Ambient Tinted Background (Always visible by default at idle) */}
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            background:
              plan.id === "free"
                ? "radial-gradient(circle at 80% 20%, rgba(56, 189, 248, 0.22) 0%, rgba(56, 189, 248, 0.08) 50%, transparent 80%)"
                : "radial-gradient(circle at 80% 20%, rgba(192, 132, 252, 0.28) 0%, rgba(255, 154, 158, 0.15) 50%, transparent 80%)",
          }}
          aria-hidden="true"
        />

        {/* Ambient Corner Orb Glow */}
        <div
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-2xl pointer-events-none"
          style={{
            backgroundColor: plan.foilTint,
            opacity: compact ? 0.32 : 0.22,
          }}
          aria-hidden="true"
        />
        {/* Foil shimmer — repeating-linear-gradient + CSS var position */}
        <div
          ref={foilRef}
          className="absolute inset-0 pointer-events-none rounded-2xl opacity-0"
          style={
            {
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
              backgroundPosition:
                "calc(var(--px, 50) * 1%) calc(var(--py, 50) * 1%), calc(var(--px, 50) * -1.2%) calc(var(--py, 50) * 1%)",
              mixBlendMode: "soft-light",
            } as CSSProperties
          }
        />

        {/* Specular glint — small radial white dot */}
        <div
          ref={glintRef}
          className="absolute inset-0 pointer-events-none rounded-2xl opacity-0"
          style={{
            backgroundImage:
              "radial-gradient(circle 80px at 50% 50%, rgba(255,255,255,0.7), transparent 65%)",
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
            <div className="absolute top-0 right-0 bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/80 dark:border-white/20 text-primary shadow-xs text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Popular
            </div>
          )}
          <h3 className={`font-display ${compact ? "text-xl mb-1" : "text-2xl mb-2"} text-black dark:text-white font-bold`}>
            {plan.name}
          </h3>
          <div className={`font-display ${compact ? "text-3xl mb-4" : "text-5xl mb-6"} text-black dark:text-white font-extrabold flex items-baseline tracking-tight`}>
            {currentPrice}
            <span className="font-sans text-xs sm:text-sm font-medium text-[#555555] dark:text-neutral-400 ml-1">
              {currentPeriod}
            </span>
          </div>

          <ul className={`space-y-3 mb-2 flex-1 font-sans text-xs sm:text-sm text-[#555555] dark:text-neutral-300`}>
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2.5">
                <span className={`material-symbols-outlined ${plan.checkIconColor} text-base sm:text-lg font-bold shrink-0`}>
                  check
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {!hideButton && (
            <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/10">
              <button
                type="button"
                className={plan.buttonClass}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(plan);
                }}
              >
                {plan.buttonText}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default HoloCard;
