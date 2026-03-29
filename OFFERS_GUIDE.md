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
| `badge` | Small label shown on the card | `NEW USER`, `WEEKEND DEAL`, `LIMITED` |
| `title` | Main heading of the offer | `Free First Inspection` |
| `subtitle` | Short description line | `Get a free vehicle health check on your first booking.` |
| `cta_label` | Button text | `Book Now`, `Refer Now`, `Learn More` |
| `cta_href` | Button link | `/near-me`, `/profile`, `/offers` |
| `gradient` | CSS gradient for background | `linear-gradient(135deg, #0056D2 0%, #003fa3 100%)` |
| `active` | Show or hide the offer | `true` = visible, `false` = hidden |
| `sort_order` | Display order (lower = first) | `1`, `2`, `3` |

---

## Gradient Color Examples

Copy any of these into the `gradient` field:

| Color | Value |
|---|---|
| Blue (default) | `linear-gradient(135deg, #0056D2 0%, #003fa3 100%)` |
| Orange | `linear-gradient(135deg, #FF6B00 0%, #e05a00 100%)` |
| Green | `linear-gradient(135deg, #16a34a 0%, #15803d 100%)` |
| Teal | `linear-gradient(135deg, #0891b2 0%, #0e7490 100%)` |
| Purple | `linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)` |
| Red | `linear-gradient(135deg, #ef4444 0%, #dc2626 100%)` |
| Dark gray | `linear-gradient(135deg, #4b5563 0%, #1f2937 100%)` |

---

## Step 3 — Save

Click **Save**. The offer appears on the home page instantly — no deployment needed.

---

## How to Hide an Offer

Set `active` = `false` → offer disappears from the site immediately.

---

## How to Reorder Offers

Change the `sort_order` number. Lower number = shown first.

---

## Where Offers Appear

- **Home page** — as banner cards (only shows if at least 1 active offer exists)
- **Offers page** (`/offers`) — full list with filters
