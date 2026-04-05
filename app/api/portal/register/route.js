import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const {
      email, password, existingId,
      // Basic Info
      ownerName, garageName, speciality, experience, about, vehicleTypes,
      // Location
      address, city, pincode, lat, lng,
      // Services
      services,
      // Hours & Contact
      openTime, closeTime, closedDays, phone, whatsapp, garageEmail,
      // Payout
      upiId, bankName, bankAccount, bankIfsc,
    } = await request.json();

    if (!garageName) {
      return NextResponse.json({ error: "Garage name is required" }, { status: 400 });
    }

    let userId = existingId;

    // If no existingId, create a new auth user
    if (!userId) {
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
      }

      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email:         email.trim().toLowerCase(),
        password,
        email_confirm: true,
      });

      if (authErr) {
        if (authErr.message?.includes("already been registered") || authErr.code === "email_exists") {
          return NextResponse.json({ error: "This email is already registered. Please sign in instead." }, { status: 409 });
        }
        return NextResponse.json({ error: authErr.message }, { status: 400 });
      }

      userId = authData.user.id;
    }

    // Insert portal_garages using service role (bypasses RLS)
    const { error: garageErr } = await supabaseAdmin.from("portal_garages").insert({
      user_id:              userId,
      garage_name:          garageName.trim(),
      owner_name:           ownerName?.trim() || null,
      speciality:           speciality?.trim() || null,
      experience:           experience || null,
      about:                about?.trim() || null,
      vehicle_types:        vehicleTypes || [],
      phone:                phone?.trim() || null,
      whatsapp:             whatsapp?.trim() || null,
      garage_email:         garageEmail?.trim() || null,
      address:              address?.trim() || null,
      city:                 city?.trim() || null,
      pincode:              pincode?.trim() || null,
      lat:                  lat || null,
      lng:                  lng || null,
      services:             services || [],
      working_hours:        { open: openTime || "09:00", close: closeTime || "21:00", closed_days: closedDays || [] },
      upi_id:               upiId?.trim() || null,
      bank_account_name:    bankName?.trim() || null,
      bank_account_number:  bankAccount?.trim() || null,
      bank_ifsc:            bankIfsc?.trim() || null,
      status:               "pending",
    });

    if (garageErr) {
      // Already has a garage — just redirect them to dashboard/pending
      if (garageErr.code === "23505") {
        return NextResponse.json({ ok: true, existing: true });
      }
      // Only delete the user if we just created them
      if (!existingId) await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});
      return NextResponse.json({ error: garageErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
