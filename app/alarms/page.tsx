import type { Metadata } from "next";
import Link from "next/link";
import { SEV_META } from "@/lib/alarms";
import { getAllAlarms } from "@/lib/alarmData";
import { SevTag } from "@/app/components/SevTag";
import { FlowFooter } from "@/app/components/FlowFooter";
import { IndexSearch } from "./IndexSearch";

// Browsable index of every Mazak alarm code. Rendered entirely on the
// server so the complete list of links is in the HTML; the search box on
// top is a small client component that filters the rendered rows.

const SITE = "https://alarms.cowie.ai";

export const metadata: Metadata = {
  title: "Mazak Alarm Codes — complete list with cause & fix | Cowie.ai",
  description:
    "Every Mazak CNC alarm code in one searchable list. Tap any code for its meaning, cause, recovery steps, and clearing procedure from the manual. Free, mobile-first, 24/7 phone support.",
  alternates: { canonical: `${SITE}/alarms` },
  openGraph: {
    title: "Mazak Alarm Codes — complete list | Cowie.ai",
    description:
      "Every Mazak CNC alarm code with cause, fix, severity, and clearing procedure.",
    url: `${SITE}/alarms`,
    siteName: "Cowie.ai Alarms",
    type: "website",
  },
};

export default function AlarmIndexPage() {
  const alarms = getAllAlarms();
  const counts = { critical: 0, warning: 0, notice: 0 };
  for (const a of alarms) counts[a.severity]++;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Mazak Alarm Codes",
    url: `${SITE}/alarms`,
    description:
      "Complete list of Mazak CNC alarm codes with cause, fix, severity, and clearing procedure.",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: alarms.length,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
    },
  };

  return (
    <main className="flow">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="flow-header">
        <span className="brandmark">
          <span className="flow-header__names">
            ALARMS
            <span className="flow-header__tag">all Mazak codes</span>
          </span>
        </span>
        <nav className="flow-header__nav">
          <Link href="/" className="flow-header__link">
            Search
          </Link>
          <a href="https://mazatrol.cowie.ai" className="flow-header__link">
            Mazatrol Assistant
          </a>
          <span className="flow-header__chip">MAZAK</span>
        </nav>
      </header>

      <h1 className="flow-hero">
        Every Mazak
        <br />
        alarm code.
      </h1>
      <p className="index-intro">
        {alarms.length.toLocaleString()} alarms from the Mazak manual —{" "}
        {counts.critical} {SEV_META.critical.label.toLowerCase()},{" "}
        {counts.warning} {SEV_META.warning.label.toLowerCase()},{" "}
        {counts.notice} {SEV_META.notice.label.toLowerCase()}. Tap a code for
        its cause, what to do, and how to clear it.
      </p>

      <IndexSearch total={alarms.length} />

      {/* Plain <a> rows on purpose: 1,200 next/link instances would bloat the
          RSC payload and prefetch every row that scrolls into view — bad on
          shop wifi. Each target is a static page, so a full navigation is
          cheap. */}
      <ol className="index-list" aria-label="Mazak alarm codes">
        {alarms.map((a) => (
          <li
            key={a.code}
            data-alarm-row
            data-q={`${a.code} ${a.message}`.toLowerCase()}
          >
            <a href={`/alarms/${a.code}`} className="index-row">
              <span className="index-row__code">{a.code}</span>
              <span className="index-row__msg">{a.message}</span>
              <SevTag severity={a.severity} compact />
            </a>
          </li>
        ))}
      </ol>
      <FlowFooter />
    </main>
  );
}
