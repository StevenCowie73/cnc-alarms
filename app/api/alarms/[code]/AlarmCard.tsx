"use client";

type Alarm = {
  code: string;
  name?: string;
  type?: string | null;
  stopped_status?: string | null;
  clearing_procedure?: string | null;
  display?: string | null;
  cause?: string | null;
  action?: string | null;
  severity?: "green" | "yellow" | "red" | string | null;
  [k: string]: any;
};

const sevChip: Record<string, string> = {
  green: "bg-green-100 text-green-800 border-green-300",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
  red: "bg-red-100 text-red-800 border-red-300",
  default: "bg-gray-100 text-gray-800 border-gray-300",
};

function Field({ label, value }: { label: string; value?: string | string[] | null }) {
  if (
    value === undefined ||
    value === null ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === "string" && value.trim() === "")
  ) return null;

  const v = Array.isArray(value) ? value.join(", ") : value;
  return (
    <div className="mb-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed">{v}</div>
    </div>
  );
}

export default function AlarmCard({ alarm }: { alarm: Alarm }) {
  const sevClass = sevChip[(alarm.severity || "").toLowerCase()] ?? sevChip.default;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-2xl border p-6 shadow-sm bg-white">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-semibold">
            {alarm.code} — {alarm.name ?? "Unnamed"}
          </h1>
          <div className={`h-7 inline-flex items-center px-2 text-xs border rounded ${sevClass}`}>
            Severity: {alarm.severity ?? "unknown"}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Type" value={alarm.type} />
          <Field label="Stopped Status" value={alarm.stopped_status} />
          <Field label="Clearing Procedure" value={alarm.clearing_procedure} />
          <Field label="Display" value={alarm.display} />
          <Field label="Cause" value={alarm.cause} />
          <Field label="Action" value={alarm.action} />
        </div>
      </div>
    </div>
  );
}
