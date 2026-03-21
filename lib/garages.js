import { supabase } from "./supabase";

/* Parse "9:00 AM – 7:00 PM" and check if current time is within range */
function computeIsOpen(openHours) {
  if (!openHours) return false;
  try {
    const parts = openHours.split(/[–\-]/);
    if (parts.length < 2) return false;
    const toMinutes = (str) => {
      const s = str.trim().toUpperCase();
      const [time, period] = s.split(" ");
      let [h, m] = time.split(":").map(Number);
      if (period === "PM" && h !== 12) h += 12;
      if (period === "AM" && h === 12) h = 0;
      return h * 60 + (m || 0);
    };
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    return currentMin >= toMinutes(parts[0]) && currentMin < toMinutes(parts[1]);
  } catch {
    return false;
  }
}

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
    isOpen:         computeIsOpen(row.open_hours),
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

/* Count currently open garages */
export async function getOpenGarageCount() {
  const { count, error } = await supabase
    .from("garages")
    .select("id", { count: "exact", head: true })
    .eq("is_open", true);
  if (error) return null;
  return count ?? 0;
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
