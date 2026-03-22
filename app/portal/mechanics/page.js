"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Phone, Wrench, X, Loader2, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { usePortalAuth } from "../../../context/PortalAuthContext";

const SPECIALIZATIONS = [
  "General", "Tyre Specialist", "Electricals", "Engine Repair",
  "Body Work", "AC Specialist", "Brakes", "Suspension",
];

const STATUS_STYLES = {
  available: "bg-green-100 text-green-700",
  busy:      "bg-red-100 text-red-700",
  offline:   "bg-slate-100 text-slate-500",
};

export default function PortalMechanicsPage() {
  const { garage } = usePortalAuth();
  const [mechanics, setMechanics] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState(null); // mechanic row being edited
  const [saving,    setSaving]    = useState(false);
  const [deleting,       setDeleting]       = useState(null);
  const [confirmDelete,  setConfirmDelete]  = useState(null); // mechanic id awaiting confirm

  // Form state
  const [name,   setName]   = useState("");
  const [phone,  setPhone]  = useState("");
  const [spec,   setSpec]   = useState("General");

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

  // ── Add / Edit form
  if (showForm) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-100 pb-24">
        <div className="bg-[#0F172A] px-5 pt-5 pb-5">
          <button onClick={() => setShowForm(false)} className="mb-3 flex items-center gap-2 text-sm text-slate-400">
            <X className="h-4 w-4" /> Cancel
          </button>
          <h1 className="text-lg font-black text-white">{editing ? "Edit Mechanic" : "Add Mechanic"}</h1>
        </div>

        <div className="px-4 pt-5 space-y-4">
          <Field label="Full Name">
            <input
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Suresh Kumar"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20 transition"
            />
          </Field>

          <Field label="Phone Number">
            <input
              type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20 transition"
            />
          </Field>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-wide text-slate-500">Specialization</label>
            <div className="grid grid-cols-2 gap-2">
              {SPECIALIZATIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpec(s)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold text-left transition ${
                    spec === s
                      ? "border-[#0056D2] bg-[#0056D2]/10 text-[#0056D2]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {spec === s && <CheckCircle2 className="inline h-3.5 w-3.5 mr-1.5" />}
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#0056D2] py-4 text-base font-black text-white shadow-[0_8px_24px_rgba(0,86,210,0.3)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
            {saving ? "Saving…" : editing ? "Save Changes" : "Add Mechanic"}
          </button>
        </div>

      </div>
    );
  }

  // ── Main list
  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      {/* Header */}
      <div className="bg-[#0F172A] px-5 pt-5 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-white">My Team</h1>
            <p className="text-xs text-slate-400 mt-0.5">{mechanics.length} mechanic{mechanics.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-xl bg-[#0056D2] px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 rounded-full border-4 border-[#0056D2] border-t-transparent animate-spin" />
          </div>
        ) : mechanics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 mb-4">
              <Users className="h-8 w-8 text-slate-400" />
            </div>
            <p className="font-bold text-slate-600">No mechanics yet</p>
            <p className="text-sm text-slate-400 mt-1">Add your team to dispatch them for SOS jobs</p>
            <button
              onClick={openAdd}
              className="mt-5 flex items-center gap-2 rounded-xl bg-[#0056D2] px-5 py-2.5 text-sm font-bold text-white"
            >
              <Plus className="h-4 w-4" /> Add First Mechanic
            </button>
          </div>
        ) : (
          mechanics.map((m) => (
            <div key={m.id} className="rounded-2xl bg-white shadow-sm p-4">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0056D2] text-lg font-black text-white shrink-0">
                  {m.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900">{m.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Wrench className="h-3 w-3" /> {m.specialization}
                    </span>
                    {m.phone && (
                      <a
                        href={`tel:${m.phone}`}
                        className="flex items-center gap-1 text-xs text-[#0056D2]"
                      >
                        <Phone className="h-3 w-3" /> {m.phone}
                      </a>
                    )}
                  </div>
                </div>

                {/* Status badge (tap to cycle) */}
                <button
                  onClick={() => cycleStatus(m)}
                  className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${STATUS_STYLES[m.status]}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    m.status === "available" ? "bg-green-500" :
                    m.status === "busy"      ? "bg-red-500" : "bg-slate-400"
                  }`} />
                  {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                </button>
              </div>

              {/* Actions */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                {confirmDelete === m.id ? (
                  <div className="flex items-center gap-2">
                    <p className="flex-1 text-xs font-semibold text-slate-600">Remove {m.name}?</p>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      disabled={deleting === m.id}
                      className="flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 transition disabled:opacity-60"
                    >
                      {deleting === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Yes, Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(m)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => setConfirmDelete(m.id)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</label>
      {children}
    </div>
  );
}
