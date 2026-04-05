"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePortalAuth } from "../../../context/PortalAuthContext";
import { supabase } from "../../../lib/supabase";

export default function PendingPage() {
  const { garage, signOut, refreshGarage } = usePortalAuth();
  const router    = useRouter();
  const pollRef   = useRef(null);

  // Poll every 30 seconds — when approved, redirect to dashboard
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      await refreshGarage();
    }, 30000);
    return () => clearInterval(pollRef.current);
  }, []);

  // If garage gets approved, PortalAuthContext will redirect automatically
  // But also handle manual refresh here
  useEffect(() => {
    if (garage?.status === "approved") {
      router.replace("/portal/dashboard");
    }
  }, [garage?.status]);

  return (
    <div className="min-h-screen bg-[#f9f9fe] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-[#e8e8f0] text-center">

          {/* Animated inspection icon */}
          <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-30" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 border-2 border-amber-200">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                <path d="M11 8v3l2 2"/>
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-black text-[#1a1c1f] mb-2">Inspection in Progress</h1>
          <p className="text-sm text-[#727687] leading-relaxed mb-6">
            Our team is reviewing your garage details. Your garage will be listed on GarageDekho within <span className="font-bold text-[#1a1c1f]">1–2 hours</span>.
          </p>

          {/* Steps */}
          <div className="space-y-3 mb-8 text-left">
            {[
              { label: "Registration received",     done: true  },
              { label: "Details under review",       done: false, active: true },
              { label: "Garage goes live",           done: false },
            ].map(({ label, done, active }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  done   ? "bg-green-500" :
                  active ? "bg-amber-400 animate-pulse" :
                           "bg-[#e8e8f0]"
                }`}>
                  {done ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : active ? (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-[#c2c6d8]" />
                  )}
                </div>
                <p className={`text-sm font-semibold ${
                  done ? "text-green-600" : active ? "text-amber-600" : "text-[#c2c6d8]"
                }`}>{label}</p>
              </div>
            ))}
          </div>

          {/* Garage name */}
          {garage?.garage_name && (
            <div className="rounded-2xl bg-[#f3f3f8] px-4 py-3 mb-6">
              <p className="text-xs text-[#727687]">Registered as</p>
              <p className="text-base font-black text-[#1a1c1f] mt-0.5">{garage.garage_name}</p>
              {garage.city && <p className="text-xs text-[#727687] mt-0.5">{garage.city}</p>}
            </div>
          )}

          <p className="text-xs text-[#c2c6d8] mb-6">
            This page refreshes automatically. You&apos;ll be redirected to your dashboard once approved.
          </p>

          <button
            type="button"
            onClick={signOut}
            className="text-sm text-[#727687] hover:text-[#1a1c1f] transition-colors"
          >
            Sign out
          </button>
        </div>

      </div>
    </div>
  );
}
