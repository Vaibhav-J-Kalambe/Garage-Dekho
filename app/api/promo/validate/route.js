// Server-side promo code validation - codes never sent to the client
const PROMO_CODES = {
  FIRST100:  { label: "Free inspection",  type: "free",    value: 0   },
  WEEKEND20: { label: "20% off",          type: "percent", value: 20  },
  BIKE100:   { label: "₹100 off",         type: "flat",    value: 100 },
  EVCARE:    { label: "₹199 flat price",  type: "flat",    value: 199 },
  REFER200:  { label: "₹200 credit",      type: "flat",    value: 200 },
  MONSOON15: { label: "15% off",          type: "percent", value: 15  },
};

// Rate limiter: max 10 attempts per IP per minute
const promoAttempts = new Map();

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    const now = Date.now();
    const record = promoAttempts.get(ip) ?? { count: 0, windowStart: now };
    if (now - record.windowStart > 60_000) { record.count = 0; record.windowStart = now; }
    if (record.count >= 10) {
      return Response.json({ valid: false, error: "Too many attempts." }, { status: 429 });
    }
    record.count += 1;
    promoAttempts.set(ip, record);

    const { code } = await req.json();
    if (!code || typeof code !== "string" || code.length > 20) {
      return Response.json({ valid: false, error: "Invalid request." }, { status: 400 });
    }

    const promo = PROMO_CODES[code.trim().toUpperCase()];
    if (!promo) {
      return Response.json({ valid: false, error: "Invalid promo code." }, { status: 200 });
    }

    return Response.json({ valid: true, ...promo }, { status: 200 });
  } catch {
    return Response.json({ valid: false, error: "Server error." }, { status: 500 });
  }
}
