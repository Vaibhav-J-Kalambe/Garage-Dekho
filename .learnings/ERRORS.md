# Errors - GarageDekho

## Error: useSearchParams Suspense boundary missing
**Date:** 2026-03-22
**Command:** `npm run build` → Vercel deployment
**Error:**
```
⨯ useSearchParams() should be wrapped in a suspense boundary at page "/portal/register"
Error occurred prerendering page "/portal/register"
Export encountered an error on /portal/register/page: /portal/register, exiting the build.
```
**Root cause:** `useSearchParams()` called directly in the page component. Next.js requires it inside a Suspense boundary for static generation.
**Fix:** Wrap page in `<Suspense>`, extract logic into a child component.

---

## Error: Metadata themeColor/viewport warnings
**Date:** 2026-03-22
**Command:** `npm run build`
**Error:**
```
⚠ Unsupported metadata themeColor is configured in metadata export. Please move it to viewport export instead.
⚠ Unsupported metadata viewport is configured in metadata export.
```
**Root cause:** Next.js 14+ separates `themeColor` and `viewport` into a dedicated `export const viewport = {}` export.
**Fix:** Move `themeColor` and `width/initialScale` from `metadata` export to `export const viewport = { themeColor: "...", width: "device-width", initialScale: 1 }`.
**Status:** Fixed in root layout. Residual warnings are from individual page files that still export them in metadata - these are warnings only and do not block the build.
