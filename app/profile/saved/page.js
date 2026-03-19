"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, MapPin } from "lucide-react";

export default function SavedGaragesPage() {
  const router = useRouter();

  // Placeholder - in a real app this would fetch from a saved_garages table
  const saved = [];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-20 glass border-b border-white/40 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-white/80 text-slate-600 shadow-sm transition hover:border-primary/40 hover:text-primary active:scale-95">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs text-slate-400">Profile</p>
            <h1 className="text-sm font-black text-slate-900">Saved Garages</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-28 pt-6 md:pb-10">
        {saved.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center animate-slide-up">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <Heart className="h-8 w-8 text-red-300" />
            </div>
            <div>
              <p className="text-base font-black text-slate-900">No saved garages yet</p>
              <p className="mt-1 text-sm text-slate-400">Tap the heart icon on any garage to save it here.</p>
            </div>
            <Link href="/near-me"
              className="mt-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-card-hover transition hover:brightness-110 active:scale-95">
              Browse Garages
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {saved.map((g) => (
              <Link key={g.id} href={`/garage/${g.id}`}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card transition hover:shadow-card-hover">
                <img src={g.image} alt={g.name} className="h-14 w-14 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900">{g.name}</p>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="h-3 w-3" /><span>{g.address}</span>
                  </div>
                </div>
                <Heart className="h-4 w-4 shrink-0 fill-red-400 text-red-400" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
