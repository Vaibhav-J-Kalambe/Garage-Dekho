"use client";

import Link from "next/link";

/* ── Inline SVG illustrations ── */
function IlloBookings() {
  return (
    <svg viewBox="0 0 96 96" className="h-24 w-24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="48" cy="48" r="44" fill="#EFF6FF" />
      <rect x="24" y="28" width="48" height="40" rx="6" fill="#BFDBFE" />
      <rect x="24" y="28" width="48" height="12" rx="6" fill="#3B82F6" />
      <circle cx="35" cy="34" r="3" fill="white" opacity="0.7" />
      <circle cx="48" cy="34" r="3" fill="white" opacity="0.7" />
      <circle cx="61" cy="34" r="3" fill="white" opacity="0.7" />
      <rect x="32" y="48" width="14" height="3" rx="1.5" fill="#93C5FD" />
      <rect x="32" y="55" width="20" height="3" rx="1.5" fill="#93C5FD" />
      <rect x="32" y="62" width="10" height="3" rx="1.5" fill="#93C5FD" />
      <circle cx="66" cy="62" r="10" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="2" strokeDasharray="3 2" />
      <path d="M62 62l3 3 6-6" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IlloSearch() {
  return (
    <svg viewBox="0 0 96 96" className="h-24 w-24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="48" cy="48" r="44" fill="#FFF7ED" />
      <circle cx="42" cy="42" r="18" fill="#FED7AA" stroke="#FB923C" strokeWidth="2.5" />
      <circle cx="42" cy="42" r="10" fill="#FFEDD5" />
      <line x1="55" y1="55" x2="68" y2="68" stroke="#FB923C" strokeWidth="3" strokeLinecap="round" />
      <path d="M37 42h10M42 37v10" stroke="#FB923C" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IlloNearMe() {
  return (
    <svg viewBox="0 0 96 96" className="h-24 w-24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="48" cy="48" r="44" fill="#F0FDF4" />
      <path d="M48 20c-10 0-18 8-18 18 0 12 18 38 18 38s18-26 18-38c0-10-8-18-18-18z" fill="#BBF7D0" stroke="#22C55E" strokeWidth="2" />
      <circle cx="48" cy="38" r="7" fill="#22C55E" />
      <circle cx="48" cy="38" r="3" fill="white" />
      <ellipse cx="48" cy="80" rx="12" ry="3" fill="#BBF7D0" opacity="0.5" />
    </svg>
  );
}

function IlloOffers() {
  return (
    <svg viewBox="0 0 96 96" className="h-24 w-24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="48" cy="48" r="44" fill="#FFFBEB" />
      <rect x="22" y="36" width="52" height="32" rx="6" fill="#FDE68A" />
      <rect x="22" y="36" width="52" height="12" rx="6" fill="#F59E0B" />
      <circle cx="48" cy="36" r="5" fill="white" stroke="#F59E0B" strokeWidth="2" />
      <rect x="32" y="55" width="12" height="3" rx="1.5" fill="#FCD34D" />
      <rect x="52" y="55" width="12" height="3" rx="1.5" fill="#FCD34D" />
      <path d="M42 46l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IlloSaved() {
  return (
    <svg viewBox="0 0 96 96" className="h-24 w-24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="48" cy="48" r="44" fill="#FFF1F2" />
      <path d="M48 68s-22-14-22-28c0-8 6-14 14-14 4 0 8 2 8 2s4-2 8-2c8 0 14 6 14 14 0 14-22 28-22 28z" fill="#FECDD3" stroke="#F87171" strokeWidth="2" />
      <path d="M48 58s-12-8-12-16c0-4 3-7 7-7 2 0 5 2 5 2s3-2 5-2c4 0 7 3 7 7 0 8-12 16-12 16z" fill="#F87171" />
    </svg>
  );
}

function IlloGeneric() {
  return (
    <svg viewBox="0 0 96 96" className="h-24 w-24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="48" cy="48" r="44" fill="#F8FAFC" />
      <rect x="28" y="30" width="40" height="36" rx="6" fill="#E2E8F0" />
      <rect x="36" y="40" width="24" height="3" rx="1.5" fill="#CBD5E1" />
      <rect x="36" y="48" width="16" height="3" rx="1.5" fill="#CBD5E1" />
      <circle cx="48" cy="68" r="6" fill="#CBD5E1" />
      <path d="M48 62v-4M48 74v0" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const PRESETS = {
  bookings: {
    illo: IlloBookings,
    title: "No bookings yet",
    description: "Your upcoming service appointments will appear here.",
    cta: { label: "Find a Garage", href: "/" },
  },
  "bookings-past": {
    illo: IlloBookings,
    title: "No past bookings",
    description: "Completed and cancelled bookings will show up here.",
  },
  search: {
    illo: IlloSearch,
    title: "No results found",
    description: "Try a different search term or clear your filters.",
  },
  "near-me": {
    illo: IlloNearMe,
    title: "No garages nearby",
    description: "Try expanding your search radius or adjusting filters.",
  },
  offers: {
    illo: IlloOffers,
    title: "No offers right now",
    description: "Check back soon — new deals are added regularly.",
  },
  saved: {
    illo: IlloSaved,
    title: "No saved garages",
    description: "Tap the heart on any garage to save it here.",
    cta: { label: "Browse Garages", href: "/near-me" },
  },
};

export default function EmptyState({
  preset,
  illustration: IlloProp,
  title,
  description,
  cta,
  className = "",
}) {
  const p      = preset ? PRESETS[preset] : null;
  const Illo   = IlloProp ?? p?.illo ?? IlloGeneric;
  const ttl    = title       ?? p?.title       ?? "Nothing here";
  const desc   = description ?? p?.description ?? "";
  const action = cta         ?? p?.cta;

  return (
    <div className={["flex flex-col items-center justify-center rounded-2xl bg-white py-14 px-6 shadow-card text-center animate-slide-up", className].join(" ")}>
      <Illo />
      <p className="mt-4 text-base font-black text-slate-800">{ttl}</p>
      {desc && (
        <p className="mt-1.5 max-w-[240px] text-sm text-slate-500 leading-relaxed">{desc}</p>
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
