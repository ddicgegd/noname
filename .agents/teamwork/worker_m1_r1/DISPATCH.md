## 2026-09-22T16:53:00Z

You are the Engineering Frontend Developer (teamwork_preview_worker).
Your working directory is: /home/ddicgegd/Projects/noname/.agents/teamwork/worker_m1_r1

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INSTRUCTIONS:
1. Read the authoritative user request at:
   /home/ddicgegd/Projects/noname/.agents/teamwork/ORIGINAL_REQUEST.md
2. Read the project scope document at:
   /home/ddicgegd/Projects/noname/.agents/teamwork/orchestrator/PROJECT.md
3. Read the architectural and specification handoffs at:
   - /home/ddicgegd/Projects/noname/.agents/teamwork/explorer_m1_r1_1/handoff.md
   - /home/ddicgegd/Projects/noname/.agents/teamwork/explorer_m1_r1_2/handoff.md
   - /home/ddicgegd/Projects/noname/.agents/teamwork/spec_miner_m1_r1/handoff.md

WRITE OWNERSHIP:
You exclusively own and may modify ONLY these two files:
- `src/components/SpotlightSection.tsx`
- `src/components/ui/blur-vignette.tsx`
DO NOT modify any other files (such as FeatureOne.tsx, App.tsx, etc.).

STRICT NEGATIVE CONSTRAINTS:
- Absolutely NO wrapping of media layers (<video>, <motion.div className="hero-base-img">, <div id="reveal-img">) in wrapper divs.
- Absolutely NO applying maskImage or opacity fade on media layers.
- Do not break adjacent layouts or introduce horizontal scroll.
- No server restarts (npm run dev or killing port 3000 is prohibited; Vite HMR is active and automatically reflects changes).

IMPLEMENTATION REQUIREMENTS:
1. In `src/components/ui/blur-vignette.tsx`:
   - Add `bottomBleed?: string` to `BlurVignetteProps`.
   - Update container styling: when `bottomBleed` is truthy, use `overflow-x-clip overflow-y-visible`; otherwise default to `overflow-hidden`.
   - Update Bottom Scrim (`backdrop-filter: blur(20px)`):
     - `bottom: bottomBleed ? `-${bottomBleed}` : inset`
     - `height: bottomBleed ? `calc(${transitionLength} + ${bottomBleed})` : transitionLength`
     - `maskImage`: `linear-gradient(to top, transparent 0%, rgba(0,0,0,0.5) calc(${bottomBleed} * 0.5), black ${bottomBleed}, rgba(0,0,0,0.6) calc(${bottomBleed} + ${transitionLength} * 0.5), transparent 100%)`
     - Provide corresponding `WebkitMaskImage`.
   - Update Radial Vignette:
     - `bottom: bottomBleed ? `-${bottomBleed}` : 0`
     - Mask with `linear-gradient(to bottom, black 0%, black calc(100% - ${bottomBleed}), rgba(0,0,0,0.5) calc(100% - ${bottomBleed} * 0.5), transparent 100%)`
     - Provide corresponding `WebkitMaskImage`.

2. In `src/components/SpotlightSection.tsx`:
   - Update `<main className="hero ...">`: replace `overflow-hidden` with `overflow-x-clip overflow-y-visible z-10 bg-[#E4E4E4] ...`
   - Update `<BlurVignette>`: pass `bottomBleed="52px"`, `transitionLength="160px"`, `blur="20px"`, `radius="0px"`, `inset="0px"`, and `className="absolute top-[30vh] md:top-0 left-0 right-0 bottom-0 z-20 pointer-events-none"`.
   - Ensure media children (<video>, .hero-base-img, #reveal-img) remain 100% direct children of BlurVignette with zero wrappers and zero masks.

VERIFICATION:
- Run `npx tsc --noEmit` and confirm exit code 0.
- Document exact changes, commands executed, and verification output in `changes.md` and `handoff.md` in `/home/ddicgegd/Projects/noname/.agents/teamwork/worker_m1_r1/`.
- Send a completion message via `send_message` back to the orchestrator.
