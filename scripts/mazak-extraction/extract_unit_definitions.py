import pdfplumber, re, json, collections, datetime
from pypdf import PdfReader

P = r"C:\Users\info\mazak-data\manuals\H747PA0029E.pdf"
OUT = r"C:\Users\info\mazak-unit-definitions.json"
pdf = pdfplumber.open(P)
rd = PdfReader(P)
START, END = 89, 620

# ---------- outline -> per-page section ----------
def walk(items, d=0, out=None):
    out = [] if out is None else out
    for it in items:
        if isinstance(it, list): walk(it, d + 1, out)
        else: out.append((d, it.title.strip(), rd.get_destination_page_number(it) + 1))
    return out
entries = [(d, t, p) for d, t, p in walk(rd.outline) if START <= p <= END]
entries.sort(key=lambda x: x[2])
def section_for(pg):
    cur = None
    for d, t, p in entries:
        if p <= pg: cur = t
    return cur
def family_for(title):
    m = re.match(r"7-(\d+)", title or "")
    n = int(m.group(1)) if m else 0
    return {7: "point", 8: "c-axis point", 9: "line", 10: "c-axis line", 11: "face", 12: "c-axis face", 13: "turning"}.get(n, "other")

# ---------- page text ----------
def clean(p): return p.filter(lambda o: o.get("object_type") != "char" or "Century" not in o.get("fontname", ""))
def rows(pg):
    r = collections.defaultdict(list)
    for w in clean(pdf.pages[pg - 1]).extract_words(extra_attrs=["fontname"]): r[round(w["top"] / 3)].append(w)
    out = []
    for k, v in sorted(r.items()):
        v = sorted(v, key=lambda w: w["x0"])
        out.append({"top": v[0]["top"], "x0": v[0]["x0"], "bold": any("Bold" in w["fontname"] for w in v), "t": " ".join(w["text"] for w in v)})
    return out

PLACE = re.compile(r"\[\s*(\d+)\s*\]")
HEAD_UNIT = re.compile(r"^UNo\.\s+(?:UNIT\b)?(.*)$")
PHRASES = ["TURN POS X", "TURN POS Y", "TURN POS Z", "ANGLE B", "ANGLE C", "WORK FACE", "ATC MODE", "MULTI MODE", "MULTI FLAG",
           "LTUR DIA", "WORK No.", "REPEAT No.", "PALLET No.", "SHIFT NUMBER", "LOW RET.", "UTUR ESC", "LTUR ESC", "SIMUL.No."]
def split_cols(h):
    h = h.replace("", "φ").strip()
    for ph in sorted(PHRASES, key=len, reverse=True): h = h.replace(ph, ph.replace(" ", " "))
    toks = [c.replace(" ", " ") for c in h.split(" ") if c]
    out = []
    for c in toks:
        if c == "φ" and out and out[-1].endswith("-"): out[-1] += "φ"
        elif c == "AL" and out and out[-1] == "W": out[-1] = "WAL"
        else: out.append(c)
    return out
HEAD_TOOL = re.compile(r"^SNo\.\s+(TOOL.*)$")
HEAD_SHAPE = re.compile(r"^(FIG|SEQ)\b\s*(.*)$")
ITEM = re.compile(r"^\[(\d+)\]\s+(.+)$")
UNIT_HEADING = re.compile(r"^(?:\d+\.\s+)?(.+?)\s+[Uu]nit\s*\((.+?)\)")

units = {}          # key -> unit record
family_defs = collections.defaultdict(lambda: {"tool_sequence": [], "shape_sequence": []})
order = []

def new_unit(name, abbr, section, pg):
    fam = family_for(section)
    key = (abbr or name.upper()) + (" [C]" if fam.startswith("c-axis") else "")
    global seq_ok
    seq_ok = False
    if key not in units:
        units[key] = {"unit": (abbr or name.upper()), "name": name, "section": section, "family": family_for(section), "pages": [pg],
                      "unit_data": None, "tool_sequence": None, "shape_sequence": None, "notes": {}}
        order.append(key)
    return units[key]

