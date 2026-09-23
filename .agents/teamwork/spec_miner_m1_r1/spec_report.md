# Authoritative Specification Report: SpotlightSection Blur Vignette Seam Elimination

**Investigator**: Specification Investigator (`teamwork_preview_spec_miner`)  
**Working Directory**: `/home/ddicgegd/Projects/noname/.agents/teamwork/spec_miner_m1_r1`  
**Date**: 2026-09-22  
**Target Milestone**: M1 (Seamless Blur Vignette Integration)  
**Authoritative Sources**:
1. `/home/ddicgegd/Projects/noname/.agents/teamwork/ORIGINAL_REQUEST.md`
2. `/home/ddicgegd/Projects/noname/.agents/teamwork/orchestrator/PROJECT.md`
3. `/home/ddicgegd/Projects/noname/src/components/SpotlightSection.tsx`
4. `/home/ddicgegd/Projects/noname/src/components/ui/blur-vignette.tsx`
5. `/home/ddicgegd/Projects/noname/src/components/FeatureOne.tsx`
6. `/home/ddicgegd/Projects/noname/src/App.tsx`

---

## 1. Specification Overview & Problem Diagnosis

### The Problem
The hero section `<SpotlightSection>` directly precedes `<FeatureOne>` on the landing page (`src/App.tsx:435-439`).
`<SpotlightSection>` has a `<main className="hero ... overflow-hidden ...">` container, inside which `<BlurVignette>` wraps media elements (`<video>`, `<motion.div className="hero-base-img">`, `<div id="reveal-img">`).
Because both `<main>` and `<BlurVignette>` currently enforce `overflow-hidden`, all backdrop-filter blur scrims and radial vignette shading are clipped abruptly at the bottom boundary of the hero section ($y = 937.2\text{px}$ on standard 1080p display). This produces an artificial, jarring "hard cutoff seam" against the `#E4E4E4` background and adjacent section padding.

