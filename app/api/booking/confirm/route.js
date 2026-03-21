import { NextResponse } from "next/server";

function buildRow(label, value, even) {
  const bg = even ? "#f8fafc" : "#ffffff";
  return (
    '<tr style="background:' + bg + ';">' +
    '<td style="padding:12px 16px;font-size:12px;color:#94a3b8;font-weight:700;' +
    'text-transform:uppercase;letter-spacing:0.5px;width:40%;">' + label + "</td>" +
    '<td style="padding:12px 16px;font-size:14px;color:#0f172a;font-weight:600;">' + value + "</td>" +
    "</tr>"
  );
}

function bookingEmailHtml(data) {
  const {
    userName, garageName, serviceName, servicePrice,
    bookingDate, bookingTime, vehicleType,
    pickupDrop, pickupAddress, promoCode,
  } = data;

  const formattedDate = new Date(bookingDate).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const rows = [
    ["Service",      serviceName || "General Service"],
    ["Date",         formattedDate],
    ["Time",         bookingTime],
    ["Vehicle Type", vehicleType],
  ];
  if (pickupDrop) rows.push(["Pickup & Drop", pickupAddress || "Yes"]);
  if (promoCode)  rows.push(["Promo Applied", promoCode]);
  rows.push(["Amount", servicePrice || "As per garage"]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://garage-dekho.vercel.app";

  return (
    "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'/>" +
    "<meta name='viewport' content='width=device-width,initial-scale=1.0'/>" +
    "<title>Booking Confirmed</title></head>" +
    "<body style='margin:0;padding:0;background:#F8FAFC;font-family:Segoe UI,sans-serif;'>" +
    "<table width='100%' cellpadding='0' cellspacing='0' style='background:#F8FAFC;padding:32px 16px;'>" +
    "<tr><td align='center'>" +
    "<table width='100%' cellpadding='0' cellspacing='0' style='max-width:520px;'>" +

    "<tr><td style='background:#0056D2;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;'>" +
    "<p style='margin:0;color:rgba(255,255,255,0.7);font-size:12px;letter-spacing:2px;text-transform:uppercase;'>GarageDekho</p>" +
    "<h1 style='margin:8px 0 0;color:#fff;font-size:22px;font-weight:900;'>Booking Confirmed!</h1>" +
    "</td></tr>" +

    "<tr><td style='background:#fff;padding:28px 32px;'>" +
    "<p style='margin:0 0 20px;color:#475569;font-size:15px;'>Hi <strong style='color:#0f172a;'>" +
    userName + "</strong>, your appointment at <strong style='color:#0056D2;'>" + garageName + "</strong> is confirmed.</p>" +
    "<table width='100%' cellpadding='0' cellspacing='0' style='border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;'>" +
    rows.map(function(row, i) { return buildRow(row[0], row[1], i % 2 === 0); }).join("") +
    "</table>" +
    "<p style='margin:24px 0 8px;color:#64748b;font-size:13px;line-height:1.6;'>The garage will be ready for you at the scheduled time. To cancel or reschedule, please do so at least 2 hours before your appointment.</p>" +
    "<div style='text-align:center;margin-top:24px;'>" +
    "<a href='" + appUrl + "/bookings' style='display:inline-block;background:#0056D2;color:#fff;" +
    "font-size:14px;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;'>View My Bookings</a>" +
    "</div></td></tr>" +

    "<tr><td style='background:#f1f5f9;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;'>" +
    "<p style='margin:0;color:#94a3b8;font-size:12px;'>Need help? Call us at " +
    "<a href='tel:+919969272885' style='color:#0056D2;text-decoration:none;'>+91 99692 72885</a> &middot; Available 24/7</p>" +
    "<p style='margin:8px 0 0;color:#cbd5e1;font-size:11px;'>&copy; " + new Date().getFullYear() + " GarageDekho. All rights reserved.</p>" +
    "</td></tr>" +

    "</table></td></tr></table></body></html>"
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      userEmail, userName, garageName, serviceName, servicePrice,
      bookingDate, bookingTime, vehicleType,
      pickupDrop, pickupAddress, promoCode,
    } = body;

    if (!userEmail || !garageName || !bookingDate) {
      return NextResponse.json({ ok: false, error: "Missing required fields." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    "GarageDekho <onboarding@resend.dev>",
        to:      [userEmail],
        subject: "Booking Confirmed at " + garageName + " \u2013 " + bookingDate,
        html:    bookingEmailHtml({
          userName: userName || "Customer",
          garageName, serviceName, servicePrice,
          bookingDate, bookingTime, vehicleType,
          pickupDrop, pickupAddress, promoCode,
        }),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Email send failed:", err.message);
    return NextResponse.json({ ok: true, skipped: true });
  }
}
