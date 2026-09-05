import { useState, useRef, useCallback, PointerEvent } from 'react';

export interface UseChainedSpringOptions<T> {
  items: T[];
  onDismiss?: (item: T, index: number) => void;
  threshold?: number;       // Khoảng cách kéo tối thiểu kích hoạt dismiss (px), mặc định: 90
  tensionDecay?: number;    // Hệ số truyền lực sang phần tử lân cận (0 < decay < 1), mặc định: 0.32
  maxChainedDepth?: number; // Số lượng phần tử tối đa bị ảnh hưởng mỗi chiều, mặc định: 3
  staggerDelay?: number;    // Thời gian trễ giữa các tầng lan truyền từ tâm ra 2 biên (ms), mặc định: 65
}

export function useChainedSpringList<T>({
  items,
  onDismiss,
  threshold = 90,
  tensionDecay = 0.32,
  maxChainedDepth = 3,
  staggerDelay = 65,
}: UseChainedSpringOptions<T>) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [offsets, setOffsets] = useState<Record<number, number>>({});
  const [isDismissing, setIsDismissing] = useState(false);

  const startX = useRef(0);
  const currentDeltaX = useRef(0);
  const isDragging = useRef(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(t => clearTimeout(t));
    timeoutsRef.current = [];
  };

  const handlePointerDown = useCallback((e: PointerEvent, index: number) => {
    if ((e.target as HTMLElement).closest('button, input, select, a, [role="button"]')) {
      return;
    }
    setActiveIdx(index);
    startX.current = e.clientX;
    currentDeltaX.current = 0;
    isDragging.current = true;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Bỏ qua nếu pointer capture không thành công
    }
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (activeIdx === null || isDismissing || !isDragging.current) return;

    const deltaX = e.clientX - startX.current;
    currentDeltaX.current = deltaX;

    const newOffsets: Record<number, number> = {};
    const total = items.length;

    for (let i = 0; i < total; i++) {
      const distance = Math.abs(i - activeIdx);

      if (distance === 0) {
        newOffsets[i] = deltaX;
      } else if (distance <= maxChainedDepth) {
        newOffsets[i] = deltaX * Math.pow(tensionDecay, distance);
      } else {
        newOffsets[i] = 0;
      }
    }

    setOffsets(newOffsets);
  }, [activeIdx, isDismissing, items.length, maxChainedDepth, tensionDecay]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (activeIdx === null) return;
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Bỏ qua nếu pointer capture đã tự hủy
    }

    const finalDeltaX = currentDeltaX.current;
    const targetIdx = activeIdx;

    if (finalDeltaX >= threshold) {
      setIsDismissing(true);
      const exitDistance = 480;

      const newOffsets: Record<number, number> = {};
      const total = items.length;
      for (let i = 0; i < total; i++) {
        if (i === targetIdx) {
          newOffsets[i] = exitDistance;
        } else {
          const dist = Math.abs(i - targetIdx);
          if (dist <= maxChainedDepth) {
            newOffsets[i] = 50 * Math.pow(tensionDecay, dist);
          } else {
            newOffsets[i] = 0;
          }
        }
      }
      setOffsets(newOffsets);

      const t1 = setTimeout(() => {
        setOffsets(prev => {
          const next: Record<number, number> = {};
          for (let i = 0; i < total; i++) {
            if (i === targetIdx) next[i] = exitDistance;
            else next[i] = 0;
          }
          return next;
        });
      }, 110);

      const t2 = setTimeout(() => {
        onDismiss && onDismiss(items[targetIdx], targetIdx);
        setOffsets({});
        setActiveIdx(null);
        setIsDismissing(false);
      }, 330);

      timeoutsRef.current.push(t1, t2);
    } else {
      setOffsets({});
      setActiveIdx(null);
    }
  }, [activeIdx, threshold, onDismiss, items, maxChainedDepth, tensionDecay]);

  const dismissIndices = useCallback((indices: number[], onComplete?: () => void) => {
    if (indices.length === 0 || isDismissing) return;
    clearTimeouts();
    setIsDismissing(true);

    const total = items.length;
    const exitDistance = 480;

    // 1. Tính toán vị trí tâm (Center Item)
    const center = (total - 1) / 2;

    // 2. Sắp xếp các index theo khoảng cách tới tâm (từ giữa tỏa ra 2 biên)
    const sortedIndices = [...indices].sort((a, b) => {
      const distA = Math.abs(a - center);
      const distB = Math.abs(b - center);
      return distA - distB;
    });

    const distanceTiers: number[][] = [];
    sortedIndices.forEach((idx) => {
      const dist = Math.abs(idx - center);
      const existingTier = distanceTiers.find(tier => Math.abs(Math.abs(tier[0] - center) - dist) < 0.1);
      if (existingTier) {
        existingTier.push(idx);
      } else {
        distanceTiers.push([idx]);
      }
    });

    const activeExitIndices = new Set<number>();

    // 3. Kích hoạt hiệu ứng lan truyền mượt mà từ tâm ra ngoài
    distanceTiers.forEach((tier, tierIdx) => {
      const delay = tierIdx * staggerDelay;

      const timer = setTimeout(() => {
        tier.forEach(idx => activeExitIndices.add(idx));

        setOffsets(prev => {
          const next: Record<number, number> = { ...prev };

          for (let i = 0; i < total; i++) {
            if (activeExitIndices.has(i)) {
              next[i] = exitDistance;
            } else {
              let minDist = Infinity;
              activeExitIndices.forEach(exitIdx => {
                const d = Math.abs(i - exitIdx);
                if (d < minDist) minDist = d;
              });

              if (minDist <= maxChainedDepth) {
                next[i] = 55 * Math.pow(tensionDecay, minDist);
              } else {
                next[i] = 0;
              }
            }
          }
          return next;
        });
      }, delay);

      timeoutsRef.current.push(timer);
    });

    // 4. Thời gian hoàn tất
    const totalDuration = (distanceTiers.length - 1) * staggerDelay + 340;

    const finalTimer = setTimeout(() => {
      onComplete && onComplete();
      setOffsets({});
      setActiveIdx(null);
      setIsDismissing(false);
      clearTimeouts();
    }, totalDuration);

    timeoutsRef.current.push(finalTimer);
  }, [isDismissing, items.length, maxChainedDepth, tensionDecay, staggerDelay]);

  const bindDrag = useCallback((index: number) => ({
    onPointerDown: (e: PointerEvent) => handlePointerDown(e, index),
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerUp,
  }), [handlePointerDown, handlePointerMove, handlePointerUp]);

  return {
    bindDrag,
    activeIdx,
    isDismissing,
    dismissIndices,
    offsets,
  };
}
