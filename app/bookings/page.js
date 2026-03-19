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
} from "lucide-react";
import Header from "../../components/Header";
import { useAuth } from "../../components/AuthProvider";
import { getUserBookings, cancelBooking } from "../../lib/bookings";
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

function BookingCard({ booking, onCancel }) {
  const router = useRouter();
  const status     = STATUS[booking.status] ?? STATUS.confirmed;
  const StatusIcon = status.icon;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 animate-slide-up">

      {/* Top row */}
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
          <img
            src={booking.garageImage}
            alt={booking.garageName}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">{booking.garageName}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{booking.service}</p>
        </div>
        <Badge variant={status.variant} icon={StatusIcon} size="sm">
          {status.label}
        </Badge>
      </div>

      {/* Divider */}
      <div className="my-3 border-t border-slate-100" />

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
            <button
              type="button"
              onClick={() => onCancel(booking.id)}
              className="rounded-full border border-red-200 px-3 py-1.5 text-[11px] font-bold text-red-500 transition hover:bg-red-50 active:scale-95"
            >
              Cancel
            </button>
          )}
          {booking.status === "completed" && (
            <button
              type="button"
              onClick={() => router.push(`/garage/${booking.garageId}`)}
              className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-white shadow-glow-primary transition hover:brightness-110 active:scale-95"
            >
              <RotateCcw className="h-3 w-3" />
              Book Again
            </button>
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

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab,      setTab]      = useState("upcoming");
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth?redirect=/bookings"); return; }
    getUserBookings(user.id).then((data) => {
      setBookings(data);
      setLoading(false);
    });
  }, [user, authLoading, router]);

  async function handleCancel(id) {
    if (!confirm("Cancel this booking?")) return;
    await cancelBooking(id);
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b))
    );
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
    status:      b.status,
  }));

  const upcoming = mapped.filter((b) => b.status === "confirmed");
  const past     = mapped.filter((b) => b.status !== "confirmed");
  const shown    = tab === "upcoming" ? upcoming : past;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />

      <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 md:px-8 pb-28 md:pb-10 pt-5 md:pt-8">

        {/* Heading */}
        <div className="animate-slide-up">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">My Bookings</h1>
          <p className="mt-0.5 text-sm text-slate-400">Track and manage your service appointments</p>
        </div>

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
                <BookingCard booking={booking} onCancel={handleCancel} />
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
