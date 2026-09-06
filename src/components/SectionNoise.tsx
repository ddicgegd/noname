import React, { type ChangeEvent, useCallback, useState } from "react";

export const SectionNoise: React.FC = () => {
  const [opacity, setOpacity] = useState(0.05);

  const handleOpacityChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setOpacity(Number.parseFloat(event.target.value));
  }, []);

  return (
    <section className="relative border border-neutral-200/80 rounded-2xl w-full overflow-hidden shadow-sm my-6 bg-white dark:bg-neutral-900">
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-xs text-xs font-mono">
        <label htmlFor="opacity-slider" className="text-neutral-600 dark:text-neutral-300 font-medium">
          Noise Opacity:
        </label>
        <input
          id="opacity-slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={opacity}
          onChange={handleOpacityChange}
          className="accent-orange-500 cursor-pointer h-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700"
        />
        <span className="font-bold text-neutral-900 dark:text-white w-8 text-right">{opacity.toFixed(2)}</span>
      </div>

      {/* Noise Grain Overlay Layer */}
      <div
        className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none bg-[url('/noise.gif')] bg-repeat"
        style={{ opacity: opacity }}
      />

      {/* Hero Content Section with Grid & Radial Mask */}
      <div className="font-semibold 2xl:h-[450px] sm:h-[450px] h-[400px] bg-gradient-to-t dark:to-neutral-950 dark:from-neutral-900 to-[#dadada] from-[#ebebeb] flex flex-col items-center justify-center text-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:35px_34px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <h1 className="relative z-10 xl:text-4xl text-3xl px-8 font-bold text-center tracking-tight leading-[120%] text-neutral-900 dark:text-white drop-shadow-xs">
          An Home Page with Noise Effect
        </h1>
      </div>
    </section>
  );
};

export default SectionNoise;
