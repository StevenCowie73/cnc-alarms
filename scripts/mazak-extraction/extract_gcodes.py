# Extract the G-code dataset for alarms.cowie.ai from the EIA/ISO
# programming manual (H747PB0030E) + the MAZATROL manual's ch.15
# three-digit G-format note (H747PA0029E).
#
# There is NO single G-code chapter: the base table lives in 3-7 "List of
# G-Codes" (code / function / modal group / marker flags), and per-code
# documentation is scattered across chapters 5-30, findable because the
# manual names codes in its section titles ("6-1 Positioning: G00").
# Strategy: parse the base list, map every code to the section(s) whose
# title names it (with range expansion "G45 to G48", zero-padding
# "G2.1"=="G02.1", and a small researched override table for codes whose
# sections don't name them), then split each section at the manual's own
# internal headings (Function and purpose / Programming format / Detailed
# description / Note:).
#
# Watermark rule: the serial-number watermark is set in 'Century'; body
# text is not. Text-only extraction; zero occurrences of the serial are
# asserted before writing. No page images are read or saved.

import collections
import json
import re
import sys
import unicodedata

import pdfplumber

PB = r"C:\Users\info\mazak-data\manuals\H747PB0030E.pdf"
PA = r"C:\Users\info\mazak-data\manuals\H747PA0029E.pdf"
OUT = r"C:\Users\info\mazak-gcodes.json"
SERIAL = "301508"

norm = lambda s: unicodedata.normalize("NFKC", s)


def clean(p):
    return p.filter(lambda o: o.get("object_type") != "char" or "Century" not in o.get("fontname", ""))


def load_pages(path):
    pdf = pdfplumber.open(path)
    texts, pagemap = {}, {}
    for i in range(len(pdf.pages)):
        t = norm(clean(pdf.pages[i]).extract_text() or "")
        texts[i + 1] = t
        lines = t.strip().split("\n")
        if lines:
            m = re.fullmatch(r"(\d{1,2}-\d{1,3})\s*E?", lines[-1].strip())
            if m:
                pagemap[m.group(1)] = i + 1
    return texts, pagemap


CODE = re.compile(r"G\d+(?:\.\d+)?")


def canon(code):
    """G2.1 -> G02.1 so list codes and title codes compare equal."""
    m = re.fullmatch(r"G(\d+)(\.\d+)?", code)
    n = int(m.group(1))
    return f"G{n:02d}{m.group(2) or ''}"


# ---- 1. base list (printed 3-11..3-14) ----------------------------------
def parse_base_list(texts, pagemap):
    rows = []
    for pp in ["3-11", "3-12", "3-13", "3-14"]:
        pg = pagemap[pp]
        for line in texts[pg].split("\n"):
            line = line.strip()
            m = re.match(
                r"^(.*?)\s+[■▲\uf06e\uf0d8]?(G\d+(?:\.\d+)?(?:/G\d+(?:\.\d+)?)*)\s*(\d{2})?$",
                line,
            )
            if not m or not m.group(1) or m.group(1).startswith(("Function", "List", "DATA")):
                continue
            rows.append({
                "codes": [canon(c) for c in m.group(2).split("/")],
                "name": m.group(1).strip(" ■▲"),
                "group": m.group(3),
                "default": "▲" in line or "\uf0d8" in line,
                "param_init": "■" in line or "\uf06e" in line,
                "printed_page": pp,
            })
    return rows


# ---- 2. TOC -------------------------------------------------------------
def parse_toc(texts, pagemap):
    toc = []
    for pg in range(11, 25):
        for line in texts.get(pg, "").split("\n"):
            m = re.match(r"^\s*(\d{1,2}(?:-\d{1,3})*)\s+(.+?)\s*\.{3,}\s*(\d{1,2}-\d{1,3})\s*$", line)
            if m:
                pp = m.group(3)
                pdf_pg = pagemap.get(pp)
                if not pdf_pg:
                    # printed pages are sequential within a chapter — derive
                    # from the nearest resolved neighbour
                    ch, n = pp.rsplit("-", 1)
                    for off in (1, -1, 2, -2, 3, -3):
                        nb = pagemap.get(f"{ch}-{int(n) + off}")
                        if nb:
                            pdf_pg = nb - off
                            break
                toc.append({"sec": m.group(1), "title": m.group(2).strip(), "pp": pp,
                            "pdf": pdf_pg})
    for i, t in enumerate(toc):
        t["pdf_end"] = next((x["pdf"] for x in toc[i + 1:] if x["pdf"]), t["pdf"])
    return toc


