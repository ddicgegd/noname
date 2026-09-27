import React, { useCallback } from "react";
import { motion } from "motion/react";

export interface AntiAverage404PageProps {
  onNavigate?: (page: "landing" | "product" | "order" | "cart" | "auth" | "auth-report" | "profile" | "terms" | "email-response" | "404") => void;
}

export default function AntiAverage404Page({ onNavigate }: AntiAverage404PageProps) {
  const handleNavigateToProfile = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.hash = "profile";
      window.dispatchEvent(
        new CustomEvent("open-accounts-center", {
          detail: { tab: "profile" }
        })
      );
    }
    if (onNavigate) {
      onNavigate("profile");
    }
  }, [onNavigate]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center selection:bg-[#FF4D24]/30 selection:text-white relative overflow-hidden font-sans">
      {/* Approved Ambient Graphic Background Layer */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 size-[520px] bg-[#FF4D24]/12 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 -right-32 size-[460px] bg-blue-600/10 rounded-full blur-[150px]" />
        <div className="absolute -bottom-32 left-1/3 size-[520px] bg-emerald-600/10 rounded-full blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: "28px 28px"
          }}
        />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative z-10 w-full max-w-4xl mx-auto">
        <motion.div
          key="state-404"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full flex flex-col items-center text-center select-none"
        >
          {/* Anti Average Minimalist Editorial Copy */}
          <div className="flex flex-col items-center text-center mb-3 max-w-lg">
            <p className="text-base sm:text-lg text-neutral-200 font-medium tracking-tight">
              Chúng tôi không chắc điều gì đã xảy ra—rất tiếc!
            </p>
          </div>

          {/* Interactive Centerpiece: "4 0 4" with Frosted Cone & Mascot */}
          <div
            onClick={handleNavigateToProfile}
            title="Chuyển về hồ sơ cá nhân (/m#profile)"
            className="relative w-full max-w-[340px] sm:max-w-[420px] aspect-[668/459] group cursor-pointer my-2 sm:my-4"
          >
            {/* Two "4" Glyphs with Split-on-Hover Micro-Interaction */}
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 668 459"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto drop-shadow-[0_12px_40px_rgba(0,0,0,0.65)]"
            >
              {/* Left 4 */}
              <g className="transition-transform duration-300 ease-out group-hover:-translate-x-3.5">
                <path
                  d="M182.499 219.509H100V174.903L173.605 68.7441H234.947V178.292H260.018V219.509H234.947V258.118H182.477V219.509H182.499ZM184.064 178.292V125.604L148.295 178.292H184.064Z"
                  fill="#E4E4E7"
                />
              </g>
              {/* Right 4 */}
              <g className="transition-transform duration-300 ease-out group-hover:translate-x-3.5">
                <path
                  d="M490.27 219.509H407.771V174.903L481.378 68.7441H542.718V178.292H567.789V219.509H542.718V258.118H490.248V219.509H490.27ZM491.836 178.292V125.604L456.066 178.292H491.836Z"
                  fill="#E4E4E7"
                />
              </g>
            </svg>

            {/* Frosted Glass Collar / Cone Disc (The "0") */}
            <div
              className="absolute inset-0 m-auto w-[34%] aspect-square rounded-full border border-white/20 bg-white/[0.08] backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.7)] flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:border-white/30 group-hover:bg-white/[0.12]"
              style={{ top: "-12%" }}
            />

            {/* Mascot sitting inside the cone */}
            <div className="absolute bottom-0 left-[18.5%] w-[50%] flex pointer-events-none transition-transform duration-300 ease-out group-hover:-translate-y-1.5">
              <svg
                width="100%"
                height="auto"
                viewBox="0 0 307 297"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Cat Silhouette */}
                <path
                  d="M193.165 0C213.409 0 230.218 14.6228 233.632 33.873L230.924 39.0693L234.411 44.2148C242.033 56.2079 246.977 69.744 248.849 83.9531L254.337 125.689C256.406 141.311 262.198 156.216 271.235 169.121L289.288 194.91L289.266 194.845C303.399 215.007 309.409 239.732 306.121 264.109L301.744 296.568H84.5028C62.7265 295.134 41.9521 285.857 26.4256 270.366C-8.80853 235.213 -8.80853 177.986 26.4256 142.832C31.0858 138.161 38.6636 138.161 43.3455 142.832C48.0274 147.503 48.0274 155.064 43.3455 159.735C19.0868 183.939 17.541 222.372 38.7293 248.379C36.922 242.296 35.9198 235.865 35.9198 229.217C35.9198 202.276 51.9905 178.072 76.8807 167.578C82.9781 165.014 90.0123 167.839 92.5819 173.923C95.1512 180.006 92.3205 187.023 86.2235 189.587C70.2178 196.344 59.8739 211.901 59.8739 229.238C59.8739 244.686 68.0833 258.265 80.3651 265.848L80.1258 264.152C76.8594 239.775 82.8694 215.051 96.9803 194.889L115.033 169.1C124.092 156.194 129.884 141.289 131.931 125.668L137.42 83.9316C139.307 69.5417 144.369 55.8415 152.134 43.7539C152.127 43.7424 152.122 43.7297 152.115 43.7182L152.102 43.6938L152.09 43.6693L152.079 43.6427L152.067 43.6161C147.248 31.9427 148.971 18.5772 156.559 8.52841C165.485 -3.28959 181.161 -0.0664654 193.165 0Z"
                  fill="#F4F4F5"
                />
                {/* Clean Downward Collar */}
                <path
                  d="M 149 46 Q 193 64 237 46"
                  stroke="#A1A1AA"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.8"
                />
                <circle cx="193" cy="59" r="3.5" fill="#A1A1AA" />
              </svg>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
