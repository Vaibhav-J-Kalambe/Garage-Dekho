import { supabase } from "./supabase";

export async function getUserVehicles(userId) {
  const { data, error } = await supabase
    .from("user_vehicles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function addUserVehicle(userId, { name, type, number_plate }) {
  const { data, error } = await supabase
    .from("user_vehicles")
    .insert({ user_id: userId, name, type, number_plate })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function removeUserVehicle(vehicleId) {
  const { error } = await supabase
    .from("user_vehicles")
    .delete()
    .eq("id", vehicleId);
  if (error) throw new Error(error.message);
}
