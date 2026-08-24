"use client";

import { useState, useMemo } from "react";
import { solveSize, solveTaper } from "./wearCompMath";

// ---- palette: Mazatrol night-shift (same as the other /tools) ----
const C = {
  bg: "#0B0D11",
  panel: "#141821",
  panelEdge: "#1F2531",
  header: "#1A2130",
  orange: "#FF7A1A",
  orangeDim: "#B35512",
  cyan: "#5BC8F5",
  yellow: "#F5D34C",
  green: "#7CE38B",
  red: "#FF5C5C",
  text: "#E8E6E0",
  dim: "#8B93A3",
};

const mono = "ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace";
const sans = "-apple-system, 'Segoe UI', Roboto, sans-serif";

const fx = (n, d = 4) => (Number.isFinite(n) ? n.toFixed(d) : "—");
// Signed, for the comp itself: an explicit + so the machinist keys the sign.
const fs = (n, d = 4) => (Number.isFinite(n) ? (n > 0 ? "+" : "") + n.toFixed(d) : "—");

const SIZE_EXAMPLES = {
  dia: {
    label: "Ø mic: 5.008 vs 5.000",
    values: { measured: "5.008", target: "5.000", basis: "dia" },
  },
  side: {
    label: "Per side: 0.004 over",
    values: { measured: "0.504", target: "0.500", basis: "side" },
  },
};

const TAPER_EXAMPLE = { measured: "0.0035", target: "0", angle: "45" };

const HELP = {
  about: {
    title: "What this tool does",
    body: [
      "You measured a feature, it's out of spec, and you need the signed WEAR COMP øX value to key into the control. This tool turns the measurement into that number and says the direction in plain words.",
      "SIZE mode: measured vs target size, either straight off a Ø mic or as a per-side number. Mazatrol wear comp is a DIAMETER value, so a per-side error gets doubled — the tool shows the doubling happen instead of doing it silently.",
      "TAPER mode: for a face at an angle, measured square (normal) to the face — like the 45° serration face on a casing hanger. A radial comp only moves an angled face by cos(angle) of the move, so the measured error gets divided by cos(angle) on its way to the comp. Every step is shown.",
      "How to use it: 1) Tap an example. 2) Enter your numbers. 3) Press CALCULATE. 4) Read the plain-words line, check the sign makes sense, key the comp.",
      "Always sanity-check the direction and take a light test cut before trusting a comp. This does the math — you're still the machinist.",
    ],
  },
  measuredSize: {
    title: "Measured size",
    body: [
      "What the part actually is — the mic or bore-gauge reading.",
      "Enter a SIZE, not a depth of cut: bigger number must mean a bigger part, or the sign comes out backwards. If you measured a groove depth, work out the resulting size first.",
    ],
  },
  targetSize: {
    title: "Target size",
    body: [
      "The print dimension you're shooting for — usually the middle of the tolerance, not the edge of it.",
      "Aim mid-tolerance and the next part has room to drift both ways.",
    ],
  },
  basis: {
    title: "Measured on Ø or per side?",
    body: [
      "On diameter (Ø): you measured across the part — mic, bore gauge. The error is already a diameter number and goes on the comp as-is.",
      "Per side: the number is radial — one wall, one side, a step from a surface. WEAR COMP øX is a DIAMETER value, so a per-side error counts TWICE: 0.004 per side means the diameter is out by 0.008, and that's what gets entered. This ×2 is the classic trap — the tool shows both numbers so you see it happen.",
    ],
  },
  measuredTaper: {
    title: "Measured (square to face)",
    body: [
      "The reading taken square (normal) to the angled face — a depth mic or indicator sitting perpendicular to the face itself, not along the part axis.",
      "For the serration job this is how far the face sits proud of where it should be. Use 0 for the target if the face just needs to clean up flush.",
    ],
  },
  targetTaper: {
    title: "Target (square to face)",
    body: [
      "Where the face should be, measured the same way — square to the face. Enter 0 if the measured number is already 'how much needs to come off'.",
    ],
  },
  angle: {
    title: "Face angle",
    body: [
      "The angle between the face and the part centreline. A 45° chamfer or serration face is 45. Steeper toward a square shoulder face is closer to 90; shallower toward a straight diameter is closer to 0.",
      "Why it matters: an X comp moves the tool radially, but an angled face only moves cos(angle) of that in its own square-on direction. At 45° that's 0.7071 — so the comp has to be bigger than the error you measured, by ÷cos(45°) and then ×2 for diameter.",
      "At 90° the face is square to the axis and X can't move it at all — that correction belongs on Z, and the tool will tell you so.",
    ],
  },
  sign: {
    title: "Which way is minus?",
    body: [
      "Negative WEAR COMP øX brings the cutting point toward the centreline: a smaller OD, a smaller bore. Positive moves it away: bigger OD, bigger bore. That's why oversize gives you a minus number.",
      "A plus comp means the next cut leaves more material. On an OD that can save an oversize part (re-cut it); an undersize OD is gone — no comp adds metal back. Bores are the mirror image.",
      "Sub-spindle work and reversed tool orientations can flip the effective direction — verify with a light test cut before trusting a sign on a setup you haven't comped before.",
    ],
  },
};

