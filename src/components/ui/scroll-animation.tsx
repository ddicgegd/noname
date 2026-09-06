import React, { ElementType } from "react";
import { motion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

export interface ScrollAnimationProps {
  as?: ElementType;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  customVariants?: Variants;
  className?: string;
  children?: React.ReactNode;
  viewport?: {
    once?: boolean;
    margin?: string;
    amount?: "some" | "all" | number;
  };
  [key: string]: any;
}

const getDirectionOffset = (direction: "up" | "down" | "left" | "right") => {
  switch (direction) {
    case "up":
      return { y: 35, x: 0 };
    case "down":
      return { y: -35, x: 0 };
    case "left":
      return { x: 35, y: 0 };
    case "right":
      return { x: -35, y: 0 };
    default:
      return { y: 35, x: 0 };
  }
};

export function ScrollAnimation({
  as = "div",
  direction = "up",
  delay = 0,
  duration = 0.6,
  customVariants,
  className,
  children,
  viewport = { once: true, amount: 0.2 },
  ...props
}: ScrollAnimationProps) {
  const offset = getDirectionOffset(direction);

  const defaultVariants: Variants = {
    hidden: {
      opacity: 0,
      x: offset.x,
      y: offset.y,
      filter: "blur(4px)",
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const MotionComponent =
    typeof as === "string" && (motion as any)[as]
      ? (motion as any)[as]
      : motion.create(as as any);

  return (
    <MotionComponent
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={customVariants || defaultVariants}
      className={cn(className)}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}

export default ScrollAnimation;
