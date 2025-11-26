import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    await ensureSchema();
    const body = await req.json();
    const {
      ref,
      userEmail,
      origin,
      destinationName,
      destinationCountry,
      travellers,
      nights,
      travelClass,
      hotel,
      rooms,
      breakdown,
    } = body || {};
    await query(
      `INSERT INTO trip_budgets (ref, user_email, origin, destination_name, destination_country, travellers, nights, travel_class, hotel, rooms, breakdown) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        ref || null,
        userEmail || null,
        origin || null,
        destinationName || null,
        destinationCountry || null,
        travellers || null,
        nights || null,
        travelClass || null,
        hotel || null,
        rooms || null,
        breakdown || null,
      ]
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("trip-budget POST error", e);
    return NextResponse.json({ error: "fail" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await ensureSchema();
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const ref = url.searchParams.get("ref");
    const rs = await query(
      `SELECT id, ref, user_email, origin, destination_name, destination_country, travellers, nights, travel_class, hotel, rooms, breakdown, created_at FROM trip_budgets WHERE ($1::varchar IS NULL OR user_email = $1) AND ($2::varchar IS NULL OR ref = $2) ORDER BY created_at DESC LIMIT 100`,
      [email, ref]
    );
    return NextResponse.json({ items: rs.rows });
  } catch (e: any) {
    console.error("trip-budget GET error", e);
    return NextResponse.json({ error: "fail" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureSchema();
    const body = await req.json().catch(() => ({}));
    const { ref, userEmail, destinationName, destinationCountry } = body || {};

    if (ref) {
      await query(
        `DELETE FROM trip_budgets WHERE ref = $1 AND ($2::varchar IS NULL OR user_email = $2)`,
        [ref, userEmail || null]
      );
      return NextResponse.json({ ok: true });
    }

    await query(
      `DELETE FROM trip_budgets WHERE ($1::varchar IS NULL OR user_email = $1) AND ($2::varchar IS NULL OR destination_name = $2) AND ($3::varchar IS NULL OR destination_country = $3)`,
      [userEmail || null, destinationName || null, destinationCountry || null]
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("trip-budget DELETE error", e);
    return NextResponse.json({ error: "fail" }, { status: 500 });
  }
}