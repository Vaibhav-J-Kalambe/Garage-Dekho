import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function isValidCoord(lat, lng) {
  return (
    typeof lat === "number" && typeof lng === "number" &&
    isFinite(lat) && isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  );
}

export async function POST(request) {
  try {
    const { requestId, lat, lng } = await request.json();

    if (!requestId || !isValidCoord(lat, lng)) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

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
