import React from "react";
import { cn } from "@/lib/utils";

export interface BlurVignetteProps extends React.HTMLAttributes<HTMLDivElement> {
  radius?: string;
  inset?: string;
  transitionLength?: string;
  blur?: string;
  useBackdropFilter?: boolean;
  classname?: string;
  className?: string;
  blurclassname?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * BlurVignette Component (Apple Vision Pro inspired)
 * Uses 4-directional progressive scrims and radial vignette shading
 * for a smooth, high-fidelity lens blur / vignette effect.
 */
export function BlurVignette({
  radius = "24px",
  inset = "0px",
  transitionLength = "120px",
  blur = "16px",
  useBackdropFilter = false,
  classname,
  className,
  blurclassname,
  children,
  style,
  ...props
}: BlurVignetteProps) {
  return (
    <div
      className={cn("relative overflow-hidden", classname, className)}
      style={{
        borderRadius: radius,
        ...style,
      }}
      {...props}
    >
      {children}

      {/* 4-Directional Progressive Scrims */}
      {useBackdropFilter ? (
        <>
          {/* Top Scrim */}
          <div
            className={cn(
              "pointer-events-none absolute left-0 right-0 top-0 z-20",
              blurclassname
            )}
            style={{
              top: inset,
              left: inset,
              right: inset,
              height: transitionLength,
              backdropFilter: `blur(${blur})`,
              WebkitBackdropFilter: `blur(${blur})`,
              maskImage: "linear-gradient(to bottom, black 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
            }}
          />

          {/* Bottom Scrim */}
          <div
            className={cn(
              "pointer-events-none absolute bottom-0 left-0 right-0 z-20",
              blurclassname
            )}
            style={{
              bottom: inset,
              left: inset,
              right: inset,
              height: transitionLength,
              backdropFilter: `blur(${blur})`,
              WebkitBackdropFilter: `blur(${blur})`,
              maskImage: "linear-gradient(to top, black 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to top, black 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
            }}
          />

          {/* Left Scrim */}
          <div
            className={cn(
              "pointer-events-none absolute bottom-0 left-0 top-0 z-20",
              blurclassname
            )}
            style={{
              top: inset,
              bottom: inset,
              left: inset,
              width: transitionLength,
              backdropFilter: `blur(${blur})`,
              WebkitBackdropFilter: `blur(${blur})`,
              maskImage: "linear-gradient(to right, black 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to right, black 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
            }}
          />

          {/* Right Scrim */}
          <div
            className={cn(
              "pointer-events-none absolute bottom-0 right-0 top-0 z-20",
              blurclassname
            )}
            style={{
              top: inset,
              bottom: inset,
              right: inset,
              width: transitionLength,
              backdropFilter: `blur(${blur})`,
              WebkitBackdropFilter: `blur(${blur})`,
              maskImage: "linear-gradient(to left, black 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to left, black 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
            }}
          />
        </>
      ) : (
        <>
          {/* Top Feathered Gradient Scrim */}
          <div
            className={cn(
              "pointer-events-none absolute left-0 right-0 top-0 z-20",
              blurclassname
            )}
            style={{
              top: inset,
              left: inset,
              right: inset,
              height: transitionLength,
              background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.12) 50%, transparent 100%)",
            }}
          />

          {/* Bottom Feathered Gradient Scrim */}
          <div
            className={cn(
              "pointer-events-none absolute bottom-0 left-0 right-0 z-20",
              blurclassname
            )}
            style={{
              bottom: inset,
              left: inset,
              right: inset,
              height: transitionLength,
              background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.12) 50%, transparent 100%)",
            }}
          />

          {/* Left Feathered Gradient Scrim */}
          <div
            className={cn(
              "pointer-events-none absolute bottom-0 left-0 top-0 z-20",
              blurclassname
            )}
            style={{
              top: inset,
              bottom: inset,
              left: inset,
              width: transitionLength,
              background: "linear-gradient(to right, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.12) 50%, transparent 100%)",
            }}
          />

          {/* Right Feathered Gradient Scrim */}
          <div
            className={cn(
              "pointer-events-none absolute bottom-0 right-0 top-0 z-20",
              blurclassname
            )}
            style={{
              top: inset,
              bottom: inset,
              right: inset,
              width: transitionLength,
              background: "linear-gradient(to left, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.12) 50%, transparent 100%)",
            }}
          />
        </>
      )}

      {/* Radial Vignette Darkening / Shading Layer */}
      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          borderRadius: radius,
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.18) 75%, rgba(0,0,0,0.45) 100%)`,
        }}
      />
    </div>
  );
}

export function BlurVignetteArticle({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("relative z-30", className)}>{children}</div>;
}
