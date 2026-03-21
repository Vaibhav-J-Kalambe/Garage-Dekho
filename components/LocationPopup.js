"use client";

import { useState } from "react";
import { MapPin, Locate, Search, X, Loader2 } from "lucide-react";
import { useLocation } from "../context/LocationContext";
import SwipeableSheet from "./SwipeableSheet";

const POPULAR_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
  "Pune", "Kolkata", "Ahmedabad", "Surat", "Jaipur",
  "Lucknow", "Nagpur", "Bhopal", "Indore", "Patna",
  "Vadodara", "Ludhiana", "Agra", "Nashik", "Thane",
];

export default function LocationPopup({ onClose }) {
  const { setLocation } = useLocation();
  const [detecting, setDetecting] = useState(false);
  const [query,     setQuery]     = useState("");
  const [error,     setError]     = useState(null);

  const suggestions = query.trim().length > 0
    ? POPULAR_CITIES.filter((c) => c.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];

  async function detectLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser.");
      return;
    }
    setDetecting(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=12`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const a = data.address ?? {};
          const area = a.suburb || a.neighbourhood || a.city_district || a.town || a.village || a.city || "Your Location";
          const city = a.city || a.town || a.county || "";
          setLocation({ area, city, lat: coords.latitude, lng: coords.longitude });
          onClose();
        } catch {
          setError("Could not fetch your area. Please search manually.");
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        if (err.code === 1) setError("Location denied. Please search your city below.");
        else setError("Could not detect location. Please search manually.");
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function selectCity(city) {
    setLocation({ area: city, city, lat: null, lng: null });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card — centered on desktop, swipeable sheet on mobile */}
      <SwipeableSheet onClose={onClose} className="relative w-full max-w-sm rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl animate-slide-up">
        <div className="px-6 pb-6">

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 transition"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Brand greeting */}
        <p className="text-xs text-slate-400 mb-0.5">Welcome to</p>
        <h1 className="text-xl font-black gradient-text mb-2">GarageDekho</h1>
        <p className="text-sm text-slate-500 leading-snug mb-5">
          Please provide your location to see<br />garages near you
        </p>

        {/* Error banner */}
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-500">
            {error}
          </p>
        )}

        {/* One-row: [Detect button] — OR — [Search input] */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={detectLocation}
            disabled={detecting}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-glow-primary transition hover:brightness-110 active:scale-[0.97] disabled:opacity-70"
          >
            {detecting
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Locate className="h-4 w-4" />
            }
            <span className="whitespace-nowrap">
              {detecting ? "Detecting…" : "Detect my location"}
            </span>
          </button>

          <span className="text-xs font-bold text-slate-400 shrink-0">— OR —</span>

          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 focus-within:border-primary focus-within:bg-white focus-within:ring-1 focus-within:ring-primary/20 transition">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city or area…"
              className="w-full min-w-0 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              autoComplete="off"
            />
          </div>
        </div>

        {/* City suggestions — dropdown */}
        {suggestions.length > 0 && (
          <div className="mt-2 rounded-xl border border-slate-100 bg-white shadow-card overflow-hidden">
            {suggestions.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => selectCity(city)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition border-b border-slate-50 last:border-0"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                {city}
              </button>
            ))}
          </div>
        )}

        {/* Popular cities — shown when not searching */}
        {query.trim().length === 0 && (
          <div className="mt-5">
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">Popular cities</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_CITIES.slice(0, 10).map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => selectCity(city)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary active:scale-95"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}

        </div>
        <div style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }} />
      </SwipeableSheet>
    </div>
  );
}
