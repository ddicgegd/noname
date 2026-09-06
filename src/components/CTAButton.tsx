import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";

const GLYPHS = "!@#$%^&*()_+-=[]{}|;:,.<>?/0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function useScramble(text: string, initialDelay = 1100) {
  const [displayText, setDisplayText] = useState(text);
  const animFrameIdRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const trigger = useCallback(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mediaQuery.matches) {
        setDisplayText(text);
        return;
      }
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (animFrameIdRef.current !== null) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    let startTime: number | null = null;
    const durationPerChar = 22; // ms per character lock

    const update = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;

      let result = "";
      let allSettled = true;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === " ") {
          result += " ";
          continue;
        }

        const lockTime = i * durationPerChar + 80;

        if (elapsed >= lockTime) {
          result += char;
        } else {
          allSettled = false;
          const randomGlyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          result += randomGlyph;
        }
      }

      setDisplayText(result);

      if (!allSettled) {
        animFrameIdRef.current = requestAnimationFrame(update);
      } else {
        setDisplayText(text);
        animFrameIdRef.current = null;
      }
    };

    animFrameIdRef.current = requestAnimationFrame(update);
  }, [text]);

  useEffect(() => {
    // Synchronize initial scramble effect with button entrance delay
    timerRef.current = setTimeout(() => {
      trigger();
    }, initialDelay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [trigger, initialDelay]);

  return { displayText, trigger };
}

interface CTAButtonProps {
  text: string;
  variant?: "primary" | "menu";
  onClick?: () => void;
  id?: string;
}

export default function CTAButton({ text, variant = "primary", onClick, id }: CTAButtonProps) {
  const { displayText, trigger } = useScramble(text, variant === "menu" ? 300 : 1000);

  if (variant === "menu") {
    return (
      <button
        id={id}
        onClick={onClick}
        onMouseEnter={trigger}
        className="group relative overflow-hidden flex items-center border-none bg-transparent cursor-pointer rounded-full p-1.5 gap-2 select-none active:scale-95 transition-transform duration-200"
      >
        {/* Dynamic sliding pill background with 3D Bevel */}
        <span className="absolute top-1.5 bottom-1.5 left-2 w-[calc(100%-8px-8px-38px-8px)] rounded-full bg-gradient-to-b from-white via-[#FCFCFC] to-[#F0F0F0] border-t border-t-white border-b border-b-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.08),inset_0_1.5px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.05)] z-0 transition-all duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:w-[calc(100%-12px)] pointer-events-none" />

        {/* Text Container */}
        <span className="relative z-10 text-[#111111] font-medium text-sm px-10 py-2 whitespace-nowrap inline-flex items-center justify-center select-none">
          <span className="invisible opacity-0 select-none pointer-events-none" aria-hidden="true">
            {text}
          </span>
          <span className="absolute inset-0 flex items-center justify-center" aria-label={text}>
            {displayText}
          </span>
        </span>

        {/* Small arrow circle with 3D Bevel */}
        <span className="relative z-10 flex items-center justify-center w-[38px] h-[38px] rounded-full bg-gradient-to-b from-[#99DEF2] via-[#75C5DE] to-[#54ABC8] border-t border-t-white/90 border-b-2 border-b-[#3B8A9F] shadow-[0_2px_8px_rgba(85,185,215,0.45),inset_0_1.5px_0_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(30,90,110,0.3)] shrink-0 transition-transform duration-300 ease-out group-hover:-translate-x-1">
          <svg
            width="14"
            height="14"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 13L13 5M13 5H6M13 5V12"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
    );
  }

  // Primary variant ("Start a project now") with clean transparent outer container & rich 3D Bevel on white capsule
  return (
    <motion.button
      id={id}
      onClick={onClick}
      onMouseEnter={trigger}
      className="group relative overflow-hidden flex items-center border-none bg-transparent cursor-pointer rounded-full p-2 gap-3 select-none active:scale-95 transition-transform duration-200"
      initial={{ opacity: 0, y: 60, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: 1.0,
      }}
    >
      {/* Expanding Capsule Background with rich 3D Optical Bevel */}
      <span className="absolute top-1.5 bottom-1.5 left-2 w-[calc(100%-8px-8px-48px-12px)] md:w-[calc(100%-8px-8px-54px-12px)] rounded-full bg-gradient-to-b from-white via-[#FCFCFC] to-[#F0F0F0] border-t border-t-white border-b border-b-black/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1.5px_0_rgba(255,255,255,1),inset_0_-1.5px_1.5px_rgba(0,0,0,0.06)] z-0 transition-all duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:w-[calc(100%-16px)] pointer-events-none" />

      {/* Button Text */}
      <span className="relative z-10 text-[#111111] font-medium text-base md:text-lg px-8 md:px-10 py-3 md:py-4 whitespace-nowrap inline-flex items-center justify-center select-none">
        <span className="invisible opacity-0 select-none pointer-events-none" aria-hidden="true">
          {text}
        </span>
        <span className="absolute inset-0 flex items-center justify-center" aria-label={text}>
          {displayText}
        </span>
      </span>

      {/* Arrow Circle with rich 3D Optical Bevel */}
      <span className="relative z-10 flex items-center justify-center w-12 h-12 md:w-[54px] md:h-[54px] rounded-full bg-gradient-to-b from-[#99DEF2] via-[#75C5DE] to-[#54ABC8] border-t border-t-white/90 border-b-2 border-b-[#3B8A9F] shadow-[0_4px_14px_rgba(85,185,215,0.5),inset_0_1.5px_0_rgba(255,255,255,0.95),inset_0_-1.5px_1px_rgba(30,90,110,0.35)] shrink-0 transition-transform duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:-translate-x-1.5 group-hover:shadow-[0_6px_18px_rgba(85,185,215,0.65),inset_0_1.5px_0_rgba(255,255,255,1)]">
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 13L13 5M13 5H6M13 5V12"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </motion.button>
  );
}
