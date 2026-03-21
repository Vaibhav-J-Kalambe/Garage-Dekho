"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  Phone,
  Zap,
  Gauge,
  Wrench,
  Car,
  ChevronRight,
  X,
  Flame,
} from "lucide-react";

const ISSUE_TYPES = [
  { label: "Flat Tyre",    icon: Gauge         },
  { label: "Battery Dead", icon: Zap           },
  { label: "Engine Fail",  icon: Wrench        },
  { label: "Accident",     icon: Car           },
  { label: "Other",        icon: AlertTriangle },
];

const WAIT_TIPS = [
  "Stay with your vehicle and keep doors locked",
  "Switch on hazard lights immediately",
  "Move to a safe distance from moving traffic",
];

export default function SosPage() {
  const router = useRouter();
  const [selectedIssue, setSelectedIssue] = useState(null);

  // phase: "idle" | "confirming" | "sent"
  const [phase, setPhase]         = useState("idle");
  const [confirm,  setConfirm]    = useState(3);   // 3-second cancel window
  const [etaLeft,  setEtaLeft]    = useState(120);  // mechanic ETA in seconds

  /* 3-second confirmation countdown */
  useEffect(() => {
    if (phase !== "confirming") return;
    if (confirm <= 0) { setPhase("sent"); return; }
    const t = setTimeout(() => setConfirm((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, confirm]);

  /* Mechanic ETA countdown */
  useEffect(() => {
    if (phase !== "sent" || etaLeft <= 0) return;
    const t = setInterval(() => setEtaLeft((s) => Math.max(s - 1, 0)), 1000);
    return () => clearInterval(t);
  }, [phase, etaLeft]);

  const etaMin = Math.floor(etaLeft / 60).toString().padStart(2, "0");
  const etaSec = (etaLeft % 60).toString().padStart(2, "0");

  function triggerSOS() { setPhase("confirming"); setConfirm(3); }
  function cancelSOS()  { setPhase("idle"); setConfirm(3); setEtaLeft(120); }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 shrink-0 border-b border-slate-800/60 bg-slate-950/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 transition hover:bg-slate-800 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Emergency</p>
            <h1 className="text-sm font-bold text-slate-50">SOS Assistance</h1>
          </div>

          {/* Live badge */}
          <div className="ml-auto flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
            </span>
            <span className="text-[10px] font-bold text-green-400">24/7 LIVE</span>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════
          PHASE: IDLE — pre-request screen
      ══════════════════════════════════════ */}
      {phase === "idle" && (
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-8 pt-4">

          {/* Demo disclaimer */}
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
            <p className="flex-1 text-[11px] font-semibold text-amber-300">
              Demo only — for real emergencies call <strong>112</strong>
            </p>
          </div>

          {/* Location strip */}
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            <p className="flex-1 text-[11px] font-semibold text-slate-500">GPS dispatch not yet active</p>
            <span className="text-[10px] font-bold text-slate-600">Coming Soon</span>
          </div>

          {/* Hero */}
          <div className="mb-5 text-center">
            <h2 className="text-2xl font-black leading-tight text-slate-50">Stuck on the road?</h2>
            <p className="mt-1 text-sm text-slate-400">
              Select your issue, then tap the button below.
            </p>
          </div>

          {/* Issue type chips — horizontal scroll, single tap */}
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            What&apos;s the problem?
          </p>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
            {ISSUE_TYPES.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => setSelectedIssue((p) => (p === label ? null : label))}
                className={`flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-4 py-3 text-[11px] font-bold transition active:scale-95 ${
                  selectedIssue === label
                    ? "border-red-500/50 bg-red-500/10 text-red-400"
                    : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-600"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* ── BIG SOS BUTTON — pushed to lower thumb zone ── */}
          <div className="flex flex-1 flex-col items-center justify-end gap-5 pt-6">

            <div className="relative flex items-center justify-center">
              {/* Pulsing rings */}
              <span className="absolute h-52 w-52 rounded-full border-2 border-red-500/30 animate-ping" style={{ animationDuration: "2s" }} />
              <span className="absolute h-60 w-60 rounded-full border border-red-500/15 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.5s" }} />
              <button
                type="button"
                onClick={triggerSOS}
                className="relative flex h-44 w-44 items-center justify-center rounded-full border-4 border-red-900/50 bg-[#D32F2F] text-white shadow-[0_8px_48px_rgba(211,47,47,0.55)] transition-transform active:scale-95 focus:outline-none"
                aria-label="Request emergency help"
              >
                <span className="flex flex-col items-center gap-2">
                  <AlertTriangle className="h-10 w-10" />
                  <span className="text-[15px] font-black uppercase leading-tight tracking-wide">
                    Get<br />Help Now
                  </span>
                </span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500">Demo simulation — no real mechanic is dispatched</p>

            {/* Divider */}
            <div className="flex w-full items-center gap-3">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-[10px] font-semibold text-slate-600">or call directly</span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            {/* Call helpline */}
            <a
              href="tel:+919969272885"
              className="flex w-full items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3.5 transition hover:border-slate-700 active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-400">
                <Phone className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-50">Call Helpline</p>
                <p className="text-[11px] text-slate-500">+91 99692 72885 · 24 / 7</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
            </a>

          </div>
        </main>
      )}

      {/* ══════════════════════════════════════
          PHASE: CONFIRMING — 3-sec cancel window
          Apple HIG: critical actions need confirmation,
          but must not block a genuinely urgent user.
      ══════════════════════════════════════ */}
      {phase === "confirming" && (
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-8 px-4 pb-8">

          <div className="text-center">
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-red-400">
              Sending SOS in
            </p>
            <p className="font-mono text-[96px] font-black leading-none text-red-400 tabular-nums">
              {confirm}
            </p>
            <p className="mt-2 text-sm text-slate-400">Dispatching the nearest mechanic…</p>
          </div>

          {/* Large cancel — easy to hit when panicked */}
          <button
            type="button"
            onClick={cancelSOS}
            className="flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 py-4 text-sm font-bold text-slate-200 transition hover:border-slate-500 active:scale-95"
          >
            <X className="h-4 w-4" />
            Cancel SOS
          </button>

          <p className="text-[11px] text-slate-600">
            SOS sends automatically — tap Cancel to abort
          </p>

        </main>
      )}

      {/* ══════════════════════════════════════
          PHASE: SENT — mechanic dispatched
      ══════════════════════════════════════ */}
      {phase === "sent" && (
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 pb-8 pt-4">

          {/* Success */}
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/5 p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15">
              <CheckCircle2 className="h-7 w-7 text-green-400" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-50">Help is on the way!</p>
              <p className="mt-0.5 text-sm text-slate-400">
                This is a demo simulation. For real emergencies, call <strong className="text-white">112</strong>.
              </p>
            </div>
          </div>

          {/* ETA countdown */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-center">
            {etaLeft > 0 ? (
              <>
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Estimated arrival
                </p>
                <p className="font-mono text-5xl font-black tracking-tight text-slate-50 tabular-nums">
                  {etaMin}:{etaSec}
                </p>
                <p className="mt-1 text-[11px] text-slate-600">minutes remaining</p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 py-2 animate-pop">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15">
                  <CheckCircle2 className="h-7 w-7 text-green-400" />
                </div>
                <p className="text-base font-black text-slate-50">Mechanic has arrived!</p>
                <p className="text-xs text-slate-400">Please check outside your vehicle.</p>
              </div>
            )}
          </div>

          {/* While you wait */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                While you wait
              </p>
            </div>
            <div className="space-y-3">
              {WAIT_TIPS.map((tip) => (
                <div key={tip} className="flex items-start gap-3">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  <p className="text-sm leading-snug text-slate-300">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Call helpline */}
          <a
            href="tel:+919969272885"
            className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3.5 transition hover:border-slate-700 active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-400">
              <Phone className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-50">Call Helpline</p>
              <p className="text-[11px] text-slate-500">+91 99692 72885 · 24 / 7</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
          </a>

          {/* Cancel SOS — subtle, not prominent */}
          <button
            type="button"
            onClick={cancelSOS}
            className="py-2 text-center text-[11px] font-semibold text-slate-600 transition hover:text-slate-400"
          >
            Cancel SOS request
          </button>

        </main>
      )}

    </div>
  );
}
