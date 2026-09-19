/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useChainedSpringList } from "@/hooks/useChainedSpringList";

export interface ChainedSpringListProps<T> {
  items: T[];
  getItemKey: (item: T, index: number) => string;
  onDismiss?: (item: T, index: number) => void;
  className?: string;
  itemClassName?: string | ((item: T, index: number) => string);
  threshold?: number;
  tensionDecay?: number;
  maxChainedDepth?: number;
  staggerDelay?: number;
  emptyState?: React.ReactNode;
  onWheel?: (e: React.WheelEvent<HTMLDivElement>) => void;
  children: (
    item: T,
    index: number,
    helpers: {
      dismiss: () => void;
      isDismissing: boolean;
      activeIdx: number | null;
      isDragging: boolean;
    }
  ) => React.ReactNode;
}

/**
 * ChainedSpringList: Reusable component encapsulating the cart's spring physics dismissal algorithm.
 * Features:
 * - Interactive horizontal swipe-to-dismiss gesture with chained spring tension decay across neighbor items.
 * - Programmatic `dismiss()` trigger (e.g. from trash button) with graceful slide & shrink exit animation.
 * - Smooth layout reflow (`layout`) when items are removed.
 */
export function ChainedSpringList<T>({
  items,
  getItemKey,
  onDismiss,
  className = "flex flex-col gap-2 relative",
  itemClassName = "",
  threshold = 85,
  tensionDecay = 0.32,
  maxChainedDepth = 3,
  staggerDelay = 60,
  emptyState,
  onWheel,
  children,
}: ChainedSpringListProps<T>) {
  const { bindDrag, isDismissing, offsets, activeIdx } = useChainedSpringList({
    items,
    onDismiss,
    threshold,
    tensionDecay,
    maxChainedDepth,
    staggerDelay,
  });

  if (items.length === 0 && !isDismissing) {
    return <>{emptyState || null}</>;
  }

  return (
    <div className={className} onWheel={onWheel}>
      <AnimatePresence initial={false}>
        {items.map((item, index) => {
          const key = getItemKey(item, index);
          // Chỉ áp dụng offset khi đang có cử chỉ kéo chủ động để không làm lệch vị trí các item khác khi xóa
          const offset = activeIdx !== null ? (offsets[index] || 0) : 0;
          const isItemActive = activeIdx === index;

          const computedItemClass =
            typeof itemClassName === "function" ? itemClassName(item, index) : itemClassName;

          return (
            <motion.div
              key={key}
              initial={false}
              animate={{
                opacity: offset
                  ? Math.max(0, 1 - Math.pow(Math.min(1, Math.max(0, offset) / 240), 1.2))
                  : 1,
                y: 0,
                x: offset,
                rotate: offset ? Math.min(3.5, offset * 0.008) : 0,
                scale: offset && offset > 20 ? Math.max(0.96, 1 - offset / 3000) : 1,
              }}
              exit={{
                opacity: 0,
                x: 360,
                scale: 0.95,
                rotate: 2,
                height: 0,
                marginTop: 0,
                marginBottom: 0,
                paddingTop: 0,
                paddingBottom: 0,
                overflow: "hidden",
                transition: {
                  x: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 0.18, ease: "easeOut" },
                  scale: { duration: 0.2 },
                  rotate: { duration: 0.2 },
                  height: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
                  marginBottom: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
                  marginTop: { duration: 0.22 },
                  paddingTop: { duration: 0.22 },
                  paddingBottom: { duration: 0.22 },
                },
              }}
              transition={{
                x:
                  isItemActive && !isDismissing
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 300, damping: 28, mass: 0.8 },
                rotate: { type: "spring", stiffness: 260, damping: 25 },
                scale: { type: "spring", stiffness: 280, damping: 28 },
                opacity: { duration: 0.18, ease: "easeOut" },
              }}
              {...bindDrag(index)}
              className={`touch-pan-y select-none relative will-change-transform ${computedItemClass}`}
            >
              {children(item, index, {
                dismiss: () => {
                  if (onDismiss) {
                    onDismiss(item, index);
                  }
                },
                isDismissing,
                activeIdx,
                isDragging: isItemActive,
              })}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default ChainedSpringList;
