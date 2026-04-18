"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  Search, SlidersHorizontal, Star, CheckCircle2,
  Navigation, X, Bike, Car, Zap, Wrench,
  ChevronUp, ChevronDown, Loader2,
} from "lucide-react";
import Header from "../../components/Header";
import { getAllGarages } from "../../lib/garages";
import { useToast } from "../../context/ToastContext";
import EmptyState from "../../components/ui/EmptyState";

/* Load Leaflet map client-side only (no SSR) */
const MapView = dynamic(() => import("../../components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#f3f3f8]">
      <Loader2 className="h-8 w-8 animate-spin text-[#0056b7]" />
    </div>
  ),
});

const DISTANCE_FILTERS = ["All", "< 1 km", "< 2 km", "< 5 km"];
const TYPE_FILTERS = [
  { label: "All",  value: "all",       icon: Wrench },
  { label: "Car",  value: "4-Wheeler", icon: Car    },
  { label: "Bike", value: "2-Wheeler", icon: Bike   },
  { label: "EV",   value: "EV",        icon: Zap    },
];

/* ── Haversine distance in km ── */
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

/* ── Detect Pune neighbourhood from coords ── */
function getPuneNeighbourhood(lat, lng) {
  if (lat >= 18.52 && lat <= 18.55 && lng >= 73.88 && lng <= 73.91) return "Koregaon Park";
  if (lat >= 18.52 && lat <= 18.54 && lng >= 73.86 && lng <= 73.89) return "Shivaji Nagar";
  if (lat >= 18.55 && lat <= 18.58 && lng >= 73.77 && lng <= 73.81) return "Baner";
  if (lat >= 18.51 && lat <= 18.53 && lng >= 73.84 && lng <= 73.87) return "Deccan";
  if (lat >= 18.49 && lat <= 18.52 && lng >= 73.85 && lng <= 73.88) return "Swargate";
  if (lat >= 18.56 && lat <= 18.60 && lng >= 73.88 && lng <= 73.92) return "Viman Nagar";
  if (lat >= 18.50 && lat <= 18.55 && lng >= 73.80 && lng <= 73.86) return "Kothrud";
  // Broader Pune bbox
  if (lat >= 18.40 && lat <= 18.65 && lng >= 73.70 && lng <= 74.00) return "Pune";
  return null;
}

