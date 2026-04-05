# GarageDekho - Production Readiness Audit
**Date:** March 22, 2026
**Audited by:** Product Design + QA Review
**Stack:** Next.js 14 (App Router) · Supabase · Tailwind CSS · Leaflet Maps

---

## Executive Summary

GarageDekho is a well-designed hyperlocal automotive marketplace with a strong visual identity and solid UX patterns. The app is **not yet production-ready** due to 1 crash-level bug, several incomplete/fake features, missing critical flows (password reset, payment), and a simulated SOS that could mislead users in real emergencies. Below is a page-by-page audit with severity ratings and specific fixes.

**Severity Scale:** `CRITICAL` = crashes or misleads users | `HIGH` = broken flow | `MEDIUM` = poor UX | `LOW` = polish

---

## CRITICAL BUGS (Fix Before Launch)

### BUG-01 - `setToast` ReferenceError on Near Me Page
**File:** `app/near-me/page.js` · **Line 181**
**Severity:** CRITICAL - crashes the page for any user whose browser doesn't support geolocation

```js
// BROKEN - setToast is never declared
setToast("Geolocation is not supported by your browser.");

// FIX - use the destructured showToast from useToast()
showToast("Geolocation is not supported by your browser.");
```

### BUG-02 - SOS Feature is Entirely Simulated
**File:** `app/sos/page.js`
**Severity:** CRITICAL - this is a SAFETY feature. There is no real API call, no SMS dispatch, no backend ping. The mechanic ETA is a fake 120-second JavaScript countdown. If a user uses this in an actual emergency, nothing happens.
**Fix:** Either connect to a real dispatch API (Twilio, internal webhook) OR make it crystal clear this is a "Request Callback" feature and rename it accordingly. Do NOT label a fake timer as a mechanic ETA.

### BUG-03 - WhatsApp Link Hardcodes Country Code +91
**File:** `app/garage/[id]/page.js`
**Severity:** HIGH - breaks for any non-Indian phone number stored in the DB

```js
// BROKEN
href={`https://wa.me/91${garage.phone?.replace(/\D/g, "")}`}

