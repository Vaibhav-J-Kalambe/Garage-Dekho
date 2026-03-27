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
  { label: "Bike Service",   icon: Bike,        href: "/near-me?type=2-Wheeler", animated: false, price: "from ₹299", bg: "#EBF3FC", iconColor: "#1A6FD4" },
  { label: "Car Service",    icon: Car,         href: "/near-me?type=4-Wheeler", animated: false, price: "from ₹499", bg: "#F0EEFF", iconColor: "#7C3AED" },
  { label: "Oil Change",     icon: DropletIcon, href: "/near-me?q=oil+change",   animated: true,  price: "from ₹349", bg: "#E0F7FA", iconColor: "#0097A7" },
  { label: "Tyre Repair",    icon: GaugeIcon,   href: "/near-me?q=tyre",         animated: true,  price: "from ₹199", bg: "#F3F4F6", iconColor: "#374151" },
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
      className="flex shrink-0 items-center gap-2 rounded-xl bg-amber-300 px-5 py-3 text-sm font-bold text-slate-900 shadow-none transition-[transform,background-color,box-shadow] duration-150 hover:bg-amber-400 hover:shadow-[0_4px_16px_rgba(245,158,11,0.4)] hover:scale-[1.03] active:scale-[0.97] min-h-[44px]"
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
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#F7F7F5", fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}
    >
      <Header />
      {showLocationPopup && <LocationPopup onClose={() => setShowLocationPopup(false)} />}

      {/* ── HERO AREA ── */}
      <div style={{ paddingTop: 64 }}>

        {/* Mobile greeting bar */}
        <div className="md:hidden" style={{ padding: "12px 20px 0" }}>
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#888888", margin: 0 }}>
                {getGreeting()}
              </p>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#1C1C1E", marginTop: 2, marginBottom: 0 }}>
                {user?.user_metadata?.full_name?.split(" ")[0] || "Welcome"}
              </p>
            </div>
            <Link href="/profile" aria-label="View profile">
              <div style={{ width: 38, height: 38, borderRadius: "50%", backgroundColor: "#1A6FD4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1 }}>
                  {(user?.user_metadata?.full_name || user?.email || "G")[0].toUpperCase()}
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Hero heading */}
        <div className="mx-auto max-w-5xl" style={{ padding: "20px 20px 0" }}>
          {openCount !== null && (
            <div className="flex items-center" style={{ gap: 6, marginBottom: 12 }}>
              <span className="relative flex" style={{ width: 8, height: 8, flexShrink: 0 }}>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full bg-green-500" style={{ width: 8, height: 8 }} />
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#888888" }}>{openCount} garages open now</span>
            </div>
          )}
          <h1 style={{ fontSize: 34, fontWeight: 700, color: "#1C1C1E", lineHeight: 1.2, margin: 0 }}>
            Find Your Garage.
          </h1>
          <p style={{ fontSize: 12, color: "#888888", marginTop: 8, marginBottom: 0 }}>
            Trusted · Verified · Fixed pricing
          </p>
        </div>

        {/* Search bar */}
        <div className="mx-auto max-w-5xl" style={{ padding: "14px 20px 0" }}>
          <form onSubmit={handleSearch} aria-label="Search garages">
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: 12, border: "0.5px solid #E0DFD8", padding: "0 14px", display: "flex", alignItems: "center", gap: 10, minHeight: 48 }}>
              <SearchIcon size={16} style={{ color: "#888888", flexShrink: 0 }} aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tyre repair, oil change, AC…"
                aria-label="Search garages"
                style={{ flex: 1, background: "transparent", fontSize: 15, color: "#1C1C1E", outline: "none", border: "none", padding: "14px 0" }}
              />
              {search.trim() && (
                <button
                  type="submit"
                  style={{ backgroundColor: "#1A6FD4", color: "#fff", fontSize: 13, fontWeight: 700, borderRadius: 8, padding: "6px 14px", border: "none", cursor: "pointer", flexShrink: 0, minHeight: 32 }}
                >
                  Search
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main
        className="mx-auto max-w-5xl"
        style={{ padding: "28px 20px", paddingBottom: "max(120px, calc(env(safe-area-inset-bottom) + 100px))" }}
      >

        {/* ── SERVICES GRID ── */}
        <section aria-labelledby="services-heading">
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <p id="services-heading" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#1C1C1E", margin: 0 }}>
              Services
            </p>
          </div>
          <div className="grid grid-cols-4" style={{ gap: 10 }}>
            {SERVICES.map(({ label, icon: Icon, href, animated, price, bg, iconColor }) => (
              <Link key={label} href={href} aria-label={`${label} — ${price}`}>
                <div
                  style={{ backgroundColor: "#FFFFFF", borderRadius: 12, border: "0.5px solid #E0DFD8", padding: "12px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}
                  className="transition-[transform] duration-150 hover:-translate-y-0.5 active:scale-95"
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {animated
                      ? <Icon size={20} style={{ color: iconColor }} />
                      : <Icon style={{ width: 20, height: 20, color: iconColor }} />}
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#1C1C1E", textAlign: "center", lineHeight: 1.3, margin: 0 }}>{label}</p>
                  <p style={{ fontSize: 10, color: "#888888", margin: 0, textAlign: "center" }}>{price}</p>
                </div>
              </Link>
            ))}
            {/* See All */}
            <Link href="/near-me" aria-label="See all services">
              <div
                style={{ backgroundColor: "#1A6FD4", borderRadius: 12, padding: "12px 6px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, minHeight: 90 }}
                className="transition-[filter] duration-150 hover:brightness-110 active:scale-95"
              >
                <ChevronRightIcon size={20} style={{ color: "#FFFFFF" }} aria-hidden="true" />
                <p style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", textAlign: "center", margin: 0 }}>See All</p>
              </div>
            </Link>
          </div>
        </section>

        {/* ── SOS BANNER ── */}
        <section style={{ marginTop: 20 }} aria-label="Roadside emergency SOS">
          <Link href="/sos" aria-label="SOS — 24/7 roadside assistance">
            <div
              style={{ backgroundColor: "#1C1C1E", borderRadius: 12, border: "0.5px solid #2A2A2C", padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}
              className="transition-[transform] duration-150 hover:-translate-y-0.5 active:scale-[0.99]"
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#FF4D2D", margin: 0 }}>
                  Emergency
                </p>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.25, margin: "5px 0 0" }}>
                  SOS Help — 24/7
                </p>
                <p style={{ fontSize: 12, color: "#888888", margin: "4px 0 0" }}>
                  Instant roadside assistance
                </p>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "#1A6FD4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ChevronRightIcon size={18} style={{ color: "#FFFFFF" }} aria-hidden="true" />
              </div>
            </div>
          </Link>
        </section>

        {/* ── TOP RATED GARAGES ── */}
        <section aria-labelledby="garages-heading" style={{ marginTop: 28 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <p id="garages-heading" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#1C1C1E", margin: 0 }}>
              {isPersonalized ? "Recommended for You" : userCoords ? "Nearby Garages" : "Top Rated"}
            </p>
            <Link href="/near-me" style={{ fontSize: 12, fontWeight: 600, color: "#1A6FD4", textDecoration: "none" }}>
              View all
            </Link>
          </div>

          {garagesLoading ? (
            <Skeleton.GarageList count={3} />
          ) : personalizedGarages.length === 0 ? (
            <EmptyState preset="near-me" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {personalizedGarages.map((garage, i) => (
                <Link key={garage.id} href={`/garage/${garage.id}`} aria-label={`Book ${garage.name}`}>
                  <div
                    style={{ backgroundColor: "#FFFFFF", borderRadius: 12, border: "0.5px solid #E0DFD8", padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}
                    className="transition-[transform] duration-150 hover:-translate-y-0.5 active:scale-[0.99]"
                  >
                    {/* Garage photo */}
                    <div className="relative" style={{ width: 68, height: 68, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
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
                          style={{ position: "absolute", bottom: 4, right: 4, width: 8, height: 8, borderRadius: "50%", border: "1.5px solid white", backgroundColor: "#22C55E" }}
                        />
                      )}
                    </div>

                    {/* Garage info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center" style={{ gap: 5 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1E", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {garage.name}
                        </p>
                        {garage.verified && (
                          <CircleCheckIcon size={13} style={{ color: "#1A6FD4", flexShrink: 0 }} aria-label="Verified" />
                        )}
                      </div>

                      {/* Trust badge pills */}
                      <div className="flex flex-wrap" style={{ gap: 4, marginTop: 5 }}>
                        {garage.verified && (
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#1A6FD4", backgroundColor: "#EBF3FC", borderRadius: 6, padding: "2px 7px", lineHeight: 1.5 }}>
                            Verified
                          </span>
                        )}
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#16A34A", backgroundColor: "#F0FDF4", borderRadius: 6, padding: "2px 7px", lineHeight: 1.5 }}>
                          Fixed Price
                        </span>
                      </div>

                      {/* Rating + distance + type */}
                      <div className="flex items-center" style={{ gap: 8, marginTop: 6 }}>
                        <div className="flex items-center" style={{ gap: 3 }}>
                          <Star style={{ width: 11, height: 11, fill: "#F59E0B", color: "#F59E0B" }} aria-hidden="true" />
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E" }}>{garage.rating}</span>
                          <span style={{ fontSize: 12, color: "#888888" }}>({garage.reviews})</span>
                        </div>
                        {garage.distance && <span style={{ fontSize: 12, color: "#888888" }}>{garage.distance}</span>}
                        {garage.type && <span style={{ fontSize: 12, color: "#888888" }}>{garage.type}</span>}
                      </div>
                    </div>

                    {/* Right: open badge + Book CTA */}
                    <div className="flex flex-col items-end justify-between" style={{ flexShrink: 0, gap: 8, alignSelf: "stretch" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, borderRadius: 6, padding: "2px 8px", lineHeight: 1.5,
                        backgroundColor: garage.isOpen ? "#F0FDF4" : "#F5F5F5",
                        color: garage.isOpen ? "#16A34A" : "#888888",
                      }}>
                        {garage.isOpen ? "Open" : "Closed"}
                      </span>
                      <button
                        onClick={(e) => { e.preventDefault(); router.push(`/garage/${garage.id}`); }}
                        style={{ backgroundColor: "#1A6FD4", color: "#FFFFFF", fontSize: 12, fontWeight: 700, borderRadius: 8, padding: "7px 16px", border: "none", cursor: "pointer", minHeight: 32 }}
                      >
                        Book
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: "0.5px solid #E0DFD8", paddingTop: 24, marginTop: 32 }} role="contentinfo">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1E", margin: 0 }}>GarageDekho</p>
              <p style={{ fontSize: 12, color: "#888888", marginTop: 6, lineHeight: 1.6, maxWidth: 280, marginBottom: 0 }}>
                Hyperlocal automotive services — find trusted garages, book instantly, get roadside help 24/7.
              </p>
            </div>
            <nav aria-label="Footer navigation" className="grid grid-cols-2" style={{ gap: "6px 40px" }}>
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
                  style={{ fontSize: 12, color: "#888888", fontWeight: 500 }}
                  className="transition-colors duration-150 hover:text-[#1A6FD4]"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <p style={{ fontSize: 11, color: "#888888", marginTop: 20, textAlign: "center" }}>
            © {new Date().getFullYear()} GarageDekho. All rights reserved.
          </p>
        </footer>

      </main>
    </div>
  );
}
