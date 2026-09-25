'use client';

import React, { useEffect, useRef } from 'react';

interface ShimmerColor {
  r: number;
  g: number;
  b: number;
}

function computeShimmerColors(
  totalWidth: number,
  shimmerPos: number,
  pulse: number
): ShimmerColor[] {
  const shimmerRadius = Math.floor(totalWidth / 2.5);
  const colors: ShimmerColor[] = [];

  for (let i = 0; i < totalWidth; i++) {
    const dist = Math.abs(i - shimmerPos);
    const shimmer = Math.max(0, 1 - dist / shimmerRadius);

    // Deep slate base (rgb 18..28, 24..36, 38..54)
    const baseR = 18 + (i / totalWidth) * 10;
    const baseG = 24 + (i / totalWidth) * 12;
    const baseB = 38 + (i / totalWidth) * 16;

    // Warm coral-amber shimmer peak (rgb 255, 110, 45)
    const r = baseR + (255 - baseR) * shimmer * 0.95;
    const g = baseG + (110 - baseG) * shimmer * 0.85;
    const b = baseB + (50 - baseB) * shimmer * 0.7;

    const p = 1 + pulse * 0.05;
    colors.push({
      r: Math.min(255, Math.round(r * p)),
      g: Math.min(255, Math.round(g * p)),
      b: Math.min(255, Math.round(b * p)),
    });
  }

  return colors;
}

export interface ShimmerLoaderProps {
  key?: React.Key;
  labels: string[];
  icons: string[];
  duration: number;
  tokenTarget?: number;
  showPercent?: boolean;
  fontSize?: number;
  /** Vertical padding inside each cell, in px. Default 3.5. */
  paddingY?: number;
  /** Blank monospace cells on each side of the label. Default 2. */
  cellPadding?: number;
  /** Tailwind class for the character text color. */
  textClassName?: string;
  onComplete?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function ShimmerLoader({
  labels,
  icons,
  duration,
  tokenTarget,
  showPercent = true,
  fontSize = 12.5,
  paddingY = 3.5,
  cellPadding = 2,
  textClassName = 'text-orange-50',
  onComplete,
  className,
  style,
}: ShimmerLoaderProps) {
  const cellsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const iconRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef(0);
  const rafRef = useRef<number>(0);
  const doneRef = useRef(false);
  const lastFrameTimeRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const percentBudget = showPercent ? ' 100%'.length : 0;
  const longestInner = Math.max(
    ...labels.map((l) => (' ' + l + ' ').length + percentBudget)
  );
  const barWidth = longestInner + cellPadding * 2;

  useEffect(() => {
    frameRef.current = 0;
    doneRef.current = false;
    lastFrameTimeRef.current = 0;

    const fps = 40;
    const frameMs = 1000 / fps;
    const totalFrames = Math.max(1, Math.round(duration / frameMs));
    const sliceFrames = Math.max(1, Math.floor(totalFrames / labels.length));
    const shimmerRadius = Math.floor(barWidth / 2.5);
    const shimmerCycleLen = barWidth + shimmerRadius * 2;

    function buildContent(label: string, pct: number): string[] {
      const percentStr = showPercent ? ' ' + pct + '%' : '';
      const rawInner = ' ' + label + percentStr + ' ';
      const inner = rawInner.padEnd(longestInner);
      const padStr = ' '.repeat(cellPadding);
      return (padStr + inner + padStr).split('');
    }

    function draw(ts: number) {
      if (ts - lastFrameTimeRef.current < frameMs - 1) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      lastFrameTimeRef.current = ts;

      const f = frameRef.current;
      const progress = Math.min(f / totalFrames, 1);
      const pct = Math.round(progress * 100);
      const shimmerPos = ((f * 1.2) % shimmerCycleLen) - shimmerRadius;
      const pulse = Math.sin(f * 0.18);
      const done = f >= totalFrames;
      const labelIdx = Math.min(Math.floor(f / sliceFrames), labels.length - 1);
      const currentLabel = done ? labels[labels.length - 1] : labels[labelIdx];
      const currentIcon = done
        ? icons[icons.length - 1] || '⌘'
        : icons[Math.floor(f / 5) % icons.length];
      const ic = done ? 255 : Math.round(220 + pulse * 35);

      if (iconRef.current) {
        if (iconRef.current.textContent !== currentIcon) {
          iconRef.current.textContent = currentIcon;
        }
        iconRef.current.style.color = `rgb(${ic}, ${Math.round(80 + pulse * 15)}, 40)`;
      }

      const content = buildContent(currentLabel, pct);
      const colors = computeShimmerColors(barWidth, shimmerPos, pulse);

      for (let i = 0; i < barWidth; i++) {
        const cell = cellsRef.current[i];
        if (!cell) continue;
        const color = colors[i] || colors[colors.length - 1];
        if (color) {
          cell.style.backgroundColor = `rgb(${color.r},${color.g},${color.b})`;
        }
        const ch = content[i] ?? ' ';
        if (cell.textContent !== ch) {
          cell.textContent = ch;
        }
      }

      frameRef.current = f + 1;
      if (!done) {
        rafRef.current = requestAnimationFrame(draw);
      } else if (!doneRef.current) {
        doneRef.current = true;
        onCompleteRef.current?.();
      }
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [duration, labels, icons, showPercent, barWidth, longestInner, cellPadding]);

  return (
    <div
      className={`inline-flex items-center gap-2 select-none ${className || ''}`}
      style={{ fontSize, ...style }}
    >
      <span
        ref={iconRef}
        className="leading-none shrink-0"
        style={{ color: '#FF4D24', fontSize: fontSize * 1.15 }}
      >
        {icons[0] || '✶'}
      </span>

      <div
        className="inline-flex font-mono leading-none whitespace-pre overflow-hidden rounded-[4px] shadow-[0_2px_6px_rgba(0,0,0,0.15)] border border-slate-700/60"
        style={{ fontSize }}
      >
        {Array.from({ length: barWidth }).map((_, i) => (
          <span
            key={i}
            ref={(el) => {
              cellsRef.current[i] = el;
            }}
            className={`inline-block whitespace-pre font-semibold ${textClassName}`}
            style={{
              padding: `${paddingY}px 0`,
              minWidth: `${fontSize * 0.62}px`,
              textAlign: 'center',
            }}
          >
            {' '}
          </span>
        ))}
      </div>
    </div>
  );
}
