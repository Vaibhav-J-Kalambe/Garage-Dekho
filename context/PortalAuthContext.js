"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";

const PortalAuthContext = createContext({
  portalUser: null,
  garage:     null,
  loading:    true,
  signOut:       async () => {},
  refreshGarage: async () => {},
});

// Pages that don't require a session
const PUBLIC_PATHS  = ["/portal/login", "/portal/register", "/portal/forgot-password", "/portal/reset-password"];
// Pages allowed when session exists but no garage record yet
const REGISTER_SAFE = ["/portal/register", "/portal/forgot-password", "/portal/reset-password"];
// Pages allowed when garage is pending approval
const PENDING_SAFE  = ["/portal/pending", "/portal/forgot-password", "/portal/reset-password"];

function isPublic(path)      { return PUBLIC_PATHS.some(p  => path.startsWith(p)); }
function isRegisterSafe(path){ return REGISTER_SAFE.some(p => path.startsWith(p)); }
function isPendingSafe(path) { return PENDING_SAFE.some(p  => path.startsWith(p)); }

export function PortalAuthProvider({ children }) {
  const [portalUser, setPortalUser] = useState(null);
  const [garage,     setGarage]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!session?.user) {
        setLoading(false);
        // No session — only allow public pages
        if (!isPublic(pathname)) router.replace("/portal/login");
        return;
      }

      // Session exists but on reset-password — let the page handle itself
      if (pathname.startsWith("/portal/reset-password")) {
        setLoading(false);
        return;
      }

      setPortalUser(session.user);
      await loadGarage(session.user.id, mounted);
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // On sign-out, kick to login immediately
      if (!session?.user) {
        setPortalUser(null);
        setGarage(null);
        setLoading(false);
        if (!isPublic(pathname)) router.replace("/portal/login");
        return;
      }

      // Don't interfere with reset-password flow
      if (pathname.startsWith("/portal/reset-password")) return;

      setPortalUser(session.user);
      await loadGarage(session.user.id, mounted);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  async function loadGarage(userId, mounted = true) {
    const { data } = await supabase
      .from("portal_garages")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!mounted) return;

    // Authenticated but no garage — force to registration
    if (!data) {
      setGarage(null);
      setLoading(false);
      if (!isRegisterSafe(pathname)) router.replace("/portal/register?complete=1");
      return;
    }

    setGarage(data);
    setLoading(false);

    if (data.status === "pending" || data.status === null) {
      // Pending partners can only see the pending screen
      if (!isPendingSafe(pathname)) router.replace("/portal/pending");
    } else if (data.status === "rejected") {
      // Rejected partners can only re-register
      if (!isRegisterSafe(pathname)) router.replace("/portal/register?complete=1");
    } else {
      // Approved partners — redirect away from auth/pending pages to dashboard
      if (isPublic(pathname) || pathname === "/portal/pending") {
        router.replace("/portal/dashboard");
      }
    }
  }

  async function refreshGarage() {
    if (portalUser) await loadGarage(portalUser.id);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setPortalUser(null);
    setGarage(null);
    router.replace("/portal/login");
  }

  return (
    <PortalAuthContext.Provider value={{ portalUser, garage, loading, signOut, refreshGarage }}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  return useContext(PortalAuthContext);
}
