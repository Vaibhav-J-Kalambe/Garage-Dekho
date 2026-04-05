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

// ── Constants ──────────────────────────────────────────────────────────────────

const ISSUE_TYPES = [
  { label: "Flat Tyre",    icon: Gauge,         bg: "bg-slate-600"  },
  { label: "Battery Dead", icon: Zap,           bg: "bg-amber-600"  },
  { label: "Engine Fail",  icon: Wrench,        bg: "bg-red-700"    },
  { label: "Accident",     icon: Car,           bg: "bg-rose-700"   },
  { label: "Other",        icon: AlertTriangle, bg: "bg-orange-600" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

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
  const mins = Math.ceil((km / 25) * 60);
  return mins <= 1 ? "< 1 min away" : `~${mins} min away`;
}

function fmtDist(km) {
  return km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(1)} km`;
}

// ── Main component ─────────────────────────────────────────────────────────────
// PHASES: select → locating → searching → accepted → arrived → verified

export default function SosPage() {
  const router   = useRouter();
  const { user } = useAuth();

  const [phase,          setPhase]          = useState("select");
  const [selectedIssue,  setSelectedIssue]  = useState(null);
  const [userCoords,     setUserCoords]     = useState(null);
  const [userAddress,    setUserAddress]    = useState(null);
  const [requestId,      setRequestId]      = useState(null);
  const [nearbyGarages,  setNearbyGarages]  = useState([]);
  const [assignment,     setAssignment]     = useState(null);
  const [mechanicCoords, setMechanicCoords] = useState(null);
  const [otp,            setOtp]            = useState(null);
  const [error,          setError]          = useState(null);
  const [cancelLoading,  setCancelLoading]  = useState(false);

  const reqChannelRef    = useRef(null);
  const assignChannelRef = useRef(null);

  useEffect(() => () => {
    reqChannelRef.current?.unsubscribe();
    assignChannelRef.current?.unsubscribe();
  }, []);

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
      try { await supabase.from("sos_requests").update({ status: "cancelled" }).eq("id", requestId); } catch {}
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
      <div
        className="flex min-h-screen flex-col bg-[#0F172A]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-12 pb-2">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-150 hover:bg-white/20 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          {/* 24/7 badge */}
          <div className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
            </span>
            <span className="text-xs font-bold text-red-400">24 / 7 Emergency</span>
          </div>
        </div>

        {/* Hero */}
        <div className="flex flex-col items-center px-6 py-8">
          <div className="relative mb-6">
            <div className="absolute -inset-8 rounded-full bg-red-500/10 animate-ping" style={{ animationDuration: "2s" }} />
            <div className="absolute -inset-4 rounded-full bg-red-500/15 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.4s" }} />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#D32F2F] shadow-[0_0_60px_rgba(211,47,47,0.6)]">
              <AlertTriangle className="h-11 w-11 text-white" />
            </div>
          </div>
          <h1 className="text-[26px] font-black text-white text-center leading-tight">
            Need Emergency Help?
          </h1>
          <p className="mt-2 max-w-xs text-center text-sm leading-relaxed text-slate-400">
            Select your issue - we'll notify the nearest mechanics immediately
          </p>
        </div>

        <div
          className="mx-auto w-full max-w-sm flex-1 px-4 pb-6"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p className="text-xs leading-relaxed text-red-400">{error}</p>
            </div>
          )}

          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-600">
            What happened?
          </p>

          {/* Issue grid */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            {ISSUE_TYPES.map(({ label, icon: Icon, bg }) => {
              const active = selectedIssue === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSelectedIssue(label)}
                  className={`flex min-h-[64px] items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors duration-150 active:scale-95 ${
                    active
                      ? "bg-white shadow-[0_0_0_2px_#D32F2F]"
                      : "border border-white/10 bg-white/[0.06] hover:bg-white/10"
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? bg + " text-white" : "bg-white/10 text-slate-300"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`text-sm font-bold leading-tight ${active ? "text-slate-900" : "text-white"}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Get Help Now */}
          <button
            type="button"
            onClick={handleGetHelp}
            disabled={!selectedIssue || phase === "locating"}
            className="mb-3 flex min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl bg-[#D32F2F] text-base font-black text-white shadow-[0_8px_32px_rgba(211,47,47,0.45)] transition-colors duration-150 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {phase === "locating"
              ? <><Loader2 className="h-5 w-5 animate-spin" />Getting your location…</>
              : <><AlertTriangle className="h-5 w-5" />Get Help Now</>
            }
          </button>

          {/* Call instead */}
          <a
            href="tel:+919969272885"
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/10 text-sm font-bold text-slate-400 transition-colors duration-150 hover:border-white/25 hover:text-white"
          >
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
      <div className="flex min-h-screen flex-col bg-[#0F172A]">

        {/* Hero */}
        <div className="flex shrink-0 flex-col items-center px-4 py-10">
          <div className="relative mb-5">
            <div className="absolute -inset-8 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: "2.5s" }} />
            <div className="absolute -inset-4 rounded-full bg-primary/15 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.6s" }} />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-[0_0_48px_rgba(0,86,210,0.5)]">
              <Navigation className="h-9 w-9 text-white" />
            </div>
          </div>
          <h2 className="text-xl font-black text-white">Notifying Nearby Mechanics</h2>
          <p className="mt-1.5 max-w-xs text-center text-sm text-slate-400">
            {selectedIssue} · {userAddress || "Your location"}
          </p>
          {nearbyGarages.length > 0 && (
            <div className="mt-2 rounded-full bg-primary/15 px-3 py-1">
              <p className="text-xs font-semibold text-primary">
                {nearbyGarages.length} garage{nearbyGarages.length !== 1 ? "s" : ""} notified
              </p>
            </div>
          )}
        </div>

        {/* Garage list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
            Garages being contacted
          </p>

          {nearbyGarages.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-5 text-center">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-primary" />
              <p className="text-sm text-slate-400">Searching for nearby garages…</p>
            </div>
          ) : nearbyGarages.slice(0, 6).map((g) => (
            <div key={g.id} className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.05] px-4 py-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Wrench className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{g.name}</p>
                <p className="text-[11px] text-slate-500">{fmtDist(g.distance)} away</p>
              </div>
              <a
                href={`https://wa.me/91${g.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `🚨 SOS Alert - GarageDekho\nIssue: *${selectedIssue}*\nLocation: ${userAddress || "Shared via link"}\n\nAccept & track:\n${mechanicLink}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full border border-green-500/25 bg-green-500/15 px-3 text-xs font-bold text-green-400 transition-colors duration-150 hover:bg-green-500/25 active:scale-95"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Notify
              </a>
            </div>
          ))}

          <p className="pt-2 text-center text-[11px] text-slate-600">
            Waiting for a mechanic to accept your request…
          </p>
        </div>

        {/* Cancel */}
        <div
          className="shrink-0 px-4 pt-2"
          style={{ paddingBottom: "max(2.5rem, calc(env(safe-area-inset-bottom) + 1rem))" }}
        >
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelLoading}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-white/10 text-sm font-bold text-slate-400 transition-colors duration-150 hover:border-white/25 hover:text-white active:scale-95 disabled:opacity-60"
          >
            {cancelLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            Cancel Request
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE: ACCEPTED - live map (Rapido-style)
  // ══════════════════════════════════════════════════════════════
  if (phase === "accepted") {
    const mechPhone = assignment?.mechanic_phone;
    const waPhone   = mechPhone
      ? (mechPhone.replace(/\D/g, "").length > 10 ? mechPhone.replace(/\D/g, "") : `91${mechPhone.replace(/\D/g, "")}`)
      : null;

    return (
      <div className="relative flex h-dvh flex-col overflow-hidden bg-slate-100">

        {/* Full-screen map */}
        <div className="absolute inset-0">
          <SosMap userCoords={userCoords} mechanicCoords={mechanicCoords} className="h-full w-full" />
        </div>

        {/* Status pill */}
        <div className="relative z-10 flex justify-center pt-safe pt-5">
          <div className="flex items-center gap-2 rounded-full bg-black/70 px-5 py-2.5 shadow-xl backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
            </span>
            <span className="text-sm font-black text-white">Mechanic is on the way</span>
            {eta && <span className="ml-1 text-sm font-bold text-primary">{eta}</span>}
          </div>
        </div>

        <div className="flex-1" />

        {/* Bottom sheet */}
        <div className="relative z-10 rounded-t-3xl bg-[#0F172A] shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex justify-center pb-1 pt-3">
            <div className="h-1 w-10 rounded-full bg-white/20" />
          </div>

          <div
            className="space-y-4 px-5 pt-3"
            style={{ paddingBottom: "max(2rem, calc(env(safe-area-inset-bottom) + 1rem))" }}
          >
            {/* Mechanic row */}
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#0056D2] text-2xl font-black text-white shadow-[0_4px_20px_rgba(0,86,210,0.5)]">
                {(assignment?.mechanic_name || "M").charAt(0).toUpperCase()}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#0F172A] bg-green-500">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-black text-white">{assignment?.mechanic_name || "Mechanic"}</p>
                <p className="truncate text-xs text-slate-400">{assignment?.garage_name}</p>
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
                  aria-label="Call mechanic"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-150 hover:bg-white/20 active:scale-95"
                >
                  <Phone className="h-5 w-5" />
                </a>
              )}
            </div>

            {/* Issue + location */}
            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.06] px-4 py-3">
              <MapPin className="h-4 w-4 shrink-0 text-[#0056D2]" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white">{selectedIssue}</p>
                <p className="truncate text-[11px] text-slate-500">{userAddress || "Your location"}</p>
              </div>
            </div>

            {/* WhatsApp */}
            {waPhone && (
              <a
                href={`https://wa.me/${waPhone}?text=${encodeURIComponent("Hi, I placed an SOS via GarageDekho. Are you on your way?")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-green-500/25 bg-green-500/15 text-sm font-bold text-green-400 transition-colors duration-150 hover:bg-green-500/25 active:scale-95"
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
  // PHASE: ARRIVED - OTP shown to user
  // ══════════════════════════════════════════════════════════════
  if (phase === "arrived") {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0F172A] px-6 text-center"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500 shadow-[0_0_48px_rgba(34,197,94,0.45)]">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-white">Mechanic Has Arrived!</h2>
          <p className="mt-1.5 text-sm text-slate-400">
            {assignment?.mechanic_name} from {assignment?.garage_name}
          </p>
        </div>

        {/* OTP */}
        <div className="w-full max-w-xs rounded-3xl border border-white/15 bg-white/[0.08] p-6">
          <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
            Your Verification OTP
          </p>
          {otp ? (
            <div className="flex items-center justify-center gap-3">
              {otp.split("").map((digit, i) => (
                <div
                  key={i}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-3xl font-black text-white shadow-[0_4px_20px_rgba(0,86,210,0.45)]"
                >
                  {digit}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Generating OTP…</span>
            </div>
          )}
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Read this OTP aloud to the mechanic to confirm arrival
          </p>
        </div>

        <div className="flex w-full max-w-xs items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/[0.08] px-4 py-3">
          <Shield className="h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-left text-xs leading-relaxed text-amber-400">
            Only share this OTP with the mechanic physically in front of you
          </p>
        </div>

        <a
          href={`tel:${assignment?.mechanic_phone}`}
          className="flex min-h-[44px] items-center gap-2 text-sm font-semibold text-primary transition-colors duration-150 hover:text-blue-400"
        >
          <Phone className="h-4 w-4" /> Call Mechanic
        </a>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE: VERIFIED - service started
  // ══════════════════════════════════════════════════════════════
  if (phase === "verified") {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0F172A] px-6 text-center"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-500 shadow-[0_0_64px_rgba(34,197,94,0.5)]">
          <CheckCircle2 className="h-12 w-12 text-white" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-white">Service Started!</h2>
          <p className="mt-1.5 text-sm text-slate-400">
            {assignment?.mechanic_name} is helping you now
          </p>
        </div>

        <div className="w-full max-w-xs overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] divide-y divide-white/[0.08]">
          {[
            ["Issue",    selectedIssue],
            ["Mechanic", assignment?.mechanic_name],
            ["Garage",   assignment?.garage_name],
          ].map(([label, val]) => (
            <div key={label} className="flex items-center justify-between px-4 py-3.5">
              <span className="text-xs text-slate-500">{label}</span>
              <span className="text-sm font-bold text-white">{val}</span>
            </div>
          ))}
        </div>

        <Link
          href="/"
          className="flex min-h-[48px] items-center gap-2 rounded-2xl bg-primary px-8 text-sm font-bold text-white shadow-glow-primary transition-colors duration-150 hover:brightness-110 active:scale-95"
        >
          Back to Home <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return null;
}
