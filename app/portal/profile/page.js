"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { usePortalAuth } from "../../../context/PortalAuthContext";

const SERVICES_LIST = [
  "Tyre Service", "Battery Replacement", "Engine Repair", "Oil Change",
  "Brake Service", "AC Repair", "Body Work", "Wheel Alignment",
  "Suspension", "Electricals", "General Repair", "Accident Repair",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const IcBuilding = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22V12h6v10"/><path d="M8 7h.01M12 7h.01M16 7h.01M8 12h.01M16 12h.01"/>
  </svg>
);
const IcPhone = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.44 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.12 6.12l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IcPin = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IcNav = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
  </svg>
);

export default function PortalProfilePage() {
  const { garage, portalUser, signOut, refreshGarage } = usePortalAuth();

  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [locating, setLocating] = useState(false);

  const [garageName, setGarageName] = useState("");
  const [phone,      setPhone]      = useState("");
  const [address,    setAddress]    = useState("");
  const [city,       setCity]       = useState("");
  const [lat,        setLat]        = useState(null);
  const [lng,        setLng]        = useState(null);
  const [openTime,   setOpenTime]   = useState("09:00");
  const [closeTime,  setCloseTime]  = useState("21:00");
  const [closedDays, setClosedDays] = useState(["Sunday"]);
  const [services,   setServices]   = useState([]);

  useEffect(() => {
    if (!garage) return;
    setGarageName(garage.garage_name || "");
    setPhone(garage.phone || "");
    setAddress(garage.address || "");
    setCity(garage.city || "");
    setLat(garage.lat || null);
    setLng(garage.lng || null);
    setOpenTime(garage.working_hours?.open  || "09:00");
    setCloseTime(garage.working_hours?.close || "21:00");
    setClosedDays(garage.working_hours?.closed_days || ["Sunday"]);
    setServices(garage.services || []);
  }, [garage]);

  function captureLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setLocating(false); },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function toggleDay(day) {
    setClosedDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  }

  function toggleService(s) {
    setServices((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from("portal_garages").update({
      garage_name:   garageName.trim(),
      phone:         phone.trim(),
      address:       address.trim(),
      city:          city.trim(),
      lat:           lat || null,
      lng:           lng || null,
      services,
      working_hours: { open: openTime, close: closeTime, closed_days: closedDays },
      updated_at:    new Date().toISOString(),
    }).eq("id", garage.id);
    await refreshGarage();
    setSaving(false);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 3000);
  }

  if (!garage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9fe]">
        <div className="h-8 w-8 rounded-full border-4 border-[#0056b7] border-t-transparent animate-spin" />
      </div>
    );
  }

  const inputCls = "w-full rounded-xl border border-[#c2c6d8] bg-[#f3f3f8] py-3 px-4 text-[#1a1c1f] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#0056b7] focus:bg-white focus:ring-2 focus:ring-[#0056b7]/10 min-h-[44px]";

  return (
    <div className="flex min-h-screen flex-col bg-[#f9f9fe]">

      <div style={{ paddingTop: 64 }}>
        <div className="mx-auto max-w-sm px-4 pt-6 pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-black text-[#0056b7]">
                {garage.garage_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#727687]">Partner Profile</p>
                <h1 className="mt-0.5 text-xl font-bold text-[#1a1c1f]">{garage.garage_name}</h1>
                <p className="text-sm text-[#727687]">{garage.address}{garage.city ? `, ${garage.city}` : ""}</p>
                <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Active Partner
                </div>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex h-10 items-center gap-1.5 rounded-full bg-[#f3f3f8] px-3 text-xs font-semibold text-[#424656] transition-colors duration-150 hover:bg-[#ededf2] active:scale-95"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: "max(96px, calc(env(safe-area-inset-bottom) + 96px))" }}
      >
        <div className="mx-auto max-w-sm px-4 pt-6 space-y-4">

          {/* Saved banner */}
          {saved && (
            <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Profile saved successfully
            </div>
          )}

          {/* Edit / Save / Cancel controls */}
          <div className="flex justify-end gap-2">
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="min-h-[40px] rounded-xl border border-[#c2c6d8]/30 px-4 text-sm font-semibold text-[#424656] transition-colors duration-150 hover:bg-[#f3f3f8] active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  aria-busy={saving}
                  className="flex min-h-[40px] items-center gap-2 rounded-xl bg-[#0056b7] px-4 text-sm font-bold text-white transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                >
                  {saving ? (
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  )}
                  {saving ? "Saving…" : "Save"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex min-h-[40px] items-center gap-2 rounded-xl border border-[#c2c6d8]/30 bg-white px-4 text-sm font-semibold text-[#424656] transition-colors duration-150 hover:bg-[#f3f3f8] active:scale-95"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit Profile
              </button>
            )}
          </div>

          {/* ── Basic Info ── */}
          <Card title="Basic Information">
            <InfoRow icon={<IcBuilding />} label="Garage Name">
              {editing ? (
                <input value={garageName} onChange={(e) => setGarageName(e.target.value)} style={{ fontSize: 16 }} className={inputCls} />
              ) : (
                <span className="text-sm font-semibold text-[#1a1c1f]">{garageName || "—"}</span>
              )}
            </InfoRow>
            <InfoRow icon={<IcPhone />} label="Phone">
              {editing ? (
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" style={{ fontSize: 16 }} className={inputCls} />
              ) : (
                <a href={`tel:${phone}`} className="text-sm font-semibold text-[#0056b7]">{phone || "—"}</a>
              )}
            </InfoRow>
            <InfoRow icon={<IcPin />} label="Address">
              {editing ? (
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street / Area" style={{ fontSize: 16 }} className={inputCls} />
              ) : (
                <span className="text-sm text-[#424656]">{address || "—"}</span>
              )}
            </InfoRow>
            <InfoRow icon={<IcPin />} label="City">
              {editing ? (
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" style={{ fontSize: 16 }} className={inputCls} />
              ) : (
                <span className="text-sm text-[#424656]">{city || "—"}</span>
              )}
            </InfoRow>
            <InfoRow icon={<IcNav />} label="Garage Location">
              {editing ? (
                <div className="flex flex-wrap items-center gap-2">
                  {lat && lng ? (
                    <span className="rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                      {lat.toFixed(5)}, {lng.toFixed(5)}
                    </span>
                  ) : (
                    <span className="text-xs text-[#727687]">Not set — SOS distance won't work</span>
                  )}
                  <button
                    type="button"
                    onClick={captureLocation}
                    disabled={locating}
                    className="flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#0056b7] px-3 text-xs font-bold text-[#0056b7] transition-colors duration-150 hover:bg-blue-50 active:scale-95 disabled:opacity-60"
                  >
                    {locating ? (
                      <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0056b7" strokeWidth="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                    )}
                    {locating ? "Getting…" : lat ? "Re-capture" : "Use My Location"}
                  </button>
                </div>
              ) : (
                <span className="text-sm text-[#424656]">
                  {lat && lng ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : <span className="text-[#727687]">Not set</span>}
                </span>
              )}
            </InfoRow>
          </Card>

          {/* ── Working Hours ── */}
          <Card title="Working Hours">
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[#727687]">Opens at</p>
                {editing ? (
                  <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} style={{ fontSize: 16 }} className={inputCls} />
                ) : (
                  <p className="text-sm font-bold text-[#1a1c1f]">{openTime}</p>
                )}
              </div>
              <div className="flex-1">
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[#727687]">Closes at</p>
                {editing ? (
                  <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} style={{ fontSize: 16 }} className={inputCls} />
                ) : (
                  <p className="text-sm font-bold text-[#1a1c1f]">{closeTime}</p>
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#727687]">Closed on</p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const closed = closedDays.includes(day);
                  return editing ? (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`min-h-[36px] rounded-full border px-3 py-1 text-xs font-semibold transition-colors duration-150 ${
                        closed ? "border-red-200 bg-red-100 text-red-700" : "border-[#c2c6d8]/30 bg-[#f3f3f8] text-[#424656] hover:border-[#c2c6d8]"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ) : (
                    <span key={day} className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      closed ? "bg-red-100 text-red-700" : "bg-green-50 text-green-700"
                    }`}>
                      {day.slice(0, 3)}
                    </span>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* ── Services ── */}
          <Card title="Services Offered">
            <div className="grid grid-cols-2 gap-2">
              {SERVICES_LIST.map((s) => {
                const active = services.includes(s);
                return editing ? (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleService(s)}
                    className={`flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold text-left transition-colors duration-150 ${
                      active
                        ? "border-[#0056b7] bg-[#0056b7]/10 text-[#0056b7]"
                        : "border-[#c2c6d8]/30 bg-[#f3f3f8] text-[#424656] hover:border-[#c2c6d8]"
                    }`}
                  >
                    {active && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                    {s}
                  </button>
                ) : active ? (
                  <div key={s} className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2.5 text-xs font-semibold text-[#0056b7]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    {s}
                  </div>
                ) : null;
              })}
            </div>
            {!editing && services.length === 0 && (
              <p className="py-4 text-center text-sm text-[#727687]">No services added. Tap Edit Profile to add.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card">
      <div className="border-b border-[#c2c6d8]/30 px-5 py-3.5">
        <p className="text-sm font-black text-[#1a1c1f]">{title}</p>
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </div>
  );
}

function InfoRow({ icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="mb-0.5 text-xs text-[#727687]">{label}</p>
        {children}
      </div>
    </div>
  );
}
