"use client";

import { useMemo } from "react";
import { SEV_META, type Alarm, type Severity } from "@/lib/alarms";
import { SevTag } from "./SevTag";

type SevFilter = "all" | Severity;

export function IndexColumn({
  alarms,
  selected,
  onSelect,
  query,
  onQuery,
  sevFilter,
  onSevFilter,
}: {
  alarms: Alarm[];
  selected: number | null;
  onSelect: (code: number) => void;
  query: string;
  onQuery: (v: string) => void;
  sevFilter: SevFilter;
  onSevFilter: (v: SevFilter) => void;
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return alarms.filter((a) => {
      if (sevFilter !== "all" && a.severity !== sevFilter) return false;
      if (!q) return true;
      return (
        String(a.code).includes(q) ||
        a.message.toLowerCase().includes(q) ||
        a.cause.toLowerCase().includes(q)
      );
    });
  }, [alarms, query, sevFilter]);

  const filters: SevFilter[] = ["all", "critical", "warning", "notice"];

  return (
    <aside className="index">
      <div className="index__head">
        <div className="mono-label index__count">
          <span>Codes</span>
          <span>
            {filtered.length.toString().padStart(3, "0")} / {alarms.length}
          </span>
        </div>
        <div className="index__search">
          <input
            type="text"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search code or message…"
            className="index__search-input"
          />
        </div>
        <div className="index__filters">
          {filters.map((s) => (
            <button
              key={s}
              type="button"
              className={"chip " + (sevFilter === s ? "chip--on" : "")}
              onClick={() => onSevFilter(s)}
            >
              {s === "all" ? "All" : SEV_META[s].label}
            </button>
          ))}
        </div>
      </div>
      <ul className="index__list">
        {filtered.map((a) => (
          <li key={a.code}>
            <button
              type="button"
              className={"idx-row " + (selected === a.code ? "is-selected" : "")}
              onClick={() => onSelect(a.code)}
            >
              <span
                className={`idx-row__bar idx-row__bar--${a.severity}`}
                aria-hidden
              />
              <span className="idx-row__code">
                {String(a.code).padStart(3, "0")}
              </span>
              <span className="idx-row__msg">{a.message}</span>
              <span className="idx-row__sev">
                <SevTag severity={a.severity} compact />
              </span>
            </button>
          </li>
        ))}
        {filtered.length === 0 && <li className="idx-empty">— no codes match —</li>}
      </ul>
    </aside>
  );
}
