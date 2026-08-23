import pdfplumber, re, json, collections, datetime
from pypdf import PdfReader

PDF = r"C:\Users\info\mazak-data\manuals\HA64HA0035E.pdf"  # same file as the old Downloads\alarms.cowie.ai.pdf (identical SHA-256)
pdf = pdfplumber.open(PDF)
rd = PdfReader(PDF)

SOURCE = {
    "document": "PARAMETER LIST / ALARM LIST / M-CODE LIST",
    "manual_no": "HA64HA0035E",
    "machine": "Mazak INTEGREX e-670H / INTEGREX e-670H-S",
    "control": "MAZATROL SmoothX",
    "publisher": "Yamazaki Mazak Corporation (c) 2013",
    "warning": "Parameter addresses, ranges and M-code assignments are specific to this machine model and control. Verify against the manual for your own machine before changing anything.",
    "extracted": datetime.date.today().isoformat(),
    "method": "Text-only extraction with pdfplumber; watermark glyphs removed by font; no page images saved.",
}

ADDR_RE = re.compile(r"^[A-Z]{1,3}\d{1,4}$")
KEYS = ("Program type", "Conditions", "Unit", "Setting range")
FIG_RE = re.compile(r"^(MPL|MPM|MPS|MPE|MPT|MPD)\d{3,}$|^[A-Z]{2,3}\d{3}$")
GROUP_NORMALIZE = {"3-D": "LINE/FACE/3D"}


def norm_group(name):
    """'TAPE parameter' -> 'TAPE', 'Other' -> 'OTHER'; keeps slashes/dots."""
    g = re.sub(r"\s*parameter\s*$", "", name.strip(), flags=re.I).strip().upper()
    return GROUP_NORMALIZE.get(g, g)


def clean(p):
    return p.filter(lambda o: o.get("object_type") != "char" or "Century" not in o.get("fontname", ""))


def rows_of(p):
    rows = collections.defaultdict(list)
    for w in clean(p).extract_words():
        rows[round(w["top"] / 3)].append(w)
    out = []
    for k, v in sorted(rows.items()):
        v = sorted(v, key=lambda w: w["x0"])
        out.append({"top": v[0]["top"], "words": v})
    return out


def txt(words):
    return " ".join(w["text"] for w in words)


# ---------- section map from bookmarks ----------
def walk(items, depth=0, out=None):
    out = [] if out is None else out
    for it in items:
        if isinstance(it, list):
            walk(it, depth + 1, out)
        else:
            out.append((depth, it.title, rd.get_destination_page_number(it) + 1))
    return out


detail_secs = []
for d, t, pg in walk(rd.outline):
    m = re.match(r"2-3-(\d+)\s+(User parameter|Machine parameter|Data I/O parameter)\s+(.*?)\s*\((.*?)\)\s*$", t)
    if m:
        cat = {"User parameter": "User", "Machine parameter": "Machine", "Data I/O parameter": "Data I/O"}[m.group(2)]
        detail_secs.append((pg, cat, norm_group(m.group(3)), m.group(4)))
detail_secs.sort()


def section_for(pg):
    cur = None
    for s in detail_secs:
        if s[0] <= pg:
            cur = s
    return cur


