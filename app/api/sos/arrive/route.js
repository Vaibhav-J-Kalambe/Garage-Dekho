import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateOtp() {
  // 6-digit cryptographically secure OTP (1,000,000 possibilities)
  return (crypto.randomInt(100000, 999999)).toString();
}

export async function POST(request) {
  try {
    const { requestId } = await request.json();
    const otp = generateOtp();

    await supabase
      .from("sos_assignments")
      .update({ otp })
      .eq("request_id", requestId);

    await supabase
      .from("sos_requests")
      .update({ status: "arrived" })
      .eq("id", requestId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
