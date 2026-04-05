"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Siren, Users, User } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { usePortalAuth } from "../../context/PortalAuthContext";

const NAV = [
  { href: "/portal/dashboard",  label: "Home",     icon: LayoutDashboard },
  { href: "/portal/sos",        label: "SOS",      icon: Siren           },
  { href: "/portal/mechanics",  label: "Team",     icon: Users           },
  { href: "/portal/profile",    label: "Profile",  icon: User            },
];

export default function PortalNav() {
  const pathname   = usePathname();
  const { garage } = usePortalAuth();
  const [pendingCount, setPendingCount] = useState(0);

  // All hooks must run unconditionally - hide via return below after hooks
  useEffect(() => {
    if (!garage) return;

    async function fetchCount() {
      const { count } = await supabase
        .from("sos_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      setPendingCount(count ?? 0);
    }

    fetchCount();

    const ch = supabase
      .channel("portal-nav-sos-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_requests" }, fetchCount)
      .subscribe();

    return () => ch.unsubscribe();
  }, [garage]);

  // Hide on login / register (after all hooks)
  if (pathname === "/portal/login" || pathname.startsWith("/portal/register")) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F172A] border-t border-white/10 flex md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-semibold transition-colors ${
              active ? "text-[#60a5fa]" : "text-white/40 hover:text-white/70"
            }`}
          >
            <div className="relative">
              <Icon className={`h-5 w-5 ${active ? "text-[#60a5fa]" : ""}`} />
              {label === "SOS" && pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white leading-none">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </div>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
