import { Pool } from "pg";

const config = {
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT || 5432),
  database: process.env.DATABASE_NAME || "viajesdb",
  user: process.env.DATABASE_USERNAME || "viajesdb",
  password: process.env.DATABASE_PASSWORD || "",
  ssl: (() => {
    const v = String(process.env.DATABASE_SSL || "false").toLowerCase();
    if (v === "true" || v === "1") return { rejectUnauthorized: false } as any;
    return false as any;
  })(),
};

let pool: Pool | null = null;
let initialized = false;

function getPool() {
  if (!pool) {
    pool = new Pool(config);
  }
  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
  const p = getPool();
  const rs = await p.query(text, params);
  return { rows: rs.rows as T[] };
}

export async function ensureSchema() {
  if (initialized) return;
  initialized = true;
  const p = getPool();
  // Crear tablas si no existen
  await p.query(`
    CREATE TABLE IF NOT EXISTS questionnaire_history (
      id SERIAL PRIMARY KEY,
      user_email VARCHAR(255),
      destination_name VARCHAR(255),
      answers JSONB,
      result_snapshot JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS trip_budgets (
      id SERIAL PRIMARY KEY,
      ref VARCHAR(64),
      user_email VARCHAR(255),
      origin VARCHAR(255),
      destination_name VARCHAR(255),
      destination_country VARCHAR(255),
      travellers INT,
      nights INT,
      travel_class VARCHAR(32),
      hotel JSONB,
      rooms INT,
      breakdown JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      ref VARCHAR(64),
      user_email VARCHAR(255),
      destination VARCHAR(255),
      hotel VARCHAR(255),
      amount_usd NUMERIC,
      nights INT,
      guests INT,
      check_in DATE,
      check_out DATE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      type VARCHAR(32),
      ref VARCHAR(64),
      user_email VARCHAR(255),
      destination VARCHAR(255),
      hotel VARCHAR(255),
      amount_usd NUMERIC,
      nights INT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

// Nota: el esquema se inicializa bajo demanda desde las rutas API llamando a ensureSchema()