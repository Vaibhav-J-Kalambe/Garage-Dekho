# GarageDekho - UI Improvement Plan
**Frameworks:** ui-ux-design-1.0.0 · ui-ux-pro-max-0.1.0 · frontend-design-3-0.1.0 · self-improving-agent-3.0.5
**Rule:** One page at a time. Read → Audit → Plan → Execute → Review → Log learnings.

---

## Design System (consistent across all pages)

| Token          | Value                                        |
|----------------|----------------------------------------------|
| Primary        | `#003091`                                    |
| Hero gradient  | `from-[#001f5b] via-[#003091] to-[#0056D2]` |
| Surface        | `#F8FAFC`                                    |
| Card bg        | `white` + `shadow-card`                      |
| Section gap    | `gap-10` / `pb-36 pt-8`                      |
| Rounded pull   | `rounded-t-[2.5rem] -mt-12`                  |
| Heading        | `font-black tracking-tight text-slate-900`   |
| Body           | `text-sm leading-relaxed text-slate-500`     |
| Transition     | `duration-150 ease-in-out`                   |
| Touch target   | `min-h-[44px]`                               |

---

## Page Queue (in order)

| # | Page | Route | Status |
|---|------|-------|--------|
| 1 | Login / Register | `/auth` | **IN PROGRESS** |
| 2 | Garages Near Me | `/near-me` | Queued |
| 3 | Garage Detail | `/garage/[id]` | Queued |
| 4 | My Bookings | `/bookings` | Queued |
| 5 | Offers & Deals | `/offers` | Queued |
| 6 | Profile Home | `/profile` | Queued |
| 7 | Edit Profile | `/profile/edit` | Queued |
| 8 | Saved Garages | `/profile/saved` | Queued |
| 9 | Addresses | `/profile/addresses` | Queued |
| 10 | Notifications | `/profile/notifications` | Queued |
| 11 | Security | `/profile/security` | Queued |
| 12 | Help & Support | `/profile/help` | Queued |
| 13 | My Reviews | `/profile/reviews` | Queued |
| 14 | SOS Emergency | `/sos` | Queued |
| 15 | Partner / List Garage | `/partner` | Queued |
| 16 | Portal Login | `/portal/login` | Queued |
| 17 | Portal Register | `/portal/register` | Queued |
| 18 | Portal Dashboard | `/portal/dashboard` | Queued |
| 19 | Portal Mechanics | `/portal/mechanics` | Queued |
| 20 | Portal SOS | `/portal/sos` | Queued |
| 21 | Portal Profile | `/portal/profile` | Queued |

---

## Current Page: `/auth`

### Audit (what exists)
- Hero band with gradient + logo + tagline - good base
- Tab switcher (Login / Sign Up) - exists
- Google OAuth button - exists
- Email + password inputs with icons - exists
- Show/hide password toggle - exists
- Error / success messages - exists
- Pulls up over hero with `-mt-6 rounded-t-3xl` - exists

### What needs improving
1. Hero gradient doesn't match brand (`#0047BE` instead of `#001f5b`)
2. Pull-up uses `-mt-6 rounded-t-3xl` - should match home page (`-mt-12 rounded-t-[2.5rem]`)
3. Tab switcher active state uses solid blue - make it match design system
4. Input fields need larger padding and `min-h-[44px]` touch target
5. Submit button loading state - show spinner, not just text
6. Error message needs an icon (AlertCircle)
7. Trust badges row (Verified · Fixed Pricing · 24/7) - good, keep it
8. Back button position - good
9. No bottom spacing for mobile (BottomNav overlap)

### Plan
- [ ] Fix hero gradient to match `#001f5b → #003091 → #0056D2`
- [ ] Change pull-up to `-mt-12 rounded-t-[2.5rem]` (same as home)
- [ ] Add `pt-[77px]` to hero to avoid header overlap
- [ ] Input height: add `min-h-[44px]` to all inputs
- [ ] Submit button: spinner icon when loading
- [ ] Error banner: add `AlertCircle` icon
- [ ] Add `pb-28` bottom padding for BottomNav
