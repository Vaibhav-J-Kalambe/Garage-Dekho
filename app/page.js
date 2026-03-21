"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Wrench,
  Bike,
  Car,
  ShieldCheck,
  BadgeCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Truck,
  Wind,
  Gauge,
  ChevronRight,
  Droplets,
  RotateCcw,
  Tag,
  Search,
  Heart,
  Star,
} from "lucide-react";
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

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const SERVICES = [
  { label: "Bike Service",   icon: Bike,     color: "from-blue-500 to-indigo-500",  href: "/near-me?type=2-Wheeler"        },
  { label: "Car Service",    icon: Car,      color: "from-violet-500 to-purple-500", href: "/near-me?type=4-Wheeler"        },
  { label: "Oil Change",     icon: Droplets, color: "from-cyan-500 to-sky-500",      href: "/near-me?q=oil+change"          },
  { label: "Tyre Repair",    icon: Gauge,    color: "from-slate-500 to-slate-700",   href: "/near-me?q=tyre"                },
  { label: "Battery Jump",   icon: Zap,      color: "from-amber-500 to-orange-500",  href: "/near-me?q=battery"             },
  { label: "Towing",         icon: Truck,    color: "from-rose-500 to-red-500",      href: "/near-me?q=towing"              },
  { label: "AC Repair",      icon: Wind,     color: "from-teal-500 to-emerald-500",  href: "/near-me?q=ac+repair"           },
  { label: "General Repair", icon: Wrench,   color: "from-primary to-blue-400",      href: "/near-me"                       },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { location } = useLocation();
  const { showToast } = useToast();
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [topGarages,    setTopGarages]    = useState([]);
  const [garagesLoading, setGaragesLoading] = useState(true);
  const [search,        setSearch]        = useState("");
  const [lastBooking,   setLastBooking]   = useState(null);
  const [lastBookingLoading, setLastBookingLoading] = useState(true);
  const [openCount,     setOpenCount]     = useState(null);
  const [savedIds,      setSavedIds]      = useState(new Set());
  const [heartBurst,    setHeartBurst]    = useState(null);
  const [userCoords,    setUserCoords]    = useState(
    location?.lat && location?.lng ? [location.lat, location.lng] : null
  );
  const [userArea,      setUserArea]      = useState(location?.area || null);

  // Keep userCoords/userArea in sync whenever context location changes
  // (e.g. user picks a city from LocationPopup)
  useEffect(() => {
    if (location?.lat && location?.lng) {
      setUserCoords([location.lat, location.lng]);
    }
    if (location?.area) {
      setUserArea(location.area);
    }
  }, [location]);

  useEffect(() => {
    // Show location popup on first visit if no location saved
    const saved = localStorage.getItem("gd_location");
    if (!saved) setShowLocationPopup(true);

    // 5-minute sessionStorage cache — skip Supabase on repeat visits
    const CACHE_KEY = "gd_garages_v1";
    const CACHE_TTL = 5 * 60 * 1000;
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts < CACHE_TTL) {
          setTopGarages(data);
          setGaragesLoading(false);
          return; // skip fetch
        }
      }
    } catch { /* ignore storage errors */ }

    getAllGarages()
      .then((data) => {
        setTopGarages(data);
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
      })
      .catch(console.error)
      .finally(() => setGaragesLoading(false));
    getOpenGarageCount().then(setOpenCount);
    // Silent location detection — no alert on deny
    const alreadyHasArea = !!location?.area;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          setUserCoords([coords.latitude, coords.longitude]);
          if (alreadyHasArea) return; // skip geocode if area already known
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=12`,
              { headers: { "Accept-Language": "en" } }
            );
            const data = await res.json();
            const a = data.address ?? {};
            const area = a.suburb || a.neighbourhood || a.city_district || a.town || a.city || null;
            if (area) setUserArea(area);
          } catch { /* ignore */ }
        },
        () => {}, // silently ignore denial
        { timeout: 8000, maximumAge: 300000 }
      );
    }
  }, []);

  useEffect(() => {
    if (!user) { setLastBooking(null); setSavedIds(new Set()); setLastBookingLoading(false); return; }
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
      // revert on failure
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

  // Compute real distances, filter by radius when location known, sort nearest first
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
      // Show garages within radius; fallback to nearest 3 if none found nearby
      const nearby = mapped.filter((g) => g._km <= NEARBY_RADIUS_KM);
      return (nearby.length >= 1 ? nearby : mapped.slice(0, 3)).slice(0, 6);
    }
    // No location: show top 6 by rating
    return [...mapped].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6);
  }, [topGarages, userCoords]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />
      {showLocationPopup && <LocationPopup onClose={() => setShowLocationPopup(false)} />}

      {/* ── HERO BAND ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0047BE] via-[#0056D2] to-[#3730A3] px-4 pb-16 pt-6 md:px-8 md:pb-20 md:pt-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/[0.07]" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-white/[0.05]" />
        <div className="pointer-events-none absolute right-1/4 top-6 h-24 w-24 rounded-full bg-amber-400/10" />

        <div className="mx-auto flex max-w-5xl flex-col gap-5 md:flex-row md:items-center md:gap-10">
          <div className="space-y-2 md:flex-1 animate-slide-up">
            <p className="flex items-center gap-2 text-sm text-blue-200">
              {getGreeting()} —{" "}
              {openCount !== null && (
                <span className="flex items-center gap-1.5 font-semibold text-green-300">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                  </span>
                  {openCount} open now
                </span>
              )}
            </p>
            <h1 className="text-[2.5rem] font-black leading-tight tracking-tight text-white">
              Find Your<br />
              <span className="text-amber-300">Mechanic!</span>
            </h1>
            <p className="text-sm text-blue-100/80">Trusted garages · Verified experts · Fixed prices</p>
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-3 md:flex-1 animate-slide-up delay-75">
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-3.5 backdrop-blur-sm transition focus-within:bg-white/25">
              <Search className="h-4 w-4 shrink-0 text-white/70" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search garage or service…"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/60 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              aria-label="Search"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-lg transition hover:bg-blue-50 active:scale-95"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>
        </div>
      </section>

      {/* ── CONTENT — pulled up over hero ── */}
      <div className="relative -mt-6 rounded-t-3xl bg-[#F8FAFC]">
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 md:px-8 pb-28 md:pb-10 pt-5 md:pt-6">

        {/* ── Book Again + SOS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up delay-100">

          {/* Book Again — full width on mobile, half on desktop */}
          <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card transition hover:shadow-card-hover">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <RotateCcw className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              {lastBookingLoading ? (
                <div className="space-y-1.5">
                  <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
                </div>
              ) : lastBooking ? (
                <>
                  <p className="text-xs text-slate-500">Last visited</p>
                  <p className="truncate text-sm font-bold text-slate-900">
                    {lastBooking.garage_name} · {lastBooking.service_name}
                  </p>
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
              className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white shadow-glow-primary transition hover:brightness-110 active:scale-95"
            >
              {lastBooking ? "Book Again" : "Explore"}
            </Link>
          </div>

          {/* SOS card — desktop only; on mobile the bottom nav SOS button is always reachable */}
          <Link href="/sos" className="hidden md:block">
            <div className="flex h-full items-center gap-4 rounded-2xl bg-[#D32F2F] p-4 text-white shadow-sos transition hover:brightness-105 active:scale-[0.98]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-black leading-tight">Roadside Emergency?</p>
                <p className="mt-0.5 text-xs text-red-100">24/7 instant assistance, one tap away</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-white/60" />
            </div>
          </Link>

        </div>

        {/* ── Services ── */}
        <section className="animate-slide-up delay-150">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight text-slate-900">
              How can we help?
            </h2>
            <Link href="/near-me" className="text-xs font-semibold text-primary hover:underline">See All</Link>
          </div>

          <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
            {SERVICES.map(({ label, icon: Icon, color, href }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-card transition duration-300 group-hover:shadow-card-hover group-hover:-translate-y-1 group-active:scale-95`}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <span className="w-16 text-center text-xs font-semibold leading-tight text-slate-600 group-hover:text-primary transition">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Top Rated Garages ── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">
                {userCoords ? "Garages Near You" : "Top Rated Garages"}
              </h2>
              {userArea && (
                <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                  <MapPin className="h-3 w-3" /> {userArea}
                </p>
              )}
            </div>
            <Link href="/near-me" className="text-xs font-semibold text-primary hover:underline">View all</Link>
          </div>

          {garagesLoading ? (
            <Skeleton.GarageList count={3} />
          ) : garagesWithDist.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center rounded-2xl bg-white shadow-card">
              <Wrench className="h-10 w-10 text-slate-200" />
              <p className="mt-3 text-sm font-bold text-slate-700">No garages found nearby</p>
              <p className="mt-1 text-xs text-slate-500">Try changing your location or check back later.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
              {garagesWithDist.map((garage, i) => (
                <Link key={garage.id} href={`/garage/${garage.id}`} className="block animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <article className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99]">

                    {/* Photo */}
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                      <Image
                        src={garage.image || "/placeholder-garage.svg"}
                        alt={garage.name}
                        fill
                        priority={i === 0}
                        className={`object-cover transition duration-300 hover:scale-105 ${!garage.isOpen ? "opacity-70 grayscale-[25%]" : ""}`}
                        sizes="80px"
                      />
                      {garage.isOpen && (
                        <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <h3 className="truncate text-sm font-bold text-slate-900">{garage.name}</h3>
                        {garage.verified && (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">{garage.speciality}</p>
                      <div className="mt-2 flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-semibold text-slate-700">{garage.rating}</span>
                        <span className="text-[11px] text-slate-400">({garage.reviews} Reviews)</span>
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <button
                        type="button"
                        aria-label="Save garage"
                        className="transition active:scale-90"
                        onClick={(e) => toggleSave(e, garage.id)}
                      >
                        <Heart className={`h-4 w-4 transition ${savedIds.has(garage.id) ? "fill-red-500 text-red-500" : "text-slate-200 hover:text-red-400"} ${heartBurst === garage.id ? "animate-heart-burst" : ""}`} />
                      </button>
                      <span className="text-xs font-bold text-primary">{garage.distance}</span>
                      <span className={`text-[10px] font-semibold ${garage.isOpen ? "text-green-500" : "text-slate-400"}`}>
                        {garage.isOpen ? `Open · ${garage.waitTime}` : "Closed"}
                      </span>
                    </div>

                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Promo + Trust ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up delay-200">

          {/* Promo */}
          <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white shadow-promo">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Tag className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black leading-tight">First service free!</p>
              <p className="mt-0.5 text-xs text-amber-100">
                Free inspection on your first booking
              </p>
            </div>
            <Link href="/offers" className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-bold text-orange-600 transition hover:bg-white/90 active:scale-95">
              Claim
            </Link>
          </div>

          {/* Trust bar */}
          <section className="rounded-2xl bg-white p-4 shadow-card">
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              <div className="flex items-start gap-3 pr-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Fixed Pricing</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                    No hidden surprises.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 pl-4">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Verified Experts</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                    Quality-checked garages.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── List Your Garage Banner ── */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white md:col-span-2">
            {/* Decorative glow */}
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-24 w-24 rounded-full bg-amber-400/10 blur-xl" />

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <span className="inline-block rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary">For Garage Owners</span>
                <h3 className="mt-2 text-xl font-black leading-tight">Grow your business<br />with GarageDekho</h3>
                <p className="mt-1 text-xs text-slate-400">Zero listing fee · 10,000+ customers · Instant bookings</p>
                <Link href="/partner"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-primary px-5 py-2.5 text-xs font-black text-white shadow-glow-primary transition hover:brightness-110 active:scale-95">
                  List Your Garage <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Wrench illustration */}
              <div className="shrink-0 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5">
                <svg viewBox="0 0 64 64" className="h-12 w-12 opacity-80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="32" cy="32" r="30" fill="url(#garage-grad)" />
                  <path d="M38 14c-4.4 0-8 3.6-8 8 0 1.1.2 2.1.6 3L20 35.6 22.4 38l10.6-10.6c.9.4 1.9.6 3 .6 4.4 0 8-3.6 8-8 0-.7-.1-1.4-.3-2L40 21.7l-2.4 2.4-2-2 2.4-2.4-3.7 3.7c-.3-1-.5-2-.3-2.8.2-.8.6-1.4.6-1.4L38 14z" fill="#0056D2"/>
                  <rect x="18" y="38" width="6" height="12" rx="2" transform="rotate(-45 18 38)" fill="#60A5FA"/>
                  <defs>
                    <linearGradient id="garage-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#1e293b"/>
                      <stop offset="1" stopColor="#0f172a"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </section>

        </div>

      </main>
      </div>
    </div>
  );
}
