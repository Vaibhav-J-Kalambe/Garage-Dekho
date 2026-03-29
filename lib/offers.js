import { supabase } from "./supabase";

export async function getOffers() {
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("active", true)
    .gte("valid_till", new Date().toISOString().split("T")[0])
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id:          row.id,
    tag:         row.tag,
    title:       row.title,
    description: row.description,
    discount:    row.discount,
    code:        row.code,
    validTill:   row.valid_till,
    category:    row.category,
    gradient:    row.gradient,
    minOrder:    row.min_order ?? null,
    usageLimit:  row.usage_limit,
  }));
}
