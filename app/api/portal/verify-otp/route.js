import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function verifyToken(email, otp, token) {
  try {
    const decoded  = Buffer.from(token, "base64url").toString("utf8");
    const parts    = decoded.split("|");
    if (parts.length !== 3) return { valid: false, reason: "malformed" };
    const [tokenEmail, expiryStr, sig] = parts;
    const expiry = parseInt(expiryStr, 10);

    if (tokenEmail !== email) return { valid: false, reason: "email_mismatch" };
    if (Date.now() > expiry)  return { valid: false, reason: "expired" };

    const expectedSig = crypto
      .createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY)
      .update(`${email}|${otp}|${expiry}`)
      .digest("hex");

    const sigBuf      = Buffer.from(sig,         "hex");
    const expectedBuf = Buffer.from(expectedSig, "hex");
    if (sigBuf.length !== expectedBuf.length) return { valid: false, reason: "wrong_code" };
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return { valid: false, reason: "wrong_code" };

    return { valid: true };
  } catch {
    return { valid: false, reason: "malformed" };
  }
}

export async function POST(request) {
  try {
    const { email, otp, token, password } = await request.json();

    if (!email || !otp || !token || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const result = verifyToken(normalizedEmail, otp.trim(), token);

    if (!result.valid) {
      if (result.reason === "expired") {
        return NextResponse.json({ error: "Code expired. Please request a new one." }, { status: 400 });
      }
      return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
    }

    // OTP verified — create the user (email already confirmed)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email:         normalizedEmail,
      password,
      email_confirm: true,
    });

    if (error) {
      if (error.message?.includes("already been registered") || error.code === "email_exists") {
        return NextResponse.json(
          { error: "This email is already registered. Please sign in instead." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ userId: data.user.id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
