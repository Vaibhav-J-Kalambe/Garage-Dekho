"use client";

import { useState, useRef, useEffect } from "react";
import { X, KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function OTPCheckInModal({ booking, onClose, onSuccess }) {
  const [digits,  setDigits]  = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef([]);

  /* Auto-focus first input on mount */
  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  function handleChange(idx, val) {
    const char = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = char;
    setDigits(next);
    setError(null);
    if (char && idx < 5) inputRefs.current[idx + 1]?.focus();
  }

  function handleKeyDown(idx, e) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  }

  async function handleVerify() {
    const otp = digits.join("");
    if (otp.length < 6) { setError("Enter all 6 digits."); return; }

    setLoading(true); setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/booking/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + session?.access_token,
        },
        body: JSON.stringify({ booking_id: booking.id, otp }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Verification failed."); return; }
      setSuccess(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1800);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1e1e22] p-6 shadow-2xl animate-slide-up">

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center animate-slide-up">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-9 w-9 text-green-500" />
            </div>
            <p className="text-lg font-black text-[#1a1c1f] dark:text-white">Checked In!</p>
            <p className="text-sm text-[#727687]">Your service has started. Sit back and relax!</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d8e2ff] text-[#0056b7]">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#1a1c1f] dark:text-white">Enter Check-In OTP</p>
                  <p className="text-[11px] text-[#727687]">Ask garage staff for the 6-digit code</p>
                </div>
              </div>
              <button type="button" onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f3f8] dark:bg-[#2a2a2e] text-[#727687] transition hover:bg-[#ededf2] active:scale-95">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Booking info */}
            <div className="mb-5 rounded-2xl bg-[#f9f9fe] dark:bg-[#2a2a2e] px-4 py-3">
              <p className="text-xs text-[#727687]">Booking for</p>
              <p className="text-sm font-bold text-[#1a1c1f] dark:text-white truncate">{booking.garageName}</p>
              <p className="text-xs text-[#424656]">{booking.service} · {booking.date} · {booking.time}</p>
            </div>

            {/* OTP inputs */}
            <div className="flex items-center justify-center gap-2 mb-5" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`h-12 w-10 rounded-xl border-2 text-center text-xl font-black text-[#1a1c1f] dark:text-white bg-[#f9f9fe] dark:bg-[#2a2a2e] outline-none transition-colors ${
                    d ? "border-[#0056b7] bg-[#d8e2ff]/30" : "border-[#e8e8f0] dark:border-[#3a3a3e]"
                  } focus:border-[#0056b7]`}
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-center text-sm font-semibold text-red-500">
                {error}
              </p>
            )}

            {/* Verify button */}
            <button
              type="button"
              onClick={handleVerify}
              disabled={loading || digits.join("").length < 6}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0056b7] text-sm font-bold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</> : "Verify & Check In"}
            </button>

            <p className="mt-3 text-center text-[11px] text-[#727687]">
              OTP is valid for 30 minutes. If expired, ask staff to regenerate.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
