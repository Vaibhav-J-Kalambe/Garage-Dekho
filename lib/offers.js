import { supabase } from "./supabase";

export async function getOffers() {
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id:        row.id,
    badge:     row.badge,
    title:     row.title,
    subtitle:  row.subtitle,
    ctaLabel:  row.cta_label || "Book Now",
    ctaHref:   row.cta_href  || "/near-me",
    gradient:  row.gradient,
    // offers page fields
    tag:       row.badge,
    description: row.subtitle,
    discount:  row.discount,
    code:      row.code,
    validTill: row.valid_till,
    category:   row.category || "all",
    usageLimit: row.usage_limit || null,
    minOrder:   row.min_order || null,
  }));
}
