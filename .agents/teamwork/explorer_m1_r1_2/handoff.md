# Handoff Report: Frontend Codebase Exploration & Implementation Blueprint

**Agent**: `explorer_m1_r1_2` (Frontend Codebase Explorer / Engineering Frontend Developer Explorer)  
**Milestone**: M1 (Seamless Blur Vignette Integration)  
**Handoff Type**: Hard (Investigation complete, actionable blueprint produced)  
**Date**: 2026-09-22  

---

## 1. Observation

Direct code observations from the repository:

1. **`src/components/SpotlightSection.tsx` (Lines 213–216)**:
   ```tsx
   <main
     ref={containerRef}
     className="hero relative w-full overflow-hidden bg-[#E4E4E4] min-height-screen h-screen min-h-[600px] md:min-h-[800px] select-none"
   >
   ```
   *Finding*: The root hero container has `overflow-hidden`, which clips any vertical bleeding at the bottom edge.

2. **`src/components/SpotlightSection.tsx` (Lines 234–240)**:
   ```tsx
   <BlurVignette
     radius="0px"
     inset="0px"
     transitionLength="160px"
     blur="20px"
     className="absolute top-[30vh] md:top-0 left-0 right-0 bottom-0 z-20 pointer-events-none"
   >
   ```
   *Finding*: `<BlurVignette>` has `radius="0px"`, `inset="0px"`, `transitionLength="160px"`, `blur="20px"`, but is missing `bottomBleed="52px"`.

3. **`src/components/SpotlightSection.tsx` (Lines 242–278)**:
   *Finding*: Three media layers are direct children of `<BlurVignette>`:
   - `<video>` (Lines 242–253)
   - `<motion.div className="hero-base-img ...">` (Lines 256–268)
   - `<div id="reveal-img" className="hero-reveal-img ...">` (Lines 271–278)
   There are no wrapping containers. Only the mouse reveal layer uses `maskStyle` for cursor spotlight interaction.

4. **`src/components/ui/blur-vignette.tsx` (Lines 4–14 & 34–41)**:
   ```typescript
   export interface BlurVignetteProps extends React.HTMLAttributes<HTMLDivElement> {
     radius?: string;
     inset?: string;
     transitionLength?: string;
     blur?: string;
     classname?: string;
     className?: string;
     blurclassname?: string;
     children?: React.ReactNode;
     style?: React.CSSProperties;
   }
   ```
   And component root:
   ```tsx
   <div
     className={cn("relative overflow-hidden", classname, className)}
     style={{ borderRadius: radius, ...style }}
     {...props}
   >
   ```
   *Finding*: `BlurVignetteProps` does not define `bottomBleed?: string`. Root container has unconditional `overflow-hidden`.

