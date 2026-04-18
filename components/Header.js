"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useLocation } from "../context/LocationContext";
import LocationPopup from "./LocationPopup";
import { useTheme } from "./ThemeProvider";

const NAV_LINKS = [
  { label: "Home",     href: "/"         },
  { label: "Near Me",  href: "/near-me"  },
  { label: "Bookings", href: "/bookings" },
  { label: "Offers",   href: "/offers"   },
];

export default function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { location } = useLocation();

  const { theme, toggle: toggleTheme } = useTheme();
  const [showLocation, setShowLocation] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || null;
  const avatarChar = (name || "G")[0].toUpperCase();

  return (
    <>
      <header
        className={`fixed left-0 right-2 top-0 z-50 shadow-[0_1px_4px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.2)] transition-[background-color] duration-200 ${
          scrolled
            ? "bg-[#f9f9fe] dark:bg-[#1a1a1e]"
            : "bg-[#f9f9fe] dark:bg-[#111113]"
        }`}
      >
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3 md:px-6 md:py-4">

          {/* ── Left: brand name only ── */}
          <Link
            href="/"
            className="text-[1.4rem] font-black tracking-tight select-none"
            style={{ background: "linear-gradient(90deg, #006de6 0%, #0056b7 50%, #1a3fa8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
          >
            GarageDekho
          </Link>

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
                      ? "bg-[#d8e2ff]/60 dark:bg-[#1a2f52] text-[#0056b7] dark:text-[#4d91ff]"
                      : "text-[#424656] dark:text-[#c7c5d0] hover:bg-[#f3f3f8] dark:hover:bg-[#1e1e22] hover:text-[#1a1c1f] dark:hover:text-[#e4e2e6]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* ── Right: location + notification + profile ── */}
          <div className="flex items-center gap-2">

            {/* Location pill */}
            <button
              type="button"
              aria-label={location ? `Location: ${location.area}. Tap to change` : "Set your location"}
              onClick={() => setShowLocation((v) => !v)}
              className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#f3f3f8] dark:bg-[#1e1e22] px-3 py-2 text-[12px] font-semibold text-[#424656] dark:text-[#c7c5d0] transition-colors duration-150 hover:bg-[#ededf2] dark:hover:bg-[#28282c] active:scale-95 min-h-[44px]"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0056b7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span className="max-w-[80px] truncate">
                {location?.area || "Set location"}
              </span>
            </button>

            {/* Theme toggle */}
            <button
              type="button"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150 hover:bg-[#f3f3f8] dark:hover:bg-[#1e1e22] active:scale-95"
            >
              {theme === "dark" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c7c5d0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#424656" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            {/* Notification bell */}
            <Link
              href="/offers"
              aria-label="Offers & notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150 hover:bg-[#f3f3f8] dark:hover:bg-[#1e1e22] active:scale-95"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-[#424656] dark:text-[#c7c5d0]">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span aria-hidden="true" className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#ba1a1a] ring-2 ring-[#f9f9fe] dark:ring-[#1a1a1e]" />
            </Link>

            {/* Profile avatar */}
            <Link href="/profile" aria-label="View profile">
              <div className="h-9 w-9 rounded-full bg-[#d8e2ff] dark:bg-[#1a2f52] flex items-center justify-center overflow-hidden shrink-0">
                <span className="text-[15px] font-black text-[#0056b7] dark:text-[#4d91ff] leading-none select-none">
                  {avatarChar}
                </span>
              </div>
            </Link>

          </div>

        </div>
      </header>

      {showLocation && <LocationPopup onClose={() => setShowLocation(false)} />}
    </>
  );
}
