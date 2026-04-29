"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import alarmsRaw from "../public/alarms.json";
import { loadAlarms, type RawAlarm, type Severity } from "@/lib/alarms";
import { IndexColumn } from "./components/IndexColumn";
import { Readout } from "./components/Readout";
import { Ledger } from "./components/Ledger";

type SevFilter = "all" | Severity;

function HubInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const alarms = useMemo(() => loadAlarms(alarmsRaw as RawAlarm[]), []);

  const initialCode = (() => {
    const param = searchParams.get("code");
    const parsed = param ? parseInt(param, 10) : NaN;
    if (!Number.isNaN(parsed) && alarms.find((a) => a.code === parsed)) {
      return parsed;
    }
    return alarms[0]?.code ?? null;
  })();

  const [selected, setSelected] = useState<number | null>(initialCode);
  const [query, setQuery] = useState("");
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [speaking, setSpeaking] = useState(false);
  const [lang, setLang] = useState<"en" | "es">("en");
  const [now, setNow] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!pickerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [pickerOpen]);

  useEffect(() => {
    const stored = window.localStorage.getItem("hub.lang");
    if (stored === "en" || stored === "es") setLang(stored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("hub.lang", lang);
  }, [lang]);

  useEffect(() => {
    if (selected === null) return;
    const current = searchParams.get("code");
    if (current !== String(selected)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("code", String(selected));
      router.replace(`/?${params.toString()}`, { scroll: false });
    }
  }, [selected, router, searchParams]);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow(d.toISOString().slice(0, 16).replace("T", " "));
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const alarm = useMemo(
    () => alarms.find((a) => a.code === selected) ?? null,
    [alarms, selected]
  );

  const stats = useMemo(
    () => ({
      total: alarms.length,
      critical: alarms.filter((a) => a.severity === "critical").length,
      warning: alarms.filter((a) => a.severity === "warning").length,
      notice: alarms.filter((a) => a.severity === "notice").length,
    }),
    [alarms]
  );

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

  return (
    <div className="shell">
      <header className="masthead">
        <div className="masthead__inner">
          <div className="masthead__brand">
            <span className="masthead__wordmark">cowie · alarms</span>
            <span className="masthead__tagline">Alarm Intelligence Hub</span>
          </div>
          <div className="masthead__center">
            <span className="pulse" />
            <span className="mono-label">
              Session <strong>UTC {now || "—"}</strong>
            </span>
          </div>
          <nav className="masthead__nav">
            <div className="lang">
              <button
                type="button"
                className={lang === "en" ? "is-on" : ""}
                onClick={() => setLang("en")}
              >
                EN
              </button>
              <button
                type="button"
                className={lang === "es" ? "is-on" : ""}
                onClick={() => setLang("es")}
              >
                ES
              </button>
            </div>
            <Link href="/login" className="auth-link">
              Sign in
            </Link>
            <a href="tel:+13184089163">Call support</a>
          </nav>
        </div>
      </header>

      <div className="status">
        <div className="status__cell">
          <span className="mono-label muted">Codes catalogued</span>
          <span className="status__num">
            {stats.total.toString().padStart(4, "0")}
          </span>
        </div>
        <div className="status__cell">
          <span className="mono-label muted">Critical</span>
          <span className="status__num status__num--crit">
            {stats.critical.toString().padStart(2, "0")}
          </span>
        </div>
        <div className="status__cell">
          <span className="mono-label muted">Warning</span>
          <span className="status__num status__num--warn">
            {stats.warning.toString().padStart(2, "0")}
          </span>
        </div>
        <div className="status__cell">
          <span className="mono-label muted">Notice</span>
          <span className="status__num status__num--note">
            {stats.notice.toString().padStart(2, "0")}
          </span>
        </div>
        <div className="status__cell">
          <span className="mono-label muted">Now viewing</span>
          <span className="status__num">
            {alarm ? String(alarm.code).padStart(4, "0") : "----"}
          </span>
        </div>
      </div>

      <div className="body">
        {isMobile && alarm && (
          <button
            type="button"
            className="picker"
            onClick={() => setPickerOpen(true)}
            aria-label="Browse alarm codes"
          >
            <div className="picker__bar">
              <span
                className={`picker__bar-bar picker__bar-bar--${alarm.severity}`}
                aria-hidden
              />
              <span className="picker__bar-code">
                {String(alarm.code).padStart(4, "0")}
              </span>
              <span className="picker__bar-text">
                <span className="picker__bar-meta">
                  Tap to browse · {alarms.length} codes
                </span>
                <span className="picker__bar-msg">{alarm.message}</span>
              </span>
              <span className="picker__bar-chev" aria-hidden>
                ▾
              </span>
            </div>
          </button>
        )}

        {!isMobile && (
          <IndexColumn
            alarms={alarms}
            selected={selected}
            onSelect={setSelected}
            query={query}
            onQuery={setQuery}
            sevFilter={sevFilter}
            onSevFilter={setSevFilter}
          />
        )}
        <Readout
          alarm={alarm}
          lang={lang}
          onSpeak={speak}
          speaking={speaking}
          isMobile={isMobile}
        />
        {!isMobile && (
          <Ledger alarm={alarm} alarms={alarms} onSelect={setSelected} />
        )}
      </div>

      {isMobile && pickerOpen && (
        <div className="picker__sheet" role="dialog" aria-label="Alarm code picker">
          <div className="picker__sheet-head">
            <span className="picker__sheet-title">Browse codes</span>
            <button
              type="button"
              className="picker__sheet-close"
              onClick={() => setPickerOpen(false)}
            >
              Close ✕
            </button>
          </div>
          <IndexColumn
            alarms={alarms}
            selected={selected}
            onSelect={(code) => {
              setSelected(code);
              setPickerOpen(false);
            }}
            query={query}
            onQuery={setQuery}
            sevFilter={sevFilter}
            onSevFilter={setSevFilter}
          />
        </div>
      )}

      {isMobile && alarm && (
        <div className="phonebar">
          <a href="tel:+13184089163">
            <span className="phonebar__icon" aria-hidden>
              ☏
            </span>
            <span>
              <span className="phonebar__lbl">Call cowie.ai · 24/7</span>
              <span className="phonebar__num">+1 318 408 9163</span>
            </span>
            <span className="phonebar__quote">
              Quote {String(alarm.code).padStart(4, "0")}
            </span>
          </a>
        </div>
      )}

      <footer className="footer">
        <span className="mono-label">
          cowie.ai · independent third-party · not affiliated with Yamazaki Mazak
        </span>
        <div className="footer__links">
          <Link href="/landing" className="mono-label">
            About
          </Link>
          <Link href="/" className="mono-label">
            Privacy
          </Link>
          <a href="mailto:info@cowie.ai" className="mono-label">
            Contact
          </a>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="readout readout--empty"><p className="muted">Loading…</p></div>}>
      <HubInner />
    </Suspense>
  );
}