cur_unit = None; cur_block = None; cur_item = None; cur_section = None; seq_ok = False
last_header_kind = None

def close_item():
    global cur_item
    if cur_item and cur_unit is None and family_for(cur_section) not in ("turning","other"):
        if not re.search(r"sequence data", cur_section or "", re.I) or len(cur_item[2]) < 3:
            cur_item = None; return   # figure captions in "Tool path" subsections are not field notes
        kind, n, label, text = cur_item
        txt = " ".join(text).strip(); rng = re.findall(r"\(?(?:Setting range|Range)[^.\n]*?\d[^.\n]*\)?", txt)
        entry = {"index": n, "field": label, "text": txt[:700]}
        if rng: entry["range"] = rng[0][:120]
        fams = ["line","face"] if re.match(r"^7-11-8", cur_section or "") else [family_for(cur_section)]
        for f in fams: family_defs[f].setdefault("notes", {}).setdefault(kind, []).append(entry)
        cur_item = None; return
    if cur_item and cur_unit is not None:
        kind, n, label, text = cur_item
        txt = " ".join(text).strip()
        rng = re.findall(r"\(?(?:Setting range|Range)[^.\n]*?\d[^.\n]*\)?", txt)
        entry = {"index": n, "field": label, "text": txt[:700]}
        if rng: entry["range"] = rng[0][:120]
        cur_unit["notes"].setdefault(kind, []).append(entry)
    cur_item = None

