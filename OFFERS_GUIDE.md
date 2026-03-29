# How to Add Offers on GarageDekho

Offers are managed directly from the **Supabase Dashboard** — no code changes needed.

---

## Step 1 — Open Supabase

1. Go to [supabase.com](https://supabase.com) → Sign in
2. Open your **GarageDekho** project
3. Click **Table Editor** in the left sidebar
4. Open the **`offers`** table

---

## Step 2 — Add a New Offer

Click **"Insert row"** and fill in these fields:

| Field | What to enter | Example |
|---|---|---|
| `tag` | Badge label shown on the card | `NEW USER`, `WEEKEND DEAL`, `LIMITED` |
| `title` | Main heading of the offer | `Free First Inspection` |
| `description` | Short description line | `Get a free vehicle health check on your first booking.` |
| `discount` | Discount badge text | `FREE`, `20% OFF`, `₹100 OFF` |
| `code` | Promo code users apply | `FIRST100` |
| `valid_till` | Expiry date (YYYY-MM-DD) | `2026-06-30` |
| `category` | Which users see it | `all`, `car`, `bike`, `ev`, `refer` |
| `gradient` | Background colors (array) | `["#0056D2", "#003fa3"]` |
| `min_order` | Minimum order requirement | `₹499` or leave blank |
| `usage_limit` | Usage rule text | `One-time per user` or blank |
| `active` | Show or hide the offer | `true` = visible, `false` = hidden |
| `sort_order` | Display order (lower = first) | `1`, `2`, `3` |

---

## Gradient Color Examples

Copy any of these into the `gradient` field:

| Color | Value |
|---|---|
| Blue (default) | `["#0056D2", "#003fa3"]` |
| Orange | `["#FF6B00", "#e05a00"]` |
| Green | `["#16a34a", "#15803d"]` |
| Teal | `["#0891b2", "#0e7490"]` |
| Purple | `["#7c3aed", "#6d28d9"]` |
| Red | `["#ef4444", "#dc2626"]` |
| Dark gray | `["#4b5563", "#1f2937"]` |

---

## Step 3 — Save

Click **Save** (or **Confirm**). The offer appears on the home page instantly — no deployment needed.

---

## How to Hide an Offer

- Set `active` = `false` → offer disappears from the site immediately
- Or set `valid_till` to a past date → auto-hides when expired

---

## How to Reorder Offers

Change the `sort_order` number. Lower number = shown first.
Example: offer with `sort_order = 1` appears above offer with `sort_order = 2`.

---

## Where Offers Appear

- **Home page** — as banner cards (only shows if at least 1 active offer exists)
- **Offers page** (`/offers`) — full list with copy-code button and filters
