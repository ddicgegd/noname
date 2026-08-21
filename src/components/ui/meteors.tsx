import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface MeteorsProps {
  number?: number;
  className?: string;
  minDelay?: number;
  maxDelay?: number;
  minDuration?: number;
  maxDuration?: number;
  angle?: number;
}

export const Meteors: React.FC<MeteorsProps> = ({
  number = 25,
  className,
  minDelay = 0.2,
  maxDelay = 1.5,
  minDuration = 3,
  maxDuration = 8,
  angle = 215,
}) => {
  const [meteorStyles, setMeteorStyles] = useState<Array<React.CSSProperties>>([]);

  useEffect(() => {
    const styles = [...new Array(number)].map(() => ({
      top: -20,
      left: Math.floor(Math.random() * (typeof window !== "undefined" ? window.innerWidth + 400 : 1600) - 200) + "px",
      animationDelay: (Math.random() * (maxDelay - minDelay) + minDelay).toFixed(2) + "s",
      animationDuration: (Math.random() * (maxDuration - minDuration) + minDuration).toFixed(2) + "s",
    }));
    setMeteorStyles(styles);
  }, [number, minDelay, maxDelay, minDuration, maxDuration]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes meteorAnimation {
          0% {
            transform: rotate(${angle}deg) translateX(0);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: rotate(${angle}deg) translateX(-800px);
            opacity: 0;
          }
        }
        .meteor-tail {
          animation: meteorAnimation 5s linear infinite;
        }
      `}</style>
      {meteorStyles.map((style, idx) => (
        <span
          key={idx}
          style={{ ...style }}
          className={cn(
            "pointer-events-none absolute size-0.5 rounded-full bg-slate-400 shadow-[0_0_0_1px_#ffffff10] meteor-tail",
            className
          )}
        >
          {/* Meteor Tail Trail */}
          <div className="pointer-events-none absolute top-1/2 -z-10 h-px w-[60px] -translate-y-1/2 bg-gradient-to-r from-slate-400 via-slate-400/40 to-transparent" />
        </span>
      ))}
    </div>
  );
};

export default Meteors;