/* ── Garage list row ── */
function GarageRow({ garage, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl p-4 text-left transition-[transform,box-shadow,background-color] duration-150 active:scale-[0.98] bg-white ${
        active
          ? "ring-2 ring-[#0056b7]/40"
          : "hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
      }`}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#f3f3f8]">
        {garage.image
          ? <Image src={garage.image} alt={garage.name} fill className={`object-cover ${!garage.isOpen ? "opacity-70 grayscale-[25%]" : ""}`} sizes="56px" />
          : <div className="flex h-full w-full items-center justify-center">
              <Wrench className="h-6 w-6 text-[#c2c6d8]" />
            </div>
        }
        {garage.isOpen && (
          <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full border-2 border-white bg-green-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="truncate text-sm font-bold text-[#1a1c1f]">{garage.name}</p>
          {garage.verified && <CheckCircle2 className="h-3 w-3 shrink-0 text-[#0056b7]" />}
        </div>
        <p className="text-[11px] text-[#424656]">{garage.speciality}</p>
        <div className="mt-1 flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-[#1a1c1f]">{garage.rating || "New"}</span>
          </div>
          <span className="text-[#c2c6d8]">·</span>
          <span className={`text-[11px] font-semibold ${garage.isOpen ? "text-green-500" : "text-[#424656]"}`}>
            {garage.isOpen ? `Open · ${garage.waitTime}` : "Closed"}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-xs font-black text-[#0056b7]">{garage.distance}</span>
        <Link
          href={`/garage/${garage.id}`}
          onClick={(e) => e.stopPropagation()}
          className="rounded-full bg-[#0056b7] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 active:scale-95 min-h-[44px] flex items-center"
        >
          View
        </Link>
      </div>
    </button>
  );
}

const SORT_OPTIONS = [
  { label: "Nearest",   value: "nearest"  },
  { label: "Top Rated", value: "rating"   },
  { label: "Open Now",  value: "open"     },
];

function NearMeContent() {
  const searchParams  = useSearchParams();
  const [garages,       setGarages]       = useState([]);
  const [activeGarage,  setActiveGarage]  = useState(null);
  const [distFilter,    setDistFilter]    = useState("All");
  const [typeFilter,    setTypeFilter]    = useState(searchParams.get("type") || "all");
  const [search,        setSearch]        = useState(searchParams.get("q") || "");
  const [listExpanded,  setListExpanded]  = useState(false);
  const [locating,      setLocating]      = useState(false);
  const [userCoords,    setUserCoords]    = useState(null);
  const [sortBy,        setSortBy]        = useState("nearest");
  const [showSort,      setShowSort]      = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // Share the same 5-min sessionStorage cache as the home page
    const CACHE_KEY = "gd_garages_v1";
    const CACHE_TTL = 5 * 60 * 1000;
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts < CACHE_TTL) { setGarages(data); return; }
      }
    } catch { /* ignore */ }
    getAllGarages().then((data) => {
      setGarages(data);
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
    }).catch(console.error);
  }, []);

  /* When userCoords is available, compute real distance for each garage */
  const garagesWithDist = useMemo(() => garages.map((g) => {
    if (userCoords && g.lat && g.lng) {
      const km = haversine(userCoords[0], userCoords[1], g.lat, g.lng);
      return { ...g, _realDist: km, distance: km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(1)} km` };
    }
    return { ...g, _realDist: parseFloat(g.distance) || 99 };
  }), [garages, userCoords]);

  const filtered = useMemo(() => garagesWithDist
    .filter((g) => {
      const matchType   = typeFilter === "all" || g.vehicleType.includes(typeFilter);
      const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
                          g.speciality.toLowerCase().includes(search.toLowerCase());
      const dist = g._realDist;
      const matchDist =
        distFilter === "All" ||
        (distFilter === "< 1 km" && dist < 1)  ||
        (distFilter === "< 2 km" && dist < 2)  ||
        (distFilter === "< 5 km" && dist < 5);
      const matchOpen = sortBy !== "open" || g.isOpen;
      return matchType && matchSearch && matchDist && matchOpen;
    })
    .sort((a, b) => {
      if (sortBy === "rating")  return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "open")    return (b.isOpen ? 1 : 0) - (a.isOpen ? 1 : 0);
      return (a._realDist || 0) - (b._realDist || 0); // nearest
    }), [garagesWithDist, typeFilter, search, distFilter, sortBy, userCoords]);

  function toggleGarage(id) {
    setActiveGarage((prev) => (prev === id ? null : id));
  }

  function handleLocateMe() {
    if (!navigator.geolocation) {
      setToast("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const coords = [latitude, longitude];
        setUserCoords(coords);
        const area = getPuneNeighbourhood(latitude, longitude);
        showToast(area
          ? `Showing garages near ${area}`
          : `Location found! Showing nearby garages`
        );
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          showToast("Location denied. Enable permissions in browser settings to see nearby garages.");
        } else {
          showToast("Could not fetch location. Please try again.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-surface">
      <Header />

      {/* ── Search + filters ── */}
      <div className="shrink-0 bg-white px-4 pt-[84px] pb-3 md:px-8">
        <div className="mx-auto max-w-full space-y-3">

          {/* Search bar */}
          <div className="flex items-center gap-2 rounded-2xl border border-[#c2c6d8]/20 bg-white px-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] duration-150 focus-within:border-[#0056b7]/40 focus-within:shadow-[0_0_0_3px_rgba(0,86,183,0.08)] min-h-[48px]">
            <Search className="h-4 w-4 shrink-0 text-[#424656]" />
            <input
              type="text"
              inputMode="search"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search garages near you…"
              style={{ fontSize: 16 }}
              className="flex-1 bg-transparent text-[#1a1c1f] placeholder:text-[#c2c6d8] focus:outline-none"
            />
            {search && (
              <button type="button" aria-label="Clear search" onClick={() => setSearch("")} className="transition-[transform] duration-150 active:scale-90">
                <X className="h-4 w-4 text-[#424656] hover:text-[#1a1c1f]" />
              </button>
            )}
          </div>

          {/* Filter bar */}
          <div role="group" aria-label="Filter garages" className="overflow-x-auto flex gap-2 pb-0.5 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">

            {/* Vehicle type chips */}
            {TYPE_FILTERS.map(({ label, value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={typeFilter === value}
                onClick={() => setTypeFilter(value)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-[background-color,color] duration-150 active:scale-95 ${
                  typeFilter === value
                    ? "bg-[#0056b7] text-white"
                    : "bg-[#f3f3f8] text-[#424656] hover:bg-[#ededf2]"
                }`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}

            {/* Divider */}
            <div className="h-5 w-px shrink-0 bg-[#c2c6d8]/40 mx-1 self-center" />

            {/* Distance chips */}
            {DISTANCE_FILTERS.map((d) => {
              const needsGps = d !== "All";
              const disabled = needsGps && !userCoords;
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={distFilter === d}
                  onClick={() => {
                    if (disabled) { showToast("Tap 'Locate Me' on the map to enable distance filters"); return; }
                    setDistFilter(d);
                  }}
                  title={disabled ? "Enable location to use this filter" : undefined}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-[background-color,color] duration-150 active:scale-95 ${
                    distFilter === d
                      ? "bg-[#0056b7] text-white"
                      : disabled
                        ? "bg-[#f3f3f8] text-[#424656] cursor-not-allowed opacity-50"
                        : "bg-[#f3f3f8] text-[#424656] hover:bg-[#ededf2]"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Map + List - fills remaining height ── */}
      <div className="relative flex flex-1 overflow-hidden flex-col md:flex-row">

        {/* ── MAP - fills all remaining space ── */}
        <div className="relative flex-1 overflow-hidden">
          <MapView
            garages={filtered}
            activeGarage={activeGarage}
            onSelectGarage={toggleGarage}
            userCoords={userCoords ?? undefined}
          />

          {/* Loading overlay */}
          {locating && (
            <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center gap-2 bg-white/40 backdrop-blur-[2px]">
              <Loader2 className="h-8 w-8 animate-spin text-[#0056b7]" />
              <p className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#1a1c1f] shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
                Getting your location…
              </p>
            </div>
          )}

          {/* Locate Me FAB */}
          <button
            type="button"
            aria-label="Center on my location"
            onClick={handleLocateMe}
            disabled={locating}
            className="absolute top-3 right-3 z-[1000] flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition hover:bg-[#f3f3f8] active:scale-95 disabled:opacity-60"
          >
            {locating
              ? <Loader2  className="h-4 w-4 animate-spin text-[#0056b7]" />
              : <Navigation className="h-4 w-4 text-[#0056b7]" />
            }
          </button>
        </div>

        {/* ── GARAGE LIST ── */}
        {/* Mobile: bottom sheet that slides up */}
        <div
          className={`
            absolute bottom-0 left-0 right-0 z-[500] flex flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.10)] transition-[height] duration-300
            md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto md:w-[22rem] md:shrink-0 md:rounded-none md:border-l md:border-[#f3f3f8] md:shadow-[-4px_0_20px_rgba(0,0,0,0.05)]
            ${listExpanded ? "h-[65vh]" : "h-[36vh]"}
            md:h-full
          `}
        >
          {/* Pull handle - mobile only */}
          <button
            type="button"
            aria-label={listExpanded ? "Collapse garage list" : "Expand garage list"}
            aria-expanded={listExpanded}
            onClick={() => setListExpanded((e) => !e)}
            className="flex w-full shrink-0 flex-col items-center gap-1.5 border-b border-[#f3f3f8] py-3 md:hidden"
          >
            <div className="h-1 w-10 rounded-full bg-[#c2c6d8]/50" />
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#424656]">
              {listExpanded
                ? <><ChevronDown className="h-3 w-3" /> Collapse</>
                : <><ChevronUp className="h-3 w-3" /> Show garages</>
              }
            </div>
          </button>

          <div className="overflow-y-auto flex-1 p-3 md:p-4" style={{ paddingBottom: "max(90px, calc(env(safe-area-inset-bottom) + 90px))" }}>
            {/* Count header + sort */}
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-black tracking-tight text-[#1a1c1f]">
                  {filtered.length} Garage{filtered.length !== 1 ? "s" : ""}
                </p>
                <p className="text-[11px] text-[#424656] font-medium">near your location</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSort((s) => !s)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-[background-color,color] duration-150 active:scale-95 ${
                  showSort
                    ? "bg-[#0056b7] text-white"
                    : "bg-[#f3f3f8] text-[#424656] hover:bg-[#ededf2]"
                }`}
              >
                <SlidersHorizontal className="h-3 w-3" />
                {SORT_OPTIONS.find(s => s.value === sortBy)?.label ?? "Sort"}
              </button>
            </div>

            {showSort && (
              <div className="mb-3 flex gap-1.5 animate-slide-up rounded-2xl bg-[#f3f3f8] p-1">
                {SORT_OPTIONS.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setSortBy(value); setShowSort(false); }}
                    className={`flex-1 rounded-xl px-2 py-2 text-xs font-bold transition-[background-color,color] duration-150 active:scale-95 ${
                      sortBy === value
                        ? "bg-[#0056b7] text-white shadow-sm"
                        : "text-[#424656] hover:text-[#1a1c1f]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {filtered.length === 0 ? (
              <EmptyState preset="near-me" className="shadow-none bg-transparent py-8" />
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((garage) => (
                  <GarageRow
                    key={garage.id}
                    garage={garage}
                    active={activeGarage === garage.id}
                    onClick={() => toggleGarage(garage.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function NearMePage() {
  return (
    <Suspense>
      <NearMeContent />
    </Suspense>
  );
}
