"use client";

import { Star } from "lucide-react";

export default function RatingStars({
  rating = 0,
  reviews,
  size = "sm",
  className = "",
}) {
  const filled  = Math.floor(rating);
  const hasHalf = rating - filled >= 0.5;
  const empty   = 5 - filled - (hasHalf ? 1 : 0);

  const sz = size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: filled }).map((_, i) => (
          <Star key={`f${i}`} className={`${sz} fill-amber-400 text-amber-400`} />
        ))}
        {hasHalf && (
          <div className="relative">
            <Star className={`${sz} text-[#c2c6d8] fill-[#c2c6d8]`} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className={`${sz} fill-amber-400 text-amber-400`} />
            </div>
          </div>
        )}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`e${i}`} className={`${sz} fill-[#c2c6d8] text-[#c2c6d8]`} />
        ))}
      </div>

      <span className={`font-semibold text-[#1a1c1f] ${size === "sm" ? "text-xs" : "text-sm"}`}>
        {rating.toFixed(1)}
      </span>
      {reviews !== undefined && (
        <span className={`text-[#727687] ${size === "sm" ? "text-[11px]" : "text-xs"}`}>
          ({reviews})
        </span>
      )}
    </div>
  );
}
