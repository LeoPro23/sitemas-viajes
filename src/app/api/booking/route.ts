import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    await ensureSchema();
    const body = await req.json();
    const { ref, userEmail, destination, hotel, amountUSD, nights, guests, checkIn, checkOut } = body || {};
    await query(
      `INSERT INTO bookings (ref, user_email, destination, hotel, amount_usd, nights, guests, check_in, check_out) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        ref || null,
        userEmail || null,
        destination || null,
        hotel || null,
        amountUSD || null,
        nights || null,
        guests || null,
        checkIn || null,
        checkOut || null,
      ]
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("booking POST error", e);
    return NextResponse.json({ error: "fail" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await ensureSchema();
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const rs = await query(
      `SELECT id, ref, user_email, destination, hotel, amount_usd, nights, guests, check_in, check_out, created_at FROM bookings WHERE ($1::varchar IS NULL OR user_email = $1) ORDER BY created_at DESC LIMIT 100`,
      [email]
    );
    return NextResponse.json({ items: rs.rows });
  } catch (e: any) {
    console.error("booking GET error", e);
    return NextResponse.json({ error: "fail" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureSchema();
    const body = await req.json().catch(() => ({}));
    const { ref, userEmail, destination, hotel } = body || {};
    if (ref) {
      await query(
        `DELETE FROM bookings WHERE ref = $1 AND ($2::varchar IS NULL OR user_email = $2)`,
        [ref, userEmail || null]
      );
      return NextResponse.json({ ok: true });
    }
    await query(
      `DELETE FROM bookings WHERE ($1::varchar IS NULL OR user_email = $1) AND ($2::varchar IS NULL OR destination = $2) AND ($3::varchar IS NULL OR hotel = $3)`,
      [userEmail || null, destination || null, hotel || null]
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("booking DELETE error", e);
    return NextResponse.json({ error: "fail" }, { status: 500 });
  }
}