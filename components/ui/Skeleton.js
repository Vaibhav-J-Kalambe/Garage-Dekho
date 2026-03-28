"use client";

/* Base shimmer block */
function Base({ className = "" }) {
  return (
    <div className={`animate-shimmer rounded-lg bg-[#e8e8f0] ${className}`} />
  );
}

/* Single text line */
function Line({ className = "" }) {
  return <Base className={`h-3.5 ${className}`} />;
}

/* Circle avatar skeleton */
function Circle({ size = "md" }) {
  const sz = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-14 w-14" };
  return <Base className={`rounded-full ${sz[size] ?? sz.md}`} />;
}

/* Generic card skeleton */
function CardBlock({ className = "" }) {
  return (
    <div className={`rounded-2xl bg-white p-4 shadow-card space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <Base className="h-14 w-14 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Line className="w-3/4" />
          <Line className="w-1/2" />
        </div>
      </div>
      <Line className="w-full" />
      <Line className="w-2/3" />
    </div>
  );
}

/* Garage card skeleton — matches the horizontal garage card layout */
function GarageCard() {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card">
      <Base className="h-20 w-20 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2.5">
        <Line className="w-3/4" />
        <Line className="w-1/2 h-3" />
        <Line className="w-2/5 h-3" />
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <Base className="h-4 w-12 rounded-full" />
        <Base className="h-3 w-10 rounded-full" />
      </div>
    </div>
  );
}

/* Page-level loading — list of garage cards */
function GarageList({ count = 3 }) {
  return (
    <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <GarageCard key={i} />
      ))}
    </div>
  );
}

/* Booking card skeleton */
function BookingCard() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card space-y-3">
      <div className="flex items-center gap-3">
        <Base className="h-14 w-14 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Line className="w-2/3" />
          <Line className="w-1/2 h-3" />
        </div>
        <Base className="h-6 w-20 rounded-full shrink-0" />
      </div>
      <div className="border-t border-[#f3f3f8]" />
      <div className="flex gap-4">
        <Line className="w-28 h-3" />
        <Line className="w-16 h-3" />
      </div>
      <div className="flex items-center justify-between">
        <Line className="w-16 h-5" />
        <Base className="h-8 w-24 rounded-full" />
      </div>
    </div>
  );
}

/* Garage detail page skeleton — matches hero + identity + tabs + service cards */
function GarageDetail() {
  return (
    <div className="min-h-screen bg-[#f9f9fe]">
      {/* Hero image */}
      <Base className="h-72 w-full rounded-none md:h-96" />

      {/* Content pulled up */}
      <div className="relative -mt-5 rounded-t-3xl bg-[#f9f9fe]">
        <div className="mx-auto max-w-5xl px-4 pb-28 pt-5 md:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:gap-8">

            {/* Left column */}
            <div className="flex flex-col gap-5 md:flex-1">

              {/* Identity card */}
              <div className="rounded-2xl bg-white p-4 shadow-card space-y-3">
                <div className="flex items-center justify-between">
                  <Line className="w-1/2 h-5" />
                  <Base className="h-8 w-20 rounded-xl" />
                </div>
                <Line className="w-3/4" />
                <Line className="w-1/2" />
                <Line className="w-1/3" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl bg-white p-3 shadow-card text-center space-y-2">
                    <Line className="w-2/3 mx-auto h-5" />
                    <Line className="w-1/2 mx-auto h-3" />
                  </div>
                ))}
              </div>

              {/* Tab bar */}
              <Base className="h-12 w-full rounded-2xl" />

              {/* Service cards */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card">
                  <Base className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Line className="w-2/3" />
                    <Line className="w-1/3 h-3" />
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Line className="w-12 h-4" />
                    <Base className="h-6 w-14 rounded-full" />
                  </div>
                </div>
              ))}
            </div>

            {/* Right column — desktop only */}
            <div className="hidden md:block md:w-80 md:shrink-0">
              <div className="rounded-2xl bg-white p-5 shadow-card space-y-3">
                <Line className="w-1/2 h-5" />
                <Line className="w-2/3 h-3" />
                <div className="space-y-2 pt-2">
                  {[1, 2, 3].map((i) => (
                    <Base key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
                <Base className="h-12 w-full rounded-2xl mt-2" />
                <Base className="h-12 w-full rounded-2xl" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const Skeleton = {
  Base,
  Line,
  Circle,
  CardBlock,
  GarageCard,
  GarageList,
  BookingCard,
  GarageDetail,
};

export default Skeleton;
