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

  const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-20 glass border-b border-white/40 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-white/80 text-slate-600 shadow-sm transition hover:border-primary/40 hover:text-primary active:scale-95">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-slate-400">Preferences</p>
            <h1 className="text-sm font-black text-slate-900">Saved Addresses</h1>
          </div>
          <button
            type="button"
            onClick={() => { setAdding((v) => !v); setLabel(""); setAddr(""); }}
            className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110 active:scale-95"
          >
            {adding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {adding ? "Cancel" : "Add"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-28 pt-6 md:pb-10 space-y-4">

        {/* Add form */}
        {adding && (
          <form onSubmit={handleAdd} className="rounded-2xl bg-white p-4 shadow-card space-y-3 animate-slide-up">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">New Address</p>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (e.g. Home, Office, Parents)" required className={inputCls} />
            <input type="text" value={addr} onChange={(e) => setAddr(e.target.value)}
              placeholder="Full address" required className={inputCls} />
            <button type="submit" disabled={saving}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
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
                <div key={a.id} className="flex items-start gap-3 px-4 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                    {a.icon === "home" ? <Home className="h-4 w-4" /> : a.icon === "office" ? <Briefcase className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800">{a.label}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{a.address}</p>
                  </div>
                  <button type="button" onClick={() => remove(a.id)}
                    className="shrink-0 text-slate-300 transition hover:text-red-400 active:scale-95 mt-0.5">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {toast && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-slate-900/90 px-5 py-3 text-sm font-semibold text-white shadow-xl backdrop-blur-sm md:bottom-8">
          {toast}
        </div>
      )}
    </div>
  );
}
