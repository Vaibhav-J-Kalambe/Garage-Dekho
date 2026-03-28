"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressBar() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [visible,  setVisible]  = useState(false);
  const [width,    setWidth]    = useState(0);
  const prevUrl    = useRef(`${pathname}${searchParams}`);
  const rafRef     = useRef(null);
  const timerRef   = useRef(null);

  // Start bar on link click
  useEffect(() => {
    function onLinkClick(e) {
      const anchor = e.target.closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto")) return;
      clearTimeout(timerRef.current);
      setVisible(true);
      setWidth(10);
      // Animate to ~70% quickly, then slow down (simulates loading)
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => setWidth(72));
      });
    }
    document.addEventListener("click", onLinkClick);
    return () => document.removeEventListener("click", onLinkClick);
  }, []);

  // Finish bar when pathname changes (navigation complete)
  useEffect(() => {
    const currentUrl = `${pathname}${searchParams}`;
    if (prevUrl.current === currentUrl) return;
    prevUrl.current = currentUrl;
    cancelAnimationFrame(rafRef.current);
    setWidth(100);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 450);
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 z-[9999] h-[3px] bg-gradient-to-r from-[#0056b7] via-[#3b82f6] to-[#0056b7] shadow-[0_0_8px_rgba(0,86,183,0.6)]"
      style={{ width: `${width}%`, transition: width === 100 ? "width 0.25s ease-out" : "width 0.6s ease-out" }}
    />
  );
}

export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  );
}
