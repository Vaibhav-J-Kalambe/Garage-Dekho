"use client";

import { useState, useEffect, useRef, use } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle, CheckCircle2, Loader2, MapPin,
  Phone, Navigation, Wrench, X, Shield,
} from "lucide-react";
import { supabase } from "../../../../lib/supabase";

const SosMap = dynamic(() => import("../../../../components/SosMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-800 animate-pulse" />,
});

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

function fmtDist(km) {
  if (km == null) return null;
  return km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(1)} km`;
}

const ISSUE_EMOJIS = {
  "Flat Tyre":    "🛞",
  "Battery Dead": "⚡",
  "Engine Fail":  "🔧",
  "Accident":     "🚗",
  "Other":        "⚠️",
};

const inputCls =
  "w-full rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition";

// MECHANIC PHASES: loading → view → form → accepted → arrived → verified | not_found | taken

export default function MechanicSosPage({ params }) {
  const { requestId } = use(params);

  const [phase,       setPhase]       = useState("loading");
  const [request,     setRequest]     = useState(null);        // SOS request row
  const [mechName,    setMechName]    = useState("");
  const [mechPhone,   setMechPhone]   = useState("");
  const [garageName,  setGarageName]  = useState("");
  const [myCoords,    setMyCoords]    = useState(null);        // [lat, lng] mechanic live
  const [userCoords,  setUserCoords]  = useState(null);        // [lat, lng] static
  const [submitting,  setSubmitting]  = useState(false);
  const [otp,         setOtp]         = useState("");
  const [otpError,    setOtpError]    = useState(null);
  const [acceptError, setAcceptError] = useState(null);
  const [locError,    setLocError]    = useState(null);
  const [locSharing,  setLocSharing]  = useState(false);

  const watchRef    = useRef(null);
  const intervalRef = useRef(null);

  // ── Load request on mount ─────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("sos_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (error || !data) { setPhase("not_found"); return; }
      if (["cancelled", "verified"].includes(data.status)) { setPhase("not_found"); return; }

      setRequest(data);
      setUserCoords([Number(data.user_lat), Number(data.user_lng)]);

      // Already accepted or arrived — check if this mechanic was dispatched for this job
      if (["accepted", "arrived"].includes(data.status)) {
        const { data: asgn } = await supabase
          .from("sos_assignments")
          .select("*")
          .eq("request_id", requestId)
          .single();

        if (!asgn) { setPhase("taken"); return; }

        // Pre-fill details from the portal dispatch
        setMechName(asgn.mechanic_name || "");
        setGarageName(asgn.garage_name || "");
        setMechPhone(asgn.mechanic_phone || "");

        if (data.status === "arrived") {
          setPhase("arrived");
        } else {
          // Start sharing location immediately
          startLocationSharing();
          setPhase("accepted");
        }
        return;
      }

      // pending — show request details + acceptance form
      setPhase("view");
    }

    load();

    return () => {
      if (watchRef.current)    navigator.geolocation.clearWatch(watchRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [requestId]);

  // ── Push mechanic location to server every 5 s ────────────────
  useEffect(() => {
    if (!myCoords || phase !== "accepted") return;

    const push = () => {
      fetch("/api/sos/location", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ requestId, lat: myCoords[0], lng: myCoords[1] }),
      }).catch(() => {});
    };

    push(); // immediate first push
    intervalRef.current = setInterval(push, 5000);
    return () => clearInterval(intervalRef.current);
  }, [myCoords, phase, requestId]);

  // ── Start GPS watch ───────────────────────────────────────────
  function startLocationSharing() {
    if (!navigator.geolocation) {
      setLocError("Location access is required to accept this SOS.");
      return false;
    }
    setLocSharing(true);
    watchRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setMyCoords([coords.latitude, coords.longitude]);
        setLocError(null);
      },
      () => setLocError("Could not get your location. Please enable GPS."),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return true;
  }

  // ── Accept SOS ────────────────────────────────────────────────
  async function handleAccept(e) {
    e.preventDefault();
    if (!mechName.trim() || !garageName.trim()) return;
    setSubmitting(true);

    // Get one-time position before accepting
    let lat = myCoords?.[0] ?? null;
    let lng = myCoords?.[1] ?? null;

    try {
      const res = await fetch("/api/sos/accept", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          garageName:    garageName.trim(),
          mechanicName:  mechName.trim(),
          mechanicPhone: mechPhone.trim() || null,
          mechanicLat:   lat,
          mechanicLng:   lng,
        }),
      });

      if (res.status === 409) { setPhase("taken"); setSubmitting(false); return; }
      if (!res.ok) throw new Error((await res.json()).error);

      // Start continuous GPS sharing
      startLocationSharing();
      setPhase("accepted");
    } catch (err) {
      setAcceptError(err.message || "Could not accept. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Mark arrived ─────────────────────────────────────────────
  async function handleArrived() {
    setSubmitting(true);
    await fetch("/api/sos/arrive", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ requestId }),
    });
    // Stop location sharing
    if (watchRef.current)    { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setPhase("arrived");
    setSubmitting(false);
  }

  // ── Verify OTP ────────────────────────────────────────────────
  async function handleVerify(e) {
    e.preventDefault();
    if (otp.trim().length !== 4) { setOtpError("Enter the 4-digit OTP shown on the customer's screen"); return; }
    setSubmitting(true);
    setOtpError(null);

    const res = await fetch("/api/sos/verify", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ requestId, otp: otp.trim() }),
    });

    if (res.ok) {
      setPhase("verified");
    } else {
      setOtpError("Incorrect OTP. Ask the customer to check their screen and try again.");
    }
    setSubmitting(false);
  }

  // ── Distance from mechanic to user ────────────────────────────
  const distToUser = myCoords && userCoords
    ? fmtDist(haversineKm(myCoords[0], myCoords[1], userCoords[0], userCoords[1]))
    : null;

  // ══════════════════════════════════════════════════════════════
  // LOADING
  // ══════════════════════════════════════════════════════════════
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // NOT FOUND / ALREADY TAKEN
  // ══════════════════════════════════════════════════════════════
  if (phase === "not_found") {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-700">
          <X className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-black text-white">Request Not Available</h2>
        <p className="text-sm text-slate-400">This SOS request has been cancelled, completed, or does not exist.</p>
      </div>
    );
  }

  if (phase === "taken") {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20">
          <CheckCircle2 className="h-8 w-8 text-amber-400" />
        </div>
        <h2 className="text-xl font-black text-white">Already Accepted</h2>
        <p className="text-sm text-slate-400">Another mechanic has already accepted this SOS request. Thank you for responding!</p>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // VIEW — show request details + acceptance form
  // ══════════════════════════════════════════════════════════════
  if (phase === "view") {
    const distFromMe = myCoords && userCoords
      ? fmtDist(haversineKm(myCoords[0], myCoords[1], userCoords[0], userCoords[1]))
      : null;

    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-white/8">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400">SOS Request</p>
            <h1 className="text-sm font-black text-white">Mechanic Acceptance</h1>
          </div>
        </div>

        {/* Map — user's location */}
        <div className="h-52 shrink-0 relative">
          <SosMap userCoords={userCoords} mechanicCoords={null} className="h-full w-full" />
          <div className="absolute bottom-3 left-3 right-3 z-[1000] flex items-center gap-2 rounded-2xl bg-black/65 backdrop-blur-md px-3 py-2">
            <MapPin className="h-3.5 w-3.5 text-red-400 shrink-0" />
            <p className="text-xs text-white truncate">{request?.user_address || "Customer location on map"}</p>
            {distFromMe && (
              <span className="ml-auto text-xs font-bold text-primary shrink-0">{distFromMe} away</span>
            )}
          </div>
        </div>

        {/* SOS Details */}
        <div className="px-4 pt-4 pb-2">
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-4 flex items-center gap-4">
            <span className="text-3xl">{ISSUE_EMOJIS[request?.issue_type] ?? "⚠️"}</span>
            <div>
              <p className="text-base font-black text-white">{request?.issue_type}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {new Date(request?.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} · Waiting for mechanic
              </p>
            </div>
          </div>
        </div>

        {/* Acceptance form */}
        <form onSubmit={handleAccept} className="flex-1 px-4 pt-4 pb-10 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Your Details</p>

          <input
            type="text"
            value={mechName}
            onChange={(e) => setMechName(e.target.value)}
            placeholder="Your name *"
            required
            className={inputCls}
          />
          <input
            type="text"
            value={garageName}
            onChange={(e) => setGarageName(e.target.value)}
            placeholder="Garage / shop name *"
            required
            className={inputCls}
          />
          <input
            type="tel"
            value={mechPhone}
            onChange={(e) => setMechPhone(e.target.value)}
            placeholder="Your phone number"
            className={inputCls}
          />

          {locError && (
            <p className="text-xs text-amber-400">{locError}</p>
          )}
          {acceptError && (
            <p className="text-xs text-red-400">{acceptError}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !mechName.trim() || !garageName.trim()}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#D32F2F] py-4 text-base font-black text-white shadow-[0_8px_32px_rgba(211,47,47,0.4)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? <><Loader2 className="h-5 w-5 animate-spin" />Accepting…</>
              : <><CheckCircle2 className="h-5 w-5" />Accept & Go</>
            }
          </button>

          <p className="text-center text-[11px] text-slate-600">
            By accepting, you agree to share your live location with the customer until you arrive
          </p>
        </form>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // ACCEPTED — en route, live location sharing
  // ══════════════════════════════════════════════════════════════
  if (phase === "accepted") {
    return (
      <div className="flex h-dvh flex-col bg-[#0F172A]">

        {/* Live map — shows both positions */}
        <div className="flex-1 relative min-h-0">
          <SosMap userCoords={userCoords} mechanicCoords={myCoords} className="h-full w-full" />

          {/* Location sharing indicator */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 rounded-full bg-black/65 backdrop-blur-md px-4 py-2">
            {locSharing ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                </span>
                <span className="text-xs font-bold text-white">Sharing live location</span>
              </>
            ) : (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                <span className="text-xs text-slate-400">Getting your GPS…</span>
              </>
            )}
            {distToUser && (
              <span className="ml-2 text-xs font-bold text-primary">{distToUser} to customer</span>
            )}
          </div>
        </div>

        {/* Bottom sheet */}
        <div className="shrink-0 rounded-t-3xl bg-[#1E293B] px-5 pt-5 pb-8 space-y-4">

          <div className="flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3">
            <span className="text-2xl">{ISSUE_EMOJIS[request?.issue_type] ?? "⚠️"}</span>
            <div>
              <p className="text-sm font-bold text-white">{request?.issue_type}</p>
              <p className="text-xs text-slate-400 truncate">{request?.user_address || "Customer location"}</p>
            </div>
          </div>

          {locError && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-400">{locError}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleArrived}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-green-500 py-4 text-base font-black text-white shadow-[0_8px_32px_rgba(34,197,94,0.4)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {submitting
              ? <><Loader2 className="h-5 w-5 animate-spin" />Please wait…</>
              : <><Navigation className="h-5 w-5" />I've Arrived</>
            }
          </button>

          <p className="text-center text-[11px] text-slate-600">
            Tap when you reach the customer's location. An OTP will be generated for verification.
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // ARRIVED — OTP entry by mechanic
  // ══════════════════════════════════════════════════════════════
  if (phase === "arrived") {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center px-6 gap-6">

        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-[0_0_48px_rgba(0,86,210,0.45)]">
          <Wrench className="h-10 w-10 text-white" />
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-black text-white">You've Arrived!</h2>
          <p className="mt-1.5 text-sm text-slate-400">
            Ask the customer for their OTP and enter it below
          </p>
        </div>

        <form onSubmit={handleVerify} className="w-full max-w-xs space-y-4">
          {/* OTP input — large digits */}
          <div className="rounded-3xl bg-white/8 border border-white/15 p-6 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">
              Enter Customer OTP
            </p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 4)); setOtpError(null); }}
              placeholder="4-digit OTP"
              className="w-full rounded-2xl border border-white/15 bg-white/8 px-4 py-4 text-center text-3xl font-black tracking-[0.4em] text-white placeholder:text-slate-600 placeholder:text-base placeholder:tracking-normal focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition"
            />
            {otpError && <p className="text-xs text-red-400 text-center">{otpError}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting || otp.length !== 4}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-4 text-base font-black text-white shadow-glow-primary transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? <><Loader2 className="h-5 w-5 animate-spin" />Verifying…</>
              : <><CheckCircle2 className="h-5 w-5" />Verify & Start Service</>
            }
          </button>
        </form>

        <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-3 w-full max-w-xs">
          <Shield className="h-4 w-4 text-slate-500 shrink-0" />
          <p className="text-xs text-slate-500 leading-relaxed">
            The OTP is displayed on the customer's GarageDekho app
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // VERIFIED — all done
  // ══════════════════════════════════════════════════════════════
  if (phase === "verified") {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-500 shadow-[0_0_64px_rgba(34,197,94,0.5)]">
          <CheckCircle2 className="h-12 w-12 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">Service Confirmed!</h2>
          <p className="mt-1.5 text-sm text-slate-400">
            OTP verified. You're now officially helping the customer.
          </p>
        </div>
        <div className="rounded-2xl bg-white/6 border border-white/10 px-6 py-4 w-full max-w-xs">
          <p className="text-sm font-bold text-white">{request?.issue_type}</p>
          <p className="text-xs text-slate-400 mt-1">{request?.user_address || "Customer location"}</p>
        </div>
        <p className="text-xs text-slate-600 max-w-xs">
          Thank you for responding quickly! After the service, encourage the customer to leave a review on GarageDekho.
        </p>
      </div>
    );
  }

  return null;
}
