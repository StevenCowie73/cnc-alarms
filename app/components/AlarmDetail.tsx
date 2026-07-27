"use client";

import { useMemo } from "react";
import {
  type Alarm,
  decodeErrorType,
  decodeStoppedStatus,
  decodeClearingProcedure,
} from "@/lib/alarms";
import { SevTag } from "./SevTag";

// The alarm detail view. Content is unchanged from the previous readout —
// message, cause, action steps, and the decoded codebook all come from the
// same normalized Alarm — but it is presented in the prototype's simpler,
// stacked-card style instead of the old three-column bulletin.
export function AlarmDetail({
  alarm,
  lang,
  onLang,
  onSpeak,
  speaking,
  onBack,
}: {
  alarm: Alarm;
  lang: "en" | "es";
  onLang: (l: "en" | "es") => void;
  onSpeak: (text: string) => void;
  speaking: boolean;
  onBack: () => void;
}) {
  // Split the free-text action field into discrete operator steps, matching
  // the prototype's numbered "What to do" list.
  const steps = useMemo(
    () =>
      (alarm.action || "")
        .split(/(?<=\.)\s+(?=[A-Z0-9])/)
        .map((s) => s.trim())
        .filter(Boolean),
    [alarm.action]
  );

  const transcript = useMemo(() => {
    const parts: string[] = [`Alarm ${alarm.code}.`, alarm.message + "."];
    if (alarm.cause) parts.push("Cause. " + alarm.cause);
    if (alarm.action) parts.push("Recommended action. " + alarm.action);
    else parts.push("Contact maintenance.");
    return parts.join(" ");
  }, [alarm]);

  const codebook = [
    { code: alarm.typeCode, label: "Error type", value: decodeErrorType(alarm.typeCode) },
    { code: alarm.stopCode, label: "Stop status", value: decodeStoppedStatus(alarm.stopCode) },
    { code: alarm.clearCode, label: "Clearing", value: decodeClearingProcedure(alarm.clearCode) },
  ];

  return (
    <div className="detail">
      <div className="detail__topbar">
        <button type="button" className="detail__back" onClick={onBack} aria-label="Back to results">
          ‹
        </button>
        <span className="brandmark detail__brand">ALARMS</span>
        <a
          href="https://mazatrol-assistant.vercel.app"
          className="flow-header__link flow-headlink"
        >
          Mazatrol Assistant
        </a>
      </div>

      <div className="detail__head">
        <SevTag severity={alarm.severity} />
        <span className="flow-label">Alarm code</span>
      </div>
      <div className="detail__code">{alarm.code}</div>
      <h1 className="detail__title">{alarm.message}</h1>

      <div className="detail__voice">
        <div className="lang lang--inline">
          <button
            type="button"
            className={lang === "en" ? "is-on" : ""}
            onClick={() => onLang("en")}
          >
            EN
          </button>
          <button
            type="button"
            className={lang === "es" ? "is-on" : ""}
            onClick={() => onLang("es")}
          >
            ES
          </button>
        </div>
        <button
          type="button"
          className={"detail__voice-btn" + (speaking ? " is-on" : "")}
          onClick={() => onSpeak(transcript)}
        >
          {speaking ? "■ Stop" : "▶ Read aloud"}
        </button>
      </div>

      <section className="detail__section">
        <div className="flow-label">What it means</div>
        <p className="detail__prose">
          {alarm.cause || (
            <span className="muted">
              No cause information recorded in the manual. Contact a Mazak Technical Center.
            </span>
          )}
        </p>
      </section>

      <section className="detail__section">
        <div className="flow-label">What to do</div>
        {steps.length > 0 ? (
          <ol className="action-numbered">
            {steps.map((s, i) => (
              <li key={i}>
                <span className="action-numbered__num">{i + 1}</span>
                <span className="action-numbered__text">{s}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="detail__prose">
            <span className="muted">
              No action procedure recorded. Contact a Mazak Technical Center.
            </span>
          </p>
        )}
      </section>

      <section className="detail__section">
        <div className="flow-label">Codebook — decoded</div>
        <div className="detail__codebook">
          {codebook.map((row) => (
            <div key={row.label} className="detail__codebook-row">
              <span className="detail__codebook-code">{row.code || "—"}</span>
              <span className="detail__codebook-label">{row.label}</span>
              <span className="detail__codebook-value">
                {row.value || <span className="muted">unspecified</span>}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="detail__callout">
        <span aria-hidden>⚠</span>
        <span>
          Still faulted after these steps? Do not restart under load —{" "}
          <a href="tel:+13184089163">call support</a>.
        </span>
      </div>

      {/* Hand-off to the sibling Mazatrol assistant, carrying the alarm code
          so the machinist doesn't retype context. Secondary style on purpose —
          it must not compete with the manual's own steps above. */}
      <a
        href={`https://mazatrol-assistant.vercel.app?alarm=${alarm.code}`}
        className="btn-ghost detail__mazatrol"
      >
        Still stuck? Ask the Mazatrol assistant →
      </a>
    </div>
  );
}
