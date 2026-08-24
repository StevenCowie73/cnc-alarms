"use client";

import { useState, useMemo } from "react";
import { solveChord, solvePattern } from "./chordMath";

// ---- palette: Mazatrol night-shift (same as SlotRampCalculator) ----
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

const CHORD_FIELDS = [
  { key: "radius", label: "Radius R", sub: "half the Ø callout" },
  { key: "chord", label: "Chord", sub: "straight-line width" },
  { key: "angleDeg", label: "Included angle", sub: "degrees" },
  { key: "arc", label: "Arc length", sub: "along the curve" },
  { key: "rise", label: "Rise (sagitta)", sub: "chord to arc, at centre" },
];

const CHORD_EXAMPLES = {
  validated: {
    label: "1.50 chord on Ø11.5",
    values: { radius: "5.75", chord: "1.5", angleDeg: "", arc: "", rise: "" },
  },
  findR: {
    label: "Find R: chord 6 + rise .375",
    values: { radius: "", chord: "6", angleDeg: "", arc: "", rise: "0.375" },
  },
};

const PATTERN_EXAMPLE = { n: "8", w: "1.5", d: "11.5", start: "0" };

const HELP = {
  about: {
    title: "What this tool does",
    body: [
      "Two calculators in one, both about chords — the straight line across part of a circle.",
      "CHORD mode: give it any two of radius, chord, included angle, arc length and rise, and it works out the other three. That covers the old Machinist's Friend chord calculator and more — find a radius from a straightedge and feeler measurement, get the angle a slot width subtends, whatever pair the print gives you.",
      "PATTERN mode: for slots or flats spaced around a diameter. Give it how many, how wide, and the Ø they sit on — it gives you the C-axis centreline for every feature, plus each one's leading and trailing edge angle, ready for the program.",
      "How to use it: 1) Tap an example to see it filled in. 2) Enter your own numbers from the print. 3) Press CALCULATE. 4) Read the numbers or tap Copy.",
      "Always verify against the print and dry-run before cutting. This does the math — you're still the machinist.",
    ],
  },
  radius: {
    title: "Radius R",
    body: [
      "The radius of the circle the chord sits on — half the diameter.",
      "Prints usually give a Ø (diameter) callout. Halve it: Ø11.5 on the print means R 5.75 in here.",
    ],
  },
  chord: {
    title: "Chord",
    body: [
      "The straight-line distance across — corner to corner, not along the curve.",
      "A slot's width is a chord on the diameter it's cut into. A gauge pin resting across a bore measures a chord.",
      "It can never be longer than the diameter, and it's always shorter than its arc.",
    ],
  },
  angleDeg: {
    title: "Included angle",
    body: [
      "The angle the chord opens up at the centre of the circle, in degrees. Some prints call it the central or included angle.",
      "When you give the tool radius + chord, it answers with the smaller of the two possible angles (the minor arc, 180° or less) — that's the one prints mean.",
    ],
  },
  arc: {
    title: "Arc length",
    body: [
      "The distance along the curve between the two ends of the chord — what a flexible tape lying on the surface would read.",
      "Always longer than the chord. If your 'arc' number is shorter than your chord, the two are swapped or one is wrong.",
    ],
  },
  rise: {
    title: "Rise (sagitta)",
    body: [
      "The bulge height: from the middle of the chord straight out to the arc. Old books call it the sagitta.",
      "This is the shop-trick number — lay a straightedge across a curve and measure the gap at the middle with a feeler or depth mic. Chord + rise then gives you the radius of the part you can't reach around.",
    ],
  },
  n: {
    title: "Number of features",
    body: [
      "How many slots, flats or holes are spaced around the circle — 8 slots means enter 8.",
      "The tool spaces them evenly: pitch = 360 ÷ n. For an 8-slot pattern that's 45° apart.",
    ],
  },
  w: {
    title: "Feature width",
    body: [
      "The width of one slot or flat, straight across — the same number the print calls the slot width.",
      "It's treated as a chord on the diameter, so the tool can tell you the exact angle each feature takes up.",
    ],
  },
  d: {
    title: "Diameter Ø",
    body: [
      "The diameter the features are cut into — the Ø callout where the slot width is measured.",
      "Use the diameter, not the radius. 1.50-wide slots on Ø11.5 subtend just under 15° each.",
    ],
  },
  start: {
    title: "Start angle",
    body: [
      "Where the first feature's centreline sits on the C axis, in degrees. Leave it 0 if the first slot is on your zero.",
      "Everything shifts together: start at 10° and an 8-slot pattern lands at 10°, 55°, 100° and so on.",
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

export default function ChordCalculator() {
  const [mode, setMode] = useState("chord");
  const [cv, setCv] = useState(CHORD_EXAMPLES.validated.values);
  const [pn, setPn] = useState(PATTERN_EXAMPLE.n);
  const [pw, setPw] = useState(PATTERN_EXAMPLE.w);
  const [pd, setPd] = useState(PATTERN_EXAMPLE.d);
  const [pstart, setPstart] = useState(PATTERN_EXAMPLE.start);
  const [calculated, setCalculated] = useState(false);
  const [helpKey, setHelpKey] = useState(null);
  const [copied, setCopied] = useState("");

  const stale = () => setCalculated(false);
  const setChordField = (key) => (v) => { setCv((p) => ({ ...p, [key]: v })); stale(); };
  const wrap = (setter) => (v) => { setter(v); stale(); };
  const switchMode = (m) => { setMode(m); stale(); };

  const chordCalc = useMemo(() => {
    const nums = {};
    for (const f of CHORD_FIELDS) {
      const t = cv[f.key].trim();
      if (t !== "") nums[f.key] = parseFloat(t);
    }
    return solveChord(nums);
  }, [cv]);

  const patternCalc = useMemo(() => {
    const n = pn.trim() === "" ? NaN : Number(pn);
    return solvePattern(n, parseFloat(pw), parseFloat(pd), pstart.trim() === "" ? 0 : parseFloat(pstart));
  }, [pn, pw, pd, pstart]);

  const calc = mode === "chord" ? chordCalc : patternCalc;
  const showResults = calculated && calc.result;
  const showErrors = calculated && calc.errs && calc.errs.length > 0;
  const help = helpKey ? HELP[helpKey] : null;

  const loadChordExample = (key) => { setCv(CHORD_EXAMPLES[key].values); stale(); };
  const loadPatternExample = () => {
    setPn(PATTERN_EXAMPLE.n); setPw(PATTERN_EXAMPLE.w); setPd(PATTERN_EXAMPLE.d); setPstart(PATTERN_EXAMPLE.start);
    stale();
  };

  const doCopy = (kind) => {
    let text = "";
    if (kind === "chord" && chordCalc.result) {
      const r = chordCalc.result;
      const given = chordCalc.given;
      const mark = (k) => (given.includes(k) ? "  (given)" : "");
      text = [
        "CHORD GEOMETRY",
        `Radius        ${fx(r.radius)}${mark("radius")}`,
        `Diameter      ${fx(r.diameter)}`,
        `Chord         ${fx(r.chord)}${mark("chord")}`,
        `Half-chord    ${fx(r.halfChord)}`,
        `Incl. angle   ${fx(r.angleDeg)}°${mark("angleDeg")}`,
        `Arc length    ${fx(r.arc)}${mark("arc")}`,
        `Rise          ${fx(r.rise)}${mark("rise")}`,
      ].join("\n");
    } else if (kind === "pattern" && patternCalc.result) {
      const r = patternCalc.result;
      text = [
        `SLOT PATTERN — ${r.rows.length} × w${pw} on Ø${pd}, start ${fx(r.startDeg, 4)}°`,
        `Each subtends ${fx(r.alphaDeg)}°   Pitch ${fx(r.pitchDeg)}°`,
        ``,
        `  #   Centre°     Lead°       Trail°`,
        ...r.rows.map(
          (row) =>
            `${String(row.n).padStart(3)}   ${fx(row.centre).padStart(9)}  ${fx(row.lead).padStart(9)}  ${fx(row.trail).padStart(9)}`
        ),
      ].join("\n");
    }
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(""), 1500);
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

  const givenSet = new Set(chordCalc.given || []);
  const chordReadout = (key, label, value, unit = "") => (
    <Readout
      key={key}
      label={givenSet.has(key) ? `${label} · given` : label}
      value={`${fx(value)}${unit}`}
      color={givenSet.has(key) ? C.text : C.cyan}
    />
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
            CHORD <span style={{ color: C.orange }}>CALC</span>
          </div>
          <div style={{ fontFamily: sans, fontSize: 11, color: C.dim, marginTop: 2 }}>
            chord geometry · slot patterns · 2·asin(w/d)
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
          <button onClick={() => switchMode("chord")} style={tabStyle(mode === "chord")}>
            CHORD
          </button>
          <button onClick={() => switchMode("pattern")} style={tabStyle(mode === "pattern")}>
            PATTERN
          </button>
        </div>

        {mode === "chord" ? (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {Object.entries(CHORD_EXAMPLES).map(([key, e]) => (
                <button
                  key={key}
                  onClick={() => loadChordExample(key)}
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
                  {e.label}
                </button>
              ))}
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
              <div style={{ fontFamily: sans, fontSize: 12, color: C.dim, lineHeight: 1.5 }}>
                Fill in <span style={{ color: C.orange, fontWeight: 700 }}>any two</span> — the tool works out the other three. Leave the rest blank.
              </div>
              {CHORD_FIELDS.map((f) => (
                <Field
                  key={f.key}
                  label={f.label}
                  sub={f.sub}
                  value={cv[f.key]}
                  onChange={setChordField(f.key)}
                  onHelp={() => setHelpKey(f.key)}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button
                onClick={loadPatternExample}
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
                8 slots · 1.50 wide on Ø11.5 (validated)
              </button>
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
                <Field label="Features n" sub="how many" value={pn} onChange={wrap(setPn)} onHelp={() => setHelpKey("n")} />
                <Field label="Width w" sub="one slot, across" value={pw} onChange={wrap(setPw)} onHelp={() => setHelpKey("w")} />
                <Field label="Diameter Ø" sub="print callout" value={pd} onChange={wrap(setPd)} onHelp={() => setHelpKey("d")} />
                <Field label="Start angle" sub="0 if on your zero" value={pstart} onChange={wrap(setPstart)} onHelp={() => setHelpKey("start")} />
              </div>
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

        {showResults && mode === "chord" && (
          <>
            <div
              style={{
                marginTop: 16,
                background: C.panel,
                border: `1px solid ${C.panelEdge}`,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderBottom: `1px solid ${C.panelEdge}`,
                }}
              >
                <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 700, color: C.text, letterSpacing: 1 }}>
                  CHORD GEOMETRY
                </span>
                <CopyBtn onCopy={() => doCopy("chord")} copied={copied === "chord"} />
              </div>
              <div style={{ padding: 12, display: "grid", gap: 10 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  {chordReadout("radius", "Radius", chordCalc.result.radius)}
                  <Readout label="Diameter" value={fx(chordCalc.result.diameter)} color={C.cyan} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {chordReadout("chord", "Chord", chordCalc.result.chord)}
                  <Readout label="Half-chord" value={fx(chordCalc.result.halfChord)} color={C.cyan} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {chordReadout("angleDeg", "Incl. angle", chordCalc.result.angleDeg, "°")}
                  {chordReadout("arc", "Arc length", chordCalc.result.arc)}
                  {chordReadout("rise", "Rise", chordCalc.result.rise)}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: "0 2px" }}>
              <span style={{ fontFamily: sans, fontSize: 11.5, color: C.dim, lineHeight: 1.5 }}>
                White = the two you gave. <span style={{ color: C.cyan }}>Blue</span> = computed, exact — legacy tools
                may show ±0.0001 differences from rounded readouts. Radius + chord answers with the minor arc (≤180°).
              </span>
            </div>
          </>
        )}

        {showResults && mode === "pattern" && (
          <>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Readout label="Each subtends" value={`${fx(patternCalc.result.alphaDeg)}°`} color={C.cyan} big />
              <Readout label="Pitch" value={`${fx(patternCalc.result.pitchDeg)}°`} color={C.text} big />
            </div>

            <div
              style={{
                marginTop: 16,
                background: C.panel,
                border: `1px solid ${C.panelEdge}`,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderBottom: `1px solid ${C.panelEdge}`,
                }}
              >
                <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 700, color: C.text, letterSpacing: 1 }}>
                  C-AXIS TABLE
                </span>
                <CopyBtn onCopy={() => doCopy("pattern")} copied={copied === "pattern"} />
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 380 }}>
                  <thead>
                    <tr>
                      {["#", "Centre °", "Lead edge °", "Trail edge °"].map((h, i) => (
                        <th
                          key={h}
                          style={{
                            fontFamily: sans,
                            fontSize: 10.5,
                            color: C.dim,
                            letterSpacing: 0.6,
                            textTransform: "uppercase",
                            textAlign: i === 0 ? "center" : "right",
                            padding: "8px 10px",
                            borderBottom: `1px solid ${C.panelEdge}`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {patternCalc.result.rows.map((row) => (
                      <tr key={row.n} style={{ background: row.n % 2 ? "transparent" : "#10141C" }}>
                        <td style={{ fontFamily: mono, fontSize: 13, color: C.dim, textAlign: "center", padding: "7px 10px" }}>
                          {row.n}
                        </td>
                        <td style={{ fontFamily: mono, fontSize: 14, color: C.cyan, textAlign: "right", padding: "7px 10px", fontWeight: 600 }}>
                          {fx(row.centre)}
                        </td>
                        <td style={{ fontFamily: mono, fontSize: 14, color: C.text, textAlign: "right", padding: "7px 10px" }}>
                          {fx(row.lead)}
                        </td>
                        <td style={{ fontFamily: mono, fontSize: 14, color: C.text, textAlign: "right", padding: "7px 10px" }}>
                          {fx(row.trail)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: "0 2px" }}>
              <span style={{ fontFamily: sans, fontSize: 11.5, color: C.dim, lineHeight: 1.5 }}>
                <span style={{ color: C.cyan }}>Centre</span> is the C-axis centreline per feature. Lead/trail are each
                edge, half the subtended angle either side, given 0–360°. Angles are exact — legacy tools may show
                rounded values (1.50 on Ø11.5 is exactly {fx(2 * Math.asin(1.5 / 11.5) * (180 / Math.PI))}°, which reads 15.0° at one decimal).
              </span>
            </div>
          </>
        )}

        <div style={{ marginTop: 24, padding: "0 2px" }}>
          <span style={{ fontFamily: sans, fontSize: 11.5, color: C.dim, lineHeight: 1.5 }}>
            Verify against the print and dry-run before cutting. This does the math — you&rsquo;re still the machinist.
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
