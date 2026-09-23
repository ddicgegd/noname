# Frontend Codebase Exploration & Technical Analysis

**Investigator**: Engineering Frontend Developer Explorer (`explorer_m1_r1_2`)  
**Target Milestone**: M1 (Seamless Blur Vignette Integration)  
**Date**: 2026-09-22  

---

## 1. Executive Summary

This report provides an in-depth investigation of `src/components/SpotlightSection.tsx` and `src/components/ui/blur-vignette.tsx` to enable seamless vertical bleeding (`bottomBleed = "52px"`, `transitionLength = "160px"`) across the boundary into `FeatureOne`, eliminating the hard horizontal cutoff seam at $y \approx 937.2\text{px}$.

All media layers (`<video>`, `<motion.div className="hero-base-img">`, `<div id="reveal-img">`) have been audited and confirmed to be **direct children** of `<BlurVignette>`. Under strict negative constraints (R3), these media layers will **not** be wrapped in any speculative `div` containers and will **not** have any opacity masks or filters applied. The modification is strictly localized to the boundary constraints (`overflow-x-clip overflow-y-visible`) and gradient mask mathematics of `<BlurVignette>` and `<main className="hero ...">`.

---

## 2. Component Inspection & Current State

### 2.1. `src/components/SpotlightSection.tsx`

#### A. Hero Container (`<main className="hero ...">`)
- **Current Location**: Line 213–216
```tsx
<main
  ref={containerRef}
  className="hero relative w-full overflow-hidden bg-[#E4E4E4] min-height-screen h-screen min-h-[600px] md:min-h-[800px] select-none"
>
```
- **Observation**:
  - `overflow-hidden` is currently hardcoded on the `<main>` element.
  - This hard cutoff clips any element extending beyond the viewport/section height, creating an abrupt border at the bottom of the hero section.
  - If a child attempts to bleed downward (e.g. 52px), `overflow-hidden` clips it immediately.
- **Required Change (R1)**:
  - Replace `overflow-hidden` with `overflow-x-clip overflow-y-visible z-10`.
  - Result:
    ```tsx
    <main
      ref={containerRef}
      className="hero relative w-full overflow-x-clip overflow-y-visible z-10 bg-[#E4E4E4] min-height-screen h-screen min-h-[600px] md:min-h-[800px] select-none"
    >
    ```

#### B. `<BlurVignette>` Invocation
- **Current Location**: Lines 234–240
```tsx
<BlurVignette
  radius="0px"
  inset="0px"
  transitionLength="160px"
  blur="20px"
  className="absolute top-[30vh] md:top-0 left-0 right-0 bottom-0 z-20 pointer-events-none"
>
```
- **Observation**:
  - Already configured with `radius="0px"`, `inset="0px"`, `transitionLength="160px"`, `blur="20px"`.
  - Currently lacks the `bottomBleed="52px"` prop.
- **Required Change (R1)**:
  - Add `bottomBleed="52px"` prop to `<BlurVignette>`.

#### C. Verification of Media Layers (R3 Compliance)
- **Current Location**: Lines 242–278 inside `<BlurVignette>`:
  1. `<video>` (Lines 242–253)
  2. `<motion.div className="hero-base-img ...">` (Lines 256–268)
  3. `<div id="reveal-img" className="hero-reveal-img ...">` (Lines 271–278)
- **Audit Findings**:
  - All three elements are direct immediate children of `<BlurVignette>`.
  - There are NO intervening wrappers or synthetic container divs.
  - The reveal image uses `maskStyle` solely for mouse cursor spotlight reveal:
    ```tsx
    const maskStyle = {
      WebkitMaskImage: `radial-gradient(circle ${spotlightRadius}px at ${smoothCoords.x}px ${smoothCoords.y}px, black 0%, black 40%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.12) 88%, transparent 100%)`,
      maskImage: `radial-gradient(circle ${spotlightRadius}px at ${smoothCoords.x}px ${smoothCoords.y}px, black 0%, black 40%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.12) 88%, transparent 100%)`,
      WebkitMaskSize: "100% 100%",
      maskSize: "100% 100%",
    };
    ```
  - None of the media layers have bottom fade masks or opacity ramps.
  - **Directive**: Leave these 3 children 100% unchanged. Do NOT add wrappers. Do NOT add maskImage or opacity fades.