def title_codes(title):
    """Codes a section title names, with 'Gxx to Gyy' / 'Gxx - Gyy' ranges expanded."""
    out = set(canon(c) for c in CODE.findall(title))
    for m in re.finditer(r"G(\d+)\s*(?:to|-|–)\s*G(\d+)", title):
        a, b = int(m.group(1)), int(m.group(2))
        if 0 < b - a <= 10:
            out |= {f"G{n:02d}" for n in range(a, b + 1)}
    return out


# Codes whose documenting section does not name them in its title —
# researched by hand against the TOC (see session notes). Values are
# section numbers.
OVERRIDES = {
    "G05": ["22"],            # high-speed machining mode chapter
    "G38": ["12-5-3"],        # radius comp using other commands
    "G39": ["12-5-3"],
    "G10.1": ["12-7"],        # programmed data setting
    "G11": ["12-7"],
    "G41.2": ["28-4"], "G41.5": ["28-4"], "G42.2": ["28-4"], "G42.5": ["28-4"],
    "G43.4": ["28-1"], "G43.5": ["28-1"],
    "G43.8": ["28-2"], "G43.9": ["28-2"],   # cutting point command
    "G54.1": ["14-2"],                        # inside "G54 to G59" section
    "G54.4": ["28-5-1", "28-5-2"],            # workpiece setup error correction
    "G84.2": ["13-1-21"], "G84.3": ["13-1-21"],
    "G92.5": ["14-15"],
    "G136": ["17"], "G137": ["17"],
    "G140": ["29"],
}

HEADING = re.compile(
    r"^\s*\d\.\s+(Function and pur\w+|Programming format|Command format|Detailed description"
    r"|Description of function|Overview|Function description|Restrictions|Precautions.*"
    r"|Relat\w+ (?:functions|parameters).*)\s*$",
    re.I,
)

FIGURE_ID = re.compile(r"\bMEP\d+|\bTEP\d+|\bD7\d{5}\b")


def prose_fallback(text, cap=1100):
    """Sections without a 'Function and purpose' heading (fixed cycles,
    macros, later chapters): keep the sentence-like lines, drop the
    path-diagram debris and figure ids."""
    keep = []
    for ln in text.split("\n")[1:]:
        s = ln.strip()
        if len(s) < 40 or FIGURE_ID.search(s):
            continue
        if not re.search(r"[a-z]{3}.*\s.*[a-z]{3}", s):
            continue
        # legend lines belong in parameters, not the description
        if re.match(r"^[A-Za-z][\w.,/ ()+-]{0,24}\s*[:：]\s+\S", s):
            continue
        keep.append(s.lstrip("- "))
        if sum(len(k) for k in keep) > cap + 300:
            break
    return tidy(" ".join(keep), cap)


def format_fallback(text, code):
    """First command-syntax lines starting with the code itself."""
    pat = re.compile(rf"^\s*{re.escape(code)}\b[^a-z]*$|^\s*{re.escape(code)}\s+[A-Z\[]")
    alt = re.compile(rf"^\s*G{int(re.match(r'G(\d+)', code).group(1))}(?:\.\d+)?\s+[A-Z\[]")
    out = []
    for ln in text.split("\n")[:60]:
        s = ln.strip()
        if (pat.match(s) or alt.match(s)) and len(s) < 90:
            out.append(s)
        if len(out) >= 4:
            break
    return "\n".join(out)


def params_fallback(text):
    """Legend lines ('x : meaning') anywhere in the first stretch of the
    section — the fixed-cycle pages put these under the syntax line."""
    out = []
    for ln in text.split("\n")[:80]:
        s = ln.strip()
        if re.match(r"^[A-Za-z][\w.,/ ()+-]{0,24}\s*[:：]\s+\S", s) and not FIGURE_ID.search(s):
            out.append(tidy(s, 220))
        if len(out) >= 12:
            break
    return out


