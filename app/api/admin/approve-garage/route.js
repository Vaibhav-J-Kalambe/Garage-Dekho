import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function POST(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Timing-safe password check — both sides padded to fixed 64 bytes
  // so timingSafeEqual never throws (requires equal-length buffers)
  const authHeader = request.headers.get("x-admin-password") || "";
  const adminPw    = process.env.ADMIN_PASSWORD || "";
  const headerBuf  = Buffer.alloc(64);
  const pwBuf      = Buffer.alloc(64);
  headerBuf.write(authHeader.slice(0, 64));
  pwBuf.write(adminPw.slice(0, 64));
  const authorized = crypto.timingSafeEqual(headerBuf, pwBuf) && authHeader.length === adminPw.length;

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, action, imageUrl } = await request.json();
    // Only accept imageUrl as an override — not arbitrary fields

    if (action === "reject") {
      await supabase
        .from("garage_applications")
        .update({ status: "rejected" })
        .eq("id", id);
      return NextResponse.json({ ok: true });
    }

    const { data: app, error: fetchErr } = await supabase
      .from("garage_applications")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const garageRow = {
      name:            app.garage_name,
      speciality:      app.speciality    || "",
      about:           app.about         || "",
      vehicle_type:    app.vehicle_types || "4-Wheeler",
      address:         app.address       || "",
      phone:           app.phone         || "",
      lat:             app.lat           ?? null,
      lng:             app.lng           ?? null,
      open_hours:      app.open_hours    || "9:00 AM - 7:00 PM",
      services:        app.services      ?? [],
      experience:      0,
      vehicles_served: 0,
      rating:          0,
      reviews:         0,
      reviews_list:    [],
      verified:        false,
      is_open:         false,
      wait_time:       "~15 min",
      distance:        "",
      image:           typeof imageUrl === "string" ? imageUrl : "",
    };

    const { error: insertErr } = await supabase.from("garages").insert(garageRow);
    if (insertErr) throw new Error(insertErr.message);

    await supabase
      .from("garage_applications")
      .update({ status: "approved" })
      .eq("id", id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
