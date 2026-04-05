# How to Add Garages to GarageDekho

## The Easy Way — Admin Panel

Go to: **http://localhost:3000/admin** (or your live domain **/admin**)

Password: `garage@admin2024`
_(Change this anytime in `.env.local` → `NEXT_PUBLIC_ADMIN_PASSWORD`)_

Fill in the form and click **"Add Garage to Website"** — it appears live instantly.

---

## What to Collect When You Visit a Garage

Take notes on your phone or a notepad:

| What to collect | Example |
|---|---|
| **Garage name** | Prime Auto Care |
| **Speciality** | AC Repair Specialist |
| **Vehicle type** | 4-Wheeler / 2-Wheeler / All Vehicles / EV |
| **Phone number** | +91 98765 43210 |
| **Full address** | 12, Sector 4, Koregaon Park, Pune |
| **Opening hours** | 8:00 AM – 9:00 PM |
| **Years in business** | 10 years |
| **Each service + price + time** | Oil Change · ₹499 · 30 min |
| **A photo** | Take one yourself or find on Google |

---

## Getting the Map Coordinates (Lat/Lng)

1. Open **Google Maps** on your phone
2. Long-press on the exact location of the garage
3. A pin drops and coordinates appear at the bottom (e.g. `18.5362, 73.8939`)
4. Tap them to copy
5. Paste into the **Latitude** and **Longitude** fields in the admin form

---

## Getting a Photo URL

**Option 1 — Google Images:**
1. Search the garage name on Google
2. Right-click an image → "Copy image address"
3. Paste in the Image URL field

**Option 2 — Take your own photo:**
1. Upload it to [imgbb.com](https://imgbb.com) (free)
2. Copy the "Direct link"
3. Paste in the Image URL field

**Option 3 — Pexels (for placeholder):**
Use any relevant photo from [pexels.com](https://pexels.com) until you have a real photo.

---

## Setting the Rating

Since you're visiting garages manually, set an initial rating based on your visit:

| Rating | Meaning |
|---|---|
| 5.0 | Exceptional — top-tier service, clean, professional |
| 4.5 – 4.9 | Very good — minor issues only |
| 4.0 – 4.4 | Good — solid, reliable |
| 3.5 – 3.9 | Average — gets the job done |
| Below 3.5 | Don't list yet |

Set reviews count to `0` initially. It'll grow as users leave reviews.

---

## Verified Badge

Check **"Mark as Verified"** only if you have personally visited the garage and confirmed:
- It is a real, operational garage
- The owner is aware of and agrees to be listed
- Pricing is accurate

---

## Alternative: Add Directly in Supabase

If you prefer a spreadsheet-style interface:

1. Go to [supabase.com](https://supabase.com) → your project
2. Click **Table Editor** → `garages`
3. Click **Insert row**
4. Fill in the fields
5. Click **Save**

For the `services` column, paste JSON like:
```json
[
  {"name": "Oil Change", "price": "₹499", "duration": "30 min"},
  {"name": "AC Repair",  "price": "₹999", "duration": "2-3 hrs"}
]
```

---

## Field Reference

| Field | Type | Notes |
|---|---|---|
| `name` | text | Required |
| `speciality` | text | Shown below garage name |
| `vehicle_type` | text | `4-Wheeler`, `2-Wheeler`, `All Vehicles`, or `EV` |
| `address` | text | Full street address |
| `phone` | text | Include country code: +91 |
| `lat` / `lng` | number | From Google Maps long-press |
| `distance` | text | e.g. `1.2 km` — approx from city center |
| `image` | text | Direct image URL |
| `open_hours` | text | e.g. `9:00 AM – 7:00 PM` |
| `is_open` | boolean | `true` or `false` |
| `wait_time` | text | e.g. `~15 min` |
| `rating` | number | 0.0 to 5.0 |
| `reviews` | number | Start at 0 |
| `experience` | number | Years in business |
| `vehicles_served` | number | Estimate, start at 0 |
| `verified` | boolean | Only if personally verified |
| `about` | text | 2-3 sentence description |
| `services` | JSON | Array of `{name, price, duration}` |

---

## Workflow Summary

```
Visit garage → collect details → open /admin → fill form → submit
```

The garage appears on the website **instantly** — no restart needed.
