"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";

export default function MyReviewsPage() {
  const router = useRouter();
  const reviews = []; // placeholder

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-20 glass border-b border-white/40 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-white/80 text-slate-600 shadow-sm transition hover:border-primary/40 hover:text-primary active:scale-95">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs text-slate-400">Profile</p>
            <h1 className="text-sm font-black text-slate-900">My Reviews</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-28 pt-6 md:pb-10">
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center animate-slide-up">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
              <Star className="h-8 w-8 text-amber-300" />
            </div>
            <div>
              <p className="text-base font-black text-slate-900">No reviews yet</p>
              <p className="mt-1 text-sm text-slate-400">After a completed service, you can rate and review the garage.</p>
            </div>
            <Link href="/bookings"
              className="mt-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-card-hover transition hover:brightness-110 active:scale-95">
              View Bookings
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl bg-white p-4 shadow-card">
                <p className="font-bold text-slate-900">{r.garageName}</p>
                <div className="mt-1 flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={`h-3.5 w-3.5 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                  ))}
                </div>
                <p className="mt-2 text-sm text-slate-500">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
