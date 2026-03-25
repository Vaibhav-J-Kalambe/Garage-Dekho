"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { usePortalAuth } from "../../../context/PortalAuthContext";

function playSosAlert() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.15, 0.3].forEach((delay) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.12);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.12);
    });
  } catch {}
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function PortalDashboard() {
  const { garage, portalUser, signOut } = usePortalAuth();
  const [stats,      setStats]      = useState({ bookings: 0, revenue: 0, sos: 0, rating: "—" });
  const [activeSos,  setActiveSos]  = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (!garage) return;
    fetchDashboard();

    const channel = supabase
      .channel("portal-sos-watch")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sos_requests" }, () => {
        fetchActiveSos();
        playSosAlert();
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      })
      .subscribe();

    return () => channel.unsubscribe();
  }, [garage]);

  async function fetchDashboard() {
    setLoading(true);
    await Promise.all([fetchActiveSos(), fetchStats()]);
    setLoading(false);
  }

  async function fetchActiveSos() {
    const { data } = await supabase
      .from("sos_requests")
      .select("*")
      .in("status", ["pending", "accepted", "arrived"])
      .order("created_at", { ascending: false })
      .limit(5);
    const nearby = (data || []).filter((r) => {
      if (!garage?.lat || !garage?.lng) return true;
      return haversine(garage.lat, garage.lng, r.user_lat, r.user_lng) <= 15;
    });
    setActiveSos(nearby);
  }

  async function fetchStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: sosData } = await supabase
      .from("sos_assignments")
      .select("id, garage_id, garage_name")
      .or(`garage_id.eq.${garage?.id},garage_name.eq.${garage?.garage_name}`)
      .gte("created_at", today.toISOString());
    setStats({ bookings: 0, revenue: 0, sos: sosData?.length ?? 0, rating: "—" });
  }

  if (loading || !garage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 rounded-full border-4 border-[#0056D2] border-t-transparent animate-spin" />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001f5b] via-[#003091] to-[#0056D2]">

      {/* ── Header ── */}
      <div className="relative overflow-hidden px-5 pb-24 pt-12">
        {/* Dot-grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Glow blobs */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-400/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl" />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-sm text-blue-200">{greeting},</p>
            <h1 className="text-2xl font-black text-white leading-tight">{garage.garage_name}</h1>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-blue-300">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {garage.address}, {garage.city}
            </p>
          </div>
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition-colors duration-150 hover:bg-white/25 active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Pull-up content ── */}
      <div className="relative -mt-12 rounded-t-[3rem] bg-[#F8FAFC]" style={{ paddingBottom: "max(96px, calc(env(safe-area-inset-bottom) + 96px))" }}>
        <div className="mx-auto max-w-2xl px-4 pt-6 space-y-4">

          {/* Active SOS Alert Banner */}
          {activeSos.filter((s) => s.status === "pending").length > 0 && (
            <Link href="/portal/sos">
              <div className="relative overflow-hidden rounded-2xl bg-red-600 p-4 shadow-[0_8px_24px_rgba(220,38,38,0.35)] active:scale-[0.98] transition-transform duration-150">
                <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
                <div className="flex items-center gap-3">
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/>
                    </svg>
                    <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-white animate-ping" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white text-sm">
                      {activeSos.filter((s) => s.status === "pending").length} SOS Alert{activeSos.filter((s) => s.status === "pending").length > 1 ? "s" : ""} Nearby!
                    </p>
                    <p className="text-xs text-red-200">Tap to view and accept</p>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 opacity-80" aria-hidden="true">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </div>
            </Link>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Bookings Today", value: stats.bookings, color: "bg-[#0056D2]", icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></svg>
              )},
              { label: "Revenue Today", value: `₹${stats.revenue.toLocaleString()}`, color: "bg-emerald-600", icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              )},
              { label: "SOS Handled", value: stats.sos, color: "bg-rose-600", icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>
              )},
              { label: "Avg Rating", value: stats.rating, color: "bg-amber-500", icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              )},
            ].map(({ label, value, color, icon }) => (
              <div key={label} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
                  {icon}
                </div>
                <p className="text-2xl font-black text-slate-900">{value}</p>
                <p className="mt-0.5 text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Active SOS List */}
          {activeSos.length > 0 && (
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-black text-slate-900">Active SOS</p>
                <Link href="/portal/sos" className="text-xs font-semibold text-[#0056D2]">View all →</Link>
              </div>
              <div className="p-3 space-y-1">
                {activeSos.slice(0, 3).map((req) => {
                  const dist = garage?.lat && garage?.lng
                    ? haversine(garage.lat, garage.lng, req.user_lat, req.user_lng).toFixed(1)
                    : null;
                  const statusColor = { pending: "bg-red-100 text-red-600", accepted: "bg-blue-100 text-blue-600", arrived: "bg-green-100 text-green-600" }[req.status] ?? "bg-slate-100 text-slate-600";
                  return (
                    <Link key={req.id} href="/portal/sos">
                      <div className="flex items-center gap-3 rounded-xl p-3 hover:bg-slate-50 active:bg-slate-100 transition-colors duration-150">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{req.issue_type}</p>
                          <p className="text-xs text-slate-500 truncate">{req.user_address || "Location shared"}{dist ? ` · ${dist} km` : ""}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusColor}`}>{req.status}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-black text-slate-900">Quick Actions</p>
            </div>
            <div className="p-3 grid grid-cols-2 gap-3">
              {[
                { href: "/portal/sos", label: "SOS Alerts", bg: "bg-red-50", text: "text-red-600", icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>
                )},
                { href: "/portal/mechanics", label: "My Team", bg: "bg-blue-50", text: "text-blue-600", icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                )},
              ].map(({ href, label, bg, text, icon }) => (
                <Link key={href} href={href}>
                  <div className={`flex items-center gap-3 rounded-xl p-4 ${bg} ${text} min-h-[56px] transition-opacity duration-150 hover:opacity-80 active:scale-[0.98]`}>
                    {icon}
                    <span className="text-sm font-bold">{label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