# ---------- TASK 1a: summary list pages 19-100 ----------
list_entries = []
cat = grp = gcode = None
for pg in range(19, 101):
    prev = None
    for r in rows_of(pdf.pages[pg - 1]):
        t = txt(r["words"])
        x0 = r["words"][0]["x0"]
        m = re.match(r"^2-2-\d\s+(User|Machine|Data I/O) parameter", t)
        if m:
            cat = m.group(1)
            continue
        m = re.match(r"^\d+\.\s+(.*?)\s*\(([^)]+)\)\s*$", t)
        if m and x0 < 120:
            grp = norm_group(m.group(1))
            gcode = m.group(2)
            continue
        if r["top"] < 110 or r["top"] > 790:
            continue
        if t.startswith("Address") or t.startswith("(bit)") or t.startswith("Outline") or t.strip() in ("2", "PARAMETER"):
            continue
        if re.match(r"^2-\d+$", t.strip()):
            continue
        ws = r["words"]
        if x0 < 105 and ADDR_RE.match(ws[0]["text"]):
            addr = ws[0]["text"]
            rest = ws[1:]
            if len(rest) >= 2 and rest[0]["text"] == "-" and ADDR_RE.match(rest[1]["text"]):
                addr = f"{addr}-{rest[1]['text']}"
                rest = rest[2:]
            bit = None
            if rest and re.match(r"^\d$", rest[0]["text"]) and rest[0]["x0"] < 135:
                bit = int(rest[0]["text"])
                rest = rest[1:]
            e = {"address": addr, "bit": bit, "category": cat, "group": grp, "group_code": gcode,
                 "outline": txt(rest).strip(), "page": pg, "top": r["top"]}
            if prev and prev.get("orphan") and r["top"] - prev["top"] < 13:
                e["outline"] = (prev["text"] + " " + e["outline"]).strip()
                list_entries.pop()
            list_entries.append(e)
            prev = {"top": r["top"]}
        elif x0 >= 130:
            if list_entries and prev and not prev.get("orphan") and r["top"] - prev["top"] < 13 and list_entries[-1].get("page") == pg:
                list_entries[-1]["outline"] = (list_entries[-1]["outline"] + " " + t).strip()
                prev = {"top": r["top"]}
            else:
                list_entries.append({"orphan": True, "text": t, "top": r["top"], "page": pg})
                prev = {"top": r["top"], "orphan": True, "text": t}
list_entries = [e for e in list_entries if not e.get("orphan")]


# ---------- TASK 1b: detail pages 101-638 ----------
def seps(p):
    return sorted({round(r["top"]) for r in p.rects if (r["bottom"] - r["top"]) < 2 and r["x0"] < 70 and r["x1"] > 530})


def parse_band(words):
    rows = collections.defaultdict(list)
    for w in words:
        rows[round(w["top"] / 3)].append(w)
    addr_parts = []
    bit = None
    meaning = []
    kv = {}
    desc = []
    for k, v in sorted(rows.items()):
        v = sorted(v, key=lambda w: w["x0"])
        a = [w for w in v if w["x0"] < 105]
        mcol = [w for w in v if 105 <= w["x0"] < 268]
        d = [w for w in v if w["x0"] >= 268]
        for w in a:
            t = w["text"]
            if t.startswith("(bit"):
                mb = re.search(r"\d+", txt(a))
                bit = int(mb.group()) if mb else bit
                break
            if ADDR_RE.match(t) or t == "to":
                addr_parts.append(t)
        if mcol:
            mt = txt(mcol)
            hit = None
            for key in KEYS:
                if mt.startswith(key):
                    hit = key
                    break
            if hit:
                kv[hit] = mt[len(hit):].strip()
            elif not kv:
                meaning.append(mt)
        if d:
            d = [w for w in d if not FIG_RE.match(w["text"])]
            if not d:
                continue
            if d[0]["x0"] <= 300 or len(d) >= 6:
                desc.append(txt(d))
    # One band can carry several addresses: "D73 to D77" (a range) or
    # "BA27 BA30 BA33 BA36" (the same parameter for each barrier). Ranges
    # collapse to "D73-D77"; separate addresses become separate entries.
    addrs = []
    i = 0
    while i < len(addr_parts):
        if i + 2 < len(addr_parts) and addr_parts[i + 1] == "to":
            addrs.append(f"{addr_parts[i]}-{addr_parts[i + 2]}")
            i += 3
        elif addr_parts[i] != "to":
            addrs.append(addr_parts[i])
            i += 1
        else:
            i += 1
    return {"address": addrs[0] if addrs else None, "addresses": addrs, "bit": bit,
            "meaning": " ".join(meaning).strip(), "kv": kv, "desc": " ".join(desc).strip()}


