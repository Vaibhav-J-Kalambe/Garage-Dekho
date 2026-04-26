"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2, XCircle, ArrowLeft, RefreshCw,
  MapPin, Phone, Wrench, Clock, CreditCard, Car,
  User, Building2, Mail, MessageSquare, ChevronDown, ChevronUp
} from "lucide-react";

const STATUS_TABS = ["pending", "approved", "rejected"];

const statusStyle = {
  pending:  { bg: "bg-amber-50",  text: "text-amber-600",  border: "border-amber-200",  dot: "bg-amber-400"  },
  approved: { bg: "bg-green-50",  text: "text-green-600",  border: "border-green-200",  dot: "bg-green-500"  },
  rejected: { bg: "bg-red-50",    text: "text-red-500",    border: "border-red-200",    dot: "bg-red-400"    },
};

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#c2c6d8]">{label}</p>
      <p className="text-sm text-[#1a1c1f] font-medium">{value}</p>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="border-t border-[#f0f0f0] px-4 py-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-3.5 w-3.5 text-[#0056b7]" />
        <p className="text-[11px] font-black uppercase tracking-widest text-[#0056b7]">{title}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function RejectReasonDialog({ reason, onChangeReason, acting, onConfirm, onCancel }) {
  return (
    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
      <p className="text-sm font-bold text-red-600 mb-0.5">Reject this garage?</p>
      <p className="text-xs text-red-400 mb-3">Select a reason — garage goes offline and partner is notified.</p>
      <div className="flex flex-col gap-2 mb-3">
        {REJECTION_REASONS.map((r) => (
          <label key={r} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="reject-reason"
              value={r}
              checked={reason === r}
              onChange={() => onChangeReason(r)}
              className="accent-red-500"
            />
            <span className="text-xs font-medium text-[#1a1c1f]">{r}</span>
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onConfirm} disabled={acting}
          className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-bold text-white hover:brightness-110 active:scale-95 transition disabled:opacity-60">
          {acting ? "Rejecting…" : "Yes, Reject"}
        </button>
        <button onClick={onCancel}
          className="flex-1 rounded-xl border border-[#e8e8f0] bg-white py-2 text-sm font-bold text-[#424656] hover:bg-[#f3f3f8] active:scale-95 transition">
          Cancel
        </button>
      </div>
    </div>
  );
}

const REJECTION_REASONS = [
  "Incomplete or incorrect information",
  "Could not verify the business",
  "Duplicate listing",
  "Outside service area",
  "Fraudulent or suspicious listing",
  "Other",
];

function GarageCard({ garage, onAction, acting, onRemove }) {
  const [expanded,      setExpanded]      = useState(false);
  const [confirm,       setConfirm]       = useState(false);
  const [removing,      setRemoving]      = useState(false);
  const [rejectReason,  setRejectReason]  = useState(REJECTION_REASONS[0]);
  const st = statusStyle[garage.status] ?? statusStyle.pending;
  const wh = garage.working_hours || {};
  const closedDays = wh.closed_days || [];
  const allDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="rounded-2xl bg-white border border-[#f0f0f0] shadow-sm overflow-hidden">

      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#d8e2ff]">
            <Building2 className="h-5 w-5 text-[#0056b7]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-base font-black text-[#1a1c1f]">{garage.garage_name}</p>
              <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${st.bg} ${st.text} ${st.border}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                {garage.status}
              </span>
            </div>
            <p className="text-xs text-[#727687] mt-0.5">Owner: {garage.owner_name || "—"}</p>
            <p className="text-xs text-[#424656] mt-1 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-[#c2c6d8]" />
              {[garage.address, garage.city, garage.pincode].filter(Boolean).join(", ")}
            </p>
            <p className="text-[10px] text-[#c2c6d8] mt-1">
              Registered {new Date(garage.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
            {garage.status === "rejected" && garage.rejection_reason && (
              <p className="mt-1.5 text-[11px] font-semibold text-red-400">
                Reason: {garage.rejection_reason}
              </p>
            )}
          </div>
        </div>

        {/* Approve / Reject — pending */}
        {garage.status === "pending" && (
          confirm === "reject" ? (
            <RejectReasonDialog
              reason={rejectReason}
              onChangeReason={setRejectReason}
              acting={acting === garage.id + "rejected"}
              onConfirm={async () => { await onAction(garage.id, "rejected", rejectReason); setConfirm(false); }}
              onCancel={() => setConfirm(false)}
            />
          ) : (
            <div className="flex gap-2 mt-4">
              <button onClick={() => onAction(garage.id, "approved")} disabled={!!acting}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-500 py-2.5 text-sm font-bold text-white hover:brightness-110 active:scale-95 transition disabled:opacity-60">
                {acting === garage.id + "approved"
                  ? <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  : <CheckCircle2 className="h-4 w-4" />}
                Approve & Go Live
              </button>
              <button onClick={() => setConfirm("reject")} disabled={!!acting}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-bold text-red-500 hover:bg-red-100 active:scale-95 transition disabled:opacity-60">
                <XCircle className="h-4 w-4" /> Reject
              </button>
            </div>
          )
        )}

        {/* Approve / Remove buttons for rejected garages */}
        {garage.status === "rejected" && (
          confirm ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-bold text-red-600 mb-0.5">Remove this garage permanently?</p>
              <p className="text-xs text-red-400 mb-2">Deletes all data and the partner's account. Cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={async () => { setRemoving(true); await onRemove(garage.id); setRemoving(false); }}
                  disabled={removing}
                  className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-bold text-white hover:brightness-110 active:scale-95 transition disabled:opacity-60">
                  {removing ? "Removing…" : "Yes, Remove"}
                </button>
                <button onClick={() => setConfirm(false)}
                  className="flex-1 rounded-xl border border-[#e8e8f0] bg-white py-2 text-sm font-bold text-[#424656] hover:bg-[#f3f3f8] active:scale-95 transition">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 mt-4">
              <button onClick={() => onAction(garage.id, "approved")} disabled={!!acting}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-500 py-2.5 text-sm font-bold text-white hover:brightness-110 active:scale-95 transition disabled:opacity-60">
                {acting === garage.id + "approved"
                  ? <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  : <CheckCircle2 className="h-4 w-4" />}
                Approve & Go Live
              </button>
              <button onClick={() => setConfirm("remove")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-bold text-red-500 hover:bg-red-100 active:scale-95 transition">
                <XCircle className="h-4 w-4" /> Remove
              </button>
            </div>
          )
        )}

        {/* Reject / Remove buttons for approved garages */}
        {garage.status === "approved" && (
          confirm === "reject" ? (
            <RejectReasonDialog
              reason={rejectReason}
              onChangeReason={setRejectReason}
              acting={acting === garage.id + "rejected"}
              onConfirm={async () => { await onAction(garage.id, "rejected", rejectReason); setConfirm(false); }}
              onCancel={() => setConfirm(false)}
            />
          ) : confirm === "remove" ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-bold text-red-600 mb-0.5">Remove garage permanently?</p>
              <p className="text-xs text-red-400 mb-2">Deletes all data and the partner's account. Cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={async () => { setRemoving(true); await onRemove(garage.id); setRemoving(false); }}
                  disabled={removing}
                  className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-bold text-white hover:brightness-110 active:scale-95 transition disabled:opacity-60">
                  {removing ? "Removing…" : "Yes, Remove"}
                </button>
                <button onClick={() => setConfirm(false)}
                  className="flex-1 rounded-xl border border-[#e8e8f0] bg-white py-2 text-sm font-bold text-[#424656] hover:bg-[#f3f3f8] active:scale-95 transition">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 mt-4">
              <button onClick={() => setConfirm("reject")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-sm font-bold text-amber-600 hover:bg-amber-100 active:scale-95 transition">
                <XCircle className="h-4 w-4" /> Reject
              </button>
              <button onClick={() => setConfirm("remove")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-bold text-red-500 hover:bg-red-100 active:scale-95 transition">
                <XCircle className="h-4 w-4" /> Remove
              </button>
            </div>
          )
        )}

        {/* Expand toggle */}
        <button onClick={() => setExpanded(v => !v)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#f3f3f8] py-2 text-xs font-bold text-[#424656] hover:bg-[#ededf2] transition active:scale-95">
          {expanded ? <><ChevronUp className="h-3.5 w-3.5" /> Hide Details</> : <><ChevronDown className="h-3.5 w-3.5" /> View Full Details</>}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="bg-[#fafafe]">

          {/* Contact */}
          <Section title="Contact" icon={Phone}>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Phone" value={garage.phone} />
              <InfoRow label="WhatsApp" value={garage.whatsapp} />
              <InfoRow label="Email" value={garage.garage_email} />
              <InfoRow label="Experience" value={garage.experience} />
            </div>
          </Section>

          {/* Garage Info */}
          <Section title="Garage Info" icon={Wrench}>
            <InfoRow label="Speciality" value={garage.speciality} />
            <InfoRow label="About" value={garage.about} />
            {garage.vehicle_types?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#c2c6d8] mb-1.5">Vehicle Types</p>
                <div className="flex flex-wrap gap-1.5">
                  {garage.vehicle_types.map((v) => (
                    <span key={v} className="rounded-full bg-[#d8e2ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#0056b7]">{v}</span>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* Services */}
          {garage.services?.length > 0 && (
            <Section title="Services & Pricing" icon={CreditCard}>
              <div className="space-y-2">
                {garage.services.map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-white border border-[#f0f0f0] px-3 py-2.5">
                    <p className="text-sm font-semibold text-[#1a1c1f]">{s.name}</p>
                    <div className="flex items-center gap-3 text-xs text-[#727687]">
                      {s.price && <span className="font-bold text-[#0056b7]">₹{s.price}</span>}
                      {s.duration && <span>{s.duration}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Working Hours */}
          <Section title="Working Hours" icon={Clock}>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Opens" value={wh.open} />
              <InfoRow label="Closes" value={wh.close} />
            </div>
            {closedDays.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#c2c6d8] mb-1.5">Closed On</p>
                <div className="flex flex-wrap gap-1.5">
                  {allDays.map((d) => (
                    <span key={d} className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${closedDays.includes(d) ? "bg-red-100 text-red-500" : "bg-green-50 text-green-600"}`}>{d}</span>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* Location */}
          <Section title="Location" icon={MapPin}>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Address" value={garage.address} />
              <InfoRow label="City" value={garage.city} />
              <InfoRow label="Pincode" value={garage.pincode} />
              {garage.lat && garage.lng && (
                <div className="col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#c2c6d8] mb-1">Coordinates</p>
                  <a href={`https://maps.google.com/?q=${garage.lat},${garage.lng}`} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-medium text-[#0056b7] underline">
                    {garage.lat.toFixed(5)}, {garage.lng.toFixed(5)} ↗
                  </a>
                </div>
              )}
            </div>
          </Section>

          {/* Payout */}
          <Section title="Payout Details" icon={CreditCard}>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="UPI ID" value={garage.upi_id} />
              <InfoRow label="Account Holder" value={garage.bank_account_name} />
              <InfoRow label="Account Number" value={garage.bank_account_number} />
              <InfoRow label="IFSC Code" value={garage.bank_ifsc} />
            </div>
          </Section>

        </div>
      )}
    </div>
  );
}

const SESSION_TTL   = 8 * 60 * 60 * 1000; // 8 hours
const SESSION_KEY   = "admin_session";

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { secret, loginAt } = JSON.parse(raw);
    if (Date.now() - loginAt > SESSION_TTL) { sessionStorage.removeItem(SESSION_KEY); return null; }
    return secret;
  } catch { return null; }
}

function saveSession(secret) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ secret, loginAt: Date.now() }));
}

export default function AdminGaragesPage() {
  const [tab,          setTab]          = useState("pending");
  const [garages,      setGarages]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [acting,       setActing]       = useState(null);
  const [secret,       setSecret]       = useState("");
  const [authed,       setAuthed]       = useState(false);
  const [authErr,      setAuthErr]      = useState("");
  const [authLoading,  setAuthLoading]  = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [lockCountdown,setLockCountdown]= useState(0);

  useEffect(() => {
    const saved = loadSession();
    if (saved) { setSecret(saved); setAuthed(true); }
  }, []);

  // Countdown timer when locked out
  useEffect(() => {
    if (lockCountdown <= 0) return;
    const t = setTimeout(() => setLockCountdown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [lockCountdown]);

  useEffect(() => {
    if (authed) fetchGarages();
  }, [authed, tab]);

  async function fetchGarages() {
    setLoading(true);
    const usedSecret = secret || sessionStorage.getItem("admin_secret") || "";
    const res = await fetch(`/api/admin/garages?status=${tab}`, {
      headers: { "x-admin-secret": usedSecret },
    });
    const json = await res.json();
    if (res.ok) {
      setGarages(json.garages || []);
    } else if (res.status === 401) {
      setAuthed(false); setAuthErr("Wrong secret. Please re-enter.");
    }
    setLoading(false);
  }

  async function handleAuth(e) {
    e.preventDefault();
    if (!secret.trim() || authLoading || lockCountdown > 0) return;
    setAuthLoading(true);
    setAuthErr("");

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
    });
    const j = await res.json();

    if (res.ok) {
      saveSession(secret);
      setAuthed(true);
    } else if (res.status === 429) {
      setLockCountdown(j.lockedFor || 900);
      setAttemptsLeft(0);
      setAuthErr("Too many failed attempts.");
    } else {
      setAttemptsLeft(j.attemptsLeft ?? attemptsLeft - 1);
      setAuthErr("Wrong password. " + (j.attemptsLeft > 0 ? `${j.attemptsLeft} attempt${j.attemptsLeft !== 1 ? "s" : ""} left.` : ""));
    }
    setAuthLoading(false);
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false); setSecret(""); setAuthErr("");
  }

  async function handleRemove(garageId) {
    const usedSecret = secret || sessionStorage.getItem("admin_secret") || "";
    const res = await fetch("/api/admin/delete-garage", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": usedSecret },
      body: JSON.stringify({ garage_id: garageId }),
    });
    if (res.ok) {
      setGarages((prev) => prev.filter((g) => g.id !== garageId));
    } else {
      const j = await res.json();
      if (j.error === "Unauthorized") { setAuthed(false); setAuthErr("Wrong secret. Please re-enter."); }
    }
  }

  async function handleAction(garageId, action, reason) {
    setActing(garageId + action);
    const usedSecret = secret || sessionStorage.getItem("admin_secret") || "";
    const res = await fetch("/api/admin/verify-garage", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": usedSecret },
      body: JSON.stringify({ garage_id: garageId, action, rejection_reason: reason || null }),
    });
    const j = await res.json();
    if (res.ok) {
      setGarages((prev) => prev.filter((g) => g.id !== garageId));
    } else if (j.error === "Unauthorized") {
      setAuthed(false); setAuthErr("Wrong secret. Please re-enter.");
    } else {
      alert("Action failed: " + (j.error || "Unknown error"));
    }
    setActing(null);
  }

  if (!authed) {
    const isLocked = lockCountdown > 0;
    const mins = String(Math.floor(lockCountdown / 60)).padStart(2, "0");
    const secs = String(lockCountdown % 60).padStart(2, "0");

    return (
      <div className="min-h-screen bg-[#f9f9fe] flex items-center justify-center px-4" style={{ colorScheme: "light" }}>
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm border border-[#f0f0f0]">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#d8e2ff]">
            <Building2 className="h-5 w-5 text-[#0056b7]" />
          </div>
          <h1 className="text-xl font-black text-[#1a1c1f] mb-1">Admin Access</h1>
          <p className="text-sm text-[#727687] mb-5">GarageDekho team only. Unauthorised access is logged.</p>

          {isLocked ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-5 text-center">
              <p className="text-sm font-bold text-red-600 mb-1">Access locked</p>
              <p className="text-3xl font-black text-red-500 tabular-nums">{mins}:{secs}</p>
              <p className="text-xs text-red-400 mt-1">Too many failed attempts. Try again after the timer.</p>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-3">
              {authErr && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                  <p className="text-xs font-semibold text-red-600">{authErr}</p>
                  {attemptsLeft > 0 && attemptsLeft < 5 && (
                    <div className="mt-2 flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full ${i < attemptsLeft ? "bg-red-300" : "bg-red-500"}`} />
                      ))}
                    </div>
                  )}
                </div>
              )}
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Admin password"
                autoComplete="current-password"
                style={{ fontSize: 16 }}
                className="w-full rounded-xl border border-[#e8e8f0] bg-[#f9f9fe] px-4 py-3 text-sm text-[#1a1c1f] outline-none focus:border-[#0056b7]"
              />
              <button
                type="submit"
                disabled={authLoading || !secret.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0056b7] py-3 text-sm font-bold text-white hover:brightness-110 active:scale-95 transition disabled:opacity-60"
              >
                {authLoading && <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                {authLoading ? "Verifying…" : "Enter"}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9fe] pb-16" style={{ colorScheme: "light" }}>

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#f0f0f0] shadow-sm">
        <div className="mx-auto max-w-2xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f3f8] text-[#424656] hover:bg-[#ededf2] transition">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-sm font-black text-[#1a1c1f]">Garage Verifications</p>
              <p className="text-[11px] text-[#727687]">{garages.length} {tab}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchGarages} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f3f8] text-[#424656] hover:bg-[#ededf2] transition active:scale-95">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button onClick={handleLogout} title="Logout" className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 transition active:scale-95">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-2xl px-4 flex gap-1.5 pb-3">
          {STATUS_TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold capitalize transition ${tab === t ? "bg-[#0056b7] text-white" : "bg-[#f3f3f8] text-[#727687] hover:bg-[#ededf2]"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pt-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-7 w-7 rounded-full border-4 border-[#0056b7] border-t-transparent animate-spin" />
          </div>
        ) : garages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-400 mb-3" />
            <p className="text-sm font-bold text-[#1a1c1f]">All clear!</p>
            <p className="text-xs text-[#727687]">No {tab} garages.</p>
          </div>
        ) : (
          garages.map((g) => (
            <GarageCard key={g.id} garage={g} onAction={handleAction} acting={acting} onRemove={handleRemove} />
          ))
        )}
      </div>
    </div>
  );
}
