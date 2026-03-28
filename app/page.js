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

// Service categories with Apple-style flat icon tiles + starting prices
const SERVICES = [
  { label: "Bike Service",   icon: Bike,        href: "/near-me?type=2-Wheeler", animated: false, price: "from ₹299", bg: "#EBF3FC", iconColor: "#0056b7" },
  { label: "Car Service",    icon: Car,         href: "/near-me?type=4-Wheeler", animated: false, price: "from ₹499", bg: "#F0EEFF", iconColor: "#7C3AED" },
  { label: "Oil Change",     icon: DropletIcon, href: "/near-me?q=oil+change",   animated: true,  price: "from ₹349", bg: "#E0F7FA", iconColor: "#0097A7" },
  { label: "Tyre Repair",    icon: GaugeIcon,   href: "/near-me?q=tyre",         animated: true,  price: "from ₹199", bg: "#f3f3f8", iconColor: "#424656" },
  { label: "Battery Jump",   icon: ZapIcon,     href: "/near-me?q=battery",      animated: true,  price: "from ₹249", bg: "#FFFBEB", iconColor: "#D97706" },
  { label: "Towing",         icon: TruckIcon,   href: "/near-me?q=towing",       animated: true,  price: "from ₹599", bg: "#FFF1F2", iconColor: "#E11D48" },
  { label: "AC Repair",      icon: WindIcon,    href: "/near-me?q=ac+repair",    animated: true,  price: "from ₹799", bg: "#ECFDF5", iconColor: "#059669" },
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
      className="flex shrink-0 items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-[transform,background-color,box-shadow] duration-150 hover:brightness-110 hover:scale-[1.03] active:scale-[0.97] min-h-[44px]"
      style={{ backgroundColor: "#0056b7" }}
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
          isSaved ? "fill-red-500 text-red-500" : "text-[#c2c6d8] hover:text-red-400"
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
  const [activeService,      setActiveService]      = useState(0);
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
    const doGeoLookup = () => {
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
    };
    // Only auto-detect if user has already granted permission — avoids
    // Chrome showing its own permission dialog before the app's LocationPopup.
    if (navigator.geolocation) {
      navigator.permissions?.query({ name: "geolocation" }).then((result) => {
        if (result.state === "granted") doGeoLookup();
      }).catch(() => {});
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
    <div className="min-h-screen" style={{ backgroundColor: "#f9f9fe" }}>
      <Header />
      {showLocationPopup && <LocationPopup onClose={() => setShowLocationPopup(false)} />}

      <main style={{ paddingTop: 64 }} className="mx-auto max-w-screen-xl px-4 md:px-6 pb-32">

        {/* ── HERO SECTION ── */}
        <section className="pt-8 pb-6">

          {/* Mobile greeting (hidden on md+) */}
          <div className="md:hidden flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#424656]">
                {getGreeting()}
              </p>
              <p className="text-base font-bold text-[#1a1c1f] mt-0.5">
                {user?.user_metadata?.full_name?.split(" ")[0] || "Welcome back"}
              </p>
            </div>
            <Link href="/profile" aria-label="View profile">
              <div
                className="flex items-center justify-center rounded-full shrink-0"
                style={{ width: 40, height: 40, backgroundColor: "#0056b7" }}
              >
                <span className="text-white font-bold text-base leading-none">
                  {(user?.user_metadata?.full_name || user?.email || "G")[0].toUpperCase()}
                </span>
              </div>
            </Link>
          </div>

          {/* Open count pill */}
          {openCount !== null && (
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex" style={{ width: 8, height: 8, flexShrink: 0 }}>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full bg-green-500" style={{ width: 8, height: 8 }} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#424656]">
                {openCount} garages open now
              </span>
            </div>
          )}

          {/* Editorial heading */}
          <h1 className="text-[3rem] md:text-[3.5rem] font-bold tracking-tight text-[#1a1c1f] leading-[1.1] mb-6">
            Find Your<br /><span style={{ color: "#0056b7" }}>Mechanic.</span>
          </h1>

          {/* Search bar */}
          <form onSubmit={handleSearch} aria-label="Search garages">
            <div
              className="bg-white rounded-2xl flex items-center gap-3 px-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[#c2c6d8]/10"
              style={{ minHeight: 52 }}
            >
              <SearchIcon size={16} style={{ color: "#424656", flexShrink: 0 }} aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tyre repair, oil change, AC…"
                aria-label="Search garages"
                inputMode="search"
                style={{ flex: 1, background: "transparent", fontSize: 16, color: "#1a1c1f", outline: "none", border: "none", padding: "14px 0" }}
              />
              {search.trim() && (
                <button
                  type="submit"
                  className="rounded-xl px-4 py-2 text-sm font-bold text-white shrink-0 min-h-[36px] transition-[filter] duration-150 hover:brightness-110 active:scale-95"
                  style={{ backgroundColor: "#0056b7" }}
                >
                  Search
                </button>
              )}
            </div>
          </form>

          {/* Detect location button */}
          {!userArea && (
            <button
              type="button"
              onClick={() => setShowLocationPopup(true)}
              className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#0056b7] hover:opacity-80 transition-opacity active:scale-95"
            >
              <MapPinIcon size={14} />
              Detect my location
            </button>
          )}
          {userArea && (
            <button
              type="button"
              onClick={() => setShowLocationPopup(true)}
              className="mt-3 flex items-center gap-2 text-sm text-[#424656] hover:text-[#0056b7] transition-colors"
            >
              <MapPinIcon size={14} style={{ color: "#0056b7" }} />
              <span>{userArea}</span>
            </button>
          )}

          {/* Trust badges row */}
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { icon: <ShieldCheckIcon size={13} />, label: "Verified Experts" },
              { icon: <CircleCheckIcon size={13} />, label: "Fixed Pricing" },
              { icon: <ClockIcon size={13} />, label: "15-min Response" },
            ].map(({ icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
                style={{ backgroundColor: "#d8e2ff", color: "#0056b7" }}
              >
                {icon}
                {label}
              </span>
            ))}
          </div>
        </section>

        {/* ── LAST BOOKING "Book Again" subtle card ── */}
        {!lastBookingLoading && lastBooking && lastBooking.status === "completed" && (
          <section className="mb-8">
            <Link href={`/garage/${lastBooking.garage_id}`} aria-label={`Book again at ${lastBooking.garage_name}`}>
              <div
                className="bg-white rounded-3xl p-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[#c2c6d8]/10 flex items-center gap-4 transition-[transform] duration-150 hover:-translate-y-0.5 active:scale-[0.99]"
              >
                <div
                  className="flex items-center justify-center rounded-2xl shrink-0"
                  style={{ width: 44, height: 44, backgroundColor: "#d8e2ff" }}
                >
                  <RotateCcwIcon size={18} style={{ color: "#0056b7" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#424656]">Book Again</p>
                  <p className="text-sm font-bold text-[#1a1c1f] truncate mt-0.5">
                    {lastBooking.service_name} at {lastBooking.garage_name}
                  </p>
                  {serviceDue && (
                    <p className="text-xs text-[#ba1a1a] mt-0.5 font-semibold">Service overdue — {daysAgo} days ago</p>
                  )}
                </div>
                <ChevronRightIcon size={16} style={{ color: "#424656", flexShrink: 0 }} />
              </div>
            </Link>
          </section>
        )}

        {/* ── VEHICLE CATEGORIES — horizontal scroll ── */}
        <section className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide mb-8">
          <div className="flex gap-3" style={{ width: "max-content" }}>
            {SERVICES.map(({ label, icon: Icon, href, animated, price, bg, iconColor }, idx) => (
              <Link key={label} href={href} aria-label={`${label} — ${price}`}>
                <div
                  onClick={() => setActiveService(idx)}
                  className="w-36 shrink-0 rounded-2xl p-4 flex flex-col items-center gap-2 transition-[transform] duration-150 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                  style={
                    activeService === idx
                      ? { backgroundColor: "#0056b7", border: "1px solid transparent" }
                      : { backgroundColor: "#ffffff", border: "1px solid rgba(194,198,216,0.10)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }
                  }
                >
                  <div
                    className="flex items-center justify-center rounded-xl shrink-0"
                    style={{
                      width: 44, height: 44,
                      backgroundColor: activeService === idx ? "rgba(255,255,255,0.15)" : bg,
                    }}
                  >
                    {animated
                      ? <Icon size={22} style={{ color: activeService === idx ? "#ffffff" : iconColor }} />
                      : <Icon style={{ width: 22, height: 22, color: activeService === idx ? "#ffffff" : iconColor }} />}
                  </div>
                  <p
                    className="text-xs font-bold text-center leading-tight"
                    style={{ color: activeService === idx ? "#ffffff" : "#1a1c1f" }}
                  >
                    {label}
                  </p>
                  <p
                    className="text-[10px] text-center"
                    style={{ color: activeService === idx ? "rgba(255,255,255,0.75)" : "#424656" }}
                  >
                    {price}
                  </p>
                </div>
              </Link>
            ))}
            {/* See All tile */}
            <Link href="/near-me" aria-label="See all services">
              <div
                className="w-36 shrink-0 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-[filter] duration-150 hover:brightness-110 active:scale-95 cursor-pointer"
                style={{ backgroundColor: "#d8e2ff", border: "1px solid transparent", minHeight: 110 }}
              >
                <ChevronRightIcon size={22} style={{ color: "#0056b7" }} aria-hidden="true" />
                <p className="text-xs font-bold text-[#0056b7] text-center">See All</p>
              </div>
            </Link>
          </div>
        </section>

        {/* ── HOW CAN WE HELP — bento grid ── */}
        <section className="mb-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#1a1c1f]">How can we help?</h2>
              <p className="text-sm text-[#424656] mt-1">Professional care for every need</p>
            </div>
            <Link href="/near-me" className="text-sm font-bold" style={{ color: "#0056b7" }}>
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Large feature card */}
            <Link
              href="/near-me"
              className="col-span-2 rounded-3xl overflow-hidden relative min-h-[160px] flex items-end p-6 shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-[transform] duration-150 hover:-translate-y-0.5 active:scale-[0.99]"
              style={{ backgroundColor: "#0056b7" }}
              aria-label="Find garages near you"
            >
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#d8e2ff] mb-1">Nearby</p>
                <p className="text-xl font-bold text-white leading-tight">Find garages<br />near you</p>
              </div>
              <div className="absolute top-4 right-4 opacity-20">
                <MapPinIcon size={64} style={{ color: "#ffffff" }} />
              </div>
            </Link>

            {/* Smaller service cards */}
            {[
              { label: "Oil Change",  icon: DropletIcon, href: "/near-me?q=oil+change",  animated: true,  bg: "#E0F7FA", iconColor: "#0097A7" },
              { label: "Tyre Repair", icon: GaugeIcon,   href: "/near-me?q=tyre",        animated: true,  bg: "#f3f3f8", iconColor: "#424656" },
            ].map(({ label, icon: Icon, href, animated, bg, iconColor }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className="bg-white rounded-3xl p-5 flex flex-col gap-3 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[#c2c6d8]/10 transition-[transform] duration-150 hover:-translate-y-0.5 active:scale-[0.99]"
              >
                <div
                  className="flex items-center justify-center rounded-2xl"
                  style={{ width: 44, height: 44, backgroundColor: bg }}
                >
                  {animated
                    ? <Icon size={22} style={{ color: iconColor }} />
                    : <Icon style={{ width: 22, height: 22, color: iconColor }} />}
                </div>
                <p className="text-sm font-bold text-[#1a1c1f]">{label}</p>
                <ChevronRightIcon size={14} style={{ color: "#424656" }} />
              </Link>
            ))}
          </div>
        </section>

        {/* ── SOS SECTION ── */}
        <section className="mb-8 rounded-3xl p-6" style={{ backgroundColor: "#ffdad6", border: "1px solid rgba(186,26,26,0.1)" }}>
          <Link href="/sos" aria-label="SOS — 24/7 roadside assistance" className="block">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: "#ba1a1a" }}>
                  Emergency
                </p>
                <h2 className="text-2xl font-bold tracking-tight leading-tight" style={{ color: "#1a1c1f" }}>
                  SOS Help — 24/7
                </h2>
                <p className="text-sm mt-2" style={{ color: "#424656" }}>
                  Instant roadside assistance, wherever you are.
                </p>
              </div>
              <div
                className="flex items-center justify-center rounded-full shrink-0 transition-[transform] duration-150 hover:scale-105"
                style={{ width: 52, height: 52, backgroundColor: "#ba1a1a" }}
              >
                <ChevronRightIcon size={22} style={{ color: "#ffffff" }} aria-hidden="true" />
              </div>
            </div>
          </Link>
        </section>

        {/* ── GARAGES NEAR YOU ── */}
        <section className="mb-8" aria-labelledby="garages-heading">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 id="garages-heading" className="text-2xl font-bold tracking-tight text-[#1a1c1f]">
                {isPersonalized ? "Recommended for You" : userCoords ? "Garages near you" : "Top Rated"}
              </h2>
              {userArea && (
                <p className="text-sm text-[#424656] mt-1">In {userArea}</p>
              )}
            </div>
            <Link href="/near-me" className="text-sm font-bold" style={{ color: "#0056b7" }}>
              View all
            </Link>
          </div>

          {garagesLoading ? (
            <Skeleton.GarageList count={3} />
          ) : personalizedGarages.length === 0 ? (
            <EmptyState preset="near-me" />
          ) : (
            <div className="flex flex-col gap-3">
              {personalizedGarages.map((garage, i) => (
                <Link key={garage.id} href={`/garage/${garage.id}`} aria-label={`Book ${garage.name}`}>
                  <div
                    className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#c2c6d8]/10 transition-[transform] duration-150 hover:-translate-y-0.5 active:scale-[0.99]"
                  >
                    {/* Garage photo */}
                    <div className="relative shrink-0 rounded-xl overflow-hidden" style={{ width: 68, height: 68 }}>
                      <Image
                        src={garage.image || "/placeholder-garage.svg"}
                        alt={`${garage.name} garage`}
                        fill
                        priority={i === 0}
                        className="object-cover"
                        sizes="68px"
                      />
                      {garage.isOpen && (
                        <span
                          aria-label="Open now"
                          className="absolute bottom-1 right-1 rounded-full border-2 border-white"
                          style={{ width: 8, height: 8, backgroundColor: "#22C55E" }}
                        />
                      )}
                    </div>

                    {/* Garage info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-[#1a1c1f] truncate">{garage.name}</p>
                        {garage.verified && (
                          <CircleCheckIcon size={13} style={{ color: "#0056b7", flexShrink: 0 }} aria-label="Verified" />
                        )}
                      </div>

                      {/* Trust badge pills */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {garage.verified && (
                          <span className="text-[10px] font-bold rounded-full px-2 py-0.5" style={{ color: "#0056b7", backgroundColor: "#d8e2ff" }}>
                            Verified
                          </span>
                        )}
                        <span className="text-[10px] font-bold rounded-full px-2 py-0.5" style={{ color: "#16A34A", backgroundColor: "#F0FDF4" }}>
                          Fixed Price
                        </span>
                      </div>

                      {/* Rating + distance + type */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center gap-1">
                          <Star style={{ width: 11, height: 11, fill: "#F59E0B", color: "#F59E0B" }} aria-hidden="true" />
                          <span className="text-xs font-bold text-[#1a1c1f]">{garage.rating}</span>
                          <span className="text-xs text-[#424656]">({garage.reviews})</span>
                        </div>
                        {garage.distance && <span className="text-xs text-[#424656]">{garage.distance}</span>}
                        {garage.type && <span className="text-xs text-[#424656]">{garage.type}</span>}
                      </div>
                    </div>

                    {/* Right: open badge + Book CTA + Save */}
                    <div className="flex flex-col items-end justify-between shrink-0 gap-2 self-stretch">
                      <span
                        className="text-[10px] font-bold rounded-full px-2 py-0.5"
                        style={{
                          backgroundColor: garage.isOpen ? "#F0FDF4" : "#f3f3f8",
                          color: garage.isOpen ? "#16A34A" : "#424656",
                        }}
                      >
                        {garage.isOpen ? "Open" : "Closed"}
                      </span>
                      <div className="flex items-center gap-2">
                        <SaveButton
                          garageId={garage.id}
                          isSaved={savedIds.has(garage.id)}
                          isBursting={heartBurst === garage.id}
                          onToggle={toggleSave}
                        />
                        <button
                          onClick={(e) => { e.preventDefault(); router.push(`/garage/${garage.id}`); }}
                          className="rounded-xl px-4 py-1.5 text-xs font-bold text-white min-h-[32px] transition-[filter] duration-150 hover:brightness-110 active:scale-95"
                          style={{ backgroundColor: "#0056b7" }}
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── TRUST STATS ── */}
        <section className="mb-8">
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 500, suffix: "+", label: "Partner Garages" },
              { value: 10000, suffix: "+", label: "Happy Customers" },
              { value: 15, suffix: " min", label: "Avg. Response" },
            ].map(({ value, suffix, label }) => (
              <div
                key={label}
                className="rounded-2xl bg-white p-4 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#c2c6d8]/10"
              >
                <p className="text-2xl font-black text-[#0056b7]">
                  <NumberTicker value={value} suffix={suffix} />
                </p>
                <p className="mt-1 text-[11px] font-semibold text-[#424656] leading-snug">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FIRST SERVICE FREE PROMO ── */}
        <section className="mb-8">
          <div
            className="relative overflow-hidden rounded-3xl p-6"
            style={{ background: "linear-gradient(135deg, #0056b7 0%, #1a6fd4 100%)" }}
          >
            {/* Decorative circles */}
            <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="pointer-events-none absolute -bottom-4 right-12 h-20 w-20 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />

            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <span className="inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-3" style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }}>
                  Limited Offer
                </span>
                <h2 className="text-xl font-black text-white leading-tight mb-1">
                  First Service<br />Inspection Free
                </h2>
                <p className="text-sm text-white/70">Book your first service and get a free vehicle health check.</p>
              </div>
              <Link
                href="/near-me"
                className="shrink-0 flex items-center gap-1.5 rounded-2xl px-5 py-3 text-sm font-bold transition-[filter] duration-150 hover:brightness-110 active:scale-95"
                style={{ backgroundColor: "#ffffff", color: "#0056b7" }}
              >
                Book Now
                <ArrowRightIcon size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOR GARAGE OWNERS ── */}
        <section className="mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[#c2c6d8]/10">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#424656] mb-2">For Garage Owners</p>
            <h2 className="text-2xl font-bold tracking-tight text-[#1a1c1f] mb-1">List Your Garage</h2>
            <p className="text-sm text-[#424656] mb-5">Zero listing fee. Reach thousands of customers. Get real-time SOS job requests.</p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { value: "₹0", label: "Listing Fee" },
                { value: "10k+", label: "Customers" },
                { value: "24/7", label: "SOS Jobs" },
              ].map(({ value, label }) => (
                <div key={label} className="rounded-2xl p-3 text-center" style={{ backgroundColor: "#f3f3f8" }}>
                  <p className="text-lg font-black text-[#0056b7]">{value}</p>
                  <p className="text-[11px] font-semibold text-[#424656] mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <Link
              href="/partner"
              className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition-[filter] duration-150 hover:brightness-110 active:scale-95"
              style={{ backgroundColor: "#0056b7" }}
            >
              <WrenchIcon size={15} />
              Join as Partner — It&apos;s Free
            </Link>
          </div>
        </section>


      </main>
    </div>
  );
}
