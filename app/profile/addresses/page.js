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
  const inputCls = "w-full rounded-xl border border-[#c2c6d8] bg-white px-3 py-3 text-[16px] leading-snug text-[#424656] placeholder:text-[#727687] focus:border-[#0056b7] focus:outline-none focus:ring-1 focus:ring-[#0056b7]/10 transition-colors duration-150";

  return (
    <div className="min-h-screen bg-[#f9f9fe]">

      <div style={{ paddingTop: 64 }}>
        <div className="mx-auto max-w-lg px-4 pt-6 pb-2">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f3f8] text-[#424656] transition-colors duration-150 hover:bg-[#ededf2] active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => { setAdding((v) => !v); setLabel(""); setAddr(""); }}
              className="flex min-h-[40px] items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition-colors duration-150 hover:bg-primary/20 active:scale-95"
            >
              {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {adding ? "Cancel" : "Add Address"}
            </button>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#727687]">Preferences</p>
          <h1 className="mt-1 text-[2rem] md:text-[2.5rem] font-bold tracking-tight text-[#1a1c1f]">Saved Addresses</h1>
          <p className="mt-1 text-sm text-[#727687]">Home, office, and other locations</p>
        </div>
      </div>

      <div
        className="px-4 pt-4"
        style={{ paddingBottom: "max(7rem, calc(env(safe-area-inset-bottom) + 5rem))" }}
      >
        <div className="mx-auto max-w-lg space-y-4">

          {/* Add form */}
          {adding && (
            <form onSubmit={handleAdd} className="rounded-2xl bg-white p-4 shadow-card space-y-3 animate-slide-up">
              <p className="text-xs font-black uppercase tracking-widest text-[#727687]">New Address</p>
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
                <MapPin className="h-8 w-8 text-[#c2c6d8]" />
                <p className="mt-2 text-sm font-bold text-[#424656]">No addresses saved</p>
                <p className="mt-1 text-xs text-[#727687]">Add your home or office for faster booking.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f3f3f8]">
                {addresses.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 px-4 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                      {a.icon === "home" ? <Home className="h-4 w-4" /> : a.icon === "office" ? <Briefcase className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#424656]">{a.label}</p>
                      <p className="mt-0.5 text-xs text-[#727687] leading-relaxed">{a.address}</p>
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
