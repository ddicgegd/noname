# Project: SpotlightSection Blur Vignette Seam Elimination

## Architecture
- `SpotlightSection.tsx` contains `<main className="hero ...">` and uses `<BlurVignette>` to frame media elements (`<video>`, `<motion.div className="hero-base-img">`, `<div id="reveal-img">`).
- `BlurVignette` in `src/components/ui/blur-vignette.tsx` renders blur overlays and radial vignette effects.
- Boundary bleeding: `bottomBleed = "52px"`, `transitionLength = "160px"`.
- Container styling when bleeding: `overflow-x-clip overflow-y-visible z-10 bg-[#E4E4E4]` allows vertical bleeding into the top padding of `FeatureOne` without horizontal scroll.

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| 1 | Container & SpotlightSection Config (R1) | Update `<main className="hero ...">` and `<BlurVignette>` props in `SpotlightSection.tsx` | M1 | ORIGINAL_REQUEST § R1 | DONE |
| 2 | BlurVignette Props & Gradients (R2) | Add `bottomBleed?: string`, configure container overflow, Bottom Scrim mask/calc, Radial Vignette gradient | M1 | ORIGINAL_REQUEST § R2 | DONE |
| 3 | Strict Negative Constraints Adherence (R3) | Zero wrapping of media layers, zero maskImage/fade on media, no boundary clipping or horizontal scroll | M1 | ORIGINAL_REQUEST § R3 | DONE |
| 4 | Syntactic & Layout Integrity Verification | Type check `npx tsc --noEmit`, multi-viewport scrollWidth verification, and forensic audit | M1 | ORIGINAL_REQUEST § Acceptance Criteria | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status | Key Outputs |
|---|------|-------|-------------|--------|-------------|
| 1 | Seamless Blur Vignette Integration | `SpotlightSection.tsx`, `blur-vignette.tsx`, verification, and audit | none | DONE | `SpotlightSection.tsx`, `blur-vignette.tsx` updated; `npx tsc --noEmit` code 0; `vite build` code 0; CDP multi-viewport verified; Gate PASS |

## Interface Contracts
### BlurVignette Component Interface
```typescript
interface BlurVignetteProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  classname?: string;
  radius?: string;
  inset?: string;
  transitionLength?: string;
  blur?: string;
  blurclassname?: string;
  bottomBleed?: string;
  style?: React.CSSProperties;
}
```

## Code Layout
- `src/components/SpotlightSection.tsx` — Hero spotlight section implementation
- `src/components/ui/blur-vignette.tsx` — Blur vignette utility component
