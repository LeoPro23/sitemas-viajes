import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Destination = {
  id: number;
  name: string;
  country: string;
};

function loadDb(): Destination[] {
  try {
    const p = path.join(process.cwd(), "config", "destinations-database.json");
    const raw = fs.readFileSync(p, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function normalize(s: string): string {
  return String(s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

const aliases: Record<string, string> = {
  // Errores comunes
  "cuzco": "cusco",
  "méxico": "mexico",
  "rio de janeiro": "rio de janeiro", // mantiene acento opcional
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Math.max(1, Math.min(20, parseInt(url.searchParams.get("limit") || "10")));
  const db = loadDb();

  const items = db.map((d) => ({ name: d.name, country: d.country }));
  if (!q) {
    return NextResponse.json({ items: items.slice(0, limit) });
  }

  const nq = normalize(q);
  const aliasKey = nq.replace(/\s+/g, " ");
  const mapped = aliases[aliasKey] || nq;

  const scored = items.map((it) => {
    const nn = normalize(it.name);
    const nc = normalize(it.country);
    const combined = `${nn}, ${nc}`;
    let score = levenshtein(mapped, combined);
    if (combined.startsWith(mapped)) score -= 2;
    if (nn.startsWith(mapped) || nc.startsWith(mapped)) score -= 1;
    if (nn.includes(mapped) || nc.includes(mapped)) score -= 0.5;
    return { it, score };
  });

  scored.sort((a, b) => a.score - b.score);
  const suggestions = scored.slice(0, limit).map((s) => s.it);
  return NextResponse.json({ items: suggestions });
}