def section_text(texts, t, max_pages=12):
    """Text of a section: start page (sliced from the heading) .. end page."""
    pages = range(t["pdf"], min(t["pdf_end"] + 1, t["pdf"] + max_pages))
    chunks = []
    for pg in pages:
        body = texts.get(pg, "")
        if pg == t["pdf"]:
            # slice from the section heading line if present
            ix = body.find(t["sec"] + " ")
            if ix > 0:
                body = body[ix:]
        if pg == t["pdf_end"] and pg != t["pdf"]:
            # stop before the next section's heading if it starts on this page
            pass
        chunks.append(body)
    return "\n".join(chunks)


def split_section(text):
    """Split at the manual's own numbered headings; return dict of blocks."""
    lines = text.split("\n")
    blocks, cur, buf = {}, "_pre", []
    for ln in lines:
        m = HEADING.match(ln)
        if m:
            blocks.setdefault(cur, []).extend(buf)
            buf, cur = [], m.group(1).lower()
        else:
            buf.append(ln)
    blocks.setdefault(cur, []).extend(buf)
    return {k: "\n".join(v).strip() for k, v in blocks.items()}


def tidy(s, cap, prose=False):
    s = re.sub(r"\n{2,}", "\n", s or "").strip()
    # drop running headers / footers that survive mid-section
    kept = []
    for ln in s.split("\n"):
        t = ln.strip()
        if re.fullmatch(r"\d{1,2}", t) or re.fullmatch(r"\d{1,2}-\d{1,3}\s*E?", t):
            continue
        if re.fullmatch(r"[A-Z][A-Z /()-]{8,60}", t):
            continue
        # in prose (descriptions), drop figure/diagram debris lines
        if prose and (len(t) < 8 or FIGURE_ID.search(t) or not re.search(r"[a-z]{3}", t)):
            continue
        kept.append(ln)
    s = "\n".join(kept)
    if len(s) > cap:
        cut = s[:cap]
        s = cut[: max(cut.rfind("."), cut.rfind("\n"), cap - 200) + 1].rstrip() + " […]"
    return s.strip()


def extract_format_params(fmt_block):
    """Split a Programming/Command-format block into format lines and the
    address-word legend ('Where x, z ... denote', 'x : ...' lines)."""
    if not fmt_block:
        return "", []
    lines = [ln.rstrip() for ln in fmt_block.split("\n") if ln.strip()]
    fmt, params, in_legend = [], [], False
    for ln in lines:
        stripped = ln.strip()
        legend = (
            stripped.lower().startswith("where")
            or re.match(r"^[A-Za-zθα-ω#][\w.,/ ()+-]{0,26}\s*[:：]\s+\S", stripped)
        )
        if legend:
            in_legend = True
        (params if in_legend else fmt).append(stripped)
    return tidy("\n".join(fmt), 700), [tidy(p, 260) for p in params[:14]]


def extract_notes(text):
    """Note:/Notes: blocks anywhere in the section, capped."""
    notes = []
    for m in re.finditer(r"^\s*Notes?\s*:\s*$([\s\S]*?)(?=^\s*(?:\d\.\s|[A-Z][a-z]+\s*:\s*$)|\Z)",
                         text, re.M):
        body = tidy(m.group(1), 450)
        if body:
            notes.append(body)
    # single-line "Note: xxx"
    for m in re.finditer(r"^\s*Notes?\s*:\s+(\S.{10,400})$", text, re.M):
        notes.append(tidy(m.group(1), 450))
    seen, out = set(), []
    for n in notes:
        k = n[:60]
        if k not in seen:
            seen.add(k)
            out.append(n)
    return out[:6]


