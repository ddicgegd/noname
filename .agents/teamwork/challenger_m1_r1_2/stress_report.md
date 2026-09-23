# Stress & Layout Verification Report

**Author**: Stress & Layout Challenger (`teamwork_preview_challenger`)  
**Target Milestone**: M1 (Seamless Blur Vignette Integration)  
**Date**: 2026-09-22  

---

## Challenge Summary

**Overall risk assessment**: **LOW**

All empirical stress tests and adversarial verification vectors confirmed that the implementation in `src/components/SpotlightSection.tsx` and `src/components/ui/blur-vignette.tsx` strictly adheres to negative constraints, preserves mathematical clearances, maintains layout integrity without horizontal overflow, and respects fallback behavior.

---

## Challenges Evaluated

### Challenge 1: AST / DOM Layer Wrapping Intrusion
- **Assumption challenged**: Media layers (`<video>`, `<motion.div className="hero-base-img">`, and `<div id="reveal-img">`) might be inadvertently wrapped in a container `div` or fragmented by intermediate layout abstractions to handle the bleed.
- **Attack scenario**: An extra wrapper `<div>` or layout parent inside `<BlurVignette>` would violate strict negative constraints and disrupt absolute positioning / z-index stacking of the spotlight reveal interaction.
- **Empirical test**: Executed TypeScript Compiler API AST traversal over `src/components/SpotlightSection.tsx`.
- **Finding**: `<BlurVignette>` has exactly 3 direct child elements in order:
  1. `<video className="absolute inset-0 w-full h-full object-cover opacity-90">`
  2. `<motion.div className="hero-base-img absolute inset-0 ...">`
  3. `<div id="reveal-img" className="hero-reveal-img absolute inset-0 ...">`
  Zero wrapper divs were detected (0 found).
- **Result**: **PASS** (Zero wrapper divs confirmed).

### Challenge 2: Media Layer Mask Contamination (Negative Constraint)
- **Assumption challenged**: The worker might have applied synthetic `maskImage`, `opacity` transitions, or backdrop filters directly onto media layers instead of scoping them strictly to vignette overlay scrims.
- **Attack scenario**: Opacity fade on the video or base image degrades image sharpness and visual contrast before reaching the seam.
- **Empirical test**: Programmatic inspection of AST attributes and style objects for `<video>`, `<motion.div className="hero-base-img">`, and `<div id="reveal-img">`.
- **Finding**:
  - `<video>` has no `maskImage`, `WebkitMaskImage`, or style object.
  - `<motion.div className="hero-base-img">` has only `backgroundImage: url(...)` and initial/animate/transition animation props.
  - `<div id="reveal-img">` has only `backgroundImage` and the interactive cursor spotlight `...maskStyle`. No bottom fade gradient mask is applied.
- **Result**: **PASS** (Zero masks or opacity fades on media layers).

### Challenge 3: Spatial Intrusion & Glass Card Occlusion (Clearance Stress)
- **Assumption challenged**: The 52px bottom bleed might encroach upon the glass card of `FeatureOne`, causing visual clipping, blurring of text, or blurred borders on the card.
- **Attack scenario**: `FeatureOne`'s top padding might be less than 64px, or margin collapse might pull the card within the 52px bleed zone, leading to card occlusion.
- **Empirical test**:
  - Static AST inspection of `src/components/FeatureOne.tsx` (`<section id="features" className="py-16 ...">`).
  - Mathematical calculation: `py-16` = 64px top padding. `64px - 52px = 12px` physical clearance.
  - Live headless Chrome DevTools Protocol (CDP) DOM measurement at 1440px viewport:
    - Hero bottom: `900px`
    - Bottom scrim bottom: `952px` (exactly +52px bleed)
    - FeatureOne top: `935px`
    - Glass Card top: `999px`
    - Physical distance from bottom of scrim (952px) to top of glass card (999px) = `47px` in live render (well above minimum 12px constraint).
  - Scrim gradient stop profile: At y = +52px (the bleed termination edge), the mask is `transparent 0%`. Blur opacity is 0.00 at and beyond 52px.
- **Result**: **PASS** (At least 12px clearance verified mathematically and empirically; no card occlusion).

