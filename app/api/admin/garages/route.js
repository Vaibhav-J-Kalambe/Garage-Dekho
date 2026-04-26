import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const adminSecret = request.headers.get("x-admin-secret");
  if (adminSecret !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "pending";

  let query = supabaseAdmin
    .from("portal_garages")
    .select("id, garage_name, owner_name, city, address, phone, whatsapp, services, vehicle_types, speciality, experience, status, rejection_reason, created_at")
    .order("created_at", { ascending: false });

  if (status === "pending") {
    query = query.or("status.eq.pending,status.is.null");
  } else if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ garages: data });
}
