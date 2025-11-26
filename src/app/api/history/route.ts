import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    await ensureSchema();
    const body = await req.json();
    const userEmail: string | undefined = body.userEmail;
    const destinationName: string | undefined = body.destinationName;
    const answers = body.answers;
    const resultSnapshot = body.resultSnapshot;
    await query(
      `INSERT INTO questionnaire_history (user_email, destination_name, answers, result_snapshot) VALUES ($1, $2, $3, $4)`,
      [userEmail || null, destinationName || null, answers || null, resultSnapshot || null]
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("history POST error", e);
    return NextResponse.json({ error: "fail" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await ensureSchema();
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const rs = await query(
      `SELECT id, user_email, destination_name, answers, result_snapshot, created_at FROM questionnaire_history WHERE ($1::varchar IS NULL OR user_email = $1) ORDER BY created_at DESC LIMIT 100`,
      [email]
    );
    return NextResponse.json({ items: rs.rows });
  } catch (e: any) {
    console.error("history GET error", e);
    return NextResponse.json({ error: "fail" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureSchema();
    const url = new URL(req.url);
    const email = url.searchParams.get("email") || undefined;
    const idParam = url.searchParams.get("id") || undefined;
    if (!idParam && !email) {
      return NextResponse.json({ error: "missing id or email" }, { status: 400 });
    }
    if (idParam) {
      // Eliminar un registro específico, opcionalmente filtrando por email
      const idNum = Number(idParam);
      if (!Number.isFinite(idNum)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
      if (email) {
        await query(`DELETE FROM questionnaire_history WHERE id = $1 AND (user_email = $2)`, [idNum, email]);
      } else {
        await query(`DELETE FROM questionnaire_history WHERE id = $1`, [idNum]);
      }
      return NextResponse.json({ ok: true });
    }
    // Sin id: limpiar todo el historial del usuario
    await query(`DELETE FROM questionnaire_history WHERE user_email = $1`, [email]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("history DELETE error", e);
    return NextResponse.json({ error: "fail" }, { status: 500 });
  }
}