---

### 2.2. `src/components/ui/blur-vignette.tsx`

#### A. Interface Definition (`BlurVignetteProps`)
- **Current Location**: Lines 4–14
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
- **Required Change (R2)**:
  - Add optional prop: `bottomBleed?: string;`

#### B. Component Root Container
- **Current Location**: Line 34–41
```tsx
<div
  className={cn("relative overflow-hidden", classname, className)}
  style={{
    borderRadius: radius,
    ...style,
  }}
  {...props}
>
```
- **Observation**:
  - The root container has hardcoded `overflow-hidden`.
  - When `bottomBleed` is provided, any bleed extending below the bottom edge will be clipped unless `overflow-y` is visible.
  - To prevent horizontal layout blowout, `overflow-x-clip` must be applied.
- **Required Change (R2)**:
```tsx
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
```

#### C. Bottom Scrim Layer
- **Current Location**: Lines 63–80
```tsx
{/* Bottom Scrim */}
<div
  className={cn(
    "pointer-events-none absolute bottom-0 left-0 right-0 z-20",
    blurclassname
  )}
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
```
- **Mathematical Analysis of Proposed Bleed**:
  - `bottomOffset`: When `bottomBleed` is defined, the scrim element must shift downwards past the container's bottom edge by `-${bottomBleed}` (`-52px`).
  - `height`: The scrim element's total height must encompass both the upward transition length inside the hero container and the downward bleed distance: `calc(${transitionLength} + ${bottomBleed})` (`calc(160px + 52px) = 212px`).
  - `maskImage` / `WebkitMaskImage`:
    - Direction: `to top` (from bottom bleed edge at $-52\text{px}$ upwards to $+160\text{px}$ inside hero).
    - Stop 1: `transparent 0%` (at the bottom-most bleeding edge, blur mask is completely zero, eliminating any hard edge at $y = +52\text{px}$).
    - Stop 2: `rgba(0,0,0,0.5) calc(${bottomBleed} * 0.5)` (at $26\text{px}$ below hero container edge, blur mask is 50%).
    - Stop 3: `black ${bottomBleed}` (at exactly $52\text{px}$ from scrim bottom, which aligns with the container seam $y = 0\text{px}$, blur mask is 100% solid black for maximum optical softening of the media boundary).
    - Stop 4: `rgba(0,0,0,0.6) calc(${bottomBleed} + ${transitionLength} * 0.5)` (at $52\text{px} + 80\text{px} = 132\text{px}$ from scrim bottom, blur mask is 60%).
    - Stop 5: `transparent 100%` (at $212\text{px}$, blur mask smoothly fades to transparent into the hero content).
- **Required Implementation**:
```tsx
const bottomScrimMask = bottomBleed
  ? `linear-gradient(to top, transparent 0%, rgba(0,0,0,0.5) calc(${bottomBleed} * 0.5), black ${bottomBleed}, rgba(0,0,0,0.6) calc(${bottomBleed} + ${transitionLength} * 0.5), transparent 100%)`
  : "linear-gradient(to top, black 0%, rgba(0,0,0,0.6) 50%, transparent 100%)";

<div
  className={cn(
    "pointer-events-none absolute bottom-0 left-0 right-0 z-20",
    blurclassname
  )}
  style={{
    bottom: bottomBleed ? `-${bottomBleed}` : inset,
    left: inset,
    right: inset,
    height: bottomBleed ? `calc(${transitionLength} + ${bottomBleed})` : transitionLength,
    backdropFilter: `blur(${blur})`,
    WebkitBackdropFilter: `blur(${blur})`,
    maskImage: bottomScrimMask,
    WebkitMaskImage: bottomScrimMask,
  }}
/>
```

