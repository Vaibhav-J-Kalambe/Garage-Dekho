import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { booking_id, garage_id } = await request.json();

    if (!booking_id || !garage_id) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    /* Verify the booking belongs to this garage and is confirmed */
    const { data: booking, error: fetchErr } = await supabaseAdmin
      .from("bookings")
      .select("id, status, garage_id")
      .eq("id", booking_id)
      .eq("garage_id", garage_id)
      .single();

    if (fetchErr || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.status !== "confirmed") {
      return NextResponse.json({ error: "Booking is not in confirmed state" }, { status: 400 });
    }

    /* Generate 6-digit OTP, valid for 30 minutes */
    const otp        = String(Math.floor(100000 + Math.random() * 900000));
    const expires_at = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { error: updateErr } = await supabaseAdmin
      .from("bookings")
      .update({ service_otp: otp, otp_expires_at: expires_at })
      .eq("id", booking_id);

    if (updateErr) throw updateErr;

    return NextResponse.json({ otp, expires_at });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
