import { NextResponse } from 'next/server';
import { saveQuery, listSaved } from '../../../lib/db';

export async function POST(req: Request) {
  try {
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL not set (set DATABASE_URL in environment)' }, { status: 500 });
    const body = await req.json();
    const { query, results, count, avgCal } = body || {};
    if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

    const r = await saveQuery({ query, results: Array.isArray(results) ? results.slice(0, 500) : [], count, avgCal });
    return NextResponse.json({ ok: true, id: r.id, createdAt: r.created_at });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL not set (set DATABASE_URL in environment)' }, { status: 500 });
    const docs = await listSaved(50);
    return NextResponse.json(docs.map(d => ({ id: d.id, query: d.query_text, results: d.results, count: d.count, avgCal: d.avg_cal, createdAt: d.created_at })), { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
