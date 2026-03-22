"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Navigation, CalendarCheck, User, AlertTriangle } from "lucide-react";

const LEFT_ITEMS = [
  { label: "Home",    icon: Home,       href: "/"        },
  { label: "Near Me", icon: Navigation, href: "/near-me" },
];

const RIGHT_ITEMS = [
  { label: "Bookings", icon: CalendarCheck, href: "/bookings" },
  { label: "Profile",  icon: User,          href: "/profile"  },
];

const HIDDEN_ON = ["/admin", "/sos", "/garage/", "/partner", "/portal"];

export default function BottomNav() {
  const pathname = usePathname();

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-50 glass shadow-nav md:hidden">
      <div
        className="mx-auto flex max-w-md items-center justify-around px-2 pt-2"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >

        {/* Left nav items */}
        {LEFT_ITEMS.map(({ label, icon: Icon, href }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={label} href={href} aria-current={active ? "page" : undefined} aria-label={label} className="flex flex-col items-center gap-1 px-3 py-1 group">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-[transform,background-color,box-shadow,color] duration-200 ${
                active
                  ? "bg-primary text-white shadow-glow-primary scale-110"
                  : "text-slate-400 group-hover:text-slate-600 group-hover:bg-slate-100"
              }`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className={`text-xs font-semibold transition-colors duration-200 ${
                active ? "text-primary" : "text-slate-400"
              }`}>{label}</span>
            </Link>
          );
        })}

        {/* SOS — center, always in thumb zone, min 44px touch target */}
        <Link href="/sos" aria-label="SOS Emergency assistance" className="flex flex-col items-center gap-1 px-3 py-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-[#D32F2F] shadow-[0_4px_16px_rgba(211,47,47,0.38)] transition-transform duration-150 active:scale-95">
            <AlertTriangle className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <span className="text-xs font-black text-red-800 tracking-wide">SOS</span>
        </Link>

        {/* Right nav items */}
        {RIGHT_ITEMS.map(({ label, icon: Icon, href }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={label} href={href} aria-current={active ? "page" : undefined} aria-label={label} className="flex flex-col items-center gap-1 px-3 py-1 group">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-[transform,background-color,box-shadow,color] duration-200 ${
                active
                  ? "bg-primary text-white shadow-glow-primary scale-110"
                  : "text-slate-400 group-hover:text-slate-600 group-hover:bg-slate-100"
              }`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className={`text-xs font-semibold transition-colors duration-200 ${
                active ? "text-primary" : "text-slate-400"
              }`}>{label}</span>
            </Link>
          );
        })}

      </div>
    </nav>
  );
}
