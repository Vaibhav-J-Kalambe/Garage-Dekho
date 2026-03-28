"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useLocation } from "../context/LocationContext";
import LocationPopup from "./LocationPopup";

const NAV_LINKS = [
  { label: "Home",     href: "/"         },
  { label: "Near Me",  href: "/near-me"  },
  { label: "Bookings", href: "/bookings" },
  { label: "Offers",   href: "/offers"   },
];

export default function Header() {
  const pathname     = usePathname();
  const { user }     = useAuth();
  const { location } = useLocation();

  const [showLocation, setShowLocation] = useState(false);
  const [scrolled,     setScrolled]     = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const name      = user?.user_metadata?.full_name || user?.email?.split("@")[0] || null;
  const firstName = name?.split(" ")[0] || null;
  const avatarChar = (name || "G")[0].toUpperCase();

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-200 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.04)]"
            : "bg-white/80 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3 md:px-6 md:py-4">

          {/* ── Left: avatar + brand ── */}
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <Link href="/profile" aria-label="View profile">
              <div className="h-9 w-9 rounded-full bg-[#d8e2ff] flex items-center justify-center overflow-hidden shrink-0">
                <span className="text-[15px] font-black text-[#0056b7] leading-none select-none">
                  {avatarChar}
                </span>
              </div>
            </Link>

            {/* Brand name */}
            <Link
              href="/"
              className="text-[1.1rem] font-black tracking-tight text-[#0056b7] select-none"
            >
              GarageDekho
            </Link>
          </div>

          {/* ── Center: nav links (desktop only) ── */}
          <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ label, href }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={label}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-[color,background-color] duration-150 ${
                    active
                      ? "bg-[#d8e2ff]/60 text-[#0056b7]"
                      : "text-[#424656] hover:bg-[#f3f3f8] hover:text-[#1a1c1f]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* ── Right: location + notification + partner ── */}
          <div className="flex items-center gap-2">

            {/* Location pill */}
            <button
              type="button"
              aria-label={location ? `Location: ${location.area}. Tap to change` : "Set your location"}
              onClick={() => setShowLocation((v) => !v)}
              className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#f3f3f8] px-3 py-2 text-[12px] font-semibold text-[#424656] transition-colors duration-150 hover:bg-[#ededf2] active:scale-95 min-h-[36px]"
            >
              {/* Pin icon */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0056b7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span className="max-w-[80px] truncate">
                {location?.area || "Set location"}
              </span>
            </button>

            {/* For Garages — desktop only */}
            <Link
              href="/portal/login"
              className="hidden md:flex items-center rounded-full border border-[#c2c6d8]/50 px-4 py-2 text-[13px] font-semibold text-[#424656] transition-colors duration-150 hover:bg-[#f3f3f8] hover:text-[#1a1c1f] active:scale-95"
            >
              For Garages
            </Link>

            {/* Notification bell */}
            <Link
              href="/offers"
              aria-label="Offers & notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150 hover:bg-[#f3f3f8] active:scale-95"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#424656" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {/* Notification dot */}
              <span
                aria-hidden="true"
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#ba1a1a] ring-2 ring-white"
              />
            </Link>

          </div>
        </div>
      </header>

      {showLocation && <LocationPopup onClose={() => setShowLocation(false)} />}
    </>
  );
}
