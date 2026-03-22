# Errors Log

Command failures, exceptions, and unexpected behaviors.

---

## [ERR-20260322-001] fixed-header-spacer-background-bleed

**Logged**: 2026-03-22T00:00:00Z
**Priority**: high
**Status**: resolved
**Area**: frontend

### Summary
Standalone spacer div after fixed header shows page background color, creating a visible gap between header and hero section.

### Error
Visual: white/slate gap (~67px) visible between white fixed navbar bottom and dark navy hero section top. No console error — purely a visual layout bug.

### Context
- Converted `<header className="sticky top-0">` to `fixed inset-x-0 top-0`
- Added `<div aria-hidden="true" className="h-[67px]" />` after `<Header />` to preserve document flow
- The spacer div inherited parent's `bg-[#F8FAFC]` (light slate), making a visible gap on pages where the hero has a contrasting dark background

### Suggested Fix
Remove the standalone spacer. Instead, pad the first content section's `padding-top` by the header height. The section's own background color fills the space without any gap.

### Resolution
- **Resolved**: 2026-03-22
- **Notes**: Removed `h-[67px]` spacer from `app/page.js`. Changed hero section `pt-10 md:pt-16` → `pt-[107px] md:pt-[131px]`
- **See Also**: LRN-20260322-001

### Metadata
- Reproducible: yes
- Related Files: app/page.js, components/Header.js

---
