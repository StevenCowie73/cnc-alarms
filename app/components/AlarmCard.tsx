"use client";

import type { Alarm } from "@/lib/alarms";
import { SevTag } from "./SevTag";

// A single tappable alarm row used by both the Recent list and the search
// results, styled as the prototype's rounded card. Selecting it opens the
// detail view for that code.
export function AlarmCard({
  alarm,
  onOpen,
}: {
  alarm: Alarm;
  onOpen: (code: number) => void;
}) {
  return (
    <button
      type="button"
      className="alarm-card"
      onClick={() => onOpen(alarm.code)}
    >
      <SevTag severity={alarm.severity} compact />
      <span className="alarm-card__code">{alarm.code}</span>
      <span className="alarm-card__msg">{alarm.message}</span>
    </button>
  );
}
