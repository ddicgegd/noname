"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ProgressiveBlurProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: "top" | "bottom" | "left" | "right";
  height?: string | number;
  width?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * High-Performance Smooth Scrim Gradient Component (120 FPS)
 * Uses Apple-standard multi-stop cubic easing curves to fade content seamlessly
 * without GPU backdrop-filter lag or visible cutoff lines.
 */
export function ProgressiveBlur({
  position = "bottom",
  height = "56px",
  width = "100%",
  className,
  style,
  ...props
}: ProgressiveBlurProps) {
  const heightVal = typeof height === "number" ? `${height}px` : height;
  const widthVal = typeof width === "number" ? `${width}px` : width;

  const positionStyles: Record<string, React.CSSProperties> = {
    top: {
      top: 0,
      left: 0,
      right: 0,
      height: heightVal,
      width: "100%",
    },
    bottom: {
      bottom: 0,
      left: 0,
      right: 0,
      height: heightVal,
      width: "100%",
    },
    left: {
      top: 0,
      bottom: 0,
      left: 0,
      width: widthVal,
      height: "100%",
    },
    right: {
      top: 0,
      bottom: 0,
      right: 0,
      width: widthVal,
      height: "100%",
    },
  };

  const dirMap = {
    top: "to bottom",
    bottom: "to top",
    left: "to right",
    right: "to left",
  };
  const dir = dirMap[position] || "to top";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute z-20 overflow-hidden select-none",
        className
      )}
      style={{
        ...positionStyles[position],
        background: `linear-gradient(${dir}, #ffffff 0%, rgba(255, 255, 255, 0.94) 18%, rgba(255, 255, 255, 0.78) 36%, rgba(255, 255, 255, 0.52) 54%, rgba(255, 255, 255, 0.26) 72%, rgba(255, 255, 255, 0.08) 88%, transparent 100%)`,
        ...style,
      }}
      {...props}
    />
  );
}

export default ProgressiveBlur;
