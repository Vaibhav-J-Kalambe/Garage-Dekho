"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Plus, Trash2, Home, Briefcase, X } from "lucide-react";

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("saved_addresses") || "[]"); }
    catch { return []; }
  });
  const [adding, setAdding]       = useState(false);
  const [label,   setLabel]       = useState("");
  const [addr,    setAddr]        = useState("");

  function persist(list) {
    setAddresses(list);
    localStorage.setItem("saved_addresses", JSON.stringify(list));
  }

  function handleAdd(e) {
    e.preventDefault();
    if (!label.trim() || !addr.trim()) return;
    const lbl = label.trim().toLowerCase();
    const icon = lbl === "home" ? "home" : lbl === "office" ? "office" : "other";
    persist([...addresses, { id: Date.now(), label: label.trim(), address: addr.trim(), icon }]);
    setLabel(""); setAddr(""); setAdding(false);
  }

  function remove(id) {
    persist(addresses.filter((a) => a.id !== id));
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
            onClick={() => setAdding((v) => !v)}
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
              placeholder="Label (e.g. Home, Office)" required className={inputCls} />
            <input type="text" value={addr} onChange={(e) => setAddr(e.target.value)}
              placeholder="Full address" required className={inputCls} />
            <button type="submit"
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-95">
              Save Address
            </button>
          </form>
        )}

        {/* List */}
        <div className="rounded-2xl bg-white shadow-card overflow-hidden animate-slide-up">
          {addresses.length === 0 ? (
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
    </div>
  );
}