function HelpDot({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Help"
      style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        border: `1.5px solid ${C.dim}`,
        background: "transparent",
        color: C.dim,
        fontFamily: sans,
        fontSize: 12.5,
        fontWeight: 700,
        lineHeight: "19px",
        padding: 0,
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      ?
    </button>
  );
}

function Field({ label, sub, value, onChange, onHelp }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 600, color: C.text, letterSpacing: 0.3, whiteSpace: "nowrap" }}>
          {label}
        </span>
        {onHelp && <HelpDot onClick={(e) => { e.preventDefault(); onHelp(); }} />}
        {sub && (
          <span style={{ fontFamily: sans, fontSize: 10.5, color: C.dim, marginLeft: "auto", textAlign: "right" }}>{sub}</span>
        )}
      </div>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: "#0E1118",
          border: `1px solid ${C.panelEdge}`,
          borderRadius: 8,
          color: C.text,
          fontFamily: mono,
          fontSize: 22,
          fontWeight: 500,
          padding: "12px 14px",
          outline: "none",
        }}
      />
    </label>
  );
}

function Readout({ label, value, color, big }) {
  return (
    <div
      style={{
        background: "#0E1118",
        border: `1px solid ${C.panelEdge}`,
        borderRadius: 8,
        padding: big ? "12px 14px" : "10px 12px",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ fontFamily: sans, fontSize: 10.5, color: C.dim, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: mono, fontSize: big ? 26 : 18, fontWeight: 600, color, wordBreak: "break-all" }}>
        {value}
      </div>
    </div>
  );
}

