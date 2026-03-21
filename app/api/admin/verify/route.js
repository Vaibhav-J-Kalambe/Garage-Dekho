import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { password } = await request.json();
    const correct = process.env.ADMIN_PASSWORD;

    if (!correct) {
      return NextResponse.json({ ok: false, error: "Admin password not configured on server." }, { status: 500 });
    }

    if (password === correct) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Incorrect password." }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
}
