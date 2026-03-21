"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, Loader2 } from "lucide-react";
import { useAuth } from "../../../components/AuthProvider";
import { getUserReviews } from "../../../lib/reviews";

function StarRow({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
        />
      ))}
    </div>
  );
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function MyReviewsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth?redirect=/profile/reviews"); return; }
    getUserReviews(user.id)
      .then(setReviews)
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

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
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
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
          <div className="flex flex-col gap-3 animate-slide-up">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl bg-white p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <StarRow rating={r.rating} />
                  <span className="text-[11px] text-slate-400">{formatDate(r.created_at)}</span>
                </div>
                {r.comment && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
