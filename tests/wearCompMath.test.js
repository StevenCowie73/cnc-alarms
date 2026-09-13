// Unit tests for app/tools/wear-comp/wearCompMath.js.
//
// Expected values come from the sign convention and the two traps written at
// the top of that module:
//   comp = target − measured, on a DIAMETER basis (so oversize -> minus)
//   x2   a per-side (radial) error doubles on the oX comp
//   cos  comp = 2*(target − measured) / cos(A) for a face at angle A
// They are NOT taken from what the implementation currently returns.

import { describe, expect, it } from "vitest";
import { BIG_COMP, solveSize, solveTaper } from "../app/tools/wear-comp/wearCompMath.js";

describe("solveSize on a diameter measurement", () => {
  it("comps minus when the part mics oversize", () => {
    // 25.05 on a 25.00 print: 0.05 too big on diameter, so take 0.05 off.
    const { result } = solveSize({ measured: 25.05, target: 25.0, basis: "dia" });
    expect(result.errDia).toBeCloseTo(0.05, 12);
    expect(result.errSide).toBeCloseTo(0.025, 12);
    expect(result.comp).toBeCloseTo(-0.05, 12);
    expect(result.direction).toBe("oversize");
  });

  it("comps plus when the part mics undersize", () => {
    const { result } = solveSize({ measured: 24.98, target: 25.0, basis: "dia" });
    expect(result.errDia).toBeCloseTo(-0.02, 12);
    expect(result.comp).toBeCloseTo(0.02, 12);
    expect(result.direction).toBe("undersize");
  });

  it("reports on-size with no comp when measured equals target", () => {
    const { result } = solveSize({ measured: 25.0, target: 25.0, basis: "dia" });
    expect(result.comp).toBeCloseTo(0, 12);
    expect(result.direction).toBe("on-size");
    expect(result.big).toBe(false);
  });
});

describe("solveSize on a per-side measurement (the x2 trap)", () => {
  it("doubles a per-side error on its way to the oX comp", () => {
    // 0.02 too big per side is 0.04 too big on diameter.
    const { result } = solveSize({ measured: 10.02, target: 10.0, basis: "side" });
    expect(result.errSide).toBeCloseTo(0.02, 12);
    expect(result.errDia).toBeCloseTo(0.04, 12);
    expect(result.comp).toBeCloseTo(-0.04, 12);
  });

  it("gives exactly twice the comp of the same numbers read on diameter", () => {
    const side = solveSize({ measured: 10.02, target: 10.0, basis: "side" }).result;
    const dia = solveSize({ measured: 10.02, target: 10.0, basis: "dia" }).result;
    expect(side.comp).toBeCloseTo(2 * dia.comp, 12);
  });
});

describe("solveSize big-comp flag", () => {
  it("does not flag a comp equal to the threshold", () => {
    const { result } = solveSize({ measured: 10 + BIG_COMP, target: 10, basis: "dia" });
    expect(Math.abs(result.comp)).toBeCloseTo(BIG_COMP, 12);
    expect(result.big).toBe(false);
  });

  it("flags a comp past the threshold, either direction", () => {
    expect(solveSize({ measured: 10.05, target: 10, basis: "dia" }).result.big).toBe(true);
    expect(solveSize({ measured: 9.95, target: 10, basis: "dia" }).result.big).toBe(true);
  });
});

describe("solveSize input validation", () => {
  it("refuses a non-positive measured or target size", () => {
    expect(solveSize({ measured: 0, target: 10, basis: "dia" }).errs.join(" ")).toContain("Measured size");
    expect(solveSize({ measured: 10, target: -1, basis: "dia" }).errs.join(" ")).toContain("Target size");
  });

  it("refuses an unknown basis", () => {
    expect(solveSize({ measured: 10, target: 10, basis: "radius" }).errs.join(" ")).toContain("how the size was measured");
    expect(solveSize({ measured: 10, target: 10 }).errs.join(" ")).toContain("how the size was measured");
  });
});

