"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Heart, MapPin, Star, Loader2 } from "lucide-react";
import { useAuth } from "../../../components/AuthProvider";
import { getSavedGarages, unsaveGarage } from "../../../lib/saved";
import EmptyState from "../../../components/ui/EmptyState";

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

          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200/70">Profile</p>
          <h1 className="mt-1 text-[28px] font-black leading-tight text-white">Saved Garages</h1>

          {!loading && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
              <Heart className="h-3.5 w-3.5 fill-red-300 text-red-300" />
              <span className="text-xs font-bold text-white">
                {saved.length} {saved.length === 1 ? "garage" : "garages"} saved
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Pull-up card ── */}
      <div
        className="-mt-12 min-h-screen rounded-t-[2.5rem] bg-[#F8FAFC] px-4 pt-6"
        style={{ paddingBottom: "max(7rem, calc(env(safe-area-inset-bottom) + 5rem))" }}
      >
        <div className="mx-auto max-w-lg">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : saved.length === 0 ? (
            <EmptyState preset="saved" />
          ) : (
            <div className="flex flex-col gap-3">
              {saved.map((g, i) => (
                <div
                  key={g.id}
                  className="animate-slide-up flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card transition-shadow duration-150 hover:shadow-card-hover"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <Link href={`/garage/${g.id}`} className="flex flex-1 items-center gap-3 min-w-0">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                      <Image src={g.image || "/placeholder-garage.svg"} alt={g.name} fill className="object-cover" sizes="56px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-bold text-slate-900">{g.name}</p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${g.isOpen ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                          {g.isOpen ? "Open" : "Closed"}
                        </span>
                      </div>
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
                  {/* 44×44 tap target for unsave */}
                  <button
                    type="button"
                    aria-label="Unsave garage"
                    onClick={() => handleUnsave(g.id)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center text-red-400 transition-colors duration-150 hover:text-red-600 active:scale-90"
                  >
                    <Heart className="h-5 w-5 fill-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
