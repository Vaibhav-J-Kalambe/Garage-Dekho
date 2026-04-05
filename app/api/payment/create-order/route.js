import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const COMMISSION_PCT = Number(process.env.COMMISSION_PCT || 15);

export async function POST(request) {
  try {
    const { amount, receipt, garage_id, garage_name } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Payment not configured" }, { status: 503 });
    }

    const auth = Buffer.from(keyId + ":" + keySecret).toString("base64");

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + auth,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        amount:   Math.round(amount), // already in paise
        currency: "INR",
        receipt:  receipt || "rcpt_" + Date.now(),
      }),
    });

    const order = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: order.error?.description || "Failed to create order" },
        { status: res.status }
      );
    }

    // Calculate commission split
    const amountPaise      = Math.round(amount);
    const commissionAmount = Math.round(amountPaise * COMMISSION_PCT / 100);
    const garageAmount     = amountPaise - commissionAmount;

    // Save pending payment record
    const { error: dbErr } = await supabaseAdmin.from("payments").insert({
      garage_id:         garage_id  || null,
      garage_name:       garage_name || null,
      razorpay_order_id: order.id,
      amount_total:      amountPaise,
      amount_commission: commissionAmount,
      amount_garage:     garageAmount,
      commission_pct:    COMMISSION_PCT,
      status:            "pending",
      payout_status:     "pending",
    });

    if (dbErr) console.error("[create-order] DB insert error:", dbErr.message);

    return NextResponse.json(order);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
