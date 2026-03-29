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
| `badge` | Small label on the card | `NEW USER`, `WEEKEND DEAL`, `LIMITED` |
| `title` | Main heading of the offer | `Free First Inspection` |
| `subtitle` | Short description | `Get a free vehicle health check on your first booking.` |
| `discount` | Discount badge text | `FREE`, `20% OFF`, `₹100 OFF`, `₹199 FLAT` |
| `code` | Coupon code users apply at checkout | `FIRST100`, `WEEKEND20` |
| `valid_till` | Expiry date — format **YYYY-MM-DD** | `2026-06-30` |
| `category` | Filter category on Offers page | `all`, `car`, `bike`, `ev`, `refer` |
| `cta_label` | Button text | `Book Now`, `Refer Now`, `Claim Offer` |
| `cta_href` | Button link | `/near-me`, `/profile`, `/offers` |
| `gradient` | CSS gradient for background color | `linear-gradient(135deg, #0056D2 0%, #003fa3 100%)` |
| `active` | Show or hide | `true` = visible, `false` = hidden |
| `sort_order` | Display order (lower = first) | `1`, `2`, `3` |

---

## Gradient Color Examples

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

## Category Values (for the filter on /offers page)

| Value | Shows under filter |
|---|---|
| `all` | All + All filter |
| `car` | Cars filter |
| `bike` | Bikes filter |
| `ev` | EV filter |
| `refer` | Refer filter |

---

## How to Hide an Offer

- Set `active` = `false` → hides immediately
- Or set `valid_till` to a past date → auto-hides when expired

---

## How to Reorder Offers

Change `sort_order`. Lower number = shown first.

---

## Where Offers Appear

- **Home page** — banner cards (only shows when at least 1 active offer exists)
- **Offers page** (`/offers`) — full cards with coupon code reveal, expiry date, and category filters
