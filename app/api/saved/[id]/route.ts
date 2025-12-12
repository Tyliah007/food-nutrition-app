import { NextResponse } from 'next/server';
import { getSavedById } from '../../../../lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 });
    const doc = await getSavedById(id);
    if (!doc) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ id: doc.id, query: doc.query_text, results: doc.results, count: doc.count, avgCal: doc.avg_cal, createdAt: doc.created_at });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
