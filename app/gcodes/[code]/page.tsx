import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { describeGCode, getAllGCodes, getGCode, GCODE_MACHINE_NOTICE, gcodeTitle } from "@/lib/gcodeData";
import { FlowFooter } from "@/app/components/FlowFooter";

// One statically generated page per EIA/ISO G-code. Everything is in the
// HTML at build time — no client fetch — and every page carries the
// machine-specific notice: this list is for the INTEGREX e-670H / SmoothX
// only, and G-code availability depends on fitted options.

export const dynamicParams = false;
const SITE = "https://alarms.cowie.ai";

export function generateStaticParams() {
  return getAllGCodes().map((g) => ({ code: g.code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const g = getGCode(decodeURIComponent(code));
  if (!g) return { title: "G-code not found | Cowie.ai" };
  const title = gcodeTitle(g);
  const description = describeGCode(g);
  const url = `${SITE}/gcodes/${encodeURIComponent(g.code)}`;
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Cowie.ai Alarms", type: "article" },
    twitter: { card: "summary", title, description },
  };
}

export default async function GCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const g = getGCode(decodeURIComponent(code));
  if (!g) notFound();

  const modalLine =
    g.modal === null
      ? "The list prints no group for this code."
      : g.modal
        ? `${g.code} is modal (group ${g.group}) — it stays in effect until another code of the same group replaces it.`
        : `${g.code} is one-shot (group 00) — it is valid only in the block where it is entered.`;

  const faq: { q: string; a: string }[] = [
    { q: `What does Mazak G-code ${g.code} do?`,
      a: `${g.code} — ${g.name} on the MAZATROL SmoothX control (INTEGREX e-670H). ${g.description}`.replace(/\s+/g, " ").trim().slice(0, 900) },
    { q: `Is ${g.code} modal?`, a: modalLine },
  ];
  if (g.format) faq.push({ q: `What is the programming format of ${g.code}?`, a: g.format.replace(/\s+/g, " ").slice(0, 500) });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "TechArticle", headline: `Mazak G-Code ${g.code} – ${g.name}`, description: describeGCode(g),
        url: `${SITE}/gcodes/${encodeURIComponent(g.code)}`, inLanguage: "en",
        about: { "@type": "Thing", name: `Mazak SmoothX G-code ${g.code}` },
        author: { "@type": "Organization", name: "Cowie.ai", url: "https://cowie.ai" },
        publisher: { "@type": "Organization", name: "Cowie.ai", url: "https://cowie.ai" } },
      { "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      { "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Mazak G-codes", item: `${SITE}/gcodes` },
          { "@type": "ListItem", position: 2, name: `G-code ${g.code}`, item: `${SITE}/gcodes/${encodeURIComponent(g.code)}` } ] },
    ],
  };

  return (
    <main className="flow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="detail">
        <div className="detail__topbar">
          <Link href="/gcodes" className="detail__back" aria-label="All G-codes">‹</Link>
          <span className="brandmark detail__brand">ALARMS</span>
          <a href="https://mazatrol.cowie.ai" className="flow-header__link flow-headlink">Mazatrol Assistant</a>
        </div>

        <div className="detail__head">
          <span className="sev sev--mcode"><span className="sev__label">G-CODE</span></span>
          <span className="flow-label">
            EIA/ISO · {g.modal === null ? "no group listed" : g.modal ? `modal · group ${g.group}` : "one-shot"}
            {g.default_on_reset ? " · default on reset" : ""}
          </span>
        </div>
        <div className="detail__code">{g.code}</div>
        <h1 className="detail__title">{g.name}</h1>

        <div className="detail__callout detail__callout--machine">
          <span aria-hidden>⚠</span>
          <span><strong>Machine-specific.</strong> {GCODE_MACHINE_NOTICE}</span>
        </div>

        <section className="detail__section">
          <div className="flow-label">What it does</div>
          <p className="detail__prose" style={{ whiteSpace: "pre-line" }}>{g.description}</p>
          <p className="detail__prose">{modalLine}</p>
          {g.default_on_reset && (
            <p className="detail__prose">
              <strong>Default:</strong> {g.code} is selected automatically in its group on power-on or on reset with modal initialization.
            </p>
          )}
          {g.param_selectable_initial && (
            <p className="detail__prose">
              <strong>Initial state:</strong> a parameter can select {g.code} as the initial modal condition — what your machine wakes up in depends on that setting.
            </p>
          )}
          {g.listed_with.length > 0 && (
            <p className="detail__prose">
              Documented together with{" "}
              {g.listed_with.map((c, i) => (
                <span key={c}>{i > 0 ? ", " : ""}<a href={`/gcodes/${encodeURIComponent(c)}`}>{c}</a></span>
              ))}.
            </p>
          )}
        </section>

        {g.format && (
          <section className="detail__section">
            <div className="flow-label">Programming format</div>
            <pre className="detail__prose" style={{ fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{g.format}</pre>
          </section>
        )}

        {g.parameters.length > 0 && (
          <section className="detail__section">
            <div className="flow-label">Address words</div>
            <ul className="detail__list">
              {g.parameters.map((p, i) => (
                <li key={i} className="detail__prose">{p}</li>
              ))}
            </ul>
          </section>
        )}

        {g.notes.length > 0 && (
          <section className="detail__section">
            <div className="flow-label">Notes &amp; precautions</div>
            <ul className="detail__list">
              {g.notes.map((n, i) => (
                <li key={i} className="detail__prose" style={{ whiteSpace: "pre-line" }}>{n}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="detail__section">
          <div className="flow-label">Source</div>
          <p className="detail__prose muted">
            Mazak PROGRAMMING MANUAL for EIA/ISO PROGRAM, manual H747PB0030E{g.section ? `, section ${g.section}` : ""}, p. {g.source_pages.join(", ")}. Reference and explanation only — not a reproduction of the manual.
          </p>
        </section>

        <a href={`https://mazatrol.cowie.ai?gcode=${encodeURIComponent(g.code)}`} className="btn-ghost detail__mazatrol">
          Not sure how to use it? Ask the Mazatrol assistant →
        </a>
      </div>
      <FlowFooter />
    </main>
  );
}
