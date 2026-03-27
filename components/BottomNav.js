"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Navigation, AlertTriangle, CalendarCheck, User } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home",     icon: Home,          href: "/"         },
  { label: "Near Me",  icon: Navigation,    href: "/near-me"  },
  { label: "SOS",      icon: AlertTriangle, href: "/sos",      isSOS: true },
  { label: "Bookings", icon: CalendarCheck, href: "/bookings" },
  { label: "Profile",  icon: User,          href: "/profile"  },
];

const HIDDEN_ON = ["/admin", "/sos", "/garage/", "/partner", "/portal"];

export default function BottomNav() {
  const pathname = usePathname();

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ padding: "8px 16px", paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-sm items-center justify-around rounded-2xl bg-primary px-1.5 py-1">
        {NAV_ITEMS.map(({ label, icon: Icon, href, isSOS }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 transition-[background-color,transform] duration-150 active:scale-95 ${
                active ? "bg-accent" : "bg-transparent"
              }`}
            >
              {/* SOS always has an orange-red dot indicator */}
              <div className="relative">
                <Icon
                  className={`h-5 w-5 ${
                    active ? "text-white" : isSOS ? "text-[#FF4D2D]" : "text-[#555555]"
                  }`}
                  aria-hidden="true"
                />
                {isSOS && !active && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#FF4D2D]" aria-hidden="true" />
                )}
              </div>
              <span
                className={`text-[10px] font-semibold leading-tight ${
                  active ? "text-white" : isSOS ? "text-[#FF4D2D]" : "text-[#555555]"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
