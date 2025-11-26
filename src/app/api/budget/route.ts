import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Destination = {
  id: number;
  name: string;
  country: string;
  climate?: string;
  priceRange?: "economic" | "moderate" | "comfort" | "luxury";
  coordinates: { lat: number; lon: number };
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

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371; // km
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.round(R * c * 10) / 10;
}

async function geocodeOrigin(origin: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("q", origin);
    const res = await fetch(url.toString(), { headers: { "User-Agent": "travel-smart-app" } });
    if (!res.ok) return null;
    const json = await res.json();
    const item = Array.isArray(json) ? json[0] : null;
    if (!item) return null;
    return { lat: parseFloat(item.lat), lon: parseFloat(item.lon) };
  } catch {
    return null;
  }
}

function dailyCostByRange(range: Destination["priceRange"]): number {
  switch (range) {
    case "economic":
      return 35;
    case "moderate":
      return 70;
    case "comfort":
      return 120;
    case "luxury":
      return 220;
    default:
      return 70;
  }
}

function flightRatePerKm(travelClass: "economy" | "business" = "economy"): number {
  return travelClass === "business" ? 0.23 : 0.09;
}

export async function POST(req: Request) {
  const { origin, destinationName, destinationCountry, nights, travellers, travelClass, hotelPricePerNightUSD, rooms } =
    await req.json();

  const db = loadDb();
  const norm = (s: string) => String(s || "").trim().toLowerCase();
  const dest = db.find(
    (d) => norm(d.name) === norm(destinationName) && (!destinationCountry || norm(d.country) === norm(destinationCountry))
  );
  if (!dest) {
    return NextResponse.json({ error: "Destino no encontrado" }, { status: 404 });
  }

  const originPoint = await geocodeOrigin(String(origin || ""));
  if (!originPoint) {
    return NextResponse.json({ error: "Origen no válido" }, { status: 400 });
  }

  const distanceKm = haversineKm(originPoint, dest.coordinates);
  const rate = flightRatePerKm(travelClass || "economy");
  const baseFeesPerTraveler = 35; // tasas y cargos aproximados
  const taxFactor = 1.12; // impuestos aproximados
  const travelers = Math.max(1, Number(travellers) || 1);
  const nightsNum = Math.max(1, Number(nights) || 1);
  const roomsNum = Math.max(0, Number(rooms) || 0);

  const flightCostPerTraveler = distanceKm * rate + baseFeesPerTraveler;
  const flightCostTotal = Math.round(flightCostPerTraveler * travelers * taxFactor);

  const dailyCost = dailyCostByRange(dest.priceRange);
  const dailyCostTotal = Math.round(dailyCost * nightsNum * travelers);

  const lodgingPerNight = typeof hotelPricePerNightUSD === "number" ? hotelPricePerNightUSD : 0;
  const lodgingTotal = Math.round(lodgingPerNight * nightsNum * Math.max(1, roomsNum));

  const total = flightCostTotal + dailyCostTotal + lodgingTotal;
  const perPerson = Math.round(total / travelers);

  return NextResponse.json({
    origin: origin,
    destination: `${dest.name}, ${dest.country}`,
    distanceKm,
    flight: { class: travelClass || "economy", total: flightCostTotal },
    daily: { perDay: dailyCost, total: dailyCostTotal },
    lodging: { perNight: lodgingPerNight, rooms: roomsNum, nights: nightsNum, total: lodgingTotal },
    total,
    perPerson,
  });
}