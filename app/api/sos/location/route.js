import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { requestId, lat, lng } = await request.json();

    const { error } = await supabase
      .from("sos_assignments")
      .update({ mechanic_lat: lat, mechanic_lng: lng })
      .eq("request_id", requestId);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
