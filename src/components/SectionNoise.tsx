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


    </section>
  );
};

export default SectionNoise;
