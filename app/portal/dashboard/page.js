"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Siren, CalendarCheck, Star, TrendingUp,
  ChevronRight, Clock, AlertTriangle, CheckCircle2,
  Wrench, LogOut,
} from "lucide-react";
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

export default function PortalDashboard() {
  const { garage, portalUser, signOut } = usePortalAuth();
  const [stats,       setStats]       = useState({ bookings: 0, revenue: 0, sos: 0, rating: "—" });
  const [activeSos,   setActiveSos]   = useState([]);
  const [recentJobs,  setRecentJobs]  = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!garage) return;
    fetchDashboard();

    // Realtime: watch for new SOS near this garage
    const channel = supabase
      .channel("portal-sos-watch")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "sos_requests",
      }, () => {
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

    // Filter by distance from garage (client-side)
    const nearby = (data || []).filter((r) => {
      if (!garage?.lat || !garage?.lng) return true;
      return haversine(garage.lat, garage.lng, r.user_lat, r.user_lng) <= 15;
    });
    setActiveSos(nearby);
  }

  async function fetchStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // SOS handled today — filter by garage_id (with garage_name fallback for old records)
    const { data: sosData } = await supabase
      .from("sos_assignments")
      .select("id, garage_id, garage_name")
      .or(`garage_id.eq.${garage?.id},garage_name.eq.${garage?.garage_name}`)
      .gte("created_at", today.toISOString());

    setStats({
      bookings: 0,        // bookings table not implemented yet
      revenue: 0,         // revenue tracking not implemented yet
      sos: sosData?.length ?? 0,
      rating: "—",        // ratings not implemented yet
    });
  }

  if (loading || !garage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="h-8 w-8 rounded-full border-4 border-[#0056D2] border-t-transparent animate-spin" />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      {/* Header */}
      <div className="bg-[#0F172A] px-5 pt-5 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400">{greeting},</p>
            <h1 className="text-xl font-black text-white">{garage.garage_name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{garage.address}, {garage.city}</p>
          </div>
          <button
            onClick={signOut}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-400 hover:text-white transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-4">
        {/* Active SOS Alert Banner */}
        {activeSos.filter((s) => s.status === "pending").length > 0 && (
          <Link href="/portal/sos">
            <div className="relative overflow-hidden rounded-2xl bg-[#D32F2F] p-4 shadow-[0_8px_24px_rgba(211,47,47,0.4)]">
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Siren className="h-5 w-5 text-white" />
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-white animate-ping" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white">
                    {activeSos.filter((s) => s.status === "pending").length} SOS Alert{activeSos.filter((s) => s.status === "pending").length > 1 ? "s" : ""} Nearby!
                  </p>
                  <p className="text-xs text-red-200">Tap to view and accept</p>
                </div>
                <ChevronRight className="h-5 w-5 text-white/80 shrink-0" />
              </div>
            </div>
          </Link>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={CalendarCheck} label="Bookings Today" value={stats.bookings} color="bg-[#0056D2]" />
          <StatCard icon={TrendingUp}    label="Revenue Today"  value={`₹${stats.revenue.toLocaleString()}`} color="bg-emerald-600" />
          <StatCard icon={Siren}         label="SOS Handled"    value={stats.sos}     color="bg-rose-600" />
          <StatCard icon={Star}          label="Avg Rating"     value={stats.rating}  color="bg-amber-500" />
        </div>

        {/* Active SOS List */}
        {activeSos.length > 0 && (
          <Section title="Active SOS" href="/portal/sos">
            {activeSos.slice(0, 3).map((req) => (
              <SosRow key={req.id} req={req} garage={garage} />
            ))}
          </Section>
        )}

        {/* Quick Actions */}
        <Section title="Quick Actions">
          <div className="grid grid-cols-2 gap-3">
            <QuickAction href="/portal/sos"       icon={Siren}     label="SOS Alerts"   color="bg-red-50 text-red-600" />
            <QuickAction href="/portal/mechanics" icon={Wrench}    label="My Team"      color="bg-blue-50 text-blue-600" />
          </div>
        </Section>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function Section({ title, href, children }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <p className="text-sm font-black text-slate-900">{title}</p>
        {href && (
          <Link href={href} className="text-xs font-semibold text-[#0056D2]">
            View all →
          </Link>
        )}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function SosRow({ req, garage }) {
  const dist = garage?.lat && garage?.lng
    ? haversine(garage.lat, garage.lng, req.user_lat, req.user_lng).toFixed(1)
    : null;

  const statusColor = {
    pending:  "bg-red-100 text-red-600",
    accepted: "bg-blue-100 text-blue-600",
    arrived:  "bg-green-100 text-green-600",
  }[req.status] ?? "bg-slate-100 text-slate-600";

  return (
    <Link href="/portal/sos">
      <div className="flex items-center gap-3 rounded-xl p-3 hover:bg-slate-50 transition">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{req.issue_type}</p>
          <p className="text-xs text-slate-500">{req.user_address || "Location shared"}{dist ? ` · ${dist} km` : ""}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusColor}`}>
          {req.status}
        </span>
      </div>
    </Link>
  );
}

function QuickAction({ href, icon: Icon, label, color }) {
  return (
    <Link href={href}>
      <div className={`flex items-center gap-3 rounded-xl p-4 ${color} transition hover:opacity-80 active:scale-95`}>
        <Icon className="h-5 w-5" />
        <span className="text-sm font-bold">{label}</span>
      </div>
    </Link>
  );
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
