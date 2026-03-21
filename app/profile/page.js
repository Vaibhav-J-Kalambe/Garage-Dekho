"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import {
  CalendarCheck, Heart, Star, ChevronRight,
  Car, Bike, Zap, Bell, ShieldCheck, HelpCircle, LogOut, LogIn,
  Edit3, Plus, Trash2, MapPin, Mail, Wrench, X, Loader2, Camera,
} from "lucide-react";
import Header from "../../components/Header";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import { getBookingCounts } from "../../lib/bookings";
import { getUserVehicles, addUserVehicle, removeUserVehicle } from "../../lib/vehicles";

const MENU = [
  {
    section: "Account",
    items: [
      { label: "Edit Profile",       icon: Edit3,         href: "/profile/edit",           color: "text-primary"    },
      { label: "Saved Garages",      icon: Heart,         href: "/profile/saved",          color: "text-red-500"    },
      { label: "My Bookings",        icon: CalendarCheck, href: "/bookings",               color: "text-blue-500"   },
      { label: "My Reviews",         icon: Star,          href: "/profile/reviews",        color: "text-amber-500"  },
    ],
  },
  {
    section: "Preferences",
    items: [
      { label: "Notifications",      icon: Bell,          href: "/profile/notifications",  color: "text-orange-500" },
      { label: "Saved Addresses",    icon: MapPin,        href: "/profile/addresses",      color: "text-green-600"  },
      { label: "Privacy & Security", icon: ShieldCheck,   href: "/profile/security",       color: "text-slate-500"  },
    ],
  },
  {
    section: "Support",
    items: [
      { label: "Help & FAQ",         icon: HelpCircle,    href: "/profile/help",           color: "text-slate-400"  },
    ],
  },
];

const VEHICLE_TYPES = [
  { label: "Car",   icon: Car    },
  { label: "Bike",  icon: Bike   },
  { label: "EV",    icon: Zap    },
  { label: "Other", icon: Wrench },
];

const ICON_MAP = { Car, Bike, EV: Zap, Other: Wrench };

const BRANDS = {
  Car:   ["Maruti Suzuki", "Hyundai", "Tata", "Mahindra", "Honda", "Toyota", "Kia", "MG", "Volkswagen", "Skoda", "Renault", "Nissan", "Jeep", "Audi", "BMW", "Mercedes-Benz", "Other"],
  Bike:  ["Hero", "Honda", "Bajaj", "TVS", "Royal Enfield", "Yamaha", "Suzuki", "KTM", "Kawasaki", "Jawa", "Triumph", "BMW", "Harley-Davidson", "Other"],
  EV:    ["Tata", "Ather", "Ola Electric", "Hero Electric", "Bajaj", "Ampere", "Revolt", "MG", "Hyundai", "BYD", "Other"],
  Other: ["Other"],
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1999 }, (_, i) => String(CURRENT_YEAR - i));

/* Indian number plate: AA 00 AA 0000 — e.g. MH03EY2122 or MH 03 EY 2122 */
const PLATE_REGEX = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$/;

function formatPlate(raw) {
  /* Strip spaces, uppercase */
  return raw.toUpperCase().replace(/\s+/g, "");
}

