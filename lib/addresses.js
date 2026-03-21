import { supabase } from "./supabase";

export async function getUserAddresses(userId) {
  const { data, error } = await supabase
    .from("user_addresses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function addUserAddress(userId, { label, address, icon }) {
  const { data, error } = await supabase
    .from("user_addresses")
    .insert({ user_id: userId, label, address, icon })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function removeUserAddress(id) {
  const { error } = await supabase
    .from("user_addresses")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}
