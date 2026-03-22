"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Static icons — not in lucide-animated
import { Bike, Car, BadgeCheck, AlertTriangle, Tag, Star } from "lucide-react";

// Animated icons — micro-animations on hover / click / ref trigger
import {
  SearchIcon,
  WrenchIcon,
  DropletIcon,
  GaugeIcon,
  ZapIcon,
  TruckIcon,
  WindIcon,
  RotateCcwIcon,
  HeartIcon,
  ShieldCheckIcon,
  ClockIcon,
  MapPinIcon,
  ChevronRightIcon,
  ArrowRightIcon,
  CircleCheckIcon,
} from "lucide-animated";

import Image from "next/image";
import Header from "../components/Header";
import { getAllGarages, getOpenGarageCount } from "../lib/garages";
import { getLastBooking } from "../lib/bookings";
import { getSavedGarageIds, saveGarage, unsaveGarage } from "../lib/saved";
import { useAuth } from "../components/AuthProvider";
import { useLocation } from "../context/LocationContext";
import { useToast } from "../context/ToastContext";
import Skeleton from "../components/ui/Skeleton";
import LocationPopup from "../components/LocationPopup";
import EmptyState from "../components/ui/EmptyState";

// ── Helpers ───────────────────────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Service categories — animated icons animate on hover by default
const SERVICES = [
  { label: "Bike Service",   icon: Bike,        color: "from-blue-500 to-indigo-600",  href: "/near-me?type=2-Wheeler", animated: false },
  { label: "Car Service",    icon: Car,         color: "from-violet-500 to-purple-600", href: "/near-me?type=4-Wheeler", animated: false },
  { label: "Oil Change",     icon: DropletIcon, color: "from-cyan-500 to-sky-600",      href: "/near-me?q=oil+change",   animated: true  },
  { label: "Tyre Repair",    icon: GaugeIcon,   color: "from-slate-500 to-slate-700",   href: "/near-me?q=tyre",         animated: true  },
  { label: "Battery Jump",   icon: ZapIcon,     color: "from-amber-500 to-orange-500",  href: "/near-me?q=battery",      animated: true  },
  { label: "Towing",         icon: TruckIcon,   color: "from-rose-500 to-red-600",      href: "/near-me?q=towing",       animated: true  },
  { label: "AC Repair",      icon: WindIcon,    color: "from-teal-500 to-emerald-600",  href: "/near-me?q=ac+repair",    animated: true  },
  { label: "General Repair", icon: WrenchIcon,  color: "from-primary to-blue-500",      href: "/near-me",                animated: true  },
];

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.round((Date.now() - new Date(dateStr + "T00:00:00").getTime()) / 86400000);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ── MagicUI-inspired inline components ────────────────────────────────────────

