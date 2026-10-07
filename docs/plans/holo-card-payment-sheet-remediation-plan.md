# Implementation Plan: HoloCard & Payment Sheet UI/UX Defect Remediation

## Summary
Remediate the 7 UI/UX defects reported in `<HoloCardPaymentSheet>` and `<HoloCard>` using modern tactile bevel styling, clean typography, compact layouts, and accessible semantics.

## Global Constraints
- Target files: `src/components/HoloCardPaymentSheet.tsx` and `src/components/HoloCard.tsx`.
- STRICT SCOPE: Fix is repair, not redesign. Localized defect remediation only.
- ZERO UI REGRESSION: Preserve HMR (do not restart server or run `npm run dev`), maintain layout integrity, and prevent layout thrashing.
- Accessibility: Preserve ARIA semantics (`aria-label="Kỳ thanh toán"` and `aria-label="Phương thức thanh toán"`) when removing visible labels.
- TypeScript: Must pass `npx tsc --noEmit` with 0 errors.

---

### Task 1: UI/UX Implementation for HoloCard and HoloCardPaymentSheet
- **Implementer**: `frontend-developer` applying `ui-ux-pro-max`
- **Files**:
  - `src/components/HoloCardPaymentSheet.tsx`
  - `src/components/HoloCard.tsx`
- **Requirements**:
  1. Remove `div#billing-cycle-label` ("Kỳ thanh toán"); update radiogroup to `aria-label="Kỳ thanh toán"`.
  2. Remove `div#payment-methods-label` ("Phương thức thanh toán"); update radiogroup to `aria-label="Phương thức thanh toán"`.
  3. Redesign billing cycle segmented control: make it compact (`p-1`, `py-1.5`), fully rounded (`rounded-full`), with crisp optical bevel track and active sliding pill (`border-t border-t-white`, shadow highlights).
  4. Redesign payment methods list: remove bulky double-nested icon borders, replace standalone AI radio dot with integrated sleek selection indicator, ensure clean typography and proportional spacing.
  5. Redesign HoloCard compact content: replace literal text "check" / missing Material Symbols with Lucide SVG `Check` icon badge, refine typography for plan title, price amount, and period badge.
  6. Optimize sheet container padding: reduce `p-5 sm:p-7` to `p-4 sm:p-5.5` with tighter gap (`gap-4 sm:gap-5`), and reduce compact HoloCard `min-h-[380px]` to `min-h-[320px]` to eliminate excessive dead space.
  7. Redesign "Thanh toán" button: replace harsh cartoon gradient with premium 3D optical bevel styling (`border-t border-t-white/60`, `border-b`, tactile shadow, `py-3` height).

### Task 2: Architectural & Vercel React Best Practices Audit
- **Reviewer**: `software-architect` applying `vercel-react-best-practices`
- **Requirements**:
  1. Verify zero layout-shift (CLS = 0) and GPU-accelerated motion properties.
  2. Verify re-render efficiency (no nested component declarations, clean memoized callbacks or direct handlers).
  3. Verify accessibility compliance (WCAG 2.1 AA keyboard navigation, aria-label preservation).
  4. Verify asset hygiene (no unbundled fonts or dead code).
  5. Validate TypeScript compilation without errors.
