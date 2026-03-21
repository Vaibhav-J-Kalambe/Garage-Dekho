import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { amount, receipt } = await request.json();

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

    return NextResponse.json(order);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
