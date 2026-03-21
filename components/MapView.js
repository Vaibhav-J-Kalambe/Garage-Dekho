"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const PUNE_CENTER = [18.5204, 73.8567];

/* ── Garage distance-bubble pin ── */
function createGaragePin(distance, active) {
  const bg     = active ? "#ef4444" : "#0056D2";
  const shadow = active ? "0 4px 16px rgba(239,68,68,0.45)" : "0 4px 16px rgba(0,86,210,0.40)";
  const ring   = active ? "#fecaca" : "#bfdbfe";
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.15))">
        <div style="
          background:${bg};color:#fff;
          padding:4px 10px;border-radius:20px;
          font-size:11px;font-weight:900;
          box-shadow:${shadow};
          border:2px solid ${ring};
          white-space:nowrap;
          transition:background 0.25s,box-shadow 0.25s;
          ${active ? "transform:scale(1.1);" : ""}
        ">${distance}</div>
        <div style="width:2px;height:6px;background:${bg};margin-top:1px;border-radius:2px;opacity:0.8"></div>
        <div style="width:5px;height:5px;background:${bg};border-radius:50%;opacity:0.8"></div>
      </div>`,
    iconAnchor: [30, 46],
    iconSize: [60, 46],
  });
}

/* ── User location pulsing dot ── */
function createUserDot() {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:20px;height:20px">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:rgba(0,86,210,0.25);
          animation:gd-ping 1.5s ease-out infinite;
        "></div>
        <div style="
          position:absolute;inset:3px;border-radius:50%;
          background:#0056D2;border:2px solid white;
          box-shadow:0 2px 8px rgba(0,86,210,0.4);
        "></div>
      </div>`,
    iconAnchor: [10, 10],
    iconSize: [20, 20],
  });
}

/* ── Fly-to controller (must live inside MapContainer) ── */
function FlyToController({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 15, { duration: 1.5, easeLinearity: 0.3 });
    }
  }, [coords, map]);
  return null;
}

/* ── Main map component ── */
export default function MapView({ garages, activeGarage, onSelectGarage, userCoords }) {
  return (
    <MapContainer
      center={PUNE_CENTER}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      zoomControl={true}
      scrollWheelZoom={true}
      attributionControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {garages.map((garage) => (
        <Marker
          key={`${garage.id}-${activeGarage === garage.id}`}
          position={[garage.lat, garage.lng]}
          icon={createGaragePin(garage.distance, activeGarage === garage.id)}
          eventHandlers={{ click: () => onSelectGarage(garage.id) }}
        />
      ))}

      {userCoords && (
        <Marker
          position={userCoords}
          icon={createUserDot()}
        />
      )}

      <FlyToController coords={userCoords} />
    </MapContainer>
  );
}
