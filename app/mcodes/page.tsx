import type { Metadata } from "next";
import Link from "next/link";
import { getAllMCodes, MCODE_MACHINE_NOTICE } from "@/lib/mcodeData";
import { FlowFooter } from "@/app/components/FlowFooter";
import { IndexSearch } from "@/app/alarms/IndexSearch";

// Browsable, server-rendered index of every M-code, grouped by hundred the
// way the manual lays them out (M00–M99 basic functions, M2xx/M3xx spindle
// and axis control, …). Plain <a> rows, same reasoning as the alarm index.

const SITE = "https://alarms.cowie.ai";

export const metadata: Metadata = {
  title: "Mazak SmoothX M-Code List — INTEGREX e-670H | Cowie.ai",
  description:
    "Every MAZATROL SmoothX M-code for the Mazak INTEGREX e-670H: what each code does, twin-spindle footnotes, option codes, and which codes are not used. Machine-specific reference.",
  alternates: { canonical: `${SITE}/mcodes` },
  openGraph: { title: "Mazak SmoothX M-Code List | Cowie.ai", description: "Complete M-code list for the INTEGREX e-670H with function details, twin-spindle footnotes and not-used codes.", url: `${SITE}/mcodes`, siteName: "Cowie.ai Alarms", type: "website" },
};

function rangeLabel(code: string): string {
  const n = Number(code.slice(1));
  if (n < 100) return "M00–M99";
  const lo = Math.floor(n / 100) * 100;
  return `M${lo}–M${lo + 99}`;
}

export default function MCodeIndexPage() {
  const mcodes = getAllMCodes();
  const byRange = new Map<string, typeof mcodes>();
  for (const m of mcodes) {
    const r = rangeLabel(m.code);
    if (!byRange.has(r)) byRange.set(r, []);
    byRange.get(r)!.push(m);
  }
  const jsonLd = {
    "@context": "https://schema.org", "@type": "CollectionPage", name: "Mazak SmoothX M-Code List", url: `${SITE}/mcodes`,
    description: "Complete MAZATROL SmoothX M-code list for the Mazak INTEGREX e-670H.",
    mainEntity: { "@type": "ItemList", numberOfItems: mcodes.length },
  };

  return (
    <main className="flow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="flow-header">
        <span className="brandmark">
          <span className="flow-header__names">
            ALARMS
            <span className="flow-header__tag">M-code list</span>
          </span>
        </span>
        <nav className="flow-header__nav">
          <Link href="/" className="flow-header__link">Search</Link>
          <Link href="/alarms" className="flow-header__link">Alarms</Link>
          <Link href="/parameters" className="flow-header__link">Parameters</Link>
          <span className="flow-header__chip">MAZAK</span>
        </nav>
      </header>

      <h1 className="flow-hero">
        Every SmoothX
        <br />
        M-code.
      </h1>
      <p className="index-intro">
        {mcodes.length} M-codes from the Mazak manual, including the ones listed as not used — so &ldquo;is {"M47"} assigned on this machine?&rdquo; has an answer. Codes marked *1 apply only to turning spindle No. 2 on the twin-spindle e-670H-S.
      </p>
      <div className="detail__callout detail__callout--machine">
        <span aria-hidden>⚠</span>
        <span><strong>Machine-specific.</strong> {MCODE_MACHINE_NOTICE}</span>
      </div>

      <IndexSearch total={mcodes.length} noun="M-codes" />

      {Array.from(byRange.entries()).map(([range, list]) => (
        <div key={range} className="param-group">
          <h3 className="param-group__title">
            {range} <span className="muted">· {list.length}</span>
          </h3>
          <ol className="index-list" aria-label={`${range} M-codes`}>
            {list.map((m) => (
              <li key={m.slug} data-alarm-row data-q={`${m.code} ${m.description}`.toLowerCase()}>
                <a href={`/mcodes/${m.slug}`} className="index-row">
                  <span className="index-row__code">{m.code}</span>
                  <span className={m.notUsed ? "index-row__msg muted" : "index-row__msg"}>
                    {m.notUsed ? "Not used on this machine" : m.description}
                    {m.spindle2Only ? " *1" : ""}
                  </span>
                  {m.optional && !m.notUsed && <span className="sev sev--mcode sev--compact"><span className="sev__label">OPTION</span></span>}
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