describe("solveTaper on an angled face (the cos trap)", () => {
  it("divides a normal-measured error by cos(A) and doubles it for the oX comp", () => {
    // 0.1 proud measured square off a 45 degree face.
    const { result } = solveTaper({ measured: 0.1, target: 0, angleDeg: 45 });
    expect(result.cosA).toBeCloseTo(Math.SQRT1_2, 12);
    expect(result.errNormal).toBeCloseTo(0.1, 12);
    expect(result.errSide).toBeCloseTo(0.1 / Math.SQRT1_2, 12);
    expect(result.comp).toBeCloseTo((2 * (0 - 0.1)) / Math.SQRT1_2, 12);
    expect(result.direction).toBe("oversize");
  });

  it("needs four times the normal error on a 60 degree face", () => {
    // cos(60) = 0.5, so a radial move of 2x the reading, 4x on diameter.
    const { result } = solveTaper({ measured: 0.05, target: 0, angleDeg: 60 });
    expect(result.errSide).toBeCloseTo(0.1, 12);
    expect(result.comp).toBeCloseTo(-0.2, 12);
  });

  it("comps plus when the face is undersize (needs more material)", () => {
    const { result } = solveTaper({ measured: 0, target: 0.1, angleDeg: 45 });
    expect(result.direction).toBe("undersize");
    expect(result.comp).toBeCloseTo((2 * (0.1 - 0)) / Math.SQRT1_2, 12);
  });

  it("allows a target of zero, meaning clean up flush", () => {
    expect(solveTaper({ measured: 0.2, target: 0, angleDeg: 30 }).errs).toBeUndefined();
  });

  it("approaches the plain diameter case as the face angle approaches zero", () => {
    // The module documents A = 0 as "a straight diameter (full effect)", so
    // as A -> 0 the comp must converge on the plain 2*(target − measured).
    const { result } = solveTaper({ measured: 10.02, target: 10.0, angleDeg: 0.0001 });
    expect(result.comp).toBeCloseTo(2 * (10.0 - 10.02), 9);
  });

  it("refuses a zero degree face and points at the plain size mode", () => {
    // Behaviour deliberately unchanged: a 0 degree face is not a taper, and
    // solveSize already does that case. The message now says which mode to
    // use instead of only "over 0". Whether 0 should be ACCEPTED and routed
    // to the solveSize answer is an open question, not settled here.
    const { errs } = solveTaper({ measured: 10.02, target: 10.0, angleDeg: 0 });
    expect(errs).toBeDefined();
    expect(errs.join(" ")).toContain("straight diameter");
    expect(errs.join(" ")).toContain("per side");
  });

  it("refuses a negative face angle with its own message", () => {
    const { errs } = solveTaper({ measured: 0.1, target: 0, angleDeg: -45 });
    expect(errs.join(" ")).toContain("below zero");
  });
});

describe("solveTaper input validation", () => {
  it("refuses a square shoulder, which oX cannot move", () => {
    expect(solveTaper({ measured: 0.1, target: 0, angleDeg: 90 }).errs.join(" ")).toContain("Z correction");
    expect(solveTaper({ measured: 0.1, target: 0, angleDeg: 120 }).errs.join(" ")).toContain("square to the axis");
  });

  it("refuses a negative or non-numeric reading", () => {
    expect(solveTaper({ measured: -0.1, target: 0, angleDeg: 45 }).errs.join(" ")).toContain("Measured needs a number");
    expect(solveTaper({ measured: 0.1, target: -1, angleDeg: 45 }).errs.join(" ")).toContain("Target needs a number");
    expect(solveTaper({ measured: NaN, target: 0, angleDeg: 45 }).errs.join(" ")).toContain("Measured needs a number");
  });

  it("refuses a missing face angle", () => {
    expect(solveTaper({ measured: 0.1, target: 0, angleDeg: NaN }).errs.join(" ")).toContain("Face angle");
  });
});
