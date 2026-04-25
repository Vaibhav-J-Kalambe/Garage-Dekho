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
  const [stats,         setStats]         = useState({ bookings: 0, revenue: 0, sos: 0, rating: "-" });
  const [activeSos,     setActiveSos]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [todayBookings, setTodayBookings] = useState([]);
  const [otpMap,        setOtpMap]        = useState({});
  const [otpLoading,    setOtpLoading]    = useState({});

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
    try {
      await Promise.all([fetchActiveSos(), fetchStats(), fetchTodayBookings()]);
    } catch (e) {
      console.error("[dashboard] fetch error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTodayBookings() {
    const todayStr = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("bookings")
      .select("id, booking_date, booking_time, service_name, vehicle_type, status, service_otp, otp_expires_at, profiles(full_name, phone)")
      .eq("garage_id", garage?.id)
      .eq("booking_date", todayStr)
      .eq("status", "confirmed")
      .order("booking_time", { ascending: true });
    setTodayBookings(data || []);
  }

  async function generateOtp(bookingId) {
    setOtpLoading((prev) => ({ ...prev, [bookingId]: true }));
    try {
      const res  = await fetch("/api/booking/generate-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId, garage_id: garage?.id }),
      });
      const json = await res.json();
      if (res.ok) {
        setOtpMap((prev) => ({ ...prev, [bookingId]: json.otp }));
      }
    } finally {
      setOtpLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
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
      .select("id, garage_id")
      .eq("garage_id", garage?.id)
      .gte("created_at", today.toISOString());
    setStats({ bookings: 0, revenue: 0, sos: sosData?.length ?? 0, rating: "-" });
  }

  if (loading || !garage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 rounded-full border-4 border-[#0056b7] border-t-transparent animate-spin" />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-[#f9f9fe]">

      <div style={{ paddingTop: 64 }}>
        <div className="mx-auto max-w-2xl px-4 md:px-8 pt-6 pb-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#727687]">{greeting}</p>
              <h1 className="mt-1 text-[2rem] md:text-[2.5rem] font-bold tracking-tight text-[#1a1c1f]">{garage.garage_name}</h1>
              <p className="mt-1 text-sm text-[#727687]">{garage.address}, {garage.city}</p>
            </div>
            <button
              onClick={signOut}
              aria-label="Sign out"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f3f8] text-[#424656] transition-colors duration-150 hover:bg-[#ededf2] active:scale-95"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div style={{ paddingBottom: "max(96px, calc(env(safe-area-inset-bottom) + 96px))" }}>
        <div className="mx-auto max-w-2xl px-4 pt-4 space-y-4">

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
              { label: "Bookings Today", value: stats.bookings, color: "bg-[#0056b7]", icon: (
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
                <p className="text-2xl font-black text-[#1a1c1f]">{value}</p>
                <p className="mt-0.5 text-xs text-[#727687]">{label}</p>
              </div>
            ))}
          </div>

          {/* Active SOS List */}
          {activeSos.length > 0 && (
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#c2c6d8]/30">
                <p className="text-sm font-black text-[#1a1c1f]">Active SOS</p>
                <Link href="/portal/sos" className="text-xs font-semibold text-[#0056b7]">View all →</Link>
              </div>
              <div className="p-3 space-y-1">
                {activeSos.slice(0, 3).map((req) => {
                  const dist = garage?.lat && garage?.lng
                    ? haversine(garage.lat, garage.lng, req.user_lat, req.user_lng).toFixed(1)
                    : null;
                  const statusColor = { pending: "bg-red-100 text-red-600", accepted: "bg-blue-100 text-blue-600", arrived: "bg-green-100 text-green-600" }[req.status] ?? "bg-[#f3f3f8] text-[#424656]";
                  return (
                    <Link key={req.id} href="/portal/sos">
                      <div className="flex items-center gap-3 rounded-xl p-3 hover:bg-[#f3f3f8] active:bg-[#ededf2] transition-colors duration-150">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#1a1c1f] truncate">{req.issue_type}</p>
                          <p className="text-xs text-[#727687] truncate">{req.user_address || "Location shared"}{dist ? ` · ${dist} km` : ""}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusColor}`}>{req.status}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Today's Check-Ins */}
          {todayBookings.length > 0 && (
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#c2c6d8]/30">
                <p className="text-sm font-black text-[#1a1c1f]">Today&apos;s Check-Ins</p>
                <span className="text-xs font-bold text-[#727687]">{todayBookings.length} booking{todayBookings.length > 1 ? "s" : ""}</span>
              </div>
              <div className="p-3 space-y-2">
                {todayBookings.map((b) => {
                  const otp = otpMap[b.id];
                  return (
                    <div key={b.id} className="rounded-xl border border-[#f0f0f0] p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#1a1c1f] truncate">{b.profiles?.full_name || "Customer"}</p>
                          <p className="text-xs text-[#727687]">{b.service_name} · {b.booking_time}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600">
                          {b.vehicle_type}
                        </span>
                      </div>
                      {otp ? (
                        <div className="flex items-center gap-3 rounded-xl bg-[#f0f6ff] px-4 py-3">
                          <div className="flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#0056b7] mb-0.5">Check-In OTP</p>
                            <p className="text-2xl font-black tracking-[0.3em] text-[#0056b7]">{otp}</p>
                            <p className="text-[10px] text-[#727687] mt-0.5">Valid for 30 min · Share with customer</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => generateOtp(b.id)}
                            className="shrink-0 rounded-xl border border-[#0056b7]/30 px-3 py-2 text-[11px] font-bold text-[#0056b7] transition hover:bg-[#0056b7]/5 active:scale-95"
                          >
                            Refresh
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => generateOtp(b.id)}
                          disabled={otpLoading[b.id]}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0056b7] py-2.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                        >
                          {otpLoading[b.id] ? (
                            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          ) : null}
                          Generate OTP
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[#c2c6d8]/30">
              <p className="text-sm font-black text-[#1a1c1f]">Quick Actions</p>
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
