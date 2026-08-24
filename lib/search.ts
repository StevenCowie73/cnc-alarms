import type { SearchIndex } from "./searchIndex";

export type ResultType = "alarm" | "param" | "mcode" | "gcode";
export type Severity = "critical" | "warning" | "notice";

export interface SearchResult {
  type: ResultType;
  key: string;
  href: string;
  code: string;          // "221", "F91" / "D91 bit 3", "M30", "G43.4"
  name: string;
  severity?: Severity;   // alarms
  group?: string;        // parameters
  category?: string;     // parameters
  notUsed?: boolean;     // M-codes: "Not used" placeholder
}

interface Entry extends SearchResult {
  codeL: string;
  nameL: string;
  digits: string;        // numeric part of the code for "217"-style matching
}

const SEV = { c: "critical", w: "warning", n: "notice" } as const;

export function expandIndex(ix: SearchIndex): Entry[] {
  const out: Entry[] = [];
  for (const [code, name, s] of ix.a) {
    const c = String(code);
    out.push({ type: "alarm", key: `a${c}`, href: `/alarms/${c}`, code: c, name, severity: SEV[s],
               codeL: c, nameL: name.toLowerCase(), digits: c });
  }
  for (const [slug, address, bit, name, g, cat] of ix.p) {
    const code = bit === null ? address : `${address} bit ${bit}`;
    out.push({ type: "param", key: `p${slug}${bit === null ? "" : "b" + bit}`,
               href: bit === null ? `/parameters/${slug}` : `/parameters/${slug}#bit-${bit}`,
               code, name, group: ix.groups[g], category: ix.categories[cat],
               codeL: code.toLowerCase(), nameL: name.toLowerCase(), digits: address.replace(/\D/g, "") });
  }
  for (const [code, name, u] of ix.m ?? []) {
    out.push({ type: "mcode", key: `m${code}`, href: `/mcodes/${code}`, code, name, notUsed: u === 1,
               codeL: code.toLowerCase(), nameL: name.toLowerCase(),
               digits: String(Number(code.slice(1))) });
  }
  for (const [code, name] of ix.g ?? []) {
    // digits keeps the whole numeric part ("43.4" -> "434" would mislead;
    // use the integer part so "43" finds G43/G43.x via contains)
    out.push({ type: "gcode", key: `g${code}`, href: `/gcodes/${encodeURIComponent(code)}`, code, name,
               codeL: code.toLowerCase(), nameL: name.toLowerCase(),
               digits: String(Number(/G(\d+)/.exec(code)![1])) });
  }
  return out;
}

// Rank: exact code (alarms first, then parameters, M-codes, G-codes) >
// code prefix > code contains / numeric part match > name word-start >
// name contains. Ties keep index order, which is ascending code within
// each dataset.
// Returns every match, ranked; the caller caps what it renders (after any
// type filter, so a filter can reach matches beyond the display cap).
export function search(entries: Entry[], query: string): { results: SearchResult[]; total: number } {
  const q = query.trim().toLowerCase();
  if (!q) return { results: [], total: 0 };
  const isNum = /^\d+$/.test(q);
  const scored: [number, number, Entry][] = [];
  entries.forEach((e, i) => {
    let score = -1;
    if (e.codeL === q) score = 0;
    else if (e.codeL.startsWith(q)) score = 1;
    else if (isNum && e.digits === q) score = 1;
    else if (e.codeL.includes(q) || (isNum && e.digits.includes(q))) score = 2;
    else if (e.nameL.startsWith(q) || e.nameL.includes(" " + q)) score = 3;
    else if (e.nameL.includes(q)) score = 4;
    if (score >= 0)
      scored.push([
        score * 4 + (e.type === "alarm" ? 0 : e.type === "param" ? 1 : e.type === "mcode" ? 2 : 3),
        i, e,
      ]);
  });
  scored.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  return { results: scored.map((s) => s[2]), total: scored.length };
}
