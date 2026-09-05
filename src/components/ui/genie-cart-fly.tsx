/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useRef, useEffect, useCallback } from "react";

export interface GenieFlyOptions {
  /** The source image element or container element */
  sourceEl?: HTMLElement | null;
  /** Image URL if sourceEl is not an img element */
  imageSrc?: string;
  /** The target cart element (button or icon) */
  targetEl?: HTMLElement | null;
  /** Fallback target coordinate in viewport */
  targetPoint?: { x: number; y: number };
  /** Duration in milliseconds (default: 480ms) */
  duration?: number;
  /** Border radius in px to retain roundness (default: 12) */
  borderRadius?: number;
  /** Callback fired when animation finishes */
  onComplete?: () => void;
}

interface ActiveGenieAnim {
  id: string;
  offCanvas: HTMLCanvasElement;
  srcW: number;
  srcH: number;
  startRect: { left: number; top: number; width: number; height: number };
  targetEl: HTMLElement | null;
  targetPoint: { x: number; y: number };
  startTime: number;
  duration: number;
  onComplete?: () => void;
  /** Popup container element — if set, animation is clipped to its visible bounds */
  clipEl?: HTMLElement;
}

interface GenieCartFlyContextType {
  triggerGenieFly: (options: GenieFlyOptions) => void;
}

const GenieCartFlyContext = createContext<GenieCartFlyContextType>({
  triggerGenieFly: () => {},
});

export const useGenieCartFly = () => useContext(GenieCartFlyContext);

// ─── Math & Easing Helpers ──────────────────────────────────────────────────
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const eioC = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const eIn2 = (t: number) => t * t;
const eOut2 = (t: number) => 1 - (1 - t) * (1 - t);

