"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Truck,
  ChevronRight,
  AlertTriangle,
  Star,
  CalendarPlus,
} from "lucide-react";
import Image from "next/image";
import Header from "../../components/Header";
import { useAuth } from "../../components/AuthProvider";
import { getUserBookings, cancelBooking } from "../../lib/bookings";
import { hasReviewed } from "../../lib/reviews";
import ReviewModal from "../../components/ReviewModal";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import Badge from "../../components/ui/Badge";

const STATUS = {
  confirmed: { label: "Confirmed", variant: "info",    icon: CalendarCheck },
  completed: { label: "Completed", variant: "success",  icon: CheckCircle2  },
  cancelled: { label: "Cancelled", variant: "danger",   icon: XCircle       },
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    day:     "numeric",
    month:   "short",
    year:    "numeric",
  });
}

function getDaysUntil(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const appt  = new Date(dateStr + "T00:00:00");
  const diff  = Math.round((appt - today) / 86400000);
  if (diff === 0) return { label: "Today!", urgent: true };
  if (diff === 1) return { label: "Tomorrow", urgent: true };
  if (diff > 1 && diff <= 7) return { label: `In ${diff} days`, urgent: false };
  return null;
}

function buildCalendarUrl(booking) {
  // Parse time like "10:00 AM" → 24h
  const [timePart, meridiem] = (booking.time || "9:00 AM").split(" ");
  let [hh, mm] = timePart.split(":").map(Number);
  if (meridiem === "PM" && hh !== 12) hh += 12;
  if (meridiem === "AM" && hh === 12) hh = 0;
  const pad = (n) => String(n).padStart(2, "0");
  const dateBase = (booking.date || "").replace(/-/g, "");
  const start = `${dateBase}T${pad(hh)}${pad(mm)}00`;
  const end   = `${dateBase}T${pad(hh + 1)}${pad(mm)}00`;
  const title = encodeURIComponent(`${booking.service || "Service"} at ${booking.garageName}`);
  const details = encodeURIComponent(`Booking via GarageDekho\nVehicle: ${booking.vehicleType}`);
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
}

