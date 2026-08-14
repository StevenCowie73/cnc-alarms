"use client";

import { useState, useMemo } from "react";

// ---- palette: Mazatrol night-shift ----
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

const r4 = (n) => Math.round(n * 10000) / 10000;
const fmt = (n, d = 4) =>
  Number.isFinite(n) ? n.toFixed(d).replace(/\.?0+$/, (m) => (m.startsWith(".") ? "" : m)) : "—";
const fx = (n) => (Number.isFinite(n) ? n.toFixed(4) : "—");
const mz = (n) => {
  if (!Number.isFinite(n)) return "—";
  const r = r4(n);
  if (Number.isInteger(r)) return `${r}.`;
  return String(r);
};

const EXAMPLES = {
  "19347": { label: "MD19347 (proven)", D: "1.43", R: "3", breakout: "12.775", step: "0.1", finish: "0.03" },
  "17485": { label: "MD17485 (next job)", D: "1.56", R: "3", breakout: "12.775", step: "0.1", finish: "0.03" },
};

const HELP = {
  about: {
    title: "What this tool does",
    body: [
      "This calculates the numbers for milling a slot that ends in a smooth radius ramp — the kind where the cutter feeds along the slot floor, then arcs up and out through the face in one move.",
      "You give it three numbers off the print. It gives you back the start position, every pass of the depth ladder, and (if you want) the whole sub program written out ready to key into the control.",
      "How to use it: 1) Tap an example button to see it filled in with a real proven job. 2) Enter your own numbers from the print. 3) Press CALCULATE. 4) Check the green arc check says ✓, then read your numbers or tap Create sub program.",
      "Always verify against a proven part or dry-run before cutting. This does the math — you're still the machinist.",
    ],
  },
  D: {
    title: "Slot depth D",
    body: [
      "How deep the slot floor sits below the face the ramp exits through.",
      "It's often not written directly on the print — you may have to subtract two dimensions. Example: the print shows 5.81 to one feature and 4.25 to another, so the depth is 5.81 − 4.25 = 1.56.",
      "It must be smaller than the ramp radius. A radius can't climb higher than itself while staying smooth against the floor.",
    ],
  },
  R: {
    title: "Ramp radius R",
    body: [
      "The radius callout on the print at the end of the slot where it ramps up and out — like R3.0.",
      "Bigger radius = longer, gentler ramp. Smaller radius = shorter, steeper ramp.",
    ],
  },
  breakout: {
    title: "Breakout X",
    body: [
      "The position where the ramp comes out through the face — the far end of the slot, where the cutter exits into air.",
      "Take it from the print geometry or from an existing proven program. It stays the same when only the slot depth changes.",
      "The tool subtracts the ramp run from this number to find your start position.",
    ],
  },
  step: {
    title: "Step per pass",
    body: [
      "How much deeper each roughing pass plunges than the last one. 0.1 means passes at −0.1, −0.2, −0.3 and so on.",
      "0.100 is a comfortable cut for a full-width end mill in steel. Smaller step = more passes, lighter cuts.",
    ],
  },
  finish: {
    title: "Finish skim",
    body: [
      "The light final cut left after roughing. 0.03 means the last pass only removes .030 — a clean skim for the floor and ramp.",
      "If the depth doesn't divide evenly into the steps, the tool automatically splits what's left so the final pass is still a light one.",
      "Set to 0 if you don't want a finish pass.",
    ],
  },
  progopts: {
    title: "Program options",
    body: [
      "Clear X — the safe position the cutter returns to before each pass. Must be clear of the part.",
      "Feed F — cutting feedrate. Goes on the first feed move only; the control carries it forward.",
      "Speed S — spindle RPM for the milling spindle.",
      "Safe Z — the height the tool starts at before the first plunge.",
      "Retract Z — where the tool lifts to between passes.",
      "Final Z — the taller retract at the very end, clear of everything before the next operation.",
      "The defaults are taken from a proven running program — change them to suit your setup.",
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

function Field({ label, sub, value, onChange, small, onHelp }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontFamily: sans, fontSize: small ? 12 : 13.5, fontWeight: 600, color: C.text, letterSpacing: 0.3, whiteSpace: "nowrap" }}>
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
          fontSize: small ? 17 : 22,
          fontWeight: 500,
          padding: small ? "9px 11px" : "12px 14px",
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

export default function SlotRampCalculator() {
  const [D, setD] = useState(EXAMPLES["19347"].D);
  const [R, setR] = useState(EXAMPLES["19347"].R);
  const [breakout, setBreakout] = useState(EXAMPLES["19347"].breakout);
  const [step, setStep] = useState(EXAMPLES["19347"].step);
  const [finish, setFinish] = useState(EXAMPLES["19347"].finish);
  const [calculated, setCalculated] = useState(false);
  const [showProg, setShowProg] = useState(false);
  const [helpKey, setHelpKey] = useState(null);
  const [clearX, setClearX] = useState("7");
  const [feedF, setFeedF] = useState("0.012");
  const [speedS, setSpeedS] = useState("1600");
  const [safeZ, setSafeZ] = useState("1");
  const [retractZ, setRetractZ] = useState("2");
  const [finalZ, setFinalZ] = useState("4");
  const [copied, setCopied] = useState("");

  const stale = () => { setCalculated(false); setShowProg(false); };
  const wrap = (setter) => (v) => { setter(v); stale(); };

  const calc = useMemo(() => {
    const d = parseFloat(D), r = parseFloat(R), bx = parseFloat(breakout);
    const st = parseFloat(step), fin = parseFloat(finish);
    const errs = [];
    if (!(d > 0)) errs.push("Slot depth needs a positive number. Tap the ? next to it if you're not sure where it comes from.");
    if (!(r > 0)) errs.push("Ramp radius needs a positive number — it's the R callout on the print, like R3.0.");
    if (!Number.isFinite(bx)) errs.push("Breakout X is needed — it's where the ramp exits the face. Tap its ? for help.");
    if (d > 0 && r > 0 && d > r)
      errs.push(`Depth ${fmt(d)} is deeper than radius ${fmt(r)} — a tangent ramp can't climb higher than its own radius. Increase R or reduce depth.`);
    if (errs.length) return { errs };

    const run = Math.sqrt(d * (2 * r - d));
    const startX = bx - run;
    const check = Math.sqrt(run * run + (r - d) * (r - d));

    const passes = [];
    if (st > 0) {
      const finAllow = fin > 0 ? fin : 0;
      const nRough = Math.floor((d - finAllow) / st + 1e-9);
      for (let i = 1; i <= nRough; i++) passes.push(r4(i * st));
      const lastRough = nRough > 0 ? r4(nRough * st) : 0;
      const remainder = r4(d - lastRough);
      if (finAllow > 0 && remainder > finAllow + 1e-9) passes.push(r4(d - finAllow));
      if (passes.length === 0 || passes[passes.length - 1] < d - 1e-9) passes.push(r4(d));
    } else {
      passes.push(r4(d));
    }

    const rows = passes.map((depth, i) => ({
      n: i + 1,
      plungeZ: -depth,
      arcEndZ: r4(d - depth),
      isFinal: Math.abs(depth - d) < 1e-9,
    }));

    return { errs: [], d, r, bx, run, startX, check, rows };
  }, [D, R, breakout, step, finish]);

  const prog = useMemo(() => {
    if (!calc.rows) return null;
    const cx = parseFloat(clearX), f = parseFloat(feedF), s = parseFloat(speedS);
    const sz = parseFloat(safeZ), rz = parseFloat(retractZ), fz = parseFloat(finalZ);
    if (![cx, f, s, sz, rz, fz].every(Number.isFinite)) return null;

    const L = [];
    let n = 1;
    const push = (g1, g2, words) => L.push({ n: n++, g1, g2, words });
    push("", "", [["S", mz(s)], ["M", "3"]]);
    push("", "", [["M", "51"]]);
    push("0", "18", [["X", mz(cx)], ["Z", mz(sz)], ["Y", "0."]]);
    calc.rows.forEach((p, i) => {
      push("0", "", [["Z", mz(p.plungeZ)]]);
      const feedWords = [["X", mz(calc.startX)]];
      if (i === 0) feedWords.push(["F", mz(f)]);
      push("1", "", feedWords);
      push("1", "2", [["Z", mz(p.arcEndZ)], ["X", mz(calc.bx)], ["R", mz(calc.r)]]);
      const last = i === calc.rows.length - 1;
      push("0", "", [["Z", mz(last ? fz : rz)]]);
      if (!last) push("0", "", [["X", mz(cx)]]);
    });
    return L;
  }, [calc, clearX, feedF, speedS, safeZ, retractZ, finalZ]);

  const loadExample = (key) => {
    const e = EXAMPLES[key];
    setD(e.D); setR(e.R); setBreakout(e.breakout); setStep(e.step); setFinish(e.finish);
    setCalculated(false); setShowProg(false);
  };

  const doCopy = (kind) => {
    let text = "";
    if (kind === "table" && calc.rows) {
      text = [
        `SLOT RAMP — D=${fmt(calc.d)}  R=${fmt(calc.r)}  breakout X${fx(calc.bx)}`,
        `Run = ${fx(calc.run)}   Start = X${fx(calc.startX)}`,
        ``,
        `Pass  PlungeZ   FeedX      ArcEndX    R      ArcEndZ`,
        ...calc.rows.map(
          (p) =>
            `${String(p.n).padStart(3)}   ${fx(p.plungeZ).padStart(7)}  ${fx(calc.startX)}  ${fx(calc.bx)}  ${fmt(calc.r)}   ${fx(p.arcEndZ)}${p.isFinal ? "  <- final" : ""}`
        ),
      ].join("\n");
    } else if (kind === "prog" && prog) {
      text = [
        `MANL PRG — SLOT SUB  (D=${fmt(calc.d)} R=${fmt(calc.r)} start X${fx(calc.startX)} breakout X${fx(calc.bx)})`,
        `SNo  G1 G2  DATA`,
        ...prog.map(
          (l) =>
            `${String(l.n).padStart(3)}  ${(l.g1 || " ").padStart(2)} ${(l.g2 || " ").padStart(2)}  ` +
            l.words.map(([a, v]) => `${a} ${v}`).join("   ")
        ),
        `END  CONTI 1`,
      ].join("\n");
    }
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(""), 1500);
    });
  };

  const axisColor = (a) =>
    a === "Z" ? C.yellow : a === "X" ? C.cyan : a === "R" ? C.orange : a === "F" ? C.green : C.text;

  const showResults = calculated && calc.rows;
  const showErrors = calculated && calc.errs && calc.errs.length > 0;
  const help = helpKey ? HELP[helpKey] : null;

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
            SLOT RAMP <span style={{ color: C.orange }}>CALC</span>
          </div>
          <div style={{ fontFamily: sans, fontSize: 11, color: C.dim, marginTop: 2 }}>
            tangent ramp-out · run = √(D(2R−D))
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
          {Object.entries(EXAMPLES).map(([key, e]) => (
            <button
              key={key}
              onClick={() => loadExample(key)}
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
          <Field label="Slot depth D" sub="e.g. 5.81 − 4.25 = 1.56" value={D} onChange={wrap(setD)} onHelp={() => setHelpKey("D")} />
          <Field label="Ramp radius R" sub="print callout · R3.0" value={R} onChange={wrap(setR)} onHelp={() => setHelpKey("R")} />
          <Field label="Breakout X" sub="where ramp exits the face" value={breakout} onChange={wrap(setBreakout)} onHelp={() => setHelpKey("breakout")} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Step / pass" value={step} onChange={wrap(setStep)} onHelp={() => setHelpKey("step")} />
            <Field label="Finish skim" value={finish} onChange={wrap(setFinish)} onHelp={() => setHelpKey("finish")} />
          </div>
        </div>

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
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Readout label="Ramp run" value={fx(calc.run)} color={C.text} big />
              <Readout label="Start position" value={`X ${fx(calc.startX)}`} color={C.cyan} big />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <Readout
                label="Arc check · center→breakout"
                value={`${fx(calc.check)}  ${Math.abs(calc.check - calc.r) < 0.0005 ? "= R ✓" : "≠ R ✗"}`}
                color={Math.abs(calc.check - calc.r) < 0.0005 ? C.green : C.red}
              />
              <Readout label="Passes" value={String(calc.rows.length)} color={C.text} />
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
                  PASS TABLE
                </span>
                <CopyBtn onCopy={() => doCopy("table")} copied={copied === "table"} />
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 430 }}>
                  <thead>
                    <tr>
                      {["#", "Plunge Z", "Feed X", "Arc end X", "R", "Arc end Z"].map((h, i) => (
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
                    {calc.rows.map((p) => (
                      <tr key={p.n} style={{ background: p.isFinal ? "#122016" : p.n % 2 ? "transparent" : "#10141C" }}>
                        <td style={{ fontFamily: mono, fontSize: 13, color: C.dim, textAlign: "center", padding: "7px 10px" }}>
                          {p.n}
                        </td>
                        <td style={{ fontFamily: mono, fontSize: 14, color: C.yellow, textAlign: "right", padding: "7px 10px" }}>
                          {fx(p.plungeZ)}
                        </td>
                        <td style={{ fontFamily: mono, fontSize: 14, color: C.cyan, textAlign: "right", padding: "7px 10px" }}>
                          {fx(calc.startX)}
                        </td>
                        <td style={{ fontFamily: mono, fontSize: 14, color: C.text, textAlign: "right", padding: "7px 10px" }}>
                          {fx(calc.bx)}
                        </td>
                        <td style={{ fontFamily: mono, fontSize: 14, color: C.text, textAlign: "right", padding: "7px 10px" }}>
                          {fmt(calc.r)}
                        </td>
                        <td
                          style={{
                            fontFamily: mono,
                            fontSize: 14,
                            color: p.isFinal ? C.green : C.text,
                            textAlign: "right",
                            padding: "7px 10px",
                            fontWeight: p.isFinal ? 700 : 400,
                          }}
                        >
                          {fx(p.arcEndZ)}
                          {p.isFinal ? " ◀" : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={() => setShowProg(!showProg)}
              style={{
                width: "100%",
                marginTop: 16,
                background: showProg ? "transparent" : "#1E2634",
                border: `1px solid ${C.orange}`,
                borderRadius: 10,
                color: C.orange,
                fontFamily: sans,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 0.5,
                padding: "13px 12px",
                cursor: "pointer",
              }}
            >
              {showProg ? "Hide sub program" : "Create sub program"}
            </button>

            {showProg && prog && (
              <div
                style={{
                  marginTop: 12,
                  background: C.panel,
                  border: `1px solid ${C.panelEdge}`,
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.panelEdge}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 700, color: C.text, letterSpacing: 1 }}>
                      PROGRAM OPTIONS
                    </span>
                    <HelpDot onClick={() => setHelpKey("progopts")} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <Field small label="Clear X" value={clearX} onChange={setClearX} />
                    <Field small label="Feed F" value={feedF} onChange={setFeedF} />
                    <Field small label="Speed S" value={speedS} onChange={setSpeedS} />
                    <Field small label="Safe Z" value={safeZ} onChange={setSafeZ} />
                    <Field small label="Retract Z" value={retractZ} onChange={setRetractZ} />
                    <Field small label="Final Z" value={finalZ} onChange={setFinalZ} />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderBottom: `1px solid ${C.panelEdge}`,
                    background: C.header,
                  }}
                >
                  <span style={{ fontFamily: mono, fontSize: 12.5, fontWeight: 700, color: C.orange }}>
                    MANL PRG · END MILL · SLOT SUB
                  </span>
                  <CopyBtn onCopy={() => doCopy("prog")} copied={copied === "prog"} />
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 400 }}>
                    <thead>
                      <tr>
                        {["SNo.", "G1", "G2", "DATA"].map((h, i) => (
                          <th
                            key={h}
                            style={{
                              fontFamily: sans,
                              fontSize: 10.5,
                              color: C.dim,
                              letterSpacing: 0.6,
                              textAlign: i === 3 ? "left" : "center",
                              padding: "8px 8px",
                              borderBottom: `1px solid ${C.panelEdge}`,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {prog.map((l) => (
                        <tr key={l.n} style={{ background: l.n % 2 ? "transparent" : "#10141C" }}>
                          <td style={{ fontFamily: mono, fontSize: 13, color: C.dim, textAlign: "center", padding: "6px 8px", borderRight: `1px solid ${C.panelEdge}` }}>
                            {l.n}
                          </td>
                          <td style={{ fontFamily: mono, fontSize: 13.5, color: C.text, textAlign: "center", padding: "6px 8px" }}>
                            {l.g1}
                          </td>
                          <td style={{ fontFamily: mono, fontSize: 13.5, color: C.text, textAlign: "center", padding: "6px 8px", borderRight: `1px solid ${C.panelEdge}` }}>
                            {l.g2}
                          </td>
                          <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>
                            {l.words.map(([a, v], i) => (
                              <span key={i} style={{ marginRight: 18 }}>
                                <span style={{ fontFamily: mono, fontSize: 13.5, fontWeight: 700, color: axisColor(a) }}>{a}</span>
                                <span style={{ fontFamily: mono, fontSize: 14, color: C.text, marginLeft: 7 }}>{v}</span>
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={4} style={{ padding: "8px 10px", borderTop: `1px solid ${C.panelEdge}` }}>
                          <span style={{ fontFamily: mono, fontSize: 13, color: C.green, fontWeight: 700 }}>END</span>
                          <span style={{ fontFamily: mono, fontSize: 13, color: C.text, marginLeft: 16 }}>CONTI 1</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.panelEdge}` }}>
                  <span style={{ fontFamily: sans, fontSize: 11.5, color: C.dim, lineHeight: 1.5 }}>
                    Structure mirrors a proven slot sub: plane-select line, F on first feed only, retract + return each
                    lap, taller final retract. Verify against a proven program and dry-run before cutting.
                  </span>
                </div>
              </div>
            )}
          </>
        )}
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
