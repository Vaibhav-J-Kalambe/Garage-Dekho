import { NextResponse } from "next/server";
import crypto from "crypto";

/* Simple in-memory rate limiter: max 5 attempts per IP per 15 minutes */
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function getIp(request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

export async function POST(request) {
  const ip = getIp(request);
  const now = Date.now();
  const record = attempts.get(ip) ?? { count: 0, windowStart: now };

  if (now - record.windowStart > WINDOW_MS) {
    record.count = 0;
    record.windowStart = now;
  }

  if (record.count >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  try {
    const { password } = await request.json();
    const correct = process.env.ADMIN_PASSWORD;

    if (!correct) {
      return NextResponse.json({ ok: false, error: "Admin password not configured on server." }, { status: 500 });
    }

    // Timing-safe comparison
    const pwBuf      = Buffer.alloc(64);
    const correctBuf = Buffer.alloc(64);
    pwBuf.write(String(password || "").slice(0, 64));
    correctBuf.write(correct.slice(0, 64));
    const match = crypto.timingSafeEqual(pwBuf, correctBuf) &&
                  String(password).length === correct.length;

    if (match) {
      record.count = 0;
      attempts.set(ip, record);
      return NextResponse.json({ ok: true });
    }

    record.count += 1;
    attempts.set(ip, record);
    const remaining = MAX_ATTEMPTS - record.count;
    return NextResponse.json(
      { ok: false, error: `Incorrect password. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` },
      { status: 401 }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
}
