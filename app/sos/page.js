"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  AlertTriangle, Gauge, Zap, Wrench, Car, X,
  MapPin, Phone, MessageCircle, CheckCircle2, Loader2,
  Shield, Navigation, Clock, ArrowLeft, ChevronRight,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../components/AuthProvider";

const SosMap = dynamic(() => import("../../components/SosMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-800 animate-pulse" />,
});

// ── Constants ─────────────────────────────────────────────────────────────────

const ISSUE_TYPES = [
  { label: "Flat Tyre",    icon: Gauge,         bg: "bg-slate-600"  },
  { label: "Battery Dead", icon: Zap,           bg: "bg-amber-600"  },
  { label: "Engine Fail",  icon: Wrench,        bg: "bg-red-700"    },
  { label: "Accident",     icon: Car,           bg: "bg-rose-700"   },
  { label: "Other",        icon: AlertTriangle, bg: "bg-orange-600" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function etaLabel(mechanicCoords, userCoords) {
  if (!mechanicCoords || !userCoords) return null;
  const km   = haversineKm(mechanicCoords[0], mechanicCoords[1], userCoords[0], userCoords[1]);
  const mins = Math.ceil((km / 25) * 60); // 25 km/h avg city speed
  return mins <= 1 ? "< 1 min away" : `~${mins} min away`;
}

function fmtDist(km) {
  return km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(1)} km`;
}

// ── Main component ────────────────────────────────────────────────────────────
// PHASES: select → locating → searching → accepted → arrived → verified

export default function SosPage() {
  const router   = useRouter();
  const { user } = useAuth();

  const [phase,          setPhase]          = useState("select");
  const [selectedIssue,  setSelectedIssue]  = useState(null);
  const [userCoords,     setUserCoords]     = useState(null);   // [lat, lng]
  const [userAddress,    setUserAddress]    = useState(null);
  const [requestId,      setRequestId]      = useState(null);
  const [nearbyGarages,  setNearbyGarages]  = useState([]);
  const [assignment,     setAssignment]     = useState(null);   // mechanic row
  const [mechanicCoords, setMechanicCoords] = useState(null);   // [lat, lng] live
  const [otp,            setOtp]            = useState(null);
  const [error,          setError]          = useState(null);
  const [cancelLoading,  setCancelLoading]  = useState(false);

  const reqChannelRef    = useRef(null);
  const assignChannelRef = useRef(null);

  // Cleanup subscriptions on unmount
  useEffect(() => () => {
    reqChannelRef.current?.unsubscribe();
    assignChannelRef.current?.unsubscribe();
  }, []);

  // Subscribe to request status changes (pending → accepted / arrived / verified)
  const subscribeToRequest = useCallback((reqId) => {
    reqChannelRef.current = supabase
      .channel(`sos-req-${reqId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sos_requests", filter: `id=eq.${reqId}` },
        async (payload) => {
          const status = payload.new?.status;
          if (status === "accepted") {
            await loadAssignment(reqId);
            setPhase("accepted");
          } else if (status === "arrived") {
            await loadAssignmentWithOtp(reqId);
            setPhase("arrived");
          } else if (status === "verified") {
            setPhase("verified");
          }
        }
      )
      .subscribe();
  }, []); // eslint-disable-line

  // Subscribe to mechanic live location + OTP updates
  const subscribeToAssignment = useCallback((reqId) => {
    assignChannelRef.current = supabase
      .channel(`sos-assign-${reqId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sos_assignments", filter: `request_id=eq.${reqId}` },
        (payload) => {
          const row = payload.new;
          if (!row) return;
          if (row.mechanic_lat && row.mechanic_lng) {
            setMechanicCoords([Number(row.mechanic_lat), Number(row.mechanic_lng)]);
          }
          if (row.otp) setOtp(row.otp);
          setAssignment((prev) => ({ ...prev, ...row }));
        }
      )
      .subscribe();
  }, []); // eslint-disable-line

  async function loadAssignment(reqId) {
    const { data } = await supabase
      .from("sos_assignments")
      .select("*")
      .eq("request_id", reqId)
      .single();
    if (data) {
      setAssignment(data);
      if (data.mechanic_lat && data.mechanic_lng) {
        setMechanicCoords([Number(data.mechanic_lat), Number(data.mechanic_lng)]);
      }
      subscribeToAssignment(reqId);
    }
  }

  async function loadAssignmentWithOtp(reqId) {
    const { data } = await supabase
      .from("sos_assignments")
      .select("*")
      .eq("request_id", reqId)
      .single();
    if (data) {
      setAssignment(data);
      if (data.otp) setOtp(data.otp);
    }
  }

  // ── Trigger SOS ───────────────────────────────────────────────
  async function handleGetHelp() {
    if (!selectedIssue) return;
    setPhase("locating");
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation not supported. Please call our emergency line.");
      setPhase("select");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const lat = coords.latitude;
        const lng = coords.longitude;
        setUserCoords([lat, lng]);

        // Reverse geocode
        let address = null;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=17`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const a = data.address ?? {};
          address = [a.road, a.suburb || a.neighbourhood || a.city_district, a.city || a.town]
            .filter(Boolean)
            .join(", ");
        } catch { /* silent */ }
        setUserAddress(address);

        // Create SOS request
        let reqId;
        try {
          const { data: row, error: insertErr } = await supabase
            .from("sos_requests")
            .insert({
              user_id:      user?.id ?? null,
              issue_type:   selectedIssue,
              user_lat:     lat,
              user_lng:     lng,
              user_address: address,
              status:       "pending",
            })
            .select()
            .single();
          if (insertErr) throw insertErr;
          reqId = row.id;
          setRequestId(reqId);
        } catch {
          setError("Could not create SOS request. Please call +91 99692 72885.");
          setPhase("select");
          return;
        }

        // Find nearby garages
        try {
          const res = await fetch("/api/sos/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userLat: lat, userLng: lng }),
          });
          const { garages } = await res.json();
          setNearbyGarages(garages ?? []);
        } catch { /* non-critical */ }

        subscribeToRequest(reqId);
        setPhase("searching");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError("Location access denied. Enable it in browser settings or call +91 99692 72885.");
        } else {
          setError("Could not get your location. Please call +91 99692 72885.");
        }
        setPhase("select");
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  }

  async function handleCancel() {
    setCancelLoading(true);
    reqChannelRef.current?.unsubscribe();
    assignChannelRef.current?.unsubscribe();
    if (requestId) {
      await supabase.from("sos_requests").update({ status: "cancelled" }).eq("id", requestId).catch(() => {});
    }
    router.push("/");
  }

  const eta          = etaLabel(mechanicCoords, userCoords);
  const origin       = typeof window !== "undefined" ? window.location.origin : "";
  const mechanicLink = requestId ? `${origin}/sos/mechanic/${requestId}` : "";

  // ══════════════════════════════════════════════════════════════
  // PHASE: SELECT / LOCATING
  // ══════════════════════════════════════════════════════════════
  if (phase === "select" || phase === "locating") {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col">

        <div className="flex items-center gap-3 px-4 pt-6 pb-2">
          <button onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Emergency SOS</p>
        </div>

        <div className="flex flex-col items-center py-8">
          <div className="relative mb-6">
            <div className="absolute -inset-6 rounded-full bg-red-500/15 animate-ping" style={{ animationDuration: "2s" }} />
            <div className="absolute -inset-2 rounded-full bg-red-500/20" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#D32F2F] shadow-[0_0_48px_rgba(211,47,47,0.55)]">
              <AlertTriangle className="h-11 w-11 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white">Need Emergency Help?</h1>
          <p className="mt-1.5 text-sm text-slate-400 text-center px-6 max-w-xs">
            Select your issue — we'll notify nearby mechanics instantly
          </p>
        </div>

        <div className="mx-auto w-full max-w-sm px-4 flex flex-col gap-4 pb-10">
          {error && (
            <div className="flex items-start gap-2 rounded-2xl bg-red-500/10 border border-red-500/25 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400 leading-relaxed">{error}</p>
            </div>
          )}

          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">What happened?</p>

          <div className="grid grid-cols-2 gap-3">
            {ISSUE_TYPES.map(({ label, icon: Icon, bg }) => {
              const active = selectedIssue === label;
              return (
                <button key={label} type="button" onClick={() => setSelectedIssue(label)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition active:scale-95 ${
                    active ? "bg-white shadow-[0_0_0_2px_#D32F2F]" : "bg-white/6 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? bg + " text-white" : "bg-white/10 text-slate-300"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-sm font-bold leading-tight ${active ? "text-slate-900" : "text-white"}`}>{label}</span>
                </button>
              );
            })}
          </div>

          <button type="button" onClick={handleGetHelp} disabled={!selectedIssue || phase === "locating"}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#D32F2F] py-4 text-base font-black text-white shadow-[0_8px_32px_rgba(211,47,47,0.45)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
            {phase === "locating"
              ? <><Loader2 className="h-5 w-5 animate-spin" />Getting your location…</>
              : <><AlertTriangle className="h-5 w-5" />Get Help Now</>
            }
          </button>

          <a href="tel:+919969272885"
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 py-3.5 text-sm font-bold text-slate-400 transition hover:border-white/25 hover:text-white">
            <Phone className="h-4 w-4" /> Call Emergency Line instead
          </a>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE: SEARCHING
  // ══════════════════════════════════════════════════════════════
  if (phase === "searching") {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col">

        <div className="flex flex-col items-center py-10 shrink-0">
          <div className="relative mb-5">
            <div className="absolute -inset-8 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: "2.5s" }} />
            <div className="absolute -inset-4 rounded-full bg-primary/15 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.6s" }} />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-[0_0_48px_rgba(0,86,210,0.5)]">
              <Navigation className="h-9 w-9 text-white" />
            </div>
          </div>
          <h2 className="text-xl font-black text-white">Notifying Nearby Mechanics</h2>
          <p className="mt-1 text-sm text-slate-400 text-center px-4">
            {selectedIssue} · {userAddress || "Your location"}
          </p>
          {nearbyGarages.length > 0 && (
            <p className="mt-2 text-xs font-semibold text-primary">
              {nearbyGarages.length} garage{nearbyGarages.length !== 1 ? "s" : ""} notified
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Garages being contacted</p>

          {nearbyGarages.length === 0 ? (
            <div className="rounded-2xl bg-white/5 border border-white/8 p-5 text-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-slate-400">Searching for nearby garages…</p>
            </div>
          ) : nearbyGarages.slice(0, 6).map((g) => (
            <div key={g.id} className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/8 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary shrink-0">
                <Wrench className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{g.name}</p>
                <p className="text-[11px] text-slate-500">{fmtDist(g.distance)} away</p>
              </div>
              <a
                href={`https://wa.me/91${g.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `🚨 SOS Alert — GarageDekho\nIssue: *${selectedIssue}*\nLocation: ${userAddress || "Shared via link"}\n\nAccept & track:\n${mechanicLink}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-green-500/15 border border-green-500/25 px-3 py-1.5 text-xs font-bold text-green-400 transition hover:bg-green-500/25 active:scale-95"
              >
                <MessageCircle className="h-3 w-3" /> Notify
              </a>
            </div>
          ))}

          <p className="text-center text-[11px] text-slate-700 pt-2">
            Waiting for a mechanic to accept your request…
          </p>
        </div>

        <div className="px-4 pt-2 pb-10 shrink-0">
          <button type="button" onClick={handleCancel} disabled={cancelLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-3.5 text-sm font-bold text-slate-400 transition hover:border-white/25 hover:text-white active:scale-95 disabled:opacity-60">
            {cancelLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            Cancel Request
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE: ACCEPTED — mechanic on the way, live map (Rapido-style)
  // ══════════════════════════════════════════════════════════════
  if (phase === "accepted") {
    const mechPhone = assignment?.mechanic_phone;
    const waPhone   = mechPhone ? (mechPhone.replace(/\D/g, "").length > 10 ? mechPhone.replace(/\D/g, "") : `91${mechPhone.replace(/\D/g, "")}`) : null;

    return (
      <div className="relative flex h-dvh flex-col overflow-hidden bg-slate-100">

        {/* Full-screen live map behind everything */}
        <div className="absolute inset-0">
          <SosMap userCoords={userCoords} mechanicCoords={mechanicCoords} className="h-full w-full" />
        </div>

        {/* Top status pill */}
        <div className="relative z-10 flex justify-center pt-5">
          <div className="flex items-center gap-2 rounded-full bg-black/70 backdrop-blur-md px-5 py-2.5 shadow-xl">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
            </span>
            <span className="text-sm font-black text-white">Mechanic is on the way</span>
            {eta && <span className="ml-1 text-sm font-bold text-primary">{eta}</span>}
          </div>
        </div>

        {/* Spacer — map fills the gap */}
        <div className="flex-1" />

        {/* Bottom sheet — floats over map */}
        <div className="relative z-10 rounded-t-3xl bg-[#0F172A] shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-white/20" />
          </div>

          <div className="px-5 pt-3 pb-8 space-y-4">
            {/* Mechanic info row */}
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#0056D2] text-2xl font-black text-white shadow-[0_4px_20px_rgba(0,86,210,0.5)]">
                {(assignment?.mechanic_name || "M").charAt(0).toUpperCase()}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 border-2 border-[#0F172A]">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-base font-black text-white truncate">{assignment?.mechanic_name || "Mechanic"}</p>
                <p className="text-xs text-slate-400 truncate">{assignment?.garage_name}</p>
                {!mechanicCoords ? (
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Loader2 className="h-3 w-3 animate-spin" /> Connecting to mechanic…
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-1 text-xs font-bold text-[#0056D2]">
                    <Clock className="h-3 w-3" />
                    {eta ?? "Calculating ETA…"}
                  </div>
                )}
              </div>

              {mechPhone && (
                <a
                  href={`tel:${mechPhone}`}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
                >
                  <Phone className="h-5 w-5" />
                </a>
              )}
            </div>

            {/* Issue + location strip */}
            <div className="flex items-center gap-3 rounded-2xl bg-white/6 border border-white/8 px-4 py-3">
              <MapPin className="h-4 w-4 text-[#0056D2] shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white">{selectedIssue}</p>
                <p className="text-[11px] text-slate-500 truncate">{userAddress || "Your location"}</p>
              </div>
            </div>

            {/* WhatsApp button */}
            {waPhone && (
              <a
                href={`https://wa.me/${waPhone}?text=${encodeURIComponent("Hi, I placed an SOS via GarageDekho. Are you on your way?")}`}
                target="_blank" rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-500/15 border border-green-500/25 py-3 text-sm font-bold text-green-400 transition hover:bg-green-500/25 active:scale-95"
              >
                <MessageCircle className="h-4 w-4" /> Message on WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE: ARRIVED — OTP shown to user
  // ══════════════════════════════════════════════════════════════
  if (phase === "arrived") {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center px-6 text-center gap-6">

        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500 shadow-[0_0_48px_rgba(34,197,94,0.45)]">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-white">Mechanic Has Arrived!</h2>
          <p className="mt-1.5 text-sm text-slate-400">
            {assignment?.mechanic_name} from {assignment?.garage_name}
          </p>
        </div>

        {/* OTP display */}
        <div className="w-full max-w-xs rounded-3xl bg-white/8 border border-white/15 p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
            Your Verification OTP
          </p>
          {otp ? (
            <div className="flex items-center justify-center gap-3">
              {otp.split("").map((digit, i) => (
                <div key={i}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-3xl font-black text-white shadow-[0_4px_20px_rgba(0,86,210,0.45)]">
                  {digit}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-slate-500 py-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Generating OTP…</span>
            </div>
          )}
          <p className="mt-4 text-xs text-slate-500 leading-relaxed">
            Read this OTP aloud to the mechanic to confirm arrival
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-amber-500/8 border border-amber-500/20 px-4 py-3 w-full max-w-xs">
          <Shield className="h-4 w-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-400 text-left leading-relaxed">
            Only share this OTP with the mechanic physically in front of you
          </p>
        </div>

        <a href={`tel:${assignment?.mechanic_phone}`}
          className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-blue-400 transition">
          <Phone className="h-4 w-4" /> Call Mechanic
        </a>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE: VERIFIED — service started confirmation
  // ══════════════════════════════════════════════════════════════
  if (phase === "verified") {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center px-6 text-center gap-6">

        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-500 shadow-[0_0_64px_rgba(34,197,94,0.5)]">
          <CheckCircle2 className="h-12 w-12 text-white" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-white">Service Started!</h2>
          <p className="mt-1.5 text-sm text-slate-400">
            {assignment?.mechanic_name} is helping you now
          </p>
        </div>

        <div className="w-full max-w-xs rounded-2xl bg-white/6 border border-white/10 divide-y divide-white/8">
          {[
            ["Issue",    selectedIssue],
            ["Mechanic", assignment?.mechanic_name],
            ["Garage",   assignment?.garage_name],
          ].map(([label, val]) => (
            <div key={label} className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-slate-500">{label}</span>
              <span className="text-sm font-bold text-white">{val}</span>
            </div>
          ))}
        </div>

        <Link href="/"
          className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-3 text-sm font-bold text-white shadow-glow-primary transition hover:brightness-110 active:scale-95">
          Back to Home <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return null;
}
