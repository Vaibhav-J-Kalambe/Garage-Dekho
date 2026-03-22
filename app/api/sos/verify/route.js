import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { requestId, otp } = await request.json();

    const { data: assignment } = await supabase
      .from("sos_assignments")
      .select("otp")
      .eq("request_id", requestId)
      .single();

    if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    if (assignment.otp !== otp) return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });

    await supabase.from("sos_assignments").update({ otp_verified: true }).eq("request_id", requestId);
    await supabase.from("sos_requests").update({ status: "verified" }).eq("id", requestId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
