import type { Metadata } from "next";
import Link from "next/link";
import { getAllParameterPages, MACHINE_NOTICE } from "@/lib/parameterData";
import { FlowFooter } from "@/app/components/FlowFooter";
import { IndexSearch } from "@/app/alarms/IndexSearch";

// Browsable, server-rendered index of every parameter address, grouped the
// way the control groups them (User / Machine / Data I/O → display title).
// Plain <a> rows, same reasoning as the alarm index: 1,400 next/link
// instances would prefetch on scroll.

const SITE = "https://alarms.cowie.ai";

export const metadata: Metadata = {
  title: "Mazak SmoothX Parameter List — INTEGREX e-670H | Cowie.ai",
  description:
    "Every MAZATROL SmoothX parameter for the Mazak INTEGREX e-670H: user, machine and data I/O parameters with meaning, setting range, unit and when a change takes effect. Machine-specific reference.",
  alternates: { canonical: `${SITE}/parameters` },
  openGraph: { title: "Mazak SmoothX Parameter List | Cowie.ai", description: "User, machine and data I/O parameters for the INTEGREX e-670H with meaning, range and unit.", url: `${SITE}/parameters`, siteName: "Cowie.ai Alarms", type: "website" },
};

export default function ParameterIndexPage() {
  const pages = getAllParameterPages();
  const byCat = new Map<string, Map<string, typeof pages>>();
  for (const p of pages) {
    if (!byCat.has(p.category)) byCat.set(p.category, new Map());
    const g = byCat.get(p.category)!;
    if (!g.has(p.group)) g.set(p.group, []);
    g.get(p.group)!.push(p);
  }
  const jsonLd = {
    "@context": "https://schema.org", "@type": "CollectionPage", name: "Mazak SmoothX Parameter List", url: `${SITE}/parameters`,
    description: "Complete MAZATROL SmoothX parameter list for the Mazak INTEGREX e-670H.",
    mainEntity: { "@type": "ItemList", numberOfItems: pages.length },
  };

  return (
    <main className="flow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="flow-header">
        <span className="brandmark">
          <span className="flow-header__names">
            ALARMS
            <span className="flow-header__tag">parameter list</span>
          </span>
        </span>
        <nav className="flow-header__nav">
          <Link href="/" className="flow-header__link">Search</Link>
          <Link href="/alarms" className="flow-header__link">Alarms</Link>
          <Link href="/mcodes" className="flow-header__link">M-codes</Link>
          <Link href="/gcodes" className="flow-header__link">G-codes</Link>
          <span className="flow-header__chip">MAZAK</span>
        </nav>
      </header>

      <h1 className="flow-hero">
        Every SmoothX
        <br />
        parameter.
      </h1>
      <p className="index-intro">
        {pages.length.toLocaleString()} parameter addresses from the Mazak manual, in the control&rsquo;s own groups. Tap an address for its meaning, setting range, unit and when a change takes effect.
      </p>
      <div className="detail__callout detail__callout--machine">
        <span aria-hidden>⚠</span>
        <span><strong>Machine-specific.</strong> {MACHINE_NOTICE}</span>
      </div>

      <IndexSearch total={pages.length} noun="parameters" />

      {["User", "Machine", "Data I/O"].filter((c) => byCat.has(c)).map((cat) => (
        <section key={cat} className="param-cat">
          <h2 className="flow-label param-cat__title">{cat} parameters</h2>
          {Array.from(byCat.get(cat)!.entries()).map(([group, list]) => (
            <div key={group} className="param-group">
              <h3 className="param-group__title">
                {group}{list[0].group_code ? <span className="muted"> ({list[0].group_code})</span> : null} <span className="muted">· {list.length}</span>
              </h3>
              <ol className="index-list" aria-label={`${group} parameters`}>
                {list.map((p) => (
                  <li key={p.slug} data-alarm-row data-q={`${p.address} ${p.name}`.toLowerCase()}>
                    <a href={`/parameters/${p.slug}`} className="index-row">
                      <span className="index-row__code">{p.address}</span>
                      <span className="index-row__msg">{p.name}</span>
                      {p.isBitParent && <span className="sev sev--param sev--compact"><span className="sev__label">{p.bits.length} BITS</span></span>}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </section>
      ))}
      <FlowFooter />
    </main>
  );
}
