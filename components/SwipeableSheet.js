"use client";

import { useRef, useState } from "react";

const DISMISS_THRESHOLD = 110; // px dragged down to trigger close

/**
 * Wraps the inner modal sheet with swipe-to-dismiss on mobile.
 * - Only activates on touch devices (pointer: coarse).
 * - Only swipes when already at scrollTop === 0 (doesn't fight scroll).
 * - On desktop (items-center modals) touch drag is irrelevant — no interference.
 *
 * Usage:
 *   <SwipeableSheet onClose={onClose} className="...sheet classes...">
 *     ...content...
 *   </SwipeableSheet>
 */
export default function SwipeableSheet({ onClose, className = "", style: styleProp, children, scrollRef, hideHandle = false }) {
  const startY    = useRef(0);
  const dragging  = useRef(false);
  const [dragY,   setDragY]   = useState(0);
  const [leaving, setLeaving] = useState(false);

  function onTouchStart(e) {
    // Only activate when the scrollable container is at the top
    const scrollTop = scrollRef?.current?.scrollTop ?? 0;
    if (scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    dragging.current = true;
  }

  function onTouchMove(e) {
    if (!dragging.current) return;
    const scrollTop = scrollRef?.current?.scrollTop ?? 0;
    if (scrollTop > 0) { dragging.current = false; setDragY(0); return; }
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setDragY(delta);
      // Prevent page scroll while dragging the sheet
      e.preventDefault();
    }
  }

  function onTouchEnd() {
    if (!dragging.current) return;
    dragging.current = false;
    if (dragY >= DISMISS_THRESHOLD) {
      // Animate out then close
      setLeaving(true);
      setTimeout(onClose, 260);
    } else {
      setDragY(0);
    }
  }

  const translateY = leaving ? "100%" : `${dragY}px`;
  const transition  = dragging.current
    ? "none"
    : "transform 0.28s cubic-bezier(0.32,0,0.67,0)";

  return (
    <div
      className={className}
      style={{ transform: `translateY(${translateY})`, transition, ...styleProp }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {!hideHandle && (
        <div className="flex justify-center pt-3 pb-1 md:hidden" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-[#c2c6d8]/40" />
        </div>
      )}
      {children}
    </div>
  );
}
