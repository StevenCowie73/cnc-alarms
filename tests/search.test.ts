// Unit tests for lib/search.ts.
//
// Expected behaviour comes from the ranking comment above search():
//   exact code (alarms first, then parameters, M-codes, G-codes)
//   > code prefix > code contains / numeric part match
//   > name word-start > name contains
//   Ties keep index order.
// and from the tuple encoding documented in lib/searchIndex.ts. Nothing here
// is copied from what the implementation currently returns.

import { describe, expect, it } from "vitest";
import { expandIndex, search } from "../lib/search";
import type { SearchIndex } from "../lib/searchIndex";

const IX: SearchIndex = {
  v: 1,
  groups: ["Axis", "Spindle"],
  categories: ["Servo", "Tool"],
  a: [
    [101, "SOFT LIMIT +X", "c"],
    [221, "Spindle overheat", "w"],
    [410, "Offsetting error", "n"],
    [310, "MIS-SET G CODE", "n"],
    [500, "Coolant pressure low", "c"],
    [612, "Retooling fault", "n"],
    [715, "NO NOM-\u03c6 DATA IN PROGRAM", "n"],
    [720, "\u00d8bore undersize", "n"],
  ],
  p: [
    ["f91", "F91", null, "Feed rate clamp", 0, 0],
    ["d91", "D91", 3, "Servo recovery flag", 1, 1],
    ["c12", "C12", null, "Coolant timer", 0, 1],
  ],
  m: [
    ["M30", "Program end"],
    ["M99", "Not used", 1],
    ["M08", "Coolant on"],
  ],
  g: [
    ["G43", "Tool length comp"],
    ["G43.4", "Tool centre point control"],
    ["G05", "Coolant lookahead"],
    ["G81", "Bore cycle"],
  ],
};

const ENTRIES = expandIndex(IX);
const byKey = (key: string) => ENTRIES.find((e) => e.key === key)!;
const codes = (q: string) => search(ENTRIES, q).results.map((r) => r.code);

describe("expandIndex: alarms", () => {
  it("builds the key, href and severity from the tuple", () => {
    const a = byKey("a101");
    expect(a.type).toBe("alarm");
    expect(a.code).toBe("101");
    expect(a.href).toBe("/alarms/101");
    expect(a.name).toBe("SOFT LIMIT +X");
    expect(a.severity).toBe("critical");
  });

  it("maps every severity letter to its full word", () => {
    expect(byKey("a101").severity).toBe("critical");
    expect(byKey("a221").severity).toBe("warning");
    expect(byKey("a310").severity).toBe("notice");
  });
});

describe("expandIndex: parameters", () => {
  it("uses the bare address when the tuple has no bit", () => {
    const p = byKey("pf91");
    expect(p.code).toBe("F91");
    expect(p.href).toBe("/parameters/f91");
    expect(p.group).toBe("Axis");
    expect(p.category).toBe("Servo");
  });

  it("spells out the bit in the code and anchors the href to it", () => {
    const p = byKey("pd91b3");
    expect(p.code).toBe("D91 bit 3");
    expect(p.href).toBe("/parameters/d91#bit-3");
    expect(p.group).toBe("Spindle");
    expect(p.category).toBe("Tool");
  });
});

describe("expandIndex: M-codes and G-codes", () => {
  it("marks a Not used placeholder and leaves the others unmarked", () => {
    expect(byKey("mM99").notUsed).toBe(true);
    expect(byKey("mM30").notUsed).toBe(false);
    expect(byKey("mM30").href).toBe("/mcodes/M30");
  });

  it("url-encodes the G-code href", () => {
    expect(byKey("gG43.4").href).toBe(`/gcodes/${encodeURIComponent("G43.4")}`);
  });

  it("tolerates an index with no M-codes or G-codes", () => {
    // Both are optional: clients may hold a cached pre-M-code index.
    const slim = expandIndex({ ...IX, m: undefined, g: undefined });
    expect(slim).toHaveLength(IX.a.length + IX.p.length);
    expect(slim.every((e) => e.type === "alarm" || e.type === "param")).toBe(true);
  });

  it("expands every row of every dataset", () => {
    expect(ENTRIES).toHaveLength(
      IX.a.length + IX.p.length + IX.m!.length + IX.g!.length,
    );
  });
});

