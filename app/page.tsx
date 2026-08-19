"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAllAlarms } from "@/lib/alarmData";
import { AlarmCard } from "./components/AlarmCard";
import { FlowFooter } from "./components/FlowFooter";

const RECENT_KEY = "hub.recent";

// The search hub. Alarm detail now lives at /alarms/[code] (statically
// generated, crawlable); this page is the fast search front door and is
// itself server-rendered on first request — there is no searchParams
// dependency, so no client-side bailout / "Loading…" shell.
export default function Home() {
  const router = useRouter();

  const alarms = useMemo(() => getAllAlarms(), []);
  const byCode = useMemo(() => {
    const m = new Map<number, (typeof alarms)[number]>();
    alarms.forEach((a) => m.set(a.code, a));
    return m;
  }, [alarms]);

  const [query, setQuery] = useState("");
  const [view, setView] = useState<"search" | "results">("search");
  const [recentCodes, setRecentCodes] = useState<number[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setRecentCodes(parsed.filter((x) => typeof x === "number"));
      }
    } catch {
      /* ignore malformed recent list */
    }
  }, []);

  const pushRecent = useCallback((code: number) => {
    setRecentCodes((prev) => {
      const next = [code, ...prev.filter((c) => c !== code)].slice(0, 5);
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota / privacy-mode errors */
      }
      return next;
    });
  }, []);

  // Cards are real links to /alarms/[code]; this just records the lookup.
  const openCode = useCallback((code: number) => pushRecent(code), [pushRecent]);

  // Same client-side filter predicate as before: code, message, or cause.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return alarms.filter(
      (a) =>
        String(a.code).includes(q) ||
        a.message.toLowerCase().includes(q) ||
        a.cause.toLowerCase().includes(q)
    );
  }, [alarms, query]);

  // Recent = last viewed codes; before anything has been viewed, seed with a
  // representative sample so the list is never empty.
  const recentAlarms = useMemo(() => {
    const fromStore = recentCodes
      .map((c) => byCode.get(c))
      .filter((a): a is NonNullable<typeof a> => Boolean(a));
    if (fromStore.length > 0) return fromStore.slice(0, 5);
    const sample: typeof alarms = [];
    for (const sev of ["critical", "warning", "notice"] as const) {
      const hit = alarms.find((a) => a.severity === sev);
      if (hit) sample.push(hit);
    }
    return sample;
  }, [recentCodes, byCode, alarms]);

  function runSearch() {
    const exact = parseInt(query.trim(), 10);
    if (/^\d{1,4}$/.test(query.trim()) && byCode.has(exact)) {
      pushRecent(exact);
      router.push(`/alarms/${exact}`);
      return;
    }
    setView("results");
    window.scrollTo(0, 0);
  }

  // ── Results ─────────────────────────────────────────────
  if (view === "results") {
    return (
      <main className="flow">
        <div className="flow-searchbar">
          <button
            type="button"
            className="flow-searchbar__back"
            onClick={() => setView("search")}
            aria-label="Back to search"
          >
            ‹
          </button>
          <div className="search-field search-field--sm">
            <span className="search-field__icon" aria-hidden>
              ⌕
            </span>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runSearch();
              }}
              placeholder="Code or keyword"
            />
          </div>
          <a
            href="https://mazatrol.cowie.ai"
            className="flow-header__link flow-headlink"
          >
            Mazatrol
          </a>
        </div>

        <div className="flow-label flow-results__count">
          {results.length} {results.length === 1 ? "match" : "matches"}
        </div>

        <div className="card-list">
          {results.map((a) => (
            <AlarmCard key={a.code} alarm={a} onOpen={openCode} />
          ))}
          {results.length === 0 && (
            <p className="flow-empty">— no codes match —</p>
          )}
        </div>
        <FlowFooter />
      </main>
    );
  }

  // ── Search (landing) ────────────────────────────────────
  return (
    <main className="flow">
      <header className="flow-header">
        <span className="brandmark">
          <span className="flow-header__names">
            ALARMS
            <span className="flow-header__tag">CNC fault lookup</span>
          </span>
        </span>
        <nav className="flow-header__nav">
          <a
            href="https://mazatrol.cowie.ai"
            className="flow-header__link"
          >
            Mazatrol Assistant
          </a>
          <Link href="/login" className="flow-header__link">
            Sign in
          </Link>
          <span className="flow-header__chip">MAZAK</span>
        </nav>
      </header>

      <h1 className="flow-hero">
        What alarm is on
        <br />
        the screen?
      </h1>

      <div className="search-field">
        <span className="search-field__icon" aria-hidden>
          ⌕
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") runSearch();
          }}
          placeholder="Code or keyword"
        />
      </div>
      <button type="button" className="btn-accent flow-lookup" onClick={runSearch}>
        Look up alarm
      </button>

      <div className="flow-label flow-recent__label">Recent</div>
      <div className="card-list">
        {recentAlarms.map((a) => (
          <AlarmCard key={a.code} alarm={a} onOpen={openCode} />
        ))}
      </div>
      <p className="flow-browse">
        <Link href="/alarms">Browse all {alarms.length.toLocaleString()} alarm codes →</Link>
      </p>
      <FlowFooter />
    </main>
  );
}
