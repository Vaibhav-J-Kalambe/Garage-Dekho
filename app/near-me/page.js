"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, SlidersHorizontal, Star, CheckCircle2,
  Navigation, X, Bike, Car, Zap, Wrench,
  Loader2, GitCompare, List, Map,
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
  if (lat >= 18.40 && lat <= 18.65 && lng >= 73.70 && lng <= 74.00) return "Pune";
  return null;
}

/* ── Garage list row ── */
function GarageRow({ garage, active, onClick, inCompare, onToggleCompare, compareDisabled }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left cursor-pointer bg-white dark:bg-[#1e1e22] transition-all duration-150 active:scale-[0.98] ${
        inCompare
          ? "ring-2 ring-[#0056b7] shadow-[0_0_0_4px_rgba(0,86,183,0.08)]"
          : active
          ? "ring-2 ring-[#0056b7]/40"
          : "hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
      }`}
    >
      {/* Thumbnail */}
      <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-xl bg-[#f3f3f8] dark:bg-[#2a2a2e]">
        {garage.image
          ? <Image src={garage.image} alt={garage.name} fill className={`object-cover ${!garage.isOpen ? "opacity-60 grayscale-[30%]" : ""}`} sizes="52px" />
          : <div className="flex h-full w-full items-center justify-center">
              <Wrench className="h-5 w-5 text-[#c2c6d8]" />
            </div>
        }
        <span className={`absolute bottom-1 right-1 h-2 w-2 rounded-full border-[1.5px] border-white dark:border-[#1e1e22] ${garage.isOpen ? "bg-green-500" : "bg-[#c2c6d8]"}`} />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 mb-0.5">
          <p className="truncate text-[13px] font-bold text-[#1a1c1f] dark:text-[#e4e2e6] leading-tight">{garage.name}</p>
          {garage.verified && <CheckCircle2 className="h-3 w-3 shrink-0 text-[#0056b7]" />}
        </div>
        <p className="truncate text-[11px] text-[#727687] dark:text-[#938f99] mb-1">{garage.speciality}</p>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-[11px] font-bold text-[#1a1c1f] dark:text-[#e4e2e6]">{garage.rating || "New"}</span>
          </div>
          <span className="text-[#c2c6d8] dark:text-[#444654] text-[10px]">•</span>
          <span className={`text-[11px] font-semibold ${garage.isOpen ? "text-green-600 dark:text-green-400" : "text-[#727687] dark:text-[#938f99]"}`}>
            {garage.isOpen ? "Open" : "Closed"}
          </span>
          {garage.isOpen && garage.waitTime && (
            <>
              <span className="text-[#c2c6d8] dark:text-[#444654] text-[10px]">•</span>
              <span className="text-[11px] text-[#727687] dark:text-[#938f99]">{garage.waitTime}</span>
            </>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex shrink-0 flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs font-black text-[#0056b7] dark:text-[#4d91ff]">{garage.distance}</span>
        <Link
          href={`/garage/${garage.id}`}
          onClick={(e) => e.stopPropagation()}
          className="w-[72px] rounded-full bg-[#0056b7] py-1.5 text-center text-[12px] font-bold text-white hover:opacity-90 active:scale-95 transition-all"
        >
          View
        </Link>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleCompare(garage); }}
          disabled={compareDisabled && !inCompare}
          className={`w-[72px] rounded-full py-1.5 text-center text-[12px] font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
            inCompare
              ? "bg-[#0056b7] text-white"
              : "bg-[#0056b7]/10 dark:bg-[#0056b7]/20 text-[#0056b7] dark:text-[#4d91ff] hover:bg-[#0056b7] hover:text-white"
          }`}
        >
          {inCompare ? "Added" : "Compare"}
        </button>
      </div>
    </div>
  );
}

const SORT_OPTIONS = [
  { label: "Nearest",   value: "nearest" },
  { label: "Top Rated", value: "rating"  },
  { label: "Open Now",  value: "open"    },
];

function NearMeContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [garages,      setGarages]      = useState([]);
  const [activeGarage, setActiveGarage] = useState(null);
  const [distFilter,   setDistFilter]   = useState("All");
  const [typeFilter,   setTypeFilter]   = useState(searchParams.get("type") || "all");
  const [search,       setSearch]       = useState(searchParams.get("q") || "");
  const [locating,     setLocating]     = useState(false);
  const [userCoords,   setUserCoords]   = useState(null);
  const [sortBy,       setSortBy]       = useState("nearest");
  const [showSort,     setShowSort]     = useState(false);
  const [compareList,  setCompareList]  = useState([]);
  const [mobileView,   setMobileView]   = useState("list"); // "list" | "map"
  const { showToast } = useToast();

  function toggleCompare(garage) {
    setCompareList((prev) => {
      if (prev.find((g) => g.id === garage.id)) return prev.filter((g) => g.id !== garage.id);
      if (prev.length >= 3) { showToast("You can compare up to 3 garages"); return prev; }
      return [...prev, garage];
    });
  }

  function startCompare() {
    const ids = compareList.map((g) => g.id).join(",");
    router.push(`/compare?ids=${ids}`);
  }

  useEffect(() => {
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
        (distFilter === "< 1 km" && dist < 1) ||
        (distFilter === "< 2 km" && dist < 2) ||
        (distFilter === "< 5 km" && dist < 5);
      const matchOpen = sortBy !== "open" || g.isOpen;
      return matchType && matchSearch && matchDist && matchOpen;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "open")   return (b.isOpen ? 1 : 0) - (a.isOpen ? 1 : 0);
      return (a._realDist || 0) - (b._realDist || 0);
    }), [garagesWithDist, typeFilter, search, distFilter, sortBy]);

  function toggleGarage(id) {
    setActiveGarage((prev) => (prev === id ? null : id));
  }

  function handleLocateMe() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords([latitude, longitude]);
        const area = getPuneNeighbourhood(latitude, longitude);
        showToast(area ? `Showing garages near ${area}` : "Location found! Showing nearby garages");
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          showToast("Location denied. Enable permissions in browser settings.");
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

      {/* ── Filters bar ── */}
      <div className="shrink-0 bg-[#ffffff] dark:bg-[#111113] px-4 pt-[84px] pb-3 md:px-8 border-b border-transparent dark:border-white/5">
        <div className="mx-auto max-w-full space-y-3">

          {/* Search */}
          <div className="flex items-center gap-2 rounded-2xl border border-[#c2c6d8]/40 dark:border-white/10 bg-[#ffffff] dark:bg-transparent px-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none transition-[border-color,box-shadow] duration-150 focus-within:border-[#0056b7] dark:focus-within:border-[#4d91ff] focus-within:shadow-[0_0_0_3px_rgba(0,86,183,0.08)] min-h-[48px]">
            <Search className="h-4 w-4 shrink-0 text-[#424656] dark:text-[#c7c5d0]" />
            <input
              type="text"
              inputMode="search"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search garages near you..."
              style={{ fontSize: 16 }}
              className="flex-1 bg-transparent dark:!bg-transparent text-[#1a1c1f] dark:text-[#e4e2e6] placeholder:text-[#c2c6d8] dark:placeholder:text-[#444654] focus:outline-none"
            />
            {search && (
              <button type="button" aria-label="Clear search" onClick={() => setSearch("")} className="transition-[transform] duration-150 active:scale-90">
                <X className="h-4 w-4 text-[#424656] hover:text-[#1a1c1f]" />
              </button>
            )}
          </div>

          {/* Quick compare shortcuts */}
          <div className="overflow-x-auto flex gap-2 pb-0.5 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            <span className="shrink-0 self-center text-[11px] font-bold text-[#727687] dark:text-[#918f9a]">Compare:</span>
            {[
              { label: "Overall",    mode: "overall"   },
              { label: "Top Rated",  mode: "top-rated" },
              { label: "Nearest",    mode: "nearest"   },
              { label: "Best Cars",  mode: "cars"      },
              { label: "Best Bikes", mode: "bikes"     },
              { label: "Best EV",    mode: "ev"        },
            ].map(({ label, mode }) => (
              <Link
                key={mode}
                href={`/compare?mode=${mode}`}
                className="shrink-0 flex items-center gap-1 rounded-full bg-[#f3f3f8] dark:bg-[#2a2a2e] px-3 py-1.5 text-[11px] font-bold text-[#424656] dark:text-[#938f99] hover:bg-[#d8e2ff] dark:hover:bg-[#1a2f52] hover:text-[#0056b7] dark:hover:text-[#4d91ff] transition-colors active:scale-95"
              >
                <GitCompare className="h-3 w-3" />
                {label}
              </Link>
            ))}
          </div>

          {/* Vehicle type + distance filters */}
          <div role="group" aria-label="Filter garages" className="overflow-x-auto flex gap-2 pb-0.5 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {TYPE_FILTERS.map(({ label, value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={typeFilter === value}
                onClick={() => setTypeFilter(value)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-[background-color,color] duration-150 active:scale-95 ${
                  typeFilter === value
                    ? "bg-[#0056b7] text-white"
                    : "bg-[#f3f3f8] dark:bg-[#2a2a2e] text-[#424656] dark:text-[#938f99] hover:bg-[#ededf2] dark:hover:bg-[#333338]"
                }`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
            <div className="h-5 w-px shrink-0 bg-[#c2c6d8]/40 mx-1 self-center" />
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
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-[background-color,color] duration-150 active:scale-95 ${
                    distFilter === d
                      ? "bg-[#0056b7] text-white"
                      : disabled
                        ? "bg-[#f3f3f8] dark:bg-[#2a2a2e] text-[#424656] dark:text-[#938f99] cursor-not-allowed opacity-50"
                        : "bg-[#f3f3f8] dark:bg-[#2a2a2e] text-[#424656] dark:text-[#938f99] hover:bg-[#ededf2] dark:hover:bg-[#333338]"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Map / List toggle — mobile only */}
          <div className="flex gap-1 bg-[#f3f3f8] dark:bg-[#2a2a2e] rounded-xl p-1 md:hidden">
            <button
              type="button"
              onClick={() => setMobileView("list")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all duration-150 ${
                mobileView === "list"
                  ? "bg-white dark:bg-[#1e1e22] text-[#0056b7] shadow-sm"
                  : "text-[#727687] dark:text-[#938f99]"
              }`}
            >
              <List className="h-3.5 w-3.5" /> List
            </button>
            <button
              type="button"
              onClick={() => setMobileView("map")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all duration-150 ${
                mobileView === "map"
                  ? "bg-white dark:bg-[#1e1e22] text-[#0056b7] shadow-sm"
                  : "text-[#727687] dark:text-[#938f99]"
              }`}
            >
              <Map className="h-3.5 w-3.5" /> Map
            </button>
          </div>

        </div>
      </div>

      {/* ── Main content ── */}
      <div className="relative flex flex-1 overflow-hidden flex-col md:flex-row">

        {/* MAP */}
        <div className={`relative overflow-hidden flex-1 ${mobileView === "map" ? "flex" : "hidden"} md:flex`}>
          <MapView
            garages={filtered}
            activeGarage={activeGarage}
            onSelectGarage={toggleGarage}
            userCoords={userCoords ?? undefined}
          />
          {locating && (
            <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center gap-2 bg-white/40 backdrop-blur-[2px]">
              <Loader2 className="h-8 w-8 animate-spin text-[#0056b7]" />
              <p className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#1a1c1f] shadow-[0_4px_16px_rgba(0,0,0,0.12)]">Getting your location...</p>
            </div>
          )}
          <button
            type="button"
            aria-label="Center on my location"
            onClick={handleLocateMe}
            disabled={locating}
            className="absolute top-3 right-3 z-[1000] flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition hover:bg-[#f3f3f8] active:scale-95 disabled:opacity-60"
          >
            {locating
              ? <Loader2 className="h-4 w-4 animate-spin text-[#0056b7]" />
              : <Navigation className="h-4 w-4 text-[#0056b7]" />
            }
          </button>
        </div>

        {/* LIST */}
        <div className={`flex flex-col overflow-hidden ${mobileView === "list" ? "flex-1" : "hidden"} md:flex md:w-[22rem] md:shrink-0 md:border-l md:border-[#f3f3f8] dark:md:border-white/5`}>
          <div className="overflow-y-auto flex-1 px-3 md:px-4 pt-3 pb-[max(90px,calc(env(safe-area-inset-bottom)+90px))]">

            {/* Count + sort */}
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-black tracking-tight text-[#1a1c1f] dark:text-[#e4e2e6]">
                  {filtered.length} Garage{filtered.length !== 1 ? "s" : ""} found
                </p>
                <p className="text-[11px] text-[#424656] dark:text-[#938f99] font-medium">near your location</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSort((s) => !s)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-[background-color,color] duration-150 active:scale-95 ${
                  showSort
                    ? "bg-[#0056b7] text-white"
                    : "bg-[#f3f3f8] dark:bg-[#2a2a2e] text-[#424656] dark:text-[#938f99] hover:bg-[#ededf2]"
                }`}
              >
                <SlidersHorizontal className="h-3 w-3" />
                {SORT_OPTIONS.find(s => s.value === sortBy)?.label ?? "Sort"}
              </button>
            </div>

            {showSort && (
              <div className="mb-3 flex gap-1.5 rounded-2xl bg-[#f3f3f8] dark:bg-[#2a2a2e] p-1">
                {SORT_OPTIONS.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setSortBy(value); setShowSort(false); }}
                    className={`flex-1 rounded-xl px-2 py-2 text-xs font-bold transition-[background-color,color] duration-150 active:scale-95 ${
                      sortBy === value
                        ? "bg-[#0056b7] text-white shadow-sm"
                        : "text-[#424656] dark:text-[#938f99] hover:text-[#1a1c1f]"
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
                    inCompare={!!compareList.find((g) => g.id === garage.id)}
                    onToggleCompare={toggleCompare}
                    compareDisabled={compareList.length >= 3}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Sticky Compare Bar ── */}
      {compareList.length > 0 && (
        <div className="fixed bottom-[80px] md:bottom-6 left-1/2 -translate-x-1/2 z-[600] w-[calc(100%-32px)] max-w-md">
          <div className="flex items-center gap-2 rounded-2xl bg-[#0056b7] px-3 py-2.5 shadow-[0_8px_32px_rgba(0,86,183,0.35)]">
            <div className="flex flex-1 items-center gap-1.5 overflow-hidden">
              {compareList.map((g) => (
                <div key={g.id} className="flex items-center gap-1 rounded-xl bg-white/15 px-2 py-1 min-w-0">
                  <span className="truncate text-[11px] font-bold text-white max-w-[72px]">{g.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${g.name}`}
                    onClick={() => toggleCompare(g)}
                    className="shrink-0 rounded-full p-0.5 hover:bg-white/20 transition-colors"
                  >
                    <X className="h-3 w-3 text-white/80" />
                  </button>
                </div>
              ))}
              {compareList.length < 3 && (
                <span className="shrink-0 text-[11px] text-white/60">
                  {compareList.length === 1 ? "+ add 1 more" : ""}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={startCompare}
              disabled={compareList.length < 2}
              className="shrink-0 flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[12px] font-black text-[#0056b7] transition-all duration-150 hover:bg-[#f0f4ff] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GitCompare className="h-3.5 w-3.5" />
              Compare
            </button>
          </div>
        </div>
      )}
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