### The Solution Strategy
Extend the bottom blur overlay and radial vignette downward into the top padding of `FeatureOne` by `bottomBleed = "52px"`, while switching vertical container clipping to `overflow-y-visible` and horizontal clipping to `overflow-x-clip` (preventing any horizontal scroll).
`FeatureOne` begins with `py-16` ($4\text{rem} = 64\text{px}$), so a $52\text{px}$ downward bleed leaves a safe margin of $64\text{px} - 52\text{px} = 12\text{px}$ before the top border of the `FeatureOne` glass card, preventing any overlap with text or interactive elements.

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | R1: Hero Container | `<main className="hero ...">` Overflow & Stacking | Replace `overflow-hidden` with `overflow-x-clip overflow-y-visible` and add `z-10` to allow vertical bleeding while isolating horizontal scroll | CSS classes on `<main>` element in `SpotlightSection.tsx` | Vertical bleed rendered into adjacent section; zero horizontal scrollbar | If `overflow-hidden` retained, bleed is clipped; if `overflow-visible`, horizontal scroll triggers | `ORIGINAL_REQUEST.md` § R1, `SpotlightSection.tsx:213-216` |
| 2 | R1: Hero Component | `<BlurVignette>` Bleed Configuration | Supply `radius="0px"`, `inset="0px"`, `transitionLength="160px"`, `bottomBleed="52px"`, `blur="20px"`, and positioning classes | Props passed to `<BlurVignette>` in `SpotlightSection.tsx` | Downward bleed parameters activated in child component | Missing `bottomBleed` falls back to standard non-bleeding vignette | `ORIGINAL_REQUEST.md` § R1, `PROJECT.md` § Feature Inventory #1 |
| 3 | R2: Component Props | `BlurVignetteProps.bottomBleed?: string` | Add optional prop `bottomBleed?: string` to component interface | `bottomBleed?: string` in `BlurVignetteProps` | Typed interface enabling dynamic or fixed bleed distance (e.g. `"52px"`) | TS compiler error if omitted when passed by caller | `ORIGINAL_REQUEST.md` § R2, `PROJECT.md` § Interface Contracts |
| 4 | R2: Container Overflow | `BlurVignette` Container Clipping Mode | Conditionally apply `overflow-x-clip overflow-y-visible` when `bottomBleed` is set; fallback to `overflow-hidden` | `bottomBleed` prop presence | `cn("relative", bottomBleed ? "overflow-x-clip overflow-y-visible" : "overflow-hidden", ...)` | If static `overflow-hidden` persists, bleed cannot escape container | `ORIGINAL_REQUEST.md` § R2, `blur-vignette.tsx:34-41` |
| 5 | R2: Bottom Scrim Offset & Height | Bottom Scrim Geometry Expansion | Position Bottom Scrim with `bottom: bottomBleed ? -${bottomBleed} : inset` and `height: bottomBleed ? calc(${transitionLength} + ${bottomBleed}) : transitionLength` | `bottomBleed`, `transitionLength`, `inset` | Bottom Scrim div extends past bottom edge by `bottomBleed`, increasing total height to encompass transition + bleed | Invalid CSS syntax in `calc()` causes backdrop filter to fail to render | `ORIGINAL_REQUEST.md` § R2, `blur-vignette.tsx:64-79` |
| 6 | R2: Bottom Scrim Mask | 5-Stop Continuous Optical Blur Mask | Dual-sided progressive fade mask with 5 color stops: `linear-gradient(to top, transparent 0%, rgba(0,0,0,0.5) calc(${bottomBleed} * 0.5), black ${bottomBleed}, rgba(0,0,0,0.6) calc(${bottomBleed} + ${transitionLength} * 0.5), transparent 100%)` | `bottomBleed`, `transitionLength` | `maskImage` & `WebkitMaskImage` styles on Bottom Scrim | Missing vendor prefix breaks Safari; incorrect stop sequence produces hard line | `ORIGINAL_REQUEST.md` § R2, `blur-vignette.tsx:76-77` |
| 7 | R2: Radial Vignette Bleed Offset | Radial Vignette Geometry Extension | Extend Radial Vignette bottom down by setting `bottom: bottomBleed ? -${bottomBleed} : 0` (or `inset`) | `bottomBleed` | Radial shading extends down across the seam | Vignette cutoff at $y=0$ if bottom remains $0$ | `ORIGINAL_REQUEST.md` § R2, `blur-vignette.tsx:118-124` |
| 8 | R2: Radial Vignette Mask | Radial Vignette Linear Fade Mask | Apply 4-stop mask: `linear-gradient(to bottom, black 0%, black calc(100% - ${bottomBleed}), rgba(0,0,0,0.5) calc(100% - ${bottomBleed} * 0.5), transparent 100%)` | `bottomBleed` | `maskImage` & `WebkitMaskImage` on Radial Vignette div | Without mask, dark shading abruptly ends at bottom bleed edge | `ORIGINAL_REQUEST.md` § R2, `blur-vignette.tsx:122` |
| 9 | R3: Negative Constraint | Direct Media Layer Preservation | Media elements (`<video>`, `<motion.div className="hero-base-img">`, `<div id="reveal-img">`) must remain direct children of `<BlurVignette>` with zero wrapper `div` | Code structure in `SpotlightSection.tsx` | DOM tree fidelity maintained; no artificial nesting | Wrapping elements breaks CSS absolute positioning and motion animations | `ORIGINAL_REQUEST.md` § R3, `AGENTS.md` § 1.10 |
| 10 | R3: Negative Constraint | Zero Media Layer Filters / Masks | No `maskImage`, `backdropFilter`, or opacity fades may be added directly to the media elements | Media layer styling in `SpotlightSection.tsx` | Video and background image retain 100% color fidelity and contrast | Adding masks to media washes out forest video/image | `ORIGINAL_REQUEST.md` § R3, `AGENTS.md` § 1.10 |
| 11 | R3: Negative Constraint | Neighbor Layout Isolation & Clearance | No modification to adjacent sections (`FeatureOne.tsx`, etc.); minimum 12px clearance to glass card | Layout positioning | $64\text{px} - 52\text{px} = 12\text{px}$ clearance buffer intact | Bleed $> 64\text{px}$ overlaps glass card | `ORIGINAL_REQUEST.md` § R3, `FeatureOne.tsx:182-184` |

---

## 3. Mathematical Gradient Formulas & Optical Mechanics

### A. Bottom Scrim Mask Analysis
The formula specified for Bottom Scrim `maskImage` / `WebkitMaskImage`:
```css
linear-gradient(
  to top,
  transparent 0%,
  rgba(0, 0, 0, 0.5) calc(${bottomBleed} * 0.5),
  black ${bottomBleed},
  rgba(0, 0, 0, 0.6) calc(${bottomBleed} + ${transitionLength} * 0.5),
  transparent 100%
)
```
With parameters `bottomBleed = "52px"`, `transitionLength = "160px"`, total height = $52\text{px} + 160\text{px} = 212\text{px}$:
1. **0% (0px from bottom edge, at $-52\text{px}$ into FeatureOne)**: `transparent 0%`. The backdrop blur has 0% opacity here, tapering into nothingness.
2. **`calc(52px * 0.5)` = 26px from bottom edge ($-26\text{px}$ into FeatureOne)**: `rgba(0,0,0,0.5)`. Half blur strength provides smooth ramp-up.
3. **`52px` from bottom edge ($0\text{px}$ at the exact seam boundary)**: `black 52px`. Full 100% blur mask opacity at the physical seam where the two sections meet! This guarantees complete diffusion of the seam line.
4. **`calc(52px + 160px * 0.5)` = 132px from bottom edge ($+80\text{px}$ inside SpotlightSection)**: `rgba(0,0,0,0.6)`. Progressive upward fade out of blur overlay.
5. **100% (212px from bottom edge, $+160\text{px}$ inside SpotlightSection)**: `transparent 100%`. Seamless blend into crisp video/image content.

