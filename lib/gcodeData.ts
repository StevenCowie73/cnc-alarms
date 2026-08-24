import raw from "../data/mazak-gcodes.json";

// Mazak EIA/ISO G-code dataset (INTEGREX e-670H / e-670H-S, MAZATROL
// SmoothX, manual H747PB0030E), extracted by scripts/mazak-extraction/
// extract_gcodes.py. There is no G-code chapter in the manual: the base
// table is 3-7 "List of G-Codes" and per-code documentation was collected
// from the section named in each entry. Server-side only — the browser
// gets the slim search index, never this file.

export interface GCodeRow {
  code: string;
  name: string;
  group: string | null;
  modal: boolean | null;
  default_on_reset: boolean;
  param_selectable_initial: boolean;
  listed_with: string[];
  section: string | null;
  description: string;
  format: string;
  parameters: string[];
  notes: string[];
  source_pages: string[];
}

export const GCODE_MACHINE_NOTICE =
  "This G-code reference is specific to the Mazak INTEGREX e-670H / e-670H-S with the MAZATROL SmoothX control (EIA/ISO programming manual H747PB0030E). G-code availability depends on fitted options, and groups and behaviour differ between Mazak models and control generations — verify against the manual for your own machine before programming with any code.";

let rows: GCodeRow[] | null = null;
let byCode: Map<string, GCodeRow> | null = null;

export function getAllGCodes(): GCodeRow[] {
  if (rows) return rows;
  rows = (raw as { gcodes: GCodeRow[] }).gcodes;
  return rows;
}

export function getGCode(code: string): GCodeRow | undefined {
  if (!byCode) {
    byCode = new Map();
    for (const g of getAllGCodes()) byCode.set(g.code, g);
  }
  return byCode.get(code);
}

// ~150-char meta description.
export function describeGCode(g: GCodeRow): string {
  const modal =
    g.modal === null ? "" : g.modal ? ` Modal, group ${g.group}.` : " One-shot (valid only in its own block).";
  const s = `Mazak G-code ${g.code} — ${g.name} on the MAZATROL SmoothX control (INTEGREX e-670H).${modal} ${g.description || "Function, format and precautions from the EIA/ISO manual."}`
    .replace(/\s+/g, " ")
    .trim();
  if (s.length <= 158) return s;
  const cut = s.slice(0, 155);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), 120)).trimEnd() + "…";
}

export function gcodeTitle(g: GCodeRow): string {
  return `Mazak G-Code ${g.code} – ${g.name} | Cowie.ai`;
}
