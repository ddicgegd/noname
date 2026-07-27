/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Unmount splash screen after animations finish
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1750); // 1.35s delay + 400ms buffer for exit transitions

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const boxes = [0, 1, 2, 3, 4];

  // Custom cubic-bezier easing to match original design: [0.96, -0.02, 0.38, 1.01]
  const transitionConfig = (index: number) => ({
    duration: 1.0,
    ease: [0.96, -0.02, 0.38, 1.01],
    delay: index * 0.05,
  });

  return (
    <AnimatePresence>
      <motion.div
        id="splash"
        className="fixed inset-0 w-screen h-screen z-[9999] pointer-events-none overflow-hidden flex flex-col"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, delay: 1.35 }}
      >
        {/* Top Row: sliding upward */}
        <div className="flex w-full h-1/2 overflow-hidden">
          {boxes.map((i) => (
            <motion.div
              key={`top-${i}`}
              id={`splash-top-${i}`}
              className="w-1/5 h-full bg-[#75C5DE]"
              initial={{ y: "0%" }}
              animate={{ y: "-100%" }}
              transition={transitionConfig(i)}
            />
          ))}
        </div>

        {/* Bottom Row: sliding downward */}
        <div className="flex w-full h-1/2 overflow-hidden">
          {boxes.map((i) => (
            <motion.div
              key={`bottom-${i}`}
              id={`splash-bottom-${i}`}
              className="w-1/5 h-full bg-[#75C5DE]"
              initial={{ y: "0%" }}
              animate={{ y: "100%" }}
              transition={transitionConfig(i)}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
