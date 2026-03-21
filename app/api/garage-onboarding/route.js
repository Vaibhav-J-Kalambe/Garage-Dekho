import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      // Step 1 — Basic Info
      garage_name, speciality, about, experience, vehicle_types,
      // Step 2 — Location
      address, city, pincode, lat, lng,
      // Step 3 — Services
      services,
      // Step 4 — Hours & Contact
      open_hours, phone, whatsapp, email,
      // Owner
      owner_name,
    } = body;

    if (!garage_name || !address || !phone || !owner_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("garage_applications")
      .insert({
        garage_name,
        speciality,
        about,
        experience,
        vehicle_types,
        address: address + (city ? ", " + city : "") + (pincode ? " - " + pincode : ""),
        city,
        pincode,
        lat:       lat    ? parseFloat(lat)    : null,
        lng:       lng    ? parseFloat(lng)    : null,
        services:  services ?? [],
        open_hours,
        phone,
        whatsapp,
        email,
        owner_name,
        status:    "pending",
        submitted_at: new Date().toISOString(),
      });

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
