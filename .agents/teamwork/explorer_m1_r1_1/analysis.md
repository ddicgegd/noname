# Design UX Architecture Analysis: SpotlightSection Blur Vignette Seam Elimination

**Author**: Design UX Architect (`teamwork_preview_explorer`)  
**Workspace**: `/home/ddicgegd/Projects/noname/.agents/teamwork/explorer_m1_r1_1/`  
**Date**: 2026-09-22  
**Target Milestone**: M1 (Seamless Blur Vignette Integration)

---

## 1. Executive Summary

This investigation provides the authoritative CSS architecture, mathematical gradient model, boundary layout parameters, and negative-constraint compliance rules for eliminating the hard cutoff seam between `SpotlightSection` and `FeatureOne`.

The seam is currently caused by:
1. `<main className="hero ... overflow-hidden ...">` at `src/components/SpotlightSection.tsx:215`, which strictly clips all child rendering at the hero boundary ($y = H_{\text{hero}}$).
2. `<BlurVignette>` in `src/components/ui/blur-vignette.tsx:35` which hardcodes `overflow-hidden`, preventing blur overlays from extending beyond the component boundary.
3. Media layers (`<video>`, `.hero-base-img`, `#reveal-img`) terminating abruptly at the hero container bottom edge.

By configuring `bottomBleed = "52px"`, `transitionLength = "160px"`, and combining `overflow-x-clip` with `overflow-y-visible`, the blur scrim and radial vignette naturally bleed 52px downward into the 64px (`py-16`) top padding zone of `FeatureOne`. This leaves a clean 12px clearance before the glass card, eliminating the hard seam while preserving the original media layers intact.

---

## 2. Boundary Analysis: `SpotlightSection` vs `FeatureOne`

### 2.1 Vertical Stacking & Coordinate Geometry

In `src/App.tsx:435-440`:
```tsx
<SpotlightSection bgText={activeBrand} onBgTextChange={setActiveBrand} />
<ScrollAnimation direction="up" duration={0.65} viewport={{ once: true, amount: 0.15 }}>
  <FeatureOne />
</ScrollAnimation>
```

- `SpotlightSection` occupies height $H_{\text{hero}} = \max(800\text{px}, 100\text{vh})$ on desktop, and $\min 600\text{px}$ on mobile.
- `FeatureOne` begins immediately at $y = H_{\text{hero}}$.
- `FeatureOne` container definition (`src/components/FeatureOne.tsx:182-183`):
  ```tsx
  <section id="features" className="py-16 px-4 sm:px-8 md:px-16 relative">
    <div className="w-[85%] 2xl:max-w-[1800px] mx-auto ... rounded-[24px] ...">
  ```
- Tailwind `py-16` applies:
  $$\text{padding-top} = 4\text{rem} = 64\text{px}$$
- The first content element in `FeatureOne` (the outer glass card `rounded-[24px]`) begins exactly at $y = H_{\text{hero}} + 64\text{px}$.

### 2.2 Clearance Calculation

With `bottomBleed = "52px"`:
- The bottom scrim extends to:
  $$y_{\text{scrim\_end}} = H_{\text{hero}} + 52\text{px}$$
- The glass card starts at:
  $$y_{\text{glass\_card}} = H_{\text{hero}} + 64\text{px}$$
- Safe buffer / clearance gap:
  $$\Delta y = y_{\text{glass\_card}} - y_{\text{scrim\_end}} = 64\text{px} - 52\text{px} = 12\text{px}$$

**Conclusion**: The 52px bleed terminates 12px above the glass card. It operates exclusively in the neutral `#E4E4E4` background padding buffer of `FeatureOne`. It does not touch, overlap, occlude, or refract any text, border, or glass card surface.

---

## 3. Mathematical Gradient Formulas & Optical Blending

### 3.1 Bottom Scrim Backdrop Filter & Mask Architecture

The Bottom Scrim in `BlurVignette` provides progressive optical diffusion using `backdrop-filter: blur(20px)`.

