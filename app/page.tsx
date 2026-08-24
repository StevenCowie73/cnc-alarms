import { getAllAlarms } from "@/lib/alarmData";
import { getAllParameterPages } from "@/lib/parameterData";
import { getAllMCodes } from "@/lib/mcodeData";
import { getAllGCodes } from "@/lib/gcodeData";
import type { SearchResult } from "@/lib/search";
import { Hub } from "./Hub";

// Server shell for the hub: supplies the counts and the three sample cards
// so the first-paint HTML is complete, then the client Hub takes over and
// fetches the slim search index.
export default function Home() {
  const alarms = getAllAlarms();
  const sample: SearchResult[] = [];
  for (const sev of ["critical", "warning", "notice"] as const) {
    const a = alarms.find((x) => x.severity === sev);
    if (a) sample.push({ type: "alarm", key: `a${a.code}`, href: `/alarms/${a.code}`, code: String(a.code), name: a.message, severity: a.severity });
  }
  return <Hub seed={{ counts: { alarms: alarms.length, params: getAllParameterPages().length, mcodes: getAllMCodes().length, gcodes: getAllGCodes().length }, sample }} />;
}
