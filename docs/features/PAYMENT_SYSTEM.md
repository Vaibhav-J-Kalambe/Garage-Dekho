# GarageDekho — Payment & Payout System Guide

## Overview

When a customer pays for a booking, the full amount goes to GarageDekho's Razorpay account.
GarageDekho keeps a commission (15%) and manually pays the remaining amount to the garage owner.

---

## Flow Diagram

```
Customer Books Service
        ↓
Customer Pays (e.g. ₹1000) via Razorpay Checkout
        ↓
Full ₹1000 lands in GarageDekho's Razorpay account
        ↓
System records the split:
  - GarageDekho keeps: ₹150  (15% commission)
  - Garage gets:       ₹850  (85% of booking)
        ↓
Admin goes to /admin/payouts
        ↓
Admin manually sends ₹850 to garage via UPI/GPay/PhonePe
        ↓
Admin clicks "Mark Paid" → recorded in database
```

---

## Commission Structure

| Booking Amount | GarageDekho (15%) | Garage Gets (85%) |
|---------------|-------------------|-------------------|
| ₹100          | ₹15               | ₹85               |
| ₹299          | ₹45               | ₹254              |
| ₹500          | ₹75               | ₹425              |
| ₹999          | ₹150              | ₹849              |
| ₹1499         | ₹225              | ₹1274             |

Commission % can be changed in `.env.local` → `COMMISSION_PCT=15`

---

## Tech Stack

| Component        | Technology         |
|------------------|--------------------|
| Payment Gateway  | Razorpay           |
| Database         | Supabase (payments table) |
| Backend          | Next.js API Routes |
| Admin Panel      | /admin/payouts     |

---

## How a Payment Works (Technical)

### Step 1 — Customer clicks "Book & Pay"
- `BookingModal.js` calls `/api/payment/create-order`
- Order is created in Razorpay
- A `pending` record is saved in the `payments` table with commission split

### Step 2 — Customer completes payment
- Razorpay Checkout opens (card / UPI / netbanking)
- On success, `BookingModal.js` calls `/api/payment/verify`
- Signature is verified (security check)
- Payment status updated to `captured` in `payments` table
- Booking is confirmed in `bookings` table

### Step 3 — Admin pays garage (Manual)
- Admin visits `/admin/payouts`
- Sees list of all captured payments with garage name + amount to pay
- Sends money to garage via UPI manually
- Clicks "Mark Paid" → `payout_status` updates to `paid`

---

## Database Table: payments

| Column               | Type    | Description                        |
|----------------------|---------|------------------------------------|
| id                   | UUID    | Unique payment ID                  |
| garage_id            | UUID    | Which garage                       |
| garage_name          | TEXT    | Garage name (for display)          |
| razorpay_order_id    | TEXT    | Razorpay order reference           |
| razorpay_payment_id  | TEXT    | Razorpay payment reference         |
| amount_total         | INTEGER | Total paid by customer (in paise)  |
| amount_commission    | INTEGER | GarageDekho's cut (in paise)       |
| amount_garage        | INTEGER | Amount to pay garage (in paise)    |
| commission_pct       | NUMERIC | Commission % applied               |
| status               | TEXT    | pending / captured / failed        |
| payout_status        | TEXT    | pending / paid                     |
| created_at           | TIMESTAMP | When payment was made            |

> Note: All amounts stored in paise. Divide by 100 for rupees. (9900 paise = ₹99)

---

## Admin Panel — /admin/payouts

**Password:** Same as admin panel (`NEXT_PUBLIC_ADMIN_PASSWORD` in .env.local)

**What you can see:**
- Total collected from all customers
- Your total commission earned
- Total pending payouts to garages

**What you can do:**
- Filter by All / Pending / Paid
- See each payment: customer paid / your cut / garage's share
- Copy Razorpay Payment ID for reference
- Click "Mark Paid" after sending money to garage

---

## Environment Variables

```
RAZORPAY_KEY_ID=rzp_live_xxx        # Razorpay Key ID (keep secret)
RAZORPAY_KEY_SECRET=xxx             # Razorpay Secret (never expose)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxx  # Used in frontend checkout
COMMISSION_PCT=15                   # Your commission percentage
```

> ⚠️ Never share RAZORPAY_KEY_SECRET with anyone. Never commit .env.local to git.

---

## Razorpay Account

- **Dashboard:** razorpay.com/dashboard
- **Mode:** Live (real payments)
- **Settlements:** Razorpay auto-settles to GarageDekho's bank account every 2 business days
- **Test Mode:** Toggle "Test Mode" in Razorpay dashboard for testing without real money

---

## Future Upgrade — Razorpay Route (When eligible)

Once GarageDekho reaches ₹40L+ annual turnover, apply for **Razorpay Route**:
- Split payments become automatic
- No manual UPI transfers needed
- Garage gets paid instantly after booking
- Email: routepriority@razorpay.com with GST-3B returns as proof

---

## Collecting Garage Payout Details

Currently garage owners need to share their UPI ID or bank details directly.
A payout details form will be added to the Garage Portal so owners can submit:
- UPI ID (preferred)
- Bank Account Number + IFSC

Until then, collect details via WhatsApp/phone and maintain a separate record.

---

## Quick Reference for Manual Payout

1. Open `/admin/payouts`
2. Find payment with `payout_status = pending`
3. Note the garage name and "Pay Garage" amount
4. Send money via GPay/PhonePe/UPI to that garage
5. Come back and click **"Mark Paid"**
6. Done ✓