export function GenieCartFlyProvider({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animsRef = useRef<ActiveGenieAnim[]>([]);
  const rafRef = useRef<number>(0);

  // Resize canvas to match viewport and retina DPR
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas, { passive: true });
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(rafRef.current);
    };
  }, [resizeCanvas]);

  // Main animation render loop
  const renderFrame = useCallback((ts: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    const currentAnims = animsRef.current;
    if (currentAnims.length === 0) return;

    const remainingAnims: ActiveGenieAnim[] = [];

    for (const anim of currentAnims) {
      const elapsed = ts - anim.startTime;
      const rawT = clamp(elapsed / anim.duration, 0, 1);

      // Resolve live target coordinates (targeting the exact center of the cart icon)
      let targetX = anim.targetPoint.x;
      let targetY = anim.targetPoint.y;
      let landingHalfW = 5.5;
      if (anim.targetEl && anim.targetEl.isConnected) {
        const iconSvg = anim.targetEl.querySelector("svg") || anim.targetEl;
        const tr = iconSvg.getBoundingClientRect();
        targetX = tr.left + tr.width / 2;
        targetY = tr.top + tr.height / 2;
        landingHalfW = Math.max(4.5, Math.min(6.5, tr.width * 0.28));
      }

      const { offCanvas, srcW, srcH, startRect } = anim;
      const winX = startRect.left;
      const winY = startRect.top;
      const winW = startRect.width;
      const winH = startRect.height;

      // ── Clip canvas to popup visible area if source is inside a modal ────────
      const clipApplied = !!(anim.clipEl && anim.clipEl.isConnected);
      if (clipApplied) {
        const cr = anim.clipEl!.getBoundingClientRect();
        ctx.save();
        ctx.beginPath();
        ctx.rect(cr.left, cr.top, cr.width, cr.height);
        ctx.clip();
      }
      // ─────────────────────────────────────────────────────────────────────────

      // Scanline Genie Effect Rendering with sub-pixel overlap anti-aliasing
      const sliceCount = Math.min(srcH, 300);
      const stepSrcY = srcH / sliceCount;
      const sliceHeight = (winH / sliceCount) * 1.35;

      for (let i = 0; i < sliceCount; i++) {
        const srcY = i * stepSrcY;
        const r = i / sliceCount;

        const rowXStart = (1 - r) * 0.60;
        const xP = clamp((rawT - rowXStart) / (1 - rowXStart), 0, 1);
        const xE = eioC(xP);

        const rowYStart = (1 - r) * 0.22;
        const yP = clamp((rawT - rowYStart) / (1 - rowYStart), 0, 1);
        const yE = eIn2(yP);

        const targetLeft = targetX - landingHalfW;
        const targetRight = targetX + landingHalfW;

        const left = lerp(winX, targetLeft, xE);
        const right = lerp(winX + winW, targetRight, xE);
        const destY = lerp(winY + (i * winH) / sliceCount, targetY, yE);
        const rowW = right - left;

        if (rowW < 0.6) continue;

        if (yE > 0.92) {
          ctx.globalAlpha = Math.max(0, 1 - (yE - 0.92) / 0.08);
        } else {
          ctx.globalAlpha = 1;
        }

        ctx.drawImage(offCanvas, 0, srcY, srcW, stepSrcY, left, destY, rowW, sliceHeight);
      }
      ctx.globalAlpha = 1;

      // Radial glow flash at destination upon absorption
      if (rawT > 0.70) {
        const glowProgress = (rawT - 0.70) / 0.30;
        const alpha = eOut2(glowProgress) * (1 - glowProgress) * 0.90;
        const radius = 15 + glowProgress * 22;

        const grad = ctx.createRadialGradient(targetX, targetY, 0, targetX, targetY, radius);
        grad.addColorStop(0, `rgba(255, 77, 36, ${alpha})`);
        grad.addColorStop(0.5, `rgba(255, 120, 50, ${alpha * 0.5})`);
        grad.addColorStop(1, "rgba(255, 77, 36, 0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(targetX, targetY, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Restore clip ────────────────────────────────────────────────────────
      if (clipApplied) {
        ctx.restore();
      }
      // ────────────────────────────────────────────────────────────────────────

      if (rawT < 1) {
        remainingAnims.push(anim);
      } else {
        // Trigger bounce / vibration on target cart button if present
        if (anim.targetEl) {
          anim.targetEl.classList.remove("animate-cart-pop");
          // Force reflow
          void anim.targetEl.offsetWidth;
          anim.targetEl.classList.add("animate-cart-pop");
        }
        if (anim.onComplete) {
          try {
            anim.onComplete();
          } catch (e) {
            console.error("GenieFly onComplete error:", e);
          }
        }
      }
    }

    animsRef.current = remainingAnims;

    if (remainingAnims.length > 0) {
      rafRef.current = requestAnimationFrame(renderFrame);
    } else {
      ctx.clearRect(0, 0, w, h);
    }
  }, []);

  const triggerGenieFly = useCallback((options: GenieFlyOptions) => {
    let sourceEl = options.sourceEl;
    let targetEl = options.targetEl;

    // Auto-detect target cart button if not provided
    if (!targetEl) {
      const candidate = document.querySelector('button[title="Thêm vào giỏ hàng"]') ||
                        document.querySelector('#navbar-cart-button') ||
                        document.querySelector('.lucide-shopping-cart')?.closest('button');
      if (candidate instanceof HTMLElement) {
        targetEl = candidate;
      }
    }

    // Auto-detect source image if not explicitly provided
    if (!sourceEl) {
      const activeImg = document.querySelector('img[alt][class*="object-cover"]') ||
                        document.querySelector('img[class*="object-cover"]');
      if (activeImg instanceof HTMLElement) {
        sourceEl = activeImg;
      }
    }

    if (!sourceEl) return;

    const startRect = sourceEl.getBoundingClientRect();
    if (startRect.width <= 0 || startRect.height <= 0) return;

    // Detect popup containers:
    // - scrollableContainer: the overflow-y-auto div (has scrollTop)
    // - clipEl: visible bounds for canvas clipping (prefer scrollable, fallback to overflow-hidden)
    const scrollableContainer =
      sourceEl.closest('[class*="overflow-y-auto"]') as HTMLElement | null;
    const clipEl =
      scrollableContainer ||
      (sourceEl.closest('[class*="overflow-hidden"]') as HTMLElement | null) ||
      undefined;

    const scrollDepth = scrollableContainer ? scrollableContainer.scrollTop : 0;
    void scrollDepth; // retained for potential future use
    const finalDuration = options.duration || 850;

    let targetX = window.innerWidth * 0.8;
    let targetY = 40;
    if (targetEl) {
      const iconSvg = targetEl.querySelector("svg") || targetEl;
      const tr = iconSvg.getBoundingClientRect();
      targetX = tr.left + tr.width / 2;
      targetY = tr.top + tr.height / 2;
    } else if (options.targetPoint) {
      targetX = options.targetPoint.x;
      targetY = options.targetPoint.y;
    }

    // Extract bitmap to offscreen canvas immediately (< 0.3ms)
    let imgToDraw: HTMLImageElement | null = null;
    if (sourceEl instanceof HTMLImageElement && sourceEl.complete) {
      imgToDraw = sourceEl;
    } else {
      const nestedImg = sourceEl.querySelector("img");
      if (nestedImg && nestedImg.complete) {
        imgToDraw = nestedImg;
      }
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const offCanvas = document.createElement("canvas");
    const srcW = Math.max(1, Math.round(startRect.width * dpr));
    const srcH = Math.max(1, Math.round(startRect.height * dpr));
    offCanvas.width = srcW;
    offCanvas.height = srcH;
    const offCtx = offCanvas.getContext("2d");

    if (!offCtx) return;

    offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    offCtx.imageSmoothingEnabled = true;
    offCtx.imageSmoothingQuality = "high";

    const borderRadius = options.borderRadius ?? 12;
    if (borderRadius > 0) {
      offCtx.beginPath();
      if (typeof offCtx.roundRect === "function") {
        offCtx.roundRect(0, 0, startRect.width, startRect.height, borderRadius);
      } else {
        offCtx.rect(0, 0, startRect.width, startRect.height);
      }
      offCtx.clip();
    }

    if (imgToDraw) {
      offCtx.drawImage(imgToDraw, 0, 0, startRect.width, startRect.height);
    } else {
      // Fallback background
      offCtx.fillStyle = "#FF4D24";
      offCtx.fillRect(0, 0, startRect.width, startRect.height);
    }

    const anim: ActiveGenieAnim = {
      id: `genie-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      offCanvas,
      srcW,
      srcH,
      startRect: {
        left: startRect.left,
        top: startRect.top,
        width: startRect.width,
        height: startRect.height,
      },
      targetEl,
      targetPoint: { x: targetX, y: targetY },
      startTime: performance.now(),
      duration: finalDuration,
      onComplete: options.onComplete,
      clipEl: clipEl ?? undefined,
    };

    animsRef.current.push(anim);

    if (animsRef.current.length === 1) {
      resizeCanvas();
      rafRef.current = requestAnimationFrame(renderFrame);
    }
  }, [renderFrame, resizeCanvas]);

  return (
    <GenieCartFlyContext.Provider value={{ triggerGenieFly }}>
      {children}
      {/* Fixed Singleton Overlay Canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          width: "100vw",
          height: "100vh",
          zIndex: 99999,
        }}
      />
    </GenieCartFlyContext.Provider>
  );
}
