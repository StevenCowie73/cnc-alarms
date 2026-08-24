"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { preload } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SEARCH_INDEX_URL, type SearchIndex } from "@/lib/searchIndex";
import { expandIndex, search, type ResultType, type SearchResult } from "@/lib/search";
import { ResultCard } from "./components/ResultCard";
import { FlowFooter } from "./components/FlowFooter";

const RECENT_KEY = "hub.recent";
const RESULT_LIMIT = 200;

// The search hub. Detail pages are statically generated (/alarms/[code],
// /parameters/[address]); this page only needs the slim search index, which
// is a static file built from the same data and fetched (preloaded) on
// load — the full datasets never reach the browser.
export interface HubSeed {
  counts: { alarms: number; params: number; mcodes: number };
  sample: SearchResult[];
}

export function Hub({ seed }: { seed: HubSeed }) {
  const router = useRouter();
  preload(SEARCH_INDEX_URL, { as: "fetch", crossOrigin: "anonymous" });

  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"search" | "results">("search");
  const [filter, setFilter] = useState<"all" | ResultType>("all");
  const [recentCodes, setRecentCodes] = useState<number[]>([]);

  useEffect(() => {
    let live = true;
    fetch(SEARCH_INDEX_URL)
      .then((r) => r.json())
      .then((ix: SearchIndex) => { if (live) setIndex(ix); })
      .catch(() => { /* search stays empty; detail pages still work */ });
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setRecentCodes(parsed.filter((x) => typeof x === "number"));
    } catch { /* ignore malformed recent list */ }
    return () => { live = false; };
  }, []);

  const entries = useMemo(() => (index ? expandIndex(index) : []), [index]);
  const alarmByCode = useMemo(() => {
    const m = new Map<string, SearchResult>();
    for (const e of entries) if (e.type === "alarm") m.set(e.code, e);
    return m;
  }, [entries]);
  const paramByAddress = useMemo(() => {
    const m = new Map<string, SearchResult>();
    for (const e of entries) if (e.type === "param" && !e.code.includes(" bit ")) m.set(e.code.toLowerCase(), e);
    return m;
  }, [entries]);
  const mcodeByCode = useMemo(() => {
    const m = new Map<string, SearchResult>();
    for (const e of entries) if (e.type === "mcode") m.set(e.code.toLowerCase(), e);
    return m;
  }, [entries]);
  const counts = seed.counts;

  const pushRecent = useCallback((code: number) => {
    setRecentCodes((prev) => {
      const next = [code, ...prev.filter((c) => c !== code)].slice(0, 5);
      try { window.localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* quota / privacy mode */ }
      return next;
    });
  }, []);
  const onOpen = useCallback((r: SearchResult) => { if (r.type === "alarm") pushRecent(Number(r.code)); }, [pushRecent]);

  const found = useMemo(() => search(entries, query), [entries, query]);
  const typeCounts = useMemo(() => {
    let a = 0, p = 0, m = 0;
    for (const r of found.results) {
      if (r.type === "alarm") a++;
      else if (r.type === "param") p++;
      else m++;
    }
    return { a, p, m };
  }, [found]);
  // Cap what is rendered AFTER the type filter, so filtering to a sparse
  // type (M-codes rank below alarms and parameters) still reaches matches
  // past the display cap.
  const filtered = useMemo(
    () => (filter === "all" ? found.results : found.results.filter((r) => r.type === filter)),
    [found, filter],
  );
  const results = useMemo(() => filtered.slice(0, RESULT_LIMIT), [filtered]);

  // Recent = last viewed alarms; before anything has been viewed, seed with
  // one example per severity so the list is never empty.
  const recent = useMemo(() => {
    const fromStore = recentCodes.map((c) => alarmByCode.get(String(c))).filter((x): x is SearchResult => Boolean(x));
    if (fromStore.length > 0) return fromStore.slice(0, 5);
    return seed.sample;   // server-rendered on first paint, one per severity
  }, [recentCodes, alarmByCode, seed.sample]);

  function runSearch() {
    const q = query.trim();
    // Jump straight to a page only when the query is unambiguous: an exact
    // alarm code, parameter address or M-code that matches nothing else.
    // "217" (alarm 217 plus parameters containing 217) shows the mixed list.
    const exactAlarm = /^\d{1,4}$/.test(q) ? alarmByCode.get(String(Number(q))) : undefined;
    const exactParam = paramByAddress.get(q.toLowerCase());
    const exactMCode = mcodeByCode.get(q.toLowerCase());
    if (exactAlarm && found.total === 1) {
      pushRecent(Number(q));
      router.push(exactAlarm.href);
      return;
    }
    if (exactParam && found.total === 1) { router.push(exactParam.href); return; }
    if (exactMCode && found.total === 1) { router.push(exactMCode.href); return; }
    setFilter("all");
    setView("results");
    window.scrollTo(0, 0);
  }

  const searchInput = (small: boolean) => (
    <div className={small ? "search-field search-field--sm" : "search-field"}>
      <span className="search-field__icon" aria-hidden>⌕</span>
      <input
        autoFocus={small}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
        placeholder="Alarm code, parameter, M-code or keyword"
        aria-label="Search alarms, parameters and M-codes"
      />
    </div>
  );

  // ── Results ─────────────────────────────────────────────
  if (view === "results") {
    const chip = (key: "all" | ResultType, label: string, n: number) => (
      <button
        type="button"
        className={"filter-chip" + (filter === key ? " is-on" : "")}
        onClick={() => setFilter(key)}
        aria-pressed={filter === key}
      >
        {label} <span className="filter-chip__n">{n}</span>
      </button>
    );
    return (
      <main className="flow">
        <div className="flow-searchbar">
          <button type="button" className="flow-searchbar__back" onClick={() => setView("search")} aria-label="Back to search">‹</button>
          {searchInput(true)}
          <a href="https://mazatrol.cowie.ai" className="flow-header__link flow-headlink">Mazatrol</a>
        </div>

        <div className="flow-results__bar">
          <div className="flow-label flow-results__count">
            {!index
              ? "loading index…"
              : `${found.total} ${found.total === 1 ? "match" : "matches"}${filtered.length > RESULT_LIMIT ? ` · showing first ${RESULT_LIMIT}` : ""}`}
          </div>
          {found.total > 0 && (
            <div className="filter-chips" role="group" aria-label="Filter results by type">
              {chip("all", "All", found.results.length)}
              {chip("alarm", "Alarms", typeCounts.a)}
              {chip("param", "Parameters", typeCounts.p)}
              {chip("mcode", "M-codes", typeCounts.m)}
            </div>
          )}
        </div>

        <div className="card-list">
          {results.map((r) => <ResultCard key={r.key} r={r} onOpen={onOpen} />)}
          {index && results.length === 0 && <p className="flow-empty">— nothing matches —</p>}
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
            <span className="flow-header__tag">Mazak reference</span>
          </span>
        </span>
        <nav className="flow-header__nav">
          <a href="https://mazatrol.cowie.ai" className="flow-header__link">Mazatrol Assistant</a>
          <Link href="/login" className="flow-header__link">Sign in</Link>
          <span className="flow-header__chip">MAZAK</span>
        </nav>
      </header>

      <h1 className="flow-hero">
        What alarm is on
        <br />
        the screen?
      </h1>

      {searchInput(false)}
      <button type="button" className="btn-accent flow-lookup" onClick={runSearch}>
        Look up
      </button>

      <div className="flow-label flow-recent__label">Recent</div>
      <div className="card-list">
        {recent.map((r) => <ResultCard key={r.key} r={r} onOpen={onOpen} />)}
      </div>
      {/* prefetch off: the index pages are 1,200–1,400 rows (46–55 KB RSC) and
          rarely the next click — let the hub load light. */}
      <p className="flow-browse">
        <Link href="/alarms" prefetch={false}>Browse all {counts.alarms.toLocaleString()} alarm codes →</Link>
        <span className="flow-browse__sep"> · </span>
        <Link href="/parameters" prefetch={false}>Browse {counts.params.toLocaleString()} parameters →</Link>
        <span className="flow-browse__sep"> · </span>
        <Link href="/mcodes" prefetch={false}>Browse {counts.mcodes.toLocaleString()} M-codes →</Link>
      </p>
      <FlowFooter />
    </main>
  );
}
