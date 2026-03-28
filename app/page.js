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
  { label: "Bike Service",   icon: Bike,        href: "/near-me?type=2-Wheeler", animated: false, bg: "#d8e2ff", iconColor: "#0056b7" },
  { label: "Car Service",    icon: Car,         href: "/near-me?type=4-Wheeler", animated: false, bg: "#e2dfff", iconColor: "#4c4aca" },
  { label: "Oil Change",     icon: DropletIcon, href: "/near-me?q=oil+change",   animated: true,  bg: "#d8e2ff", iconColor: "#0056b7" },
  { label: "Tyre Repair",    icon: GaugeIcon,   href: "/near-me?q=tyre",         animated: true,  bg: "#e8e8f0", iconColor: "#424656" },
  { label: "Battery Jump",   icon: ZapIcon,     href: "/near-me?q=battery",      animated: true,  bg: "#ffdbd0", iconColor: "#a33200" },
  { label: "Towing",         icon: TruckIcon,   href: "/near-me?q=towing",       animated: true,  bg: "#ffdad6", iconColor: "#ba1a1a" },
  { label: "AC Repair",      icon: WindIcon,    href: "/near-me?q=ac+repair",    animated: true,  bg: "#e2dfff", iconColor: "#4c4aca" },
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
  const [userCoords,         setUserCoords]         = useState(
    location?.lat && location?.lng ? [location.lat, location.lng] : null
  );
  const [userArea, setUserArea] = useState(location?.area || null);
  const [showPromoBanner, setShowPromoBanner] = useState(false);
  useEffect(() => {
    if (!sessionStorage.getItem("gd_promo_dismissed")) setShowPromoBanner(true);
  }, []);

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

      {/* ── PROMO BANNER ── */}
      {showPromoBanner && (
        <div
          className="fixed top-[60px] inset-x-0 z-40 flex items-center justify-between gap-3 px-4 py-2.5"
          style={{ background: "linear-gradient(90deg, #0056b7 0%, #006de6 100%)" }}
          role="banner"
          aria-label="Promotion: Free first service inspection"
        >
          <p className="text-xs font-semibold text-white truncate">
            🎉 <strong>First service inspection free</strong> — Book now & save ₹499
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/near-me"
              className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-[#0056b7] transition-opacity hover:opacity-90 active:scale-95"
            >
              Book
            </Link>
            <button
              type="button"
              aria-label="Dismiss promotion"
              onClick={() => {
                sessionStorage.setItem("gd_promo_dismissed", "1");
                setShowPromoBanner(false);
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      {showLocationPopup && <LocationPopup onClose={() => setShowLocationPopup(false)} />}

      <main
        style={{ paddingTop: showPromoBanner ? 104 : 64, transition: "padding-top 0.2s ease" }}
        className="mx-auto max-w-screen-xl px-4 md:px-6 pb-32 md:pb-8"
      >

        {/* ── HERO SECTION ── */}
        <section className="pt-8 pb-6">

          {/* Mobile greeting (hidden on md+) */}
          <div className="md:hidden mb-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#727687]">
              {getGreeting()}
            </p>
            <p className="text-lg font-bold text-[#1a1c1f] mt-1 tracking-tight">
              {user?.user_metadata?.full_name?.split(" ")[0] || (user ? "Welcome back" : "Hello")}
            </p>
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
          <h1 className="text-[3rem] md:text-[3.75rem] font-black tracking-[-0.03em] text-[#1a1c1f] leading-[1.05] mb-7">
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
          <div className="mt-6 flex flex-wrap gap-2">
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
                className="bg-white rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.05)] border border-[#c2c6d8]/10 flex items-center gap-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] active:scale-[0.99]"
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

        {/* ── HOW CAN WE HELP — service tiles ── */}
        <section className="mb-12">
          <div className="flex justify-between items-end mb-5">
            <div>
              <h2 className="text-3xl font-bold tracking-[-0.02em] text-[#1a1c1f]">How can we help?</h2>
              <p className="text-sm text-[#727687] mt-1.5">Professional care for every need</p>
            </div>
            <Link href="/near-me" className="text-sm font-bold" style={{ color: "#0056b7" }}>
              View all
            </Link>
          </div>
          {/* Mobile: horizontal scroll */}
          <div className="md:hidden overflow-x-auto -mx-4 px-4 scrollbar-hide">
            <div className="flex gap-3" style={{ width: "max-content" }}>
              {SERVICES.map(({ label, icon: Icon, href, animated, bg, iconColor }) => (
                <Link key={label} href={href} aria-label={label}>
                  <div
                    className="shrink-0 rounded-2xl flex flex-col items-center justify-center gap-2.5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,86,183,0.10)] active:scale-95 cursor-pointer"
                    style={{ width: 112, height: 120, backgroundColor: "#ffffff", border: "1px solid rgba(194,198,216,0.10)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                  >
                    <div className="flex items-center justify-center rounded-2xl shrink-0" style={{ width: 56, height: 56, backgroundColor: bg }}>
                      {animated ? <Icon size={26} style={{ color: iconColor }} /> : <Icon style={{ width: 26, height: 26, color: iconColor }} />}
                    </div>
                    <p className="text-[12px] font-bold text-center leading-tight text-[#1a1c1f] px-2">{label}</p>
                  </div>
                </Link>
              ))}
              <Link href="/near-me" aria-label="See all services">
                <div className="shrink-0 rounded-2xl flex flex-col items-center justify-center gap-2.5 transition-[filter] duration-200 hover:brightness-110 active:scale-95 cursor-pointer"
                  style={{ width: 112, height: 120, backgroundColor: "#d8e2ff", border: "1px solid transparent" }}>
                  <ChevronRightIcon size={26} style={{ color: "#0056b7" }} aria-hidden="true" />
                  <p className="text-[12px] font-bold text-[#0056b7] text-center">See All</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Desktop: full-width grid */}
          <div className="hidden md:grid grid-cols-8 gap-3">
            {SERVICES.map(({ label, icon: Icon, href, animated, bg, iconColor }) => (
              <Link key={label} href={href} aria-label={label} className="flex">
                <div
                  className="flex-1 rounded-2xl flex flex-col items-center justify-center gap-3 py-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,86,183,0.12)] active:scale-95 cursor-pointer"
                  style={{ backgroundColor: "#ffffff", border: "1px solid rgba(194,198,216,0.10)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                >
                  <div className="flex items-center justify-center rounded-2xl shrink-0" style={{ width: 56, height: 56, backgroundColor: bg }}>
                    {animated ? <Icon size={26} style={{ color: iconColor }} /> : <Icon style={{ width: 26, height: 26, color: iconColor }} />}
                  </div>
                  <p className="text-[13px] font-bold text-center leading-tight text-[#1a1c1f] px-2">{label}</p>
                </div>
              </Link>
            ))}
            <Link href="/near-me" aria-label="See all services" className="flex">
              <div className="flex-1 rounded-2xl flex flex-col items-center justify-center gap-3 py-5 transition-[filter] duration-200 hover:brightness-105 active:scale-95 cursor-pointer"
                style={{ backgroundColor: "#d8e2ff", border: "1px solid transparent" }}>
                <ChevronRightIcon size={26} style={{ color: "#0056b7" }} aria-hidden="true" />
                <p className="text-[13px] font-bold text-[#0056b7] text-center">See All</p>
              </div>
            </Link>
          </div>
        </section>


        {/* ── GARAGES NEAR YOU ── */}
        <section className="mb-12" aria-labelledby="garages-heading">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 id="garages-heading" className="text-3xl font-bold tracking-[-0.02em] text-[#1a1c1f]">
                {isPersonalized ? "Recommended for You" : userCoords ? "Garages near you" : "Top Rated"}
              </h2>
              {userArea && (
                <p className="text-sm text-[#727687] mt-1.5">In {userArea}</p>
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
                    className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-[#c2c6d8]/10 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] active:scale-[0.99]"
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
                        <span className="text-[10px] font-bold rounded-full px-2 py-0.5" style={{ color: "#0056b7", backgroundColor: "#d8e2ff" }}>
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
                          backgroundColor: garage.isOpen ? "#d8e2ff" : "#f3f3f8",
                          color: garage.isOpen ? "#0056b7" : "#424656",
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
                          className="rounded-xl px-4 py-2 text-xs font-bold text-white min-h-[44px] transition-[filter] duration-150 hover:brightness-110 active:scale-95"
                          style={{ background: "linear-gradient(to bottom, #0056b7, #006de6)" }}
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

        {/* ── SOS EMERGENCY ENTRY ── */}
        <section className="mb-12">
          <Link href="/sos" aria-label="SOS Emergency Roadside Help">
            <div className="relative overflow-hidden rounded-3xl p-5 flex items-center gap-4 shadow-[0_8px_32px_rgba(186,26,26,0.22)] active:scale-[0.99] transition-[transform,box-shadow] duration-200 hover:shadow-[0_12px_40px_rgba(186,26,26,0.28)]"
              style={{ background: "linear-gradient(135deg, #ba1a1a 0%, #c62828 100%)" }}
            >
              <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.18)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="white"/>
                  <line x1="12" y1="9" x2="12" y2="13" stroke="#ba1a1a" strokeWidth="2.5"/>
                  <circle cx="12" cy="17" r="1" fill="#ba1a1a" stroke="none"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/70 mb-0.5">24/7 Roadside Help</p>
                <p className="text-base font-black text-white leading-tight">Vehicle breakdown? Tap SOS</p>
                <p className="text-xs text-white/70 mt-0.5">Mechanic reaches you in ~15 min</p>
              </div>
              <div className="flex items-center gap-1 shrink-0 rounded-full px-3 py-1.5 text-xs font-bold" style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "#fff" }}>
                SOS
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </div>
          </Link>
        </section>

        {/* ── FIRST SERVICE FREE PROMO ── */}
        <section className="mb-12">
          <div
            className="relative overflow-hidden rounded-3xl p-6"
            style={{ background: "linear-gradient(135deg, #0056b7 0%, #006de6 100%)" }}
          >
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
        <section className="mb-4">
          <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[#c2c6d8]/10">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#727687] mb-2">For Garage Owners</p>
            <h2 className="text-3xl font-bold tracking-[-0.02em] text-[#1a1c1f] mb-2">List Your Garage</h2>
            <p className="text-sm text-[#727687] leading-relaxed mb-6">Zero listing fee. Reach thousands of customers. Get real-time SOS job requests.</p>

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
              style={{ background: "linear-gradient(to bottom, #0056b7, #006de6)" }}
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