detail = []
open_band = None
for pg in range(101, 639):
    p = pdf.pages[pg - 1]
    sec = section_for(pg)
    words = [w for w in clean(p).extract_words() if 118 < w["top"] < 792]
    ys = [y for y in seps(p) if 118 < y < 792]
    bounds = [118] + ys + [792]
    bands = []
    for i in range(len(bounds) - 1):
        y0, y1 = bounds[i], bounds[i + 1]
        bw = [w for w in words if y0 <= w["top"] < y1]
        if not bw:
            continue
        t = txt(sorted(bw, key=lambda w: (w["top"], w["x0"])))
        if t.startswith("Address Meaning") or t.strip() in ("Address", "Meaning", "Description"):
            continue
        if re.match(r"^2-\d+$", t.strip()):
            continue
        bands.append((y0, y1, bw))
    for idx, (y0, y1, bw) in enumerate(bands):
        closed = y1 != 792
        if open_band is not None and idx == 0 and y0 == 118:
            # Pages have no bottom rule, so the previous page's last band is
            # "open". It continues here only if this first band has no address
            # of its own (or the open band is still addressless).
            first_has_addr = parse_band(bw)["address"] is not None
            open_has_addr = parse_band(open_band["words"])["address"] is not None
            if first_has_addr and open_has_addr:
                detail.append(open_band)
                open_band = None
            else:
                open_band["words"] += bw
                open_band["pages"].append(pg)
                if closed:
                    detail.append(open_band)
                    open_band = None
                continue
        rec = {"words": bw, "pages": [pg], "sec": sec}
        if closed:
            detail.append(rec)
        else:
            open_band = rec
if open_band:
    detail.append(open_band)

detail_entries = []
for rec in detail:
    pr = parse_band(rec["words"])
    if not pr["address"]:
        continue
    sec = rec["sec"] or (None, None, None, None)
    for a in pr["addresses"]:
        detail_entries.append({"address": a, "bit": pr["bit"], "category": sec[1], "group": sec[2], "group_code": sec[3],
                               "meaning": pr["meaning"], "program_type": pr["kv"].get("Program type"), "conditions": pr["kv"].get("Conditions"),
                               "unit": pr["kv"].get("Unit"), "data_range": pr["kv"].get("Setting range"), "description": pr["desc"],
                               "pages": rec["pages"], "shared_row_with": [x for x in pr["addresses"] if x != a] or None})


# ---------- merge ----------
def norm(v):
    if v is None:
        return None
    v = v.strip()
    return None if v in ("", "—", "-", "–") else v


by_key = {}
for e in list_entries:
    by_key[(e["address"], e["bit"])] = {"address": e["address"], "bit": e["bit"], "group": e["group"], "group_code": e["group_code"], "category": e["category"],
                                       "name": e["outline"], "meaning": None, "description": None, "program_type": None, "conditions": None,
                                       "data_range": None, "unit": None, "default_value": None, "source_pages": [e["page"]]}
unmatched_detail = 0
for d in detail_entries:
    k = (d["address"], d["bit"])
    rec = by_key.get(k)
    if rec is None:
        unmatched_detail += 1
        rec = by_key[k] = {"address": d["address"], "bit": d["bit"], "group": d["group"], "group_code": d["group_code"], "category": d["category"],
                           "name": d["meaning"] or None, "meaning": None, "description": None, "program_type": None, "conditions": None,
                           "data_range": None, "unit": None, "default_value": None, "source_pages": []}
    rec["name"] = norm(rec.get("name")) or norm(d["meaning"])
    rec["meaning"] = norm(d["meaning"])
    rec["description"] = d["description"] or None
    rec["program_type"] = norm(d["program_type"])
    rec["conditions"] = norm(d["conditions"])
    rec["data_range"] = norm(d["data_range"])
    rec["unit"] = norm(d["unit"])
    rec["source_pages"] = sorted(set(rec["source_pages"] + d["pages"]))
    rec["shared_row_with"] = d.get("shared_row_with")
    if not rec.get("group"):
        rec["group"], rec["group_code"], rec["category"] = d["group"], d["group_code"], d["category"]


# Bit-table parents. Some bit parameters (D91, F91, K95 ...) are described in
# the detail section as ONE row with a bit diagram rather than one row per
# bit. The per-bit rows (from the summary list) keep their one-line names;
# the parent row keeps the full table text and the shared program type /
# conditions / range, and the two are cross-linked.
addrs_with_bits = {a for (a, b) in by_key if b is not None}
for (a, b), rec in list(by_key.items()):
    if b is None and a in addrs_with_bits and (rec.get("description") or rec.get("meaning")):
        rec["is_bit_parent"] = True
        if not rec.get("name"):
            rec["name"] = f"{a} — bit parameter (bits 0–7 listed separately)"
        for (a2, b2), r2 in by_key.items():
            if a2 == a and b2 is not None:
                r2["detail_in_parent"] = True
                for f in ("program_type", "conditions"):
                    if not r2.get(f):
                        r2[f] = rec.get(f)


