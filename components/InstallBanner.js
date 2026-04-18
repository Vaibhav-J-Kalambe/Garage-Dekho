"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

export default function InstallBanner() {
  const [prompt, setPrompt]     = useState(null);
  const [visible, setVisible]   = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    /* Don't show if already installed (standalone mode) */
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    /* Don't show if user already dismissed */
    const dismissed = sessionStorage.getItem("gd_install_dismissed");
    if (dismissed) return;

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      /* Small delay so it doesn't pop immediately on page load */
      setTimeout(() => setVisible(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem("gd_install_dismissed", "1");
  }

  async function install() {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setVisible(false);
  }

  if (!visible || installed) return null;

  return (
    <div
      className="fixed bottom-[calc(72px+env(safe-area-inset-bottom,0px)+12px)] left-3 right-3 z-50 animate-slide-up md:left-auto md:right-6 md:w-80"
      role="alertdialog"
      aria-label="Install GarageDekho"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-[#1a1c1f] px-4 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
        {/* App icon */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0056b7]">
          <img src="/icons/icon-192.png" alt="GarageDekho" className="h-8 w-8 rounded-lg object-cover" />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white leading-tight">Add to Home Screen</p>
          <p className="text-xs text-white/60 leading-tight mt-0.5">Install GarageDekho for faster access</p>
        </div>

        {/* Install button */}
        <button
          type="button"
          onClick={install}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0056b7] px-3 py-2 text-xs font-bold text-white transition hover:brightness-110 active:scale-95"
        >
          <Download className="h-3.5 w-3.5" />
          Install
        </button>

        {/* Close */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/40 transition hover:text-white active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
