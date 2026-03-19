import { supabase } from "./supabase";

/* Map snake_case DB columns → camelCase used by the app */
function mapGarage(row) {
  return {
    id:             row.id,
    name:           row.name,
    rating:         row.rating,
    reviews:        row.reviews,
    distance:       row.distance,
    lat:            row.lat,
    lng:            row.lng,
    image:          row.image,
    verified:       row.verified,
    speciality:     row.speciality,
    vehicleType:    row.vehicle_type,
    isOpen:         row.is_open,
    waitTime:       row.wait_time,
    address:        row.address,
    phone:          row.phone,
    openHours:      row.open_hours,
    experience:     row.experience,
    vehiclesServed: row.vehicles_served,
    about:          row.about,
    services:       row.services    ?? [],
    reviewsList:    row.reviews_list ?? [],
  };
}

/* Fetch all garages, ordered by rating */
export async function getAllGarages() {
  const { data, error } = await supabase
    .from("garages")
    .select("*")
    .order("rating", { ascending: false });
  if (error) {
    console.error("Supabase error (getAllGarages):", error.message || error);
    return [];
  }
  return (data ?? []).map(mapGarage);
}

/* Fetch a single garage by id */
export async function getGarageById(id) {
  const { data, error } = await supabase
    .from("garages")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    console.error("Supabase error (getGarageById):", error.message || error);
    return null;
  }
  return mapGarage(data);
}
