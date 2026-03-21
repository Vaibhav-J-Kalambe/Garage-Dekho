import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  // Verify admin password
  const authHeader = request.headers.get("x-admin-password");
  if (authHeader !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, action, overrides } = await request.json();
    // action: "approve" | "reject"

    if (action === "reject") {
      await supabase
        .from("garage_applications")
        .update({ status: "rejected" })
        .eq("id", id);
      return NextResponse.json({ ok: true });
    }

    // Fetch the application
    const { data: app, error: fetchErr } = await supabase
      .from("garage_applications")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Build garage record from application + any admin overrides
    const garageRow = {
      name:            app.garage_name,
      speciality:      app.speciality      || "",
      about:           app.about           || "",
      vehicle_type:    app.vehicle_types   || "4-Wheeler",
      address:         app.address         || "",
      phone:           app.phone           || "",
      lat:             app.lat             ?? null,
      lng:             app.lng             ?? null,
      open_hours:      app.open_hours      || "9:00 AM – 7:00 PM",
      services:        app.services        ?? [],
      experience:      0,
      vehicles_served: 0,
      rating:          0,
      reviews:         0,
      reviews_list:    [],
      verified:        false,
      is_open:         false,
      wait_time:       "~15 min",
      distance:        "",
      image:           "",
      ...overrides, // admin can pass image URL, rating, etc.
    };

    const { error: insertErr } = await supabase.from("garages").insert(garageRow);
    if (insertErr) throw new Error(insertErr.message);

    // Mark application as approved
    await supabase
      .from("garage_applications")
      .update({ status: "approved" })
      .eq("id", id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
