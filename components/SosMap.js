"use client";

import { useEffect, useRef } from "react";

// ── Icons ──────────────────────────────────────────────────────────────────

const USER_ICON_HTML = `
<div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center">
  <div style="position:absolute;width:48px;height:48px;border-radius:50%;background:rgba(211,47,47,0.18);animation:sos-ping 1.8s ease-out infinite"></div>
  <div style="position:absolute;width:32px;height:32px;border-radius:50%;background:rgba(211,47,47,0.12);animation:sos-ping 1.8s ease-out infinite;animation-delay:0.4s"></div>
  <div style="width:18px;height:18px;border-radius:50%;background:#D32F2F;border:3px solid white;box-shadow:0 2px 12px rgba(211,47,47,0.7)"></div>
</div>`;

const MECH_ICON_HTML = `
<div style="position:relative;display:flex;flex-direction:column;align-items:center">
  <div style="
    width:44px;height:44px;border-radius:50%;
    background:linear-gradient(135deg,#0056D2,#0070f3);
    border:3px solid white;
    box-shadow:0 4px 16px rgba(0,86,210,0.55);
    display:flex;align-items:center;justify-content:center;
    font-size:20px;
    animation:mech-pulse 2s ease-in-out infinite;
  ">🔧</div>
  <div style="
    width:0;height:0;
    border-left:6px solid transparent;
    border-right:6px solid transparent;
    border-top:8px solid #0056D2;
    margin-top:-2px;
    filter:drop-shadow(0 2px 4px rgba(0,86,210,0.4));
  "></div>
</div>`;

// ── Component ──────────────────────────────────────────────────────────────

export default function SosMap({ userCoords, mechanicCoords, className = "h-full w-full" }) {
  const containerRef = useRef(null);
  const stateRef     = useRef({ map: null, L: null, userM: null, mechM: null, line: null, initialized: false });

  // Init map once
  useEffect(() => {
    const el = containerRef.current;
    if (!el || stateRef.current.initialized) return;
    stateRef.current.initialized = true;

    import("leaflet").then((mod) => {
      const L = mod.default ?? mod;

      // Use a clean dark-adjacent tile style
      const center = userCoords ?? [18.52, 73.85];
      const map = L.map(el, {
        zoomControl: false,
        attributionControl: false,
        zoomSnap: 0.5,
        tap: false,
      }).setView(center, 15);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { maxZoom: 19, subdomains: "abcd" }
      ).addTo(map);

      // User marker
      if (userCoords) {
        const userIcon = L.divIcon({ html: USER_ICON_HTML, className: "", iconAnchor: [24, 24] });
        stateRef.current.userM = L.marker(userCoords, { icon: userIcon, zIndexOffset: 100 })
          .addTo(map)
          .bindPopup("<b>Your location</b>", { closeButton: false });
      }

      stateRef.current.map = map;
      stateRef.current.L   = L;
    });

    return () => {
      if (stateRef.current.map) {
        stateRef.current.map.remove();
        stateRef.current = { map: null, L: null, userM: null, mechM: null, line: null, initialized: false };
      }
    };
  }, []);

  // Update mechanic position
  useEffect(() => {
    const { map, L } = stateRef.current;
    if (!map || !L || !mechanicCoords) return;

    const mechIcon = L.divIcon({ html: MECH_ICON_HTML, className: "", iconAnchor: [22, 52] });

    if (stateRef.current.mechM) {
      // Smooth pan to new position
      stateRef.current.mechM.setLatLng(mechanicCoords);
    } else {
      stateRef.current.mechM = L.marker(mechanicCoords, { icon: mechIcon, zIndexOffset: 200 })
        .addTo(map)
        .bindPopup("<b>Mechanic en route</b>", { closeButton: false });
    }

    // Update route line
    if (userCoords) {
      if (stateRef.current.line) {
        stateRef.current.line.setLatLngs([mechanicCoords, userCoords]);
      } else {
        stateRef.current.line = L.polyline([mechanicCoords, userCoords], {
          color: "#0056D2",
          weight: 4,
          dashArray: "12 8",
          opacity: 0.75,
          lineCap: "round",
        }).addTo(map);
      }

      // Auto-fit both pins with padding
      const bounds = L.latLngBounds([userCoords, mechanicCoords]);
      map.fitBounds(bounds, { padding: [64, 64], maxZoom: 16, animate: true });
    } else {
      map.panTo(mechanicCoords, { animate: true });
    }
  }, [mechanicCoords]);

  return (
    <>
      <style>{`
        @keyframes sos-ping {
          0%   { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        @keyframes mech-pulse {
          0%, 100% { box-shadow: 0 4px 16px rgba(0,86,210,0.55); }
          50%       { box-shadow: 0 4px 28px rgba(0,86,210,0.85); }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
          font-family: inherit !important;
        }
        .leaflet-popup-tip { display: none !important; }
      `}</style>
      <div ref={containerRef} className={className} />
    </>
  );
}
