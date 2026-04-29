export type Severity = "critical" | "warning" | "notice";

export interface RawAlarm {
  "No.": number | string;
  Message: string;
  "Type of error": string | null;
  "Stopped status": string | null;
  "Clearing procedure": string | null;
  Display: string | null;
  Cause: string | null;
  Action: string | null;
}

export interface Alarm {
  code: number;
  message: string;
  cause: string;
  action: string;
  typeCode: string;
  stopCode: string;
  clearCode: string;
  display: string;
  severity: Severity;
}

export const SEV_META: Record<
  Severity,
  { label: string; short: string; glyph: string }
> = {
  critical: { label: "CRITICAL", short: "CRT", glyph: "■" },
  warning: { label: "WARNING", short: "WRN", glyph: "▲" },
  notice: { label: "NOTICE", short: "NTC", glyph: "●" },
};

export const ERROR_TYPE_LEGEND: Record<string, string> = {
  A: "Operation — wrong key or incorrect operation",
  B: "Registered Data — program or tool data error",
  C: "Servo — servo control mechanism malfunction",
  D: "Spindle — spindle control mechanism malfunction",
  E: "NC Equipment — system hardware/software error",
  F: "Machine (PLC) — machine failure",
  G: "External I/O — external I/O unit malfunction",
};

export const STOPPED_STATUS_LEGEND: Record<string, string> = {
  H: "Emergency stop — machine fully stopped",
  I: "Reset stop — waiting for reset",
  J: "Single-block stop — stopped at a block",
  K: "Feed hold — feed stopped, machine ready",
  L: "Operation continued — machine still running",
};

export const CLEARING_LEGEND: Record<string, string> = {
  M: "Power OFF → fix cause → Power ON",
  N: "Fix cause → Power OFF → Power ON",
  O: "Fix cause → press RESET",
  P: "Press RESET to clear",
  Q: "Fix cause → tap alarm clear button",
  S: "Tap alarm clear button",
};

export function decodeErrorType(code: string): string {
  return ERROR_TYPE_LEGEND[code] || "";
}

export function decodeStoppedStatus(code: string): string {
  return STOPPED_STATUS_LEGEND[code] || "";
}

export function decodeClearingProcedure(code: string): string {
  return CLEARING_LEGEND[code] || "";
}

export function classifySeverity(a: RawAlarm): Severity {
  const stop = (a["Stopped status"] || "").trim();
  const display = (a.Display || "").trim();
  if (stop === "H" || display.startsWith("Red")) return "critical";
  if (stop === "I" || stop === "J" || stop === "K") return "warning";
  return "notice";
}

export function normalizeAlarm(a: RawAlarm): Alarm {
  return {
    code: Number(a["No."]),
    message: a.Message || "",
    cause: a.Cause || "",
    action: a.Action || "",
    typeCode: (a["Type of error"] || "").trim(),
    stopCode: (a["Stopped status"] || "").trim(),
    clearCode: (a["Clearing procedure"] || "").trim(),
    display: (a.Display || "").trim(),
    severity: classifySeverity(a),
  };
}

export function loadAlarms(raw: RawAlarm[]): Alarm[] {
  return raw
    .filter((a) => a["No."] !== null && a["No."] !== "" && !Number.isNaN(Number(a["No."])))
    .map(normalizeAlarm)
    .sort((a, b) => a.code - b.code);
}
