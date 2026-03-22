"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";

const PortalAuthContext = createContext({
  portalUser: null,  // { id, email }
  garage: null,      // portal_garages row
  loading: true,
  signOut: async () => {},
  refreshGarage: async () => {},
});

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
        if (pathname !== "/portal/login" && pathname !== "/portal/register") {
          router.replace("/portal/login");
        }
        return;
      }

      setPortalUser(session.user);
      await loadGarage(session.user.id, mounted);
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (!session?.user) {
        setPortalUser(null);
        setGarage(null);
        setLoading(false);
        router.replace("/portal/login");
        return;
      }
      setPortalUser(session.user);
      await loadGarage(session.user.id, mounted);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadGarage(userId, mounted = true) {
    const { data } = await supabase
      .from("portal_garages")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!mounted) return;

    if (!data) {
      // Session exists but no garage record — registration was incomplete
      setLoading(false);
      if (!pathname.startsWith("/portal/register") && pathname !== "/portal/login") {
        router.replace("/portal/register?complete=1");
      }
      return;
    }

    setGarage(data);
    setLoading(false);
  }

  async function refreshGarage() {
    if (!portalUser) return;
    await loadGarage(portalUser.id);
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
