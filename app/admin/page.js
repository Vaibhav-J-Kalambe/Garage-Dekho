"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Plus, Trash2, CheckCircle2, Lock, ImageIcon, ArrowLeft, ClipboardList, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20";

function Section({ title, children }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card space-y-4">
      <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}{required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const EMPTY_FORM = {
  name: "", speciality: "", vehicle_type: "4-Wheeler",
  address: "", phone: "", lat: "", lng: "", distance: "",
  image: "", open_hours: "9:00 AM – 7:00 PM",
  is_open: true, wait_time: "~15 min",
  rating: "", reviews: "0", experience: "", vehicles_served: "0",
  verified: false, about: "",
};

export default function AdminPage() {
  const [password, setPassword]   = useState("");
  const [adminPw,  setAdminPw]    = useState(() =>
    typeof window !== "undefined" ? sessionStorage.getItem("admin_pw") || "" : ""
  );
  const [authed, setAuthed]       = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("admin_authed") === "1" && !!sessionStorage.getItem("admin_pw");
  });
  const [tab, setTab]             = useState("applications"); // "applications" | "add"
  const [form, setForm]           = useState(EMPTY_FORM);
  const [services, setServices]   = useState([{ name: "", price: "", duration: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState(null);

  // Applications tab state
  const [applications, setApplications]   = useState([]);
  const [appsLoading,  setAppsLoading]    = useState(false);
  const [expanded,     setExpanded]       = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // id being actioned
  const [imageOverrides, setImageOverrides] = useState({}); // id → image URL

  useEffect(() => {
    if (authed && tab === "applications") fetchApplications();
  }, [authed, tab]);

  async function fetchApplications() {
    setAppsLoading(true);
    const { data } = await supabase
      .from("garage_applications")
      .select("*")
      .order("submitted_at", { ascending: false });
    setApplications(data ?? []);
    setAppsLoading(false);
  }

  async function handleAction(id, action) {
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/approve-garage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPw,
        },
        body: JSON.stringify({
          id,
          action,
          overrides: action === "approve" ? { image: imageOverrides[id] || "" } : {},
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      fetchApplications();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  /* ── Password gate — verified server-side ── */
  async function handleLogin() {
    setError(null);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.ok) { setAuthed(true); setAdminPw(password); sessionStorage.setItem("admin_authed", "1"); sessionStorage.setItem("admin_pw", password); }
      else setError(data.error || "Incorrect password. Try again.");
    } catch {
      setError("Could not verify password. Please try again.");
    }
  }

  /* ── Form helpers ── */
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  function addService()            { setServices((s) => [...s, { name: "", price: "", duration: "" }]); }
  function removeService(i)        { setServices((s) => s.filter((_, idx) => idx !== i)); }
  function editService(i, k, v)    { setServices((s) => s.map((svc, idx) => idx === i ? { ...svc, [k]: v } : svc)); }

  /* ── Submit ── */
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      ...form,
      lat:              parseFloat(form.lat)            || null,
      lng:              parseFloat(form.lng)            || null,
      rating:           parseFloat(form.rating)         || 0,
      reviews:          parseInt(form.reviews)          || 0,
      experience:       parseInt(form.experience)       || 0,
      vehicles_served:  parseInt(form.vehicles_served)  || 0,
      services:         services.filter((s) => s.name.trim()),
      reviews_list:     [],
    };

    const { error: sbError } = await supabase.from("garages").insert(payload);

    if (sbError) {
      setError(sbError.message);
    } else {
      setSuccess(true);
      setForm(EMPTY_FORM);
      setServices([{ name: "", price: "", duration: "" }]);
      setTimeout(() => setSuccess(false), 4000);
    }
    setSubmitting(false);
  }

  /* ── Password screen ── */
  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Admin Panel</h1>
          <p className="mt-1 text-sm text-slate-400">GarageDekho · Garage Management</p>

          <div className="mt-6 rounded-2xl bg-white p-5 shadow-card space-y-3">
            {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Enter admin password"
              className={inputCls}
              autoFocus
            />
            <button
              type="button"
              onClick={handleLogin}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:brightness-110 active:scale-[0.98]"
            >
              Login
            </button>
          </div>
          <p className="mt-4 text-center text-xs text-slate-400">
            Password is set via <code>ADMIN_PASSWORD</code> server env var
          </p>
        </div>
      </div>
    );
  }

  /* ── Admin form ── */
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-xs text-slate-400">GarageDekho Admin</p>
              <p className="text-sm font-black text-slate-900">Dashboard</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setAuthed(false); sessionStorage.removeItem("admin_authed"); sessionStorage.removeItem("admin_pw"); }}
            className="text-xs font-semibold text-slate-400 hover:text-red-500"
          >
            Logout
          </button>
        </div>
        {/* Tabs */}
        <div className="mx-auto mt-3 flex max-w-2xl gap-1">
          <button
            onClick={() => setTab("applications")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${tab === "applications" ? "bg-primary text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Applications
            {applications.filter(a => a.status === "pending").length > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                {applications.filter(a => a.status === "pending").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("add")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${tab === "add" ? "bg-primary text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Garage
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 pb-24">

        {/* ── APPLICATIONS TAB ── */}
        {tab === "applications" && (
          <div className="space-y-3">
            {appsLoading && (
              <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-400 shadow-card">Loading applications…</div>
            )}
            {!appsLoading && applications.length === 0 && (
              <div className="rounded-2xl bg-white p-8 text-center shadow-card">
                <ClipboardList className="mx-auto h-8 w-8 text-slate-200 mb-2" />
                <p className="text-sm font-semibold text-slate-400">No applications yet</p>
                <p className="text-xs text-slate-300 mt-1">Garage owners who apply via /partner will appear here</p>
              </div>
            )}
            {applications.map((app) => (
              <div key={app.id} className="rounded-2xl bg-white shadow-card overflow-hidden">
                {/* Application header */}
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                      app.status === "pending"  ? "bg-amber-400" :
                      app.status === "approved" ? "bg-green-500" : "bg-red-400"
                    }`} />
                    <div>
                      <p className="text-sm font-black text-slate-900">{app.garage_name}</p>
                      <p className="text-xs text-slate-400">{app.owner_name} · {app.city} · {new Date(app.submitted_at).toLocaleDateString("en-IN")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                      app.status === "pending"  ? "bg-amber-50 text-amber-600" :
                      app.status === "approved" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                    }`}>{app.status}</span>
                    {expanded === app.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </button>

                {/* Expanded details */}
                {expanded === app.id && (
                  <div className="border-t border-slate-100 px-5 py-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        ["Phone",       app.phone],
                        ["WhatsApp",    app.whatsapp || "—"],
                        ["Email",       app.email || "—"],
                        ["Speciality",  app.speciality],
                        ["Experience",  app.experience],
                        ["Vehicle Types", app.vehicle_types],
                        ["Hours",       app.open_hours],
                        ["Address",     app.address],
                        ["GPS",         app.lat ? app.lat + ", " + app.lng : "Not captured"],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">{label}</p>
                          <p className="text-slate-700 mt-0.5 break-all">{value}</p>
                        </div>
                      ))}
                    </div>

                    {app.about && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">About</p>
                        <p className="text-xs text-slate-600 mt-0.5">{app.about}</p>
                      </div>
                    )}

                    {app.services?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Services</p>
                        <div className="space-y-1">
                          {app.services.map((s, i) => (
                            <div key={i} className="flex justify-between rounded-xl bg-slate-50 px-3 py-1.5 text-xs">
                              <span className="font-semibold text-slate-700">{s.name}</span>
                              <span className="font-black text-primary">{s.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Image URL for approval */}
                    {app.status === "pending" && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Garage Image URL (optional)</p>
                        <input
                          type="text"
                          value={imageOverrides[app.id] || ""}
                          onChange={(e) => setImageOverrides((prev) => ({ ...prev, [app.id]: e.target.value }))}
                          placeholder="https://images.pexels.com/…"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:border-primary focus:outline-none"
                        />
                      </div>
                    )}

                    {/* Action buttons */}
                    {app.status === "pending" && (
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleAction(app.id, "approve")}
                          disabled={actionLoading === app.id}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-500 py-2.5 text-xs font-black text-white transition hover:bg-green-600 disabled:opacity-60"
                        >
                          {actionLoading === app.id ? "Processing…" : <><Check className="h-3.5 w-3.5" /> Approve & Go Live</>}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction(app.id, "reject")}
                          disabled={actionLoading === app.id}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-black text-red-500 transition hover:bg-red-100 disabled:opacity-60"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    )}
                    {app.status === "approved" && (
                      <p className="text-xs font-bold text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> This garage is live on the website
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── ADD GARAGE TAB ── */}
        {tab === "add" && (
          <div className="space-y-4">
            {success && (
              <div className="flex items-center gap-3 rounded-2xl bg-green-50 p-4 text-green-700 shadow-card">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p className="text-sm font-bold">Garage added! It is now live on the website.</p>
              </div>
            )}
            {error && (
              <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-600 shadow-card">
                <strong>Error:</strong> {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Basic Info ── */}
          <Section title="Basic Information">
            <Field label="Garage Name" required>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Prime Auto Care" required className={inputCls} />
            </Field>
            <Field label="Speciality">
              <input value={form.speciality} onChange={(e) => set("speciality", e.target.value)} placeholder="e.g. AC Repair Specialist" className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Vehicle Type">
                <select value={form.vehicle_type} onChange={(e) => set("vehicle_type", e.target.value)} className={inputCls}>
                  <option>4-Wheeler</option>
                  <option>2-Wheeler</option>
                  <option>All Vehicles</option>
                  <option>EV</option>
                </select>
              </Field>
              <Field label="Phone Number">
                <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
              </Field>
            </div>
            <Field label="Full Address">
              <textarea value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Shop No., Street, Area, City" rows={2} className={inputCls} />
            </Field>
            <Field label="About / Description">
              <textarea value={form.about} onChange={(e) => set("about", e.target.value)} placeholder="Brief description of the garage, specialities, experience..." rows={3} className={inputCls} />
            </Field>
          </Section>

          {/* ── Location ── */}
          <Section title="Location">
            <p className="text-xs text-slate-400">
              Open Google Maps → long press on the garage location → copy the coordinates shown at the bottom.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Latitude">
                <input type="number" step="any" value={form.lat} onChange={(e) => set("lat", e.target.value)} placeholder="18.5362" className={inputCls} />
              </Field>
              <Field label="Longitude">
                <input type="number" step="any" value={form.lng} onChange={(e) => set("lng", e.target.value)} placeholder="73.8939" className={inputCls} />
              </Field>
            </div>
            <Field label="Distance (approximate from city center)">
              <input value={form.distance} onChange={(e) => set("distance", e.target.value)} placeholder="e.g. 1.2 km" className={inputCls} />
            </Field>
          </Section>

          {/* ── Hours & Status ── */}
          <Section title="Hours & Status">
            <Field label="Opening Hours">
              <input value={form.open_hours} onChange={(e) => set("open_hours", e.target.value)} placeholder="9:00 AM – 7:00 PM" className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Currently Open?">
                <select value={String(form.is_open)} onChange={(e) => set("is_open", e.target.value === "true")} className={inputCls}>
                  <option value="true">Open</option>
                  <option value="false">Closed</option>
                </select>
              </Field>
              <Field label="Average Wait Time">
                <input value={form.wait_time} onChange={(e) => set("wait_time", e.target.value)} placeholder="~15 min" className={inputCls} />
              </Field>
            </div>
          </Section>

          {/* ── Ratings & Stats ── */}
          <Section title="Ratings & Stats">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Rating (0.0 – 5.0)">
                <input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => set("rating", e.target.value)} placeholder="4.5" className={inputCls} />
              </Field>
              <Field label="No. of Reviews">
                <input type="number" value={form.reviews} onChange={(e) => set("reviews", e.target.value)} placeholder="0" className={inputCls} />
              </Field>
              <Field label="Years in Business">
                <input type="number" value={form.experience} onChange={(e) => set("experience", e.target.value)} placeholder="5" className={inputCls} />
              </Field>
              <Field label="Vehicles Served">
                <input type="number" value={form.vehicles_served} onChange={(e) => set("vehicles_served", e.target.value)} placeholder="500" className={inputCls} />
              </Field>
            </div>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input type="checkbox" checked={form.verified} onChange={(e) => set("verified", e.target.checked)} className="h-4 w-4 accent-primary" />
              <span className="text-sm font-semibold text-slate-700">Mark as Verified Garage</span>
            </label>
          </Section>

          {/* ── Image ── */}
          <Section title="Garage Photo">
            <Field label="Image URL">
              <input value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="https://images.pexels.com/..." className={inputCls} />
            </Field>
            {form.image ? (
              <img src={form.image} alt="Preview" className="h-36 w-full rounded-xl object-cover" />
            ) : (
              <div className="flex h-24 w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-200">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-6 w-6 text-slate-300" />
                  <p className="mt-1 text-xs text-slate-400">Paste an image URL above to preview</p>
                </div>
              </div>
            )}
            <p className="text-[11px] text-slate-400">
              Tip: Search the garage on Google Images → right-click an image → "Copy image address"
            </p>
          </Section>

          {/* ── Services ── */}
          <Section title="Services & Pricing">
            <p className="text-xs text-slate-400">Add each service offered with price and estimated time.</p>
            <div className="space-y-2">
              <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 px-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Service</span>
                <span className="text-[10px] font-bold uppercase text-slate-400">Price</span>
                <span className="text-[10px] font-bold uppercase text-slate-400">Duration</span>
                <span />
              </div>
              {services.map((svc, i) => (
                <div key={i} className="grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-2">
                  <input value={svc.name} onChange={(e) => editService(i, "name", e.target.value)} placeholder="e.g. Oil Change" className={inputCls} />
                  <input value={svc.price} onChange={(e) => editService(i, "price", e.target.value)} placeholder="₹499" className={inputCls} />
                  <input value={svc.duration} onChange={(e) => editService(i, "duration", e.target.value)} placeholder="30 min" className={inputCls} />
                  <button type="button" onClick={() => removeService(i)} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-400 transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addService} className="flex items-center gap-1.5 text-sm font-bold text-primary transition hover:text-primary/80">
              <Plus className="h-4 w-4" />
              Add Another Service
            </button>
          </Section>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !form.name}
            className="w-full rounded-2xl bg-primary py-4 text-sm font-bold text-white shadow-card-hover transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? "Adding Garage…" : "Add Garage to Website"}
          </button>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}
