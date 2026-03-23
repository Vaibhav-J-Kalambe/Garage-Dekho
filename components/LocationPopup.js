"use client";

import { useState, useEffect, useRef } from "react";
import { useLocation } from "../context/LocationContext";
import SwipeableSheet from "./SwipeableSheet";

export default function LocationPopup({ onClose }) {
  const { setLocation } = useLocation();
  const [detecting,  setDetecting]  = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [query,      setQuery]      = useState("");
  const [error,      setError]      = useState(null);
  const [suggestions,setSuggestions]= useState([]);
  const [searching,  setSearching]  = useState(false);
  const debounceRef = useRef(null);
  const searchRef   = useRef(null);

  /* ── Nominatim autocomplete ── */
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setSuggestions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&countrycodes=in&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        setSuggestions(await res.json());
      } catch { setSuggestions([]); }
      finally  { setSearching(false); }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function selectSuggestion(place) {
    const a    = place.address ?? {};
    const area = a.suburb || a.neighbourhood || a.city_district || a.town || a.village || a.city || place.name;
    const city = a.city || a.town || a.county || "";
    setLocation({ area, city, lat: parseFloat(place.lat), lng: parseFloat(place.lon) });
    onClose();
  }

  async function detectLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation not supported. Search your city below.");
      setTimeout(() => searchRef.current?.focus(), 100);
      return;
    }
    setDetecting(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=12`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const a    = data.address ?? {};
          const area = a.suburb || a.neighbourhood || a.city_district || a.town || a.village || a.city || "Your Location";
          const city = a.city || a.town || a.county || "";
          setLocation({ area, city, lat: coords.latitude, lng: coords.longitude });
          setDetecting(false);
          setSuccess(true);
          setTimeout(onClose, 1400);
        } catch {
          setError("Could not fetch location. Please search manually.");
          setDetecting(false);
        }
      },
      (err) => {
        setError(err.code === 1
          ? "No worries, search your city below."
          : "Could not detect location. Please search manually."
        );
        setDetecting(false);
        setTimeout(() => searchRef.current?.focus(), 150);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <SwipeableSheet
        onClose={onClose}
        hideHandle
        className="relative isolate w-full max-w-sm overflow-hidden rounded-t-[20px] shadow-2xl sm:rounded-[20px] animate-slide-up"
      >
        <div className="bg-white px-6 pb-2 pt-6">

          {/* ── Close ── */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors duration-150 hover:bg-slate-200 active:scale-95"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {/* ── Pill label ── */}
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#1a4fd6]/10 px-3 py-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1a4fd6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            <span className="text-[11px] font-black text-[#1a4fd6]">GarageDekho</span>
          </div>

          {/* ── Headline ── */}
          <h1 className="text-[26px] font-black leading-tight text-slate-900">
            Find garages<br />near you
          </h1>
          <p className="mt-2 text-sm leading-snug text-slate-500">
            Fix your ride. Not your budget.
          </p>

          {/* ── Trust badges ── */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {["Verified", "Best Price", "No Spam"].map((label) => (
              <span
                key={label}
                className="flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600"
              >
                <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {label}
              </span>
            ))}
          </div>

          <div className="my-5 border-t border-slate-100" />

          {/* ── Error banner ── */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
              <p className="text-xs font-semibold text-amber-700">{error}</p>
            </div>
          )}

          {/* ── Detect button ── */}
          <button
            type="button"
            onClick={detectLocation}
            disabled={detecting || success}
            className={`relative flex w-full items-center justify-center gap-2.5 rounded-full py-[14px] text-sm font-black text-white transition-colors duration-200 active:scale-[0.98] disabled:cursor-not-allowed ${
              success
                ? "bg-emerald-500"
                : "bg-[#1a4fd6] hover:bg-[#1644c0] shadow-[0_4px_16px_rgba(26,79,214,0.35)]"
            } ${!detecting && !success && !error ? "loc-pulse" : ""}`}
          >
            {success ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                Location found!
              </>
            ) : detecting ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                </svg>
                Detecting...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
                </svg>
                Detect my location
              </>
            )}
          </button>

          {/* ── Privacy nudge ── */}
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <p className="text-[11px] text-slate-400">Only used to show nearby garages · Never shared</p>
          </div>

          {/* ── OR divider ── */}
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          {/* ── Search input ── */}
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors duration-150 focus-within:border-[#1a4fd6] focus-within:ring-2 focus-within:ring-[#1a4fd6]/15">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city or area…"
              className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              autoComplete="off"
            />
            {searching && (
              <svg className="animate-spin shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
              </svg>
            )}
          </div>

          {/* ── Suggestions ── */}
          {suggestions.length > 0 && (
            <div className="mt-1.5 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
              {suggestions.map((place) => {
                const parts = place.display_name.split(", ");
                const name  = parts[0];
                const addr  = parts.slice(1).join(", ");
                return (
                  <button
                    key={place.place_id}
                    type="button"
                    onClick={() => selectSuggestion(place)}
                    className="flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors duration-150 last:border-0 hover:bg-slate-50 active:bg-slate-100"
                  >
                    <svg className="mt-0.5 shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a4fd6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" aria-hidden="true">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                      <circle cx="12" cy="9" r="2.5"/>
                    </svg>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800">{name}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">{addr}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

        </div>
        <div className="bg-white" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }} />
      </SwipeableSheet>
    </div>
  );
}
