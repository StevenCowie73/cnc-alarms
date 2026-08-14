import type { Metadata } from "next";
import Link from "next/link";

// Index for shop-floor calculators. Each tool is pure client-side math —
// print numbers in, control-ready numbers out. Add new tools to the
// TOOLS list as they ship (chord/bolt-pattern and wear-comp are next
// per the roadmap).

export const metadata: Metadata = {
  title: "Shop Tools — CNC calculators | cowie.ai",
  description:
    "Free shop-floor calculators for CNC machinists: slot ramp tangent start position, pass tables, and Mazatrol sub programs. Pure client-side — fast on shop wifi, installable to your phone.",
  openGraph: {
    title: "Shop Tools — cowie.ai",
    description:
      "Shop-floor calculators for CNC machinists. Print numbers in, control-ready numbers out.",
    url: "https://alarms.cowie.ai/tools",
    siteName: "cowie.ai",
    type: "website",
  },
};

const TOOLS = [
  {
    href: "/tools/slot-ramp",
    name: "Slot Ramp Calculator",
    formula: "run = √(D(2R−D))",
    blurb:
      "Where the slot floor ends and the tangent ramp begins. Start position, full depth-ladder pass table, and a ready-to-key Mazatrol sub program from three print numbers. Field-validated against Machinist's Friend and a proven running sub.",
  },
];

export default function ToolsIndex() {
  return (
    <main className="flow">
      <header className="flow-header">
        <span className="brandmark">
          <span className="flow-header__names">
            TOOLS
            <span className="flow-header__tag">shop-floor calculators</span>
          </span>
        </span>
        <nav className="flow-header__nav">
          <Link href="/" className="flow-header__link">
            Alarms
          </Link>
          <span className="flow-header__chip">CNC</span>
        </nav>
      </header>

      <h1 className="flow-hero">
        Print numbers in,
        <br />
        control-ready numbers out.
      </h1>

      <div className="flow-label" style={{ marginTop: 8 }}>
        Calculators
      </div>
      <div className="card-list">
        {TOOLS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            style={{ textDecoration: "none", display: "block" }}
          >
            <div
              style={{
                background: "var(--paper-2)",
                border: "1px solid var(--ink-08)",
                borderRadius: "var(--r-card, 12px)",
                padding: "16px 18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 17,
                    fontWeight: 700,
                    color: "var(--ink)",
                  }}
                >
                  {t.name}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--accent)",
                  }}
                >
                  {t.formula}
                </span>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  color: "var(--ink-50)",
                  margin: "8px 0 0",
                }}
              >
                {t.blurb}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <p className="flow-empty" style={{ marginTop: 24 }}>
        — more tools coming: chord &amp; bolt-pattern, wear comp helper —
      </p>
    </main>
  );
}
