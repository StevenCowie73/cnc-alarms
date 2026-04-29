export function TickRule({ count = 60 }: { count?: number }) {
  const ticks = Array.from({ length: count + 1 }, (_, i) => i);
  return (
    <svg
      className="tick-rule-svg"
      viewBox={`0 0 ${count} 8`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        x1="0"
        y1="4"
        x2={count}
        y2="4"
        stroke="currentColor"
        strokeWidth="0.4"
        opacity="0.35"
      />
      {ticks.map((i) => (
        <line
          key={i}
          x1={i}
          y1={i % 5 === 0 ? 0 : 2}
          x2={i}
          y2={i % 5 === 0 ? 8 : 6}
          stroke="currentColor"
          strokeWidth="0.4"
          opacity={i % 5 === 0 ? 0.7 : 0.3}
        />
      ))}
    </svg>
  );
}
