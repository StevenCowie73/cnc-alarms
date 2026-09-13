// Unit tests for app/tools/chord/chordMath.js.
//
// Expected values are derived from the canonical form stated at the top of
// that module -- c = 2R*sin(θ/2), s = R*θ, h = R*(1 − cos(θ/2)) -- and from
// plain geometry, NOT from whatever the implementation currently returns.

import { describe, expect, it } from "vitest";
import { deriveAll, solveChord, solvePattern } from "../app/tools/chord/chordMath.js";

const DEG = 180 / Math.PI;

/** Everything the canonical form says a (R, theta) pair must produce. */
function expected(R, thetaRad) {
  return {
    radius: R,
    diameter: 2 * R,
    chord: 2 * R * Math.sin(thetaRad / 2),
    halfChord: R * Math.sin(thetaRad / 2),
    angleDeg: thetaRad * DEG,
    arc: R * thetaRad,
    rise: R * (1 - Math.cos(thetaRad / 2)),
  };
}

function expectResultMatches(result, R, thetaRad) {
  const want = expected(R, thetaRad);
  for (const key of Object.keys(want)) {
    expect(result[key], `${key} for R=${R}, theta=${thetaRad}`).toBeCloseTo(want[key], 9);
  }
}

describe("deriveAll", () => {
  it("gives the textbook half circle: chord = diameter, rise = radius", () => {
    // A 180 degree segment of a unit circle: the chord IS the diameter and
    // the sagitta is the full radius.
    const d = deriveAll(1, Math.PI);
    expect(d.radius).toBeCloseTo(1, 12);
    expect(d.diameter).toBeCloseTo(2, 12);
    expect(d.chord).toBeCloseTo(2, 12);
    expect(d.halfChord).toBeCloseTo(1, 12);
    expect(d.angleDeg).toBeCloseTo(180, 12);
    expect(d.arc).toBeCloseTo(Math.PI, 12);
    expect(d.rise).toBeCloseTo(1, 12);
  });

  it("gives the equilateral case: 60 degrees on R=5 has chord = R", () => {
    // chord = 2*5*sin(30) = 5. The classic check a machinist can do in the head.
    const d = deriveAll(5, 60 / DEG);
    expect(d.chord).toBeCloseTo(5, 12);
    expect(d.arc).toBeCloseTo((5 * Math.PI) / 3, 12);
    expect(d.rise).toBeCloseTo(5 * (1 - Math.cos(Math.PI / 6)), 12);
  });

  it("halfChord is always half the chord", () => {
    for (const theta of [0.3, 1, Math.PI, 4]) {
      const d = deriveAll(7, theta);
      expect(d.halfChord * 2).toBeCloseTo(d.chord, 12);
    }
  });
});

describe("solveChord round trips", () => {
  // Every supported pair must recover the same segment it was derived from.
  const MINOR_PAIRS = [
    ["angleDeg", "radius"], ["chord", "radius"], ["arc", "radius"],
    ["radius", "rise"], ["angleDeg", "chord"], ["angleDeg", "arc"],
    ["angleDeg", "rise"], ["chord", "rise"], ["arc", "chord"], ["arc", "rise"],
  ];

  it.each(MINOR_PAIRS)("recovers a 60 degree segment from %s + %s", (a, b) => {
    const R = 12.5;
    const theta = 60 / DEG;
    const full = expected(R, theta);
    const { result, errs } = solveChord({ [a]: full[a], [b]: full[b] });
    expect(errs, `unexpected errors: ${JSON.stringify(errs)}`).toBeUndefined();
    expectResultMatches(result, R, theta);
  });

  // A major segment (past a half circle). radius+chord is excluded: the
  // module documents a minor-arc convention for that pair. arc+rise is
  // excluded: the module documents that it rejects this range as ambiguous.
  const MAJOR_PAIRS = [
    ["angleDeg", "radius"], ["arc", "radius"], ["radius", "rise"],
    ["angleDeg", "chord"], ["angleDeg", "arc"], ["angleDeg", "rise"],
    ["chord", "rise"], ["arc", "chord"],
  ];

  it.each(MAJOR_PAIRS)("recovers a 270 degree segment from %s + %s", (a, b) => {
    const R = 3;
    const theta = 270 / DEG;
    const full = expected(R, theta);
    const { result, errs } = solveChord({ [a]: full[a], [b]: full[b] });
    expect(errs, `unexpected errors: ${JSON.stringify(errs)}`).toBeUndefined();
    expectResultMatches(result, R, theta);
  });

  it("takes the minor arc when radius + chord is ambiguous, as documented", () => {
    // R=3, chord=2*3*sin(135) is the same chord as a 90 degree segment.
    // The stated convention is theta <= 180, so 90 is the answer, not 270.
    const R = 3;
    const chord = 2 * R * Math.sin((270 / DEG) / 2);
    const { result } = solveChord({ radius: R, chord });
    expect(result.angleDeg).toBeCloseTo(90, 9);
    expect(result.angleDeg).toBeLessThanOrEqual(180);
  });

  it("reports which two inputs were used", () => {
    const { given } = solveChord({ radius: 10, angleDeg: 45 });
    expect([...given].sort()).toEqual(["angleDeg", "radius"]);
  });
});

