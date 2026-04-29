import { SEV_META, type Severity } from "@/lib/alarms";

export function SevTag({
  severity,
  compact = false,
}: {
  severity: Severity;
  compact?: boolean;
}) {
  const meta = SEV_META[severity];
  return (
    <span className={`sev sev--${severity}${compact ? " sev--compact" : ""}`}>
      <span className="sev__glyph" aria-hidden>
        {meta.glyph}
      </span>
      <span className="sev__label">{compact ? meta.short : meta.label}</span>
    </span>
  );
}
