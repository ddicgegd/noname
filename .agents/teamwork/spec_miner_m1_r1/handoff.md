# Handoff Report: Specification Mining for SpotlightSection Blur Vignette Seam Elimination

**Agent**: Specification Investigator (`teamwork_preview_spec_miner`)  
**Working Directory**: `/home/ddicgegd/Projects/noname/.agents/teamwork/spec_miner_m1_r1`  
**Recipient**: Orchestrator / Parent Agent  
**Date**: 2026-09-22  

---

## 1. Observation

1. **Authoritative Request (`ORIGINAL_REQUEST.md`)**:
   - Lines 46-48: `<main className="hero ...">`: Áp dụng `overflow-x-clip overflow-y-visible z-10 bg-[#E4E4E4] ...` để giải phóng ranh giới cắt dọc mà không sinh thanh cuộn ngang.
   - Line 48: `<BlurVignette>` với `radius="0px"`, `inset="0px"`, `transitionLength="160px"`, `bottomBleed="52px"`, `blur="20px"`, `className="absolute top-[30vh] md:top-0 left-0 right-0 bottom-0 z-20 pointer-events-none"`.
   - Lines 51-52: Bổ sung prop tùy chọn: `bottomBleed?: string` vào `BlurVignetteProps`. Container chính: khi có `bottomBleed`, dùng `overflow-x-clip overflow-y-visible`; mặc định dùng `overflow-hidden`.
   - Lines 53-56: Bottom Scrim (`backdrop-filter: blur(20px)`):
     - `bottom: bottomBleed ? -${bottomBleed} : inset`
     - `height: bottomBleed ? calc(${transitionLength} + ${bottomBleed}) : transitionLength`
     - `maskImage`: `linear-gradient(to top, transparent 0%, rgba(0,0,0,0.5) calc(${bottomBleed} * 0.5), black ${bottomBleed}, rgba(0,0,0,0.6) calc(${bottomBleed} + ${transitionLength} * 0.5), transparent 100%)`
   - Lines 57-59: Radial Vignette:
     - `bottom: bottomBleed ? -${bottomBleed} : 0`
     - `linear-gradient(to bottom, black 0%, black calc(100% - ${bottomBleed}), rgba(0,0,0,0.5) calc(100% - ${bottomBleed} * 0.5), transparent 100%)`
   - Lines 61-65: Strict Negative Constraints: Giữ nguyên 100% media layers là con trực tiếp của `<BlurVignette>`, không bọc trong wrapper div; không áp đặt bất kỳ filter/mask mờ nào lên các media elements; không để dải mờ chạm vào thẻ kính hoặc text của `FeatureOne`.
   - Lines 70-81: Acceptance criteria: `npx tsc --noEmit` code 0; `scrollWidth === innerWidth` on breakpoints 1920, 1440, 1108, 768, 375px; seam at $y = 937.2\text{px}$ eliminated; 100% video/image clarity preserved; $\ge 12\text{px}$ clearance to glass card.

2. **Existing Implementation Observations**:
   - `src/components/SpotlightSection.tsx:213-216`:
     `<main ref={containerRef} className="hero relative w-full overflow-hidden bg-[#E4E4E4] min-height-screen h-screen min-h-[600px] md:min-h-[800px] select-none">` currently has `overflow-hidden` and lacks `z-10`.
   - `src/components/SpotlightSection.tsx:234-240`:
     `<BlurVignette radius="0px" inset="0px" transitionLength="160px" blur="20px" className="absolute top-[30vh] md:top-0 left-0 right-0 bottom-0 z-20 pointer-events-none">` currently lacks `bottomBleed="52px"`.
   - `src/components/SpotlightSection.tsx:242-279`:
     Media layers (`<video>`, `<motion.div className="hero-base-img">`, `<div id="reveal-img">`) are currently direct children of `<BlurVignette>` with zero wrapper div.
   - `src/components/ui/blur-vignette.tsx:4-14`:
     `BlurVignetteProps` currently lacks `bottomBleed?: string`.
   - `src/components/ui/blur-vignette.tsx:35`:
     Container currently hardcodes `className={cn("relative overflow-hidden", classname, className)}`.
   - `src/components/ui/blur-vignette.tsx:64-79`:
     Bottom Scrim currently uses fixed `bottom: inset`, `height: transitionLength`, and simple 3-stop mask `linear-gradient(to top, black 0%, rgba(0,0,0,0.6) 50%, transparent 100%)`.
   - `src/components/ui/blur-vignette.tsx:118-124`:
     Radial Vignette currently uses `className="pointer-events-none absolute inset-0 z-20"` without `bottom` override or linear-gradient fade mask.
   - `src/components/FeatureOne.tsx:182-183`:
     `<section id="features" className="py-16 px-4 sm:px-8 md:px-16 relative">` has `py-16` ($4\text{rem} = 64\text{px}$) padding top, and the glass card is the child div immediately inside it.
   - Codebase type check: `npx tsc --noEmit` runs with exit code 0 and 0 errors.

---

## 2. Logic Chain

1. **Root Cause Identification**:
   - From `SpotlightSection.tsx:215` and `blur-vignette.tsx:35`, both `<main>` and `<BlurVignette>` use `overflow-hidden`.
   - Any visual effect rendered inside `<BlurVignette>` is clipped at the hero section's bottom boundary. This results in the hard seam line at $y = 937.2\text{px}$ directly above `FeatureOne`.

