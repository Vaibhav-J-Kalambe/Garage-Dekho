"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, Loader2, MessageSquare } from "lucide-react";
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

function avgRating(reviews) {
  if (!reviews.length) return 0;
  return (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
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
          <h1 className="mt-1 text-[2rem] md:text-[2.5rem] font-bold tracking-tight text-[#1a1c1f]">My Reviews</h1>

          {!loading && reviews.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f3f3f8] px-3 py-1">
                <MessageSquare className="h-3.5 w-3.5 text-[#727687]" />
                <span className="text-xs font-bold text-[#424656]">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-amber-700">{avgRating(reviews)} avg rating</span>
              </div>
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
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center animate-slide-up">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                <Star className="h-8 w-8 text-amber-300" />
              </div>
              <div>
                <p className="text-base font-black text-[#1a1c1f]">No reviews yet</p>
                <p className="mt-1 text-sm text-[#727687]">After a completed service, you can rate and review the garage.</p>
              </div>
              <Link
                href="/bookings"
                className="mt-2 min-h-[44px] rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-glow-primary transition-colors duration-150 hover:brightness-110 active:scale-95"
              >
                View Bookings
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map((r, i) => (
                <div
                  key={r.id}
                  className="animate-slide-up rounded-2xl bg-white p-4 shadow-card"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <StarRow rating={r.rating} />
                    <span className="text-[11px] text-[#727687]">{formatDate(r.created_at)}</span>
                  </div>
                  {r.garage_name && (
                    <Link
                      href={`/garage/${r.garage_id}`}
                      className="mt-2 inline-block text-xs font-bold text-primary hover:underline"
                    >
                      {r.garage_name}
                    </Link>
                  )}
                  {r.comment && (
                    <p className="mt-2 text-sm leading-relaxed text-[#424656]">{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
