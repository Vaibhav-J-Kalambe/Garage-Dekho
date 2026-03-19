"use client";

/* Base shimmer block */
function Base({ className = "" }) {
  return (
    <div className={`animate-shimmer rounded-lg bg-slate-100 ${className}`} />
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
      <div className="border-t border-slate-100" />
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

const Skeleton = {
  Base,
  Line,
  Circle,
  CardBlock,
  GarageCard,
  GarageList,
  BookingCard,
};

export default Skeleton;
