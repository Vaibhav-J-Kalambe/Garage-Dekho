import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    /* Verify caller is a logged-in user */
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: { user }, error: authErr } = await supabaseAnon.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { booking_id, otp } = await request.json();
    if (!booking_id || !otp) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    /* Fetch the booking */
    const { data: booking, error: fetchErr } = await supabaseAdmin
      .from("bookings")
      .select("id, user_id, status, service_otp, otp_expires_at")
      .eq("id", booking_id)
      .eq("user_id", user.id)
      .single();

    if (fetchErr || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.status !== "confirmed") {
      return NextResponse.json({ error: "Booking is not in confirmed state" }, { status: 400 });
    }
    if (!booking.service_otp) {
      return NextResponse.json({ error: "OTP not generated yet. Ask garage staff to generate it." }, { status: 400 });
    }
    if (new Date(booking.otp_expires_at) < new Date()) {
      return NextResponse.json({ error: "OTP has expired. Ask garage staff to generate a new one." }, { status: 400 });
    }
    if (booking.service_otp !== String(otp).trim()) {
      return NextResponse.json({ error: "Incorrect OTP. Please try again." }, { status: 400 });
    }

    /* OTP correct — move booking to in_service, clear OTP */
    const { error: updateErr } = await supabaseAdmin
      .from("bookings")
      .update({ status: "in_service", service_otp: null, otp_expires_at: null })
      .eq("id", booking_id);

    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
