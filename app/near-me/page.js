"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Search, SlidersHorizontal, Star, CheckCircle2,
  Navigation, X, Bike, Car, Zap, Wrench,
  ChevronUp, ChevronDown, Loader2, MapPin,
} from "lucide-react";
import Header from "../../components/Header";
import { getAllGarages } from "../../lib/garages";

/* Load Leaflet map client-side only (no SSR) */
const MapView = dynamic(() => import("../../components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

/* ── Toast ── */
function Toast({ message, onDone }) {
  const [visible, setVisible] = useState(true);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const hide = setTimeout(() => setVisible(false), 3200);
    const done = setTimeout(() => onDoneRef.current(), 3500);
    return () => { clearTimeout(hide); clearTimeout(done); };
  }, []);

  return (
    <div
      className={`pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-slate-900/90 px-5 py-3 text-sm font-semibold text-white shadow-xl backdrop-blur-sm transition-all duration-300 md:bottom-8 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      {message}
    </div>
  );
}

/* ── Garage list row ── */
function GarageRow({ garage, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all duration-200 active:scale-[0.98] shadow-card ${
        active ? "bg-red-50 ring-2 ring-red-400" : "bg-white hover:shadow-card-hover"
      }`}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
        <img src={garage.image} alt={garage.name} className="h-full w-full object-cover" loading="lazy" />
        {garage.isOpen && (
          <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full border-2 border-white bg-green-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="truncate text-sm font-bold text-slate-900">{garage.name}</p>
          {garage.verified && <CheckCircle2 className="h-3 w-3 shrink-0 text-primary" />}
        </div>
        <p className="text-[11px] text-slate-400">{garage.speciality}</p>
        <div className="mt-1 flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-slate-700">{garage.rating}</span>
          </div>
          <span className="text-slate-200">·</span>
          <span className={`text-[11px] font-semibold ${garage.isOpen ? "text-green-500" : "text-slate-400"}`}>
            {garage.isOpen ? `Open · ${garage.waitTime}` : "Closed"}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={`text-xs font-black ${active ? "text-red-500" : "text-primary"}`}>{garage.distance}</span>
        <Link
          href={`/garage/${garage.id}`}
          onClick={(e) => e.stopPropagation()}
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold text-white transition hover:opacity-90 active:scale-95 ${
            active ? "bg-red-500" : "bg-primary"
          }`}
        >
          View
        </Link>
      </div>
    </button>
  );
}

export default function NearMePage() {
  const searchParams  = useSearchParams();
  const [garages,       setGarages]       = useState([]);
  const [activeGarage,  setActiveGarage]  = useState(null);
  const [distFilter,    setDistFilter]    = useState("All");
  const [typeFilter,    setTypeFilter]    = useState("all");
  const [search,        setSearch]        = useState(searchParams.get("q") || "");
  const [listExpanded,  setListExpanded]  = useState(false);
  const [locating,      setLocating]      = useState(false);
  const [userCoords,    setUserCoords]    = useState(null);
  const [toast,         setToast]         = useState(null);

  useEffect(() => {
    getAllGarages().then(setGarages).catch(console.error);
  }, []);

  function dismissToast() { setToast(null); }

  /* When userCoords is available, compute real distance for each garage */
  const garagesWithDist = garages.map((g) => {
    if (userCoords && g.lat && g.lng) {
      const km = haversine(userCoords[0], userCoords[1], g.lat, g.lng);
      return { ...g, _realDist: km, distance: km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(1)} km` };
    }
    return { ...g, _realDist: parseFloat(g.distance) || 99 };
  });

  const filtered = garagesWithDist.filter((g) => {
    const matchType   = typeFilter === "all" || g.vehicleType.includes(typeFilter);
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
                        g.speciality.toLowerCase().includes(search.toLowerCase());
    const dist = g._realDist;
    const matchDist =
      distFilter === "All" ||
      (distFilter === "< 1 km" && dist < 1)  ||
      (distFilter === "< 2 km" && dist < 2)  ||
      (distFilter === "< 5 km" && dist < 5);
    return matchType && matchSearch && matchDist;
  });

  function toggleGarage(id) {
    setActiveGarage((prev) => (prev === id ? null : id));
  }

  function handleLocateMe() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        console.log("📍 User coordinates:", { latitude, longitude });
        const coords = [latitude, longitude];
        setUserCoords(coords);
        const area = getPuneNeighbourhood(latitude, longitude);
        setToast(area
          ? `📍 Showing garages near ${area}`
          : `📍 Location found! Showing nearby garages`
        );
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          alert(
            "Location access was denied.\n\nTo get better results, please enable location permissions for this site in your browser settings."
          );
        } else {
          setToast("⚠️ Could not fetch location. Try again.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <Header />

      {toast && <Toast key={toast} message={toast} onDone={dismissToast} />}

      {/* ── Search + filters ── */}
      <div className="bg-white px-4 py-3 shadow-card md:px-8">
        <div className="mx-auto max-w-5xl space-y-3">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search garages near you…"
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")}>
                <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {TYPE_FILTERS.map(({ label, value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTypeFilter(value)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
                  typeFilter === value ? "bg-primary text-white" : "bg-slate-100 text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
            <div className="h-5 w-px shrink-0 bg-slate-200" />
            {DISTANCE_FILTERS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDistFilter(d)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
                  distFilter === d ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-700"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Map + List ── */}
      <div className="relative flex flex-1 flex-col md:flex-row">

        {/* ── REAL MAP ── */}
        <div className="relative h-[55vw] max-h-[420px] min-h-[280px] w-full shrink-0 md:h-[calc(100vh-160px)] md:flex-1 md:sticky md:top-[160px]">
          {/* Leaflet map */}
          <MapView
            garages={filtered}
            activeGarage={activeGarage}
            onSelectGarage={toggleGarage}
            userCoords={userCoords ?? undefined}
          />

          {/* Loading overlay */}
          {locating && (
            <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center gap-2 bg-white/40 backdrop-blur-[2px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-card">
                Getting your location…
              </p>
            </div>
          )}

          {/* Locate Me button — above Leaflet controls (z-[1000]) */}
          <button
            type="button"
            aria-label="Center on my location"
            onClick={handleLocateMe}
            disabled={locating}
            className="absolute bottom-3 left-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-card-hover transition hover:bg-slate-50 active:scale-95 disabled:opacity-60"
          >
            {locating
              ? <Loader2  className="h-4 w-4 animate-spin text-primary" />
              : <Navigation className="h-4 w-4 text-primary" />
            }
          </button>
        </div>

        {/* ── GARAGE LIST ── */}
        <div
          className={`
            w-full shrink-0 overflow-y-auto bg-[#F8FAFC] transition-all
            md:w-80 md:border-l md:border-slate-100 md:bg-white md:shadow-[-4px_0_16px_rgba(0,0,0,0.04)]
            ${listExpanded ? "max-h-[70vh]" : "max-h-[44vh]"}
            md:max-h-none
          `}
        >
          {/* Pull handle — mobile only */}
          <button
            type="button"
            onClick={() => setListExpanded((e) => !e)}
            className="flex w-full items-center justify-center gap-2 border-b border-slate-100 bg-white py-2.5 md:hidden"
          >
            <div className="h-1 w-8 rounded-full bg-slate-200" />
            {listExpanded
              ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              : <ChevronUp   className="h-3.5 w-3.5 text-slate-400" />
            }
          </button>

          <div className="p-3 pb-24 md:p-4 md:pb-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                {filtered.length} garage{filtered.length !== 1 ? "s" : ""} nearby
              </p>
              <SlidersHorizontal className="h-4 w-4 text-slate-300" />
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <MapPin className="h-8 w-8 text-slate-200" />
                <p className="mt-2 text-sm font-bold text-slate-700">No garages found</p>
                <p className="mt-1 text-xs text-slate-400">Try adjusting your filters</p>
              </div>
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
