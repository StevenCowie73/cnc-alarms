"use client";

import { useMemo } from "react";
import {
  type Alarm,
  decodeErrorType,
  decodeStoppedStatus,
  decodeClearingProcedure,
} from "@/lib/alarms";
import { SevTag } from "./SevTag";
import { TickRule } from "./TickRule";
import { Sparkwave } from "./Sparkwave";

function CodebookRow({
  code,
  label,
  value,
}: {
  code: string;
  label: string;
  value: string;
}) {
  return (
    <div className="codebook__row">
      <span className="codebook__code">{code || "—"}</span>
      <span className="codebook__label">{label}</span>
      <span className="codebook__value">
        {value || <em className="muted">unspecified</em>}
      </span>
    </div>
  );
}

export function Readout({
  alarm,
  lang,
  onSpeak,
  speaking,
}: {
  alarm: Alarm | null;
  lang: "en" | "es";
  onSpeak: (text: string) => void;
  speaking: boolean;
}) {
  const transcript = useMemo(() => {
    if (!alarm) return "";
    const parts: string[] = [];
    parts.push(`Alarm ${alarm.code}.`);
    parts.push(alarm.message + ".");
    if (alarm.cause) parts.push("Cause. " + alarm.cause);
    if (alarm.action) parts.push("Recommended action. " + alarm.action);
    else parts.push("Contact maintenance.");
    return parts.join(" ");
  }, [alarm]);

  if (!alarm) {
    return (
      <section className="readout readout--empty">
        <p className="muted">Select a code from the index.</p>
      </section>
    );
  }

  const dotColor = (alarm.display.toLowerCase().split(" ")[0] || "none") as
    | "red"
    | "blue"
    | "yellow"
    | "none";

  const actionSentences = (alarm.action || "")
    .split(/(?<=\.)\s+(?=[A-Z0-9])/)
    .filter((s) => s.trim())
    .slice(0, 5);

  return (
    <section className="readout">
      {/* Bulletin header */}
      <header className="bulletin">
        <div className="bulletin__top">
          <span className="mono-label">Alarm Bulletin</span>
          <span className="mono-label muted">
            No. {String(alarm.code).padStart(4, "0")} · Mazak NC
          </span>
        </div>
        <TickRule count={64} />
        <div className="bulletin__sev">
          <SevTag severity={alarm.severity} />
          <span className="bulletin__display">
            <span className={`bulletin__dot bulletin__dot--${dotColor}`} />
            <span className="mono-label muted">Panel · {alarm.display || "—"}</span>
          </span>
        </div>
        <h1 className="bulletin__title">{alarm.message}</h1>
        <div className="bulletin__sparkwave">
          <Sparkwave seed={alarm.code} animate={alarm.severity === "critical"} />
        </div>
      </header>

      {/* Strata: Cause / Action / Codebook */}
      <div className="strata">
        <div className="strata__row">
          <div className="strata__label">
            <span className="mono-label">§ 01 · Cause</span>
            <span className="mono-label muted">What is happening</span>
          </div>
          <div className="strata__body">
            <p className="prose">
              {alarm.cause || (
                <em className="muted">
                  — No cause information recorded in the manual. Contact a Mazak Technical Center.
                </em>
              )}
            </p>
          </div>
        </div>

        <div className="strata__row">
          <div className="strata__label">
            <span className="mono-label">§ 02 · Action</span>
            <span className="mono-label muted">Operator steps</span>
          </div>
          <div className="strata__body">
            <p className="prose">
              {alarm.action || (
                <em className="muted">
                  — No action procedure recorded. Contact a Mazak Technical Center.
                </em>
              )}
            </p>
            {actionSentences.length > 0 && (
              <ol className="action-numbered">
                {actionSentences.map((s, i) => (
                  <li key={i}>
                    <span className="action-numbered__num">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="action-numbered__text">{s.trim()}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="strata__row">
          <div className="strata__label">
            <span className="mono-label">§ 03 · Codebook</span>
            <span className="mono-label muted">Decoded</span>
          </div>
          <div className="strata__body codebook">
            <CodebookRow
              code={alarm.typeCode}
              label="Error type"
              value={decodeErrorType(alarm.typeCode)}
            />
            <CodebookRow
              code={alarm.stopCode}
              label="Stop status"
              value={decodeStoppedStatus(alarm.stopCode)}
            />
            <CodebookRow
              code={alarm.clearCode}
              label="Clearing"
              value={decodeClearingProcedure(alarm.clearCode)}
            />
          </div>
        </div>
      </div>

      {/* Voice transcript */}
      <div className="transcript">
        <div className="transcript__head">
          <span className="mono-label">
            Voice readout · {lang === "es" ? "ES-MX" : "EN-US"}
          </span>
          <button
            type="button"
            className={"transcript__btn " + (speaking ? "is-on" : "")}
            onClick={() => onSpeak(transcript)}
          >
            <span className="transcript__btn-glyph">{speaking ? "■" : "▶"}</span>
            <span>{speaking ? "Stop" : "Read aloud"}</span>
          </button>
        </div>
        <div className="transcript__body">
          {transcript
            .split(". ")
            .filter(Boolean)
            .map((line, i, arr) => (
              <div key={i} className="transcript__line">
                <span className="transcript__time">
                  {String(i * 4).padStart(2, "0")}:
                  {String((i * 17) % 60).padStart(2, "0")}
                </span>
                <span className="transcript__text">
                  {line}
                  {i < arr.length - 1 ? "." : ""}
                </span>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
