import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(request) {
  try {
    const { userLat, userLng } = await request.json();

    const { data: garages } = await supabase
      .from("garages")
      .select("id, name, phone, lat, lng");

    const nearby = (garages || [])
      .filter((g) => g.lat && g.lng)
      .map((g) => ({ ...g, distance: haversine(userLat, userLng, g.lat, g.lng) }))
      .filter((g) => g.distance <= 10)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);

    return NextResponse.json({ garages: nearby });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
