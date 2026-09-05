"use client";

import * as React from "react";
import { motion, HTMLMotionProps, useMotionValue, useSpring, useTransform, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface LiquidGlassCardProps extends HTMLMotionProps<"div"> {
  glowIntensity?: "none" | "sm" | "md" | "lg" | "xl";
  shadowIntensity?: "none" | "sm" | "md" | "lg";
  blurIntensity?: "none" | "sm" | "md" | "lg" | "xl";
  borderRadius?: string | number;
  draggable?: boolean;
  interactive?: boolean;
}

const blurMap: Record<string, string> = {
  none: "backdrop-blur-none",
  sm: "backdrop-blur-md",
  md: "backdrop-blur-xl",
  lg: "backdrop-blur-2xl",
  xl: "backdrop-blur-3xl",
};

const glowMap: Record<string, string> = {
  none: "",
  sm: "shadow-[0_4px_24px_rgba(255,255,255,0.2),0_0_12px_rgba(255,77,36,0.06)]",
  md: "shadow-[0_8px_32px_rgba(255,255,255,0.35),0_0_20px_rgba(255,77,36,0.12)]",
  lg: "shadow-[0_12px_45px_rgba(255,255,255,0.5),0_0_32px_rgba(255,77,36,0.18)]",
  xl: "shadow-[0_16px_60px_rgba(255,255,255,0.65),0_0_45px_rgba(255,77,36,0.25)]",
};

const shadowMap: Record<string, string> = {
  none: "",
  sm: "shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.03)]",
  md: "shadow-[0_20px_45px_-10px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.05)]",
  lg: "shadow-[0_28px_60px_-12px_rgba(0,0,0,0.15),0_8px_24px_rgba(0,0,0,0.08)]",
};

export const LiquidGlassCard = React.forwardRef<HTMLDivElement, LiquidGlassCardProps>(
  (
    {
      children,
      className,
      glowIntensity = "md",
      shadowIntensity = "md",
      blurIntensity = "lg",
      borderRadius = "16px",
      draggable = false,
      interactive = true,
      style,
      onMouseMove,
      onMouseLeave,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const containerRef = React.useRef<HTMLDivElement | null>(null);

    // Mouse coordinates relative to card for interactive liquid spotlight
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);

    const smoothMouseX = useSpring(mouseX, { stiffness: 180, damping: 24, mass: 0.5 });
    const smoothMouseY = useSpring(mouseY, { stiffness: 180, damping: 24, mass: 0.5 });

    const spotlightX = useTransform(smoothMouseX, (v) => `${v * 100}%`);
    const spotlightY = useTransform(smoothMouseY, (v) => `${v * 100}%`);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (interactive && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        mouseX.set(x);
        mouseY.set(y);
      }
      if (onMouseMove) onMouseMove(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      mouseX.set(0.5);
      mouseY.set(0.5);
      if (onMouseLeave) onMouseLeave(e);
    };

    const parsedRadius = typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius;

    return (
      <motion.div
        ref={(node) => {
          containerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        drag={draggable}
        dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
        dragElastic={0.1}
        whileDrag={{ scale: 1.02, cursor: "grabbing" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "group relative border border-white/70 bg-gradient-to-b from-white/65 via-white/45 to-white/35 text-card-foreground",
          "shadow-[inset_0_1.5px_0_0_rgba(255,255,255,0.95),inset_0_-1px_0_0_rgba(255,255,255,0.4),inset_0_0_20px_rgba(255,255,255,0.2)]",
          blurMap[blurIntensity] || blurMap.lg,
          glowMap[glowIntensity] || glowMap.md,
          shadowMap[shadowIntensity] || shadowMap.md,
          draggable && "cursor-grab active:cursor-grabbing",
          className
        )}
        style={{
          borderRadius: parsedRadius,
          ...style,
        }}
        {...props}
      >
        {/* LIQUID GLASS SURFACE & REFRACTION LAYERS (Safely clipped to radius without clipping dropdown menus) */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ borderRadius: parsedRadius }}
          aria-hidden="true"
        >
          {/* 1. Prismatic Lens Specular Curvature (Top gloss highlight) */}
          <div className="absolute inset-x-0 top-0 h-[48%] bg-gradient-to-b from-white/45 via-white/15 to-transparent" />

          {/* 2. Interactive Fluid Spotlight Caustic that tracks cursor */}
          {interactive && !prefersReducedMotion && (
            <motion.div
              className="absolute -inset-10 opacity-70 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background: useTransform(
                  [spotlightX, spotlightY],
                  ([x, y]) =>
                    `radial-gradient(400px circle at ${x} ${y}, rgba(255, 255, 255, 0.5) 0%, rgba(255, 215, 180, 0.15) 30%, rgba(180, 230, 255, 0.1) 55%, transparent 70%)`
                ),
              }}
            />
          )}

          {/* 3. Floating Organic Fluid Blobs (Liquid Undulation) */}
          {!prefersReducedMotion && (
            <>
              {/* Liquid Blob A (Peach / Golden Glow) */}
              <motion.div
                animate={{
                  x: ["-20%", "30%", "-10%", "-20%"],
                  y: ["-10%", "20%", "-20%", "-10%"],
                  scale: [1, 1.25, 0.9, 1],
                  opacity: [0.35, 0.6, 0.4, 0.35],
                }}
                transition={{
                  duration: 9,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -top-16 -left-16 h-48 w-56 rounded-full bg-gradient-to-tr from-amber-300/30 via-[#FF4D24]/20 to-transparent blur-2xl"
              />

              {/* Liquid Blob B (Cyan / Crystal Sky Blue) */}
              <motion.div
                animate={{
                  x: ["20%", "-25%", "15%", "20%"],
                  y: ["20%", "-15%", "10%", "20%"],
                  scale: [0.95, 1.3, 1.05, 0.95],
                  opacity: [0.3, 0.55, 0.35, 0.3],
                }}
                transition={{
                  duration: 11,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute -bottom-16 -right-16 h-52 w-60 rounded-full bg-gradient-to-bl from-cyan-400/25 via-blue-400/15 to-transparent blur-2xl"
              />

              {/* 4. Diagonal Sweeping Liquid Shimmer Caustic Wave */}
              <motion.div
                animate={{
                  x: ["-150%", "250%"],
                }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  repeatDelay: 2.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="absolute inset-y-0 w-32 -skew-x-25 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-80"
              />
            </>
          )}

          {/* 5. Rim Spectral Aberration Line */}
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 via-white/50 via-[#FF4D24]/20 to-transparent opacity-60" />
        </div>

        {/* Content Container */}
        {children}
      </motion.div>
    );
  }
);

LiquidGlassCard.displayName = "LiquidGlassCard";
