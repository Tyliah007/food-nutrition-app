"use client";

import React, { useEffect, useState } from "react";
import styles from "./page.module.css";

type Food = any;

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Food[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [multiplier, setMultiplier] = useState<number>(1);

  async function doSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, pageSize: 25 }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      const items = data?.foods || [];
      setResults(items);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  function extractCalories(f: Food) {
    const nutrients = f.foodNutrients || [];
    for (const n of nutrients) {
      const name = n.nutrientName || n.name || "";
      const num = n.nutrientNumber || n.number || "";
      if (/energy|calor/i.test(name) || num === "208") return n.value;
    }
    return null;
  }

  const count = results.length;
  const baseCalories = results.map((r) => extractCalories(r)).map((v) => (v == null ? null : Number(v)));
  const displayedCalories = baseCalories.map((v) => (v == null ? null : Math.round((v * multiplier) * 10) / 10));
  const present = displayedCalories.filter((v) => v != null) as number[];
  const avgCal = present.length ? Math.round((present.reduce((a, b) => a + b, 0) / present.length) * 10) / 10 : null;

  async function loadSaved() {
    try {
      const res = await fetch("/api/saved");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error || `${res.status} ${res.statusText}`);
        return;
      }
      const data = await res.json();
      setSaved(data || []);
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => {
    loadSaved();
  }, []);

  async function saveResults(payloadResults: any[], nameOverride?: string) {
    if (!payloadResults || payloadResults.length === 0) return;
    setSaving(true);
    try {
      const payload = { query: nameOverride ?? query, results: payloadResults, count: payloadResults.length, avgCal };
      const res = await fetch("/api/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error || `${res.status} ${res.statusText}`);
        return;
      }
      if (body?.ok) {
        await loadSaved();
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  function toggleSelect(i: number) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  function selectAll() { setSelectedIds(new Set(results.map((_, i) => i))); }
  function deselectAll() { setSelectedIds(new Set()); }

  async function viewSaved(id: number) {
    setSelectedId(id);
    setSelectedDetails(null);
    try {
      const res = await fetch(`/api/saved/${id}`);
      if (!res.ok) throw new Error('not found');
      const body = await res.json();
      setSelectedDetails(body);
    } catch (err) {
      setSelectedDetails({ error: 'Unable to load' });
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Nutrition Finder</h1>
          <p className={styles.lead}>Search the USDA FoodData Central for foods.</p>
        </div>

        <form className={styles.searchForm} onSubmit={doSearch}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. cheddar cheese, banana, chicken breast"
            className={styles.searchInput}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button className={styles.button} type="submit" disabled={loading}>
              {loading ? "Searching…" : "Search"}
            </button>
            <button type="button" className={styles.button} onClick={() => saveResults(results)} disabled={saving || results.length === 0}>
              {saving ? "Saving…" : "Save Results"}
            </button>
          </div>
        </form>

        <div className={styles.summaryRow}>
          <div>
            Results: <strong>{count}</strong>
          </div>
          <div>
            Calorie avg: <strong>{avgCal ?? "—"}</strong>
          </div>
        </div>

        {error && <div className={styles.error}>Error: {error}</div>}

        <div className={styles.controlsRow}>
          <button className={styles.smallButton} type="button" onClick={selectAll}>Select All</button>
          <button className={styles.smallButton} type="button" onClick={deselectAll}>Deselect All</button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Serving multiplier:</label>
            <input type="range" min="0.5" max="2" step="0.1" value={multiplier} onChange={(e) => setMultiplier(Number(e.target.value))} />
            <div className={styles.smallMeta}>{multiplier}x</div>
          </div>
        </div>

        <div className={styles.results}>
          {results.map((f: Food, i: number) => {
            const base = baseCalories[i];
            const disp = displayedCalories[i];
            const selectedFlag = selectedIds.has(i);
            return (
              <div key={f.fdcId || f.foodId || JSON.stringify(f)} className={`${styles.resultItem} ${selectedFlag ? styles.selected : ''}`} onClick={() => toggleSelect(i)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="checkbox" checked={selectedFlag} onChange={() => toggleSelect(i)} onClick={(e) => e.stopPropagation()} />
                  <div style={{ flex: 1 }}>
                    <div className={styles.resultTitle}>{f.description}</div>
                    <div className={styles.resultMeta}>
                      <span>{f.brandOwner || f.dataType || '—'}</span>
                      <span>fdcId: {f.fdcId}</span>
                      <span>Cal: {disp ?? '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className={styles.button} type="button" onClick={() => saveResults(results.filter((_, i) => selectedIds.has(i)))} disabled={saving || selectedIds.size === 0}>{saving ? 'Saving…' : 'Save Selected'}</button>
          <button className={styles.button} type="button" onClick={() => saveResults(results)} disabled={saving || results.length === 0}>{saving ? 'Saving…' : 'Save All'}</button>
        </div>

        <div className={styles.history}>
          <h3>Saved Queries</h3>
          {saved.length === 0 && <div className={styles.subtle}>No saved queries yet.</div>}
          {saved.map((s) => (
            <div key={s.id} className={styles.historyItem}>
              <div>
                <div className={styles.historyTitle}>
                  {s.query} <span className={styles.smallMeta}>({s.count} rows)</span>
                </div>
                <div className={styles.smallMeta}>{new Date(s.createdAt).toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className={styles.button} onClick={() => viewSaved(s.id)}>View</button>
              </div>
            </div>
          ))}

          {selectedDetails && (
            <div style={{ marginTop: 12 }}>
              <h4>Saved Result Details</h4>
              <pre style={{ maxHeight: 300, overflow: 'auto', background: '#fafafa', padding: 12, borderRadius: 6 }}>{JSON.stringify(selectedDetails, null, 2)}</pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function CalorieBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => (d.value || 0)), 1);
  const width = 600;
  const barHeight = 18;
  const gap = 8;
  const height = data.length * (barHeight + gap);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: '100%' }}>
      {data.map((d, i) => {
        const w = Math.round((d.value / max) * (width - 220));
        const y = i * (barHeight + gap);
        return (
          <g key={i} transform={`translate(0, ${y})`}>
            <text x={0} y={barHeight - 4} fontSize={12} fill="#333">{d.label.slice(0, 40)}</text>
            <rect x={220} y={0} width={w} height={barHeight} fill="#3b82f6" rx={4} />
            <text x={220 + w + 8} y={barHeight - 4} fontSize={12} fill="#111">{d.value}</text>
          </g>
        );
      })}
    </svg>
  );
}