def main():
    texts, pagemap = load_pages(PB)
    rev = {v: k for k, v in pagemap.items()}
    base = parse_base_list(texts, pagemap)
    toc = parse_toc(texts, pagemap)
    by_sec = {t["sec"]: t for t in toc}

    # code -> matching toc sections (most specific first: longer sec number)
    matches = collections.defaultdict(list)
    for t in toc:
        if not t["pdf"]:
            continue  # printed page didn't resolve to a pdf page
        for c in title_codes(t["title"]):
            matches[c].append(t)
    for c, secs in OVERRIDES.items():
        for s in secs:
            if s in by_sec and by_sec[s] not in matches[c]:
                matches[c].append(by_sec[s])

    # merge multi-function codes (G68/G69 appear multiple times in the list)
    per_code = collections.OrderedDict()
    for row in base:
        shared = len(row["codes"]) > 1
        for c in row["codes"]:
            e = per_code.setdefault(c, {
                "code": c, "functions": [], "groups": set(),
                "default": False, "param_init": False, "listed_with": [],
            })
            e["functions"].append(row["name"])
            if row["group"]:
                e["groups"].add(row["group"])
            e["default"] |= row["default"]
            e["param_init"] |= row["param_init"]
            if shared:
                e["listed_with"] += [x for x in row["codes"] if x != c]

    entries = []
    documented = 0
    for c, e in per_code.items():
        secs = matches.get(c, [])
        secs = sorted(secs, key=lambda t: (0 if c in title_codes(t["title"]) else 1, t["pdf"]))
        primary = secs[0] if secs else None
        desc, fmt, params, notes, sec_title = "", "", [], [], None
        src_pages = ["3-11"]  # every code is in the list
        if primary:
            documented += 1
            stext = section_text(texts, primary)
            blocks = split_section(stext)
            desc = tidy(
                blocks.get("function and purpose", "") or blocks.get("function and purspose", "")
                or blocks.get("description of function", "") or blocks.get("overview", "")
                or blocks.get("function description", ""), 1100, prose=True)
            fmt, params = extract_format_params(
                blocks.get("programming format") or blocks.get("command format") or "")
            if not desc:
                desc = prose_fallback(stext)
            if not fmt:
                fmt = format_fallback(stext, c)
            if not params:
                params = params_fallback(stext)
            notes = extract_notes(stext)
            sec_title = f"{primary['sec']} {primary['title']}"
            for t in secs[:3]:
                for pg in range(t["pdf"], min(t["pdf_end"] + 1, t["pdf"] + 12)):
                    if pg in rev:
                        src_pages.append(rev[pg])
        group = sorted(e["groups"])[0] if e["groups"] else None
        entries.append({
            "code": c,
            "name": " / ".join(dict.fromkeys(e["functions"])),
            "group": group,
            "modal": (group != "00") if group else None,
            "default_on_reset": e["default"],
            "param_selectable_initial": e["param_init"],
            "listed_with": sorted(set(e["listed_with"])),
            "section": sec_title,
            "description": desc,
            "format": fmt,
            "parameters": params,
            "notes": notes,
            "source_pages": list(dict.fromkeys(src_pages))[:20],
        })

    def sortkey(e):
        m = re.match(r"G(\d+)(?:\.(\d+))?", e["code"])
        return (int(m.group(1)), int(m.group(2) or 0))
    entries.sort(key=sortkey)

    data = {
        "dataset": "Mazak INTEGREX e-670H / e-670H-S — MAZATROL SmoothX EIA/ISO G-code list",
        "source": {
            "document": "PROGRAMMING MANUAL for EIA/ISO PROGRAM",
            "manual_no": "H747PB0030E",
            "supplement": "H747PA0029E ch.15 reviewed and deliberately excluded: its 'three-digit G-format' (G300+, G420-G425) is the text EXPORT format for MAZATROL program data, not machining G-codes.",
            "machine": "Mazak INTEGREX e-670H / INTEGREX e-670H-S",
            "control": "MAZATROL SmoothX",
            "publisher": "Yamazaki Mazak Corporation",
            "warning": "G-code availability, groups and behaviour are specific to this machine model, control and fitted options. Verify against the manual for your own machine.",
            "extracted": "2026-08-24",
            "method": "Text-only extraction with pdfplumber; watermark glyphs removed by font; no page images saved.",
            "base_list": "Section 3-7 List of G-Codes (pp. 3-11..3-14); per-code detail from the section named in each entry.",
        },
        "count": len(entries),
        "documented_beyond_list": documented,
        "legend": {
            "default_on_reset": "Marked ▲ in the list: automatically selected in its group on power-on or reset with modal initialization.",
            "param_selectable_initial": "Marked ■ in the list: a parameter can select it as the initial modal condition.",
            "group": "Modal command group as printed; group 00 codes are one-shot (valid only in their own block).",
        },
        "gcodes": entries,
    }
    text = json.dumps(data, indent=1, ensure_ascii=False)
    assert SERIAL not in text, "serial number leaked into extraction"
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"wrote {OUT}: {len(entries)} codes, {documented} with section documentation")


if __name__ == "__main__":
    main()
