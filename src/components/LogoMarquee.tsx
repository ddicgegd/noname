import React from "react";

interface LogoItem {
  name: string;
  url: string;
}

const LOGOS: LogoItem[] = [
  {
    name: "Apple",
    url: "https://api.iconify.design/logos:apple.svg",
  },
  {
    name: "Samsung",
    url: "https://api.iconify.design/logos:samsung.svg",
  },
  {
    name: "OpenAI",
    url: "https://api.iconify.design/logos:openai-icon.svg",
  },
  {
    name: "Google Gemini",
    url: "https://api.iconify.design/logos:google-icon.svg",
  },
  {
    name: "NVIDIA",
    url: "https://api.iconify.design/logos:nvidia-icon.svg",
  },
  {
    name: "Microsoft",
    url: "https://api.iconify.design/logos:microsoft-icon.svg",
  },
  {
    name: "Meta",
    url: "https://api.iconify.design/logos:meta-icon.svg",
  },
  {
    name: "Xiaomi",
    url: "https://api.iconify.design/logos:xiaomi.svg",
  },
  {
    name: "Intel",
    url: "https://api.iconify.design/logos:intel.svg",
  },
  {
    name: "AMD",
    url: "https://api.iconify.design/logos:amd-icon.svg",
  },
];

export default function LogoMarquee() {
  // Combine the list four times to ensure a seamless looping effect even on ultra-wide screens
  const marqueeLogos = [...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS];

  const maskStyle = {
    WebkitMaskImage:
      "linear-gradient(to right, transparent, rgba(0, 0, 0, 1) 15%, rgba(0, 0, 0, 1) 85%, transparent)",
    maskImage:
      "linear-gradient(to right, transparent, rgba(0, 0, 0, 1) 15%, rgba(0, 0, 0, 1) 85%, transparent)",
  };

  return (
    <div className="relative w-full py-4 overflow-hidden bg-transparent pointer-events-none select-none">
      {/* Marquee Wrapper with fading edges */}
      <div className="relative w-full overflow-hidden" style={maskStyle}>
        <div className="marquee-track px-4">
          {marqueeLogos.map((logo, index) => {
            return (
              <div
                key={`${logo.name}-${index}`}
                id={`logo-card-${index}`}
                className="relative h-12 px-5 shrink-0 flex items-center justify-center gap-2.5 rounded-full bg-white/95 border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] select-none pointer-events-none"
              >
                {/* Logo Image with original true color */}
                <img
                  src={logo.url}
                  alt={`${logo.name} Logo`}
                  className="h-5 w-auto max-w-[22px] object-contain relative z-10 opacity-100 grayscale-0"
                  referrerPolicy="no-referrer"
                />
                {/* Brand Name Text */}
                <span className="text-[12px] font-semibold tracking-tight text-slate-800">
                  {logo.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
