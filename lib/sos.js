import { supabase } from "./supabase";

/** Create a new SOS request row */
export async function createSosRequest({ userId, issueType, userLat, userLng, userAddress }) {
  const { data, error } = await supabase
    .from("sos_requests")
    .insert({
      user_id:      userId ?? null,
      issue_type:   issueType,
      user_lat:     userLat,
      user_lng:     userLng,
      user_address: userAddress ?? null,
      status:       "pending",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Cancel a pending SOS request */
export async function cancelSosRequest(requestId) {
  const { error } = await supabase
    .from("sos_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId);
  if (error) throw error;
}

/** Fetch full assignment for a request (mechanic info + OTP) */
export async function getSosAssignment(requestId) {
  const { data, error } = await supabase
    .from("sos_assignments")
    .select("*")
    .eq("request_id", requestId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data ?? null;
}

/**
 * Subscribe to status changes on a SOS request.
 * Returns the channel — call channel.unsubscribe() on cleanup.
 */
export function subscribeSosRequest(requestId, onUpdate) {
  return supabase
    .channel(`sos-req-${requestId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "sos_requests", filter: `id=eq.${requestId}` },
      (payload) => onUpdate(payload.new)
    )
    .subscribe();
}

/**
 * Subscribe to assignment changes (mechanic location + OTP updates).
 * Returns the channel — call channel.unsubscribe() on cleanup.
 */
export function subscribeSosAssignment(requestId, onUpdate) {
  return supabase
    .channel(`sos-assign-${requestId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "sos_assignments", filter: `request_id=eq.${requestId}` },
      (payload) => onUpdate(payload.new)
    )
    .subscribe();
}