describe("solveChord input validation", () => {
  it("asks for two values when given none or one", () => {
    expect(solveChord({}).errs.join(" ")).toContain("any two of the five");
    expect(solveChord({ radius: 10 }).errs.join(" ")).toContain("any two of the five");
  });

  it("refuses three or more values and names them", () => {
    const { errs } = solveChord({ radius: 10, chord: 5, angleDeg: 30 });
    expect(errs.join(" ")).toContain("exactly two of the five, not 3");
    expect(errs.join(" ")).toContain("included angle");
  });

  it("refuses non-positive numbers", () => {
    expect(solveChord({ radius: -1, angleDeg: 30 }).errs.join(" ")).toContain("positive number");
    expect(solveChord({ radius: 0, angleDeg: 30 }).errs.join(" ")).toContain("positive number");
  });

  it("refuses an included angle of a full circle or more", () => {
    expect(solveChord({ radius: 10, angleDeg: 360 }).errs.join(" ")).toContain("full circle");
    expect(solveChord({ radius: 10, angleDeg: 400 }).errs.join(" ")).toContain("full circle");
  });

  it("refuses a chord longer than the diameter", () => {
    expect(solveChord({ radius: 5, chord: 10.001 }).errs.join(" ")).toContain("longer than the diameter");
  });

  it("refuses an arc of a full circle or more on that radius", () => {
    expect(solveChord({ radius: 5, arc: 2 * Math.PI * 5 }).errs.join(" ")).toContain("full circle");
  });

  it("refuses a rise greater than the diameter", () => {
    expect(solveChord({ radius: 5, rise: 10.001 }).errs.join(" ")).toContain("sagitta");
  });

  it("refuses a chord that is not shorter than its arc", () => {
    // The straight line across is always shorter than the way round.
    expect(solveChord({ arc: 10, chord: 10 }).errs.join(" ")).toContain("shorter than its arc");
    expect(solveChord({ arc: 10, chord: 11 }).errs.join(" ")).toContain("shorter than its arc");
  });

  it("refuses arc + rise past a half circle, where the pair is ambiguous", () => {
    const R = 3;
    const theta = 270 / DEG;
    const full = expected(R, theta);
    expect(solveChord({ arc: full.arc, rise: full.rise }).errs.join(" ")).toContain("two possible answers");
  });

  it("never returns a segment of a full circle or more", () => {
    // The module refuses an INPUT angle of 360 or more because "a chord needs
    // less than 360". A result it computes itself must obey the same rule.
    const { result, errs } = solveChord({ radius: 1, rise: 2 });
    if (result) expect(result.angleDeg).toBeLessThan(360);
    else expect(errs.length).toBeGreaterThan(0);
  });
});

describe("solvePattern", () => {
  it("spaces n features evenly and subtends each as a chord on the diameter", () => {
    // w=10 on d=100: subtended = 2*asin(10/100) = 11.4783...
    const { result, errs } = solvePattern(4, 10, 100, 0);
    expect(errs).toBeUndefined();
    expect(result.pitchDeg).toBeCloseTo(90, 12);
    expect(result.alphaDeg).toBeCloseTo(2 * Math.asin(0.1) * DEG, 12);
    expect(result.rows.map((r) => r.centre)).toEqual([0, 90, 180, 270]);
    expect(result.rows.map((r) => r.n)).toEqual([1, 2, 3, 4]);
  });

  it("puts lead and trail half the subtended angle either side of centre", () => {
    const { result } = solvePattern(4, 10, 100, 0);
    const half = result.alphaDeg / 2;
    expect(result.rows[1].lead).toBeCloseTo(90 - half, 9);
    expect(result.rows[1].trail).toBeCloseTo(90 + half, 9);
  });

  it("wraps every angle into [0, 360)", () => {
    const { result } = solvePattern(6, 5, 80, -90);
    for (const row of result.rows) {
      for (const key of ["centre", "lead", "trail"]) {
        expect(row[key], `${key} on row ${row.n}`).toBeGreaterThanOrEqual(0);
        expect(row[key], `${key} on row ${row.n}`).toBeLessThan(360);
      }
    }
    expect(result.rows[0].centre).toBeCloseTo(270, 9);
    // Row 1's leading edge sits just before 270, not at a negative angle.
    expect(result.rows[0].lead).toBeCloseTo(270 - result.alphaDeg / 2, 9);
  });

  it("honours a start angle", () => {
    const { result } = solvePattern(3, 5, 100, 30);
    expect(result.startDeg).toBe(30);
    expect(result.rows.map((r) => Math.round(r.centre))).toEqual([30, 150, 270]);
  });

  it("treats a missing start angle as zero", () => {
    const { result } = solvePattern(2, 5, 100, NaN);
    expect(result.startDeg).toBe(0);
    expect(result.rows[0].centre).toBe(0);
  });

  it("gives a single feature the whole circle as its pitch", () => {
    const { result } = solvePattern(1, 5, 100, 0);
    expect(result.pitchDeg).toBe(360);
    expect(result.rows).toHaveLength(1);
  });

  it("refuses features that would overlap", () => {
    // 36 features at 10 degree pitch, each subtending 11.47 degrees.
    const { errs } = solvePattern(36, 10, 100, 0);
    expect(errs.join(" ")).toContain("overlap");
  });

  it("refuses a width that will not fit as a chord on the diameter", () => {
    expect(solvePattern(4, 100, 100, 0).errs.join(" ")).toContain("won't fit as a chord");
    expect(solvePattern(4, 150, 100, 0).errs.join(" ")).toContain("won't fit as a chord");
  });

  it("refuses a feature count that is not a whole number of at least one", () => {
    expect(solvePattern(0, 5, 100, 0).errs.join(" ")).toContain("whole number");
    expect(solvePattern(2.5, 5, 100, 0).errs.join(" ")).toContain("whole number");
    expect(solvePattern(NaN, 5, 100, 0).errs.join(" ")).toContain("whole number");
  });

  it("refuses a non-positive width or diameter", () => {
    expect(solvePattern(4, 0, 100, 0).errs.join(" ")).toContain("Feature width");
    expect(solvePattern(4, 5, 0, 0).errs.join(" ")).toContain("Diameter");
  });
});
