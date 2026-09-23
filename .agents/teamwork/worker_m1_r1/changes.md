# Code Changes Summary

**Agent**: `worker_m1_r1` (Engineering Frontend Developer)  
**Milestone**: M1 (Seamless Blur Vignette Integration)  
**Date**: 2026-09-22  

---

## 1. Files Modified

### `src/components/ui/blur-vignette.tsx`
- Extended `BlurVignetteProps` with optional `bottomBleed?: string`.
- Destructured `bottomBleed` in `BlurVignette`.
- Updated container `className` to conditionally apply `overflow-x-clip overflow-y-visible` when `bottomBleed` is truthy, preserving default `overflow-hidden` otherwise.
- Updated Bottom Scrim styling:
  - `bottom: bottomBleed ? `-${bottomBleed}` : inset`
  - `height: bottomBleed ? `calc(${transitionLength} + ${bottomBleed})` : transitionLength`
  - `maskImage`: `linear-gradient(to top, transparent 0%, rgba(0,0,0,0.5) calc(${bottomBleed} * 0.5), black ${bottomBleed}, rgba(0,0,0,0.6) calc(${bottomBleed} + ${transitionLength} * 0.5), transparent 100%)` (with matching `WebkitMaskImage`).
- Updated Radial Vignette styling:
  - `bottom: bottomBleed ? `-${bottomBleed}` : 0`
  - `maskImage`: `linear-gradient(to bottom, black 0%, black calc(100% - ${bottomBleed}), rgba(0,0,0,0.5) calc(100% - ${bottomBleed} * 0.5), transparent 100%)` (with matching `WebkitMaskImage`).

### `src/components/SpotlightSection.tsx`
- Updated `<main className="hero ...">`: replaced `overflow-hidden` with `overflow-x-clip overflow-y-visible z-10 bg-[#E4E4E4] ...` to release the vertical clipping plane while clipping horizontal delta.
- Passed `bottomBleed="52px"` to `<BlurVignette>`.
- Verified 100% adherence to negative constraints: `<video>`, `<motion.div className="hero-base-img">`, and `<div id="reveal-img">` remain direct children with zero wrapper divs and zero opacity/mask modifications.

---

## 2. Git Diff

```diff
diff --git a/src/components/SpotlightSection.tsx b/src/components/SpotlightSection.tsx
index a2c05f8..7fb452c 100644
--- a/src/components/SpotlightSection.tsx
+++ b/src/components/SpotlightSection.tsx
@@ -212,7 +212,7 @@ export default function SpotlightSection({
   return (
     <main
       ref={containerRef}
-      className="hero relative w-full overflow-hidden bg-[#E4E4E4] min-height-screen h-screen min-h-[600px] md:min-h-[800px] select-none"
+      className="hero relative w-full overflow-x-clip overflow-y-visible z-10 bg-[#E4E4E4] min-height-screen h-screen min-h-[600px] md:min-h-[800px] select-none"
     >
       {/* Top-left Blue Glow Ambient Overlay */}
       <div 
@@ -236,6 +236,7 @@ export default function SpotlightSection({
         inset="0px"
         transitionLength="160px"
         blur="20px"
+        bottomBleed="52px"
         className="absolute top-[30vh] md:top-0 left-0 right-0 bottom-0 z-20 pointer-events-none"
       >
         {/* Background Video from context */}
diff --git a/src/components/ui/blur-vignette.tsx b/src/components/ui/blur-vignette.tsx
index b097238..1ec7617 100644
--- a/src/components/ui/blur-vignette.tsx
+++ b/src/components/ui/blur-vignette.tsx
@@ -6,6 +6,7 @@ export interface BlurVignetteProps extends React.HTMLAttributes<HTMLDivElement>
   inset?: string;
   transitionLength?: string;
   blur?: string;
+  bottomBleed?: string;
   classname?: string;
   className?: string;
   blurclassname?: string;
@@ -23,6 +24,7 @@ export function BlurVignette({
   inset = "0px",
   transitionLength = "120px",
   blur = "16px",
+  bottomBleed,
   classname,
   className,
   blurclassname,
@@ -32,7 +34,12 @@ export function BlurVignette({
 }: BlurVignetteProps) {
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
         borderRadius: radius,
         ...style,
@@ -67,14 +74,20 @@ export function BlurVignette({
           blurclassname
         )}
         style={{
-          bottom: inset,
+          bottom: bottomBleed ? `-${bottomBleed}` : inset,
           left: inset,
           right: inset,
-          height: transitionLength,
+          height: bottomBleed
+            ? `calc(${transitionLength} + ${bottomBleed})`
+            : transitionLength,
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
 
@@ -118,8 +131,15 @@ export function BlurVignette({
       <div
         className="pointer-events-none absolute inset-0 z-20"
         style={{
+          bottom: bottomBleed ? `-${bottomBleed}` : 0,
           borderRadius: radius,
           background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.18) 75%, rgba(0,0,0,0.45) 100%)`,
+          ...(bottomBleed
+            ? {
+                maskImage: `linear-gradient(to bottom, black 0%, black calc(100% - ${bottomBleed}), rgba(0,0,0,0.5) calc(100% - ${bottomBleed} * 0.5), transparent 100%)`,
+                WebkitMaskImage: `linear-gradient(to bottom, black 0%, black calc(100% - ${bottomBleed}), rgba(0,0,0,0.5) calc(100% - ${bottomBleed} * 0.5), transparent 100%)`,
+              }
+            : {}),
         }}
       />
     </div>
```

---

## 3. Verification Commands & Outputs

```bash
npx tsc --noEmit
# Exit code: 0
# Errors: 0
```
