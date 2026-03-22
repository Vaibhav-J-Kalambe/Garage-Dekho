import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { requestId, garageId, garageName, mechanicName, mechanicPhone, mechanicLat, mechanicLng } = await request.json();

    const { data: sos } = await supabase
      .from("sos_requests")
      .select("status")
      .eq("id", requestId)
      .single();

    if (!sos) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (sos.status !== "pending") return NextResponse.json({ error: "Request already accepted or cancelled" }, { status: 409 });

    const { data: assignment, error: assignErr } = await supabase
      .from("sos_assignments")
      .insert({
        request_id:    requestId,
        garage_id:     garageId || null,
        garage_name:   garageName,
        mechanic_name: mechanicName,
        mechanic_phone: mechanicPhone || null,
        mechanic_lat:  mechanicLat || null,
        mechanic_lng:  mechanicLng || null,
      })
      .select()
      .single();

    if (assignErr) throw assignErr;

    await supabase
      .from("sos_requests")
      .update({ status: "accepted" })
      .eq("id", requestId);

    return NextResponse.json({ assignment });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
