# Learnings - GarageDekho

## Category: best_practice

### Implement MagicUI components inline instead of installing the package
**Date:** 2026-03-22
**Context:** User requested MagicUI components (NumberTicker, MagicCard, BorderBeam, ShimmerButton).
MagicUI requires TypeScript and specific setup that conflicts with this JS-only Next.js project.

**Solution:** Implement each component as a small inline function within the page:
- `NumberTicker` → IntersectionObserver + requestAnimationFrame easing
- `MagicCard` → CSS custom properties (`--mx`, `--my`) + `radial-gradient` on `::before`
- `BorderBeam` → animated `linear-gradient` on `::before` with `background-size: 300%`
- `ShimmerButton` → `::after` pseudo-element with sliding gradient via `@keyframes`

**Why:** No package install needed, zero bundle size increase, no TypeScript conflicts.

---

### Use CSS custom properties for cursor-follow hover effects
**Date:** 2026-03-22
**Context:** MagicCard needs a radial gradient centered on mouse position.

**Solution:**
```js
function onMove(e) {
  const r = ref.current.getBoundingClientRect();
  ref.current.style.setProperty("--mx", `${e.clientX - r.left}px`);
  ref.current.style.setProperty("--my", `${e.clientY - r.top}px`);
}
```
CSS: `radial-gradient(380px circle at var(--mx, 50%) var(--my, 50%), rgba(0,86,210,0.07), transparent 70%)`

**Why:** Pure CSS approach, no re-renders on mouse move, silently no-ops on touch.

---

### Pull content card over hero with negative margin + rounded-t
**Date:** 2026-03-22
**Context:** MakeMyTrip-style overlap between hero and content.

**Solution:**
- Hero: `pb-28` (extra padding at bottom)
- Content wrapper: `-mt-12 rounded-t-[2.5rem]`

**Why:** Creates the "floating card over hero" visual without absolute positioning hacks.

---

### Stats strip with IntersectionObserver-triggered NumberTicker
**Date:** 2026-03-22
**Context:** Animated counters should only start when visible on screen.

**Solution:** Use `IntersectionObserver` with `threshold: 0.4`. Disconnect after first trigger so it only animates once. Use cubic easing: `1 - Math.pow(1 - pct, 3)`.

---

### useSearchParams must be wrapped in Suspense for Next.js static export
**Date:** 2026-03-22
**Context:** Vercel build failed with "useSearchParams() should be wrapped in a suspense boundary" on `/portal/register`.

**Solution:** Split the page into a default export that renders `<Suspense><InnerForm /></Suspense>`, and move all `useSearchParams` usage into `InnerForm`.

**Why:** Next.js requires Suspense for `useSearchParams` during static page generation (SSG).
