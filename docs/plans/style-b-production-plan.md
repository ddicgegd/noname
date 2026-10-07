# Implementation Plan: Productionize Style B Hologram Payment Sheet

## Summary
The user selected **Phương án B (Style B: Floating Glass Deck)**.
This plan removes all sandbox/prototype test code and transforms Style B into a clean, robust, high-performance production component (`HoloCardPaymentSheet.tsx`) integrated directly into `PricingSection.tsx`.

## Roles & Contracts
- **Implementer**: `frontend-developer` applying `ui-ux-pro-max` (clean micro-interactions, responsive bottom sheet, accessibility, semantic tokens).
- **Reviewer**: Task Reviewer applying `vercel-react-best-practices` (eliminating unnecessary effects/re-renders, clean React 19 / Vite tree-shaking, DOM and bundle optimization).

## Global Constraints
- Target style: Style B (Floating Glass Deck - Split view layout with mini hologram summary, iOS segmented billing control, payment method list, and glowing action button).
- Delete all prototype code: `PrototypeSwitcherBar`, `VariantAKeypad`, `VariantCAppleWallet`, `?variant=...` query syncing, hotkeys `1, 2, 3`.
- No dead code, no unused imports or files.
- TypeScript strictly typechecked (`npx tsc --noEmit` must pass with 0 errors).
- Zero regression on existing `PricingSection` features (HoloCard 3D tilt, Anti-Bot claw machine, enterprise banner).
- Accessible modal dialog (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, keyboard `Escape` to close).
- Responsive: Floating Island on Desktop (`max-w-3xl bottom-6 rounded-3xl`), Bottom Sheet on Mobile (`w-full bottom-0 rounded-t-3xl`).

---

### Task 1: Create Production `HoloCardPaymentSheet.tsx` & Integrate into `PricingSection.tsx`
- **File**: `src/components/HoloCardPaymentSheet.tsx`
- **Integrate into**: `src/components/PricingSection.tsx`
- **Delete**: `src/components/HoloCardPaymentSheetPrototype.tsx`
- **Requirements**:
  1. Build production `HoloCardPaymentSheet.tsx` using only Style B:
     - Header with grab handle, title, plan badge, and close button.
     - Left column: Mini hologram card preview with live foil gradient tint matching the selected plan, price, billing cycle, and feature list.
     - Right column: iOS Segmented Control for billing cycle (Monthly vs Yearly -20%), interactive payment methods list (Apple Pay, MoMo, Visa/Mastercard, VNPay) with accessible radio selection, and high-contrast action CTA button.
     - `Escape` key listener with cleanup, click backdrop to close.
     - `createPortal(..., document.body)` mounting with SSR/hydration safety (`mounted` state).
     - Semantic HTML, `role="dialog"`, `aria-modal="true"`.
     - Respect `prefers-reduced-motion`.
  2. Update `PricingSection.tsx`:
     - Cleanly import `HoloCardPaymentSheet` and `PricingPlan`.
     - Remove `PrototypeSwitcherBar`, `SheetVariant`, `variant` state, query params, keyboard event listeners.
     - Render `<HoloCardPaymentSheet plan={selectedPlan} isOpen={!!selectedPlan} onClose={() => setSelectedPlan(null)} />`.
  3. Delete prototype file `src/components/HoloCardPaymentSheetPrototype.tsx`.
  4. Verify typecheck with `npx tsc --noEmit`.
