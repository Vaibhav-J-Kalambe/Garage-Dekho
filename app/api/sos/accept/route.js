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

// Basic Indian phone number validation
function isValidPhone(phone) {
  return !phone || /^\+?[\d\s\-]{7,15}$/.test(phone);
}

export async function POST(request) {
  try {
    const {
      requestId, garageId, garageName,
      mechanicName, mechanicPhone, mechanicLat, mechanicLng,
    } = await request.json();

    // Input validation
    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (!garageName || typeof garageName !== "string" || garageName.length > 100) {
      return NextResponse.json({ error: "Invalid garage name" }, { status: 400 });
    }
    if (!mechanicName || typeof mechanicName !== "string" || mechanicName.length > 80) {
      return NextResponse.json({ error: "Invalid mechanic name" }, { status: 400 });
    }
    if (!isValidPhone(mechanicPhone)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }
    if (mechanicLat !== undefined && mechanicLng !== undefined && !isValidCoord(mechanicLat, mechanicLng)) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    // Verify the SOS request exists and is still pending
    const { data: sos } = await supabase
      .from("sos_requests")
      .select("status")
      .eq("id", requestId)
      .single();

    if (!sos) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (sos.status !== "pending") {
      return NextResponse.json({ error: "Request already accepted or cancelled" }, { status: 409 });
    }

    // If garageId provided, verify it actually exists in the garages table
    if (garageId) {
      const { data: garage } = await supabase
        .from("garages")
        .select("id")
        .eq("id", garageId)
        .single();
      if (!garage) {
        return NextResponse.json({ error: "Garage not found" }, { status: 404 });
      }
    }

    const { data: assignment, error: assignErr } = await supabase
      .from("sos_assignments")
      .insert({
        request_id:     requestId,
        garage_id:      garageId    || null,
        garage_name:    garageName.trim(),
        mechanic_name:  mechanicName.trim(),
        mechanic_phone: mechanicPhone?.trim() || null,
        mechanic_lat:   mechanicLat  ?? null,
        mechanic_lng:   mechanicLng  ?? null,
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
