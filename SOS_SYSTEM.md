# GarageDekho — SOS & Garage Portal System

How every part of the system works, written for the team.

---

## Table of Contents

1. [Big Picture](#1-big-picture)
2. [Database Tables](#2-database-tables)
3. [SOS Flow — Customer Side](#3-sos-flow--customer-side)
4. [SOS Flow — Mechanic Side](#4-sos-flow--mechanic-side)
5. [Garage Management Portal](#5-garage-management-portal)
6. [How Live Tracking Works](#6-how-live-tracking-works)
7. [API Routes](#7-api-routes)
8. [File Structure](#8-file-structure)
9. [Tech Used](#9-tech-used)
10. [Known Limitations / Next Steps](#10-known-limitations--next-steps)

---

## 1. Big Picture

There are two separate apps sharing the same Supabase backend:

```
GarageDekho (Customer App)          Garage Management Portal
  localhost:3000                       localhost:3000/portal
  ─────────────────                    ──────────────────────
  Normal users browse garages          Garage owners manage their business
  Book services                        See SOS alerts near them
  Trigger SOS                          Dispatch mechanics
  Track mechanic live                  Track active jobs
```

They are **not separate deployments** — both run inside the same Next.js project. The portal lives under `/portal/*` routes, isolated by its own layout and auth context.

They share the **same Supabase project** (same database, same auth system). A garage owner creates an account in the portal — that account lives in Supabase Auth just like a regular customer account does.

---

## 2. Database Tables

### `sos_requests`
Created when a customer hits "Get Help Now".

| Column         | Type      | Description                                      |
|----------------|-----------|--------------------------------------------------|
| `id`           | UUID (PK) | Unique ID for this SOS event                     |
| `user_id`      | UUID      | Customer's auth ID (nullable — guest users allowed) |
| `issue_type`   | text      | "Flat Tyre", "Battery Dead", "Engine Fail", etc. |
| `user_lat`     | float8    | Customer's GPS latitude                          |
| `user_lng`     | float8    | Customer's GPS longitude                         |
| `user_address` | text      | Human-readable address (reverse-geocoded)        |
| `status`       | text      | `pending` → `accepted` → `arrived` → `verified` |
| `created_at`   | timestamp | When the SOS was triggered                       |

### `sos_assignments`
Created when a mechanic (or portal) accepts an SOS request.

| Column           | Type      | Description                                    |
|------------------|-----------|------------------------------------------------|
| `id`             | UUID (PK) | Unique assignment ID                           |
| `request_id`     | UUID (FK) | Links to `sos_requests.id`                     |
| `garage_id`      | UUID      | Links to `portal_garages.id` (added via SQL migration) |
| `garage_name`    | text      | Garage name (kept for display)                 |
| `mechanic_name`  | text      | Who is going                                   |
| `mechanic_phone` | text      | Their phone number                             |
| `mechanic_lat`   | float8    | Mechanic's live latitude (updates every 5s)    |
| `mechanic_lng`   | float8    | Mechanic's live longitude (updates every 5s)   |
| `otp`            | text      | 4-digit code generated when mechanic arrives   |
| `otp_verified`   | boolean   | Whether the OTP was confirmed by customer      |

### `portal_garages`
One row per registered garage owner.

| Column          | Type    | Description                                      |
|-----------------|---------|--------------------------------------------------|
| `id`            | UUID    | Unique garage ID                                 |
| `user_id`       | UUID    | Links to Supabase `auth.users`                   |
| `garage_name`   | text    | Display name                                     |
| `phone`         | text    | Contact number                                   |
| `address`       | text    | Street address                                   |
| `city`          | text    | City                                             |
| `lat` / `lng`   | float8  | Garage GPS coordinates (set in Profile page)     |
| `working_hours` | JSONB   | `{ open, close, closed_days[] }`                 |
| `services`      | text[]  | List of services offered                         |
| `is_active`     | boolean | Whether this garage shows in search results      |

### `portal_mechanics`
Staff members linked to a garage.

| Column             | Type  | Description                                        |
|--------------------|-------|----------------------------------------------------|
| `id`               | UUID  | Unique mechanic ID                                 |
| `portal_garage_id` | UUID  | Links to `portal_garages.id`                       |
| `name`             | text  | Mechanic's full name                               |
| `phone`            | text  | Their phone number                                 |
| `specialization`   | text  | "Tyre Specialist", "Engine Repair", etc.           |
| `status`           | text  | `available` / `busy` / `offline`                   |

---

## 3. SOS Flow — Customer Side

**File:** `app/sos/page.js`

The page is a state machine with 6 phases. The customer never leaves this page — the UI changes based on phase.

```
select → locating → searching → accepted → arrived → verified
```

### Phase: `select`
- Customer picks their issue type (Flat Tyre, Battery Dead, etc.)
- Presses "Get Help Now"

### Phase: `locating`
- `navigator.geolocation.getCurrentPosition()` fires
- Spinner shows while GPS acquires
- Address is reverse-geocoded using OpenStreetMap Nominatim API (free, no key needed)

### Phase: `searching`
- An `sos_requests` row is inserted into Supabase with status `pending`
- `/api/sos/request` is called — this finds all `portal_garages` within 10 km using the Haversine formula and returns them
- Nearby garages are listed on screen with a "Notify" WhatsApp button each
- A **Supabase Realtime subscription** is opened on the `sos_requests` row — waiting for status to change

### Phase: `accepted`
- Triggered automatically when Realtime fires (status changed to `accepted`)
- The `sos_assignments` row is loaded — this has the mechanic's name, garage, phone
- A second Realtime subscription opens on `sos_assignments` — watching for `mechanic_lat`/`mechanic_lng` changes
- Full-screen map renders with:
  - Red pulsing dot = customer's location (static)
  - Blue wrench icon = mechanic's location (live, moves every 5s)
  - Dashed blue route line between them
  - ETA calculated using Haversine distance ÷ 25 km/h average speed
- Bottom sheet shows mechanic name, garage, ETA, Call button, WhatsApp button

### Phase: `arrived`
- Triggered automatically when Realtime fires (status changed to `arrived`)
- A 4-digit OTP is displayed on screen in large boxes
- Customer reads this OTP aloud to the mechanic standing in front of them

### Phase: `verified`
- Triggered automatically when OTP is confirmed (status changed to `verified`)
- Shows job summary — issue, mechanic, garage
- Customer goes back to home

---

## 4. SOS Flow — Mechanic Side

**File:** `app/sos/mechanic/[requestId]/page.js`

This page opens from a WhatsApp link sent by the portal. The mechanic gets:
```
https://yourdomain.com/sos/mechanic/<request-id>
```

This page also uses phases:
```
loading → view → accepted → arrived → verified
       └→ taken / not_found
```

### Phase: `loading`
- Fetches the `sos_requests` row from Supabase

### Phase: `view` (standalone acceptance — if mechanic accepts directly without portal)
- Shows a map with the customer's pin
- Mechanic fills in: name, garage name, phone
- Taps "Accept & Go" → calls `/api/sos/accept` → starts GPS sharing

### Auto-detected phases (portal-dispatched mechanic)
- If the portal already accepted the job, status is `accepted` when mechanic opens the link
- The page checks for an existing `sos_assignments` row
- If found → pre-fills mechanic name from the assignment → jumps straight to `accepted` phase
- GPS starts sharing immediately — no form needed

### Phase: `accepted`
- Full-screen map shows mechanic's own position (blue) and customer's position (red)
- `navigator.geolocation.watchPosition()` tracks mechanic's GPS continuously
- Every 5 seconds, `/api/sos/location` is called with `{ requestId, lat, lng }`
- Mechanic taps "I've Arrived" when they reach the customer

### Phase: `arrived`
- Calls `/api/sos/arrive` which generates a 4-digit OTP and sets status to `arrived`
- Mechanic enters the OTP that the customer reads out
- Calls `/api/sos/verify` to confirm

### Phase: `verified`
- Service is officially started
- Mechanic's status in `portal_mechanics` is reset to `available`

### Phase: `taken`
- If someone else already accepted this SOS — mechanic sees "Already Accepted" screen

---

## 5. Garage Management Portal

**Base route:** `/portal`

The portal is isolated from the main app. It has its own:
- Layout: `app/portal/layout.js`
- Auth context: `context/PortalAuthContext.js`
- Navigation: `components/portal/PortalNav.js`

### Authentication

**Registration** (`/portal/register`):
- 2-step form: Step 1 = email + password, Step 2 = garage details
- Uses a server-side API route `/api/portal/register` with the Supabase Service Role Key
- Why server-side? Supabase RLS blocks client-side inserts until the session is fully active
- Creates user via `auth.admin.createUser({ email_confirm: true })` — auto-confirms only this user, doesn't affect global email confirmation settings

**Login** (`/portal/login`):
- Standard email + password via `supabase.auth.signInWithPassword()`
- After login, checks if a `portal_garages` row exists for this user
- If no garage record (incomplete registration) → redirects to `/portal/register?complete=1` to finish setup

**Incomplete registration recovery:**
- If registration failed midway (auth created but garage record wasn't saved), the `?complete=1` query param skips Step 1 and uses the existing session's user ID

**Auth Guard (PortalAuthContext):**
- Wraps all portal pages
- On load: checks Supabase session → loads `portal_garages` row
- No session → redirect to `/portal/login`
- Session but no garage → redirect to `/portal/register?complete=1`
- Session + garage → allow access, provide `garage` object to all pages

### Dashboard (`/portal/dashboard`)
- Greeting with time of day
- Red SOS alert banner if any pending requests are nearby (links to SOS page)
- Stats: SOS handled today (real data), Bookings (placeholder), Revenue (placeholder), Rating (placeholder)
- Active SOS list (pending/accepted/arrived) filtered by 15 km distance from garage
- Supabase Realtime subscription — plays a 3-beep sound + vibration when a new SOS request comes in

### SOS Alerts (`/portal/sos`)
Three sections:
1. **Incoming** — pending requests within 15 km, shows issue type, distance, time. "Accept & Dispatch" button
2. **Active Jobs** — requests this garage accepted, shows en-route or arrived status. "Live Track" / "Verify OTP" button
3. **Completed Today** — verified jobs

**Dispatch flow:**
- Tap "Accept & Dispatch" → opens a mechanic selection modal
- Choose an available mechanic from the list
- Tap "Dispatch" → calls `/api/sos/accept` → marks mechanic as `busy` → sends WhatsApp message to mechanic with their tracking link

**OTP Verification (portal-side):**
- When mechanic has arrived, portal can also enter the OTP (as a backup to the mechanic's page)
- Opens a tracking overlay with Leaflet map + OTP entry

### My Team (`/portal/mechanics`)
- Add, edit, remove mechanics
- Fields: name, phone, specialization
- Delete requires an inline confirmation (no accidental deletes)
- Status badge (Available / Busy / Offline) — tap to cycle through

### Profile (`/portal/profile`)
- Edit garage name, phone, address, city
- **Set Garage Location** — "Use My Location" button captures GPS coordinates via `navigator.geolocation`
  - These coordinates are used to calculate distance from SOS requests
  - Without this set, distance-based filtering won't work
- Working hours: open time, close time, days closed
- Services offered: toggle from a list of 12 service types

---

## 6. How Live Tracking Works

This is the core technical feature. Here's the exact data flow:

```
Mechanic's phone                  Supabase DB                  Customer's phone
────────────────                  ───────────                  ────────────────

GPS updates every 5s
        │
        ▼
POST /api/sos/location ──────► UPDATE sos_assignments
  { requestId, lat, lng }        SET mechanic_lat = X
                                     mechanic_lng = Y
                                          │
                                          │ Supabase Realtime
                                          │ (postgres_changes)
                                          ▼
                                 Customer's browser receives
                                 the UPDATE event instantly
                                          │
                                          ▼
                                 setMechanicCoords([lat, lng])
                                          │
                                          ▼
                                 Leaflet map moves blue dot
                                 Map auto-fits to show both pins
                                 ETA recalculates
```

**Key details:**
- Realtime is powered by Supabase's `postgres_changes` feature (Postgres logical replication under the hood)
- No polling — the customer's browser receives a push notification from Supabase the moment the DB row changes
- The mechanic's GPS is watched by `navigator.geolocation.watchPosition()` — fires when position changes meaningfully
- A `setInterval` every 5 seconds ensures the server always has a fresh position even if the device doesn't move
- The Leaflet map moves the mechanic's marker using `marker.setLatLng()` — no map re-render, just the pin moves
- ETA = `distance_km / 25 km_per_hour × 60 minutes` (rough city speed estimate)

---

## 7. API Routes

All API routes use the **Supabase Service Role Key** — this bypasses Row Level Security (RLS). Never expose this key on the client side.

| Route                     | Method | What it does                                                              |
|---------------------------|--------|---------------------------------------------------------------------------|
| `/api/portal/register`    | POST   | Creates auth user + `portal_garages` row. Uses `auth.admin.createUser`    |
| `/api/sos/request`        | POST   | Finds nearby `portal_garages` within 10 km using Haversine formula        |
| `/api/sos/accept`         | POST   | Creates `sos_assignments` row, sets `sos_requests.status = accepted`      |
| `/api/sos/location`       | POST   | Updates `mechanic_lat`/`mechanic_lng` in `sos_assignments`                |
| `/api/sos/arrive`         | POST   | Generates 4-digit OTP, sets `sos_requests.status = arrived`               |
| `/api/sos/verify`         | POST   | Checks OTP, sets `otp_verified = true`, sets status = `verified`          |

### Why server-side API routes?
- Supabase RLS prevents client-side writes to sensitive tables unless the user owns that row
- The service role key bypasses RLS completely
- Keeping it server-side means the key is never sent to the browser

---

## 8. File Structure

```
app/
├── sos/
│   ├── page.js                          Customer SOS page (all phases)
│   └── mechanic/
│       └── [requestId]/
│           └── page.js                  Mechanic tracking page (WhatsApp link)
│
├── portal/
│   ├── layout.js                        Portal layout (wraps with PortalAuthProvider + PortalNav)
│   ├── page.js                          Redirects to /portal/dashboard
│   ├── login/page.js                    Portal login
│   ├── register/page.js                 2-step garage registration
│   ├── dashboard/page.js                Overview, SOS alerts, stats
│   ├── sos/page.js                      Full SOS management (incoming/active/completed)
│   ├── mechanics/page.js                Team management
│   └── profile/page.js                  Garage profile + working hours + services
│
├── api/
│   ├── portal/
│   │   └── register/route.js            Creates portal user + garage record (server-side)
│   └── sos/
│       ├── request/route.js             Finds nearby garages
│       ├── accept/route.js              Accepts SOS, creates assignment
│       ├── location/route.js            Updates mechanic GPS
│       ├── arrive/route.js              Generates OTP, marks arrived
│       └── verify/route.js              Verifies OTP, marks verified

components/
├── SosMap.js                            Leaflet map (customer + mechanic pins, live route)
├── BottomNav.js                         Main app nav (hidden on /portal and /sos routes)
└── portal/
    └── PortalNav.js                     Portal bottom nav (live SOS badge count)

context/
└── PortalAuthContext.js                 Portal auth state (session, garage record, redirects)

lib/
└── supabase.js                          Supabase client (anon key, for client-side)
```

---

## 9. Tech Used

| Layer          | Technology                                                                 |
|----------------|----------------------------------------------------------------------------|
| Framework      | Next.js 14 (App Router, JavaScript — not TypeScript)                       |
| Database       | Supabase (PostgreSQL)                                                      |
| Realtime       | Supabase Realtime (`postgres_changes` subscriptions)                       |
| Auth           | Supabase Auth (email + password)                                           |
| Map            | Leaflet.js (dynamically imported — SSR disabled)                           |
| Map tiles      | Carto Voyager (free, no API key)                                           |
| Geocoding      | OpenStreetMap Nominatim (free, no API key)                                 |
| Styling        | Tailwind CSS                                                               |
| Icons          | Lucide React                                                               |
| Notifications  | WhatsApp deep links (`https://wa.me/...`)                                  |
| Sound alert    | Web Audio API (built-in browser API, no library)                           |
| GPS            | `navigator.geolocation` (browser built-in)                                 |
| Distance calc  | Haversine formula (implemented manually, no library)                       |

---

## 10. Known Limitations / Next Steps

### Must do before going live

1. **Add garage lat/lng to all existing garages**
   - Go to Portal → Profile → Edit Profile → "Use My Location"
   - Without this, distance filtering for SOS won't work

2. **Run this SQL in Supabase** (adds garage_id column to assignments):
   ```sql
   ALTER TABLE sos_assignments ADD COLUMN IF NOT EXISTS garage_id UUID REFERENCES portal_garages(id);
   ```

3. **Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`** on the production server
   - Without this, portal registration and all SOS API routes will fail silently

### Nice to have

| Feature                        | Why it matters                                                            |
|--------------------------------|---------------------------------------------------------------------------|
| Web Push Notifications         | Portal tab doesn't need to be open to get SOS alerts                     |
| Bookings table + booking flow  | Currently shows 0 — needs its own table and UI                           |
| Ratings system                 | Currently shows "—" — needs a `reviews` table                            |
| Mechanic route (road-following)| Currently shows a straight dashed line — needs a routing API (OSRM/ORS) |
| Cancel from portal side        | Garages can't currently cancel a job they accepted                        |
| SOS history for customers      | Customers can't see their past SOS requests                               |
| Admin dashboard                | No way to see all SOS requests system-wide                                |

### How notifications currently work (no push yet)
Right now, garages are notified via:
1. **WhatsApp** — customer's searching screen has a "Notify" button that opens WhatsApp to the garage's number
2. **Sound + vibration** — portal dashboard plays a beep and vibrates the device when a new SOS comes in via Realtime (only works if the portal tab is open)

For production, Web Push Notifications should be added so garages get alerted even when the browser tab is closed.

---

## Quick Reference — Status Flow

```
sos_requests.status:

  pending ──────────────────────────► accepted ──────► arrived ──────► verified
     │                                    │
     │ (no one accepts within time)       │ (garage accepts via portal
     │                                    │  OR mechanic via WhatsApp link)
     ▼                                    ▼
  cancelled                         sos_assignments row created
                                    mechanic_lat/lng starts updating
```

---

*Last updated: March 2026 — GarageDekho internal documentation*
