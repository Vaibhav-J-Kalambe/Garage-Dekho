"use client";

import { useState, useEffect } from "react";
import {
  Building2, Phone, MapPin, Clock, CheckCircle2,
  Loader2, LogOut, Save, Pencil, Navigation,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { usePortalAuth } from "../../../context/PortalAuthContext";

const SERVICES_LIST = [
  "Tyre Service", "Battery Replacement", "Engine Repair", "Oil Change",
  "Brake Service", "AC Repair", "Body Work", "Wheel Alignment",
  "Suspension", "Electricals", "General Repair", "Accident Repair",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function PortalProfilePage() {
  const { garage, portalUser, signOut, refreshGarage } = usePortalAuth();

  const [editing,    setEditing]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);

  const [garageName, setGarageName] = useState("");
  const [phone,      setPhone]      = useState("");
  const [address,    setAddress]    = useState("");
  const [city,       setCity]       = useState("");
  const [lat,        setLat]        = useState(null);
  const [lng,        setLng]        = useState(null);
  const [locating,   setLocating]   = useState(false);
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
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function toggleDay(day) {
    setClosedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function toggleService(s) {
    setServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-[#0056D2] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      {/* Header */}
      <div className="bg-[#0F172A] px-5 pt-5 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-black text-white">{garage.garage_name}</h1>
            <p className="text-xs text-slate-400">{portalUser?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-white/30 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>

        {/* Garage avatar */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0056D2] text-2xl font-black text-white shadow-[0_8px_24px_rgba(0,86,210,0.4)]">
            {garage.garage_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-black text-white">{garage.garage_name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{garage.address}, {garage.city}</p>
            <div className="mt-1 flex items-center gap-1 text-xs text-green-400 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Active Partner
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {saved && (
          <div className="flex items-center gap-2 rounded-2xl bg-green-50 border border-green-200 px-4 py-3 text-sm font-semibold text-green-700">
            <CheckCircle2 className="h-4 w-4" /> Profile saved successfully
          </div>
        )}

        {/* Edit / Save toggle */}
        <div className="flex justify-end">
          {editing ? (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-[#0056D2] px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4" /> Edit Profile
            </button>
          )}
        </div>

        {/* Basic Info */}
        <Card title="Basic Information">
          <InfoRow icon={Building2} label="Garage Name">
            {editing ? (
              <input value={garageName} onChange={(e) => setGarageName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20 transition" />
            ) : (
              <span className="text-sm font-semibold text-slate-900">{garageName}</span>
            )}
          </InfoRow>
          <InfoRow icon={Phone} label="Phone">
            {editing ? (
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20 transition" />
            ) : (
              <a href={`tel:${phone}`} className="text-sm font-semibold text-[#0056D2]">{phone || "—"}</a>
            )}
          </InfoRow>
          <InfoRow icon={MapPin} label="Address">
            {editing ? (
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street / Area" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20 transition" />
            ) : (
              <span className="text-sm text-slate-700">{address || "—"}</span>
            )}
          </InfoRow>
          <InfoRow icon={MapPin} label="City">
            {editing ? (
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20 transition" />
            ) : (
              <span className="text-sm text-slate-700">{city || "—"}</span>
            )}
          </InfoRow>

          {/* Location */}
          <InfoRow icon={Navigation} label="Garage Location">
            {editing ? (
              <div className="flex items-center gap-2 flex-wrap">
                {lat && lng ? (
                  <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                    {lat.toFixed(5)}, {lng.toFixed(5)}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Not set — SOS distance won't work</span>
                )}
                <button
                  type="button"
                  onClick={captureLocation}
                  disabled={locating}
                  className="flex items-center gap-1.5 rounded-lg border border-[#0056D2] px-3 py-1.5 text-xs font-bold text-[#0056D2] hover:bg-blue-50 transition disabled:opacity-60"
                >
                  {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />}
                  {locating ? "Getting…" : lat ? "Re-capture" : "Use My Location"}
                </button>
              </div>
            ) : (
              <span className="text-sm text-slate-700">
                {lat && lng ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : <span className="text-slate-400">Not set</span>}
              </span>
            )}
          </InfoRow>
        </Card>

        {/* Working Hours */}
        <Card title="Working Hours">
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Opens at</p>
              {editing ? (
                <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20 transition" />
              ) : (
                <p className="text-sm font-bold text-slate-900">{openTime}</p>
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Closes at</p>
              {editing ? (
                <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20 transition" />
              ) : (
                <p className="text-sm font-bold text-slate-900">{closeTime}</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-2">Closed on</p>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const closed = closedDays.includes(day);
                return editing ? (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      closed ? "bg-red-100 text-red-700 border border-red-200" : "bg-slate-100 text-slate-600 border border-slate-200"
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

        {/* Services */}
        <Card title="Services Offered">
          <div className="grid grid-cols-2 gap-2">
            {SERVICES_LIST.map((s) => {
              const active = services.includes(s);
              return editing ? (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleService(s)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-left transition border ${
                    active
                      ? "bg-[#0056D2]/10 border-[#0056D2] text-[#0056D2]"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  {active && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                  {s}
                </button>
              ) : active ? (
                <div key={s} className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-xs font-semibold text-[#0056D2]">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {s}
                </div>
              ) : null;
            })}
          </div>
          {!editing && services.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">No services added. Tap Edit Profile to add.</p>
          )}
        </Card>
      </div>

    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-black text-slate-900">{title}</p>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  );
}
