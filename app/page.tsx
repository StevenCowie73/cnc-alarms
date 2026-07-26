"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import alarmsRaw from "../public/alarms.json";
import { loadAlarms, type RawAlarm } from "@/lib/alarms";
import { AlarmCard } from "./components/AlarmCard";
import { AlarmDetail } from "./components/AlarmDetail";

const RECENT_KEY = "hub.recent";

function HubInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Unchanged data path: alarms.json, normalized and sorted client-side.
  const alarms = useMemo(() => loadAlarms(alarmsRaw as RawAlarm[]), []);
  const byCode = useMemo(() => {
    const m = new Map<number, ReturnType<typeof loadAlarms>[number]>();
    alarms.forEach((a) => m.set(a.code, a));
    return m;
  }, [alarms]);

  // Detail selection stays tied to the ?code= param, preserving the existing
  // route contract and shareable URLs.
  const codeParam = searchParams.get("code");
  const parsedCode = codeParam ? parseInt(codeParam, 10) : NaN;
  const selected = !Number.isNaN(parsedCode) ? byCode.get(parsedCode) ?? null : null;

  const [query, setQuery] = useState("");
  const [view, setView] = useState<"search" | "results">("search");
  const [recentCodes, setRecentCodes] = useState<number[]>([]);
  const [lang, setLang] = useState<"en" | "es">("en");
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const storedLang = window.localStorage.getItem("hub.lang");
    if (storedLang === "en" || storedLang === "es") setLang(storedLang);
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

  useEffect(() => {
    window.localStorage.setItem("hub.lang", lang);
  }, [lang]);

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

  const openCode = useCallback(
    (code: number) => {
      pushRecent(code);
      const params = new URLSearchParams(searchParams.toString());
      params.set("code", String(code));
      router.push(`/?${params.toString()}`, { scroll: false });
      if (typeof window !== "undefined") window.scrollTo(0, 0);
    },
    [router, searchParams, pushRecent]
  );

  const clearCode = useCallback(() => {
    router.push("/", { scroll: false });
  }, [router]);

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

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "es" ? "es-MX" : "en-US";
    u.rate = 0.92;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  }

  function runSearch() {
    setView("results");
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }

  // ── Detail ──────────────────────────────────────────────
  if (selected) {
    return (
      <main className="flow">
        <AlarmDetail
          alarm={selected}
          lang={lang}
          onLang={setLang}
          onSpeak={speak}
          speaking={speaking}
          onBack={clearCode}
        />
        <FlowFooter />
      </main>
    );
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
      <FlowFooter />
    </main>
  );
}

function FlowFooter() {
  return (
    <footer className="flow-footer">
      <a href="tel:+13184089163" className="flow-footer__call">
        Faulted right now? Call support — 24/7
      </a>
      <span className="mono-label muted">
        cowie.ai · independent third-party · not affiliated with Yamazaki Mazak
      </span>
    </footer>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="flow">
          <p className="flow-empty">Loading…</p>
        </main>
      }
    >
      <HubInner />
    </Suspense>
  );
}