/** NumberTicker: counts up from 0 on first visibility */
function NumberTicker({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      let startTs = null;
      const duration = 1600;
      const tick = (ts) => {
        if (!startTs) startTs = ts;
        const pct = Math.min((ts - startTs) / duration, 1);
        // Cubic ease-out — fast start, slow finish (feels natural per design guide)
        const eased = 1 - Math.pow(1 - pct, 3);
        setDisplay(Math.round(eased * value));
        if (pct < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);
  return <span ref={ref} className="ticker-val">{display.toLocaleString()}{suffix}</span>;
}

/** MagicCard: subtle radial gradient follows mouse cursor — GPU-only (transform/opacity) */
function MagicCard({ children, className = "", onMouseEnter }) {
  const ref = useRef(null);
  function onMove(e) {
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--mx", `${e.clientX - r.left}px`);
    ref.current.style.setProperty("--my", `${e.clientY - r.top}px`);
  }
  return (
    <div ref={ref} onMouseMove={onMove} onMouseEnter={onMouseEnter} className={`magic-card ${className}`}>
      {children}
    </div>
  );
}

/** AnimatedSearchButton: SearchIcon animates on button hover via ref */
function AnimatedSearchButton() {
  const iconRef = useRef(null);
  return (
    <button
      type="submit"
      aria-label="Search garages"
      onMouseEnter={() => iconRef.current?.startAnimation()}
      className="shimmer-btn flex shrink-0 items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-900 shadow-[0_4px_16px_rgba(245,158,11,0.4)] transition-[transform,background-color] duration-150 hover:bg-amber-300 hover:scale-[1.03] active:scale-[0.97] min-h-[44px]"
    >
      <SearchIcon ref={iconRef} size={15} />
      Search
    </button>
  );
}

/** SaveButton: HeartIcon animates on click via ref */
function SaveButton({ garageId, isSaved, isBursting, onToggle }) {
  const iconRef = useRef(null);
  function handleClick(e) {
    iconRef.current?.startAnimation();
    onToggle(e, garageId);
  }
  return (
    <button
      type="button"
      aria-label={isSaved ? "Remove from saved" : "Save garage"}
      onClick={handleClick}
      className="rounded-full p-0.5 focus-visible:outline-2 active:scale-90"
    >
      <HeartIcon
        ref={iconRef}
        size={16}
        className={`transition-colors ${
          isSaved ? "fill-red-500 text-red-500" : "text-slate-200 hover:text-red-400"
        } ${isBursting ? "animate-heart-burst" : ""}`}
      />
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { location } = useLocation();
  const { showToast } = useToast();

  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [topGarages,         setTopGarages]         = useState([]);
  const [garagesLoading,     setGaragesLoading]     = useState(true);
  const [search,             setSearch]             = useState("");
  const [lastBooking,        setLastBooking]        = useState(null);
  const [lastBookingLoading, setLastBookingLoading] = useState(true);
  const [openCount,          setOpenCount]          = useState(null);
  const [savedIds,           setSavedIds]           = useState(new Set());
  const [heartBurst,         setHeartBurst]         = useState(null);
  const [userCoords,         setUserCoords]         = useState(
    location?.lat && location?.lng ? [location.lat, location.lng] : null
  );
  const [userArea, setUserArea] = useState(location?.area || null);

  // Sync location context changes (e.g. user picks city from popup)
  useEffect(() => {
    if (location?.lat && location?.lng) setUserCoords([location.lat, location.lng]);
    if (location?.area) setUserArea(location.area);
  }, [location]);

  useEffect(() => {
    const saved = localStorage.getItem("gd_location");
    if (!saved) setShowLocationPopup(true);

    // 5-min sessionStorage cache — skip DB on repeat visits
    const CACHE_KEY = "gd_garages_v1";
    const CACHE_TTL = 5 * 60 * 1000;
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts < CACHE_TTL) {
          setTopGarages(data);
          setGaragesLoading(false);
          return;
        }
      }
    } catch {}

    getAllGarages()
      .then((data) => {
        setTopGarages(data);
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
      })
      .catch(console.error)
      .finally(() => setGaragesLoading(false));

    getOpenGarageCount().then(setOpenCount);

    const alreadyHasArea = !!location?.area;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          setUserCoords([coords.latitude, coords.longitude]);
          if (alreadyHasArea) return;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=12`,
              { headers: { "Accept-Language": "en" } }
            );
            const data = await res.json();
            const a = data.address ?? {};
            const area = a.suburb || a.neighbourhood || a.city_district || a.town || a.city || null;
            if (area) setUserArea(area);
          } catch {}
        },
        () => {},
        { timeout: 8000, maximumAge: 300000 }
      );
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setLastBooking(null);
      setSavedIds(new Set());
      setLastBookingLoading(false);
      return;
    }
    getLastBooking(user.id).then(setLastBooking).catch(() => null).finally(() => setLastBookingLoading(false));
    getSavedGarageIds(user.id).then((ids) => setSavedIds(new Set(ids)));
  }, [user]);

  async function toggleSave(e, garageId) {
    e.preventDefault();
    if (!user) { router.push("/auth"); return; }
    const isSaved = savedIds.has(garageId);
    if (!isSaved) { setHeartBurst(garageId); setTimeout(() => setHeartBurst(null), 500); }
    setSavedIds((prev) => {
      const next = new Set(prev);
      isSaved ? next.delete(garageId) : next.add(garageId);
      return next;
    });
    try {
      isSaved ? await unsaveGarage(user.id, garageId) : await saveGarage(user.id, garageId);
    } catch {
      setSavedIds((prev) => {
        const next = new Set(prev);
        isSaved ? next.add(garageId) : next.delete(garageId);
        return next;
      });
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    const q = search.trim();
    if (q) router.push(`/near-me?q=${encodeURIComponent(q)}`);
  }

  const NEARBY_RADIUS_KM = 15;
  const garagesWithDist = useMemo(() => {
    const mapped = topGarages.map((g) => {
      if (userCoords && g.lat && g.lng) {
        const km = haversine(userCoords[0], userCoords[1], g.lat, g.lng);
        return { ...g, distance: km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(1)} km`, _km: km };
      }
      return { ...g, _km: parseFloat(g.distance) || 99 };
    }).sort((a, b) => a._km - b._km);

    if (userCoords) {
      const nearby = mapped.filter((g) => g._km <= NEARBY_RADIUS_KM);
      return (nearby.length >= 1 ? nearby : mapped.slice(0, 3)).slice(0, 6);
    }
    return [...mapped].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6);
  }, [topGarages, userCoords]);

  const isPersonalized = !lastBookingLoading && !!lastBooking?.service_name;
  const personalizedGarages = useMemo(() => {
    if (!lastBooking?.service_name) return garagesWithDist;
    const keyword = lastBooking.service_name.toLowerCase().split(/[\s/]/)[0];
    const relevant = garagesWithDist.filter((g) =>
      g.services?.some((s) => s.name?.toLowerCase().includes(keyword))
    );
    if (relevant.length === 0) return garagesWithDist;
    const rest = garagesWithDist.filter((g) => !relevant.some((r) => r.id === g.id));
    return [...relevant, ...rest];
  }, [garagesWithDist, lastBooking]);

  const daysAgo    = lastBooking?.booking_date ? daysSince(lastBooking.booking_date) : null;
  const serviceDue = lastBooking?.status === "completed" && daysAgo !== null && daysAgo >= 30;

  // Refs for programmatic icon animations
  const rotateRef = useRef(null);
  const wrenchRef = useRef(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001f5b] via-[#003091] to-[#0056D2]">
      <Header />
      {showLocationPopup && <LocationPopup onClose={() => setShowLocationPopup(false)} />}

      {/* ══════════════════════════════════════════════════════════
          HERO — dark navy gradient, dot-grid texture, 8px-grid spacing
          pt-12/pb-32 = 48px/128px — generous breathing room (design guide §3)
      ══════════════════════════════════════════════════════════ */}
      <section
        aria-label="Search for garages"
        className="relative overflow-hidden bg-gradient-to-br from-[#001f5b] via-[#003091] to-[#0056D2] px-4 pb-28 pt-[77px] md:px-8 md:pb-36 md:pt-[93px]"
      >
        {/* Dot-grid texture — subtle ambient pattern (2026 trend: cinematic fields) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Ambient glow blobs */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-0 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative mx-auto max-w-5xl">

          {/* Live garages badge */}
          <div className="mb-6 inline-flex animate-slide-up items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
            {openCount !== null ? (
              <>
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                </span>
                <span className="text-xs font-semibold text-green-300">{openCount} garages open right now</span>
              </>
            ) : (
              <span className="text-xs font-semibold text-blue-200">Roadside help, when you need it most</span>
            )}
          </div>

          {/* Z-pattern layout: headline left → search right (desktop) */}
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:gap-14">

            {/* Headline — text-5xl (48px) for hero per design guide */}
            <div className="animate-slide-up delay-75 md:flex-1">
              <p className="mb-3 text-sm font-medium tracking-wide text-blue-200/80">
                {getGreeting()}{user?.user_metadata?.full_name
                  ? `, ${user.user_metadata.full_name.split(" ")[0]}`
                  : ""}
              </p>
              {/* tracking-tight on headings, 1.05 line-height (design guide typography) */}
              <h1 className="text-4xl font-black leading-[1.06] tracking-tight text-white sm:text-5xl md:text-6xl">
                Find Your<br />
                <span className="relative inline-block text-amber-300">
                  Mechanic
                  {/* Decorative underline — adds personality without color changes */}
                  <svg
                    aria-hidden="true"
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 220 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M3 6C44 2 88 1.5 110 4C132 6.5 176 6 217 2" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" opacity="0.65" />
                  </svg>
                </span>
                .
              </h1>
              {/* 50-75 char line length, leading-relaxed (1.5x) for body (design guide) */}
              <p className="mt-4 max-w-xs text-base font-medium leading-relaxed text-blue-200/75">
                Trusted garages · Verified experts · Fixed pricing
              </p>
            </div>

            {/* Search card — frosted glass, prominent CTA */}
            <form
              onSubmit={handleSearch}
              aria-label="Search garages form"
              className="animate-slide-up delay-100 md:flex-1"
            >
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-md">
                {userArea && (
                  <div className="mb-3 flex items-center gap-1.5 px-2">
                    <MapPinIcon size={12} className="text-blue-300" aria-hidden="true" />
                    <span className="text-xs font-medium text-blue-200">{userArea}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  {/* Search input — clear focus state, WCAG 2.2 */}
                  <div className="flex flex-1 items-center gap-2.5 rounded-xl bg-white px-4 py-3.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/30">
                    <SearchIcon size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search garage, service, or area…"
                      aria-label="Search garages"
                      className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                  <AnimatedSearchButton />
                </div>

                {/* Quick-search pills — horizontal scroll, no wrapping, one-tap navigation */}
                <div className="mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-hide">
                  {["Tyre Repair", "Oil Change", "Battery", "AC Repair"].map((q) => (
                    <button
                      key={q}
                      type="button"
                      aria-label={`Quick search: ${q}`}
                      onClick={() => router.push(`/near-me?q=${encodeURIComponent(q)}`)}
                      className="shrink-0 rounded-full bg-white/15 px-3.5 py-2 text-xs font-semibold text-white transition-[transform,background-color] duration-150 hover:bg-white/25 active:scale-95"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </form>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CONTENT — pulled over hero (-mt-12), white rounded surface
      ══════════════════════════════════════════════════════════ */}
      <div id="main-content" className="relative -mt-12 rounded-t-[2.5rem] bg-[#F8FAFC]">

        {/* ── Main content — gap-10 (40px) between sections ── */}
        {/* Section breathing room: 48-64px recommended; gap-10=40px, gap-12=48px */}
        <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-36 pt-8 md:px-8 md:pb-16 md:pt-12">

          {/* ── SERVICES ───────────────────────────────────────────── */}
          <section aria-labelledby="services-heading" className="animate-slide-up delay-150">
            <div className="mb-5 flex items-center justify-between">
              <div>
                {/* text-xl (20px) for section headers, tracking-tight (design guide) */}
                <h2 id="services-heading" className="text-xl font-black tracking-tight text-slate-900">
                  What do you need?
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">
                  Tap a service to find nearby garages
                </p>
              </div>
              <Link
                href="/near-me"
                className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-sm font-bold text-primary hover:bg-primary/5 active:scale-95"
              >
                All <ChevronRightIcon size={14} aria-hidden="true" />
              </Link>
            </div>

            {/* 4-col mobile, 8-col desktop */}
            <div className="grid grid-cols-4 gap-x-2 gap-y-4 md:grid-cols-8 md:gap-x-3">
              {SERVICES.map(({ label, icon: Icon, color, href, animated }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="group flex flex-col items-center gap-2 min-h-[72px]"
                >
                  {/* Card: hover -translate-y-1 + shadow (design guide hover: scale/lift) */}
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-sm transition-[transform,box-shadow] duration-200 group-hover:-translate-y-1 group-hover:shadow-md group-active:scale-95 md:h-16 md:w-16`}
                  >
                    {animated
                      ? <Icon size={24} className="text-white" />
                      : <Icon className="h-6 w-6 text-white md:h-7 md:w-7" />}
                  </div>
                  {/* 50-75 char limit per label — these are short, fine */}
                  <span className="w-16 text-center text-xs font-semibold leading-tight text-slate-600 transition-colors duration-150 group-hover:text-primary">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* ── QUICK ACTIONS: Book Again + SOS ───────────────────── */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 animate-slide-up delay-200">

            {/* Book Again — card padding p-5 (20px) ≈ design guide's 24px recommendation */}
            <MagicCard
              className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-card transition-[transform,box-shadow] duration-200 hover:shadow-card-hover hover:-translate-y-0.5"
              onMouseEnter={() => rotateRef.current?.startAnimation()}
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${serviceDue ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"}`}>
                <RotateCcwIcon ref={rotateRef} size={18} aria-hidden="true" />
              </div>
              <div className="relative z-10 min-w-0 flex-1">
                {lastBookingLoading ? (
                  <div className="space-y-2">
                    <div className="h-3 w-20 animate-pulse rounded-full bg-slate-100" />
                    <div className="h-4 w-36 animate-pulse rounded-full bg-slate-100" />
                  </div>
                ) : serviceDue ? (
                  <>
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-600">Service due!</p>
                    <p className="truncate text-sm font-bold text-slate-900">{daysAgo}d since {lastBooking.service_name}</p>
                  </>
                ) : lastBooking ? (
                  <>
                    <p className="text-xs font-semibold text-slate-400">Last visited</p>
                    <p className="truncate text-sm font-bold text-slate-900 leading-snug">{lastBooking.garage_name} · {lastBooking.service_name}</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-slate-400">No bookings yet</p>
                    <p className="text-sm font-bold text-slate-900">Find a garage near you</p>
                  </>
                )}
              </div>
              <Link
                href={lastBooking ? `/garage/${lastBooking.garage_id}` : "/near-me"}
                className={`relative z-10 shrink-0 rounded-full px-4 py-2 text-xs font-bold text-white transition-[transform,filter] duration-200 hover:brightness-110 hover:scale-[1.03] active:scale-[0.97] ${
                  serviceDue
                    ? "bg-amber-500 shadow-[0_4px_12px_rgba(245,158,11,0.4)]"
                    : "bg-primary shadow-glow-primary"
                }`}
              >
                {serviceDue ? "Book Now" : lastBooking ? "Book Again" : "Explore"}
              </Link>
            </MagicCard>

            {/* SOS — desktop only; mobile uses bottom nav SOS button */}
            <Link href="/sos" className="hidden md:block" aria-label="Roadside SOS emergency help">
              <div className="flex h-full items-center gap-4 rounded-2xl bg-gradient-to-r from-[#B71C1C] to-[#D32F2F] p-5 text-white shadow-sos transition-[transform,filter] duration-200 hover:brightness-105 hover:-translate-y-0.5 active:scale-[0.98]">
                <div aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  {/* text-lg for card title (18px), text-sm for sub (14px) — clear hierarchy */}
                  <p className="text-lg font-black leading-tight tracking-tight">Roadside Emergency?</p>
                  <p className="mt-1 text-sm leading-relaxed text-red-200">24/7 instant assistance · One tap away</p>
                </div>
                <ChevronRightIcon size={18} className="shrink-0 text-white/50" aria-hidden="true" />
              </div>
            </Link>

          </div>

          {/* ── NEARBY GARAGES ────────────────────────────────────── */}
          <section aria-labelledby="garages-heading">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 id="garages-heading" className="text-xl font-black tracking-tight text-slate-900">
                  {isPersonalized
                    ? "Recommended for You"
                    : userCoords
                    ? "Garages Near You"
                    : "Top Rated Garages"}
                </h2>
                {isPersonalized ? (
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-primary">
                    Based on your last {lastBooking.service_name}
                  </p>
                ) : userArea ? (
                  <div className="mt-1 flex items-center gap-1 text-sm text-slate-400">
                    <MapPinIcon size={13} aria-hidden="true" />
                    <span>{userArea}</span>
                  </div>
                ) : null}
              </div>
              <Link
                href="/near-me"
                className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-sm font-bold text-primary hover:bg-primary/5 active:scale-95"
              >
                View all <ChevronRightIcon size={14} aria-hidden="true" />
              </Link>
            </div>

            {garagesLoading ? (
              <Skeleton.GarageList count={3} />
            ) : personalizedGarages.length === 0 ? (
              <EmptyState preset="near-me" />
            ) : (
              <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
                {personalizedGarages.map((garage, i) => (
                  <Link
                    key={garage.id}
                    href={`/garage/${garage.id}`}
                    className="block animate-slide-up"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <MagicCard className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-card transition-[transform,box-shadow] duration-200 hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99]">

                      {/* Garage photo */}
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                        <Image
                          src={garage.image || "/placeholder-garage.svg"}
                          alt={`${garage.name} garage`}
                          fill
                          priority={i === 0}
                          className={`object-cover transition-transform duration-300 hover:scale-105 ${!garage.isOpen ? "opacity-70 grayscale-[20%]" : ""}`}
                          sizes="80px"
                        />
                        {garage.isOpen && (
                          <span
                            aria-label="Open now"
                            className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500"
                          />
                        )}
                      </div>

                      {/* Garage info — visual hierarchy: name > speciality > rating */}
                      <div className="relative z-10 min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <h3 className="truncate text-sm font-bold leading-snug text-slate-900">{garage.name}</h3>
                          {garage.verified && (
                            <CircleCheckIcon size={14} className="shrink-0 text-primary" aria-label="Verified garage" />
                          )}
                        </div>
                        {/* text-xs (12px) for secondary — clear step down in hierarchy */}
                        <p className="mt-0.5 truncate text-xs leading-relaxed text-slate-500">{garage.speciality}</p>
                        <div className="mt-2 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                          <span className="text-xs font-bold text-slate-700">{garage.rating}</span>
                          <span className="text-xs text-slate-400">({garage.reviews} reviews)</span>
                        </div>
                      </div>

                      {/* Right col — distance, save, open/closed */}
                      <div className="relative z-10 flex shrink-0 flex-col items-end gap-2">
                        <SaveButton
                          garageId={garage.id}
                          isSaved={savedIds.has(garage.id)}
                          isBursting={heartBurst === garage.id}
                          onToggle={toggleSave}
                        />
                        <span className="text-xs font-bold text-primary">{garage.distance}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${
                          garage.isOpen ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-400"
                        }`}>
                          {garage.isOpen ? "Open" : "Closed"}
                        </span>
                      </div>

                    </MagicCard>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* ── TRUST STRIP — 3 equal columns ──────────────────────── */}
          {/* Padding inside cards: p-5 = 20px (design guide: 24-32px; this is ~20px which is acceptable for compact strips) */}
          <section aria-label="Why choose GarageDekho" className="animate-slide-up delay-200">
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {[
                { icon: ShieldCheckIcon, label: "Fixed Pricing",    sub: "No hidden charges",       color: "text-primary bg-blue-50",      animated: true  },
                { icon: BadgeCheck,      label: "Verified Experts", sub: "Quality-checked garages",  color: "text-emerald-600 bg-emerald-50", animated: false },
                { icon: ClockIcon,       label: "Fast Response",    sub: "Avg. 15 min arrival",     color: "text-amber-600 bg-amber-50",    animated: true  },
              ].map(({ icon: Icon, label, sub, color, animated }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-3 rounded-2xl bg-white p-4 text-center shadow-card transition-[transform,box-shadow] duration-200 hover:shadow-card-hover hover:-translate-y-0.5 md:p-5"
                >
                  {/* Icon in tinted circle — proximity groups icon+label */}
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full ${color}`}>
                    {animated
                      ? <Icon size={20} />
                      : <Icon className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight text-slate-800 md:text-sm">{label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── PROMO BANNER ─────────────────────────────────────────── */}
          {/* High saturation CTA — unmissable (design guide 2026 trend) */}
          <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white shadow-promo animate-slide-up delay-200">
            <div aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Tag className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-black leading-tight tracking-tight">First service free!</p>
              <p className="mt-0.5 text-sm leading-relaxed text-amber-100">Free inspection on your first booking</p>
            </div>
            <Link
              href="/offers"
              aria-label="Claim free first service offer"
              className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-orange-600 shadow-sm transition-[transform,background-color] duration-200 hover:bg-white/90 hover:scale-[1.03] active:scale-[0.97]"
            >
              Claim
            </Link>
          </div>

          {/* ── PARTNER BANNER ───────────────────────────────────────── */}
          {/* Dark bg + BorderBeam = premium feel. padding p-7 = 28px ≈ design guide 24-32px */}
          <section
            aria-label="List your garage as a partner"
            className="border-beam-card animate-slide-up delay-300 overflow-hidden rounded-3xl bg-gradient-to-br from-[#080f1f] via-[#0d1a35] to-[#080f1f] p-6 text-white md:p-8"
            onMouseEnter={() => wrenchRef.current?.startAnimation()}
          >
            {/* Ambient glows — soft gradients (2026 design trend) */}
            <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-1/4 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl" />

            <div className="relative flex items-center justify-between gap-8">
              <div className="min-w-0 flex-1">
                {/* Tag chip — proximity groups the chip above the heading */}
                <span className="inline-block rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1 text-xs font-black uppercase tracking-widest text-blue-300">
                  For Garage Owners
                </span>
                {/* text-3xl (30px) for section banner heading — strong hierarchy */}
                <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight md:text-3xl">
                  Grow your business<br />with GarageDekho
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Zero listing fee · 10,000+ customers · Real-time SOS jobs
                </p>
                <Link
                  href="/partner"
                  aria-label="List your garage as a GarageDekho partner"
                  className="shimmer-btn mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-white shadow-glow-primary transition-[transform,filter] duration-200 hover:brightness-110 hover:scale-[1.03] active:scale-[0.97]"
                >
                  List Your Garage <ArrowRightIcon size={16} aria-hidden="true" />
                </Link>
              </div>

              {/* Wrench illustration — animates on banner hover via ref */}
              <div className="hidden shrink-0 flex-col items-center gap-3 md:flex">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <WrenchIcon ref={wrenchRef} size={44} className="text-primary" aria-hidden="true" />
                </div>
                <p className="text-center text-xs font-semibold leading-relaxed text-slate-500">
                  Join 500+<br />partner garages
                </p>
              </div>
            </div>
          </section>

          {/* ── FOOTER ───────────────────────────────────────────────── */}
          {/* Consistent spacing: pt-8 = 32px above fold, text-sm for links */}
          <footer className="border-t border-slate-100 pt-8" role="contentinfo">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="max-w-xs">
                <p className="text-base font-black text-slate-900">GarageDekho</p>
                {/* 50-75 char line length for readability (design guide) */}
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Hyperlocal automotive services — find trusted garages, book instantly, get roadside help 24/7.
                </p>
              </div>
              {/* 2-col link grid — consistent spacing gap-y-2, gap-x-12 */}
              <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                {[
                  { label: "Near Me",     href: "/near-me"  },
                  { label: "Bookings",    href: "/bookings" },
                  { label: "Offers",      href: "/offers"   },
                  { label: "SOS Help",    href: "/sos"      },
                  { label: "For Garages", href: "/partner"  },
                  { label: "Profile",     href: "/profile"  },
                ].map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="font-medium text-slate-500 transition-colors duration-200 hover:text-primary"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
            <p className="mt-8 text-center text-xs text-slate-300">
              © {new Date().getFullYear()} GarageDekho. All rights reserved.
            </p>
          </footer>

        </main>
      </div>
    </div>
  );
}