function BookingCard({ booking, onCancel, onReview, reviewed }) {
  const router = useRouter();
  const status     = STATUS[booking.status] ?? STATUS.confirmed;
  const StatusIcon = status.icon;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 animate-slide-up">

      {/* Top row */}
      <div className="flex items-center gap-3">
        {/* Image with SVG progress ring */}
        {(() => {
          const ringMap = {
            confirmed: { pct: 0.5, color: "#2563eb" },
            completed: { pct: 1,   color: "#22c55e" },
            cancelled: { pct: 0,   color: "#e2e8f0" },
          };
          const ring = ringMap[booking.status] ?? ringMap.confirmed;
          const r = 25;
          const circ = 2 * Math.PI * r;
          return (
            <div className="relative h-14 w-14 shrink-0">
              <svg className="absolute inset-0 -rotate-90" width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r={r} fill="none" stroke="#f1f5f9" strokeWidth="3" />
                {ring.pct > 0 && (
                  <circle cx="28" cy="28" r={r} fill="none" stroke={ring.color} strokeWidth="3"
                    strokeDasharray={circ} strokeDashoffset={circ * (1 - ring.pct)}
                    strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.7s ease" }}
                  />
                )}
              </svg>
              <div className="absolute inset-1.5 overflow-hidden rounded-xl">
                <Image
                  src={booking.garageImage || "/placeholder-garage.svg"}
                  alt={booking.garageName}
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              </div>
            </div>
          );
        })()}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">{booking.garageName}</p>
          <p className="mt-0.5 truncate text-xs text-slate-600">{booking.service || "General Service"} · {booking.vehicleType}</p>
        </div>
        <Badge variant={status.variant} icon={StatusIcon} size="sm">
          {status.label}
        </Badge>
      </div>

      {/* Divider */}
      <div className="my-3 border-t border-slate-100" />

      {/* Countdown badge for upcoming bookings */}
      {booking.status === "confirmed" && (() => {
        const until = getDaysUntil(booking.date);
        if (!until) return null;
        return (
          <div className={`mb-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${until.urgent ? "bg-amber-50 text-amber-600" : "bg-primary/10 text-primary"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${until.urgent ? "bg-amber-500 animate-ping" : "bg-primary"}`} />
            {until.label}
          </div>
        );
      })()}

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <CalendarCheck className="h-3.5 w-3.5 text-slate-400" />
          <span>{formatDate(booking.date)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>{booking.time}</span>
        </div>
        {booking.pickupDrop && (
          <div className="flex items-center gap-1.5 text-primary font-semibold">
            <Truck className="h-3.5 w-3.5" />
            <span>Pickup & Drop</span>
          </div>
        )}
      </div>

      {/* Price + actions */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-base font-black text-slate-900">{booking.price}</span>
        <div className="flex items-center gap-2">
          {booking.status === "confirmed" && (
            <>
              <a
                href={buildCalendarUrl(booking)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-[11px] font-bold text-primary transition hover:bg-primary/10 active:scale-95"
              >
                <CalendarPlus className="h-3 w-3" />
                Add to Calendar
              </a>
              <button
                type="button"
                onClick={() => onCancel(booking.id)}
                className="rounded-full border border-red-200 px-3 py-1.5 text-[11px] font-bold text-red-500 transition hover:bg-red-50 active:scale-95"
              >
                Cancel
              </button>
            </>
          )}

          {booking.status === "completed" && (
            <>
              {!reviewed && (
                <button
                  type="button"
                  onClick={() => onReview(booking)}
                  className="flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-600 transition hover:bg-amber-100 active:scale-95"
                >
                  <Star className="h-3 w-3" />
                  Review
                </button>
              )}
              <button
                type="button"
                onClick={() => router.push(`/garage/${booking.garageId}`)}
                className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-white shadow-glow-primary transition hover:brightness-110 active:scale-95"
              >
                <RotateCcw className="h-3 w-3" />
                Book Again
              </button>
            </>
          )}
          <Link
            href={`/garage/${booking.garageId}`}
            className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-primary/40 hover:text-primary active:scale-95"
          >
            View Garage <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Confirm Cancel Modal ── */
function CancelConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl md:rounded-3xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="text-base font-black text-slate-900">Cancel Booking?</h3>
        <p className="mt-1 text-sm text-slate-400">This action cannot be undone. The garage will be notified.</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
          >
            Keep Booking
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-bold text-white transition hover:brightness-110 active:scale-[0.98]"
          >
            Yes, Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab,           setTab]           = useState("upcoming");
  const [bookings,      setBookings]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [cancelTarget,  setCancelTarget]  = useState(null);
  const [reviewTarget,  setReviewTarget]  = useState(null);
  const [reviewedIds,   setReviewedIds]   = useState(new Set());

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth?redirect=/bookings"); return; }
    getUserBookings(user.id).then(async (data) => {
      setBookings(data);
      setLoading(false);
      const completed = data.filter((b) => b.status === "completed");
      const checks = await Promise.all(
        completed.map((b) => hasReviewed(user.id, b.id).then((r) => r ? b.id : null))
      );
      setReviewedIds(new Set(checks.filter(Boolean)));
    });
  }, [user, authLoading, router]);

  async function handleCancel(id) {
    await cancelBooking(id);
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b))
    );
    setCancelTarget(null);
  }

  const mapped = bookings.map((b) => ({
    id:          b.id,
    garageName:  b.garage_name,
    garageImage: b.garage_image,
    garageId:    b.garage_id,
    service:     b.service_name,
    price:       b.service_price,
    date:        b.booking_date,
    time:        b.booking_time,
    pickupDrop:  b.pickup_drop,
    vehicleType: b.vehicle_type,
    status:      b.status,
  }));

  const upcoming = mapped.filter((b) => b.status === "confirmed");
  const past     = mapped.filter((b) => b.status !== "confirmed");
  const shown    = tab === "upcoming" ? upcoming : past;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />

      {/* ── Hero band ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0047BE] via-[#0056D2] to-[#3730A3] px-4 pb-14 pt-6 md:px-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/[0.06]" />
        <div className="pointer-events-none absolute -bottom-8 left-1/3 h-32 w-32 rounded-full bg-white/[0.04]" />
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Dashboard</p>
          <h1 className="mt-1 text-2xl font-black text-white">My Bookings</h1>
          <p className="mt-0.5 text-sm text-blue-100/80">Track and manage your service appointments</p>
        </div>
      </div>

      <div className="relative -mt-6 rounded-t-3xl bg-[#F8FAFC]">
      <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 md:px-8 pb-28 md:pb-10 pt-5 md:pt-8">

        {/* Tab switcher */}
        <div className="flex gap-1 rounded-2xl bg-white p-1 shadow-card animate-slide-up delay-75">
          {[
            { key: "upcoming", label: "Upcoming", count: upcoming.length },
            { key: "past",     label: "Past",     count: past.length     },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`relative flex-1 rounded-xl py-2.5 text-sm font-bold capitalize transition-all duration-200 ${
                tab === key
                  ? "bg-primary text-white shadow-glow-primary"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              {label}
              {count > 0 && (
                <span
                  className={`ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black ${
                    tab === key ? "bg-white/25 text-white" : "bg-primary/10 text-primary"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {authLoading || loading ? (
          <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
            {[1, 2, 3].map((n) => (
              <Skeleton.BookingCard key={n} />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <EmptyState preset={tab === "upcoming" ? "bookings" : "bookings-past"} />
        ) : (
          <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
            {shown.map((booking, i) => (
              <div key={booking.id} style={{ animationDelay: `${i * 60}ms` }}>
                <BookingCard
                  booking={booking}
                  onCancel={setCancelTarget}
                  onReview={setReviewTarget}
                  reviewed={reviewedIds.has(booking.id)}
                />
              </div>
            ))}
          </div>
        )}

      </main>
      </div>

      {cancelTarget && (
        <CancelConfirmModal
          onConfirm={() => handleCancel(cancelTarget)}
          onCancel={() => setCancelTarget(null)}
        />
      )}

      {reviewTarget && (
        <ReviewModal
          booking={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => {
            setReviewedIds((prev) => new Set([...prev, reviewTarget.id]));
            setReviewTarget(null);
          }}
        />
      )}
    </div>
  );
}
