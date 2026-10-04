# Tasks

## 1. Grid Layout Fixes

- [x] 1.1 Update `gridTemplateColumns` property for the color palette buttons in `CardCustomizer` component (`apps/web/src/app/[locale]/g/[slug]/card/page.tsx`). Replace `"2"` with `"repeat(2, 1fr)"` and verify the palettes are displayed in a two-column grid.
- [x] 1.2 Update `gridTemplateColumns` property for the hex color inputs in `CardCustomizer` component (`apps/web/src/app/[locale]/g/[slug]/card/page.tsx`). Replace `"2"` with `"repeat(2, 1fr)"` and verify the inputs are displayed side-by-side in a two-column grid.

## 2. Validation & Testing

- [x] 2.1 Verify locally that the Card Designer preview ("Projektant Karteczki") renders nicely without squished labels and inputs.
- [x] 2.2 Run Vitest to ensure no unit tests were broken by this change (`pnpm --filter @wedding-drop/web test`).
