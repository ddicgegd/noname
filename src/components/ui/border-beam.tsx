import React, { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({
  className,
  size = 180,
  duration = 7,
  borderWidth = 2,
  colorFrom = "#38BDF8",
  colorTo = "#0284c7",
  delay = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    
    // Initial measurement
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setDimensions({ width: rect.width, height: rect.height });
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { width, height } = dimensions;
  const radius = 16;
  // Approximate perimeter of rounded rectangle
  const perimeter = 2 * (width + height) - 8 * radius + 2 * Math.PI * radius;
  const beamLength = size;
  const safeId = `beam-${colorFrom.replace(/[^a-zA-Z0-9]/g, "")}-${colorTo.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div
      ref={containerRef}
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden",
        className
      )}
    >
      {width > 0 && height > 0 && (
        <svg
          className="absolute inset-0 size-full"
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`grad-${safeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colorFrom} stopOpacity="1" />
              <stop offset="40%" stopColor={colorTo} stopOpacity="0.9" />
              <stop offset="85%" stopColor={colorTo} stopOpacity="0.2" />
              <stop offset="100%" stopColor={colorTo} stopOpacity="0" />
            </linearGradient>
            <filter id={`glow-${safeId}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Soft Glow */}
          <motion.rect
            x={borderWidth / 2}
            y={borderWidth / 2}
            width={Math.max(0, width - borderWidth)}
            height={Math.max(0, height - borderWidth)}
            rx={radius}
            ry={radius}
            fill="none"
            stroke={`url(#grad-${safeId})`}
            strokeWidth={borderWidth * 2.2}
            strokeLinecap="round"
            filter={`url(#glow-${safeId})`}
            strokeDasharray={`${beamLength} ${Math.max(0, perimeter - beamLength)}`}
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: -perimeter }}
            transition={{
              repeat: Infinity,
              ease: "linear",
              duration: duration,
              delay: delay,
            }}
          />

          {/* Crisp Inner Core Light */}
          <motion.rect
            x={borderWidth / 2}
            y={borderWidth / 2}
            width={Math.max(0, width - borderWidth)}
            height={Math.max(0, height - borderWidth)}
            rx={radius}
            ry={radius}
            fill="none"
            stroke={`url(#grad-${safeId})`}
            strokeWidth={borderWidth}
            strokeLinecap="round"
            strokeDasharray={`${beamLength} ${Math.max(0, perimeter - beamLength)}`}
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: -perimeter }}
            transition={{
              repeat: Infinity,
              ease: "linear",
              duration: duration,
              delay: delay,
            }}
          />
        </svg>
      )}
    </div>
  );
};

export default BorderBeam;
