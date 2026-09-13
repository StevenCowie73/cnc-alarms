// Wear comp math. Pure functions, no UI — kept separate from the
// component so it can be unit-tested directly with node (same layout as
// ../chord/chordMath.js).
//
// Sign convention: WEAR COMP øX is a DIAMETER value; negative brings the
// cutting point toward the centreline (smaller OD, smaller bore — both,
// because the tool touches the +X side either way on a standard setup).
// comp = target − measured on a diameter basis, so oversize → minus.
//
// The two traps this tool exists for:
//  ×2  — a per-side (radial) error doubles on the øX comp.
//  cos — a face at angle A from the part axis moves only cos(A) of a
//        radial tool move when you measure square (normal) to the face,
//        so a normal-measured error needs DIVIDING by cos(A) on its way
//        to the comp: comp = 2·(target − measured) / cos(A).
//        The maths runs from A = 0 (a straight diameter, full effect) to
//        A = 90 (a square shoulder, where X does nothing — that's a Z
//        correction), but solveTaper accepts NEITHER end:
//          A = 0  is refused — it is not a taper at all, and solveSize
//                 already does that case properly on a diameter or
//                 per-side reading.
//          A = 90 is refused — no øX move can shift a square face.
//        So solveTaper's domain is 0 < A < 90. Whether A = 0 should instead
//        be accepted and routed to the same answer as solveSize is an open
//        question, deliberately left alone for now.

const RAD = Math.PI / 180;

// A comp bigger than this is flagged: wear comp is for small corrections,
// big moves usually belong in the tool geometry offset.
export const BIG_COMP = 0.03;

function direction(err) {
  if (Math.abs(err) < 1e-12) return "on-size";
  return err > 0 ? "oversize" : "undersize";
}

// Core case. basis: "dia" (measured across, Ø mic) | "side" (per-side /
// radial size — bigger number must mean bigger part).
export function solveSize({ measured, target, basis }) {
  const errs = [];
  if (!(measured > 0)) errs.push("Measured size needs a positive number — what the part actually mics.");
  if (!(target > 0)) errs.push("Target size needs a positive number — the print dimension you're shooting for.");
  if (basis !== "dia" && basis !== "side") errs.push("Pick how the size was measured — on diameter, or per side.");
  if (errs.length) return { errs };

  const errBasis = measured - target;                 // + = oversize
  const errSide = basis === "dia" ? errBasis / 2 : errBasis;
  const errDia = basis === "dia" ? errBasis : errBasis * 2;
  const comp = -errDia;                               // target − measured, on Ø
  return {
    result: {
      basis,
      errSide,
      errDia,
      comp,
      direction: direction(errBasis),
      big: Math.abs(comp) > BIG_COMP,
    },
  };
}

// Tapered face case: measured and target taken square (normal) to a face
// angled angleDeg from the part axis. Target 0 is allowed (flush).
export function solveTaper({ measured, target, angleDeg }) {
  const errs = [];
  if (!Number.isFinite(measured) || measured < 0)
    errs.push("Measured needs a number, 0 or more — the reading square off the face.");
  if (!Number.isFinite(target) || target < 0)
    errs.push("Target needs a number, 0 or more — use 0 if the face should clean up flush.");
  if (!Number.isFinite(angleDeg))
    errs.push("Face angle needs a number — the angle between the face and the part centreline (45 for a 45° face).");
  else if (angleDeg === 0)
    errs.push("A 0° face is a straight diameter, not a taper — use the plain size mode above (measured on diameter, or per side), which handles it. This mode wants a face angle over 0°.");
  else if (angleDeg < 0)
    errs.push(`A face angle of ${angleDeg}° is below zero — measure the angle between the face and the part centreline, as a positive number (45 for a 45° face).`);
  else if (angleDeg >= 90)
    errs.push(`A ${angleDeg}° face is square to the axis (or past it) — an X comp can't move it. That's a Z correction, not øX.`);
  if (errs.length) return { errs };

  const cosA = Math.cos(angleDeg * RAD);
  const errNormal = measured - target;                // + = proud (too much material)
  const errSide = errNormal / cosA;                   // radial move needed
  const comp = -2 * errSide;
  return {
    result: {
      angleDeg,
      cosA,
      errNormal,
      errSide,
      errDia: 2 * errSide,
      comp,
      direction: direction(errNormal),
      big: Math.abs(comp) > BIG_COMP,
    },
  };
}
