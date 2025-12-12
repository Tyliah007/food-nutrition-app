import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  // allow import without crashing; actual operations will throw if missing
}

let pool: Pool | null = null;
let inited = false;

export function getPool(): Pool {
  if (!DATABASE_URL) throw new Error('DATABASE_URL not set');
  if (!pool) {
    pool = new Pool({ connectionString: DATABASE_URL });
  }
  return pool;
}

export async function initDb() {
  if (inited) return;
  const p = getPool();
  // create table for saved queries
  await p.query(`
    CREATE TABLE IF NOT EXISTS saved_queries (
      id SERIAL PRIMARY KEY,
      query_text TEXT NOT NULL,
      results JSONB,
      count INTEGER,
      avg_cal NUMERIC,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  inited = true;
}

export async function saveQuery({ query, results, count, avgCal }: { query: string; results: any[]; count?: number; avgCal?: number | null; }) {
  const p = getPool();
  await initDb();
  const r = await p.query(
    'INSERT INTO saved_queries(query_text, results, count, avg_cal) VALUES($1, $2, $3, $4) RETURNING id, created_at',
    [query, JSON.stringify(results || []), count ?? (results?.length ?? 0), avgCal ?? null]
  );
  return r.rows[0];
}

export async function listSaved(limit = 50) {
  const p = getPool();
  await initDb();
  const r = await p.query('SELECT id, query_text, results, count, avg_cal, created_at FROM saved_queries ORDER BY created_at DESC LIMIT $1', [limit]);
  return r.rows;
}

export async function getSavedById(id: number) {
  const p = getPool();
  await initDb();
  const r = await p.query('SELECT id, query_text, results, count, avg_cal, created_at FROM saved_queries WHERE id = $1', [id]);
  return r.rows[0] || null;
}
