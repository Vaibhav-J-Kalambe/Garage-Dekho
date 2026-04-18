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
    <div className="rounded-2xl bg-[#ffffff] dark:bg-[#1e1e22] p-4 shadow-card dark:shadow-none border border-transparent dark:border-white/5 transition-shadow duration-150 hover:shadow-card-hover hover:-translate-y-0.5 animate-slide-up">

      {/* Top row */}
      <div className="flex items-center gap-3">
        {/* Image with SVG progress ring */}
        {(() => {
          const ringMap = {
            confirmed: { pct: 0.5, color: "#0056b7" },
            completed: { pct: 1,   color: "#22c55e" },
            cancelled: { pct: 0,   color: "#e2e8f0" },
          };
          const ring = ringMap[booking.status] ?? ringMap.confirmed;
          const r = 25;
          const circ = 2 * Math.PI * r;
          return (
            <div className="relative h-14 w-14 shrink-0">
              <svg className="absolute inset-0 -rotate-90" width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-[#f3f3f8] dark:text-[#2a2a2e]" />
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
          <p className="truncate text-sm font-bold text-[#1a1c1f]">{booking.garageName}</p>
          <p className="mt-0.5 truncate text-xs text-[#424656]">{booking.service || "General Service"} · {booking.vehicleType}</p>
        </div>
        <Badge variant={status.variant} icon={StatusIcon} size="sm">
          {status.label}
        </Badge>
      </div>

      {/* Divider */}
      <div className="my-3 border-t border-[#c2c6d8]/20" />

      {/* Countdown badge for upcoming bookings */}
      {booking.status === "confirmed" && (() => {
        const until = getDaysUntil(booking.date);
        if (!until) return null;
        return (
          <div
            className={`mb-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${
              until.urgent ? "bg-amber-50 text-amber-600" : "text-[#0056b7]"
            }`}
            style={until.urgent ? {} : { backgroundColor: "#d8e2ff" }}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${until.urgent ? "bg-amber-500 animate-ping" : "bg-[#0056b7]"}`} />
            {until.label}
          </div>
        );
      })()}

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#424656]">
        <div className="flex items-center gap-1.5">
          <CalendarCheck className="h-3.5 w-3.5 text-[#c2c6d8]" />
          <span>{formatDate(booking.date)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-[#c2c6d8]" />
          <span>{booking.time}</span>
        </div>
        {booking.pickupDrop && (
          <div className="flex items-center gap-1.5 font-semibold" style={{ color: "#0056b7" }}>
            <Truck className="h-3.5 w-3.5" />
            <span>Pickup & Drop</span>
          </div>
        )}
      </div>

      {/* Price + actions */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-base font-black text-[#1a1c1f]">{booking.price}</span>
        <div className="flex items-center gap-2">
          {booking.status === "confirmed" && (
            <>
              <a
                href={buildCalendarUrl(booking)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition hover:opacity-80 active:scale-95"
                style={{ border: "1px solid rgba(0,86,183,0.3)", backgroundColor: "rgba(0,86,183,0.05)", color: "#0056b7" }}
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
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold text-white transition hover:brightness-110 active:scale-95"
                style={{ backgroundColor: "#0056b7" }}
              >
                <RotateCcw className="h-3 w-3" />
                Book Again
              </button>
            </>
          )}
          <Link
            href={`/garage/${booking.garageId}`}
            className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-bold transition active:scale-95"
            style={{ borderColor: "rgba(194,198,216,0.5)", color: "#424656" }}
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
      <div className="relative w-full max-w-sm rounded-t-3xl bg-[#ffffff] dark:bg-[#1e1e22] p-6 shadow-2xl md:rounded-3xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="text-base font-black text-[#1a1c1f]">Cancel Booking?</h3>
        <p className="mt-1 text-sm text-[#424656]">This action cannot be undone. The garage will be notified.</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl py-3 text-sm font-bold text-[#424656] transition hover:bg-[#f3f3f8] active:scale-[0.98]"
            style={{ border: "1px solid rgba(194,198,216,0.4)" }}
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
      const hasUpcoming = data.some((b) => b.status === "confirmed");
      if (!hasUpcoming && data.length > 0) setTab("past");
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
  const completed = mapped.filter((b) => b.status === "completed");
  const shown    = tab === "upcoming" ? upcoming : past;

  return (
    <div className="min-h-screen bg-surface">
      <Header />

      <main
        aria-label="My bookings"
        className="mx-auto max-w-screen-xl px-4 md:px-6 pb-28 md:pb-8 pt-16 md:pt-20"
      >

        {/* ── EDITORIAL HEADER ── */}
        <section className="mb-4 md:mb-8">
          <h1 className="text-[2rem] md:text-[3.5rem] font-bold tracking-tight text-[#1a1c1f] leading-[1.1] mb-1">
            My Bookings
          </h1>
          <p className="text-sm md:text-base text-[#424656] max-w-md">
            Track your active services and review your vehicle&apos;s maintenance history.
          </p>

          {/* Stat chips */}
          {!loading && (
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { label: "Total",     value: mapped.length },
                { label: "Upcoming",  value: upcoming.length },
                { label: "Completed", value: completed.length },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-[#424656] dark:text-[#938f99] bg-[#f3f3f8] dark:bg-[#2a2a2e]"
                >
                  <span>{label}</span>
                  <span className="font-black text-[#1a1c1f] dark:text-[#e4e2e6]">{value}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── TABS - segmented control ── */}
        <div
          role="tablist"
          aria-label="Booking history"
          className="flex p-1.5 rounded-xl mb-4 md:mb-8 w-fit bg-[#f3f3f8] dark:bg-[#2a2a2e]"
        >
          {[
            { key: "upcoming", label: "Upcoming", count: upcoming.length },
            { key: "past",     label: "Past",     count: past.length     },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`relative flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold capitalize transition-all duration-150 ${
                tab === key
                  ? "bg-white dark:bg-[#1e1e22] shadow-sm text-[#1a1c1f] dark:text-[#e4e2e6]"
                  : "text-[#424656] dark:text-[#938f99] hover:text-[#1a1c1f] dark:hover:text-[#e4e2e6]"
              }`}
            >
              {label}
              {count > 0 && (
                <span
                  className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-black"
                  style={
                    tab === key
                      ? { backgroundColor: "#d8e2ff", color: "#0056b7" }
                      : { backgroundColor: "rgba(194,198,216,0.3)", color: "#424656" }
                  }
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── BENTO GRID ── */}
        {authLoading || loading ? (
          <div className="flex flex-col gap-4 md:grid md:grid-cols-12 md:gap-6">
            <div className="md:col-span-8">
              <Skeleton.BookingCard />
            </div>
            <div className="md:col-span-4">
              <Skeleton.BookingCard />
            </div>
            <div className="md:col-span-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((n) => <Skeleton.BookingCard key={n} />)}
              </div>
            </div>
          </div>
        ) : shown.length === 0 ? (
          <EmptyState preset={tab === "upcoming" ? "bookings" : "bookings-past"} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* Hero booking card - large */}
            {shown[0] && (
              <div className="md:col-span-8" style={{ animationDelay: "0ms" }}>
                <BookingCard
                  booking={shown[0]}
                  onCancel={setCancelTarget}
                  onReview={setReviewTarget}
                  reviewed={reviewedIds.has(shown[0].id)}
                />
              </div>
            )}

            {/* Side card - next booking or placeholder */}
            <div className="md:col-span-4 flex flex-col gap-4">
              {shown[1] ? (
                <div style={{ animationDelay: "60ms" }}>
                  <BookingCard
                    booking={shown[1]}
                    onCancel={setCancelTarget}
                    onReview={setReviewTarget}
                    reviewed={reviewedIds.has(shown[1].id)}
                  />
                </div>
              ) : (
                /* Next appointment placeholder */
                <div
                  className="rounded-3xl p-6 flex flex-col gap-3 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-none border border-[#c2c6d8]/10 dark:border-white/5 bg-[#ffffff] dark:bg-[#1e1e22]"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#424656]">Next Appointment</p>
                  <p className="text-sm text-[#424656]">No other appointments scheduled.</p>
                  <Link
                    href="/near-me"
                    className="mt-2 flex items-center gap-2 rounded-2xl py-3 text-sm font-bold text-white justify-center transition-[filter] duration-150 hover:brightness-110 active:scale-95"
                    style={{ backgroundColor: "#0056b7" }}
                  >
                    <CalendarCheck className="h-4 w-4" />
                    Book a Service
                  </Link>
                </div>
              )}
            </div>

            {/* Remaining bookings (3+) or recently completed row */}
            {(shown.length > 2 || (tab === "past" && completed.length > 0)) && (
              <div className="md:col-span-12">
                {shown.length > 2 && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold tracking-tight text-[#1a1c1f]">
                        {tab === "upcoming" ? "More Upcoming" : "Recently Completed"}
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {shown.slice(2).map((booking, i) => (
                        <div key={booking.id} style={{ animationDelay: `${(i + 2) * 60}ms` }}>
                          <BookingCard
                            booking={booking}
                            onCancel={setCancelTarget}
                            onReview={setReviewTarget}
                            reviewed={reviewedIds.has(booking.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* If on upcoming tab but there are completed bookings, show a summary row */}
                {tab === "upcoming" && completed.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold tracking-tight text-[#1a1c1f]">Recently Completed</h2>
                      <button
                        type="button"
                        onClick={() => setTab("past")}
                        className="text-sm font-bold transition-opacity hover:opacity-70"
                        style={{ color: "#0056b7" }}
                      >
                        View all
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {completed.slice(0, 3).map((booking, i) => (
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
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>


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
