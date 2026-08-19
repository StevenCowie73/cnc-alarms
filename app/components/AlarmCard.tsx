import Link from "next/link";
import type { Alarm } from "@/lib/alarms";
import { SevTag } from "./SevTag";

// A single tappable alarm row used by the Recent list and search results,
// styled as the prototype's rounded card. It is a real link to the alarm's
// own page so crawlers (and middle-click / long-press) can follow it; the
// hub passes an optional onOpen to record the click in Recent.
export function AlarmCard({
  alarm,
  onOpen,
}: {
  alarm: Alarm;
  onOpen?: (code: number) => void;
}) {
  return (
    <Link
      href={`/alarms/${alarm.code}`}
      className="alarm-card"
      onClick={onOpen ? () => onOpen(alarm.code) : undefined}
    >
      <SevTag severity={alarm.severity} compact />
      <span className="alarm-card__code">{alarm.code}</span>
      <span className="alarm-card__msg">{alarm.message}</span>
    </Link>
  );
}
