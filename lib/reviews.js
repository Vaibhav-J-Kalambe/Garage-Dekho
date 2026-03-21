import { supabase } from "./supabase";

export async function submitReview(userId, garageId, bookingId, rating, comment, userName) {
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      user_id:    userId,
      garage_id:  Number(garageId),
      booking_id: bookingId,
      rating,
      comment:    comment?.trim() || null,
      user_name:  userName || "User",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getGarageReviews(garageId) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, user_id, user_name")
    .eq("garage_id", Number(garageId))
    .order("created_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function getUserReviews(userId) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, garage_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function hasReviewed(userId, bookingId) {
  const { count, error } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("booking_id", bookingId);
  if (error) return false;
  return (count ?? 0) > 0;
}
