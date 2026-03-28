"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    label: "Home",
    href: "/",
    isHome: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    iconFilled: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><rect x="9" y="12" width="6" height="10" fill="white" rx="0.5"/>
      </svg>
    ),
  },
  {
    label: "Near Me",
    href: "/near-me",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
    iconFilled: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="8" fill="currentColor"/>
        <circle cx="11" cy="11" r="5" fill="white"/>
        <line x1="16.65" y1="16.65" x2="21" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: "SOS",
    href: "/sos",
    isSOS: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    iconFilled: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <line x1="12" y1="17" x2="12.01" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: "Bookings",
    href: "/bookings",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
    iconFilled: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <rect x="6" y="13" width="3" height="3" rx="0.5" fill="currentColor"/>
        <rect x="10.5" y="13" width="3" height="3" rx="0.5" fill="currentColor"/>
        <rect x="15" y="13" width="3" height="3" rx="0.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/profile",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    iconFilled: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

const HIDDEN_ON = ["/admin", "/sos", "/garage/", "/partner", "/portal"];

export default function BottomNav() {
  const pathname = usePathname();

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-[600] md:hidden"
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))", paddingLeft: 12, paddingRight: 12 }}
    >
      {/* Floating pill nav bar */}
      <div className="mx-auto flex max-w-md items-center justify-around rounded-[32px] bg-white/95 px-2 pt-1 pb-1 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[#e8e8f0]">
        {NAV_ITEMS.map(({ label, href, icon, iconFilled, isSOS, isHome }) => {
          const active = isHome ? pathname === "/" : pathname.startsWith(href);

          if (isSOS) {
            return (
              <Link
                key={label}
                href={href}
                aria-label="SOS Emergency"
                aria-current={active ? "page" : undefined}
                className="relative flex flex-col items-center justify-center gap-0.5 px-3 py-1 active:scale-90 transition-transform duration-150"
              >
                <div className={`relative flex h-[38px] w-[38px] items-center justify-center rounded-full transition-colors duration-150 ${
                  active ? "bg-[#ba1a1a] text-white" : "bg-[#ffdad6] text-[#ba1a1a]"
                }`}>
                  {active ? iconFilled : icon}
                  {!active && (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#ba1a1a] ring-2 ring-white" aria-hidden="true" />
                  )}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-widest ${active ? "text-[#ba1a1a]" : "text-[#424656]"}`}>
                  {label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={label}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 min-w-[44px] active:scale-90 transition-transform duration-150"
            >
              <div className={`flex h-[38px] w-[38px] items-center justify-center rounded-2xl transition-colors duration-150 ${
                active
                  ? "bg-[#d8e2ff]/60 text-[#0056b7]"
                  : "text-[#727687] hover:text-[#424656]"
              }`}>
                {active ? iconFilled : icon}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-widest ${
                active ? "text-[#0056b7]" : "text-[#727687]"
              }`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
