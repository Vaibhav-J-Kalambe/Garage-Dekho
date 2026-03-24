"use client";

import { useState, useEffect, useRef } from "react";
import { useLocation } from "../context/LocationContext";
import SwipeableSheet from "./SwipeableSheet";

export default function LocationPopup({ onClose }) {
  const { setLocation } = useLocation();
  const [locationState,  setLocationState] = useState("idle"); // idle | loading | success | error
  const [detectedCity,   setDetectedCity]  = useState("");
  const [query,          setQuery]         = useState("");
  const [error,          setError]         = useState(null);
  const [suggestions,    setSuggestions]   = useState([]);
  const [searching,      setSearching]     = useState(false);
  const [selectedCity,   setSelectedCity]  = useState(null);
  const debounceRef = useRef(null);
  const searchRef   = useRef(null);

  const POPULAR_CITIES = ["Mumbai", "Delhi", "Bengaluru", "Pune", "Hyderabad"];

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

  function selectCity(city) {
    setSelectedCity(city);
    setQuery(city);
    setTimeout(() => searchRef.current?.focus(), 50);
  }

  const handleDetectLocation = () => {
    setLocationState("loading");
    setError(null);

    if (!navigator.geolocation) {
      setLocationState("error");
      setTimeout(() => searchRef.current?.focus(), 150);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const a    = data.address ?? {};
          const area = a.suburb || a.neighbourhood || a.city_district || a.town || a.village || a.city || "Your Location";
          const city = data.address.city || data.address.town || data.address.village || "Your area";
          const state = data.address.state || "";
          setLocation({ area, city, lat: coords.latitude, lng: coords.longitude });
          setDetectedCity(`${city}${state ? ", " + state : ""}`);
          setLocationState("success");
          setTimeout(onClose, 1600);
        } catch {
          setLocationState("error");
          setTimeout(() => searchRef.current?.focus(), 150);
        }
      },
      () => {
        setLocationState("error");
        setTimeout(() => searchRef.current?.focus(), 150);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <>
      <style>{`
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
        .loc-chip {
          font-size: 11px; padding: 5px 10px; white-space: nowrap;
          border-radius: 50px; cursor: pointer; transition: all 150ms;
          font-family: inherit; border: 1px solid #e5e7eb;
          background: #f9fafb; color: #374151; font-weight: 500;
          min-height: 30px; display: inline-flex; align-items: center;
          flex-shrink: 0;
        }
        .loc-chip:active { transform: scale(0.96); }
        .loc-chip.selected { background:#eff6ff; border-color:#0056D2; color:#0056D2; font-weight:600; }
        .chips-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; -ms-overflow-style:none; }
        .chips-scroll::-webkit-scrollbar { display:none; }
        .loc-search-input { transition: border-color 150ms, box-shadow 150ms; }
        .loc-search-input:focus {
          border-color: #0056D2 !important;
          box-shadow: 0 0 0 3px rgba(0,86,210,0.12) !important;
          outline: none !important;
        }
        @media (max-width: 430px) {
          .loc-headline { font-size: 24px !important; }
          .loc-header   { padding: 18px 20px 22px 20px !important; }
          .loc-body     { padding: 20px 20px 0 20px !important; }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
        {/* Backdrop — only this element has backdrop-filter */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <SwipeableSheet
          onClose={onClose}
          className="animate-slide-up relative flex w-full max-w-sm flex-col overflow-hidden rounded-t-[24px] shadow-2xl sm:rounded-[24px]"
          style={{ maxHeight: "100svh" }}
        >
          {/* ── Blue top section ── */}
          <div
            className="loc-header relative overflow-hidden bg-gradient-to-br from-[#001f5b] via-[#003091] to-[#0056D2]"
            style={{ padding: "24px 24px 28px 24px" }}
          >
            {/* Dot-grid texture */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
                opacity: 0.4,
              }}
            />
            {/* Glow blobs — each isolated so blur stays contained */}
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full" style={{ background: "rgba(96,165,250,0.25)", filter: "blur(28px)" }} />
            <div className="pointer-events-none absolute -bottom-4 -left-4 h-24 w-24 rounded-full" style={{ background: "rgba(125,211,252,0.18)", filter: "blur(24px)" }} />

            {/* Logo row + close button */}
            <div className="relative z-10 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white text-[#0056D2] text-lg font-black shadow-sm">
                  G
                </div>
                <span className="text-[15px] font-bold text-white">GarageDekho</span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex items-center justify-center rounded-full bg-white/20 text-white transition-colors duration-150 hover:bg-white/30 active:scale-95"
                style={{ width: 44, height: 44, flexShrink: 0 }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Headline */}
            <h1
              className="loc-headline relative z-10 text-white"
              style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1.15, marginBottom: 20 }}
            >
              Find garages<br />near you
            </h1>

            {/* Trust row */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-snug">Verified garages · Real prices</p>
                <p className="text-xs text-white/70 mt-0.5">No hidden charges · Trusted by thousands</p>
              </div>
            </div>
          </div>

          {/* ── White bottom section ── */}
          <div
            className="loc-body bg-white overflow-y-auto flex-1"
            style={{ padding: "24px 24px 0 24px", isolation: "isolate" }}
          >
            {/* Error banner */}
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                <p className="text-xs font-semibold text-amber-700">{error}</p>
              </div>
            )}

            {/* Search label */}
            <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 10, marginLeft: 0, paddingLeft: 0 }}>
              Search your city or area
            </p>

            {/* Search input */}
            <div style={{ position: "relative", width: "100%" }}>
              <svg
                aria-hidden="true"
                style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", zIndex: 1 }}
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedCity(null); }}
                placeholder="Search city or area…"
                autoComplete="off"
                inputMode="search"
                className="loc-search-input"
                style={{
                  display: "block",
                  width: "100%",
                  height: 50,
                  padding: "0 16px 0 42px",
                  border: "1.5px solid #d1d5db",
                  borderRadius: 12,
                  fontSize: 16, /* 16px prevents iOS Safari auto-zoom */
                  color: "#111827",
                  background: "#ffffff",
                  boxShadow: "none",
                  WebkitAppearance: "none",
                  appearance: "none",
                  transform: "translateZ(0)",
                }}
              />
              {searching && (
                <svg
                  className="animate-spin"
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                </svg>
              )}
            </div>

            {/* Popular city chips — hidden when suggestions show */}
            {suggestions.length === 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500, marginBottom: 8 }}>Popular cities</p>
                <div className="chips-scroll" style={{ display: "flex", flexWrap: "nowrap", gap: 8, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 2, paddingRight: 16 }}>
                  {POPULAR_CITIES.map((city) => (
                    <button
                      key={city}
                      type="button"
                      className={`loc-chip${selectedCity === city ? " selected" : ""}`}
                      onClick={() => selectCity(city)}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Autocomplete suggestions */}
            {suggestions.length > 0 && (
              <div className="mt-2 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg">
                {suggestions.map((place) => {
                  const parts = place.display_name.split(", ");
                  const name  = parts[0];
                  const addr  = parts.slice(1).join(", ");
                  return (
                    <button
                      key={place.place_id}
                      type="button"
                      onClick={() => selectSuggestion(place)}
                      className="flex w-full items-center gap-3 border-b border-slate-50 px-4 text-left transition-colors duration-150 last:border-0 hover:bg-slate-50 active:bg-slate-100"
                      style={{ minHeight: 48 }}
                    >
                      <svg className="shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0056D2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" aria-hidden="true">
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

            {/* OR divider */}
            <div className="flex items-center gap-3" style={{ margin: "16px 0" }}>
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">or</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            {/* Detect button */}
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={locationState === "loading"}
              className={locationState === "idle" ? "loc-pulse" : ""}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 10, width: "100%", height: 52, border: "none",
                borderRadius: 50, fontSize: 16, fontWeight: 700, color: "#fff",
                background: locationState === "success" ? "#16a34a" : "#0056D2",
                boxShadow: locationState === "success" ? "none" : "0 4px 16px rgba(0,86,210,0.3)",
                transition: "background 300ms",
                cursor: locationState === "loading" ? "not-allowed" : "pointer",
                marginBottom: 8,
              }}
            >
              {locationState === "idle" && (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                  </svg>
                  Detect my location
                </>
              )}
              {locationState === "loading" && (
                <>
                  <span style={{ width: 17, height: 17, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block", flexShrink: 0 }} />
                  Detecting your location...
                </>
              )}
              {locationState === "success" && (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <polyline points="3 12 9 18 21 6"/>
                  </svg>
                  {detectedCity || "Location found!"}
                </>
              )}
              {locationState === "error" && (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                  </svg>
                  Detect my location
                </>
              )}
            </button>

            {/* Inline error */}
            {locationState === "error" && (
              <p style={{ fontSize: 12, color: "#dc2626", textAlign: "center", marginBottom: 8, animation: "fadeIn 200ms ease" }}>
                Couldn't detect location. Please search below ↓
              </p>
            )}

            {/* Privacy nudge */}
            <div className="flex items-center justify-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <p className="text-[11px] text-slate-400">Only used to show nearby garages · Never shared</p>
            </div>

            {/* Bottom spacer — clears bottom nav bar + iOS home indicator */}
            <div style={{ height: "max(72px, calc(env(safe-area-inset-bottom) + 65px))" }} />
          </div>
        </SwipeableSheet>
      </div>
    </>
  );
}
