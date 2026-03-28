"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import {
  CalendarCheck, Heart, Star, ChevronRight,
  Car, Bike, Zap, Bell, ShieldCheck, HelpCircle, LogOut, LogIn,
  Edit3, Plus, Trash2, MapPin, Mail, Wrench, X, Loader2, Camera, Flame,
} from "lucide-react";
import Header from "../../components/Header";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../context/ToastContext";
import { getBookingCounts } from "../../lib/bookings";
import { getUserVehicles, addUserVehicle, removeUserVehicle } from "../../lib/vehicles";

const MENU = [
  {
    section: "Account",
    items: [
      { label: "Edit Profile",       icon: Edit3,         href: "/profile/edit",           iconBg: "bg-[#d8e2ff]",     iconColor: "text-[#0056b7]",  comingSoon: true  },
      { label: "Saved Garages",      icon: Heart,         href: "/profile/saved",          iconBg: "bg-[#ffdad6]",     iconColor: "text-[#ba1a1a]"                       },
      { label: "My Bookings",        icon: CalendarCheck, href: "/bookings",               iconBg: "bg-[#d8e2ff]",     iconColor: "text-[#4c4aca]"                       },
      { label: "My Reviews",         icon: Star,          href: "/profile/reviews",        iconBg: "bg-amber-50",      iconColor: "text-amber-500"                       },
    ],
  },
  {
    section: "Preferences",
    items: [
      { label: "Notifications",      icon: Bell,          href: "/profile/notifications",  iconBg: "bg-orange-50",     iconColor: "text-orange-500", comingSoon: true  },
      { label: "Saved Addresses",    icon: MapPin,        href: "/profile/addresses",      iconBg: "bg-green-50",      iconColor: "text-green-600",  comingSoon: true  },
      { label: "Privacy & Security", icon: ShieldCheck,   href: "/profile/security",       iconBg: "bg-[#f3f3f8]",     iconColor: "text-[#424656]",  comingSoon: true  },
    ],
  },
  {
    section: "Support",
    items: [
      { label: "Help & FAQ",         icon: HelpCircle,    href: "/profile/help",           iconBg: "bg-[#f3f3f8]",     iconColor: "text-[#c2c6d8]",  comingSoon: true  },
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
  const { user, loading: authLoading, signOut } = useAuth();
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

  const { showToast } = useToast();

  /* Redirect to auth if not logged in */
  useEffect(() => {
    if (!authLoading && !user) router.push("/auth?redirect=/profile");
  }, [user, authLoading, router]);

  /* Load vehicles + booking count in parallel */
  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserVehicles(user.id).catch(() => []),
      getBookingCounts(user.id).catch(() => 0),
    ]).then(([vehicles, count]) => {
      setVehicles(vehicles);
      setBookingCount(count);
    });
  }, [user]);

  function resetVehicleForm() {
    setVType("Car"); setVBrand(""); setVModel("");
    setVYear(String(CURRENT_YEAR)); setVNumber(""); setVNumError("");
  }

  async function handleAddVehicle(e) {
    e.preventDefault();
    if (!user) { showToast("Please sign in to add a vehicle."); router.push("/auth"); return; }
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
  const initial = name.charAt(0).toUpperCase();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  const inputCls =
    "w-full bg-white border border-[#c2c6d8]/20 rounded-2xl px-4 py-3 text-sm text-[#1a1c1f] placeholder:text-[#c2c6d8] focus:border-[#0056b7] focus:outline-none focus:ring-2 focus:ring-[#0056b7]/20 transition min-h-[44px]";

  return (
    <div className="min-h-screen bg-[#f9f9fe]">
      <Header />

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      {/* ── Profile Header ── */}
      <div style={{ paddingTop: 64 }}>
        <div className="mx-auto max-w-5xl px-4 md:px-8 pt-8 pb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#424656] mb-4">Profile</p>

          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="h-20 w-20 rounded-full bg-[#d8e2ff] flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-[#0056b7]">{initial}</span>
                )}
              </div>
              <button
                type="button"
                aria-label="Change profile photo"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#0056b7] text-white shadow-sm transition hover:brightness-110 active:scale-95 disabled:opacity-60"
              >
                {uploadingAvatar
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Camera className="h-3.5 w-3.5" />
                }
              </button>
            </div>

            {/* Name + email + stats */}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-[#1a1c1f] capitalize truncate">{name}</h1>
              <p className="mt-0.5 text-sm text-[#424656] truncate">{email}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#f3f3f8] px-4 py-2 text-sm font-bold text-[#424656]">
                  {bookingCount ?? "…"} Bookings
                </span>
                <span className="rounded-full bg-[#f3f3f8] px-4 py-2 text-sm font-bold text-[#424656]">
                  {vehicles.length} Vehicles
                </span>
                {bookingCount >= 10 ? (
                  <span className="flex items-center gap-1 rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-600">
                    <Flame className="h-3.5 w-3.5" /> Loyal Member
                  </span>
                ) : bookingCount >= 3 ? (
                  <span className="flex items-center gap-1 rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-600">
                    <Flame className="h-3.5 w-3.5" /> {bookingCount}-booking streak
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main aria-label="User profile" className="mx-auto flex max-w-5xl flex-col gap-6 px-4 md:px-8 pb-52 md:pb-10 pt-4 md:pt-6">

        <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">

          {/* ── LEFT COL ── */}
          <div className="flex flex-col gap-4 md:w-72 md:shrink-0">

            {/* My Vehicles card */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[#c2c6d8]/10">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#424656]">Garage</p>
                  <h2 className="text-lg font-bold text-[#1a1c1f]">My Vehicles</h2>
                </div>
                <button
                  type="button"
                  onClick={() => { setAdding((v) => !v); resetVehicleForm(); }}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition active:scale-95 ${
                    adding
                      ? "border border-[#c2c6d8]/30 text-[#424656] hover:bg-[#f3f3f8]"
                      : "bg-[#d8e2ff]/40 text-[#0056b7] hover:bg-[#d8e2ff]/70"
                  }`}
                >
                  {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {adding ? "Cancel" : "Add"}
                </button>
              </div>

              {/* Inline add form */}
              {adding && (
                <form onSubmit={handleAddVehicle} className="mb-4 space-y-3 rounded-2xl bg-[#f3f3f8] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#0056b7]">New Vehicle</p>

                  {/* Vehicle type */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {VEHICLE_TYPES.map(({ label, icon: Icon }) => (
                      <button
                        key={label} type="button"
                        onClick={() => { setVType(label); setVBrand(""); }}
                        className={`flex flex-col items-center gap-1 rounded-xl py-2.5 text-[10px] font-bold transition active:scale-95 ${
                          vType === label
                            ? "bg-[#0056b7] text-white shadow-sm"
                            : "bg-white border border-[#c2c6d8]/20 text-[#424656] hover:bg-[#f3f3f8]"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
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
                    style={{ fontSize: 16 }}
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
                    style={{ fontSize: 16 }}
                  />

                  {/* Year */}
                  <select
                    value={vYear}
                    onChange={(e) => setVYear(e.target.value)}
                    className={inputCls}
                    style={{ fontSize: 16 }}
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
                      className={`${inputCls} ${vNumError ? "border-[#ba1a1a]" : ""} uppercase`}
                      style={{ fontSize: 16 }}
                    />
                    {vNumError && <p className="mt-1.5 text-xs text-[#ba1a1a]">{vNumError}</p>}
                    <p className="mt-1.5 text-[10px] text-[#c2c6d8]">Format: State (2) + District (2) + Letters + Digits · e.g. MH03AB1234</p>
                  </div>

                  <button type="submit"
                    className="w-full rounded-2xl bg-[#0056b7] py-3 px-6 text-sm font-bold text-white shadow-sm transition hover:brightness-110 active:scale-95">
                    Add Vehicle
                  </button>
                </form>
              )}

              {/* Vehicle list */}
              {vehicles.length === 0 && !adding ? (
                <EmptyState
                  title="No vehicles yet"
                  description='Tap "+ Add" to register your car, bike, or EV.'
                  className="py-4 shadow-none bg-transparent"
                />
              ) : (
                <div className="flex flex-col gap-2">
                  {vehicles.map((v) => {
                    const VIcon = ICON_MAP[v.type] ?? Wrench;
                    return (
                      <div key={v.id} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#c2c6d8]/10">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d8e2ff] text-[#0056b7]">
                          <VIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-[#1a1c1f]">{v.name}</p>
                          <p className="text-xs text-[#424656]">{v.number_plate} · {v.type}</p>
                        </div>
                        <button
                          type="button"
                          aria-label="Remove vehicle"
                          onClick={() => removeVehicle(v.id)}
                          className="shrink-0 text-[#c2c6d8] transition hover:text-[#ba1a1a] active:scale-95"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add vehicle dashed card — only when not in add mode */}
              {!adding && (
                <button
                  type="button"
                  onClick={() => { setAdding(true); resetVehicleForm(); }}
                  className="mt-3 w-full rounded-2xl border-2 border-dashed border-[#c2c6d8]/40 bg-white py-4 text-sm font-semibold text-[#424656] transition hover:border-[#0056b7]/40 hover:text-[#0056b7] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Add a vehicle
                </button>
              )}
            </div>

          </div>

          {/* ── RIGHT COL — menu + sign out ── */}
          <div className="flex flex-1 flex-col gap-4">

            {MENU.map(({ section, items }, si) => (
              <section
                key={section}
                aria-labelledby={`menu-section-${section.toLowerCase()}`}
                className="flex flex-col gap-2"
                style={{ animationDelay: `${(si + 1) * 80}ms` }}
              >
                <p
                  id={`menu-section-${section.toLowerCase()}`}
                  className="px-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#424656]"
                >
                  {section}
                </p>
                <div className="flex flex-col gap-2">
                  {items.map(({ label, icon: Icon, href, iconBg, iconColor, comingSoon }) =>
                    comingSoon ? (
                      <button
                        key={label}
                        type="button"
                        onClick={() => showToast(`${label} — coming soon`)}
                        className="bg-white rounded-2xl flex w-full items-center gap-4 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#c2c6d8]/10 transition hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] active:scale-[0.98] text-left"
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="flex-1 text-sm font-semibold text-[#1a1c1f]">{label}</span>
                        <span className="rounded-full bg-[#f3f3f8] px-2.5 py-1 text-[10px] font-bold text-[#424656]">Soon</span>
                      </button>
                    ) : (
                      <Link
                        key={label}
                        href={href}
                        className="bg-white rounded-2xl flex items-center gap-4 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#c2c6d8]/10 transition hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] active:scale-[0.98]"
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="flex-1 text-sm font-semibold text-[#1a1c1f]">{label}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[#c2c6d8]" />
                      </Link>
                    )
                  )}
                </div>
              </section>
            ))}

            {/* Sign out / Sign in */}
            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#ba1a1a]/20 bg-white py-4 text-sm font-bold text-[#ba1a1a] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition hover:bg-[#ffdad6]/40 active:scale-[0.98]"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/auth")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#0056b7]/20 bg-white py-4 text-sm font-bold text-[#0056b7] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition hover:bg-[#d8e2ff]/30 active:scale-[0.98]"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </button>
            )}

          </div>
        </div>

      </main>
    </div>
  );
}
