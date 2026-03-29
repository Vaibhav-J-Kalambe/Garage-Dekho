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
    id:       row.id,
    badge:    row.badge,
    title:    row.title,
    subtitle: row.subtitle,
    ctaLabel: row.cta_label || "Book Now",
    ctaHref:  row.cta_href  || "/near-me",
    gradient: row.gradient,
  }));
}
