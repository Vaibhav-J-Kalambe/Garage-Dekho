import { NextResponse } from "next/server";
import crypto from "crypto";

function makeToken(email, otp, expiry) {
  const sig = crypto
    .createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY)
    .update(`${email}|${otp}|${expiry}`)
    .digest("hex");
  return Buffer.from(`${email}|${expiry}|${sig}`).toString("base64url");
}

const otpHtml = (otp) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f9f9fe;font-family:system-ui,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
  <tr><td align="center">
    <table width="100%" style="max-width:480px;background:#fff;border-radius:20px;border:1px solid #e8e8f0;overflow:hidden">
      <tr>
        <td style="background:linear-gradient(135deg,#001f5b,#0056D2);padding:32px 32px 28px;text-align:center">
          <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.6)">GarageDekho</p>
          <p style="margin:8px 0 0;font-size:24px;font-weight:900;color:#fff">Partner Portal</p>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 32px;text-align:center">
          <p style="margin:0 0 8px;font-size:18px;font-weight:800;color:#1a1c1f">Your verification code</p>
          <p style="margin:0 0 28px;font-size:14px;color:#727687">Enter this code to verify your email and continue registration.</p>
          <div style="display:inline-block;background:#f3f3f8;border-radius:16px;padding:20px 40px;margin-bottom:28px">
            <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#0056b7;font-family:monospace">${otp}</span>
          </div>
          <p style="margin:0;font-size:13px;color:#c2c6d8">This code expires in <strong style="color:#727687">10 minutes</strong>.</p>
          <p style="margin:16px 0 0;font-size:13px;color:#c2c6d8">If you didn't request this, you can safely ignore this email.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px 28px;text-align:center;border-top:1px solid #f0f0f0">
          <p style="margin:0;font-size:12px;color:#c2c6d8">GarageDekho &mdash; Partner Portal</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const normalizedEmail = email.trim().toLowerCase();
    const otp    = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    const token  = makeToken(normalizedEmail, otp, expiry);

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Email service not configured" }, { status: 500 });

    const res = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from:    "GarageDekho <onboarding@resend.dev>",
        to:      [normalizedEmail],
        subject: "Your GarageDekho verification code: " + otp,
        html:    otpHtml(otp),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return NextResponse.json({ error: "Resend: " + err }, { status: 500 });
    }

    return NextResponse.json({ token });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
