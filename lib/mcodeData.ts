import raw from "../data/mazak-mcodes.json";

// Mazak M-code dataset (INTEGREX e-670H / e-670H-S, MAZATROL SmoothX,
// manual HA64HA0035E), extracted by scripts/mazak-extraction. Server-side
// only — the browser gets the slim search index, never this file.

export interface MCodeRow {
  code: string;
  description: string;
  detail: string;
  notes: string[];
  source_page: number;
}

export interface MCodePage extends MCodeRow {
  slug: string;
  // "Not used." rows are kept and flagged rather than dropped — "is M47
  // used on this machine?" is a real question with a real answer.
  notUsed: boolean;
  spindle2Only: boolean; // *1 footnote: only for turning spindle No. 2
  optional: boolean;     // option — not fitted on every machine
}

export const MCODE_MACHINE_NOTICE =
  "This M-code list is specific to the Mazak INTEGREX e-670H / e-670H-S with the MAZATROL SmoothX control (manual HA64HA0035E). M-code assignments differ between Mazak models, control generations and PLC configurations — verify against the manual for your own machine before relying on any code.";

let pages: MCodePage[] | null = null;
let byCode: Map<string, MCodePage> | null = null;

export function getAllMCodes(): MCodePage[] {
  if (pages) return pages;
  const rows = (raw as { mcodes: MCodeRow[] }).mcodes;
  pages = rows.map((r) => ({
    ...r,
    slug: r.code,
    notUsed: /^not used\.?$/i.test(r.description.trim()),
    spindle2Only: r.notes.some((n) => n.startsWith("*1")),
    optional: r.notes.some((n) => n.startsWith("Option")),
  }));
  return pages;
}

export function getMCode(slug: string): MCodePage | undefined {
  if (!byCode) {
    byCode = new Map();
    for (const m of getAllMCodes()) byCode.set(m.slug, m);
  }
  return byCode.get(slug);
}

// ~150-char meta description. A "Not used" page's job is to answer the
// question directly, not to pretend there is a function to describe.
export function describeMCode(m: MCodePage): string {
  let s: string;
  if (m.notUsed) {
    s = `${m.code} is not assigned on the Mazak INTEGREX e-670H (MAZATROL SmoothX) — it is listed as "Not used" in the machine's M-code list.`;
  } else {
    const extras = [
      m.spindle2Only ? "turning spindle No. 2 only" : "",
      m.optional ? "option" : "",
    ].filter(Boolean).join(", ");
    s = `Mazak M-code ${m.code} — ${m.description}${extras ? ` (${extras})` : ""}. ${m.detail || `What ${m.code} does on the INTEGREX e-670H with MAZATROL SmoothX.`}`;
  }
  s = s.replace(/\s+/g, " ").trim();
  if (s.length <= 158) return s;
  const cut = s.slice(0, 155);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), 120)).trimEnd() + "…";
}

export function mcodeTitle(m: MCodePage): string {
  return `Mazak M-Code ${m.code} – ${m.description.replace(/\.$/, "")} | Cowie.ai`;
}
