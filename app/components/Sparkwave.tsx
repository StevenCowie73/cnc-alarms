export function Sparkwave({
  seed = 0,
  animate = false,
}: {
  seed?: number;
  animate?: boolean;
}) {
  const n = 80;
  const points: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 100;
    const a =
      Math.sin(i * 0.6 + seed) * 0.5 +
      Math.sin(i * 1.7 + seed * 1.3) * 0.3 +
      Math.sin(i * 0.2 + seed) * 0.2;
    const y = 20 + a * 14;
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }

  return (
    <svg
      className={"sparkwave" + (animate ? " sparkwave--animate" : "")}
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