for pg in range(START, END + 1):
    sec = section_for(pg)
    if sec != cur_section:
        cur_section = sec
        if sec and re.search(r"sequence data of|Shape sequence data|Tool sequence data", sec, re.I) and family_for(sec) != "turning":
            close_item(); cur_unit = None; cur_block = "tool" if "tool" in sec.lower() else "shape"
        m = UNIT_HEADING.search(sec or "")
        if m:
            close_item()
            cur_unit = new_unit(m.group(1).strip(), m.group(2).strip(), sec, pg); cur_block = None
        elif sec and re.match(r"^7-1\s", sec):
            close_item(); cur_unit = new_unit("Common Unit", "COMMON", sec, pg); cur_block = None
        elif sec and re.match(r"^7-14\s", sec):
            close_item(); cur_unit = new_unit("End Unit", "END", sec, pg); cur_block = None
        elif sec and re.match(r"^7-13-12\s", sec):
            close_item(); cur_unit = new_unit("Y-axis turning", "Y-TURN", sec, pg); cur_block = None
    rws = rows(pg)
    for i, r in enumerate(rws):
        t = r["t"].strip()
        if r["top"] < 60 or r["top"] > 795 or not t: continue
        # in-page bold unit heading e.g. "1. Drilling unit (DRILLING)"
        if r["bold"] and r["x0"] < 100:
            m = UNIT_HEADING.match(t)
            if m and "sequence" not in t.lower():
                close_item(); cur_unit = new_unit(m.group(1).strip(), m.group(2).strip(), cur_section, pg); cur_block = None
                if pg not in cur_unit["pages"]: cur_unit["pages"].append(pg)
                continue
        if cur_unit is not None and pg not in cur_unit["pages"] and cur_unit["section"] == cur_section:
            cur_unit["pages"].append(pg)
        nxt = rws[i + 1]["t"].strip() if i + 1 < len(rws) else ""
        nxt2 = rws[i + 2]["t"].strip() if i + 2 < len(rws) else ""
        mh = HEAD_UNIT.match(t)
        if mh:
            close_item()
            cols = split_cols(mh.group(1))
            ph = PLACE.findall(nxt) or PLACE.findall(nxt2)
            sample = nxt if not PLACE.findall(nxt) else None
            d = {"header_raw": t, "columns": cols, "column_count_from_placeholders": (max(map(int, ph)) if ph else None),
                 "example_row": sample, "page": pg}
            if cur_unit is not None:
                if cur_unit["unit_data"] is None: cur_unit["unit_data"] = d
                else: cur_unit.setdefault("unit_data_variants", []).append(d)
            cur_block = "unit"; continue
        mt = HEAD_TOOL.match(t)
        if mt:
            close_item()
            cols = split_cols(mt.group(1))
            ph = PLACE.findall(nxt) or PLACE.findall(nxt2)
            d = {"header_raw": t, "columns": cols, "column_count_from_placeholders": (max(map(int, ph)) if ph else None), "page": pg}
            fam = family_for(cur_section)
            if fam == "other" and not (seq_ok or re.search(r"Setting sequence data", cur_section or "")): continue
            if fam == "turning" or fam == "other":
                if cur_unit is not None:
                    if cur_unit["tool_sequence"] is None: cur_unit["tool_sequence"] = d
                    else: cur_unit.setdefault("tool_sequence_variants", []).append(d)
            else:
                # family-level definition (point/line/face families share one tool-sequence table)
                if "sequence data" in (cur_section or "").lower() or cur_unit is None:
                    family_defs[fam]["tool_sequence"].append(d)
                elif cur_unit is not None and cur_unit["tool_sequence"] is None:
                    cur_unit["tool_sequence"] = d
            cur_block = "tool"; continue
        ms = HEAD_SHAPE.match(t)
        if ms and len(t.split()) >= 3:
            close_item()
            cols = split_cols(t)
            ph = PLACE.findall(nxt) or PLACE.findall(nxt2)
            d = {"header_raw": t, "columns": cols, "column_count_from_placeholders": (max(map(int, ph)) if ph else None), "page": pg}
            fam = family_for(cur_section)
            if fam == "other" and not (seq_ok or re.search(r"Setting sequence data", cur_section or "")): continue
            if fam in ("turning", "other"):
                if cur_unit is not None:
                    if cur_unit["shape_sequence"] is None: cur_unit["shape_sequence"] = d
                    else: cur_unit.setdefault("shape_sequence_variants", []).append(d)
            else:
                if "sequence data" in (cur_section or "").lower() or cur_unit is None:
                    for f in (["line","face"] if re.match(r"^7-11-8", cur_section or "") else [fam]): family_defs[f]["shape_sequence"].append(d)
                elif cur_unit is not None and cur_unit["shape_sequence"] is None:
                    cur_unit["shape_sequence"] = d
                else:
                    cur_unit.setdefault("shape_sequence_variants", []).append(d)
            cur_block = "shape"; continue
        if re.match(r"^\d+\.\s+Setting (tool |shape )?sequence data", t) or re.match(r"^\d+\.\s+Setting sequence data", t):
            close_item(); seq_ok = True; cur_block = "tool" if "tool" in t else "shape"; continue
        if re.match(r"^\d+\.\s+Setting unit data", t) or re.match(r"^[A-Z]\.\s+Data setting", t):
            close_item(); cur_block = "unit"; continue
        mi = ITEM.match(t)
        if mi and r["x0"] < 130 and cur_block:
            close_item()
            label = re.split(r"\s{2,}|\s\(", mi.group(2), 1)[0].strip()
            cur_item = (cur_block, int(mi.group(1)), mi.group(2).strip()[:80], [])
            continue
        if cur_item and r["x0"] >= 100 and not r["bold"] and len(cur_item[3]) < 12:
            cur_item[3].append(t)
        elif cur_item and r["bold"] and r["x0"] < 100:
            close_item()
close_item()

