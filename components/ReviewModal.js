"use client";

import { useState } from "react";
import { X, Star, Loader2, CheckCircle2 } from "lucide-react";
import { submitReview } from "../lib/reviews";
import { useAuth } from "./AuthProvider";

export default function ReviewModal({ booking, onClose, onSuccess }) {
  const { user } = useAuth();
  const [rating,  setRating]  = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [done,    setDone]    = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a star rating."); return; }
    setLoading(true); setError(null);
    try {
      await submitReview(user.id, booking.garageId, booking.id, rating, comment);
      setDone(true);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { onSuccess(); onClose(); }} />
        <div className="relative w-full max-w-sm rounded-t-3xl bg-white p-8 text-center shadow-2xl md:rounded-3xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Review Submitted!</h2>
          <p className="mt-2 text-sm text-slate-400">Thank you for rating {booking.garageName}.</p>
          <button
            onClick={() => { onSuccess(); onClose(); }}
            className="mt-6 w-full rounded-2xl bg-primary py-3 text-sm font-bold text-white transition hover:brightness-110 active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-t-3xl bg-white shadow-2xl md:rounded-3xl">

        {/* Header */}
        <div className="flex items-center justify-between rounded-t-3xl border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs text-slate-400">Rate your experience</p>
            <p className="text-base font-black text-slate-900">{booking.garageName}</p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">{error}</p>
          )}

          {/* Star rating */}
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Your Rating</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform active:scale-90"
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      star <= (hovered || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="mt-2 text-center text-xs font-semibold text-slate-500">
                {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Comment (optional)</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this garage…"
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>

          <button type="submit" disabled={loading || rating === 0}
            className="w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-white shadow-card-hover transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
              </span>
            ) : "Submit Review"}
          </button>

        </form>
      </div>
    </div>
  );
}
