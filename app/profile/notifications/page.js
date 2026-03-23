"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Tag, AlertTriangle, Wrench, CheckCircle2, Construction, Loader2 } from "lucide-react";
import { useAuth } from "../../../components/AuthProvider";
import { getPreferences, savePreferences } from "../../../lib/preferences";

const NOTIF_ITEMS = [
  { key: "booking_reminders", label: "Booking Reminders",    desc: "Get reminded before your appointment", icon: Bell,          defaultOn: true  },
  { key: "promo_offers",      label: "Promotional Offers",   desc: "Discounts and special deals",          icon: Tag,           defaultOn: true  },
  { key: "sos_alerts",        label: "SOS Alerts",           desc: "Emergency notifications near you",     icon: AlertTriangle, defaultOn: true  },
  { key: "service_updates",   label: "Service Updates",      desc: "Status updates on your booking",       icon: Wrench,        defaultOn: true  },
];

function Toggle({ on, onChange }) {
  return (
    /* Outer button is the 44px touch target */
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex h-11 w-11 shrink-0 items-center justify-center focus:outline-none"
    >
      <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${on ? "bg-primary" : "bg-slate-200"}`}>
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? "translate-x-6" : "translate-x-1"}`} />
      </span>
    </button>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [prefs,   setPrefs]   = useState({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      getPreferences(user.id)
        .then(setPrefs)
        .catch(() => {
          try { setPrefs(JSON.parse(localStorage.getItem("notif_prefs") || "{}")); } catch { setPrefs({}); }
        })
        .finally(() => setLoading(false));
    } else {
      try { setPrefs(JSON.parse(localStorage.getItem("notif_prefs") || "{}")); } catch { setPrefs({}); }
      setLoading(false);
    }
  }, [user, authLoading]);

  function toggle(key, val) {
    setPrefs((p) => ({ ...p, [key]: val }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (user) {
        await savePreferences(user.id, prefs);
      } else {
        localStorage.setItem("notif_prefs", JSON.stringify(prefs));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      localStorage.setItem("notif_prefs", JSON.stringify(prefs));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function getVal(key, def) {
    return prefs[key] !== undefined ? prefs[key] : def;
  }

  return (
    <div className="min-h-screen bg-[#001f5b]">

      {/* ── Hero ── */}
      <div
        data-hero
        className="relative overflow-hidden bg-gradient-to-br from-[#001f5b] via-[#003091] to-[#0056D2] px-4 pb-16 pt-[77px] sm:pb-20"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-400/30 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-sky-300/20 blur-2xl" aria-hidden />

        <div className="relative mx-auto max-w-lg">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors duration-150 hover:bg-white/25 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200/70">Preferences</p>
          <h1 className="mt-1 text-[28px] font-black leading-tight text-white">Notifications</h1>
          <p className="mt-1 text-sm text-blue-100/70">Manage your alert preferences</p>
        </div>
      </div>

      {/* ── Pull-up card ── */}
      <div
        className="-mt-12 min-h-screen rounded-t-[2.5rem] bg-[#F8FAFC] px-4 pt-6"
        style={{ paddingBottom: "max(7rem, calc(env(safe-area-inset-bottom) + 5rem))" }}
      >
        <div className="mx-auto max-w-lg space-y-4">

          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 animate-slide-up">
            <Construction className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">Coming Soon</p>
              <p className="mt-0.5 text-xs text-amber-600 leading-relaxed">
                Push notifications are not yet active. Your preferences are saved and will take effect once this feature launches.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="rounded-2xl bg-white shadow-card overflow-hidden animate-slide-up">
                <p className="px-4 pb-1 pt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Notification Preferences</p>
                <div className="divide-y divide-slate-50">
                  {NOTIF_ITEMS.map(({ key, label, desc, icon: Icon, defaultOn }) => (
                    <div key={key} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
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
                disabled={saving}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-white shadow-glow-primary transition-colors duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              >
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
                ) : saved ? (
                  <><CheckCircle2 className="h-4 w-4" />Saved!</>
                ) : "Save Preferences"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
