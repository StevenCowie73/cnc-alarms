// Slim search index shared by every dataset. Built once at build time
// (app/search-index.json/route.ts) from the full data, shipped to the
// browser for instant client-side search. Only what search and result
// cards need: code, name, type, severity/category. Full detail lives in
// the statically generated pages.
//
// Compact tuple encoding keeps the payload small; lib/search.ts expands it.

export type AlarmTuple = [code: number, name: string, sev: "c" | "w" | "n"];
export type ParamTuple = [slug: string, address: string, bit: number | null, name: string, group: number, category: number];
// u = 1 marks a "Not used" placeholder so the result card can mute it.
export type MCodeTuple = [code: string, name: string, u?: 1];

export interface SearchIndex {
  v: 1;
  groups: string[];
  categories: string[];
  a: AlarmTuple[];
  p: ParamTuple[];
  m?: MCodeTuple[]; // optional: clients may hold a cached pre-M-code index
}

export const SEARCH_INDEX_URL = "/search-index.json";
