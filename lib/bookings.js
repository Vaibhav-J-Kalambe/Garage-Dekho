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

export async function getLastBooking(userId) {
  const { data, error } = await supabase
    .from("bookings")
    .select("garage_name, garage_id, service_name")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (error) return null;
  return data;
}

export async function getBookingCounts(userId) {
  const { count, error } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) return 0;
  return count ?? 0;
}
