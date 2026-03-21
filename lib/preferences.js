import { supabase } from "./supabase";

export async function getPreferences(userId) {
  const { data } = await supabase
    .from("user_preferences")
    .select("prefs")
    .eq("user_id", userId)
    .single();
  return data?.prefs ?? {};
}

export async function savePreferences(userId, prefs) {
  const { error } = await supabase
    .from("user_preferences")
    .upsert({ user_id: userId, prefs }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}
