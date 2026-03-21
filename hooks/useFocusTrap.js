"use client";

import { useEffect } from "react";

const FOCUSABLE_SELECTORS = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/**
 * Traps keyboard focus inside `ref` while `active` is true.
 * - Focuses the first focusable element on mount.
 * - Tab / Shift+Tab cycle within the container.
 * - Escape key calls `onEscape` (optional).
 */
export function useFocusTrap(ref, { active = true, onEscape } = {}) {
  useEffect(() => {
    if (!active || !ref.current) return;

    const container = ref.current;
    const previouslyFocused = document.activeElement;

    // Focus first focusable element
    const focusables = Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS));
    focusables[0]?.focus();

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onEscape?.();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS));
      if (focusable.length === 0) { e.preventDefault(); return; }

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to element that was focused before modal opened
      previouslyFocused?.focus?.();
    };
  }, [active, ref, onEscape]);
}