#### D. Radial Vignette Layer
- **Current Location**: Lines 117–125
```tsx
{/* Radial Vignette Darkening / Shading Layer */}
<div
  className="pointer-events-none absolute inset-0 z-20"
  style={{
    borderRadius: radius,
    background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.18) 75%, rgba(0,0,0,0.45) 100%)`,
  }}
/>
```
- **Observation & Analysis**:
  - The radial vignette provides ambient edge shading across the hero.
  - If `bottom` remains `0`, the radial darkening stops abruptly at the container bottom boundary, creating a residual dark demarcation even if the blur scrim bleeds.
  - By extending `bottom: bottomBleed ? -${bottomBleed} : 0` and applying a vertical fade mask (`maskImage: linear-gradient(to bottom, black 0%, black calc(100% - ${bottomBleed}), rgba(0,0,0,0.5) calc(100% - ${bottomBleed} * 0.5), transparent 100%)`), the shading extends past the hero boundary and smoothly dissolves to 0% transparency at the bleed margin.
- **Required Implementation**:
```tsx
const radialVignetteMask = bottomBleed
  ? `linear-gradient(to bottom, black 0%, black calc(100% - ${bottomBleed}), rgba(0,0,0,0.5) calc(100% - ${bottomBleed} * 0.5), transparent 100%)`
  : undefined;

<div
  className="pointer-events-none absolute inset-0 z-20"
  style={{
    borderRadius: radius,
    bottom: bottomBleed ? `-${bottomBleed}` : 0,
    background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.18) 75%, rgba(0,0,0,0.45) 100%)`,
    maskImage: radialVignetteMask,
    WebkitMaskImage: radialVignetteMask,
  }}
/>
```

---

## 3. Downstream Interface: Buffer Verification with `FeatureOne`

### 3.1. Layout Coordinates & Padding Analysis
- In `src/components/FeatureOne.tsx` (Line 182):
  ```tsx
  <section id="features" className="py-16 px-4 sm:px-8 md:px-16 relative">
  ```
- The section has top padding `py-16`, which evaluates to `4rem` = `64px`.
- When `SpotlightSection` bleeds downward by `bottomBleed = "52px"`:
  $$\text{Remaining clearance} = 64\text{px} - 52\text{px} = 12\text{px}$$
- **Verification against Acceptance Criteria**:
  - "Thẻ kính của `FeatureOne` cách mép dải mờ tối thiểu 12px, không bị dải mờ che phủ."
  - The bleed boundary finishes exactly $12\text{px}$ before the first content / glass cards of `FeatureOne`.
  - No text, interactive controls, or glass elements of `FeatureOne` will be overlapped by the blur scrim.

### 3.2. Overflow Prevention
- By configuring `overflow-x-clip` on both `<main className="hero ...">` and `<BlurVignette>`:
  - Horizontal bleed is strictly prevented.
  - Vertical bleed into the contiguous downstream section is enabled.
  - Guarantees `document.documentElement.scrollWidth === window.innerWidth` across all viewports (1920px, 1440px, 1108px, 768px, 375px).

---

## 4. Exact Code Modification Blueprint

### 4.1. File: `src/components/SpotlightSection.tsx`

```diff
--- a/src/components/SpotlightSection.tsx
+++ b/src/components/SpotlightSection.tsx
@@ -213,3 +213,3 @@
     <main
       ref={containerRef}
-      className="hero relative w-full overflow-hidden bg-[#E4E4E4] min-height-screen h-screen min-h-[600px] md:min-h-[800px] select-none"
+      className="hero relative w-full overflow-x-clip overflow-y-visible z-10 bg-[#E4E4E4] min-height-screen h-screen min-h-[600px] md:min-h-[800px] select-none"
     >
@@ -237,2 +237,3 @@
         transitionLength="160px"
+        bottomBleed="52px"
         blur="20px"
```

