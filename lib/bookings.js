import { supabase } from "./supabase";

export async function getUserBookings(userId) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Supabase error (getUserBookings):", error.message);
    return [];
  }
  return data ?? [];
}

export async function createBooking(payload) {
  const { data, error } = await supabase
    .from("bookings")
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function cancelBooking(bookingId) {
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);
  if (error) throw new Error(error.message);
}
