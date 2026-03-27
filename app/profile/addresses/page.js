"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Plus, Trash2, Home, Briefcase, X, Loader2 } from "lucide-react";
import { useAuth } from "../../../components/AuthProvider";
import { getUserAddresses, addUserAddress, removeUserAddress } from "../../../lib/addresses";

export default function AddressesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [adding,    setAdding]    = useState(false);
  const [label,     setLabel]     = useState("");
  const [addr,      setAddr]      = useState("");
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState(null);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2500); }

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth?redirect=/profile/addresses"); return; }
    getUserAddresses(user.id)
      .then(setAddresses)
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!label.trim() || !addr.trim() || !user) return;
    setSaving(true);
    const lbl  = label.trim().toLowerCase();
    const icon = lbl === "home" ? "home" : lbl === "office" ? "office" : "other";
    try {
      const newA = await addUserAddress(user.id, { label: label.trim(), address: addr.trim(), icon });
      setAddresses((prev) => [...prev, newA]);
      setLabel(""); setAddr(""); setAdding(false);
    } catch (err) {
      showToast("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    try {
      await removeUserAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch {
      showToast("Failed to remove address.");
    }
  }

  /* text-[16px] prevents iOS Safari auto-zoom on focus */
  const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-[16px] leading-snug text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors duration-150";

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
          <div className="mb-5 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors duration-150 hover:bg-white/25 active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => { setAdding((v) => !v); setLabel(""); setAddr(""); }}
              className="flex min-h-[44px] items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm transition-colors duration-150 hover:bg-white/30 active:scale-95"
            >
              {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {adding ? "Cancel" : "Add Address"}
            </button>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200/70">Preferences</p>
          <h1 className="mt-1 text-[28px] font-black leading-tight text-white">Saved Addresses</h1>
          <p className="mt-1 text-sm text-blue-100/70">Home, office, and other locations</p>
        </div>
      </div>

      {/* ── Pull-up card ── */}
      <div
        className="-mt-12 min-h-screen rounded-t-[2.5rem] bg-white px-4 pt-6"
        style={{ paddingBottom: "max(7rem, calc(env(safe-area-inset-bottom) + 5rem))" }}
      >
        <div className="mx-auto max-w-lg space-y-4">

          {/* Add form */}
          {adding && (
            <form onSubmit={handleAdd} className="rounded-2xl bg-white p-4 shadow-card space-y-3 animate-slide-up">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">New Address</p>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label (e.g. Home, Office, Parents)"
                required
                autoComplete="off"
                className={inputCls}
              />
              <textarea
                value={addr}
                onChange={(e) => setAddr(e.target.value)}
                placeholder="Full address"
                required
                rows={2}
                autoComplete="street-address"
                className={inputCls + " resize-none"}
              />
              <button
                type="submit"
                disabled={saving}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-white transition-colors duration-150 hover:brightness-110 active:scale-95 disabled:opacity-60"
              >
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save Address"}
              </button>
            </form>
          )}

          {/* List */}
          <div className="rounded-2xl bg-white shadow-card overflow-hidden animate-slide-up">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <MapPin className="h-8 w-8 text-slate-200" />
                <p className="mt-2 text-sm font-bold text-slate-700">No addresses saved</p>
                <p className="mt-1 text-xs text-slate-400">Add your home or office for faster booking.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {addresses.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 px-4 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                      {a.icon === "home" ? <Home className="h-4 w-4" /> : a.icon === "office" ? <Briefcase className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800">{a.label}</p>
                      <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{a.address}</p>
                    </div>
                    {/* 44×44 touch target for delete */}
                    <button
                      type="button"
                      aria-label="Remove address"
                      onClick={() => remove(a.id)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center text-slate-300 transition-colors duration-150 hover:text-red-400 active:scale-95"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-slate-900/90 px-5 py-3 text-sm font-semibold text-white shadow-xl backdrop-blur-sm md:bottom-8">
          {toast}
        </div>
      )}
    </div>
  );
}