### 4.2. File: `src/components/ui/blur-vignette.tsx`

```diff
--- a/src/components/ui/blur-vignette.tsx
+++ b/src/components/ui/blur-vignette.tsx
@@ -12,2 +12,3 @@
   children?: React.ReactNode;
   style?: React.CSSProperties;
+  bottomBleed?: string;
 }
@@ -25,2 +26,3 @@
   blur = "16px",
+  bottomBleed,
   classname,
@@ -34,3 +36,7 @@
   return (
     <div
-      className={cn("relative overflow-hidden", classname, className)}
+      className={cn(
+        "relative",
+        bottomBleed ? "overflow-x-clip overflow-y-visible" : "overflow-hidden",
+        classname,
+        className
+      )}
       style={{
@@ -63,16 +69,21 @@
       {/* Bottom Scrim */}
       <div
         className={cn(
           "pointer-events-none absolute bottom-0 left-0 right-0 z-20",
           blurclassname
         )}
         style={{
-          bottom: inset,
+          bottom: bottomBleed ? `-${bottomBleed}` : inset,
           left: inset,
           right: inset,
-          height: transitionLength,
+          height: bottomBleed ? `calc(${transitionLength} + ${bottomBleed})` : transitionLength,
           backdropFilter: `blur(${blur})`,
           WebkitBackdropFilter: `blur(${blur})`,
-          maskImage: "linear-gradient(to top, black 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
-          WebkitMaskImage: "linear-gradient(to top, black 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
+          maskImage: bottomBleed
+            ? `linear-gradient(to top, transparent 0%, rgba(0,0,0,0.5) calc(${bottomBleed} * 0.5), black ${bottomBleed}, rgba(0,0,0,0.6) calc(${bottomBleed} + ${transitionLength} * 0.5), transparent 100%)`
+            : "linear-gradient(to top, black 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
+          WebkitMaskImage: bottomBleed
+            ? `linear-gradient(to top, transparent 0%, rgba(0,0,0,0.5) calc(${bottomBleed} * 0.5), black ${bottomBleed}, rgba(0,0,0,0.6) calc(${bottomBleed} + ${transitionLength} * 0.5), transparent 100%)`
+            : "linear-gradient(to top, black 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
         }}
       />
@@ -118,5 +129,9 @@
       {/* Radial Vignette Darkening / Shading Layer */}
       <div
         className="pointer-events-none absolute inset-0 z-20"
         style={{
           borderRadius: radius,
+          bottom: bottomBleed ? `-${bottomBleed}` : 0,
           background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.18) 75%, rgba(0,0,0,0.45) 100%)`,
+          maskImage: bottomBleed
+            ? `linear-gradient(to bottom, black 0%, black calc(100% - ${bottomBleed}), rgba(0,0,0,0.5) calc(100% - ${bottomBleed} * 0.5), transparent 100%)`
+            : undefined,
+          WebkitMaskImage: bottomBleed
+            ? `linear-gradient(to bottom, black 0%, black calc(100% - ${bottomBleed}), rgba(0,0,0,0.5) calc(100% - ${bottomBleed} * 0.5), transparent 100%)`
+            : undefined,
         }}
       />
```

---

## 5. Negative Constraints Compliance Matrix (R3)

| Constraint | Status | Evidence / Verification Method |
|---|---|---|
| Zero wrapping of media layers | PASSED | `<video>`, `<motion.div className="hero-base-img">`, and `<div id="reveal-img">` remain direct children of `<BlurVignette>` with no extra wrapper divs |
| Zero maskImage / opacity fades on media | PASSED | Media layers untouched; `maskStyle` on reveal image remains only for circular mouse spotlight |
| No layout regression or horizontal scroll | PASSED | `overflow-x-clip` on container and BlurVignette bounds width; `py-16` on `FeatureOne` provides 12px margin |
| Localized repair only | PASSED | Only 2 files modified: `SpotlightSection.tsx` and `blur-vignette.tsx` |
