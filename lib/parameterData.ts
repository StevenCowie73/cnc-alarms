import raw from "../data/mazak-parameters.json";

// Mazak parameter dataset (INTEGREX e-670H / e-670H-S, MAZATROL SmoothX,
// manual HA64HA0035E), extracted by scripts/mazak-extraction. Server-side
// only — the browser gets the slim search index, never this file.

export interface ParameterRow {
  address: string;
  bit: number | null;
  group: string | null;
  group_code: string | null;
  category: "User" | "Machine" | "Data I/O" | null;
  name: string | null;
  meaning: string | null;
  description: string | null;
  program_type: string | null;
  conditions: string | null;
  data_range: string | null;
  unit: string | null;
  default_value: null;
  source_pages: number[];
}

// One page per address. Bit-type parameters (e.g. D91 bit 0–7) are folded
// into their parent page as a table: the parent row (bit === null) when the
// manual lists one, otherwise a synthesised header.
export interface ParameterPage {
  slug: string;
  address: string;
  name: string;
  group: string;
  group_code: string;
  category: string;
  base: ParameterRow | null;
  bits: ParameterRow[];
  isBitParent: boolean;
  source_pages: number[];
}

export const MACHINE_NOTICE =
  "This parameter list is specific to the Mazak INTEGREX e-670H / e-670H-S with the MAZATROL SmoothX control (manual HA64HA0035E). Other Mazak models and control generations use different addresses, ranges and meanings — verify on your own control before changing anything.";

export function slugify(address: string): string {
  return address.replace(/[^A-Za-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}

let pages: ParameterPage[] | null = null;
let bySlug: Map<string, ParameterPage> | null = null;

export function getAllParameterPages(): ParameterPage[] {
  if (pages) return pages;
  const rows = (raw as { parameters: ParameterRow[] }).parameters;
  const byAddr = new Map<string, ParameterRow[]>();
  for (const r of rows) {
    if (!byAddr.has(r.address)) byAddr.set(r.address, []);
    byAddr.get(r.address)!.push(r);
  }
  const out: ParameterPage[] = [];
  const seen = new Set<string>();
  for (const [address, list] of byAddr) {
    const base = list.find((r) => r.bit === null) ?? null;
    const bits = list.filter((r) => r.bit !== null).sort((a, b) => a.bit! - b.bit!);
    const first = base ?? list[0];
    let slug = slugify(address);
    if (seen.has(slug)) slug = `${slug}-${out.length}`;
    seen.add(slug);
    const name =
      (base?.name && !/^.* — bit parameter/.test(base.name) ? base.name : null) ??
      (bits.length ? `${first.group ?? "Bit"} bit settings (${bits.length} bit${bits.length > 1 ? "s" : ""})` : first.name ?? address);
    out.push({
      slug,
      address,
      name,
      group: first.group ?? "",
      group_code: first.group_code ?? "",
      category: first.category ?? "",
      base,
      bits,
      isBitParent: bits.length > 0,
      source_pages: Array.from(new Set(list.flatMap((r) => r.source_pages))).sort((a, b) => a - b),
    });
  }
  pages = out;
  return out;
}

export function getParameterPage(slug: string): ParameterPage | undefined {
  if (!bySlug) {
    bySlug = new Map();
    for (const p of getAllParameterPages()) bySlug.set(p.slug, p);
  }
  return bySlug.get(slug);
}

// ~150-char meta description.
// A bit parent's base "meaning" in the manual is a bit diagram ("76 543 210 …"),
// not prose — describe those by their bits instead.
export function isBitDiagram(text: string | null | undefined): boolean {
  return Boolean(text && /^\d[\d ]{3,}/.test(text.trim()));
}

export function describeParameter(p: ParameterPage): string {
  let what: string;
  if (p.isBitParent) {
    const named = p.bits.filter((b) => b.name && b.name !== "—").slice(0, 3);
    what = `${p.bits.length} bit settings — ` + named.map((b) => `bit ${b.bit}: ${b.name}`).join("; ");
  } else {
    what = p.base?.meaning || p.base?.description || p.base?.name || "";
  }
  const s = `Mazak parameter ${p.address} (${p.group}, ${p.category} parameter): ${what}. Setting range, unit and when it takes effect, from the SmoothX manual.`
    .replace(/\s+/g, " ")
    .trim();
  if (s.length <= 158) return s;
  const cut = s.slice(0, 155);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), 120)).trimEnd() + "…";
}

export function parameterTitle(p: ParameterPage): string {
  return `Mazak Parameter ${p.address} – ${p.name} | Cowie.ai`;
}