function validatePlate(raw) {
  return PLATE_REGEX.test(formatPlate(raw));
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router  = useRouter();
  const fileRef = useRef(null);

  /* ── Vehicles ── */
  const [vehicles,   setVehicles]   = useState([]);
  const [adding,     setAdding]     = useState(false);
  const [vType,      setVType]      = useState("Car");
  const [vBrand,     setVBrand]     = useState("");
  const [vModel,     setVModel]     = useState("");
  const [vYear,      setVYear]      = useState(String(CURRENT_YEAR));
  const [vNumber,    setVNumber]    = useState("");
  const [vNumError,  setVNumError]  = useState("");

  /* ── Avatar ── */
  const [avatarUrl,       setAvatarUrl]       = useState(user?.user_metadata?.avatar_url || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  /* ── Booking count ── */
  const [bookingCount, setBookingCount] = useState(null);

  /* ── Toast ── */
  const [toast, setToast] = useState(null);
  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2500); }

  /* Load vehicles from Supabase */
  useEffect(() => {
    if (!user) return;
    getUserVehicles(user.id).then(setVehicles).catch(() => setVehicles([]));
  }, [user]);

  /* Load booking count */
  useEffect(() => {
    if (!user) return;
    getBookingCounts(user.id).then(setBookingCount);
  }, [user]);

  function resetVehicleForm() {
    setVType("Car"); setVBrand(""); setVModel("");
    setVYear(String(CURRENT_YEAR)); setVNumber(""); setVNumError("");
  }

  async function handleAddVehicle(e) {
    e.preventDefault();
    if (!user) return;
    if (!vBrand) { showToast("Please select a brand."); return; }
    if (!vModel.trim()) { showToast("Please enter the model name."); return; }
    if (!validatePlate(vNumber)) {
      setVNumError("Invalid format. Use: MH03AB1234 (state + district + letters + digits)");
      return;
    }
    setVNumError("");
    const name = `${vBrand} ${vModel.trim()} ${vYear}`;
    const number_plate = formatPlate(vNumber);
    try {
      const newV = await addUserVehicle(user.id, { name, type: vType, number_plate });
      setVehicles((prev) => [...prev, newV]);
      resetVehicleForm();
      setAdding(false);
    } catch (err) {
      showToast("Failed to add vehicle: " + err.message);
    }
  }

  async function removeVehicle(id) {
    try {
      await removeUserVehicle(id);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } catch {
      showToast("Failed to remove vehicle.");
    }
  }

  /* ── Profile photo upload ── */
  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024)    { showToast("Image must be under 5 MB");    return; }

    setUploadingAvatar(true);
    try {
      const ext  = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const finalUrl = `${publicUrl}?t=${Date.now()}`;

      await supabase.auth.updateUser({ data: { avatar_url: finalUrl } });
      setAvatarUrl(finalUrl);
      showToast("Profile photo updated!");
    } catch (err) {
      showToast("Upload failed — " + (err.message || "please try again"));
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  }

  const name  = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest";
  const email = user?.email || "—";

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  const inputCls =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none transition";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 md:px-8 pb-28 md:pb-10 pt-5 md:pt-8">

        {/* Page heading — mobile only */}
        <div className="md:hidden animate-slide-up">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Profile</h1>
          <p className="mt-0.5 text-sm text-slate-400">Manage your account</p>
        </div>

        <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">

          {/* ── LEFT COL ── */}
          <div className="flex flex-col gap-4 md:w-72 md:shrink-0">

            {/* Profile card */}
            <div className="rounded-2xl bg-white p-5 shadow-card animate-slide-up">
              <div className="flex items-start justify-between">

                {/* Avatar + camera button */}
                <div className="relative">
                  <Avatar name={name} src={avatarUrl} size="lg" online={!!user} />
                  <button
                    type="button"
                    aria-label="Change profile photo"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-sm transition hover:brightness-110 active:scale-95 disabled:opacity-60"
                  >
                    {uploadingAvatar
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <Camera className="h-3 w-3" />
                    }
                  </button>
                </div>

                <Badge variant="success" dot>Verified</Badge>
              </div>

              {/* Name + email */}
              <div className="mt-3">
                <h2 className="text-lg font-black text-slate-900 capitalize">{name}</h2>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{email}</span>
                </div>
              </div>

              <div className="my-4 border-t border-slate-100" />

              {/* Stats */}
              <div className="grid grid-cols-2 divide-x divide-slate-100">
                {[
                  { value: bookingCount === null ? "…" : String(bookingCount), label: "Bookings" },
                  { value: vehicles.length.toString(),                          label: "Vehicles" },
                ].map(({ value, label }) => (
                  <div key={label} className="flex flex-col items-center gap-0.5">
                    <span className="text-xl font-black text-slate-900">{value}</span>
                    <span className="text-[10px] font-semibold text-slate-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* My Vehicles */}
            <div className="rounded-2xl bg-white p-4 shadow-card animate-slide-up delay-75">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900">My Vehicles</h3>
                <button
                  type="button"
                  onClick={() => { setAdding((v) => !v); resetVehicleForm(); }}
                  className="flex items-center gap-1 text-xs font-semibold text-primary transition hover:opacity-80 active:scale-95"
                >
                  {adding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  {adding ? "Cancel" : "Add"}
                </button>
              </div>

              {/* Inline add form */}
              {adding && (
                <form onSubmit={handleAddVehicle} className="mb-3 space-y-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 animate-slide-up">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">New Vehicle</p>

                  {/* Vehicle type */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {VEHICLE_TYPES.map(({ label, icon: Icon }) => (
                      <button
                        key={label} type="button"
                        onClick={() => { setVType(label); setVBrand(""); }}
                        className={`flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-bold transition active:scale-95 ${
                          vType === label
                            ? "bg-primary text-white shadow-sm"
                            : "border border-slate-100 bg-white text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Brand */}
                  <select
                    value={vBrand}
                    onChange={(e) => setVBrand(e.target.value)}
                    required
                    className={inputCls}
                  >
                    <option value="">Select brand…</option>
                    {(BRANDS[vType] ?? BRANDS.Other).map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>

                  {/* Model */}
                  <input
                    type="text" value={vModel}
                    onChange={(e) => setVModel(e.target.value)}
                    placeholder="Model (e.g. City, Activa, Nexon)"
                    required
                    className={inputCls}
                  />

                  {/* Year */}
                  <select
                    value={vYear}
                    onChange={(e) => setVYear(e.target.value)}
                    className={inputCls}
                  >
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>

                  {/* Number plate */}
                  <div>
                    <input
                      type="text"
                      value={vNumber}
                      onChange={(e) => {
                        setVNumber(e.target.value.toUpperCase());
                        setVNumError("");
                      }}
                      placeholder="Number plate (e.g. MH03EY2122)"
                      maxLength={13}
                      required
                      className={`${inputCls} ${vNumError ? "border-red-400" : ""} uppercase`}
                    />
                    {vNumError && <p className="mt-1 text-[10px] text-red-500">{vNumError}</p>}
                    <p className="mt-1 text-[10px] text-slate-400">Format: State (2) + District (2) + Letters + Digits · e.g. MH03AB1234</p>
                  </div>

                  <button type="submit"
                    className="w-full rounded-lg bg-primary py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-110 active:scale-95">
                    Add Vehicle
                  </button>
                </form>
              )}

              {/* Vehicle list */}
              {vehicles.length === 0 && !adding ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <Car className="h-8 w-8 text-slate-200" />
                  <p className="mt-2 text-xs text-slate-400">No vehicles added yet</p>
                  <p className="text-[10px] text-slate-300">Tap + Add to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {vehicles.map((v) => {
                    const VIcon = ICON_MAP[v.type] ?? Wrench;
                    return (
                      <div key={v.id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <VIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-slate-800">{v.name}</p>
                          <p className="text-[10px] text-slate-400">{v.number_plate} · {v.type}</p>
                        </div>
                        <button
                          type="button"
                          aria-label="Remove vehicle"
                          onClick={() => removeVehicle(v.id)}
                          className="shrink-0 text-slate-300 transition hover:text-red-400 active:scale-95"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* ── RIGHT COL — menu + sign out ── */}
          <div className="flex flex-1 flex-col gap-4">

            {MENU.map(({ section, items }, si) => (
              <div
                key={section}
                className="rounded-2xl bg-white shadow-card overflow-hidden animate-slide-up"
                style={{ animationDelay: `${(si + 1) * 80}ms` }}
              >
                <p className="px-4 pb-1 pt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {section}
                </p>
                <div className="divide-y divide-slate-50">
                  {items.map(({ label, icon: Icon, href, color }) => (
                    <Link
                      key={label}
                      href={href}
                      className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50 active:bg-slate-100"
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 ${color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="flex-1 text-sm font-semibold text-slate-800">{label}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white py-4 text-sm font-bold text-red-500 shadow-card transition hover:bg-red-50 active:scale-[0.98] animate-slide-up"
                style={{ animationDelay: "320ms" }}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/auth")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-white py-4 text-sm font-bold text-primary shadow-card transition hover:bg-primary/5 active:scale-[0.98] animate-slide-up"
                style={{ animationDelay: "320ms" }}
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </button>
            )}

          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-slate-900/90 px-5 py-3 text-sm font-semibold text-white shadow-xl backdrop-blur-sm md:bottom-8">
            {toast}
          </div>
        )}

      </main>
    </div>
  );
}
