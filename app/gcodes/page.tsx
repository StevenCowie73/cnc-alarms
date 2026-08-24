import type { Metadata } from "next";
import Link from "next/link";
import { getAllGCodes, GCODE_MACHINE_NOTICE } from "@/lib/gcodeData";
import { FlowFooter } from "@/app/components/FlowFooter";
import { IndexSearch } from "@/app/alarms/IndexSearch";

// Browsable, server-rendered index of every EIA/ISO G-code, grouped by
// numeric range. Plain <a> rows, same reasoning as the other indexes.

const SITE = "https://alarms.cowie.ai";

export const metadata: Metadata = {
  title: "Mazak SmoothX G-Code List — INTEGREX e-670H | Cowie.ai",
  description:
    "Every MAZATROL SmoothX EIA/ISO G-code for the Mazak INTEGREX e-670H: function, modal group, programming format, address words and documented precautions. Machine-specific reference.",
  alternates: { canonical: `${SITE}/gcodes` },
  openGraph: { title: "Mazak SmoothX G-Code List | Cowie.ai", description: "Complete EIA/ISO G-code list for the INTEGREX e-670H with format, modal groups and precautions.", url: `${SITE}/gcodes`, siteName: "Cowie.ai Alarms", type: "website" },
};

function rangeLabel(code: string): string {
  const n = Number(/G(\d+)/.exec(code)![1]);
  if (n < 100) {
    const lo = Math.floor(n / 10) * 10;
    return `G${String(lo).padStart(2, "0")}–G${String(lo + 9).padStart(2, "0")}`;
  }
  const lo = Math.floor(n / 100) * 100;
  return `G${lo}–G${lo + 99}`;
}

export default function GCodeIndexPage() {
  const gcodes = getAllGCodes();
  const byRange = new Map<string, typeof gcodes>();
  for (const g of gcodes) {
    const r = rangeLabel(g.code);
    if (!byRange.has(r)) byRange.set(r, []);
    byRange.get(r)!.push(g);
  }
  const jsonLd = {
    "@context": "https://schema.org", "@type": "CollectionPage", name: "Mazak SmoothX G-Code List", url: `${SITE}/gcodes`,
    description: "Complete MAZATROL SmoothX EIA/ISO G-code list for the Mazak INTEGREX e-670H.",
    mainEntity: { "@type": "ItemList", numberOfItems: gcodes.length },
  };

  return (
    <main className="flow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="flow-header">
        <span className="brandmark">
          <span className="flow-header__names">
            ALARMS
            <span className="flow-header__tag">G-code list</span>
          </span>
        </span>
        <nav className="flow-header__nav">
          <Link href="/" className="flow-header__link">Search</Link>
          <Link href="/alarms" className="flow-header__link">Alarms</Link>
          <Link href="/parameters" className="flow-header__link">Parameters</Link>
          <Link href="/mcodes" className="flow-header__link">M-codes</Link>
          <span className="flow-header__chip">MAZAK</span>
        </nav>
      </header>

      <h1 className="flow-hero">
        Every SmoothX
        <br />
        G-code.
      </h1>
      <p className="index-intro">
        {gcodes.length} EIA/ISO G-codes from the Mazak manual — function, modal group, programming format and documented precautions. There is no G-code chapter in the manual; this list was assembled from the base table and the section documenting each code.
      </p>
      <div className="detail__callout detail__callout--machine">
        <span aria-hidden>⚠</span>
        <span><strong>Machine-specific.</strong> {GCODE_MACHINE_NOTICE}</span>
      </div>

      <IndexSearch total={gcodes.length} noun="G-codes" />

      {Array.from(byRange.entries()).map(([range, list]) => (
        <div key={range} className="param-group">
          <h3 className="param-group__title">
            {range} <span className="muted">· {list.length}</span>
          </h3>
          <ol className="index-list" aria-label={`${range} G-codes`}>
            {list.map((g) => (
              <li key={g.code} data-alarm-row data-q={`${g.code} ${g.name}`.toLowerCase()}>
                <a href={`/gcodes/${encodeURIComponent(g.code)}`} className="index-row">
                  <span className="index-row__code">{g.code}</span>
                  <span className="index-row__msg">{g.name}</span>
                  {g.modal === false && <span className="sev sev--mcode sev--compact"><span className="sev__label">ONE-SHOT</span></span>}
                </a>
              </li>
            ))}
          </ol>
        </div>
      ))}
      <FlowFooter />
    </main>
  );
}
