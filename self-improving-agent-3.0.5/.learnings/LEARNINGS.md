# Learnings Log

Captured learnings, corrections, and discoveries. Review before major tasks.

---

## [LRN-20260322-004] best_practice

**Logged**: 2026-03-22T00:00:00Z
**Priority**: high
**Status**: resolved
**Area**: frontend

### Summary
When using a fixed header over a colored hero section, set the page wrapper's background to match the hero's start color — this eliminates any subpixel rendering gap permanently.

### Details
With `position: fixed` header, the hero section starts at y=0 in document flow. The page wrapper div's background is normally invisible (covered by the hero). But due to subpixel rendering, browser zoom levels, or animation timing, a 1-2px sliver of the wrapper background can appear between the fixed header bottom edge and the hero top. Setting `bg-[#001f5b]` (hero gradient start color) on the outer wrapper ensures this sliver is invisible even if it exists.

### Suggested Action
```jsx
// Page wrapper: match the hero section's gradient start color
<div className="min-h-screen bg-[#001f5b]">  // ← was bg-[#F8FAFC]
  <Header />  {/* fixed */}
  <section className="bg-gradient-to-br from-[#001f5b] ...">
    {/* hero — gradient start matches wrapper bg */}
  </section>
  <div className="bg-[#F8FAFC]">  {/* explicit bg on content overrides wrapper */}
```
Each subsequent content section must declare its own background color. The wrapper background only shows through where no other bg is applied.

### Resolution
- **Resolved**: 2026-03-22
- **Notes**: Changed outer wrapper from `bg-[#F8FAFC]` to `bg-[#001f5b]` in app/page.js

### Metadata
- Source: user_feedback
- Related Files: app/page.js
- Tags: fixed-header, hero, background, subpixel, gap

---

## [LRN-20260322-001] best_practice

**Logged**: 2026-03-22T00:00:00Z
**Priority**: high
**Status**: resolved
**Area**: frontend

### Summary
When converting a sticky header to `position: fixed`, never use a standalone spacer div — it exposes the page's background color and creates a visible gap.

### Details
Changing `<header className="sticky top-0 ...">` to `fixed inset-x-0 top-0` removes the header from normal document flow. A naively added `<div className="h-[67px]" />` spacer inherits the page background (`#F8FAFC` / slate-50), creating a visible white/light gap between the fixed white navbar and the colored hero section below it. The user sees: navbar → ugly white gap → hero — even though code looks correct.

### Suggested Action
**Correct pattern**: Remove the standalone spacer. Instead, increase the first section's own `padding-top` by the header height so that section's background covers the entire space:
- Remove: `<div aria-hidden="true" className="h-[67px]" />`
- Change hero: `pt-10 md:pt-16` → `pt-[107px] md:pt-[131px]` (original + 67px header height)
- The hero section starts at y=0 in document flow; its background color fills from y=0 (behind the fixed header), and content appears at y=107px — seamless.

### Resolution
- **Resolved**: 2026-03-22
- **Notes**: Applied to `app/page.js` — removed standalone spacer div, changed hero section padding from `pt-10 md:pt-16` to `pt-[107px] md:pt-[131px]`

### Metadata
- Source: user_feedback
- Related Files: app/page.js, components/Header.js
- Tags: fixed-positioning, layout, header, spacer, hero

---

## [LRN-20260322-002] best_practice

**Logged**: 2026-03-22T00:00:00Z
**Priority**: medium
**Status**: pending
**Area**: frontend

### Summary
Hide-on-scroll navbar: use `useRef` for last scroll position (not `useState`) to avoid re-renders on every scroll event.

### Details
Tracking the previous scroll Y position for scroll-direction detection should use `useRef`, not `useState`. A `useState` update on every pixel of scroll triggers a re-render of the entire header component, which is expensive and can cause jank. `useRef` updates silently without triggering re-renders.

### Suggested Action
Pattern for hide-on-scroll:
```js
const lastScrollY = useRef(0);
const [hidden, setHidden] = useState(false);

function onScroll() {
  const y = window.scrollY;
  if (y > lastScrollY.current && y > 80) setHidden(true);  // 80px threshold prevents hiding on micro-bounces
  else if (y < lastScrollY.current) setHidden(false);
  lastScrollY.current = y;  // useRef — no re-render
}
```
Header className: add `transition-[transform,box-shadow]` and toggle `-translate-y-full` / `translate-y-0`.

### Metadata
- Source: conversation
- Related Files: components/Header.js
- Tags: scroll, performance, useRef, navbar, hide-on-scroll

---

## [LRN-20260322-003] correction

**Logged**: 2026-03-22T00:00:00Z
**Priority**: high
**Status**: pending
**Area**: frontend

### Summary
`transition-all` is an anti-pattern — always use specific property lists in Tailwind transitions.

### Details
`transition-all duration-200` forces the browser to watch and interpolate EVERY CSS property on every frame, including properties that can't be GPU-accelerated (width, height, padding, border, color). This causes layout recalculations on every animation frame and degrades performance. Specific lists like `transition-[transform,box-shadow]` or `transition-[transform,background-color,color]` restrict compositing to GPU-acceleratable properties.

### Suggested Action
Replace all `transition-all` in the codebase with specific property lists. Common replacements:
- Cards/hover lift: `transition-[transform,box-shadow]`
- Buttons: `transition-[transform,filter]` or `transition-[transform,background-color]`
- Color-only: `transition-colors`
- Nav links: `transition-[color,background-color]`

### Metadata
- Source: user_feedback
- Related Files: app/page.js, components/Header.js, components/BottomNav.js
- Tags: performance, css, transition, anti-pattern

---
