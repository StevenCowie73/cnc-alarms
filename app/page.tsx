"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Alarm = {
  code: string;
  name: string;
  cause?: string | null;
  action?: string | null;
  severity?: "red" | "blue" | "yellow" | "green" | string | null;
};

const theme = {
  red:    { card: "bg-red-50 border-red-300",     text: "text-red-800",    pill: "bg-red-100 text-red-800 border-red-300",    edge: "bg-red-400" },
  blue:   { card: "bg-blue-50 border-blue-300",   text: "text-blue-800",   pill: "bg-blue-100 text-blue-800 border-blue-300", edge: "bg-blue-400" },
  yellow: { card: "bg-yellow-50 border-yellow-300", text: "text-yellow-800", pill: "bg-yellow-100 text-yellow-800 border-yellow-300", edge: "bg-yellow-400" },
  green:  { card: "bg-green-50 border-green-300", text: "text-green-800",  pill: "bg-green-100 text-green-800 border-green-300",  edge: "bg-green-400" },
  default:{ card: "bg-gray-50 border-gray-300",   text: "text-gray-800",   pill: "bg-gray-100 text-gray-800 border-gray-300",   edge: "bg-gray-400" },
} as const;

function themeKey(sev?: string | null) {
  const k = (sev ?? "").toLowerCase();
  return (["red", "blue", "yellow", "green"] as const).includes(k as any) ? (k as any) : "default";
}

export default function Home() {
  const [items, setItems] = useState<Alarm[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/alarms?limit=12&offset=0", { cache: "no-store" });
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setItems(data.items ?? []);
          setTotal(data.total ?? 0);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load alarms");
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-5xl mx-auto p-6">
        {/* Hero header (restored) */}
        <div className="rounded-2xl border bg-white p-6 mb-6">
          <h1 className="text-3xl md:text-4xl font-semibold">Mazak CNC Alarm Database</h1>
          <p className="text-gray-600 mt-2">
            {loading ? "Loading…" : `Search ${total} alarm codes for instant troubleshooting`}
          </p>

          <a
            href="tel:+13184089163"
            className="inline-flex items-center justify-center mt-4 rounded-xl px-5 py-3 bg-blue-600 text-white hover:bg-blue-700"
          >
            24/7 AI Support • +1 (318) 408-9163
          </a>
        </div>

        {/* Simple search input (placeholder for now) */}
        <div className="rounded-2xl border bg-white p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search by code or keyword
          </label>
          <input
            className="w-full rounded-lg border px-4 py-2"
            placeholder="Enter alarm code (e.g., 134) or keyword (e.g., spindle)…"
          />
          <p className="text-xs text-gray-500 mt-2">
            Tip: Click “View full details” on any card to open the detailed page.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 text-red-800 p-4 mb-6">
            Failed to load list: {error}
          </div>
        )}

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((a) => {
            const t = theme[themeKey(a.severity)];
            return (
              <div key={a.code} className={`relative overflow-hidden rounded-2xl border p-6 ${t.card}`}>
                <div className={`absolute left-0 top-0 h-full w-2 ${t.edge}`} />
                <div className="flex items-start justify-between gap-4">
                  <h2 className={`text-2xl font-semibold ${t.text}`}>
                    Alarm {a.code}
                    <div className="text-xl md:text-2xl">{a.name}</div>
                  </h2>
                  <div className={`px-3 py-1 text-xs rounded-full border ${t.pill}`}>
                    {(a.severity ?? "UNKNOWN").toUpperCase()}
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {a.cause && (
                    <div>
                      <div className={`font-semibold ${t.text}`}>Cause:</div>
                      <div className="text-sm leading-relaxed">{a.cause}</div>
                    </div>
                  )}
                  {a.action && (
                    <div>
                      <div className={`font-semibold ${t.text}`}>Action:</div>
                      <div className="text-sm leading-relaxed">{a.action}</div>
                    </div>
                  )}

                  {/* View full details */}
                  <div className="pt-2">
                    <Link
                      href={`/alarms/${encodeURIComponent(a.code)}`}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                    >
                      View full details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && !error && (
          <div className="text-xs text-gray-500 mt-8">
            Showing {items.length} of {total} alarms.
          </div>
        )}
      </div>
    </main>
  );
}