describe("search: empty input", () => {
  it("returns nothing for an empty or whitespace query", () => {
    expect(search(ENTRIES, "")).toEqual({ results: [], total: 0 });
    expect(search(ENTRIES, "   ")).toEqual({ results: [], total: 0 });
  });
});

describe("search: ranking tiers", () => {
  it("puts an exact code match first", () => {
    expect(codes("101")[0]).toBe("101");
  });

  it("puts an exact code above a mere prefix match", () => {
    // "G43" is exact for G43 and a prefix of G43.4.
    const order = codes("g43");
    expect(order.indexOf("G43")).toBeLessThan(order.indexOf("G43.4"));
  });

  it("matches a numeric query against the numeric part of a code", () => {
    // Documented: digits carry the numeric part for "217"-style matching,
    // so 91 must find parameter F91 even though the code starts with a letter.
    expect(codes("91")).toContain("F91");
  });

  it("keeps the whole integer part of a G-code, not the decimals", () => {
    // The comment is explicit: "43.4" -> "434" would mislead, so a numeric
    // query of 43 must reach G43.4 through its integer part.
    expect(codes("43")).toContain("G43.4");
  });

  it("ranks a name word-start above a mid-word name match", () => {
    // "Tool length comp" starts with the word; "Retooling fault" only
    // contains it. The word-start tier must win even though the word-start
    // entry is a G-code (lowest type rank) and the other is an alarm
    // (highest): the tier outranks the type.
    const order = codes("tool");
    expect(order).toContain("G43");
    expect(order).toContain("612");
    expect(order.indexOf("G43")).toBeLessThan(order.indexOf("612"));
  });

  it("ranks a hyphenated word-start as a word start", () => {
    // A hyphen is a word boundary, so "MIS-SET G CODE" is a word-start match
    // for "set" and outranks "Offsetting error", which only contains it
    // mid-word. The index lists Offsetting FIRST, so index order alone cannot
    // pass this test.
    const order = codes("set");
    expect(order.indexOf("310")).toBeLessThan(order.indexOf("410"));
  });

  it("treats a non-ASCII letter as part of a word, not as a separator", () => {
    // "\u00d8bore undersize" contains "bore" directly after a letter, so it is
    // NOT a word start; "Bore cycle" is. A \\w-based boundary would call
    // \u00d8 a separator and wrongly promote the alarm above the G-code, which
    // the type ranking would then hide. This ordering only holds if the
    // boundary test is Unicode-aware.
    const order = codes("bore");
    expect(order).toContain("G81");
    expect(order).toContain("720");
    expect(order.indexOf("G81")).toBeLessThan(order.indexOf("720"));
  });

  it("handles a Greek letter in a name without breaking the boundary logic", () => {
    // Real alarm name from this repo's data.
    expect(codes("data")).toContain("715");
    expect(codes("nom")).toContain("715");
    // The Greek letter itself sits after a hyphen, so it is a word start.
    expect(codes("\u03c6")).toContain("715");
  });

  it("is case insensitive on both code and name", () => {
    expect(codes("SPINDLE")).toContain("221");
    expect(codes("g43")).toContain("G43");
    expect(codes("G43")).toContain("G43");
  });
});

describe("search: type ordering and ties", () => {
  it("orders alarms, then parameters, then M-codes, then G-codes at the same tier", () => {
    // Every one of these matches on a name word-start, so only the type rank
    // can separate them.
    expect(codes("coolant")).toEqual(["500", "C12", "M08", "G05"]);
  });

  it("keeps index order when score and type are equal", () => {
    // Both parameters match on their numeric part; F91 is listed first.
    const order = codes("91");
    expect(order.indexOf("F91")).toBeLessThan(order.indexOf("D91 bit 3"));
  });
});

describe("search: totals", () => {
  it("reports a total equal to the number of results it returns", () => {
    // The function caps nothing; the caller caps what it renders.
    for (const q of ["coolant", "91", "tool", "e"]) {
      const { results, total } = search(ENTRIES, q);
      expect(total, `total for ${q}`).toBe(results.length);
    }
  });

  it("returns every match, not a truncated page", () => {
    const { total } = search(ENTRIES, "coolant");
    expect(total).toBe(4);
  });

  it("returns nothing for a query that matches no code or name", () => {
    expect(search(ENTRIES, "zzzznotathing")).toEqual({ results: [], total: 0 });
  });
});
