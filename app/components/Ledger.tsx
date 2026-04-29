"use client";

import { type Alarm } from "@/lib/alarms";
import { SevTag } from "./SevTag";

export function Ledger({
  alarm,
  alarms,
  onSelect,
}: {
  alarm: Alarm | null;
  alarms: Alarm[];
  onSelect: (code: number) => void;
}) {
  if (!alarm) return null;

  const idx = alarms.findIndex((a) => a.code === alarm.code);
  const prev = alarms[idx - 1];
  const next = alarms[idx + 1];

  const related = alarms
    .filter((a) => a.code !== alarm.code && a.typeCode === alarm.typeCode && alarm.typeCode)
    .slice(0, 4);

  const severityNote =
    alarm.severity === "critical"
      ? "Machine is fully stopped. Recover before resuming."
      : alarm.severity === "warning"
      ? "Feed paused. Resolve and reset to continue."
      : "Operation may continue. Inspect at next opportunity.";

  return (
    <aside className="ledger">
      <div className="ledger__block">
        <div className="mono-label muted">Record</div>
        <div className="ledger__kv">
          <span>Code</span>
          <span className="num">{String(alarm.code).padStart(4, "0")}</span>
        </div>
        <div className="ledger__kv">
          <span>Type</span>
          <span className="num">{alarm.typeCode || "—"}</span>
        </div>
        <div className="ledger__kv">
          <span>Stop</span>
          <span className="num">{alarm.stopCode || "—"}</span>
        </div>
        <div className="ledger__kv">
          <span>Clear</span>
          <span className="num">{alarm.clearCode || "—"}</span>
        </div>
        <div className="ledger__kv">
          <span>Panel</span>
          <span className="num">{alarm.display || "—"}</span>
        </div>
      </div>

      <div className="ledger__block">
        <div className="mono-label muted">Severity</div>
        <SevTag severity={alarm.severity} />
        <p className="ledger__note">{severityNote}</p>
      </div>

      <div className="ledger__block">
        <div className="mono-label muted">Phone support</div>
        <div className="ledger__phone">
          <div className="mono-label">cowie.ai · 24/7</div>
          <a href="tel:+13184089163" className="ledger__phone-num">
            +1 318 408 9163
          </a>
          <p className="ledger__note">
            Quote alarm code{" "}
            <span className="num">{String(alarm.code).padStart(4, "0")}</span> when
            connected.
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <div className="ledger__block">
          <div className="mono-label muted">Related (Type {alarm.typeCode})</div>
          <ul className="ledger__related">
            {related.map((r) => (
              <li key={r.code}>
                <a
                  href={`?code=${r.code}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelect(r.code);
                  }}
                >
                  <span className="num">{String(r.code).padStart(3, "0")}</span>{" "}
                  {r.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="ledger__block ledger__nav">
        <button
          type="button"
          className="ledger__nav-btn"
          disabled={!prev}
          onClick={() => prev && onSelect(prev.code)}
        >
          <span className="muted">← Prev</span>
          <span className="num">{prev ? String(prev.code).padStart(3, "0") : "—"}</span>
        </button>
        <button
          type="button"
          className="ledger__nav-btn"
          disabled={!next}
          onClick={() => next && onSelect(next.code)}
        >
          <span className="muted">Next →</span>
          <span className="num">{next ? String(next.code).padStart(3, "0") : "—"}</span>
        </button>
      </div>
    </aside>
  );
}
