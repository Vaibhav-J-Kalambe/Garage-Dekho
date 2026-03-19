"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Tag, AlertTriangle, Wrench, CheckCircle2 } from "lucide-react";

const NOTIF_ITEMS = [
  { key: "booking_reminders", label: "Booking Reminders",    desc: "Get reminded before your appointment", icon: Bell,          defaultOn: true  },
  { key: "promo_offers",      label: "Promotional Offers",   desc: "Discounts and special deals",          icon: Tag,           defaultOn: true  },
  { key: "sos_alerts",        label: "SOS Alerts",           desc: "Emergency notifications near you",     icon: AlertTriangle, defaultOn: true  },
  { key: "service_updates",   label: "Service Updates",      desc: "Status updates on your booking",       icon: Wrench,        defaultOn: true  },
];

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${on ? "bg-primary" : "bg-slate-200"}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [prefs, setPrefs] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("notif_prefs") || "{}");
    } catch { return {}; }
  });
  const [saved, setSaved] = useState(false);

  function toggle(key, val) {
    setPrefs((p) => ({ ...p, [key]: val }));
    setSaved(false);
  }

  function handleSave() {
    localStorage.setItem("notif_prefs", JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function getVal(key, def) {
    return prefs[key] !== undefined ? prefs[key] : def;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-20 glass border-b border-white/40 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-white/80 text-slate-600 shadow-sm transition hover:border-primary/40 hover:text-primary active:scale-95">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs text-slate-400">Preferences</p>
            <h1 className="text-sm font-black text-slate-900">Notifications</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-28 pt-6 md:pb-10 space-y-4">
        <div className="rounded-2xl bg-white shadow-card overflow-hidden animate-slide-up">
          <p className="px-4 pb-1 pt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Notification Preferences</p>
          <div className="divide-y divide-slate-50">
            {NOTIF_ITEMS.map(({ key, label, desc, icon: Icon, defaultOn }) => (
              <div key={key} className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{label}</p>
                  <p className="text-[11px] text-slate-400">{desc}</p>
                </div>
                <Toggle on={getVal(key, defaultOn)} onChange={(v) => toggle(key, v)} />
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-white shadow-card-hover transition hover:brightness-110 active:scale-[0.98]"
        >
          {saved ? <><CheckCircle2 className="h-4 w-4" />Saved!</> : "Save Preferences"}
        </button>
      </main>
    </div>
  );
}
