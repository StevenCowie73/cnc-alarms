import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { describeMCode, getAllMCodes, getMCode, MCODE_MACHINE_NOTICE, mcodeTitle } from "@/lib/mcodeData";
import { FlowFooter } from "@/app/components/FlowFooter";

// One statically generated page per M-code, including the 40 "Not used"
// placeholders — "is M47 used on this machine?" is a real question, so
// those pages exist and say so plainly. Everything is in the HTML at build
// time — no client fetch — and every page carries the machine-specific
// notice: this list is for the INTEGREX e-670H / SmoothX only.

export const dynamicParams = false;
const SITE = "https://alarms.cowie.ai";

export function generateStaticParams() {
  return getAllMCodes().map((m) => ({ code: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const m = getMCode(code);
  if (!m) return { title: "M-code not found | Cowie.ai" };
  const title = mcodeTitle(m);
  const description = describeMCode(m);
  const url = `${SITE}/mcodes/${m.slug}`;
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Cowie.ai Alarms", type: "article" },
    twitter: { card: "summary", title, description },
  };
}

export default async function MCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const m = getMCode(code);
  if (!m) notFound();

  const faq: { q: string; a: string }[] = [];
  if (m.notUsed) {
    faq.push({ q: `Is ${m.code} used on the Mazak INTEGREX e-670H?`,
      a: `No. ${m.code} is listed as "Not used" in the MAZATROL SmoothX M-code list for the INTEGREX e-670H / e-670H-S — it has no function assigned on this machine. Other Mazak models or PLC configurations may assign it differently.` });
  } else {
    faq.push({ q: `What does Mazak M-code ${m.code} do?`,
      a: `${m.code} — ${m.description} on the MAZATROL SmoothX control (INTEGREX e-670H). ${m.detail ?? ""}`.replace(/\s+/g, " ").trim() });
    if (m.spindle2Only) faq.push({ q: `Does ${m.code} apply to both turning spindles?`,
      a: `No — ${m.code} is only for turning spindle No. 2 (the second turning spindle on the twin-spindle INTEGREX e-670H-S).` });
    if (m.optional) faq.push({ q: `Is ${m.code} available on every INTEGREX e-670H?`,
      a: `${m.code} is an option — it is not fitted on every machine. Check your machine's specification before using it.` });
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "TechArticle", headline: `Mazak M-Code ${m.code} – ${m.description.replace(/\.$/, "")}`, description: describeMCode(m),
        url: `${SITE}/mcodes/${m.slug}`, inLanguage: "en",
        about: { "@type": "Thing", name: `Mazak SmoothX M-code ${m.code}` },
        author: { "@type": "Organization", name: "Cowie.ai", url: "https://cowie.ai" },
        publisher: { "@type": "Organization", name: "Cowie.ai", url: "https://cowie.ai" } },
      { "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      { "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Mazak M-codes", item: `${SITE}/mcodes` },
          { "@type": "ListItem", position: 2, name: `M-code ${m.code}`, item: `${SITE}/mcodes/${m.slug}` } ] },
    ],
  };

  return (
    <main className="flow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="detail">
        <div className="detail__topbar">
          <Link href="/mcodes" className="detail__back" aria-label="All M-codes">‹</Link>
          <span className="brandmark detail__brand">ALARMS</span>
          <a href="https://mazatrol.cowie.ai" className="flow-header__link flow-headlink">Mazatrol Assistant</a>
        </div>

        <div className="detail__head">
          <span className="sev sev--mcode"><span className="sev__label">M-CODE</span></span>
          <span className="flow-label">
            M function · MAZATROL SmoothX
            {m.spindle2Only ? " · spindle No. 2 only" : ""}
            {m.optional ? " · option" : ""}
          </span>
        </div>
        <div className="detail__code">{m.code}</div>
        <h1 className="detail__title">{m.notUsed ? "Not used on this machine" : m.description}</h1>

        <div className="detail__callout detail__callout--machine">
          <span aria-hidden>⚠</span>
          <span><strong>Machine-specific.</strong> {MCODE_MACHINE_NOTICE}</span>
        </div>

        <section className="detail__section">
          <div className="flow-label">What it does</div>
          {m.notUsed ? (
            <p className="detail__prose">
              {m.code} is listed as <strong>&ldquo;Not used&rdquo;</strong> in the SmoothX M-code list for the INTEGREX e-670H / e-670H-S — no function is assigned to it on this machine. If a program calls {m.code}, it does nothing here; on other Mazak models or with a different PLC configuration it may be assigned, so don&rsquo;t reuse it blindly.
            </p>
          ) : (
            <>
              <p className="detail__prose">{m.detail || m.description}</p>
              {m.spindle2Only && (
                <p className="detail__prose">
                  <strong>Twin-spindle note (*1):</strong> {m.code} applies only to turning spindle No. 2 — the second turning spindle on the e-670H-S.
                </p>
              )}
              {m.optional && (
                <p className="detail__prose">
                  <strong>Option:</strong> this function is not fitted on every machine — check your machine&rsquo;s specification.
                </p>
              )}
            </>
          )}
        </section>

        <section className="detail__section">
          <div className="flow-label">Source</div>
          <p className="detail__prose muted">
            Mazak PARAMETER LIST / ALARM LIST / M-CODE LIST, manual HA64HA0035E, p. {m.source_page}. Reference and explanation only — not a reproduction of the manual.
          </p>
        </section>

        <a href={`https://mazatrol.cowie.ai?mcode=${encodeURIComponent(m.code)}`} className="btn-ghost detail__mazatrol">
          Not sure how to use it? Ask the Mazatrol assistant →
        </a>
      </div>
      <FlowFooter />
    </main>
  );
}
