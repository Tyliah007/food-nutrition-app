import { NextResponse } from 'next/server';
import { searchFoods } from '../../../lib/fdc';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, pageSize = 25, pageNumber = 1 } = body || {};
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    const data = await searchFoods({ query, pageSize, pageNumber });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST with { query }' }, { status: 405 });
}
