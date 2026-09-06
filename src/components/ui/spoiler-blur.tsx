import React, { useEffect, useRef } from "react";

interface SpoilerBlurProps {
  children: React.ReactNode;
  className?: string;
  blurAmount?: number;
  particleDensity?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
  twinkleSpeed: number;
  type: "sparkle" | "circle";
}

export const SpoilerBlur: React.FC<SpoilerBlurProps> = ({
  children,
  className = "",
  blurAmount = 10,
  particleDensity = 65,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const particles = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 180);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 180);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Cosmic stardust particles - Monochromatic soft white, drifting slowly like in outer space
    particles.current = Array.from({ length: particleDensity }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.08, // Slow space drift
      vy: (Math.random() - 0.5) * 0.08,
      size: Math.random() * 1.6 + 0.6,
      alpha: Math.random() * 0.5 + 0.15, // Faint and soft
      phase: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.015 + 0.005, // Gentle space breathing
      type: Math.random() > 0.75 ? "sparkle" : "circle",
    }));

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.015;

      for (let i = 0; i < particles.current.length; i++) {
        const p = particles.current[i];

        // Cosmic zero-gravity drift
        p.x += p.vx;
        p.y += p.vy;

        // Wrap boundaries seamlessly
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Soft sinusoidal twinkle
        const dynamicAlpha = (Math.sin(time * 1.5 + p.phase) * 0.35 + 0.65) * p.alpha;

        ctx.fillStyle = "rgb(255, 255, 255)";
        ctx.globalAlpha = dynamicAlpha;

        if (p.type === "sparkle") {
          // Soft 4-pointed Star
          const r = p.size * 1.4;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - r);
          ctx.quadraticCurveTo(p.x, p.y, p.x + r, p.y);
          ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + r);
          ctx.quadraticCurveTo(p.x, p.y, p.x - r, p.y);
          ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - r);
          ctx.fill();
        } else {
          // Soft Circular Stardust Spot
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || 180;
      height = canvas.height = canvas.parentElement?.clientHeight || 180;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [particleDensity]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none pointer-events-none ${className}`}
    >
      {/* 1. Underlying Content Layer with Soft Gaussian Blur */}
      <div
        style={{
          filter: `blur(${blurAmount}px) saturate(130%) brightness(1.02)`,
          transform: "scale(1.08)", // Slight upscale to prevent edge bleed
        }}
        className="w-full h-full pointer-events-none"
      >
        {children}
      </div>

      {/* 2. Ambient Monochromatic Space Dust Overlay */}
      <div className="absolute inset-0 z-10 bg-white/10 backdrop-blur-[1px] pointer-events-none">
        {/* Slow drifting stardust canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      </div>
    </div>
  );
};
