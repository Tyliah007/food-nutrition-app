const FDC_BASE = 'https://api.nal.usda.gov/fdc/v1';

export interface FdcSearchOptions {
  query: string;
  pageSize?: number;
  pageNumber?: number;
}

function getApiKey() {
  return process.env.FDC_API_KEY || process.env.NEXT_PUBLIC_FDC_API_KEY || process.env.USDA_API_KEY || process.env.USDA_FDC_API_KEY;
}

export async function searchFoods(opts: FdcSearchOptions) {
  const { query, pageSize = 25, pageNumber = 1 } = opts;
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('FDC API key not configured. Set FDC_API_KEY or USDA_API_KEY in environment.');
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    query,
    pageSize: String(pageSize),
    pageNumber: String(pageNumber),
  });

  const url = `${FDC_BASE}/foods/search?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`FDC search failed: ${res.status} ${txt}`);
  }
  return res.json();
}

export async function getFoodById(fdcId: number) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('FDC API key not configured.');
  const url = `${FDC_BASE}/food/${fdcId}?api_key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FDC getFood failed: ${res.statusText}`);
  return res.json();
}
