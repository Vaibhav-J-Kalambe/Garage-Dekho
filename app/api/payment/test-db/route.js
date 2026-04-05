import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Try inserting a test row
  const { data, error } = await supabaseAdmin.from("payments").insert({
    garage_name:       "Test Garage",
    razorpay_order_id: "test_" + Date.now(),
    amount_total:      9900,
    amount_commission: 1485,
    amount_garage:     8415,
    commission_pct:    15,
    status:            "captured",
    payout_status:     "pending",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, row: data });
}
