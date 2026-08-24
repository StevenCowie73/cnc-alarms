# Slot Ramp Calculator — Knowledge & Build Spec

**Origin:** Night-shift session, Aug 14 2026. Math and workflow developed on real casing hanger rework jobs at Cactus Wellhead, validated against "The Machinist's Friend" (1996) chord calculator and against a proven running Mazatrol sub program. First artifact prototype tested at the machine: **identical results to Machinist's Friend, with fewer inputs and more output.**

---

## 1. The problem this solves

Milled slots on wellhead components (casing hangers, wear bushings, running tools) often end in a tangent radius ramp: the cutter feeds along the slot floor, then arcs up and out through the face in one smooth move. The programmer must find **where the floor ends and the ramp begins** (the tangent start position) so the arc lands exactly at the breakout point at the correct radius.

The legacy workflow: feed radius + depth into an old chord calculator, get a chord/segment number, halve or interpret it, read the breakout position off the print, subtract by hand on a clipboard, then hand-write a depth ladder of 15+ program lines. Multiple manual steps, each an error opportunity.

## 2. The core formula

For a ramp of radius **R**, tangent to the slot floor, climbing total depth **D** to exit at the face:

```
run = √( D × (2R − D) )
start position = breakout X − run
```

Derivation: the arc's center sits R above the tangent point on the floor. Intersecting that circle with the face level and applying Pythagoras: run² + (R − D)² = R², which rearranges to run = √(D(2R−D)).

**Behavior:** deeper slot → longer run; larger radius → longer run (gentler ramp needs more room).

**Hard constraint:** D must be < R. A tangent arc cannot climb higher than its own radius while still moving outward. (At D = R the exit is vertical; beyond that the geometry is invalid.) This is a required validation in any tool.

**Verification identity:** distance from arc center to breakout point must equal R:
`√(run² + (R−D)²) = R`. A calculator should compute and display this check.

## 3. Validated worked examples (real jobs)

Both jobs: Cactus Wellhead casing hanger rework, 1.5" end mill (slot width = cutter width, no side-stepping), breakout X 12.775, ramp R 3.0, slot cut on sub-spindle side, WPCSHIFT places program zero on the print datum, C-axis indexes an 8-slot pattern at 45°.

| Job | Depth D (from print) | Run | Start X | Ladder |
|---|---|---|---|---|
| **MD19347** (proven, parts cut) | 5.81 − 4.38 = **1.43** | √(1.43×4.57) = **2.5565** | 12.775 − 2.5565 = **10.2185** | −0.1 … −1.4 by .1, finish −1.43 |
| **MD17485** (validated vs Machinist's Friend) | 5.81 − 4.25 = **1.56** | √(1.56×4.44) = **2.6318** | 12.775 − 2.6318 = **10.1432** | −0.1 … −1.5 by .1, then −1.53, −1.56 |

Note how depth is usually **not a direct print callout** — it's the difference of two dimensions (e.g. 5.81 − 4.25). The tool's help text must teach this.

## 4. The proven sub program structure (Mazatrol MANL PRG)

Reference: sub 9347S, running production. Structure per lap, in order:

```
SNo  G1  G2   DATA
 1            S 1600.   M 3
 2            M 51
 3   0   18   X 7.   Z 1.   Y 0.        <- plane select + safe start
 --- repeat per depth step ---
     0        Z -0.1                     <- plunge to depth
     1        X 10.2185   F 0.012        <- feed along floor (F first pass only)
     1   2    Z 1.33   X 12.775   R 3.   <- tangent arc out; arc-end Z = D + plungeZ
     0        Z 2.                       <- retract
     0        X 7.                       <- return to clearance
 --- final pass ---
     1   2    Z 0.   X 12.775   R 3.     <- last arc lands exactly at face (Z 0)
     0        Z 4.                       <- taller final retract
END  CONTI 1
```

Key invariants:
- **Arc-end Z = D − current depth** every pass (1.33, 1.23 … 0.13, 0.03, 0.) — identical exit geometry each lap.
- **F on the first feed line only**; control carries it forward.
- Radius is produced **by toolpath, not dwell**; ramp exits into air above the OD so the cutter never dead-stops in a corner.
- Depth ladder: .100 per roughing pass; **.030 finish skim** on the last pass. If depth doesn't divide evenly, split the remainder so the final pass stays light (e.g. D=1.56: rough to −1.5, then −1.53, then −1.56).

Design virtue worth preserving: when the print changes, edits are **three predictable substitutions** (feed-target X, arc-end Z column shift, ladder extension). Robust and verifiable beats seconds saved.

## 5. Calculator spec (built & field-validated as React artifact)

**Inputs (5):** slot depth D · ramp radius R · breakout X · step per pass (default 0.1) · finish skim (default 0.03)

**Outputs:** run · start X · arc check (center→breakout = R, ✓/✗) · pass count · full pass table (plunge Z, feed X, arc-end X, R, arc-end Z per lap, final pass highlighted) · **generated MANL PRG** in the 9347S structure with SNo/G1/G2 columns and Mazatrol number formatting (trailing dot on whole values).

**Program options (defaults from proven sub):** Clear X 7 · Feed F 0.012 · Speed S 1600 · Safe Z 1 · Retract Z 2 · Final Z 4.

**UX requirements (from field test):**
- Explicit **CALCULATE** button; results clear when any input changes (prevents reading stale numbers — a scrap-part risk, not a cosmetic choice).
- **? help dot per field** with plain shop language: what the number is, where on the print it comes from, the subtraction example for depth. Global Help explains the tool in 4 steps. Target user: someone with little programming knowledge.
- Example loader buttons for both validated jobs (answer key + teaching tool).
- Copy-as-text for pass table and program.
- Phone-first: big touch targets, dark shop-floor palette (Mazatrol-style: near-black bg, orange accent, cyan/yellow axis colors, monospace numerics).
- Validations: positive numbers; **D > R rejected** with explanation.
- Footer disclaimer: verify against a proven program and dry-run before cutting.

**Field test result:** matched Machinist's Friend exactly on MD17485 (half-chord 2.6318 → start 10.1432) while requiring fewer inputs and producing the full pass table + program instead of one intermediate number.

## 6. Build notes for production (tools.cowie.ai)

- Port the validated `.jsx` component to a Next.js page (e.g. `/tools/slot-ramp`). Pure client-side math; no backend, no API cost.
- Add meta tags + PWA manifest for home-screen install; must work on shop wifi and load instantly.
- Keep math, copy, and help content **exactly as validated** — they've been through a real machinist test.
- Cross-link with alarms.cowie.ai and mazatrol.cowie.ai (existing handoff-chain pattern).
- Sister tools to follow, same "print numbers in → control-ready numbers out" philosophy:
  1. **Chord / bolt-pattern calculator** (replaces Machinist's Friend generally: any two of R/chord/angle/arc/sagitta; n-slots-of-width-w-on-diameter-d → C-axis centerlines). Related shop math: slot width w as chord on diameter d subtends angle = 2·asin(w/d); e.g. 1.50 on Ø11.5 → 15.0°.
  2. **Wear comp helper** (desired depth change → signed WEAR COMP øX value; handles the diameter-vs-radius ×2 trap and the cos-45° correction for depth measured normal to a tapered face).
- Moat: designed from the machinist's side of the table. Every feature traces to a real shop-floor workflow, not a geometry textbook.
