"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, IndianRupee, Clock, CheckCircle2, Copy, Check } from "lucide-react";
import Link from "next/link";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // reads via RLS policy
);

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

function fmt(paise) {
  return "₹" + (paise / 100).toLocaleString("en-IN");
}

export default function PayoutsPage() {
  const [authed,   setAuthed]   = useState(false);
  const [pw,       setPw]       = useState("");
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("all"); // all | pending | paid
  const [copied,   setCopied]   = useState(null);

  useEffect(() => {
    if (!authed) return;
    supabaseAdmin
      .from("payments")
      .select("*, portal_garages(upi_id, bank_account_name, bank_account_number, bank_ifsc)")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setPayments(data || []); setLoading(false); });
  }, [authed]);

  async function markPaid(id) {
    await supabaseAdmin
      .from("payments")
      .update({ payout_status: "paid" })
      .eq("id", id);
    setPayments((prev) =>
      prev.map((p) => p.id === id ? { ...p, payout_status: "paid" } : p)
    );
  }

  function copyId(text) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#f9f9fe] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-card">
          <h1 className="text-xl font-black text-[#1a1c1f] mb-6">Admin · Payouts</h1>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Admin password"
            className="w-full rounded-xl border border-[#e8e8f0] px-4 py-3 text-sm mb-4 outline-none focus:border-[#0056b7]"
            onKeyDown={(e) => e.key === "Enter" && pw === ADMIN_PASSWORD && setAuthed(true)}
          />
          <button
            onClick={() => pw === ADMIN_PASSWORD ? setAuthed(true) : alert("Wrong password")}
            className="w-full rounded-xl bg-[#0056b7] text-white py-3 text-sm font-bold hover:brightness-110"
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  const filtered = filter === "all" ? payments : payments.filter((p) => p.payout_status === filter);

  // Summary stats
  const captured  = payments.filter((p) => p.status === "captured");
  const totalRev  = captured.reduce((s, p) => s + (p.amount_total || 0), 0);
  const totalComm = captured.reduce((s, p) => s + (p.amount_commission || 0), 0);
  const pendingPayout = captured
    .filter((p) => p.payout_status === "pending")
    .reduce((s, p) => s + (p.amount_garage || 0), 0);

  return (
    <div className="min-h-screen bg-[#f9f9fe] pb-16">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-[#e8e8f0] px-4 py-4 flex items-center gap-3">
        <Link href="/admin" className="text-[#424656] hover:text-[#1a1c1f]">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-base font-black text-[#1a1c1f]">Payouts Tracker</h1>
      </div>

      <div className="mx-auto max-w-4xl px-4 pt-6 space-y-6">

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Collected", value: fmt(totalRev), color: "text-[#0056b7]" },
            { label: "Your Commission", value: fmt(totalComm), color: "text-green-600" },
            { label: "Pending Payouts", value: fmt(pendingPayout), color: "text-[#ba1a1a]" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-card text-center border border-[#e8e8f0]">
              <p className={`text-xl font-black ${color}`}>{value}</p>
              <p className="text-[10px] font-semibold text-[#727687] mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {[["all","All"],["pending","Pending"],["paid","Paid"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                filter === val
                  ? "bg-[#0056b7] text-white"
                  : "bg-[#f3f3f8] text-[#424656] hover:bg-[#e8e8f0]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Payments list */}
        {loading ? (
          <p className="text-sm text-[#727687]">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-[#727687]">No payments found.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-5 shadow-card border border-[#e8e8f0]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-[#1a1c1f] truncate">
                        {p.garage_name || "Unknown Garage"}
                      </p>
                      <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0 ${
                        p.status === "captured"
                          ? "bg-green-100 text-green-700"
                          : "bg-[#f3f3f8] text-[#727687]"
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="bg-[#f3f3f8] rounded-xl p-2.5 text-center">
                        <p className="text-xs font-black text-[#1a1c1f]">{fmt(p.amount_total || 0)}</p>
                        <p className="text-[10px] text-[#727687]">Customer paid</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-2.5 text-center">
                        <p className="text-xs font-black text-green-700">{fmt(p.amount_commission || 0)}</p>
                        <p className="text-[10px] text-[#727687]">Your cut ({p.commission_pct}%)</p>
                      </div>
                      <div className="bg-[#fef9ec] rounded-xl p-2.5 text-center">
                        <p className="text-xs font-black text-amber-700">{fmt(p.amount_garage || 0)}</p>
                        <p className="text-[10px] text-[#727687]">Pay garage</p>
                      </div>
                    </div>

                    {/* Garage payout details */}
                    {p.portal_garages && (
                      <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">Send payment to:</p>
                        {p.portal_garages.upi_id && (
                          <p className="text-xs font-bold text-[#1a1c1f]">UPI: {p.portal_garages.upi_id}</p>
                        )}
                        {p.portal_garages.bank_account_number && (
                          <>
                            <p className="text-xs text-[#424656]">A/C: {p.portal_garages.bank_account_number}</p>
                            <p className="text-xs text-[#424656]">IFSC: {p.portal_garages.bank_ifsc} · {p.portal_garages.bank_account_name}</p>
                          </>
                        )}
                        {!p.portal_garages.upi_id && !p.portal_garages.bank_account_number && (
                          <p className="text-xs text-amber-600">⚠ Garage hasn&apos;t added payout details yet</p>
                        )}
                      </div>
                    )}

                    {/* Razorpay payment ID */}
                    {p.razorpay_payment_id && (
                      <button
                        onClick={() => copyId(p.razorpay_payment_id)}
                        className="mt-3 flex items-center gap-1.5 text-[11px] text-[#727687] hover:text-[#0056b7]"
                      >
                        {copied === p.razorpay_payment_id ? <Check size={11} /> : <Copy size={11} />}
                        <span className="font-mono">{p.razorpay_payment_id}</span>
                      </button>
                    )}

                    <p className="mt-2 text-[11px] text-[#c2c6d8]">
                      {new Date(p.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>

                  {/* Payout action */}
                  <div className="shrink-0">
                    {p.payout_status === "paid" ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                        <CheckCircle2 size={14} /> Paid
                      </span>
                    ) : p.status === "captured" ? (
                      <button
                        onClick={() => markPaid(p.id)}
                        className="rounded-xl bg-amber-500 text-white px-3 py-2 text-xs font-bold hover:brightness-110 active:scale-95"
                      >
                        Mark Paid
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-[#c2c6d8]">
                        <Clock size={13} /> Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