2. **Seam Elimination Mechanics**:
   - By changing `<main>` and `BlurVignette` container classes to `overflow-x-clip overflow-y-visible` (per `ORIGINAL_REQUEST.md:47, 52`), the vertical clipping boundary is released while horizontal clipping is strictly enforced, preventing horizontal scrollbars.
   - Adding `z-10` to `<main>` guarantees proper stacking context above the following flow.

3. **Mathematical Alignment of Bleed and Padding**:
   - `FeatureOne` defines `py-16` (64px) top padding (`FeatureOne.tsx:182`).
   - `bottomBleed` is set to `52px` (`ORIGINAL_REQUEST.md:48`).
   - The bleed extends 52px past the hero bottom, leaving $64\text{px} - 52\text{px} = 12\text{px}$ of untouched buffer before `FeatureOne`'s glass card (`FeatureOne.tsx:183`). This satisfies the minimum 12px clearance requirement with zero collision.

4. **Continuous Optical Blending via Dual Gradients**:
   - The Bottom Scrim height is extended to `calc(${transitionLength} + ${bottomBleed})` = `calc(160px + 52px)` = `212px`, positioned at `-${bottomBleed}` (`-52px`).
   - The 5-stop mask `linear-gradient(to top, transparent 0%, rgba(0,0,0,0.5) calc(${bottomBleed} * 0.5), black ${bottomBleed}, rgba(0,0,0,0.6) calc(${bottomBleed} + ${transitionLength} * 0.5), transparent 100%)` centers 100% blur (`black`) exactly at `${bottomBleed}` ($0\text{px}$ seam), smoothly tapering down to `transparent 0%` into `FeatureOne`, and up to `transparent 100%` into `SpotlightSection`.
   - The Radial Vignette is extended to `bottom: bottomBleed ? -${bottomBleed} : 0`, and masked with `linear-gradient(to bottom, black 0%, black calc(100% - ${bottomBleed}), rgba(0,0,0,0.5) calc(100% - ${bottomBleed} * 0.5), transparent 100%)`. This maintains 100% vignette shading inside `SpotlightSection`, then dissolves it across the 52px bleed into complete transparency at the bottom edge.

5. **Negative Constraints Conformance**:
   - Media layers (`<video>`, `<motion.div className="hero-base-img">`, `<div id="reveal-img">`) in `SpotlightSection.tsx:242-279` remain completely untouched, unwrapped, and free of direct filters or masks.
   - The changes are localized entirely to `src/components/SpotlightSection.tsx` and `src/components/ui/blur-vignette.tsx`. No changes to `FeatureOne.tsx` or `App.tsx` are required.

---

## 3. Caveats

- **No caveats**: All formulas, prop signatures, and layout constraints are authoritatively specified in `ORIGINAL_REQUEST.md` and confirmed against existing source files.
- When applying styles, both standard properties (`maskImage`, `backdropFilter`) and WebKit prefixes (`WebkitMaskImage`, `WebkitBackdropFilter`) must be provided for cross-browser fidelity.
- When `bottomBleed` is not provided, `blur-vignette.tsx` must fall back cleanly to original behavior (`overflow-hidden`, standard scrims, standard vignette).

---

## 4. Conclusion

The specification is fully mined, verified, and ready for immediate implementation by the Engineering Frontend Developer.
The implementation involves exactly two target files:
1. `src/components/ui/blur-vignette.tsx`:
   - Extend `BlurVignetteProps` with `bottomBleed?: string`.
   - Conditionally apply `bottomBleed ? "overflow-x-clip overflow-y-visible" : "overflow-hidden"`.
   - Update Bottom Scrim `bottom`, `height`, `maskImage`, and `WebkitMaskImage` with the 5-stop formula.
   - Update Radial Vignette `bottom`, `maskImage`, and `WebkitMaskImage` with the 4-stop formula.
2. `src/components/SpotlightSection.tsx`:
   - Update `<main>` classes: replace `overflow-hidden` with `overflow-x-clip overflow-y-visible z-10`.
   - Update `<BlurVignette>`: add `bottomBleed="52px"`.
   - Leave media child layers 100% unwrapped and unmodified.

---

## 5. Verification Method

1. **Syntactic Validity**:
   ```bash
   npx tsc --noEmit
   ```
   Must complete with exit code 0.

2. **Layout & Multi-Breakpoint Integrity**:
   Inspect `document.documentElement.scrollWidth === window.innerWidth` across:
   - 1920px (Desktop Large)
   - 1440px (Desktop Standard)
   - 1108px (Laptop)
   - 768px (Tablet)
   - 375px (Mobile)
   Confirm zero horizontal scrollbar appears.

3. **Negative Constraints Audit**:
   Verify lines 240-280 of `src/components/SpotlightSection.tsx`:
   - Confirm `<video>`, `<motion.div className="hero-base-img">`, and `<div id="reveal-img">` are direct children of `<BlurVignette>`.
   - Confirm no wrapping `div` was introduced.
   - Confirm no `maskImage` was added to any media elements.

4. **Visual & Optical Verification**:
   Inspect the interface at the boundary between `SpotlightSection` and `FeatureOne`:
   - Confirm the hard cutoff seam line ($y = 937.2\text{px}$) is eliminated.
   - Confirm the blur extends 52px down and ends $\ge 12\text{px}$ above `FeatureOne`'s glass card.
