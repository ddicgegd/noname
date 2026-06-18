import { useEffect, useRef, useState } from 'react';

/**
 * Hook to track mouse and touch movements and provide smoothly interpolated coordinates using LERP.
 * 
 * @param lerpFactor - The interpolation factor (0 to 1). Lower is slower/smoother. Default is 0.1.
 * @returns { cursorPos: {x, y}, hasScanned: boolean }
 */
export function useSmoothedMouse(lerpFactor: number = 0.1) {
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 });
  const [hasScanned, setHasScanned] = useState(false);

  const mouseRef = useRef({ x: -999, y: -999 });
  const smoothRef = useRef({ x: -999, y: -999 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (!hasScanned) setHasScanned(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        mouseRef.current = { x: touch.clientX, y: touch.clientY };
        if (!hasScanned) setHasScanned(true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchMove, { passive: true });

    const updatePosition = () => {
      if (mouseRef.current.x !== -999) {
        if (smoothRef.current.x === -999) {
          smoothRef.current = { ...mouseRef.current };
        } else {
          smoothRef.current.x += (mouseRef.current.x - smoothRef.current.x) * lerpFactor;
          smoothRef.current.y += (mouseRef.current.y - smoothRef.current.y) * lerpFactor;
        }
        setCursorPos({ x: smoothRef.current.x, y: smoothRef.current.y });
      }
      rafRef.current = requestAnimationFrame(updatePosition);
    };

    rafRef.current = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [hasScanned, lerpFactor]);

  return { cursorPos, hasScanned };
}
