import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    await ensureSchema();
    const body = await req.json();
    const { type, ref, userEmail, destination, hotel, amountUSD, nights } = body || {};
    await query(
      `INSERT INTO payments (type, ref, user_email, destination, hotel, amount_usd, nights) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [type || null, ref || null, userEmail || null, destination || null, hotel || null, amountUSD || null, nights || null]
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("payments POST error", e);
    return NextResponse.json({ error: "fail" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await ensureSchema();
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    // Enriquecer datos con reservas (bookings) cuando falten destination/hotel/nights
    const rs = await query(
      `
      SELECT 
        p.id,
        p.type,
        COALESCE(p.ref, b.ref) AS ref,
        p.user_email,
        COALESCE(p.destination, b.destination) AS destination,
        COALESCE(p.hotel, b.hotel) AS hotel,
        p.amount_usd,
        COALESCE(p.nights, b.nights) AS nights,
        p.created_at
      FROM payments p
      LEFT JOIN bookings b ON b.ref = p.ref
      WHERE ($1::varchar IS NULL OR p.user_email = $1)
      ORDER BY p.created_at DESC
      LIMIT 200
      `,
      [email]
    );
    return NextResponse.json({ items: rs.rows });
  } catch (e: any) {
    console.error("payments GET error", e);
    return NextResponse.json({ error: "fail" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureSchema();
    const body = await req.json().catch(() => ({}));
    const { type, userEmail, destination, hotel } = body || {};
    const t = String(type || "").toLowerCase();
    if (t === "trip") {
      await query(
        `DELETE FROM payments WHERE LOWER(type) = 'trip' AND ($1::varchar IS NULL OR user_email = $1) AND ($2::varchar IS NULL OR destination = $2)`,
        [userEmail || null, destination || null]
      );
      return NextResponse.json({ ok: true });
    }
    if (t === "hotel") {
      await query(
        `DELETE FROM payments WHERE LOWER(type) = 'hotel' AND ($1::varchar IS NULL OR user_email = $1) AND ($2::varchar IS NULL OR destination = $2) AND ($3::varchar IS NULL OR hotel = $3)`,
        [userEmail || null, destination || null, hotel || null]
      );
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  } catch (e: any) {
    console.error("payments DELETE error", e);
    return NextResponse.json({ error: "fail" }, { status: 500 });
  }
}