// FIX - strip any leading 0 or +91, then prepend country code only if needed
const cleaned = garage.phone?.replace(/\D/g, "").replace(/^0/, "").replace(/^91/, "");
href={`https://wa.me/91${cleaned}`}
```

### BUG-04 - Photo Count Badge is Hardcoded
**File:** `app/garage/[id]/page.js`
**Severity:** MEDIUM - shows "1 photo" for every garage regardless of actual image count
**Fix:** Check if `garage.images` array exists and use its length, or remove the badge entirely if you only show one image.

---

## PAGE-BY-PAGE AUDIT

---

### 1. Home Page (`/`)

| # | Issue | Severity |
|---|-------|----------|
| H-01 | **Missing "Forgot Password" is on Auth, not Home** - but the home-page search has no label/aria describing what it searches. Screen reader reads it as empty. | MEDIUM |
| H-02 | **`animate-heart-burst` is used but never defined** - in `globals.css` or `tailwind.config.mjs`. Heart save animation silently fails. | MEDIUM |
| H-03 | **Promo banner "First service free!" → "Claim" button** goes to `/offers` page with no pre-selected offer and no free inspection flow. The CTA promise is broken. | HIGH |
| H-04 | **Duplicate location detection** - `useEffect` fetches geolocation AND shows LocationPopup. If user denies browser permission, the popup is already closed and user has no way to manually set location except refreshing. | MEDIUM |
| H-05 | **SOS card hidden on mobile** - only visible on desktop. Comment says "bottom nav SOS button is always reachable" - but on Home page there is no bottom nav SOS mention in the visible content. For a NEW user the SOS feature is discoverable only by finding the bottom nav SOS button. Add a small red SOS shortcut card to mobile home as well. | MEDIUM |
| H-06 | **`delay-` CSS classes on `animate-slide-up`** - the classes `delay-75`, `delay-100`, etc. are not defined in Tailwind config. The animations still fire but with no delay. | LOW |
| H-07 | **`getOpenGarageCount` is called but count is only shown in the hero subheader** - if it returns 0, the green "open now" dot and count disappear silently. Should show "0 open now" or a different state. | LOW |

---

### 2. Near Me (`/near-me`)

| # | Issue | Severity |
|---|-------|----------|
| NM-01 | **CRITICAL: `setToast` crash** - see BUG-01 above | CRITICAL |
| NM-02 | **Sort dropdown has no dismiss-on-outside-click** - once opened, clicking anywhere on the map doesn't close it. Users get confused. Add a backdrop or use `useEffect` with `document.addEventListener('click')`. | MEDIUM |
| NM-03 | **Mobile bottom sheet has no visual drag indicator instructions** - the pill/handle is there, but first-time users don't know they can drag it. Add "Swipe up to see more" text below the handle for first visit. | LOW |
| NM-04 | **Distance filters `< 1 km`, `< 2 km`, `< 5 km` show greyed-out when no GPS** - when tapped, they show a toast but don't explain HOW to enable location. Add a "Tap to enable location" affordance or link to browser settings help. | MEDIUM |
| NM-05 | **Map doesn't pan to selected garage** - clicking a garage row highlights it in the list but the map does not pan to that garage's pin. MapView receives `activeGarage` prop but likely doesn't `flyTo` that marker. | HIGH |
| NM-06 | **Search doesn't match against garage services** - searching "oil change" returns garages whose `name` or `speciality` contains "oil" but not garages that offer "Oil Change" as a service. Most users search by service. | HIGH |
| NM-07 | **No "Open Now" filter chip in main filter row** - it's buried in the Sort menu. "Open Now" is one of the most-used filters in service discovery. It should be a top-level chip. | MEDIUM |

---

### 3. Garage Detail (`/garage/[id]`)

| # | Issue | Severity |
|---|-------|----------|
| GD-01 | **WhatsApp hardcoded +91** - see BUG-03 | HIGH |
| GD-02 | **Photo count badge hardcoded "1 photo"** - see BUG-04 | MEDIUM |
| GD-03 | **Similar Garages sidebar breaks desktop layout** - `similarGarages` div is placed between the left column and the right sticky booking card inside a `md:flex-row` parent. It will expand full width between them rather than appearing as a sidebar. It needs its own column placement or should be below the tabs in the left column. | HIGH |
| GD-04 | **Mobile sticky "Book Now" bar competes with BottomNav z-index** - the bottom bar has `z-40`, BottomNav has `z-50`. On mobile the BottomNav overlaps the "Book Now" bar partially. The safe-area padding may not be enough on all devices. | HIGH |
| GD-05 | **`garage.vehiclesServed` has no null guard** - if this field is missing, `.toLocaleString()` will throw. Add `(garage.vehiclesServed ?? 0).toLocaleString()`. | MEDIUM |
| GD-06 | **"Book" button in services tab triggers booking modal, but "Schedule Appointment" in right column also opens it** - both open without a preselected service. There's no visual difference to explain what "Book" on a specific service vs "Schedule Appointment" does. | MEDIUM |
| GD-07 | **Review tab rating bar animation** - the `transition-all duration-500` on the bar widths fires only on initial render (no re-trigger). On tab switch the bars jump immediately. Add a small `useEffect` with a `setTimeout` to trigger the width after mount. | LOW |
| GD-08 | **`garage.openHours` format not validated** - if the DB returns null, the Clock icon row renders a blank/empty text with no fallback. Show "Hours not available" instead. | LOW |
| GD-09 | **No back-navigation memory** - `router.back()` goes to the previous history entry. If user opened garage from a deep link, back goes to the browser's previous page (could be google.com). Should have a fallback: `router.back()` or `router.push('/')` if no history. | MEDIUM |

---

### 4. Bookings (`/bookings`)

| # | Issue | Severity |
|---|-------|----------|
| BK-01 | **No cancel confirmation dialog** - the cancel button directly calls `cancelBooking`. One accidental tap cancels a booking. Must show "Are you sure you want to cancel?" modal first. | HIGH |
| BK-02 | **"Add to Calendar" generates a .ics URL** - but the calendar link builder parses time like "10:00 AM" with string split. If `booking.time` is null/undefined, it defaults to "9:00 AM" silently. This creates a calendar event at the wrong time. Show an error or disable the button if time is missing. | MEDIUM |
| BK-03 | **No reschedule functionality** - the Help FAQ says "cancel and re-book" to reschedule. This creates friction. Even a basic "Reschedule" flow (cancel + redirect to booking modal) would help. | HIGH |
| BK-04 | **Completed booking review button** - "Leave a Review" should be disabled/hidden if user already reviewed that booking. `hasReviewed` is checked but the button visibility logic is unclear from the preview. Verify no duplicate review submissions are possible. | MEDIUM |
| BK-05 | **No empty state for "no upcoming" vs "no past" bookings** - if the filter tab is "Upcoming" with no bookings, the EmptyState fires but it doesn't differentiate between "you have no upcoming bookings" vs "no bookings at all." | LOW |

---

### 5. Profile (`/profile`)

| # | Issue | Severity |
|---|-------|----------|
| PR-01 | **"Help & FAQ" is marked `comingSoon: true` in MENU** - but the page `/profile/help` is fully built and functional. Remove `comingSoon: true` from that menu item. | HIGH |
| PR-02 | **"Edit Profile" marked `comingSoon: true`** - there is no way for users to change their name or email. This is a basic expectation. The page should exist even minimally. | HIGH |
| PR-03 | **Avatar upload has no client-side resize** - uploading a 5MB photo is allowed. Large files slow the upload and increase storage costs. Resize to max 400x400 on the client before upload using `canvas`. | MEDIUM |
| PR-04 | **Number plate validation only allows strict formats** - the regex `^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$` rejects new BH-series plates (format: `22BH1234AB`). Add BH-series support. | MEDIUM |
| PR-05 | **Booking count shown in profile stats** - but if `getBookingCounts` returns an object vs a number, the display will show `[object Object]`. Verify the return type matches the `setBookingCount(count)` usage. | MEDIUM |
| PR-06 | **Sign out shows no loading state** - `handleSignOut` calls `await signOut()` and then `router.push('/')`. If signOut takes time, the user sees no feedback. Add a brief loading state. | LOW |

---

### 6. Auth (`/auth`)

| # | Issue | Severity |
|---|-------|----------|
| AU-01 | **No "Forgot Password" link** - this is table stakes for any auth flow. Supabase has `supabase.auth.resetPasswordForEmail()`. Without this, locked-out users have no recovery path. | CRITICAL |
| AU-02 | **Password minimum is 6 characters** - stated in placeholder. 6 chars is weak. Supabase allows enforcing stronger requirements. Set minimum to 8 chars and add a strength indicator. | HIGH |
| AU-03 | **No loading state during Google OAuth redirect** - clicking "Continue with Google" triggers the redirect but shows no spinner. Users may double-click causing multiple attempts. Disable button and show `Loader2` after click. | MEDIUM |
| AU-04 | **Supabase auth error messages shown raw** - errors like "Email not confirmed" or "Invalid login credentials" are displayed directly from Supabase. Map these to friendlier strings. | MEDIUM |
| AU-05 | **Signup success message stays even if user switches to Login tab** - `setSuccess` is cleared via `resetState()` on tab switch, which is correct, but `resetState` is only called in the tab onClick. If auth errors stack then user switches tabs, stale error state is cleared. Test this flow explicitly. | LOW |

---

### 7. Offers (`/offers`)

| # | Issue | Severity |
|---|-------|----------|
| OF-01 | **No expired offer filtering** - `getDaysUntilExpiry` can return negative values (past expiry). Expired offers should be filtered out or shown in a greyed-out "Expired" section, not mixed with active offers. | HIGH |
| OF-02 | **"Claim" flow doesn't exist** - user copies the code but there's nowhere in the booking flow to enter a promo code. The promo validate API (`/api/promo/validate`) exists but the BookingModal has no promo code input field visible in the preview. If it exists, it must be surfaced; if not, the Offers page is purely cosmetic. | CRITICAL |
| OF-03 | **Featured offer is always `offers[0]`** - not the highest-value or most relevant offer. Should be the offer marked `featured: true` in the DB. | MEDIUM |
| OF-04 | **`validTill` date parsing** - `new Date(dateStr)` without timezone can shift the date by -1 day in IST (UTC+5:30). Use `new Date(dateStr + 'T00:00:00+05:30')` for correct Indian dates. | MEDIUM |

---

### 8. SOS (`/sos`)

| # | Issue | Severity |
|---|-------|----------|
| SOS-01 | **Entire feature is UI-only simulation** - see BUG-02 above | CRITICAL |
| SOS-02 | **No location capture** - when SOS is triggered, the user's current GPS coordinates are not sent anywhere. Any real dispatch system needs the user's location. | CRITICAL |
| SOS-03 | **3-second cancel window** - if triggered accidentally, 3 seconds is enough time to cancel. But the confirm countdown starts immediately without a clear "tap to cancel" CTA. Make the cancel button more prominent during the countdown. | MEDIUM |
| SOS-04 | **"Mechanic will arrive in" ETA shows "00:00" after countdown** - when etaLeft hits 0, the display shows 00:00 with no follow-up message ("Mechanic is arriving" or "Call us if not arrived"). | LOW |

---

### 9. Partner (`/partner`)

| # | Issue | Severity |
|---|-------|----------|
| PT-01 | **5-step form has no draft saving** - if user refreshes or navigates away during the multi-step form, all entered data is lost. Save to `localStorage` between steps. | HIGH |
| PT-02 | **Step validation is unclear** - advancing steps has validation but error messages appear as `setError()` at the top. The specific invalid field is not highlighted. Use per-field inline error messages. | MEDIUM |
| PT-03 | **Location step uses geolocation** - but if the user denies, there's no manual address entry fallback for coordinates. The garage won't appear on the map without lat/lng. | HIGH |
| PT-04 | **Services step allows adding free-form services** - but there's no price format validation (accepts "free", "ask", blank). Enforce `₹NNN` format or a numeric input. | MEDIUM |
| PT-05 | **Submission success state** - after submit, there's no indication of next steps (review timeline, who will contact them, when will listing go live). Add a clear "What happens next" section. | MEDIUM |

---

## GLOBAL / CROSS-CUTTING ISSUES

### Performance

| # | Issue | Severity |
|---|-------|----------|
| G-01 | **All pages use `"use client"`** - zero server components in use. Garage detail and offer pages could be partially server-rendered for better First Contentful Paint and SEO. | HIGH |
| G-02 | **No image optimization on garage list thumbnails** - `sizes="56px"` is set but many garage images load at full resolution. Ensure images in Supabase storage are stored at appropriate resolutions. | MEDIUM |
| G-03 | **SessionStorage 5-min cache is good** - but the cache key `gd_garages_v1` is shared across home and near-me. If a garage's `isOpen` status changes within 5 minutes, users see stale data. Consider a shorter TTL (2 min) or real-time subscription for `isOpen`. | LOW |

### SEO

| # | Issue | Severity |
|---|-------|----------|
| G-04 | **Garage detail pages have no server-generated `<title>` or `<meta>` tags** - the page is fully client-rendered (`"use client"`), so Google crawls an empty shell. Convert garage detail to a server component or use `generateMetadata`. | HIGH |
| G-05 | **`sitemap.js` exists** - verify it includes all garage URLs dynamically from Supabase, not just static pages. | MEDIUM |
| G-06 | **No `robots.txt` customization** - admin routes (`/admin/**`) should be disallowed from indexing. | MEDIUM |

### Accessibility

| # | Issue | Severity |
|---|-------|----------|
| G-07 | **Bottom Nav has no `aria-current="page"`** - screen readers can't identify the active nav item. | MEDIUM |
| G-08 | **Booking modal has `useFocusTrap`** - good. But the trap ref is on `trapRef` which is on the outer container. Verify focus actually moves into the modal on open (check `autoFocus` on first focusable element). | MEDIUM |
| G-09 | **Color contrast on hero section** - "Trusted garages · Verified experts · Fixed prices" in `text-blue-100/80` on the blue gradient. This fails WCAG AA contrast ratio at small font sizes. | MEDIUM |
| G-10 | **`animate-shimmer` skeleton loaders have no `aria-busy` or `aria-label`** - screen readers announce nothing while loading. Add `aria-busy="true"` and `role="status"` to skeleton containers. | LOW |

### Security

| # | Issue | Severity |
|---|-------|----------|
| G-11 | **No rate limiting on auth** - multiple failed login attempts are not throttled on the client side. Supabase has server-side limits, but add client-side cooldown after 3 failures. | HIGH |
| G-12 | **Admin routes** - `/admin` exists. Verify it has server-side auth checks (not just client-side redirect). Client-side auth checks can be bypassed. | CRITICAL |
| G-13 | **Avatar upload public URL is guessable** - `${user.id}/avatar.jpg` is predictable. Consider adding a random suffix to prevent URL enumeration. | LOW |

### Missing Features for Production

| # | Feature | Impact |
|---|---------|--------|
| F-01 | **Forgot Password flow** | CRITICAL - users get locked out |
| F-02 | **Payment integration** | HIGH - no way to actually pay |
| F-03 | **Real-time booking status** | HIGH - users don't know if booking is accepted |
| F-04 | **Promo code input in BookingModal** | HIGH - Offers page has no actual claim path |
| F-05 | **Push notifications** | MEDIUM - marked "Coming Soon" |
| F-06 | **Reschedule booking** | MEDIUM - critical for service apps |
| F-07 | **Edit Profile page** | MEDIUM - marked "Coming Soon" |
| F-08 | **Real SOS dispatch** | CRITICAL (if feature is to stay) |
| F-09 | **Error tracking (Sentry)** | HIGH - blind in production |
| F-10 | **Booking confirmation email/SMS** | HIGH - no user assurance after booking |

---

## QUICK WIN FIXES (Can be done in < 1 hour each)

1. **Fix `setToast` → `showToast`** in `near-me/page.js:181` - 1 line
2. **Remove `comingSoon: true`** from Help & FAQ menu item in `profile/page.js`
3. **Add `aria-current="page"`** to BottomNav active item
4. **Filter expired offers** - add `.filter(o => getDaysUntilExpiry(o.validTill) >= 0)` in offers page
5. **Add null guard to `garage.vehiclesServed`** - `(garage.vehiclesServed ?? 0).toLocaleString()`
6. **Add "Forgot Password" link** on auth page (Supabase `resetPasswordForEmail`)
7. **Fix photo count badge** - remove hardcoded "1 photo" or make it dynamic
8. **Fix `comingSoon`** label on Help - it's fully built, just flip the flag
9. **Add cancel confirmation dialog** in bookings page before `cancelBooking()`
10. **Add `disallow: /admin` to robots.txt**

---

## RECOMMENDED PRIORITY ORDER

### Week 1 - Crash & Safety Fixes
- [ ] Fix `setToast` bug (NM-01 / BUG-01)
- [ ] Add Forgot Password to Auth (AU-01)
- [ ] Clarify or connect SOS to real backend (SOS-01 / BUG-02)
- [ ] Verify admin route server-side auth (G-12)
- [ ] Add cancel confirmation in Bookings (BK-01)

### Week 2 - Broken Flows
- [ ] Add promo code input to BookingModal (F-04 / OF-02)
- [ ] Filter expired offers (OF-01)
- [ ] Fix Similar Garages desktop layout (GD-03)
- [ ] Fix map pan-to-garage on selection (NM-05)
- [ ] Add localStorage draft saving to Partner form (PT-01)
- [ ] Remove `comingSoon` from Help & FAQ (PR-01)

### Week 3 - SEO & Performance
- [ ] Convert Garage Detail to server component with `generateMetadata`
- [ ] Add `robots.txt` with `/admin` disallow
- [ ] Add `aria-current` to BottomNav
- [ ] Fix `animate-heart-burst` missing keyframe
- [ ] Fix `delay-` animation utilities in Tailwind config

### Week 4 - Polish & Missing Features
- [ ] Build Edit Profile page
- [ ] Add booking confirmation email via Supabase Edge Function
- [ ] Add error tracking (Sentry)
- [ ] Add client-side avatar resize before upload
- [ ] Add reschedule booking flow

---

## DESIGN SYSTEM INCONSISTENCIES

1. **`animate-heart-burst`** - used in home page but not defined anywhere
2. **`delay-75`, `delay-100`, `delay-150`, `delay-200`** - used as Tailwind classes but not in config; these are built into Tailwind v3 by default (check version), but verify
3. **`gradient-text` class** - defined in `globals.css` but also expected as a Tailwind utility - document which classes are custom vs utility
4. **Sub-page headers are inconsistent** - Home/Near Me/Offers use the full `<Header />` component; Profile sub-pages use a custom inline `<header>` with back button. Standardize into a reusable `<SubpageHeader>` component
5. **Font size inconsistency** - mix of `text-[10px]`, `text-[11px]`, `text-[10px]` arbitrary values throughout. Define `text-label` and `text-caption` in Tailwind config instead
6. **`pb-28 md:pb-10`** - this pattern is repeated on every page to account for BottomNav. Should be a layout wrapper or CSS variable

---

*Report generated from full code audit of all pages and components. No automated testing was run - all findings are from static code analysis.*
