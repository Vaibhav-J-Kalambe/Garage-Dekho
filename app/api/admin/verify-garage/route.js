import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function formatOpenHours(wh) {
  if (!wh) return "9:00 AM – 9:00 PM";
  const fmt = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour   = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${period}`;
  };
  return `${fmt(wh.open)} – ${fmt(wh.close)}`;
}

export async function POST(request) {
  const adminSecret = request.headers.get("x-admin-secret");
  if (adminSecret !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { garage_id, action, rejection_reason } = await request.json();
  if (!garage_id || !["approved", "rejected"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Update status (and reason if rejecting) in portal_garages
  const updatePayload = { status: action };
  if (action === "rejected" && rejection_reason) updatePayload.rejection_reason = rejection_reason;
  if (action === "approved") updatePayload.rejection_reason = null;

  const { error } = await supabaseAdmin
    .from("portal_garages")
    .update(updatePayload)
    .eq("id", garage_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (action === "approved") {
    // Fetch full portal garage data to copy into the public garages table
    const { data: pg } = await supabaseAdmin
      .from("portal_garages")
      .select("*")
      .eq("id", garage_id)
      .single();

    if (pg) {
      const garageRow = {
        portal_garage_id: pg.id,          // UUID linking portal_garages ↔ garages
        name:             pg.garage_name,
        lat:              pg.lat,
        lng:              pg.lng,
        address:          pg.address,
        phone:            pg.phone,
        speciality:       pg.speciality  || null,
        experience:       pg.experience ? String(pg.experience) : null,
        about:            pg.about       || null,
        verified:         true,
        vehicle_type:     pg.vehicle_types?.[0] || null,
        vehicles_served:  (pg.vehicle_types ?? []).join(", ") || null,
        open_hours:       formatOpenHours(pg.working_hours),
        services:         (pg.services ?? []).map((s) => s.name).filter(Boolean),
        rating:           0,
        reviews:          0,
        reviews_list:     [],
        image:            null,
        wait_time:        null,
      };

      const { error: upsertErr } = await supabaseAdmin
        .from("garages")
        .upsert(garageRow, { onConflict: "portal_garage_id" });

      if (upsertErr) {
        console.error("Failed to upsert into garages:", upsertErr.message);
        return NextResponse.json({ error: "Approved but failed to publish: " + upsertErr.message }, { status: 500 });
      }
    }
  }

  if (action === "rejected") {
    // Remove from public garages if it was previously approved
    const { error: delErr } = await supabaseAdmin
      .from("garages")
      .delete()
      .eq("portal_garage_id", garage_id);
    if (delErr) console.error("Failed to remove from garages on reject:", delErr.message);
  }

  return NextResponse.json({ ok: true });
}
