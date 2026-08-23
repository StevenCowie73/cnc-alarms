import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { describeParameter, getAllParameterPages, getParameterPage, isBitDiagram, MACHINE_NOTICE, parameterTitle, type ParameterRow } from "@/lib/parameterData";
import { FlowFooter } from "@/app/components/FlowFooter";

// One statically generated page per parameter address (bit parameters are
// folded into their parent address). Everything is in the HTML at build
// time — no client fetch — and every page carries the machine-specific
// notice: this list is for the INTEGREX e-670H / SmoothX only.

export const dynamicParams = false;
const SITE = "https://alarms.cowie.ai";

export function generateStaticParams() {
  return getAllParameterPages().map((p) => ({ address: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ address: string }> }): Promise<Metadata> {
  const { address } = await params;
  const p = getParameterPage(address);
  if (!p) return { title: "Parameter not found | Cowie.ai" };
  const title = parameterTitle(p);
  const description = describeParameter(p);
  const url = `${SITE}/parameters/${p.slug}`;
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Cowie.ai Alarms", type: "article" },
    twitter: { card: "summary", title, description },
  };
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="detail__codebook-row">
      <span className="detail__codebook-label">{label}</span>
      <span className="detail__codebook-value">{value || <span className="muted">—</span>}</span>
    </div>
  );
}

function Settings({ r }: { r: ParameterRow }) {
  return (
    <div className="detail__codebook">
      <Field label="Setting range" value={r.data_range} />
      <Field label="Unit" value={r.unit} />
      <Field label="Program type" value={r.program_type} />
      <Field label="Takes effect" value={r.conditions} />
    </div>
  );
}

export default async function ParameterPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const p = getParameterPage(address);
  if (!p) notFound();

  const baseMeaning = p.base && !isBitDiagram(p.base.meaning) ? p.base.meaning : null;
  const what = baseMeaning || (p.isBitParent ? `${p.bits.length} bit settings` : p.base?.name || p.name);
  const desc = p.base && !isBitDiagram(p.base.description) ? p.base.description : null;
  const faq: { q: string; a: string }[] = [
    { q: `What does Mazak parameter ${p.address} do?`,
      a: `${p.address} is a ${p.category} parameter in the ${p.group} group of the MAZATROL SmoothX control (INTEGREX e-670H). ${what}. ${desc ?? ""}`.replace(/\s+/g, " ").trim() },
  ];
  if (p.base?.data_range) faq.push({ q: `What is the setting range of Mazak parameter ${p.address}?`,
    a: `${p.base.data_range}${p.base.unit ? ` (unit: ${p.base.unit})` : ""}${p.base.conditions ? `. A changed value takes effect: ${p.base.conditions}.` : "."}` });
  if (p.isBitParent) faq.push({ q: `Which bits does Mazak parameter ${p.address} have?`,
    a: p.bits.map((b) => `Bit ${b.bit}: ${b.name || b.meaning || "—"}`).join(" ") });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "TechArticle", headline: `Mazak Parameter ${p.address} – ${p.name}`, description: describeParameter(p),
        url: `${SITE}/parameters/${p.slug}`, inLanguage: "en",
        about: { "@type": "Thing", name: `Mazak SmoothX parameter ${p.address}` },
        author: { "@type": "Organization", name: "Cowie.ai", url: "https://cowie.ai" },
        publisher: { "@type": "Organization", name: "Cowie.ai", url: "https://cowie.ai" } },
      { "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      { "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Mazak parameters", item: `${SITE}/parameters` },
          { "@type": "ListItem", position: 2, name: `Parameter ${p.address}`, item: `${SITE}/parameters/${p.slug}` } ] },
    ],
  };

  return (
    <main className="flow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="detail">
        <div className="detail__topbar">
          <Link href="/parameters" className="detail__back" aria-label="All parameters">‹</Link>
          <span className="brandmark detail__brand">ALARMS</span>
          <a href="https://mazatrol.cowie.ai" className="flow-header__link flow-headlink">Mazatrol Assistant</a>
        </div>

        <div className="detail__head">
          <span className="sev sev--param"><span className="sev__label">PARAM</span></span>
          <span className="flow-label">{p.category} parameter · {p.group}{p.group_code ? ` (${p.group_code})` : ""}</span>
        </div>
        <div className="detail__code">{p.address}</div>
        <h1 className="detail__title">{p.name}</h1>

        <div className="detail__callout detail__callout--machine">
          <span aria-hidden>⚠</span>
          <span><strong>Machine-specific.</strong> {MACHINE_NOTICE}</span>
        </div>

        {p.base && (baseMeaning || desc || !p.isBitParent) && (
          <>
            <section className="detail__section">
              <div className="flow-label">What it does</div>
              <p className="detail__prose">{baseMeaning || (!p.isBitParent ? p.base.name : `Set bit by bit — see the ${p.bits.length} bit settings below.`)}</p>
              {desc && <p className="detail__prose">{desc}</p>}
            </section>
            <section className="detail__section">
              <div className="flow-label">Setting</div>
              <Settings r={p.base} />
            </section>
          </>
        )}

        {p.isBitParent && (
          <section className="detail__section">
            <div className="flow-label">Bit settings — {p.address} is set bit by bit</div>
            <ol className="bit-table">
              {p.bits.map((b) => (
                <li key={b.bit!} id={`bit-${b.bit}`} className="bit-row">
                  <span className="bit-row__bit">bit {b.bit}</span>
                  <div className="bit-row__body">
                    <p className="detail__prose">{b.name || b.meaning || <span className="muted">—</span>}</p>
                    {b.description && b.description !== b.name && <p className="detail__prose bit-row__desc">{b.description}</p>}
                    {(b.data_range || b.conditions) && (
                      <p className="bit-row__meta">
                        {b.data_range ? `Range ${b.data_range}` : ""}{b.data_range && b.conditions ? " · " : ""}{b.conditions ? `Takes effect: ${b.conditions}` : ""}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="detail__section">
          <div className="flow-label">Source</div>
          <p className="detail__prose muted">
            Mazak PARAMETER LIST / ALARM LIST / M-CODE LIST, manual HA64HA0035E, p. {p.source_pages.join(", ")}. Reference and explanation only — not a reproduction of the manual.
          </p>
        </section>

        <a href={`https://mazatrol.cowie.ai?param=${encodeURIComponent(p.address)}`} className="btn-ghost detail__mazatrol">
          Not sure what to set? Ask the Mazatrol assistant →
        </a>
      </div>
      <FlowFooter />
    </main>
  );
}
