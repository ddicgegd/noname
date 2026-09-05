/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import CTAButton from "./CTAButton";
import { Particles } from "./ui/particles";
import { BlurVignette } from "./ui/blur-vignette";

interface SpotlightSectionProps {
  initialBgText?: string;
  initialIntensity?: number;
  initialFloatRange?: number;
  bgText?: string;
  onBgTextChange?: (text: string) => void;
}

export default function SpotlightSection({
  initialBgText = "Samsung",
  initialIntensity = 100,
  initialFloatRange = 10,
  bgText: propBgText,
  onBgTextChange
}: SpotlightSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Dynamic settings state (Soft-config)
  const [internalBgText, setInternalBgText] = useState(initialBgText);
  const [intensity, setIntensity] = useState(initialIntensity);
  const [floatRange, setFloatRange] = useState(initialFloatRange);
  const [showConfig, setShowConfig] = useState(false);
  
  // Controlled vs Uncontrolled state mapping
  const bgText = propBgText !== undefined ? propBgText : internalBgText;
  const setBgText = (newVal: string) => {
    setInternalBgText(newVal);
    onBgTextChange?.(newVal);
  };
  
  // High performance MotionValues & Springs for text parallax (bypasses React state loop for 120fps fluid movement)
  const xValue = useMotionValue(0);
  const yValue = useMotionValue(0);
  
  // A tuned organic spring configuration (medium stiffness, custom damping for pleasant rebound feeling)
  const springX = useSpring(xValue, { stiffness: 65, damping: 22, mass: 0.9 });
  const springY = useSpring(yValue, { stiffness: 65, damping: 22, mass: 0.9 });
  
  // Refs for tracking dynamic configuration values inside the RAF loop and event handlers without closure lag
  const intensityRef = useRef(intensity);
  const floatRangeRef = useRef(floatRange);

  useEffect(() => {
    intensityRef.current = intensity;
    
    // Immediately update displacement when slider value changes even if mouse is still
    if (containerRef.current && targetMouseRef.current.x !== -999) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const ndx = (targetMouseRef.current.x - centerX) / (centerX || 1);
      const ndy = (targetMouseRef.current.y - centerY) / (centerY || 1);
      
      const maxDisplacementX = -45 * (intensity / 100);
      const maxDisplacementY = -18 * (intensity / 100);
      
      xValue.set(ndx * maxDisplacementX);
      yValue.set(ndy * maxDisplacementY);
    }
  }, [intensity]);

  useEffect(() => {
    floatRangeRef.current = floatRange;
  }, [floatRange]);

  // Track target and lerped coordinates
  const targetMouseRef = useRef({ x: -999, y: -999 });
  const smoothMouseRef = useRef({ x: -999, y: -999 });
  
  const [smoothCoords, setSmoothCoords] = useState({ x: -999, y: -999 });
  const [spotlightRadius, setSpotlightRadius] = useState(260);

  // Responsive spotlight radius adjustments
  useEffect(() => {
    const handleResize = () => {
      setSpotlightRadius(window.innerWidth < 768 ? 160 : 260);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Map viewport coordinates to element relative coordinates
  const updateTargetCoords = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    
    targetMouseRef.current = {
      x: mouseX,
      y: mouseY,
    };
    
    // On the first hover or interaction, initialize the smooth coordinates instantly to avoid a slow glide from (-999, -999)
    if (smoothMouseRef.current.x === -999) {
      smoothMouseRef.current = { ...targetMouseRef.current };
      setSmoothCoords({ ...targetMouseRef.current });
    }

    // High performance parallax calculation relative to center of the section
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Normalize coordinates relative to center (-1 to 1)
    const ndx = (mouseX - centerX) / (centerX || 1);
    const ndy = (mouseY - centerY) / (centerY || 1);

    // Apply scale multiplier with negative value to create physical depth parallax (background moves opposite to cursor)
    const maxDisplacementX = -45 * (intensityRef.current / 100);
    const maxDisplacementY = -18 * (intensityRef.current / 100);

    xValue.set(ndx * maxDisplacementX);
    yValue.set(ndy * maxDisplacementY);
  };

  useEffect(() => {
    // Default initial spotlight to the center of the viewport
    const initCenter = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const initialX = rect.width / 2;
        const initialY = rect.height / 2;
        targetMouseRef.current = { x: initialX, y: initialY };
        smoothMouseRef.current = { x: initialX, y: initialY };
        setSmoothCoords({ x: initialX, y: initialY });
      }
    };

    // Delay initialization slightly to let the page layout settle
    const initTimer = setTimeout(initCenter, 100);

    const handleMouseMove = (e: MouseEvent) => {
      updateTargetCoords(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updateTargetCoords(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updateTargetCoords(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });

    // Smooth LERP loop
    let animationFrameId: number;
    const loop = () => {
      const target = targetMouseRef.current;
      const smooth = smoothMouseRef.current;

      if (target.x !== -999 && smooth.x !== -999) {
        const dx = target.x - smooth.x;
        const dy = target.y - smooth.y;

        // Apply a gentle lerp lag (0.1 rate)
        const vx = dx * 0.1;
        const vy = dy * 0.1;

        if (Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05) {
          smoothMouseRef.current = {
            x: smooth.x + vx,
            y: smooth.y + vy,
          };
          setSmoothCoords({ ...smoothMouseRef.current });
        }
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      clearTimeout(initTimer);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchstart", handleTouchStart);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Split headline text for staged word reveal
  const headlineText = "I build compelling visual stories & motion that make ideas shine.";
  const words = headlineText.split(" ");

  // Custom css mask styles mapped to local coordinates
  const maskStyle = {
    WebkitMaskImage: `radial-gradient(circle ${spotlightRadius}px at ${smoothCoords.x}px ${smoothCoords.y}px, black 0%, black 40%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.12) 88%, transparent 100%)`,
    maskImage: `radial-gradient(circle ${spotlightRadius}px at ${smoothCoords.x}px ${smoothCoords.y}px, black 0%, black 40%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.12) 88%, transparent 100%)`,
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
  };

  return (
    <main
      ref={containerRef}
      className="hero relative w-full overflow-hidden bg-[#E4E4E4] min-height-screen h-screen min-h-[600px] md:min-h-[800px] select-none"
    >
      {/* Top-left Blue Glow Ambient Overlay */}
      <div 
        className="absolute top-0 left-0 w-[65vw] h-[65vw] max-w-[1000px] max-h-[1000px] rounded-full bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#60A5FA] opacity-40 blur-[130px] -translate-x-1/4 -translate-y-1/4 pointer-events-none select-none"
        style={{ zIndex: 1 }}
      />

      {/* Floating Magic Particles Layer */}
      <Particles
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 5 }}
        quantity={90}
        ease={80}
        color="#000000"
        refresh
      />

      {/* Base background layer with Blur Vignette and Video */}
      <BlurVignette
        radius="0px"
        inset="0px"
        transitionLength="160px"
        blur="20px"
        className="absolute top-[30vh] md:top-0 left-0 right-0 bottom-0 z-20 pointer-events-none"
      >
        {/* Background Video from context */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        >
          <source
            src="https://cdn.pixabay.com/video/2023/10/19/185726-876210695_large.mp4"
            type="video/mp4"
          />
        </video>

        {/* Base background image layer */}
        <motion.div
          className="hero-base-img absolute inset-0 bg-cover bg-no-repeat bg-[position:60%_center] md:bg-center mix-blend-multiply"
          style={{
            backgroundImage: `url('https://soft-zoom-63098134.figma.site/_assets/v11/5c9f982199fde1d9b85a20e5396f0fa7bacaf9a3.png?w=2560')`,
          }}
          initial={{ opacity: 0, scale: 1.5, rotate: 3 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{
            duration: 1.2,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 1.0,
          }}
        />

        {/* Reveal spotlight background image layer */}
        <div
          id="reveal-img"
          className="hero-reveal-img absolute inset-0 bg-cover bg-no-repeat bg-[position:60%_center] md:bg-center transition-opacity duration-300"
          style={{
            backgroundImage: `url('https://soft-zoom-63098134.figma.site/_assets/v11/6be2165e31648955b4e071f4cf2a50bc572b9bfd.png?w=1536')`,
            ...maskStyle,
          }}
        />
      </BlurVignette>

      {/* Foreground Interactive Content */}
      <div className="hero-content relative z-30 flex flex-col justify-start items-start w-full max-w-[1600px] mx-auto px-4 py-28 md:p-10 md:pt-40 md:pb-24 pointer-events-none h-full md:justify-between">
        <div className="hero-content-inner flex flex-col items-start gap-8 w-full pointer-events-auto">
          {/* Animated Headline */}
          <h1 id="headline" className="hero-headline text-2xl md:text-3xl font-medium leading-snug tracking-tight text-[#111111] max-w-[447px] select-text">
            {words.map((word, i) => (
              <motion.span
                key={`${word}-${i}`}
                className="inline-block mr-[0.3em] origin-bottom"
                initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.4,
                  ease: "easeOut",
                  delay: 1.0 + i * 0.05,
                }}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          {/* Action CTA Button */}
          <CTAButton text="Start a project now" id="main-cta" />
        </div>
      </div>
    </main>
  );
}
