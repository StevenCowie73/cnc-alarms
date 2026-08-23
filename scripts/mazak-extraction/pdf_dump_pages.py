"""Dump cleaned text of specific pages from a Mazak manual, with the diagonal 'Century'-font watermark removed.

Usage:  python pdf_dump_pages.py <file.pdf> text  19 20 103     # layout-preserving text
        python pdf_dump_pages.py <file.pdf> words 103           # one line per text row with x0 of each word (find column boundaries)
"""
import sys, collections, pdfplumber
path, mode, pages = sys.argv[1], sys.argv[2], [int(x) for x in sys.argv[3:]]
pdf = pdfplumber.open(path)
def clean(p):  # the serial-number watermark and the rotated copyright line are set in 'Century'; body text is Arial/Helvetica/Courier
    return p.filter(lambda o: o.get("object_type") != "char" or "Century" not in o.get("fontname", ""))
for pg in pages:
    p = clean(pdf.pages[pg - 1])
    print(f"\n################ PAGE {pg} (w={pdf.pages[pg-1].width:.0f}) ################")
    if mode == "text":
        print(p.extract_text(layout=True) or "")
    else:
        rows = collections.defaultdict(list)
        for w in p.extract_words(): rows[round(w["top"])].append(w)
        for top in sorted(rows):
            print(f"{top:>4}: " + " ".join(f"[{w['x0']:.0f}]{w['text']}" for w in sorted(rows[top], key=lambda w: w["x0"]))[:170])