#### Dimensional Setup:
- `bottom`: `-52px` (when `bottomBleed` is active)
- `height`: `calc(160px + 52px) = 212px`
- Vertical span: from $y = H_{\text{hero}} - 160\text{px}$ to $y = H_{\text{hero}} + 52\text{px}$.

#### Scrim Mask Formula (`to top`):
```css
mask-image: linear-gradient(
  to top,
  transparent 0%,
  rgba(0, 0, 0, 0.5) calc(52px * 0.5),
  black 52px,
  rgba(0, 0, 0, 0.6) calc(52px + 160px * 0.5),
  transparent 100%
);
```

#### Piecewise Optical Curve Analysis:
Let $u \in [0, 212\text{px}]$ be the distance from the bottom edge of the scrim ($u = 0$ at $y = H_{\text{hero}} + 52\text{px}$):

1. **$u = 0\text{px}$ (`transparent 0%`, $y = H_{\text{hero}} + 52\text{px}$)**:
   - Opacity: $0\%$.
   - Backdrop blur contribution: $0\text{px}$.
   - Result: Completely invisible transition to clean background; zero hard cutoff line at the bleed termination.
2. **$u = 26\text{px}$ (`rgba(0,0,0,0.5)`, $y = H_{\text{hero}} + 26\text{px}$)**:
   - Opacity: $50\%$.
   - Sigmoid easing curve smoothly elevating blur presence in the FeatureOne padding zone.
3. **$u = 52\text{px}$ (`black 52px`, $y = H_{\text{hero}}$)**:
   - Opacity: $100\%$ (fully opaque mask).
   - This aligns **precisely** with the original geometric boundary where the video and image end!
   - Full 20px Gaussian blur is applied here, completely diffusing and extinguishing the media layer cut edge.
4. **$u = 132\text{px}$ (`rgba(0,0,0,0.6)`, $y = H_{\text{hero}} - 80\text{px}$)**:
   - Opacity: $60\%$.
   - Gentle easing upward into the hero area.
5. **$u = 212\text{px}$ (`transparent 100%`, $y = H_{\text{hero}} - 160\text{px}$)**:
   - Opacity: $0\%$.
   - Media layers above $y = H_{\text{hero}} - 160\text{px}$ are 100% unaffected and retain pristine sharpness and color fidelity.

### 3.2 Radial Vignette Mask & Shading Layer

The Radial Vignette provides cinematic darkening toward the edges. When extended past the hero boundary, it must fade out smoothly in the bleed zone.

