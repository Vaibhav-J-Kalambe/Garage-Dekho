"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, MapPin, Star, Loader2 } from "lucide-react";
import { useAuth } from "../../../components/AuthProvider";
import { getSavedGarages, unsaveGarage } from "../../../lib/saved";

export default function SavedGaragesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [saved,   setSaved]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth?redirect=/profile/saved"); return; }
    getSavedGarages(user.id)
      .then(setSaved)
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  async function handleUnsave(garageId) {
    if (!user) return;
    await unsaveGarage(user.id, garageId).catch(() => null);
    setSaved((prev) => prev.filter((g) => g.id !== garageId));
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-20 glass border-b border-white/40 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-white/80 text-slate-600 shadow-sm transition hover:border-primary/40 hover:text-primary active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs text-slate-400">Profile</p>
            <h1 className="text-sm font-black text-slate-900">Saved Garages</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-28 pt-6 md:pb-10">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : saved.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center animate-slide-up">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <Heart className="h-8 w-8 text-red-300" />
            </div>
            <div>
              <p className="text-base font-black text-slate-900">No saved garages yet</p>
              <p className="mt-1 text-sm text-slate-400">Tap the heart icon on any garage to save it here.</p>
            </div>
            <Link
              href="/near-me"
              className="mt-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-card-hover transition hover:brightness-110 active:scale-95"
            >
              Browse Garages
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {saved.map((g) => (
              <div key={g.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card transition hover:shadow-card-hover animate-slide-up">
                <Link href={`/garage/${g.id}`} className="flex flex-1 items-center gap-3 min-w-0">
                  <img src={g.image} alt={g.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-900">{g.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{g.speciality}</p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{g.address}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold text-slate-700">{g.rating}</span>
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  aria-label="Unsave"
                  onClick={() => handleUnsave(g.id)}
                  className="shrink-0 text-red-400 transition hover:text-red-600 active:scale-90"
                >
                  <Heart className="h-5 w-5 fill-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
