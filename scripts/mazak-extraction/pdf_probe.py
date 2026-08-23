"""Quick look inside a (watermarked) Mazak manual PDF: metadata, page count, bookmark outline, keyword page-counts.

Usage:  python pdf_probe.py <file.pdf> [keyword ...]
"""
import sys, re
from pypdf import PdfReader
path = sys.argv[1]; keys = [k.lower() for k in sys.argv[2:]]
r = PdfReader(path); m = r.metadata or {}
print("pages:", len(r.pages), "| encrypted:", r.is_encrypted)
for k in ("/Title", "/Subject", "/Keywords", "/Author", "/CreationDate", "/ModDate"): print(f"  {k[1:]:<13}: {m.get(k)}")
def walk(items, d=0):
    for it in items:
        if isinstance(it, list): walk(it, d + 1)
        else:
            try: pg = r.get_destination_page_number(it) + 1
            except Exception: pg = "?"
            print(f"  {'  ' * d}{it.title}  (p.{pg})")
print("--- outline ---"); walk(r.outline) if r.outline else print("  (none)")
if keys:
    cnt = {k: 0 for k in keys}; first = {k: None for k in keys}
    for i, p in enumerate(r.pages):
        t = (p.extract_text() or "").lower()
        for k in keys:
            if k in t:
                cnt[k] += 1
                if first[k] is None: first[k] = i + 1
    print("--- keyword scan (pages containing / first page) ---")
    for k in keys: print(f"  {k:<24} {cnt[k]:>5}  first p.{first[k]}")
