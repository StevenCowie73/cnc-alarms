import Link from "next/link";
import type { SearchResult } from "@/lib/search";
import { SevTag } from "./SevTag";

// One row in search results or the Recent list. Same card as before for
// alarms; parameters get the PARAM badge in the same mono badge style.
export function ResultCard({ r, onOpen }: { r: SearchResult; onOpen?: (r: SearchResult) => void }) {
  return (
    <Link href={r.href} className="alarm-card" onClick={onOpen ? () => onOpen(r) : undefined}>
      {r.type === "alarm" && r.severity ? (
        <SevTag severity={r.severity} compact />
      ) : (
        <span className="sev sev--param sev--compact">
          <span className="sev__label">PARAM</span>
        </span>
      )}
      <span className="alarm-card__code">{r.code}</span>
      <span className="alarm-card__msg">
        {r.name}
        {r.type === "param" && r.group ? <span className="alarm-card__meta"> · {r.group}</span> : null}
      </span>
    </Link>
  );
}
