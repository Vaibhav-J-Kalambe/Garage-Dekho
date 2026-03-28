"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { usePortalAuth } from "../../../context/PortalAuthContext";

const SPECIALIZATIONS = [
  "General", "Tyre Specialist", "Electricals", "Engine Repair",
  "Body Work", "AC Specialist", "Brakes", "Suspension",
];

const STATUS_STYLES = {
  available: "bg-green-100 text-green-700",
  busy:      "bg-red-100 text-red-700",
  offline:   "bg-[#f3f3f8] text-[#727687]",
};

const STATUS_DOT = {
  available: "bg-green-500",
  busy:      "bg-red-500",
  offline:   "bg-[#727687]",
};

export default function PortalMechanicsPage() {
  const { garage } = usePortalAuth();
  const [mechanics, setMechanics] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [deleting,      setDeleting]      = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [name,  setName]  = useState("");
  const [phone, setPhone] = useState("");
  const [spec,  setSpec]  = useState("General");

  useEffect(() => {
    if (!garage) return;
    fetchMechanics();
  }, [garage]);

  async function fetchMechanics() {
    setLoading(true);
    const { data } = await supabase
      .from("portal_mechanics")
      .select("*")
      .eq("portal_garage_id", garage.id)
      .order("name");
    setMechanics(data || []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setName(""); setPhone(""); setSpec("General");
    setShowForm(true);
  }

  function openEdit(m) {
    setEditing(m);
    setName(m.name); setPhone(m.phone || ""); setSpec(m.specialization || "General");
    setShowForm(true);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    if (editing) {
      await supabase.from("portal_mechanics").update({
        name: name.trim(), phone: phone.trim(), specialization: spec,
      }).eq("id", editing.id);
    } else {
      await supabase.from("portal_mechanics").insert({
        portal_garage_id: garage.id,
        name: name.trim(), phone: phone.trim(), specialization: spec,
      });
    }
    setSaving(false);
    setShowForm(false);
    fetchMechanics();
  }

  async function handleDelete(id) {
    setDeleting(id);
    setConfirmDelete(null);
    await supabase.from("portal_mechanics").delete().eq("id", id);
    setDeleting(null);
    fetchMechanics();
  }

  async function cycleStatus(m) {
    const next = { available: "busy", busy: "offline", offline: "available" };
    await supabase.from("portal_mechanics").update({ status: next[m.status] }).eq("id", m.id);
    fetchMechanics();
  }

  // ── Add / Edit form ──────────────────────────────────────────────────────────
  if (showForm) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f9f9fe]">

        <div style={{ paddingTop: 64 }}>
          <div className="mx-auto max-w-sm px-4 pt-6 pb-2">
            <button
              onClick={() => setShowForm(false)}
              aria-label="Cancel"
              className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f3f8] text-[#424656] transition-colors duration-150 hover:bg-[#ededf2] active:scale-95"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#727687]">Team</p>
            <h1 className="mt-1 text-[2rem] font-bold tracking-tight text-[#1a1c1f]">{editing ? "Edit Mechanic" : "Add Mechanic"}</h1>
            <p className="mt-1 text-sm text-[#727687]">{editing ? "Update team member details" : "Add a new team member"}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div
            className="mx-auto w-full max-w-sm px-4 py-8"
            style={{ paddingBottom: "max(40px, calc(env(safe-area-inset-bottom) + 40px))" }}
          >
            <div className="rounded-3xl bg-white p-6 shadow-card space-y-5">

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="mech-name" className="text-xs font-bold uppercase tracking-wide text-[#727687]">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="mech-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Suresh Kumar"
                  autoComplete="name"
                  style={{ fontSize: 16 }}
                  className="w-full rounded-xl border border-[#c2c6d8] bg-[#f3f3f8] py-3 px-4 text-[#1a1c1f] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#0056b7] focus:bg-white focus:ring-2 focus:ring-[#0056b7]/10 min-h-[44px]"
                />
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="mech-phone" className="text-xs font-bold uppercase tracking-wide text-[#727687]">
                  Phone Number
                </label>
                <input
                  id="mech-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  style={{ fontSize: 16 }}
                  className="w-full rounded-xl border border-[#c2c6d8] bg-[#f3f3f8] py-3 px-4 text-[#1a1c1f] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#0056b7] focus:bg-white focus:ring-2 focus:ring-[#0056b7]/10 min-h-[44px]"
                />
              </div>

              {/* Specialization */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wide text-[#727687]">Specialization</label>
                <div className="grid grid-cols-2 gap-2">
                  {SPECIALIZATIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSpec(s)}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-semibold text-left transition-colors duration-150 min-h-[44px] ${
                        spec === s
                          ? "border-[#0056b7] bg-[#0056b7]/10 text-[#0056b7]"
                          : "border-[#c2c6d8]/30 bg-[#f3f3f8] text-[#424656] hover:border-[#c2c6d8]"
                      }`}
                    >
                      {spec === s && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                aria-busy={saving}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0056b7] text-sm font-bold text-white shadow-glow-primary transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              >
                {saving ? (
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
                {saving ? "Saving…" : editing ? "Save Changes" : "Add Mechanic"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main list ────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-[#f9f9fe]">

      <div style={{ paddingTop: 64 }}>
        <div className="mx-auto max-w-sm px-4 pt-6 pb-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#727687]">Portal</p>
          <h1 className="mt-1 text-[2rem] font-bold tracking-tight text-[#1a1c1f]">My Team</h1>
          <p className="mt-1 text-sm text-[#727687]">
            {loading ? "Loading…" : `${mechanics.length} mechanic${mechanics.length !== 1 ? "s" : ""}`}
            {!loading && mechanics.length > 0 && " · Tap status to cycle"}
          </p>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: "max(96px, calc(env(safe-area-inset-bottom) + 96px))" }}
      >
        <div className="mx-auto max-w-sm px-4 pt-6">

          {/* Add button */}
          <button
            onClick={openAdd}
            className="mb-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0056b7] text-sm font-bold text-white shadow-glow-primary transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Mechanic
          </button>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 rounded-full border-4 border-[#0056b7] border-t-transparent animate-spin" />
            </div>
          ) : mechanics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f3f3f8]">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <p className="font-bold text-[#424656]">No mechanics yet</p>
              <p className="mt-1 text-sm text-[#727687]">Add your team to dispatch them for SOS jobs</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mechanics.map((m) => (
                <div key={m.id} className="rounded-2xl bg-white shadow-card p-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0056b7] text-lg font-black text-white">
                      {m.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[#1a1c1f] truncate">{m.name}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1 text-xs text-[#727687]">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                          </svg>
                          {m.specialization}
                        </span>
                        {m.phone && (
                          <a href={`tel:${m.phone}`} className="flex items-center gap-1 text-xs text-[#0056b7]">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.44 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.12 6.12l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                            </svg>
                            {m.phone}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Status badge — tap to cycle */}
                    <button
                      onClick={() => cycleStatus(m)}
                      aria-label={`Status: ${m.status}. Tap to change.`}
                      className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors duration-150 min-h-[32px] ${STATUS_STYLES[m.status]}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[m.status]}`} />
                      {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 border-t border-[#c2c6d8]/30 pt-3">
                    {confirmDelete === m.id ? (
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-xs font-semibold text-[#424656]">Remove {m.name}?</p>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="min-h-[36px] rounded-lg border border-[#c2c6d8]/30 px-3 text-xs font-semibold text-[#424656] transition-colors duration-150 hover:bg-[#f3f3f8] active:scale-95"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          disabled={deleting === m.id}
                          className="flex min-h-[36px] items-center gap-1 rounded-lg bg-red-500 px-3 text-xs font-bold text-white transition-colors duration-150 hover:bg-red-600 active:scale-95 disabled:opacity-60"
                        >
                          {deleting === m.id ? (
                            <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                            </svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                              <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                          )}
                          Yes, Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(m)}
                          className="flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[#424656] transition-colors duration-150 hover:bg-[#f3f3f8] active:scale-95"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDelete(m.id)}
                          className="flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-red-500 transition-colors duration-150 hover:bg-red-50 active:scale-95"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