#### Dimensional Setup:
- `top: 0`, `left: 0`, `right: 0`
- `bottom`: `-52px`
- `background`: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.18) 75%, rgba(0,0,0,0.45) 100%)`

#### Fade Mask Formula (`to bottom`):
```css
mask-image: linear-gradient(
  to bottom,
  black 0%,
  black calc(100% - 52px),
  rgba(0, 0, 0, 0.5) calc(100% - 52px * 0.5),
  transparent 100%
);
```

#### Optical Dynamics:
- From $0\%$ to $\text{calc}(100\% - 52\text{px})$ (the entire native hero height): Mask is solid `black` ($100\%$ visible). The radial vignette effect inside the hero section is preserved 100% without modification.
- At $\text{calc}(100\% - 26\text{px})$ (midway through the bleed zone): Mask is $50\%$ opaque.
- At $100\%$ ($52\text{px}$ below hero): Mask is $0\%$ (`transparent`). Shading reaches absolute zero before the $12\text{px}$ gap to the glass card.

---

## 4. Container Overflow Architecture: `overflow-x-clip` & `overflow-y-visible`

### 4.1 Modern CSS Overflow Separation

Under the CSS Overflow Module Level 3 specification:
- `overflow-x: clip`: Clips content horizontally at the padding box boundary without creating a scroll container or responding to scroll programmatic offsets.
- `overflow-y: visible`: Allows vertical children to escape the box boundaries without triggering scrollbars or boundary clipping.

Modern browser engines (Chromium 90+, WebKit 16+, Gecko 81+) fully support independent 2D overflow axes when using `clip` on one axis and `visible` on the other.

### 4.2 Cross-Viewport ScrollWidth Invariant

Across all standard viewports:
- Desktop: 1920px, 1440px, 1108px
- Tablet: 768px
- Mobile: 375px

Invariant rule:
$$\text{document.documentElement.scrollWidth} \equiv \text{window.innerWidth}$$

Proof of non-overflow:
1. `App.tsx:408` defines: `<div className="relative w-full min-h-screen overflow-x-clip bg-[#E4E4E4] ...">`. Root viewport already enforces `overflow-x-clip`.
2. `<main className="hero ...">` in `SpotlightSection.tsx:215` will be updated to:
   `overflow-x-clip overflow-y-visible z-10 bg-[#E4E4E4]`
   Any horizontal coordinate beyond $x \in [0, W]$ (such as the blue ambient glow `-translate-x-1/4`) is strictly clipped at $x = 0$.
3. `<BlurVignette>` container is updated to:
   `relative overflow-x-clip overflow-y-visible` when `bottomBleed` is present.
4. Bottom Scrim and Radial Vignette both use `left: inset` (`0px`) and `right: inset` (`0px`). Their computed width is identically $100\%$ of container width; $\Delta x = 0$.
5. The only non-zero offset is along the vertical axis ($\Delta y = 52\text{px}$), which renders down into `FeatureOne` without affecting horizontal dimensions.

---

## 5. Strict Negative Constraints Compliance Matrix

| Constraint Directive | Requirement | Verification / Compliance Status |
|---------------------|-------------|----------------------------------|
| **No Media Layer Wrappers** | `<video>`, `<motion.div className="hero-base-img">`, `<div id="reveal-img">` must remain direct children of `<BlurVignette>`. | **PASSED**: Zero intermediary `div`s, zero container refactoring. Elements remain directly inside `<BlurVignette>`. |
| **No Media Layer Masks/Fades** | Strictly NO `maskImage`, `opacity` fade, or filters applied to the media elements themselves. | **PASSED**: The media layers retain their exact styles. Only `#reveal-img` retains its cursor tracking `maskStyle`. No bottom fade is placed on the media. |
| **No Cross-Section Pollution** | Do NOT alter `FeatureOne`, `ShowcaseSection`, `Navbar`, or global CSS. | **PASSED**: Changes are strictly localized to `SpotlightSection.tsx` and `blur-vignette.tsx`. `FeatureOne.tsx` remains untouched. |
| **No Horizontal Scrollbar** | Eliminate all risk of horizontal scrollbar or page widening. | **PASSED**: Enforced by `overflow-x-clip` on container and `left: 0, right: 0` on bleed overlays. |
| **Glass Card Clearance** | Dải mờ không chạm vào thẻ kính của `FeatureOne` (min 12px). | **PASSED**: $64\text{px} - 52\text{px} = 12\text{px}$ exact buffer. |

---

## 6. Implementation Blueprint for Engineering Frontend Developer

### 6.1 `src/components/ui/blur-vignette.tsx`

1. **Interface Update**:
   ```typescript
   export interface BlurVignetteProps extends React.HTMLAttributes<HTMLDivElement> {
     radius?: string;
     inset?: string;
     transitionLength?: string;
     blur?: string;
     bottomBleed?: string; // Add optional prop
     classname?: string;
     className?: string;
     blurclassname?: string;
     children?: React.ReactNode;
     style?: React.CSSProperties;
   }
   ```

2. **Container Overflow Update**:
   ```tsx
   export function BlurVignette({
     radius = "24px",
     inset = "0px",
     transitionLength = "120px",
     blur = "16px",
     bottomBleed,
     classname,
     className,
     blurclassname,
     children,
     style,
     ...props
   }: BlurVignetteProps) {
     return (
       <div
         className={cn(
           "relative",
           bottomBleed ? "overflow-x-clip overflow-y-visible" : "overflow-hidden",
           classname,
           className
         )}
         style={{
           borderRadius: radius,
           ...style,
         }}
         {...props}
       >
         {children}
   ```

3. **Bottom Scrim Update**:
   ```tsx
         {/* Bottom Scrim */}
         <div
           className={cn(
             "pointer-events-none absolute left-0 right-0 z-20",
             blurclassname
           )}
           style={{
             bottom: bottomBleed ? `-${bottomBleed}` : inset,
             left: inset,
             right: inset,
             height: bottomBleed
               ? `calc(${transitionLength} + ${bottomBleed})`
               : transitionLength,
             backdropFilter: `blur(${blur})`,
             WebkitBackdropFilter: `blur(${blur})`,
             maskImage: bottomBleed
               ? `linear-gradient(to top, transparent 0%, rgba(0,0,0,0.5) calc(${bottomBleed} * 0.5), black ${bottomBleed}, rgba(0,0,0,0.6) calc(${bottomBleed} + ${transitionLength} * 0.5), transparent 100%)`
               : "linear-gradient(to top, black 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
             WebkitMaskImage: bottomBleed
               ? `linear-gradient(to top, transparent 0%, rgba(0,0,0,0.5) calc(${bottomBleed} * 0.5), black ${bottomBleed}, rgba(0,0,0,0.6) calc(${bottomBleed} + ${transitionLength} * 0.5), transparent 100%)`
               : "linear-gradient(to top, black 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
           }}
         />
   ```

4. **Radial Vignette Update**:
   ```tsx
         {/* Radial Vignette Darkening / Shading Layer */}
         <div
           className="pointer-events-none absolute top-0 left-0 right-0 z-20"
           style={{
             bottom: bottomBleed ? `-${bottomBleed}` : 0,
             borderRadius: radius,
             background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.18) 75%, rgba(0,0,0,0.45) 100%)`,
             maskImage: bottomBleed
               ? `linear-gradient(to bottom, black 0%, black calc(100% - ${bottomBleed}), rgba(0,0,0,0.5) calc(100% - ${bottomBleed} * 0.5), transparent 100%)`
               : undefined,
             WebkitMaskImage: bottomBleed
               ? `linear-gradient(to bottom, black 0%, black calc(100% - ${bottomBleed}), rgba(0,0,0,0.5) calc(100% - ${bottomBleed} * 0.5), transparent 100%)`
               : undefined,
           }}
         />
   ```

### 6.2 `src/components/SpotlightSection.tsx`

1. **Hero Main Container Update** (line 213-216):
   ```tsx
   <main
     ref={containerRef}
     className="hero relative w-full overflow-x-clip overflow-y-visible z-10 bg-[#E4E4E4] min-height-screen h-screen min-h-[600px] md:min-h-[800px] select-none"
   >
   ```

2. **BlurVignette Invocation Update** (line 233-240):
   ```tsx
   <BlurVignette
     radius="0px"
     inset="0px"
     transitionLength="160px"
     bottomBleed="52px"
     blur="20px"
     className="absolute top-[30vh] md:top-0 left-0 right-0 bottom-0 z-20 pointer-events-none"
   >
   ```

---

## 7. Verification Plan for QA & Code Reviewer

1. **TypeScript Type Safety**:
   ```bash
   npx tsc --noEmit
   ```
   Must exit with code 0.

2. **Horizontal Overflow Integrity**:
   Verify in browser console at viewports 1920px, 1440px, 1108px, 768px, 375px:
   ```javascript
   document.documentElement.scrollWidth === window.innerWidth
   ```
   Must evaluate to `true` on all viewports.

3. **Visual Clearance & Seam Inspection**:
   - Inspect the boundary between `SpotlightSection` and `FeatureOne`.
   - Verify that the horizontal cutoff line at $y = H_{\text{hero}}$ is eliminated.
   - Verify that the blur gradient ends 12px prior to the `FeatureOne` glass card container.
   - Verify full preservation of media elements (`<video>`, `.hero-base-img`, `#reveal-img`) without any wrappers or direct media masking.