function CopyBtn({ onCopy, copied }) {
  return (
    <button
      onClick={onCopy}
      style={{
        background: copied ? C.green : "transparent",
        border: `1px solid ${copied ? C.green : C.dim}`,
        borderRadius: 6,
        color: copied ? "#0B0D11" : C.dim,
        fontFamily: sans,
        fontSize: 11.5,
        fontWeight: 600,
        padding: "5px 10px",
        cursor: "pointer",
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function WearCompCalculator() {
  const [mode, setMode] = useState("size");
  const [sm, setSm] = useState(SIZE_EXAMPLES.dia.values.measured);
  const [st, setSt] = useState(SIZE_EXAMPLES.dia.values.target);
  const [basis, setBasis] = useState(SIZE_EXAMPLES.dia.values.basis);
  const [tm, setTm] = useState(TAPER_EXAMPLE.measured);
  const [tt, setTt] = useState(TAPER_EXAMPLE.target);
  const [angle, setAngle] = useState(TAPER_EXAMPLE.angle);
  const [calculated, setCalculated] = useState(false);
  const [helpKey, setHelpKey] = useState(null);
  const [copied, setCopied] = useState(false);

  const stale = () => setCalculated(false);
  const wrap = (setter) => (v) => { setter(v); stale(); };
  const switchMode = (m) => { setMode(m); stale(); };
  const setBasisAnd = (b) => { setBasis(b); stale(); };

  const sizeCalc = useMemo(
    () => solveSize({ measured: parseFloat(sm), target: parseFloat(st), basis }),
    [sm, st, basis],
  );
  const taperCalc = useMemo(
    () => solveTaper({ measured: parseFloat(tm), target: parseFloat(tt), angleDeg: parseFloat(angle) }),
    [tm, tt, angle],
  );

  const calc = mode === "size" ? sizeCalc : taperCalc;
  const showResults = calculated && calc.result;
  const showErrors = calculated && calc.errs && calc.errs.length > 0;
  const help = helpKey ? HELP[helpKey] : null;
  const r = calc.result;

  const loadSizeExample = (key) => {
    const e = SIZE_EXAMPLES[key].values;
    setSm(e.measured); setSt(e.target); setBasis(e.basis); stale();
  };
  const loadTaperExample = () => {
    setTm(TAPER_EXAMPLE.measured); setTt(TAPER_EXAMPLE.target); setAngle(TAPER_EXAMPLE.angle); stale();
  };

  // The plain-words line — the sentence the machinist sanity-checks.
  const words = () => {
    if (!r) return "";
    if (r.direction === "on-size") return "Already at target — no comp needed.";
    const dir = r.direction === "oversize" ? (mode === "size" ? "oversize" : "proud") : (mode === "size" ? "undersize" : "past target");
    if (mode === "size") {
      const how = r.basis === "dia" ? "on diameter" : `per side (${fx(Math.abs(r.errDia))} on diameter)`;
      return `Part is ${fx(Math.abs(r.errSide * (r.basis === "dia" ? 2 : 1)))} ${dir} ${how} — enter ${fs(r.comp)} on WEAR COMP øX to bring it in.`;
    }
    return `Face is ${fx(Math.abs(r.errNormal))} ${dir}, measured square to the ${fx(r.angleDeg, 0)}° face — enter ${fs(r.comp)} on WEAR COMP øX.`;
  };

  const doCopy = () => {
    if (!r) return;
    let text;
    if (mode === "size") {
      text = [
        `WEAR COMP — measured ${sm} / target ${st} (${r.basis === "dia" ? "on diameter" : "per side"})`,
        `Error per side   ${fs(r.errSide)}`,
        `Error on Ø (×2)  ${fs(r.errDia)}`,
        `WEAR COMP øX     ${fs(r.comp)}`,
        words(),
      ].join("\n");
    } else {
      text = [
        `WEAR COMP — ${fx(r.angleDeg, 0)}° face, measured ${tm} / target ${tt} square to face`,
        `Error square to face      ${fs(r.errNormal)}`,
        `÷ cos(${fx(r.angleDeg, 0)}°) = per side   ${fs(r.errSide)}`,
        `× 2 = on diameter         ${fs(r.errDia)}`,
        `WEAR COMP øX              ${fs(r.comp)}`,
        words(),
      ].join("\n");
    }
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const tabStyle = (on) => ({
    flex: 1,
    background: on ? C.orange : "transparent",
    border: `1.5px solid ${on ? C.orange : C.panelEdge}`,
    borderRadius: 10,
    color: on ? "#0B0D11" : C.dim,
    fontFamily: sans,
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: 1,
    padding: "13px 10px",
    cursor: "pointer",
  });

  const basisBtn = (key, label) => (
    <button
      onClick={() => setBasisAnd(key)}
      style={{
        flex: 1,
        background: basis === key ? "#1E2634" : "transparent",
        border: `1.5px solid ${basis === key ? C.cyan : C.panelEdge}`,
        borderRadius: 8,
        color: basis === key ? C.cyan : C.dim,
        fontFamily: sans,
        fontSize: 13,
        fontWeight: 700,
        padding: "11px 8px",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  const exampleBtn = (label, onClick, key) => (
    <button
      key={key}
      onClick={onClick}
      style={{
        flex: 1,
        background: "transparent",
        border: `1px solid ${C.orangeDim}`,
        borderRadius: 8,
        color: C.orange,
        fontFamily: sans,
        fontSize: 12.5,
        fontWeight: 600,
        padding: "10px 8px",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "0 0 48px" }}>
      <div
        style={{
          background: C.header,
          borderBottom: `2px solid ${C.orange}`,
          padding: "14px 16px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontFamily: mono, fontSize: 17, fontWeight: 700, color: C.text, letterSpacing: 0.5 }}>
            WEAR COMP <span style={{ color: C.orange }}>CALC</span>
          </div>
          <div style={{ fontFamily: sans, fontSize: 11, color: C.dim, marginTop: 2 }}>
            signed øX comp · the ×2 trap · cos(angle) faces
          </div>
        </div>
        <button
          onClick={() => setHelpKey("about")}
          style={{
            background: "transparent",
            border: `1.5px solid ${C.orange}`,
            borderRadius: 8,
            color: C.orange,
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 700,
            padding: "8px 14px",
            cursor: "pointer",
          }}
        >
          Help
        </button>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px 14px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button onClick={() => switchMode("size")} style={tabStyle(mode === "size")}>
            SIZE
          </button>
          <button onClick={() => switchMode("taper")} style={tabStyle(mode === "taper")}>
            TAPERED FACE
          </button>
        </div>

        {mode === "size" ? (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {Object.entries(SIZE_EXAMPLES).map(([key, e]) => exampleBtn(e.label, () => loadSizeExample(key), key))}
            </div>

            <div
              style={{
                background: C.panel,
                border: `1px solid ${C.panelEdge}`,
                borderRadius: 12,
                padding: 16,
                display: "grid",
                gap: 14,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Measured" sub="what it mics" value={sm} onChange={wrap(setSm)} onHelp={() => setHelpKey("measuredSize")} />
                <Field label="Target" sub="print, mid-tolerance" value={st} onChange={wrap(setSt)} onHelp={() => setHelpKey("targetSize")} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 600, color: C.text, letterSpacing: 0.3 }}>
                    Measured on
                  </span>
                  <HelpDot onClick={() => setHelpKey("basis")} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {basisBtn("dia", "Ø diameter")}
                  {basisBtn("side", "Per side (radial)")}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {exampleBtn("45° serration face (validated job)", loadTaperExample, "t")}
            </div>

            <div
              style={{
                background: C.panel,
                border: `1px solid ${C.panelEdge}`,
                borderRadius: 12,
                padding: 16,
                display: "grid",
                gap: 14,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Measured" sub="square to the face" value={tm} onChange={wrap(setTm)} onHelp={() => setHelpKey("measuredTaper")} />
                <Field label="Target" sub="0 = clean up flush" value={tt} onChange={wrap(setTt)} onHelp={() => setHelpKey("targetTaper")} />
              </div>
              <Field label="Face angle" sub="from the part axis · 45 = chamfer" value={angle} onChange={wrap(setAngle)} onHelp={() => setHelpKey("angle")} />
            </div>
          </>
        )}

        <button
          onClick={() => setCalculated(true)}
          style={{
            width: "100%",
            marginTop: 14,
            background: C.orange,
            border: "none",
            borderRadius: 10,
            color: "#0B0D11",
            fontFamily: sans,
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: 1.5,
            padding: "16px 12px",
            cursor: "pointer",
          }}
        >
          CALCULATE
        </button>

        {showErrors && (
          <div
            style={{
              marginTop: 14,
              background: "#1C0F10",
              border: `1px solid ${C.red}`,
              borderRadius: 10,
              padding: "12px 14px",
              display: "grid",
              gap: 8,
            }}
          >
            {calc.errs.map((e, i) => (
              <div key={i} style={{ fontFamily: sans, fontSize: 13.5, color: C.red, lineHeight: 1.5 }}>
                {e}
              </div>
            ))}
          </div>
        )}

        {showResults && (
          <>
            <div
              style={{
                marginTop: 16,
                background: "#122016",
                border: `1px solid ${C.green}`,
                borderRadius: 10,
                padding: "12px 14px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <span style={{ fontFamily: sans, fontSize: 14.5, color: C.text, lineHeight: 1.55 }}>{words()}</span>
              <CopyBtn onCopy={doCopy} copied={copied} />
            </div>

            {/* The chain — every conversion visible, nothing silent. */}
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              {mode === "size" ? (
                <>
                  <Readout label="Error per side" value={fs(r.errSide)} color={C.text} />
                  <Readout label={r.basis === "side" ? "× 2 → error on Ø" : "Error on Ø"} value={fs(r.errDia)} color={r.basis === "side" ? C.yellow : C.text} />
                </>
              ) : (
                <>
                  <Readout label="Sq. to face" value={fs(r.errNormal)} color={C.text} />
                  <Readout label={`÷ cos(${fx(r.angleDeg, 0)}°) → side`} value={fs(r.errSide)} color={C.yellow} />
                  <Readout label="× 2 → on Ø" value={fs(r.errDia)} color={C.yellow} />
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "stretch" }}>
              <Readout label="WEAR COMP øX — enter this" value={fs(r.comp)} color={C.cyan} big />
            </div>

            {r.big && (
              <div
                style={{
                  marginTop: 12,
                  background: "#221B0E",
                  border: `1px solid ${C.yellow}`,
                  borderRadius: 10,
                  padding: "12px 14px",
                }}
              >
                <span style={{ fontFamily: sans, fontSize: 13.5, color: C.yellow, lineHeight: 1.5 }}>
                  That&rsquo;s a big number for a wear comp. Double-check the inputs — corrections this size usually
                  belong in the tool geometry offset, not wear.
                </span>
              </div>
            )}

            <div style={{ marginTop: 12, padding: "0 2px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: sans, fontSize: 11.5, color: C.dim, lineHeight: 1.5 }}>
                Minus brings the cutting point toward centre — smaller OD, smaller bore. Values exact, never rounded
                to legacy readouts. Sub-spindle and reversed tools can flip the sign.
              </span>
              <HelpDot onClick={() => setHelpKey("sign")} />
            </div>
          </>
        )}

        <div style={{ marginTop: 24, padding: "0 2px" }}>
          <span style={{ fontFamily: sans, fontSize: 11.5, color: C.dim, lineHeight: 1.5 }}>
            Verify the direction on your setup and take a light test cut before trusting a comp. This does the math —
            you&rsquo;re still the machinist.
          </span>
        </div>
      </div>

      {/* help modal */}
      {help && (
        <div
          onClick={() => setHelpKey(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.72)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.panel,
              borderTop: `2px solid ${C.orange}`,
              borderRadius: "16px 16px 0 0",
              width: "100%",
              maxWidth: 560,
              maxHeight: "75vh",
              overflowY: "auto",
              padding: "18px 18px 28px",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.orange }}>{help.title}</span>
              <button
                onClick={() => setHelpKey(null)}
                style={{
                  background: "transparent",
                  border: `1px solid ${C.dim}`,
                  borderRadius: 8,
                  color: C.text,
                  fontFamily: sans,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "6px 14px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
            {help.body.map((p, i) => (
              <p key={i} style={{ fontFamily: sans, fontSize: 14.5, color: C.text, lineHeight: 1.65, margin: "0 0 12px" }}>
                {p}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
