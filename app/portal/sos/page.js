"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { supabase } from "../../../lib/supabase";
import { usePortalAuth } from "../../../context/PortalAuthContext";

const SosMap = dynamic(() => import("../../../components/SosMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#f3f3f8] animate-pulse rounded-2xl" />,
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
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ── Inline SVG helpers ────────────────────────────────────────────────────────
function IconClose({ size = 16, ...p })    { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function IconBack({ size = 16, ...p })     { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><path d="M19 12H5M12 5l-7 7 7 7"/></svg>; }
function IconCheck({ size = 16, ...p })    { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><polyline points="20 6 9 17 4 12"/></svg>; }
function IconCheckCircle({ size = 16, ...p }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>; }
function IconPin({ size = 16, ...p })      { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>; }
function IconClock({ size = 16, ...p })    { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function IconNav({ size = 16, ...p })      { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>; }
function IconUsers({ size = 32, ...p })    { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IconShield({ size = 12, ...p })   { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function IconSiren({ size = 32, ...p })    { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><path d="M11.5 2C6.81 2 3 5.81 3 10.5V19h18v-8.5C21 5.81 17.19 2 12.5 2"/><path d="M12 6v4"/><path d="M19 10h2M3 10H1M19.07 4.93l-1.41 1.41M6.34 6.34 4.93 4.93"/><path d="M3 19h18v2H3z"/></svg>; }
function IconSpinner({ size = 16, ...p })  { return <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" {...p}><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>; }

// ── Main component ────────────────────────────────────────────────────────────
export default function PortalSosPage() {
  const { garage } = usePortalAuth();

  const [pendingSos,   setPendingSos]   = useState([]);
  const [activeSos,    setActiveSos]    = useState([]);
  const [completedSos, setCompletedSos] = useState([]);
  const [loading,      setLoading]      = useState(true);

  const [dispatching,  setDispatching]  = useState(null);
  const [mechanics,    setMechanics]    = useState([]);
  const [selMechanic,  setSelMechanic]  = useState(null);
  const [dispatching2, setDispatching2] = useState(false);

  const [tracking,    setTracking]    = useState(null);
  const [mechCoords,  setMechCoords]  = useState(null);

  const [otpInput,  setOtpInput]  = useState("");
  const [otpError,  setOtpError]  = useState(null);
  const [verifying, setVerifying] = useState(false);

  const [dispatchError, setDispatchError] = useState(null);

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
        event: "UPDATE", schema: "public", table: "sos_assignments",
        filter: `request_id=eq.${requestId}`,
      }, (payload) => {
        const d = payload.new;
        if (d.mechanic_lat && d.mechanic_lng) setMechCoords([d.mechanic_lat, d.mechanic_lng]);
      })
      .subscribe();
  }

  function handleAccept(req) {
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
      await supabase.from("portal_mechanics").update({ status: "busy" }).eq("id", selMechanic.id);
      if (selMechanic.phone) {
        const msg = encodeURIComponent(
          `🚨 SOS Job Assigned!\n\nIssue: ${dispatching.issue_type}\nLocation: ${dispatching.user_address || "Shared on map"}\n\nOpen your tracking link:\n${mechLink}`
        );
        const digits = selMechanic.phone.replace(/\D/g, "");
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
      const mechanic = mechanics.find((m) => m.name === tracking.assignment?.mechanic_name);
      if (mechanic) await supabase.from("portal_mechanics").update({ status: "available" }).eq("id", mechanic.id);
      trackRef.current?.unsubscribe();
      setTracking(null);
      fetchAllSos();
    } else {
      setOtpError("Invalid OTP. Ask the customer to read their code again.");
    }
    setVerifying(false);
  }

  // ── Tracking overlay (full-screen map — keep compact layout) ─────────────
  if (tracking) {
    const userCoords = [tracking.user_lat, tracking.user_lng];
    const isArrived  = tracking.status === "arrived";
    return (
      <div className="flex h-dvh flex-col bg-[#e8e8f0]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {/* Map */}
        <div className="flex-1 relative">
          <SosMap userCoords={userCoords} mechanicCoords={mechCoords} className="h-full w-full" />
          <button
            onClick={() => { setTracking(null); trackRef.current?.unsubscribe(); }}
            aria-label="Close tracking"
            className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md text-[#424656] transition-colors duration-150 hover:bg-[#f3f3f8] active:scale-95"
          >
            <IconClose />
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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0056b7] text-xl font-black text-white shrink-0">
              {(tracking.assignment?.mechanic_name || "M").charAt(0)}
            </div>
            <div>
              <p className="font-black text-[#1a1c1f]">{tracking.assignment?.mechanic_name}</p>
              <p className="text-xs text-[#727687]">{tracking.issue_type} · {tracking.user_address || "User location"}</p>
            </div>
          </div>

          {!isArrived ? (
            <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700 font-medium">
              Mechanic is on the way. Map updates every 5 seconds.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                <IconCheckCircle size={16} className="text-green-600 shrink-0" />
                Mechanic has arrived at customer location!
              </div>
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#727687]">Enter OTP from Customer</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => { setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 4)); setOtpError(null); }}
                    placeholder="_ _ _ _"
                    style={{ fontSize: 16 }}
                    className="flex-1 rounded-xl border border-[#c2c6d8] bg-[#f3f3f8] px-4 py-3 text-center text-2xl font-black tracking-[0.5em] text-[#1a1c1f] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#0056b7] focus:ring-2 focus:ring-[#0056b7]/10 min-h-[44px]"
                  />
                  <button
                    onClick={handleVerifyOtp}
                    disabled={verifying}
                    className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#0056b7] px-5 text-sm font-bold text-white transition-[filter,transform] duration-150 hover:brightness-110 active:scale-95 disabled:opacity-60"
                  >
                    {verifying ? <IconSpinner stroke="white" /> : <IconCheck size={16} stroke="white" />}
                    Verify
                  </button>
                </div>
                {otpError && <p className="mt-2 text-xs text-red-500">{otpError}</p>}
                <p className="mt-2 flex items-center gap-1 text-xs text-[#727687]">
                  <IconShield className="shrink-0" /> OTP is shown on the customer's screen
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Dispatch modal ────────────────────────────────────────────────────────
  if (dispatching) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f9f9fe]">

        <div style={{ paddingTop: 64 }}>
          <div className="mx-auto max-w-sm px-4 pt-6 pb-2">
            <button
              onClick={() => setDispatching(null)}
              aria-label="Cancel"
              className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f3f8] text-[#424656] transition-colors duration-150 hover:bg-[#ededf2] active:scale-95"
            >
              <IconBack />
            </button>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#727687]">SOS</p>
            <h1 className="mt-1 text-[2rem] font-bold tracking-tight text-[#1a1c1f]">Dispatch Mechanic</h1>
            <p className="mt-1 text-sm text-[#727687]">
              {ISSUE_ICONS[dispatching.issue_type] || "⚠️"} {dispatching.issue_type} · {dispatching.user_address || "Customer location"}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div
            className="mx-auto w-full max-w-sm px-4 py-8 space-y-4"
            style={{ paddingBottom: "max(40px, calc(env(safe-area-inset-bottom) + 40px))" }}
          >
            <p className="text-xs font-black uppercase tracking-widest text-[#727687]">Select Mechanic</p>

            {mechanics.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-center shadow-card">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#f3f3f8]">
                  <IconUsers size={28} className="text-[#c2c6d8]" />
                </div>
                <p className="text-sm font-semibold text-[#424656]">No mechanics added yet.</p>
                <p className="mt-1 text-xs text-[#727687]">Add your team in the Team tab first.</p>
              </div>
            ) : (
              mechanics.map((m) => (
                <button
                  key={m.id}
                  onClick={() => m.status === "available" && setSelMechanic(m)}
                  disabled={m.status !== "available"}
                  className={`w-full flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card text-left transition-[box-shadow,transform] duration-150 min-h-[72px] ${
                    m.status !== "available" ? "opacity-50 cursor-not-allowed" :
                    selMechanic?.id === m.id ? "ring-2 ring-[#0056b7] shadow-[0_0_0_2px_rgba(0,86,183,0.15)]" :
                    "hover:shadow-md active:scale-[0.98]"
                  }`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0056b7] text-lg font-black text-white">
                    {m.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[#1a1c1f] truncate">{m.name}</p>
                    <p className="text-xs text-[#727687]">{m.specialization}</p>
                  </div>
                  <div className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                    m.status === "available" ? "bg-green-100 text-green-700" :
                    m.status === "busy"      ? "bg-red-100 text-red-700" :
                                               "bg-[#f3f3f8] text-[#424656]"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      m.status === "available" ? "bg-green-500" :
                      m.status === "busy"      ? "bg-red-500" : "bg-[#727687]"
                    }`} />
                    {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                  </div>
                  {selMechanic?.id === m.id && (
                    <IconCheckCircle size={18} className="text-[#0056b7] shrink-0" />
                  )}
                </button>
              ))
            )}

            {dispatchError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {dispatchError}
              </div>
            )}

            {selMechanic && (
              <button
                onClick={confirmDispatch}
                disabled={dispatching2}
                aria-busy={dispatching2}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0056b7] text-base font-black text-white shadow-glow-primary transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              >
                {dispatching2 ? <IconSpinner stroke="white" size={18} /> : <IconNav size={18} stroke="white" />}
                {dispatching2 ? "Dispatching…" : `Dispatch ${selMechanic.name}`}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Main SOS list ─────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-[#f9f9fe]">

      <div style={{ paddingTop: 64 }}>
        <div className="mx-auto max-w-sm px-4 pt-6 pb-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#727687]">Portal</p>
          <h1 className="mt-1 text-[2rem] font-bold tracking-tight text-[#1a1c1f]">SOS Alerts</h1>
          <p className="mt-1 text-sm text-[#727687]">Real-time emergency requests near you</p>

          {/* Live indicator chips */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
            {pendingSos.length > 0 ? (
              <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-red-50 px-2.5 py-1 text-red-700">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-ping" />
                {pendingSos.length} incoming
              </span>
            ) : (
              <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-[#f3f3f8] px-2.5 py-1 text-[#424656]">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                No pending alerts
              </span>
            )}
            {activeSos.length > 0 && (
              <>
                <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  {activeSos.length} active
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: "max(96px, calc(env(safe-area-inset-bottom) + 96px))" }}
      >
        <div className="mx-auto max-w-sm px-4 pt-4 space-y-5">

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 rounded-full border-4 border-[#0056b7] border-t-transparent animate-spin" />
            </div>
          ) : (
            <>
              {/* Incoming */}
              {pendingSos.length > 0 && (
                <section>
                  <p className="mb-3 text-xs font-black uppercase tracking-widest text-[#727687]">
                    Incoming ({pendingSos.length})
                  </p>
                  <div className="space-y-3">
                    {pendingSos.map((req) => (
                      <IncomingSosCard key={req.id} req={req} onAccept={() => handleAccept(req)} />
                    ))}
                  </div>
                </section>
              )}

              {/* Active */}
              {activeSos.length > 0 && (
                <section>
                  <p className="mb-3 text-xs font-black uppercase tracking-widest text-[#727687]">
                    Active Jobs ({activeSos.length})
                  </p>
                  <div className="space-y-3">
                    {activeSos.map((req) => (
                      <ActiveSosCard key={req.id} req={req} onTrack={() => openTracking(req)} />
                    ))}
                  </div>
                </section>
              )}

              {/* Completed today */}
              {completedSos.length > 0 && (
                <section>
                  <p className="mb-3 text-xs font-black uppercase tracking-widest text-[#727687]">
                    Completed Today ({completedSos.length})
                  </p>
                  <div className="space-y-2">
                    {completedSos.map((req) => (
                      <div key={req.id} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-card">
                        <IconCheckCircle size={18} className="text-green-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#1a1c1f] truncate">{req.issue_type}</p>
                          <p className="text-xs text-[#727687]">{req.assignment?.mechanic_name} · Verified</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {pendingSos.length === 0 && activeSos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f3f3f8]">
                    <IconSiren size={30} className="text-[#727687]" />
                  </div>
                  <p className="font-bold text-[#424656]">No active SOS alerts</p>
                  <p className="mt-1 text-sm text-[#727687]">New alerts will appear here in real-time</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function IncomingSosCard({ req, onAccept }) {
  return (
    <div className="overflow-hidden rounded-2xl border-l-4 border-red-500 bg-white shadow-card">
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">{ISSUE_ICONS[req.issue_type] || "⚠️"}</span>
            <div>
              <p className="font-black text-[#1a1c1f]">{req.issue_type}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-[#727687]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {timeAgo(req.created_at)}
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" /> LIVE
          </span>
        </div>

        <div className="mb-3 flex items-center gap-1.5 text-sm text-[#424656]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span className="truncate">{req.user_address || "Location shared"}</span>
          {req.distance !== null && (
            <span className="shrink-0 text-xs font-bold text-[#0056b7]">
              · {req.distance < 1 ? `${(req.distance * 1000).toFixed(0)}m` : `${req.distance.toFixed(1)}km`}
            </span>
          )}
        </div>

        <button
          onClick={onAccept}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#0056b7] text-sm font-bold text-white transition-[filter,transform] duration-150 hover:brightness-110 active:scale-95"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          Accept &amp; Dispatch
        </button>
      </div>
    </div>
  );
}

function ActiveSosCard({ req, onTrack }) {
  const isArrived = req.status === "arrived";
  return (
    <div className={`overflow-hidden rounded-2xl border-l-4 bg-white shadow-card ${isArrived ? "border-green-500" : "border-blue-500"}`}>
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="font-black text-[#1a1c1f]">{req.issue_type}</p>
            <p className="text-xs text-[#727687]">{req.assignment?.mechanic_name} dispatched</p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${isArrived ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
            {isArrived ? "Arrived" : "En Route"}
          </span>
        </div>
        <button
          onClick={onTrack}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#c2c6d8]/30 bg-[#f3f3f8] text-sm font-bold text-[#424656] transition-colors duration-150 hover:bg-[#ededf2] active:scale-95"
        >
          {isArrived ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Verify OTP
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              Live Track
            </>
          )}
        </button>
      </div>
    </div>
  );
}
