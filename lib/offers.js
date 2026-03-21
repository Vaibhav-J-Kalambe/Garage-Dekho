import { supabase } from "./supabase";
import staticOffers from "../app/offers/data.json";

export async function getOffers() {
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .gte("valid_till", new Date().toISOString().split("T")[0])
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) return staticOffers;

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