def sort_key(r):
    m = re.match(r"([A-Z]+)(\d+)", r["address"])
    return (r["category"] or "", r["group"] or "", m.group(1), int(m.group(2)), r["bit"] if r["bit"] is not None else -1)


ORDER = ["address", "bit", "group", "group_code", "category", "name", "meaning", "description", "program_type", "conditions", "data_range", "unit", "default_value", "is_bit_parent", "detail_in_parent", "shared_row_with", "source_pages"]
params = [{k: r.get(k) for k in ORDER} for r in sorted(by_key.values(), key=sort_key)]

# CMT (section 2-3-19, p.608-609): the cassette-tape interface. Its three
# settings are named, not addressed, and laid out without an Address column,
# so the band parser cannot see them. Transcribed from the page text.
CMT_BASE = {"bit": None, "group": "CMT", "group_code": "CMT", "category": "Data I/O", "default_value": None,
            "is_bit_parent": None, "detail_in_parent": None, "shared_row_with": None}
params += [
    {**CMT_BASE, "address": "BAUDRATE", "name": "Baud rate for RS-232C interface", "meaning": "Baud rate for RS-232C interface",
     "description": "Set values: 110, 300, 1200, 2400, 4800, 9600, 19200.", "program_type": "M, E", "conditions": "At I/O startup",
     "data_range": "110 to 19200", "unit": None, "source_pages": [608]},
    {**CMT_BASE, "address": "SAME WNo.", "name": "Type of processing to be executed if the machining program of an existing work number is to be loaded",
     "meaning": "Type of processing to be executed if the machining program of an existing work number is to be loaded",
     "description": "Set values: ALARM — issues an alarm if the work number already exists. LOAD — overrides the program if the work number already exists.",
     "program_type": "M, E", "conditions": "At I/O startup", "data_range": None, "unit": None, "source_pages": [608]},
    {**CMT_BASE, "address": "PORT", "name": "CMT port selection", "meaning": "CMT port selection",
     "description": "Set values: COM1, COM2, COM3, COM4 — RS232C conversion connector.", "program_type": "M, E",
     "conditions": "At I/O startup", "data_range": None, "unit": None, "source_pages": [608]},
    {**CMT_BASE, "address": "CMT1-CMT32", "name": "Invalid", "meaning": "Invalid", "description": "Marked Invalid in the manual (not used on this control).",
     "program_type": None, "conditions": None, "data_range": None, "unit": None, "source_pages": [609]},
]

# ---------- TASK 2: M-codes ----------
mcodes = []
footnotes = {}
cur = None
for pg in range(841, 851):
    for r in rows_of(pdf.pages[pg - 1]):
        t = txt(r["words"])
        x0 = r["words"][0]["x0"]
        m = re.match(r"^(\*\d):\s*(.*)$", t)
        if m:
            footnotes[m.group(1)] = m.group(2).strip()
            continue
        if r["top"] < 110 or re.match(r"^4-\d+$", t.strip()) or t in ("M-codes Function", "4 M-CODE LIST", "M-CODE LIST", "4"):
            continue
        m = re.match(r"^(M\d{1,3})\b\s*(\(\*\d\))?\s*(.*)$", t)
        if x0 < 115 and m:
            cur = {"code": m.group(1), "description": m.group(3).strip(), "detail": [],
                   "markers": [m.group(2).strip("()")] if m.group(2) else [], "page": pg}
            mcodes.append(cur)
            continue
        if cur is not None:
            if not cur["description"] and x0 >= 140:
                cur["description"] = t.strip()
            else:
                cur["detail"].append(t.strip())
out_m = []
for m in mcodes:
    notes = []
    for mk in m["markers"]:
        if mk in footnotes:
            notes.append(f"{mk}: {footnotes[mk]}")
    if re.search(r"\(option\)", m["description"], re.I):
        notes.append("Option — not fitted on every machine")
    if m["description"].lower().startswith("not used"):
        notes.append("Not used on this machine")
    out_m.append({"code": m["code"], "description": m["description"], "detail": " ".join(m["detail"]).strip() or None,
                  "notes": notes, "source_page": m["page"]})

