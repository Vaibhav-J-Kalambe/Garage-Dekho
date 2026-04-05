import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// In-memory rate limiter: max 5 OTP attempts per requestId per 10 minutes
const otpAttempts = new Map();

export async function POST(request) {
  try {
    const { requestId, otp } = await request.json();

    if (!requestId || !otp || typeof otp !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Rate limit: 5 attempts per requestId per 10 min
    const now = Date.now();
    const record = otpAttempts.get(requestId) ?? { count: 0, windowStart: now };
    if (now - record.windowStart > 10 * 60 * 1000) { record.count = 0; record.windowStart = now; }
    if (record.count >= 5) {
      return NextResponse.json({ error: "Too many attempts. Wait 10 minutes." }, { status: 429 });
    }

    const { data: assignment } = await supabase
      .from("sos_assignments")
      .select("otp, otp_verified")
      .eq("request_id", requestId)
      .single();

    if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    if (assignment.otp_verified) return NextResponse.json({ error: "OTP already used" }, { status: 409 });

    // Timing-safe comparison — both sides written into fixed 6-byte buffers
    // so timingSafeEqual never throws and length leaks no info
    const storedBuf = Buffer.alloc(6);
    const inputBuf  = Buffer.alloc(6);
    storedBuf.write(String(assignment.otp).slice(0, 6));
    inputBuf.write(String(otp).slice(0, 6));
    const match = String(otp).length === 6 && crypto.timingSafeEqual(storedBuf, inputBuf);

    if (!match) {
      record.count += 1;
      otpAttempts.set(requestId, record);
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Clear rate limit on success
    otpAttempts.delete(requestId);

    await supabase.from("sos_assignments").update({ otp_verified: true }).eq("request_id", requestId);
    await supabase.from("sos_requests").update({ status: "verified" }).eq("id", requestId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
