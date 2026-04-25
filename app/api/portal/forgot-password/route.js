import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resetEmailHtml = (resetLink) => `
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
          <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:#eff6ff;border:2px solid #bfdbfe;margin-bottom:20px">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0056b7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <p style="margin:0 0 8px;font-size:20px;font-weight:900;color:#1a1c1f">Reset your password</p>
          <p style="margin:0 0 28px;font-size:14px;color:#727687;line-height:1.6">
            We received a request to reset the password for your<br/>GarageDekho Partner account.
            Click the button below to set a new password.
          </p>
          <a href="${resetLink}" style="display:inline-block;background:#0056b7;color:#fff;font-size:15px;font-weight:800;text-decoration:none;padding:14px 36px;border-radius:12px">
            Reset My Password
          </a>
          <p style="margin:24px 0 0;font-size:13px;color:#c2c6d8">
            This link expires in <strong style="color:#727687">1 hour</strong>.<br/>
            If you didn&apos;t request a password reset, you can safely ignore this email.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px 28px;text-align:center;border-top:1px solid #f0f0f0">
          <p style="margin:0 0 4px;font-size:12px;color:#c2c6d8">Can&apos;t click the button? Copy this link:</p>
          <p style="margin:0;font-size:11px;color:#0056b7;word-break:break-all">${resetLink}</p>
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

    // Generate reset link via admin API
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: normalizedEmail,
      options: { redirectTo: "https://garagedekho.in/portal/reset-password" },
    });

    if (error) {
      // Don't reveal if email exists or not — always return success
      console.error("generateLink error:", error.message);
      return NextResponse.json({ ok: true });
    }

    const resetLink = data.properties?.action_link;
    if (!resetLink) return NextResponse.json({ ok: true });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Email service not configured" }, { status: 500 });

    await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from:    "GarageDekho <noreply@garagedekho.in>",
        to:      [normalizedEmail],
        subject: "Reset your GarageDekho Partner password",
        html:    resetEmailHtml(resetLink),
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
