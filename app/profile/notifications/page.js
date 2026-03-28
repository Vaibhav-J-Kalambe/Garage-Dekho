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
      <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${on ? "bg-primary" : "bg-[#e8e8f0]"}`}>
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
    <div className="min-h-screen bg-[#f9f9fe]">

      <div style={{ paddingTop: 64 }}>
        <div className="mx-auto max-w-lg px-4 pt-6 pb-2">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f3f8] text-[#424656] transition-colors duration-150 hover:bg-[#ededf2] active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#727687]">Preferences</p>
          <h1 className="mt-1 text-[2rem] md:text-[2.5rem] font-bold tracking-tight text-[#1a1c1f]">Notifications</h1>
          <p className="mt-1 text-sm text-[#727687]">Manage your alert preferences</p>
        </div>
      </div>

      <div
        className="px-4 pt-4"
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
                <p className="px-4 pb-1 pt-4 text-[10px] font-black uppercase tracking-widest text-[#727687]">Notification Preferences</p>
                <div className="divide-y divide-[#f3f3f8]">
                  {NOTIF_ITEMS.map(({ key, label, desc, icon: Icon, defaultOn }) => (
                    <div key={key} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#424656]">{label}</p>
                        <p className="text-[11px] text-[#727687]">{desc}</p>
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
