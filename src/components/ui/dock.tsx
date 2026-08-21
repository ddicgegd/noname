import React, { createContext, useContext, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

interface DockContextType {
  mousePos: MotionValue<number>;
  iconSize: number;
  iconMagnification: number;
  iconDistance: number;
  orientation: "horizontal" | "vertical";
}

const DockContext = createContext<DockContextType>({
  mousePos: new MotionValue(Infinity),
  iconSize: 40,
  iconMagnification: 50,
  iconDistance: 100,
  orientation: "horizontal",
});

export interface DockProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  iconSize?: number;
  iconMagnification?: number;
  iconDistance?: number;
  direction?: "top" | "middle" | "bottom";
  orientation?: "horizontal" | "vertical";
  children: React.ReactNode;
}

export const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  (
    {
      className,
      iconSize = 40,
      iconMagnification = 44,
      iconDistance = 80,
      direction = "middle",
      orientation = "horizontal",
      children,
      ...props
    },
    ref
  ) => {
    const mousePos = useMotionValue(Infinity);

    return (
      <DockContext.Provider
        value={{
          mousePos,
          iconSize,
          iconMagnification,
          iconDistance,
          orientation,
        }}
      >
        <motion.div
          ref={ref}
          onMouseMove={(e) => {
            if (orientation === "vertical") {
              mousePos.set(e.clientY);
            } else {
              mousePos.set(e.clientX);
            }
          }}
          onMouseLeave={() => mousePos.set(Infinity)}
          {...(props as any)}
          className={cn(
            orientation === "vertical"
              ? "flex flex-col gap-1 w-full overflow-visible"
              : "flex items-center",
            className
          )}
        >
          {children}
        </motion.div>
      </DockContext.Provider>
    );
  }
);
Dock.displayName = "Dock";

export interface DockIconProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
  magnification?: number;
  distance?: number;
  className?: string;
  children?: React.ReactNode;
}

export const DockIcon = React.forwardRef<HTMLDivElement, DockIconProps>(
  (
    {
      size,
      magnification,
      distance,
      className,
      children,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const ref = (forwardedRef as any) || internalRef;
    const { mousePos, iconSize, iconMagnification, iconDistance, orientation } = useContext(DockContext);

    const activeSize = size ?? iconSize;
    const activeMagnification = magnification ?? iconMagnification;
    const activeDistance = distance ?? iconDistance;

    const distanceCalc = useTransform(mousePos, (val: number) => {
      const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, y: 0, width: 0, height: 0 };
      if (!bounds || bounds.height === 0) return Infinity;
      if (orientation === "vertical") {
        return val - (bounds.y + bounds.height / 2);
      }
      return val - (bounds.x + bounds.width / 2);
    });

    const scaleSync = useTransform(
      distanceCalc,
      [-activeDistance, 0, activeDistance],
      [1, activeMagnification / activeSize, 1]
    );

    const scale = useSpring(scaleSync, {
      mass: 0.1,
      stiffness: 220,
      damping: 16,
    });

    return (
      <motion.div
        ref={ref}
        style={{ 
          scale,
          transformOrigin: "center center"
        }}
        className={cn(
          "w-full origin-center transition-colors",
          className
        )}
        {...(props as any)}
      >
        {children}
      </motion.div>
    );
  }
);
DockIcon.displayName = "DockIcon";