### Challenge 4: Fallback Degradation (Omitted `bottomBleed`)
- **Assumption challenged**: Omitting `bottomBleed` might cause invalid CSS styles (`undefined` in `calc()` or `bottom: undefined`), broken overflow clipping, or broken default vignette behavior.
- **Attack scenario**: Existing or third-party usages of `<BlurVignette>` without `bottomBleed` fail or break layout.
- **Empirical test**: Rendered `BlurVignette` via `react-dom/server` with and without `bottomBleed`.
- **Finding**:
  - When `bottomBleed` is omitted:
    - Root container className: `relative overflow-hidden` (strict fallback, no `overflow-x-clip`).
    - Bottom scrim `style.bottom`: `0px` (or `inset`).
    - Bottom scrim `style.height`: `120px` (or `transitionLength`).
    - Bottom scrim mask: `linear-gradient(to top, black 0%, rgba(0,0,0,0.6) 50%, transparent 100%)`.
    - Radial vignette: `bottom: 0`, and no maskImage style applied.
  - When `bottomBleed="52px"`:
    - Root container className: `relative overflow-x-clip overflow-y-visible`.
    - Bottom scrim `style.bottom`: `-52px`.
    - Bottom scrim `style.height`: `calc(160px + 52px)`.
    - Bottom scrim mask: 5-stop mathematical gradient.
    - Radial vignette: `bottom: -52px` and 4-stop fade mask.
- **Result**: **PASS** (Flawless fallback compliance).

### Challenge 5: Multi-Viewport Horizontal Spill (Horizontal Scrollbar)
- **Assumption challenged**: `overflow-y-visible` on the hero section might inadvertently permit horizontal overflow on various device widths.
- **Attack scenario**: `scrollWidth > innerWidth` triggers unwanted horizontal scroll on mobile/desktop.
- **Empirical test**: Headless Google Chrome automation testing across 5 viewports: 1920px, 1440px, 1108px, 768px, and 375px.
- **Finding**:
  - 1920px: `scrollWidth === innerWidth` (1920 === 1920) -> PASS
  - 1440px: `scrollWidth === innerWidth` (1440 === 1440) -> PASS
  - 1108px: `scrollWidth === innerWidth` (1108 === 1108) -> PASS
  - 768px: `scrollWidth === innerWidth` (768 === 768) -> PASS
  - 375px: `scrollWidth === innerWidth` (375 === 375) -> PASS
- **Result**: **PASS** (Zero horizontal scroll across all breakpoints).

---

## Stress Test Results Summary

| Test Vector | Target Element / Property | Expected Behavior | Actual Behavior | Verdict |
|---|---|---|---|---|
| AST Direct Children | `BlurVignette` in `SpotlightSection.tsx` | Exactly 3 media children (`<video>`, `<motion.div>`, `<div>`), 0 wrapper divs | 3 direct children, 0 wrappers | **PASS** |
| Negative Constraints | Media child elements | No `maskImage` or opacity fades on media | Zero masks on media | **PASS** |
| Mathematical Clearance | Hero Bleed (52px) vs FeatureOne (64px) | $\ge 12\text{px}$ clearance to glass card | $64 - 52 = 12\text{px}$ (theory), $47\text{px}$ (live CDP) | **PASS** |
| Fallback Integrity | `BlurVignette` without `bottomBleed` | Default `overflow-hidden`, standard inset & masks | Exact match to pre-bleed spec | **PASS** |
| Horizontal Overflow | `scrollWidth === innerWidth` (5 viewports) | True for 1920, 1440, 1108, 768, 375px | True for all 5 breakpoints | **PASS** |
| Type Check | Static analysis | `tsc --noEmit` exits with 0 | Exit code 0, 0 errors | **PASS** |
| Build Check | Vite production build | `vite build` completes successfully | Built successfully in 7.32s | **PASS** |

---

## Unchallenged Areas

- **Backend GraphQL / REST Endpoints**: Out of scope for Milestone M1 (Frontend visual integration).
- **Other pages (`/pricing`, `/product`)**: Confined strictly to hero section and `FeatureOne` boundary as mandated.
