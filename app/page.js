"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Static icons — not in lucide-animated
import { Bike, Car, BadgeCheck, AlertTriangle, Tag, Star } from "lucide-react";

// Animated icons — micro-animations on hover / click / programmatic trigger
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
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Animated icons as service card icons (hover-triggered by default)
const SERVICES = [
  { label: "Bike Service",   icon: Bike,        color: "from-blue-500 to-indigo-600",   href: "/near-me?type=2-Wheeler", animated: false },
  { label: "Car Service",    icon: Car,         color: "from-violet-500 to-purple-600",  href: "/near-me?type=4-Wheeler", animated: false },
  { label: "Oil Change",     icon: DropletIcon, color: "from-cyan-500 to-sky-600",       href: "/near-me?q=oil+change",   animated: true  },
  { label: "Tyre Repair",    icon: GaugeIcon,   color: "from-slate-500 to-slate-700",    href: "/near-me?q=tyre",         animated: true  },
  { label: "Battery Jump",   icon: ZapIcon,     color: "from-amber-500 to-orange-500",   href: "/near-me?q=battery",      animated: true  },
  { label: "Towing",         icon: TruckIcon,   color: "from-rose-500 to-red-600",       href: "/near-me?q=towing",       animated: true  },
  { label: "AC Repair",      icon: WindIcon,    color: "from-teal-500 to-emerald-600",   href: "/near-me?q=ac+repair",    animated: true  },
  { label: "General Repair", icon: WrenchIcon,  color: "from-primary to-blue-500",       href: "/near-me",                animated: true  },
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

// ── Search button with animated icon ─────────────────────────────────────────
function AnimatedSearchButton() {
  const iconRef = useRef(null);
  return (
    <button
      type="submit"
      onMouseEnter={() => iconRef.current?.startAnimation()}
      className="shimmer-btn flex shrink-0 items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-900 shadow-[0_4px_16px_rgba(245,158,11,0.4)] transition hover:bg-amber-300 active:scale-95"
    >
      <SearchIcon ref={iconRef} size={15} />
      Search
    </button>
  );
}

// ── Save button with animated heart ──────────────────────────────────────────
function SaveButton({ garageId, isSaved, isBursting, onToggle }) {
  const iconRef = useRef(null);
  function handleClick(e) {
    iconRef.current?.startAnimation();
    onToggle(e, garageId);
  }
  return (
    <button type="button" aria-label="Save garage" className="transition active:scale-90" onClick={handleClick}>
      <HeartIcon
        ref={iconRef}
        size={16}
        className={`transition ${isSaved ? "fill-red-500 text-red-500" : "text-slate-200 hover:text-red-400"} ${isBursting ? "animate-heart-burst" : ""}`}
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

  useEffect(() => {
    if (location?.lat && location?.lng) setUserCoords([location.lat, location.lng]);
    if (location?.area) setUserArea(location.area);
  }, [location]);

  useEffect(() => {
    const saved = localStorage.getItem("gd_location");
    if (!saved) setShowLocationPopup(true);

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

  // Ref for RotateCcw in Book Again card — animates on card hover
  const rotateRef = useRef(null);
  // Ref for Wrench in partner banner — animates on section hover
  const wrenchRef = useRef(null);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />
      {showLocationPopup && <LocationPopup onClose={() => setShowLocationPopup(false)} />}

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#001f5b] via-[#003091] to-[#0056D2] px-4 pb-28 pt-8 md:px-8 md:pb-32 md:pt-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-0 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative mx-auto max-w-5xl">

          {/* Live badge */}
          <div className="mb-5 inline-flex animate-slide-up items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 backdrop-blur-sm">
            {openCount !== null ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                </span>
                <span className="text-xs font-semibold text-green-300">{openCount} garages open now</span>
              </>
            ) : (
              <span className="text-xs font-semibold text-blue-200">Roadside help, when you need it most</span>
            )}
          </div>

          <div className="flex flex-col gap-8 md:flex-row md:items-center md:gap-14">

            {/* Headline */}
            <div className="animate-slide-up delay-75 md:flex-1">
              <p className="mb-2 text-sm font-medium text-blue-200">
                {getGreeting()}{user?.user_metadata?.full_name
                  ? `, ${user.user_metadata.full_name.split(" ")[0]}`
                  : ""}
              </p>
              <h1 className="text-[2.8rem] font-black leading-[1.06] tracking-tight text-white md:text-[3.8rem]">
                Find Your<br />
                <span className="relative inline-block text-amber-300">
                  Mechanic
                  <svg
                    className="absolute -bottom-1.5 left-0 w-full"
                    viewBox="0 0 220 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 6C44 2 88 1.5 110 4C132 6.5 176 6 217 2"
                      stroke="#F59E0B"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      opacity="0.65"
                    />
                  </svg>
                </span>
                .
              </h1>
              <p className="mt-4 max-w-xs text-sm font-medium leading-relaxed text-blue-200/80">
                Trusted garages · Verified experts · Fixed pricing
              </p>
            </div>

            {/* Search card */}
            <form onSubmit={handleSearch} className="animate-slide-up delay-100 md:flex-1">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-md">
                {userArea && (
                  <div className="mb-2.5 flex items-center gap-1.5 px-2 pt-0.5">
                    {/* MapPin animates on hover */}
                    <MapPinIcon size={12} className="text-blue-300" />
                    <span className="text-xs font-medium text-blue-200">{userArea}</span>
                  </div>
                )}
                <div className="flex gap-2.5">
                  <div className="flex flex-1 items-center gap-2.5 rounded-xl bg-white px-4 py-3 shadow-sm">
                    <SearchIcon size={16} className="shrink-0 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search garage, service, or area…"
                      className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                  <AnimatedSearchButton />
                </div>

                {/* Quick-search pills */}
                <div className="mt-2.5 flex flex-wrap gap-1.5 px-1 pb-0.5">
                  {["Tyre Repair", "Oil Change", "Battery", "AC Repair"].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => router.push(`/near-me?q=${encodeURIComponent(q)}`)}
                      className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-white/25"
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

      {/* ══════════════════════════════════════════
          CONTENT — pulled over hero
      ══════════════════════════════════════════ */}
      <div className="relative -mt-12 rounded-t-[2.5rem] bg-[#F8FAFC]">

        {/* Stats strip */}
        <div className="mx-auto max-w-5xl px-4 pt-6 md:px-8">
          <div className="blur-fade-in grid grid-cols-3 divide-x divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-card">
            {[
              { value: 500,   suffix: "+",  label: "Garages"         },
              { value: 10000, suffix: "+",  label: "Happy Customers" },
              { value: 24,    suffix: "/7", label: "Emergency Help"  },
            ].map(({ value, suffix, label }) => (
              <div key={label} className="flex flex-col items-center py-5 px-2">
                <span className="text-xl font-black text-primary md:text-2xl">
                  <NumberTicker value={value} suffix={suffix} />
                </span>
                <span className="mt-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400 md:text-xs">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pb-32 pt-7 md:px-8 md:pb-14 md:pt-10">

          {/* ── SERVICES ── */}
          <section className="animate-slide-up delay-150">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900">What do you need?</h2>
                <p className="mt-0.5 text-xs text-slate-400">Choose a service to find garages near you</p>
              </div>
              <Link href="/near-me" className="flex items-center gap-0.5 text-xs font-bold text-primary transition hover:underline">
                All <ChevronRightIcon size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
              {SERVICES.map(({ label, icon: Icon, color, href, animated }) => (
                <Link key={label} href={href} className="group flex flex-col items-center gap-2">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-md group-active:scale-95 md:h-16 md:w-16`}
                  >
                    {/* Animated icons use size prop; static icons use className */}
                    {animated
                      ? <Icon size={24} className="text-white" />
                      : <Icon className="h-6 w-6 text-white md:h-7 md:w-7" />
                    }
                  </div>
                  <span className="w-16 text-center text-[10px] font-semibold leading-tight text-slate-600 transition group-hover:text-primary md:text-xs">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* ── QUICK ACTIONS ── */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 animate-slide-up delay-200">

            {/* Book Again */}
            <MagicCard
              className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card transition-all duration-300 hover:shadow-card-hover"
              onMouseEnter={() => rotateRef.current?.startAnimation()}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${serviceDue ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"}`}>
                <RotateCcwIcon ref={rotateRef} size={16} />
              </div>
              <div className="relative z-10 min-w-0 flex-1">
                {lastBookingLoading ? (
                  <div className="space-y-1.5">
                    <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
                  </div>
                ) : serviceDue ? (
                  <>
                    <p className="text-xs font-semibold text-amber-600">Service due!</p>
                    <p className="truncate text-sm font-bold text-slate-900">{daysAgo}d since {lastBooking.service_name}</p>
                  </>
                ) : lastBooking ? (
                  <>
                    <p className="text-xs text-slate-500">Last visited</p>
                    <p className="truncate text-sm font-bold text-slate-900">{lastBooking.garage_name} · {lastBooking.service_name}</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-slate-500">No bookings yet</p>
                    <p className="truncate text-sm font-bold text-slate-900">Find a garage near you</p>
                  </>
                )}
              </div>
              <Link
                href={lastBooking ? `/garage/${lastBooking.garage_id}` : "/near-me"}
                className={`relative z-10 shrink-0 rounded-full px-4 py-2 text-xs font-bold text-white transition hover:brightness-110 active:scale-95 ${serviceDue ? "bg-amber-500 shadow-[0_4px_12px_rgba(245,158,11,0.4)]" : "bg-primary shadow-glow-primary"}`}
              >
                {serviceDue ? "Book Now" : lastBooking ? "Book Again" : "Explore"}
              </Link>
            </MagicCard>

            {/* SOS — desktop only */}
            <Link href="/sos" className="hidden md:block">
              <div className="flex h-full items-center gap-4 rounded-2xl bg-gradient-to-r from-[#B71C1C] to-[#D32F2F] p-4 text-white shadow-sos transition duration-300 hover:brightness-105 active:scale-[0.98]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-black leading-tight">Roadside Emergency?</p>
                  <p className="mt-0.5 text-xs text-red-200">24/7 instant assistance · One tap away</p>
                </div>
                <ChevronRightIcon size={18} className="shrink-0 text-white/50" />
              </div>
            </Link>

          </div>

          {/* ── NEARBY GARAGES ── */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900">
                  {isPersonalized
                    ? "Recommended for You"
                    : userCoords
                    ? "Garages Near You"
                    : "Top Rated Garages"}
                </h2>
                {isPersonalized ? (
                  <p className="mt-0.5 text-[11px] font-semibold text-primary">
                    Based on your last {lastBooking.service_name}
                  </p>
                ) : userArea ? (
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                    <MapPinIcon size={12} /> {userArea}
                  </div>
                ) : null}
              </div>
              <Link href="/near-me" className="flex items-center gap-0.5 text-xs font-bold text-primary transition hover:underline">
                View all <ChevronRightIcon size={14} />
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
                    <MagicCard className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99]">

                      {/* Photo */}
                      <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl">
                        <Image
                          src={garage.image || "/placeholder-garage.svg"}
                          alt={garage.name}
                          fill
                          priority={i === 0}
                          className={`object-cover transition duration-300 hover:scale-105 ${!garage.isOpen ? "opacity-70 grayscale-[20%]" : ""}`}
                          sizes="72px"
                        />
                        {garage.isOpen && (
                          <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="relative z-10 min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <h3 className="truncate text-sm font-bold text-slate-900">{garage.name}</h3>
                          {garage.verified && (
                            // CircleCheckIcon animates on hover of the verified badge itself
                            <CircleCheckIcon size={14} className="shrink-0 text-primary" />
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">{garage.speciality}</p>
                        <div className="mt-2 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-semibold text-slate-700">{garage.rating}</span>
                          <span className="text-[11px] text-slate-400">({garage.reviews} reviews)</span>
                        </div>
                      </div>

                      {/* Right col */}
                      <div className="relative z-10 flex shrink-0 flex-col items-end gap-2">
                        <SaveButton
                          garageId={garage.id}
                          isSaved={savedIds.has(garage.id)}
                          isBursting={heartBurst === garage.id}
                          onToggle={toggleSave}
                        />
                        <span className="text-xs font-bold text-primary">{garage.distance}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${garage.isOpen ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                          {garage.isOpen ? "Open" : "Closed"}
                        </span>
                      </div>

                    </MagicCard>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* ── TRUST STRIP ── */}
          <section className="animate-slide-up delay-200">
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: ShieldCheckIcon, label: "Fixed Pricing",    sub: "No hidden charges",      color: "text-primary bg-blue-50"       },
                { icon: BadgeCheck,      label: "Verified Experts", sub: "Quality-checked garages", color: "text-emerald-600 bg-emerald-50", static: true },
                { icon: ClockIcon,       label: "Fast Response",    sub: "Avg. 15 min arrival",    color: "text-amber-600 bg-amber-50"    },
              ].map(({ icon: Icon, label, sub, color, static: isStatic }) => (
                <div key={label} className="flex flex-col items-center gap-2.5 rounded-2xl bg-white p-4 text-center shadow-card group">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${color}`}>
                    {isStatic
                      ? <Icon className="h-5 w-5" />
                      : <Icon size={20} />
                    }
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-tight">{label}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400 leading-snug">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── PROMO ── */}
          <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white shadow-promo animate-slide-up delay-200">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Tag className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black leading-tight">First service free!</p>
              <p className="mt-0.5 text-xs text-amber-100">Free inspection on your first booking</p>
            </div>
            <Link
              href="/offers"
              className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-bold text-orange-600 shadow-sm transition hover:bg-white/90 active:scale-95"
            >
              Claim
            </Link>
          </div>

          {/* ── PARTNER BANNER ── */}
          <section
            className="border-beam-card animate-slide-up delay-300 overflow-hidden rounded-3xl bg-gradient-to-br from-[#080f1f] via-[#0d1a35] to-[#080f1f] p-6 text-white"
            onMouseEnter={() => wrenchRef.current?.startAnimation()}
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/4 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl" />

            <div className="relative flex items-center justify-between gap-6">
              <div className="min-w-0 flex-1">
                <span className="inline-block rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-blue-300">
                  For Garage Owners
                </span>
                <h3 className="mt-3 text-2xl font-black leading-tight tracking-tight">
                  Grow your business<br />with GarageDekho
                </h3>
                <p className="mt-1.5 text-sm text-slate-400">
                  Zero listing fee · 10,000+ customers · Real-time SOS jobs
                </p>
                <Link
                  href="/partner"
                  className="shimmer-btn mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-black text-white shadow-glow-primary transition hover:brightness-110 active:scale-95"
                >
                  List Your Garage <ArrowRightIcon size={16} />
                </Link>
              </div>

              {/* Wrench — animates when banner is hovered */}
              <div className="hidden shrink-0 flex-col items-center gap-2 md:flex">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <WrenchIcon ref={wrenchRef} size={40} className="text-primary" />
                </div>
                <p className="text-center text-[11px] font-semibold text-slate-500">
                  Join 500+<br />partner garages
                </p>
              </div>
            </div>
          </section>

          {/* ── FOOTER ── */}
          <footer className="border-t border-slate-100 pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-black text-slate-900">GarageDekho</p>
                <p className="mt-1 max-w-xs text-xs text-slate-400">
                  Hyperlocal automotive services — find trusted garages, book instantly, get roadside help 24/7.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-12 gap-y-1.5 text-xs">
                {[
                  { label: "Near Me",     href: "/near-me"  },
                  { label: "Bookings",    href: "/bookings" },
                  { label: "Offers",      href: "/offers"   },
                  { label: "SOS Help",    href: "/sos"      },
                  { label: "For Garages", href: "/partner"  },
                  { label: "Profile",     href: "/profile"  },
                ].map(({ label, href }) => (
                  <Link key={label} href={href} className="font-medium text-slate-500 transition hover:text-primary">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <p className="mt-6 text-center text-[11px] text-slate-300">
              © {new Date().getFullYear()} GarageDekho. All rights reserved.
            </p>
          </footer>

        </main>
      </div>
    </div>
  );
}
