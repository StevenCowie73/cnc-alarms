import alarmsRaw from "../public/alarms.json";
import { loadAlarms, type Alarm, type RawAlarm } from "./alarms";

// Single source of alarm data for build-time rendering. alarms.json is a
// static file in the repo, so every alarm page can be pre-rendered (SSG)
// and the full list is available to sitemap/index generation without any
// runtime fetch. If the data ever moves to a database, swap this module
// for a fetch + `revalidate` (ISR) and nothing above it needs to change.

let cache: Alarm[] | null = null;
let byCode: Map<number, Alarm> | null = null;

// The manual reserves a handful of numbers with no message, cause, or
// action (e.g. 23, 24, 69, 70, 100, 1000). They carry no information, so
// they get no page, no sitemap entry, and no index row — a thin empty page
// is worse for search than no page.
function hasContent(a: Alarm): boolean {
  return Boolean(a.message.trim() || a.cause.trim() || a.action.trim());
}

export function getAllAlarms(): Alarm[] {
  if (!cache) cache = loadAlarms(alarmsRaw as RawAlarm[]).filter(hasContent);
  return cache;
}

export function getAlarm(code: number): Alarm | undefined {
  if (!byCode) {
    byCode = new Map();
    for (const a of getAllAlarms()) byCode.set(a.code, a);
  }
  return byCode.get(code);
}

export function parseCode(raw: string): number | null {
  if (!/^\d{1,4}$/.test(raw)) return null;
  return Number(raw);
}

// Title per the SEO spec; degrades cleanly if a message is ever blank.
export function alarmTitle(a: Alarm): string {
  const name = a.message.trim();
  return name
    ? `Mazak Alarm ${a.code} – ${name}: Cause & Fix | Cowie.ai`
    : `Mazak Alarm ${a.code}: Cause & Fix | Cowie.ai`;
}

// ~150-char meta description built from the manual's cause/action text.
export function describeAlarm(a: Alarm): string {
  const name = a.message.trim();
  const base = name ? `Mazak alarm ${a.code} (${name}): ` : `Mazak alarm ${a.code}: `;
  const body =
    a.cause && a.action
      ? `cause — ${a.cause} Fix — ${a.action}`
      : a.cause
        ? `cause — ${a.cause}`
        : a.action
          ? `fix — ${a.action}`
          : "meaning, cause, recovery steps and clearing procedure from the Mazak manual.";
  const full = (base + body).replace(/\s+/g, " ").trim();
  if (full.length <= 158) return full;
  const cut = full.slice(0, 155);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), 120)).trimEnd() + "…";
}
