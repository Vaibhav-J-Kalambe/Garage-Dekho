"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Siren, MapPin, Clock, CheckCircle2, X, ChevronRight,
  Phone, MessageCircle, Loader2, Users, AlertTriangle,
  Navigation, Shield,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { usePortalAuth } from "../../../context/PortalAuthContext";

const SosMap = dynamic(() => import("../../../components/SosMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 animate-pulse rounded-2xl" />,
});

const ISSUE_ICONS = {
  "Flat Tyre": "🛞", "Battery Dead": "⚡", "Engine Fail": "🔧",
  "Accident": "🚗", "Other": "⚠️",
};

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ── Main component
export default function PortalSosPage() {
  const { garage } = usePortalAuth();

  const [pendingSos,   setPendingSos]   = useState([]);
  const [activeSos,    setActiveSos]    = useState([]); // accepted / arrived by this garage
  const [completedSos, setCompletedSos] = useState([]);
  const [loading,      setLoading]      = useState(true);

  // Dispatch modal state
  const [dispatching,  setDispatching]  = useState(null); // sos_request row being dispatched
  const [mechanics,    setMechanics]    = useState([]);
  const [selMechanic,  setSelMechanic]  = useState(null);
  const [dispatching2, setDispatching2] = useState(false);

  // Live tracking state
  const [tracking,    setTracking]    = useState(null); // { request, assignment }
  const [mechCoords,  setMechCoords]  = useState(null);

  // OTP verification state
  const [otpInput,       setOtpInput]       = useState("");
  const [otpError,       setOtpError]       = useState(null);
  const [verifying,      setVerifying]      = useState(false);

  // Dispatch error
  const [dispatchError,  setDispatchError]  = useState(null);

  const channelRef = useRef(null);
  const trackRef   = useRef(null);

  useEffect(() => {
    if (!garage) return;
    fetchAllSos();
    fetchMechanics();
    subscribeRealtime();
    return () => {
      channelRef.current?.unsubscribe();
      trackRef.current?.unsubscribe();
    };
  }, [garage]);

  async function fetchAllSos() {
    setLoading(true);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("sos_requests")
      .select("*, sos_assignments(*)")
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: false });

    const all = (data || []).map((r) => ({
      ...r,
      assignment: r.sos_assignments?.[0] ?? null,
      distance: garage?.lat && garage?.lng
        ? haversine(garage.lat, garage.lng, r.user_lat, r.user_lng)
        : null,
    }));

    // isMyJob: prefer garage_id match, fallback to garage_name for older records
    const isMyJob = (r) =>
      r.assignment?.garage_id
        ? r.assignment.garage_id === garage.id
        : r.assignment?.garage_name === garage.garage_name;

    setPendingSos(all.filter((r) => r.status === "pending" && (!r.distance || r.distance <= 15)));
    setActiveSos(all.filter((r) => ["accepted", "arrived"].includes(r.status) && isMyJob(r)));
    setCompletedSos(all.filter((r) => r.status === "verified" && isMyJob(r)));
    setLoading(false);
  }

  async function fetchMechanics() {
    const { data } = await supabase
      .from("portal_mechanics")
      .select("*")
      .eq("portal_garage_id", garage.id)
      .order("name");
    setMechanics(data || []);
  }

  function subscribeRealtime() {
    channelRef.current = supabase
      .channel("portal-sos-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_requests" }, fetchAllSos)
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_assignments" }, fetchAllSos)
      .subscribe();
  }

  function subscribeTracking(requestId) {
    trackRef.current?.unsubscribe();
    trackRef.current = supabase
      .channel(`portal-track-${requestId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "sos_assignments",
        filter: `request_id=eq.${requestId}`,
      }, (payload) => {
        const d = payload.new;
        if (d.mechanic_lat && d.mechanic_lng) {
          setMechCoords([d.mechanic_lat, d.mechanic_lng]);
        }
      })
      .subscribe();
  }

  async function handleAccept(req) {
    setDispatching(req);
    setSelMechanic(null);
    setDispatchError(null);
  }

  async function confirmDispatch() {
    if (!selMechanic || !dispatching) return;
    setDispatching2(true);

    const mechLink = `${window.location.origin}/sos/mechanic/${dispatching.id}`;

    const res = await fetch("/api/sos/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId:     dispatching.id,
        garageId:      garage.id,
        garageName:    garage.garage_name,
        mechanicName:  selMechanic.name,
        mechanicPhone: selMechanic.phone,
      }),
    });

    if (res.ok) {
      // Mark mechanic as busy
      await supabase
        .from("portal_mechanics")
        .update({ status: "busy" })
        .eq("id", selMechanic.id);

      // Send WhatsApp to mechanic with their tracking link
      if (selMechanic.phone) {
        const msg = encodeURIComponent(
          `🚨 SOS Job Assigned!\n\nIssue: ${dispatching.issue_type}\nLocation: ${dispatching.user_address || "Shared on map"}\n\nOpen your tracking link:\n${mechLink}`
        );
        const digits = selMechanic.phone.replace(/\D/g, "");
        // If number already starts with country code (10+ digits with leading digits != 10), use as-is; else prepend 91
        const waNumber = digits.length > 10 ? digits : `91${digits}`;
        window.open(`https://wa.me/${waNumber}?text=${msg}`, "_blank");
      }

      setDispatching(null);
      setDispatching2(false);
      fetchAllSos();
    } else {
      const body = await res.json();
      setDispatchError(body.error || "Failed to dispatch. This request may already be taken.");
      setDispatching2(false);
    }
  }

  function openTracking(req) {
    setTracking(req);
    setMechCoords(
      req.assignment?.mechanic_lat && req.assignment?.mechanic_lng
        ? [req.assignment.mechanic_lat, req.assignment.mechanic_lng]
        : null
    );
    setOtpInput("");
    setOtpError(null);
    subscribeTracking(req.id);
  }

  async function handleVerifyOtp() {
    if (otpInput.trim().length !== 4) { setOtpError("Enter the 4-digit OTP from the customer."); return; }
    setVerifying(true);
    const res = await fetch("/api/sos/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: tracking.id, otp: otpInput.trim() }),
    });
    if (res.ok) {
      // Mark mechanic available again
      const mechanic = mechanics.find((m) => m.name === tracking.assignment?.mechanic_name);
      if (mechanic) {
        await supabase.from("portal_mechanics").update({ status: "available" }).eq("id", mechanic.id);
      }
      trackRef.current?.unsubscribe();
      setTracking(null);
      fetchAllSos();
    } else {
      setOtpError("Invalid OTP. Ask the customer to read their code again.");
    }
    setVerifying(false);
  }

  // ── Tracking overlay
  if (tracking) {
    const userCoords = [tracking.user_lat, tracking.user_lng];
    const isArrived = tracking.status === "arrived";
    return (
      <div className="flex h-dvh flex-col bg-slate-100 pb-20">
        {/* Map */}
        <div className="flex-1 relative">
          <SosMap userCoords={userCoords} mechanicCoords={mechCoords} className="h-full w-full" />
          <button
            onClick={() => { setTracking(null); trackRef.current?.unsubscribe(); }}
            className="absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md text-slate-700 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/70 backdrop-blur-sm px-4 py-2">
            <span className={`h-2 w-2 rounded-full ${isArrived ? "bg-green-400" : "bg-blue-400 animate-ping"}`} />
            <span className="text-xs font-bold text-white">
              {isArrived ? "Mechanic Arrived" : "Mechanic En Route"}
            </span>
          </div>
        </div>

        {/* Bottom sheet */}
        <div className="rounded-t-3xl bg-white p-5 shadow-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0056D2] text-xl font-black text-white">
              {(tracking.assignment?.mechanic_name || "M").charAt(0)}
            </div>
            <div>
              <p className="font-black text-slate-900">{tracking.assignment?.mechanic_name}</p>
              <p className="text-xs text-slate-500">{tracking.issue_type} · {tracking.user_address || "User location"}</p>
            </div>
          </div>

          {!isArrived ? (
            <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700 font-medium">
              Mechanic is on the way. Map updates every 5 seconds.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700 font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Mechanic has arrived at customer location!
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-500 mb-2">
                  Enter OTP from Customer
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => { setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 4)); setOtpError(null); }}
                    placeholder="_ _ _ _"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-2xl font-black tracking-[0.5em] text-slate-900 outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20"
                  />
                  <button
                    onClick={handleVerifyOtp}
                    disabled={verifying}
                    className="flex items-center gap-1.5 rounded-xl bg-[#0056D2] px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-60"
                  >
                    {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Verify
                  </button>
                </div>
                {otpError && <p className="mt-2 text-xs text-red-500">{otpError}</p>}
                <p className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                  <Shield className="h-3 w-3" /> OTP is shown on the customer's screen
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Dispatch modal
  if (dispatching) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-100 pb-24">
        {/* Header */}
        <div className="bg-[#0F172A] px-5 pt-5 pb-5">
          <button
            onClick={() => setDispatching(null)}
            className="mb-3 flex items-center gap-2 text-sm text-slate-400"
          >
            <X className="h-4 w-4" /> Cancel
          </button>
          <h1 className="text-lg font-black text-white">Dispatch Mechanic</h1>
          <p className="text-sm text-slate-400 mt-1">
            {ISSUE_ICONS[dispatching.issue_type] || "⚠️"} {dispatching.issue_type} ·{" "}
            {dispatching.user_address || "Customer location"}
          </p>
        </div>

        <div className="px-4 pt-4 space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Select Mechanic</p>

          {mechanics.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">No mechanics added yet.</p>
              <p className="text-xs text-slate-400 mt-1">Add your team in the Team tab first.</p>
            </div>
          ) : (
            mechanics.map((m) => (
              <button
                key={m.id}
                onClick={() => m.status === "available" && setSelMechanic(m)}
                disabled={m.status !== "available"}
                className={`w-full flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm text-left transition ${
                  m.status !== "available" ? "opacity-50 cursor-not-allowed" :
                  selMechanic?.id === m.id ? "ring-2 ring-[#0056D2] shadow-[0_0_0_2px_rgba(0,86,210,0.2)]" :
                  "hover:bg-slate-50 active:scale-[0.98]"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0056D2] text-lg font-black text-white shrink-0">
                  {m.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-black text-slate-900">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.specialization}</p>
                </div>
                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  m.status === "available" ? "bg-green-100 text-green-700" :
                  m.status === "busy"      ? "bg-red-100 text-red-700" :
                                             "bg-slate-100 text-slate-600"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    m.status === "available" ? "bg-green-500" :
                    m.status === "busy"      ? "bg-red-500" : "bg-slate-400"
                  }`} />
                  {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                </div>
                {selMechanic?.id === m.id && (
                  <CheckCircle2 className="h-5 w-5 text-[#0056D2] shrink-0" />
                )}
              </button>
            ))
          )}

          {dispatchError && (
            <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-600">
              {dispatchError}
            </div>
          )}

          {selMechanic && (
            <button
              onClick={confirmDispatch}
              disabled={dispatching2}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#0056D2] py-4 text-base font-black text-white shadow-[0_8px_24px_rgba(0,86,210,0.4)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {dispatching2 ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
              {dispatching2 ? "Dispatching…" : `Dispatch ${selMechanic.name}`}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Main SOS list
  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      {/* Header */}
      <div className="bg-[#0F172A] px-5 pt-5 pb-5">
        <h1 className="text-lg font-black text-white">SOS Alerts</h1>
        <p className="text-xs text-slate-400 mt-0.5">Real-time emergency requests near you</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 rounded-full border-4 border-[#0056D2] border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* Incoming */}
            {pendingSos.length > 0 && (
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
                  Incoming ({pendingSos.length})
                </p>
                <div className="space-y-3">
                  {pendingSos.map((req) => (
                    <IncomingSosCard key={req.id} req={req} onAccept={() => handleAccept(req)} />
                  ))}
                </div>
              </div>
            )}

            {/* Active (dispatched by this garage) */}
            {activeSos.length > 0 && (
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
                  Active Jobs ({activeSos.length})
                </p>
                <div className="space-y-3">
                  {activeSos.map((req) => (
                    <ActiveSosCard key={req.id} req={req} onTrack={() => openTracking(req)} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed today */}
            {completedSos.length > 0 && (
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
                  Completed Today ({completedSos.length})
                </p>
                <div className="space-y-2">
                  {completedSos.map((req) => (
                    <div key={req.id} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{req.issue_type}</p>
                        <p className="text-xs text-slate-400">{req.assignment?.mechanic_name} · Verified</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingSos.length === 0 && activeSos.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 mb-4">
                  <Siren className="h-8 w-8 text-slate-400" />
                </div>
                <p className="font-bold text-slate-600">No active SOS alerts</p>
                <p className="text-sm text-slate-400 mt-1">New alerts will appear here in real-time</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function IncomingSosCard({ req, onAccept }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden border-l-4 border-red-500">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{ISSUE_ICONS[req.issue_type] || "⚠️"}</span>
            <div>
              <p className="font-black text-slate-900">{req.issue_type}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" /> {timeAgo(req.created_at)}
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" /> LIVE
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-3">
          <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="truncate">{req.user_address || "Location shared"}</span>
          {req.distance !== null && (
            <span className="text-xs font-bold text-[#0056D2] shrink-0">
              · {req.distance < 1 ? `${(req.distance * 1000).toFixed(0)}m` : `${req.distance.toFixed(1)}km`}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onAccept}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#0056D2] py-2.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-95"
          >
            <Navigation className="h-4 w-4" /> Accept & Dispatch
          </button>
        </div>
      </div>
    </div>
  );
}

function ActiveSosCard({ req, onTrack }) {
  const isArrived = req.status === "arrived";
  return (
    <div className={`rounded-2xl bg-white shadow-sm overflow-hidden border-l-4 ${isArrived ? "border-green-500" : "border-blue-500"}`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-black text-slate-900">{req.issue_type}</p>
            <p className="text-xs text-slate-500">{req.assignment?.mechanic_name} dispatched</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${isArrived ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
            {isArrived ? "Arrived" : "En Route"}
          </span>
        </div>
        <button
          onClick={onTrack}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95"
        >
          {isArrived ? <><CheckCircle2 className="h-4 w-4 text-green-500" /> Verify OTP</> : <><Navigation className="h-4 w-4" /> Live Track</>}
        </button>
      </div>
    </div>
  );
}
