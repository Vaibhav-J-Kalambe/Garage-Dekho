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

          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#727687]">Profile</p>
          <h1 className="mt-1 text-[2rem] md:text-[2.5rem] font-bold tracking-tight text-[#1a1c1f]">Saved Garages</h1>

          {!loading && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1">
              <Heart className="h-3.5 w-3.5 fill-red-400 text-red-400" />
              <span className="text-xs font-bold text-red-700">
                {saved.length} {saved.length === 1 ? "garage" : "garages"} saved
              </span>
            </div>
          )}
        </div>
      </div>

      <div
        className="px-4 pt-4"
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
                        <p className="truncate font-bold text-[#1a1c1f]">{g.name}</p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${g.isOpen ? "bg-green-50 text-green-600" : "bg-[#f3f3f8] text-[#727687]"}`}>
                          {g.isOpen ? "Open" : "Closed"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#727687]">{g.speciality}</p>
                      <div className="mt-1 flex items-center gap-1 text-xs text-[#727687]">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{g.address}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-semibold text-[#424656]">{g.rating}</span>
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