# ---------- inherit family-level sequences ----------
for k in order:
    u = units[k]; fam = u["family"]
    if fam == "c-axis face" and not family_defs.get(fam, {}).get("shape_sequence") and family_defs.get("face", {}).get("shape_sequence"):
        family_defs[fam]["shape_sequence"] = family_defs["face"]["shape_sequence"]   # manual: "refer to 7-11-8"
        family_defs[fam].setdefault("notes", {}).update({kk: vv for kk, vv in family_defs["face"].get("notes", {}).items() if kk == "shape"})
    if fam in family_defs:
        fd = family_defs[fam]
        if u["tool_sequence"] is None and fd["tool_sequence"]:
            u["tool_sequence"] = dict(fd["tool_sequence"][0], inherited_from=f"{fam} family (shared table)")
        for kind in ("tool","shape"):
            if kind not in u["notes"] and fd.get("notes",{}).get(kind): u["notes"][kind] = fd["notes"][kind]; u["notes"].setdefault("_inherited",[]).append(kind)
        if u["shape_sequence"] is None and fd["shape_sequence"]:
            u["shape_sequence"] = dict(fd["shape_sequence"][0], inherited_from=f"{fam} family (shared table)")
            if len(fd["shape_sequence"]) > 1:
                u["shape_sequence_variants"] = [dict(x, inherited_from=f"{fam} family") for x in fd["shape_sequence"][1:]]

# de-duplicate identical shape/tool variants (same header repeated on consecutive pages)
for fd in family_defs.values():
    for kind in ("tool_sequence","shape_sequence"):
        seen=set(); keep=[]
        for d in fd[kind]:
            key=tuple(d["columns"])
            if key in seen: continue
            seen.add(key); keep.append(d)
        fd[kind]=keep
for u in units.values():
    for kind in ("shape_sequence_variants","tool_sequence_variants","unit_data_variants"):
        if kind in u:
            seen={tuple((u.get(kind.replace("_variants","")) or {}).get("columns",[]))}; keep=[]
            for d in u[kind]:
                key=tuple(d["columns"])
                if key in seen: continue
                seen.add(key); keep.append(d)
            if keep: u[kind]=keep
            else: del u[kind]

doc = {
    "dataset": "MAZATROL SmoothX (INTEGREX e series) — program unit definitions",
    "source": {"manual_no": "H747PA0029E", "title": "PROGRAMMING MANUAL", "section": "7 PROGRAM CREATION (pp. 89–620)",
               "machine_family": "INTEGREX e / i series, VORTEX e / i series", "control": "MAZATROL SmoothX",
               "extracted": datetime.date.today().isoformat(),
               "method": "Text-only extraction (pdfplumber), watermark glyphs removed by font; no page images saved."},
    "how_to_read": {
        "unit_data": "Blue header row on the control: columns after 'UNo. UNIT' in screen order. column_count_from_placeholders is the highest [n] marker under the header (= number of settable fields). example_row, when present, shows the maximum entry values as printed.",
        "tool_sequence": "Tan header row: columns after 'SNo.' in screen order. Repeated '[15] [15] [15]' style markers mean one field repeated (e.g. three M-code columns).",
        "shape_sequence": "Green header row (FIG ...). Line/face/point families have several PTN-dependent layouts — see shape_sequence_variants.",
        "notes": "Per-field explanations keyed by row kind (unit/tool/shape) with the [n] index, field label, text, and any 'Setting range' found."},
    "family_shared_tables": {f: v for f, v in family_defs.items()},
    "unit_count": len(order),
    "units": [units[k] for k in order],
}
s = json.dumps(doc, ensure_ascii=False, indent=2)
assert "301508" not in s
open(OUT, "w", encoding="utf-8").write(s)
print("units:", len(order))
for k in order:
    u = units[k]
    ud = u["unit_data"]["columns"] if u["unit_data"] else None
    ts = (u["tool_sequence"] or {}).get("columns"); ss = (u["shape_sequence"] or {}).get("columns")
    print(f"  {k:<10} {u['family']:<13} p{u['pages'][0]:<4} unit={ud} tool={'Y' if ts else '-'}{'(inh)' if (u['tool_sequence'] or {}).get('inherited_from') else ''} shape={'Y' if ss else '-'}{'(inh)' if (u['shape_sequence'] or {}).get('inherited_from') else ''} notes={sum(len(v) for v in u['notes'].values())}")