# ---------- write ----------
pj = {"dataset": "Mazak INTEGREX e-670H / e-670H-S — MAZATROL SmoothX parameter list", "source": SOURCE, "count": len(params), "fields": {
    "address": "Parameter address (e.g. F91, D12, TC5). Ranges such as J1-J40 are one row.",
    "bit": "Bit number for bit-type parameters (null for whole-value parameters)",
    "group": "Parameter group / display title", "group_code": "Letter code shown on the control (D, E, F, SU, TC ...)",
    "category": "User / Machine / Data I/O", "name": "Outline from the summary list (section 2-2)",
    "meaning": "Meaning text from the detailed description (section 2-3)",
    "description": "Detailed description text (section 2-3)",
    "program_type": "M = MAZATROL, E = EIA/ISO, as printed", "conditions": "When a changed value takes effect",
    "data_range": "Setting range as printed", "unit": "Unit as printed (null when the manual shows —)",
    "default_value": "Always null — this manual does not print default/initial values",
    "is_bit_parent": "true on an address-level row whose bits are described in one table in the manual; its description covers all bits",
    "detail_in_parent": "true on a per-bit row whose detailed text lives on the parent row (same address, bit null)",
    "shared_row_with": "Other addresses the manual documents in the same row (e.g. the same setting for barriers 1-4)",
    "source_pages": "PDF page numbers in HA64HA0035E"},
    "parameters": params}
mj = {"dataset": "Mazak INTEGREX e-670H / e-670H-S — MAZATROL SmoothX M-code list", "source": SOURCE, "count": len(out_m),
      "footnotes": footnotes, "mcodes": out_m}
for path, obj in ((r"C:\Users\info\mazak-parameters.json", pj), (r"C:\Users\info\mazak-mcodes.json", mj)):
    s = json.dumps(obj, ensure_ascii=False, indent=2)
    assert "301508" not in s, "serial number leaked into output"
    open(path, "w", encoding="utf-8").write(s)

# ---------- QA ----------
print("PARAMS:", len(params), "| list rows:", len(list_entries), "| detail entries:", len(detail_entries), "| detail-only:", unmatched_detail)
print("with description:", sum(1 for p in params if p["description"]), "| with data_range:", sum(1 for p in params if p["data_range"]),
      "| with unit:", sum(1 for p in params if p["unit"]), "| with meaning:", sum(1 for p in params if p["meaning"]))
print("by category:", dict(collections.Counter(p["category"] for p in params)))
print("by group:", dict(collections.Counter(p["group"] for p in params)))
print("missing name:", sum(1 for p in params if not p["name"]), "| missing group:", sum(1 for p in params if not p["group"]))
print("MCODES:", len(out_m), "| footnotes:", footnotes, "| not used:", sum(1 for m in out_m if m["description"].lower().startswith("not used")))
glued = [p["address"] for p in params if not re.match(r"^[A-Z]{1,3}\d{1,4}(-[A-Z]{1,3}\d{1,4})?$", p["address"])]
print("malformed addresses:", len(glued), glued[:10])
print("entries spanning 2+ detail pages:", sum(1 for p in params if len([x for x in p["source_pages"] if x > 100]) > 1))
print("\n=== QA: D91 / D92 bit rows (list vs detail) ===")
for p in params:
    if p["address"] in ("D91", "D92") and p["bit"] in (0, 1):
        print(f"  {p['address']} bit{p['bit']}: pages={p['source_pages']} name={str(p['name'])[:45]!r} desc={'yes' if p['description'] else 'NO'}")
print("=== QA: detail-only keys by group (no summary-list row) ===")
do = [p for p in params if min(p["source_pages"]) > 100]
print(" ", len(do), dict(collections.Counter(p["group"] for p in do)))
print("  sample:", [(p["address"], p["bit"]) for p in do[:20]])
print("=== QA: rows missing a name ===")
print("  ", [(p["address"], p["bit"], p["group"]) for p in params if not p["name"]][:48])
print("\n===== SAMPLE PARAMETERS =====")
want = [("D1", None), ("D91", 0), ("F1", None), ("TC5", None), ("K1", None)]
for a, b in want:
    for p in params:
        if p["address"] == a and p["bit"] == b:
            print(json.dumps(p, ensure_ascii=False, indent=1))
            break
    else:
        print("  (not found)", a, b)
print("\n===== SAMPLE M-CODES =====")
for code in ("M00", "M06", "M49", "M300", "M234"):
    for m in out_m:
        if m["code"] == code:
            print(json.dumps(m, ensure_ascii=False, indent=1))
            break
