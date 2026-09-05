import React, { ElementType } from "react";
import { motion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

export interface TimelineAnimationProps {
  as?: ElementType;
  animationNum?: number;
  timelineRef?: React.RefObject<HTMLElement | null>;
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

const defaultTimelineVariants: Variants = {
  hidden: {
    filter: "blur(10px)",
    y: -20,
    opacity: 0,
  },
  visible: (i: number = 0) => ({
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      delay: (i % 15) * 0.04,
      duration: 0.45,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
};

export function TimelineAnimation({
  as = "div",
  animationNum = 0,
  timelineRef,
  customVariants = defaultTimelineVariants,
  className,
  children,
  viewport = { once: true, margin: "120px 0px 50px 0px", amount: "some" },
  ...props
}: TimelineAnimationProps) {
  const MotionComponent =
    typeof as === "string" && (motion as any)[as]
      ? (motion as any)[as]
      : motion.create(as as any);

  return (
    <MotionComponent
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      custom={animationNum}
      variants={customVariants}
      className={cn(className)}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}