### B. Radial Vignette Mask Analysis
The formula specified for Radial Vignette `maskImage` / `WebkitMaskImage`:
```css
linear-gradient(
  to bottom,
  black 0%,
  black calc(100% - ${bottomBleed}),
  rgba(0, 0, 0, 0.5) calc(100% - ${bottomBleed} * 0.5),
  transparent 100%
)
```
With total element height extending $52\text{px}$ past the hero bottom:
1. **From 0% down to `calc(100% - 52px)`**: `black`. Full opacity (100%) of the radial vignette shading across the entire original hero section area.
2. **From `calc(100% - 52px)` to `calc(100% - 26px)`**: Gradual fade from `black` to `rgba(0,0,0,0.5)` over the upper half of the bleed region.
3. **From `calc(100% - 26px)` to `100%`**: Gradual fade to `transparent 100%` at the bottom edge.
This guarantees the dark radial shading dissolves seamlessly before reaching the end of the bleed zone, leaving zero hard edge and zero shadow on `FeatureOne`'s glass card.

---

## 4. Edge Cases & Boundary Conditions

| # | Feature | Input / Condition | Expected / Observed Behavior | Handling / Safeguard |
|---|---------|-------------------|------------------------------|----------------------|
| E1 | `BlurVignette` | `bottomBleed` is `undefined` (omitted) | Fallback to original behavior: container `overflow-hidden`, bottom scrim at `bottom: inset`, height `transitionLength`, original mask, radial vignette without bottom mask | Use ternary operators: `bottomBleed ? ... : ...` to guarantee 100% backwards compatibility for other usages |
| E2 | Container Overflow | `overflow-x-clip` vs `overflow-x-hidden` | `overflow-x-clip` creates an overflow clip boundary on horizontal axis without generating a scroll container, allowing `overflow-y-visible` to spill vertically without triggering horizontal scroll | Explicit Tailwind classes: `overflow-x-clip overflow-y-visible` |
| E3 | FeatureOne Proximity | `bottomBleed = "52px"`, `FeatureOne` padding `py-16` (64px) | Bleed extends 52px down. Remaining buffer to glass card = $64\text{px} - 52\text{px} = 12\text{px}$. Glass card is never touched or covered by blur | Verified via inspection of `FeatureOne.tsx:182-184` |
| E4 | Viewport Resizing | Viewports: 1920px, 1440px, 1108px, 768px, 375px | Layout must never generate horizontal scroll: `document.documentElement.scrollWidth === window.innerWidth` | Enforced by `overflow-x-clip` on both `<main className="hero ...">` and `BlurVignette` |
| E5 | Vendor Prefixes | Safari / WebKit browsers | Both standard `maskImage` and `WebkitMaskImage`, standard `backdropFilter` and `WebkitBackdropFilter` must be specified synchronously | Both CSS properties paired on all scrims and vignette divs |
| E6 | Stacking Context | Hero `z-10`, Scrim `z-20`, Vignette `z-20`, Content `z-30` | Interactive foreground (`hero-content-inner`, buttons, text) remains pointer-events capable; blur overlays are `pointer-events-none` | Verified in `SpotlightSection.tsx:281-306` |
| E7 | CSS `calc()` with unit arithmetic | `calc(${bottomBleed} * 0.5)` with `bottomBleed="52px"` | Standard CSS resolves `calc(52px * 0.5)` to `26px`. Compatible with CSS Values and Units Level 3/4 across all modern browsers | Tested formula syntax conforms directly to standard CSS spec |

---

## 5. Acceptance Criteria Matrix

| Criterion ID | Category | Requirement | Target | Verification Method |
|--------------|----------|-------------|--------|---------------------|
| AC-1 | Syntactic Validity | TypeScript Compilation | Exit code 0, 0 type errors | `npx tsc --noEmit` |
| AC-2 | Layout Integrity | Horizontal Scroll Prevention | `scrollWidth === innerWidth` | Multi-viewport check across 1920, 1440, 1108, 768, 375px |
| AC-3 | Boundary Bleeding | Bottom Bleed Extension | Overlays extend 52px past bottom | DOM inspection of computed styles on bottom scrim & vignette |
| AC-4 | Optical Blending | Seam Elimination | Hard line at $y = 937.2\text{px}$ eliminated | Visual rendered output inspection & optical diffusion check |
| AC-5 | Media Layer Purity | Zero wrappers, zero filters on media | Media elements unchanged | Code inspection of `SpotlightSection.tsx` lines 240-280 |
| AC-6 | Safety Clearance | Separation from FeatureOne Card | $\ge 12\text{px}$ clearance | Geometry calculation ($64\text{px} - 52\text{px} = 12\text{px}$) |
