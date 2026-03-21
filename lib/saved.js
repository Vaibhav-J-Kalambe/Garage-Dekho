import { supabase } from "./supabase";

export async function getSavedGarageIds(userId) {
  const { data, error } = await supabase
    .from("saved_garages")
    .select("garage_id")
    .eq("user_id", userId);
  if (error) return [];
  // Convert to string so comparisons work whether garage id is number or string
  return (data ?? []).map((r) => String(r.garage_id));
}

export async function getSavedGarages(userId) {
  const { data, error } = await supabase
    .from("saved_garages")
    .select("garage_id, garages(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((r) => ({
    id:         r.garages.id,
    name:       r.garages.name,
    image:      r.garages.image,
    address:    r.garages.address,
    rating:     r.garages.rating,
    speciality: r.garages.speciality,
    isOpen:     r.garages.is_open,
  }));
}

export async function saveGarage(userId, garageId) {
  const { error } = await supabase
    .from("saved_garages")
    .insert({ user_id: userId, garage_id: Number(garageId) });
  if (error) throw new Error(error.message);
}

export async function unsaveGarage(userId, garageId) {
  const { error } = await supabase
    .from("saved_garages")
    .delete()
    .eq("user_id", userId)
    .eq("garage_id", Number(garageId));
  if (error) throw new Error(error.message);
}
