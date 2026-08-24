// Chord / bolt-pattern math. Pure functions, no UI — kept separate from
// the component so the solver can be unit-tested directly with node.
//
// Mode 1 canonical form: every input pair reduces to { R, theta } (theta
// in radians, the included/central angle), from which everything else
// derives:  c = 2R·sin(θ/2)   s = R·θ   h = R·(1 − cos(θ/2))
//
// Convention where a pair is ambiguous (radius + chord): the minor arc,
// θ ≤ 180°. Stated in the field help.

const DEG = 180 / Math.PI;

// Monotonic 1-D bisection on (lo, hi). f must be monotonic in the bracket.
function bisect(f, target, lo, hi, increasing) {
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const v = f(mid);
    if (Math.abs(v - target) < 1e-14) return mid;
    if (v < target === increasing) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function deriveAll(R, theta) {
  const half = theta / 2;
  return {
    radius: R,
    diameter: 2 * R,
    chord: 2 * R * Math.sin(half),
    halfChord: R * Math.sin(half),
    angleDeg: theta * DEG,
    arc: R * theta,
    rise: R * (1 - Math.cos(half)),
  };
}

// values: { radius?, chord?, angleDeg?, arc?, rise? } — exactly two set
// (as finite positive numbers; angle in degrees). Returns { result } or
// { errs: [...] } with plain-language messages.
export function solveChord(values) {
  const errs = [];
  const keys = ["radius", "chord", "angleDeg", "arc", "rise"];
  const given = keys.filter((k) => Number.isFinite(values[k]));
  const NAMES = { radius: "radius", chord: "chord", angleDeg: "included angle", arc: "arc length", rise: "rise" };

  for (const k of given) {
    if (!(values[k] > 0)) errs.push(`The ${NAMES[k]} needs a positive number.`);
  }
  if (given.length < 2) errs.push("Enter any two of the five — the tool works out the other three.");
  if (given.length > 2)
    errs.push(`Enter exactly two of the five, not ${given.length} — you filled in ${given.map((k) => NAMES[k]).join(", ")}. Clear the extras.`);
  if (Number.isFinite(values.angleDeg) && values.angleDeg >= 360)
    errs.push(`An included angle of ${values.angleDeg}° is a full circle or more — a chord needs less than 360°.`);
  if (errs.length) return { errs };

  const [a, b] = given.sort();   // alphabetical: angleDeg < arc < chord < radius < rise
  const v = values;
  const pair = `${a}+${b}`;
  let R, theta;

  switch (pair) {
    case "angleDeg+radius":
      R = v.radius; theta = v.angleDeg / DEG;
      break;
    case "chord+radius": {
      if (v.chord > 2 * v.radius + 1e-12)
        return { errs: [`Chord ${v.chord} is longer than the diameter ${2 * v.radius} — a chord can't be longer than the circle is wide. Check which number is the radius (half the Ø callout).`] };
      R = v.radius; theta = 2 * Math.asin(Math.min(1, v.chord / (2 * v.radius)));
      break;
    }
    case "arc+radius": {
      if (v.arc >= 2 * Math.PI * v.radius)
        return { errs: [`Arc length ${v.arc} is a full circle or more on radius ${v.radius} (circumference ${(2 * Math.PI * v.radius).toFixed(4)}). Check the numbers.`] };
      R = v.radius; theta = v.arc / v.radius;
      break;
    }
    case "radius+rise": {
      if (v.rise > 2 * v.radius + 1e-12)
        return { errs: [`Rise ${v.rise} is more than the diameter ${2 * v.radius} — the sagitta can never exceed the full diameter.`] };
      R = v.radius; theta = 2 * Math.acos(Math.max(-1, 1 - v.rise / v.radius));
      break;
    }
    case "angleDeg+chord":
      theta = v.angleDeg / DEG; R = v.chord / (2 * Math.sin(theta / 2));
      break;
    case "angleDeg+arc":
      theta = v.angleDeg / DEG; R = v.arc / theta;
      break;
    case "angleDeg+rise":
      theta = v.angleDeg / DEG; R = v.rise / (1 - Math.cos(theta / 2));
      break;
    case "chord+rise": {
      // R = c²/8h + h/2; atan2 picks the correct branch when the segment
      // is past half depth (h > R).
      R = (v.chord * v.chord) / (8 * v.rise) + v.rise / 2;
      theta = 2 * Math.atan2(v.chord / 2, R - v.rise);
      break;
    }
    case "arc+chord": {
      if (v.chord >= v.arc)
        return { errs: [`The chord (${v.chord}) must be shorter than its arc (${v.arc}) — the straight line is always the short way across. If your chord is longer, the two numbers are swapped or one is wrong.`] };
      // sin(u)/u = c/s is strictly decreasing on (0, π): unique solution.
      const u = bisect((x) => Math.sin(x) / x, v.chord / v.arc, 1e-9, Math.PI - 1e-9, false);
      theta = 2 * u; R = v.arc / theta;
      break;
    }
    case "arc+rise": {
      if (v.rise >= v.arc)
        return { errs: [`The rise (${v.rise}) must be smaller than the arc length (${v.arc}). Check the two numbers.`] };
      // (1−cos u)/(2u) = h/s is increasing on (0, π/2] — covers segments
      // up to a half circle, which is the shop case. Past half circle the
      // pair is ambiguous, so it's rejected with advice.
      const limit = 1 / Math.PI;
      if (v.rise / v.arc >= limit)
        return { errs: [`Rise ${v.rise} on arc ${v.arc} works out past a half circle, where this pair of numbers has two possible answers. Give the tool a different pair — radius + rise, or chord + rise.`] };
      const u = bisect((x) => (1 - Math.cos(x)) / (2 * x), v.rise / v.arc, 1e-9, Math.PI / 2, true);
      theta = 2 * u; R = v.arc / theta;
      break;
    }
    default:
      return { errs: ["Unsupported input pair."] };
  }

  if (!(R > 0) || !(theta > 0) || !Number.isFinite(R) || !Number.isFinite(theta))
    return { errs: ["These two numbers don't make a valid chord — check them against the print."] };
  return { result: deriveAll(R, theta), given };
}

// Mode 2 — n features of width w on diameter d, optional start angle.
// Feature width taken as a chord on the diameter: subtended = 2·asin(w/d).
export function solvePattern(n, w, d, startDeg) {
  const errs = [];
  if (!Number.isFinite(n) || n < 1 || !Number.isInteger(n))
    errs.push("Number of features needs a whole number, 1 or more.");
  if (!(w > 0)) errs.push("Feature width needs a positive number — the slot or flat width on the print.");
  if (!(d > 0)) errs.push("Diameter needs a positive number — the Ø the features sit on.");
  const a0 = Number.isFinite(startDeg) ? startDeg : 0;
  if (w > 0 && d > 0 && w >= d)
    errs.push(`Width ${w} won't fit as a chord on Ø${d} — the feature is as wide as (or wider than) the circle. Check whether the width is really measured on this diameter.`);
  if (errs.length) return { errs };

  const alphaDeg = 2 * Math.asin(w / d) * DEG;
  const pitchDeg = 360 / n;
  if (alphaDeg >= pitchDeg + 1e-12)
    return { errs: [`Each feature subtends ${alphaDeg.toFixed(4)}° but the pitch is only ${pitchDeg.toFixed(4)}° — ${n} features of width ${w} overlap on Ø${d}. Fewer features or a narrower width.`] };

  const norm = (x) => ((x % 360) + 360) % 360;
  const rows = [];
  for (let i = 0; i < n; i++) {
    const centre = norm(a0 + i * pitchDeg);
    rows.push({
      n: i + 1,
      centre,
      lead: norm(centre - alphaDeg / 2),
      trail: norm(centre + alphaDeg / 2),
    });
  }
  return { result: { alphaDeg, pitchDeg, startDeg: a0, rows } };
}
