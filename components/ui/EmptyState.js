"use client";

import Link from "next/link";
import {
  CalendarX,
  SearchX,
  MapPinOff,
  PackageOpen,
  Inbox,
} from "lucide-react";

const PRESETS = {
  bookings: {
    icon: CalendarX,
    title: "No bookings yet",
    description: "Your upcoming service appointments will appear here.",
    cta: { label: "Find a Garage", href: "/" },
  },
  "bookings-past": {
    icon: Inbox,
    title: "No past bookings",
    description: "Completed and cancelled bookings will show up here.",
  },
  search: {
    icon: SearchX,
    title: "No results found",
    description: "Try a different search term or clear your filters.",
  },
  "near-me": {
    icon: MapPinOff,
    title: "No garages nearby",
    description: "Try expanding your search radius or adjusting filters.",
  },
  offers: {
    icon: PackageOpen,
    title: "No offers right now",
    description: "Check back soon — new deals are added regularly.",
  },
};

export default function EmptyState({
  preset,
  icon: IconProp,
  title,
  description,
  cta,
  className = "",
}) {
  const p      = preset ? PRESETS[preset] : null;
  const Icon   = IconProp ?? p?.icon ?? PackageOpen;
  const ttl    = title       ?? p?.title       ?? "Nothing here";
  const desc   = description ?? p?.description ?? "";
  const action = cta         ?? p?.cta;

  return (
    <div
      className={[
        "flex flex-col items-center justify-center rounded-2xl bg-white py-16 px-6 shadow-card text-center",
        className,
      ].join(" ")}
    >
      {/* Icon bubble */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300 mb-4">
        <Icon className="h-7 w-7" />
      </div>

      <p className="text-base font-bold text-slate-800">{ttl}</p>
      {desc && (
        <p className="mt-1.5 max-w-[240px] text-sm text-slate-400 leading-relaxed">
          {desc}
        </p>
      )}

      {action && (
        <Link
          href={action.href}
          className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-glow-primary transition hover:brightness-110 active:scale-95"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
