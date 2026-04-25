import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const adminSecret = request.headers.get("x-admin-secret");
  if (adminSecret !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { garage_id } = await request.json();
  if (!garage_id) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  // Get the user_id before deleting
  const { data: garage } = await supabaseAdmin
    .from("portal_garages")
    .select("user_id")
    .eq("id", garage_id)
    .single();

  // Delete from public garages table (same UUID)
  await supabaseAdmin.from("garages").delete().eq("id", garage_id).catch(() => {});

  // Delete portal garage record
  const { error } = await supabaseAdmin
    .from("portal_garages")
    .delete()
    .eq("id", garage_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Delete the auth user so they can't log in
  if (garage?.user_id) {
    await supabaseAdmin.auth.admin.deleteUser(garage.user_id).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
