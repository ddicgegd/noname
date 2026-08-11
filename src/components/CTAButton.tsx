/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";

const GLYPHS = "!@#$%^&*()_+-=[]{}|;:,.<>?/0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

interface TextScrambleProps {
  text: string;
  className?: string;
  scrambleOnHover?: boolean;
}

function TextScramble({ text, className = "", scrambleOnHover = true }: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(text);
  const animFrameIdRef = useRef<number | null>(null);

  const runScramble = () => {
    // Honor prefers-reduced-motion
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mediaQuery.matches) {
        setDisplayText(text);
        return;
      }
    }

    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }

    let startTime: number | null = null;
    const durationPerChar = 40; // ms per character left-to-right lock

    const updateScramble = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;

      let result = "";
      let allSettled = true;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === " ") {
          result += " ";
          continue;
        }

        const lockTime = i * durationPerChar + 160;

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
        animFrameIdRef.current = requestAnimationFrame(updateScramble);
      } else {
        setDisplayText(text);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(updateScramble);
  };

  useEffect(() => {
    runScramble();
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [text]);

  return (
    <span
      aria-label={text}
      onMouseEnter={() => {
        if (scrambleOnHover) runScramble();
      }}
      className={`inline-block font-mono tracking-tight tabular-nums select-none ${className}`}
    >
      <span aria-hidden="true">{displayText}</span>
    </span>
  );
}

interface CTAButtonProps {
  text: string;
  variant?: "primary" | "menu";
  onClick?: () => void;
  id?: string;
}

export default function CTAButton({ text, variant = "primary", onClick, id }: CTAButtonProps) {
  if (variant === "menu") {
    return (
      <button
        id={id}
        onClick={onClick}
        className="group relative overflow-hidden flex items-center border-none bg-transparent cursor-pointer rounded-full p-1.5 gap-2 select-none"
      >
        {/* Dynamic sliding pill background */}
        <span className="absolute top-1.5 bottom-1.5 left-2 w-[calc(100%-8px-8px-38px-8px)] rounded-full bg-white z-0 transition-all duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:w-[calc(100%-12px)]" />

        {/* Text with Scramble effect */}
        <span className="relative z-10 text-[#111111] font-medium text-sm px-10 py-2 whitespace-nowrap">
          <TextScramble text={text} />
        </span>

        {/* Small arrow circle */}
        <span className="relative z-10 flex items-center justify-center w-[38px] height-[38px] h-[38px] rounded-full bg-[#75C5DE] shrink-0 transition-transform duration-300 ease-out group-hover:-translate-x-1">
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

  // Primary variant ("Start a project now") with full entry animation & Text Scramble
  return (
    <motion.button
      id={id}
      onClick={onClick}
      className="group relative overflow-hidden flex items-center border-none bg-transparent cursor-pointer rounded-full p-2 gap-3 select-none"
      initial={{ opacity: 0, y: 60, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: 1.0,
      }}
    >
      {/* Expanding Capsule Background */}
      <span className="absolute top-1.5 bottom-1.5 left-2 w-[calc(100%-8px-8px-48px-12px)] md:w-[calc(100%-8px-8px-54px-12px)] rounded-full bg-white z-0 transition-all duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:w-[calc(100%-16px)]" />

      {/* Button Text with Text Scramble Effect */}
      <span className="relative z-10 text-[#111111] font-medium text-base md:text-lg px-8 md:px-10 py-3 md:py-4 whitespace-nowrap">
        <TextScramble text={text} />
      </span>

      {/* Arrow Circle */}
      <span className="relative z-10 flex items-center justify-center w-12 h-12 md:w-[54px] md:h-[54px] rounded-full bg-[#75C5DE] shrink-0 transition-transform duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:-translate-x-1.5">
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
