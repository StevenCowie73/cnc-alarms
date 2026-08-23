"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Progressive-enhancement search for the alarm index. The full list is
// server-rendered once (so it is in the HTML for crawlers and works with
// JS off); this component filters those rows in place by their data-q text
// instead of re-rendering 1,200 nodes through React state. Enter on an
// exact code jumps straight to that alarm.
export function IndexSearch({ total, noun = "alarms" }: { total: number; noun?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(total);
  const rowsRef = useRef<HTMLElement[] | null>(null);

  useEffect(() => {
    rowsRef.current = Array.from(
      document.querySelectorAll<HTMLElement>("[data-alarm-row]"),
    );
  }, []);

  useEffect(() => {
    const rows = rowsRef.current;
    if (!rows) return;
    const needle = q.trim().toLowerCase();
    let n = 0;
    for (const row of rows) {
      const hit = !needle || (row.dataset.q || "").includes(needle);
      row.hidden = !hit;
      if (hit) n++;
    }
    setShown(n);
  }, [q]);

  return (
    <div className="index-search">
      <div className="search-field search-field--sm">
        <span className="search-field__icon" aria-hidden>
          ⌕
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && noun === "alarms" && /^\d{1,4}$/.test(q.trim())) {
              router.push(`/alarms/${Number(q.trim())}`);
            }
          }}
          placeholder="Filter by code or name"
          aria-label="Filter alarms"
          inputMode="search"
        />
      </div>
      <div className="flow-label flow-results__count" aria-live="polite">
        {shown} of {total} {noun}
      </div>
    </div>
  );
}