5. **`src/components/ui/blur-vignette.tsx` (Lines 63–80 & 117–125)**:
   ```tsx
   {/* Bottom Scrim */}
   <div
     className={cn("pointer-events-none absolute bottom-0 left-0 right-0 z-20", blurclassname)}
     style={{
       bottom: inset,
       left: inset,
       right: inset,
       height: transitionLength,
       backdropFilter: `blur(${blur})`,
       WebkitBackdropFilter: `blur(${blur})`,
       maskImage: "linear-gradient(to top, black 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
       WebkitMaskImage: "linear-gradient(to top, black 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
     }}
   />

   {/* Radial Vignette Darkening / Shading Layer */}
   <div
     className="pointer-events-none absolute inset-0 z-20"
     style={{
       borderRadius: radius,
       background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.18) 75%, rgba(0,0,0,0.45) 100%)`,
     }}
   />
   ```
   *Finding*: Bottom scrim uses fixed `bottom: inset` and `height: transitionLength` with no bleed offset. Radial vignette uses fixed `inset-0` with no downward extension or fade mask.

6. **`src/components/FeatureOne.tsx` (Line 182)**:
   ```tsx
   <section id="features" className="py-16 px-4 sm:px-8 md:px-16 relative">
   ```
   *Finding*: Top padding is `py-16` ($4\text{rem} = 64\text{px}$). Bleeding by $52\text{px}$ leaves exactly $64\text{px} - 52\text{px} = 12\text{px}$ safety clearance before any card content.

7. **Tool Verification (`npx tsc --noEmit`)**:
   Command exited with code 0 (clean baseline, 0 compilation/type errors).

---

## 2. Logic Chain

1. **Clip Boundary Release**: Observation 1 confirms `SpotlightSection` root `<main>` uses `overflow-hidden`. Any child bleeding $52\text{px}$ downward would be clipped at the boundary. Changing to `overflow-x-clip overflow-y-visible z-10` releases the vertical boundary while strictly preserving horizontal containment to prevent page-level horizontal scrollbars.
2. **Prop Propagation**: Observation 2 confirms `<BlurVignette>` lacks `bottomBleed`. Passing `bottomBleed="52px"` provides the required bleeding magnitude to the component.
3. **Negative Constraints Adherence**: Observation 3 confirms all 3 media layers (`<video>`, `<motion.div className="hero-base-img">`, `<div id="reveal-img">`) are direct children of `<BlurVignette>`. Under R3, modifying or wrapping these layers in synthetic `div` containers or applying opacity masks to them is prohibited. They must remain untouched.
4. **Interface Contract**: Observation 4 demonstrates `BlurVignetteProps` must be extended with `bottomBleed?: string` to preserve type safety.
5. **BlurVignette Root Overflow**: Observation 4 demonstrates `BlurVignette`'s root container has `overflow-hidden`. When `bottomBleed` is passed, switching to `overflow-x-clip overflow-y-visible` allows the scrim and vignette to extend $52\text{px}$ beyond the bottom edge while preventing horizontal overflow. When `bottomBleed` is absent, it safely falls back to `overflow-hidden`.
6. **Bottom Scrim Mask Mathematics**: Observation 5 demonstrates the current scrim is bounded inside the container. Setting `bottom: bottomBleed ? -${bottomBleed} : inset` and `height: bottomBleed ? calc(${transitionLength} + ${bottomBleed}) : transitionLength` shifts the scrim $-52\text{px}$ down and expands height to $212\text{px}$. The mask formula `linear-gradient(to top, transparent 0%, rgba(0,0,0,0.5) calc(${bottomBleed} * 0.5), black ${bottomBleed}, rgba(0,0,0,0.6) calc(${bottomBleed} + ${transitionLength} * 0.5), transparent 100%)` ensures:
   - $0\text{px}$ ($-52\text{px}$ relative to container): 0% blur (no abrupt boundary at the bleed edge).
   - $26\text{px}$ ($-26\text{px}$): 50% blur.
   - $52\text{px}$ ($0\text{px}$, container boundary): 100% solid blur mask (maximum optical blending at the original hard seam).
   - $132\text{px}$ ($+80\text{px}$): 60% blur.
   - $212\text{px}$ ($+160\text{px}$): 0% blur into the hero content.
7. **Radial Vignette Boundary Alignment**: Observation 5 demonstrates radial vignette would abruptly terminate at the container bottom edge if unmasked. Setting `bottom: bottomBleed ? -${bottomBleed} : 0` with `maskImage: linear-gradient(to bottom, black 0%, black calc(100% - ${bottomBleed}), rgba(0,0,0,0.5) calc(100% - ${bottomBleed} * 0.5), transparent 100%)` ensures dark vignette shading smoothly tapers off to transparent over the $52\text{px}$ bleed span.
8. **Downstream Safety Buffer**: Observation 6 confirms $64\text{px} - 52\text{px} = 12\text{px}$ buffer in `FeatureOne`, satisfying the acceptance criterion that the blur zone must not touch or obscure glass cards or text.

---

## 3. Caveats

No caveats. All files have been directly inspected. The baseline build passes cleanly with 0 errors. The blueprint requires modifying exactly 2 files (`SpotlightSection.tsx` and `blur-vignette.tsx`).

---

## 4. Conclusion

The implementation blueprint is complete, exact, and ready for execution by the builder:

1. **`src/components/SpotlightSection.tsx`**:
   - Update `<main>` className from `overflow-hidden` to `overflow-x-clip overflow-y-visible z-10`.
   - Add `bottomBleed="52px"` to `<BlurVignette>`.
   - Leave all media children untouched.

2. **`src/components/ui/blur-vignette.tsx`**:
   - Add `bottomBleed?: string` to `BlurVignetteProps`.
   - Update root `div` className to use `bottomBleed ? "overflow-x-clip overflow-y-visible" : "overflow-hidden"`.
   - Update Bottom Scrim `bottom`, `height`, `maskImage`, and `WebkitMaskImage` with the bleed formula.
   - Update Radial Vignette `bottom`, `maskImage`, and `WebkitMaskImage` with the bleed fade formula.

---

## 5. Verification Method

To independently verify the implementation:

1. **TypeScript Type Check**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected Result*: Exit code 0, 0 type errors.

2. **File Inspection**:
   - Inspect `src/components/SpotlightSection.tsx` around lines 213–240: confirm `overflow-x-clip overflow-y-visible z-10` on `<main>` and `bottomBleed="52px"` on `<BlurVignette>`.
   - Inspect `src/components/SpotlightSection.tsx` lines 242–278: confirm media layers are unchanged with NO wrapper divs and NO media masks.
   - Inspect `src/components/ui/blur-vignette.tsx`: confirm `bottomBleed?: string`, root conditional overflow, Bottom Scrim `bottom/height/maskImage`, and Radial Vignette `bottom/maskImage`.

3. **Multi-Viewport Layout & Overflow Verification**:
   - Verify `document.documentElement.scrollWidth === window.innerWidth` across 1920px, 1440px, 1108px, 768px, 375px.
   - Verify absence of horizontal scrollbar (`overflow-x`).
   - Verify visual transition: seamless optical dissolution from hero video/image into `#E4E4E4` with $\ge 12\text{px}$ clearance above `FeatureOne` glass cards.
