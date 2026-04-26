import { NextResponse } from "next/server";

const MAX_ATTEMPTS  = 5;
const LOCKOUT_MS    = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_MS    = 10 * 60 * 1000; // reset attempts after 10 min of inactivity

// In-memory store — resets on cold start, sufficient for a single-admin setup
const attempts = new Map(); // ip → { count, lockedUntil, lastAttempt }

function getIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request) {
  const ip = getIp(request);
  const now = Date.now();

  const record = attempts.get(ip) || { count: 0, lockedUntil: 0, lastAttempt: 0 };

  // Check lockout
  if (record.lockedUntil > now) {
    const secsLeft = Math.ceil((record.lockedUntil - now) / 1000);
    return NextResponse.json(
      { error: "Too many failed attempts.", lockedFor: secsLeft },
      { status: 429 }
    );
  }

  // Reset count if inactive for ATTEMPT_MS
  if (now - record.lastAttempt > ATTEMPT_MS) record.count = 0;

  const { secret } = await request.json();

  if (secret !== process.env.ADMIN_PASSWORD) {
    record.count++;
    record.lastAttempt = now;

    if (record.count >= MAX_ATTEMPTS) {
      record.lockedUntil = now + LOCKOUT_MS;
      record.count = 0;
      attempts.set(ip, record);
      return NextResponse.json(
        { error: "Too many failed attempts. Locked for 15 minutes.", lockedFor: LOCKOUT_MS / 1000 },
        { status: 429 }
      );
    }

    attempts.set(ip, record);
    const remaining = MAX_ATTEMPTS - record.count;
    return NextResponse.json(
      { error: "Wrong password.", attemptsLeft: remaining },
      { status: 401 }
    );
  }

  // Success — clear record
  attempts.delete(ip);
  return NextResponse.json({ ok: true });
}
