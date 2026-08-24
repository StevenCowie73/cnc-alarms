import { getAllAlarms } from "@/lib/alarmData";
import { getAllParameterPages } from "@/lib/parameterData";
import { getAllMCodes } from "@/lib/mcodeData";
import { getAllGCodes } from "@/lib/gcodeData";
import type { AlarmTuple, GCodeTuple, MCodeTuple, ParamTuple, SearchIndex } from "@/lib/searchIndex";

// Emitted as a static file at build time (like the sitemap). This is the
// only data the browser needs for search: the 1.8 MB parameter file and
// the full alarm file never leave the server.
export const dynamic = "force-static";

export function GET() {
  const sev = { critical: "c", warning: "w", notice: "n" } as const;
  const a: AlarmTuple[] = getAllAlarms().map((x) => [x.code, x.message, sev[x.severity]]);

  const groups: string[] = [];
  const categories: string[] = [];
  const idx = (list: string[], v: string) => {
    let i = list.indexOf(v);
    if (i < 0) { list.push(v); i = list.length - 1; }
    return i;
  };
  const p: ParamTuple[] = [];
  for (const page of getAllParameterPages()) {
    const g = idx(groups, page.group), c = idx(categories, page.category);
    p.push([page.slug, page.address, null, page.name, g, c]);
    // Bit rows are searchable by their own wording but land on the parent page.
    for (const b of page.bits) {
      if (b.name && b.name !== "—") p.push([page.slug, page.address, b.bit, b.name, g, c]);
    }
  }
  // "Not used" codes stay searchable — "is M47 used?" deserves a hit — but
  // are flagged so the card can say so instead of showing a blank name.
  const m: MCodeTuple[] = getAllMCodes().map((x) =>
    x.notUsed ? [x.code, "Not used on this machine", 1] : [x.code, x.description],
  );
  const g: GCodeTuple[] = getAllGCodes().map((x) => [x.code, x.name]);
  const body: SearchIndex = { v: 1, groups, categories, a, p, m, g };
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
