"""Structural analysis of Mazatrol SmoothX program files (.MPR / .PBN / .u_solid / .v_solid).

Reproduces the 2026-08-22 reverse-engineering pass documented in
C:\\Users\\info\\mazak-data\\PROGRAM-FORMAT.md. Read-only.

Usage:
    python probe_programs.py                  # full census + MPR-vs-PBN comparison
    python probe_programs.py 11618B           # also dump that program's unit outline
    python probe_programs.py 1949B --hex      # plus a hex view of its first records

Paths below match the layout created by the 2026-08-22 survey; edit if moved.
"""
import os, sys, glob, struct, collections, hashlib

MPR_DIRS = [r"C:\Users\info\mazak-data\programs\mc-backup-programs",
            r"C:\Users\info\mazak-data\programs\mc-machine-programs"]
PBN_DIR  = r"C:\Users\info\mazak-programs"
REC = 100            # record size
PBN_PREAMBLE = 260   # 60-byte file header + comment record + length record
SEQ_TYPES = {0xa8, 0xb4, 0xa1, 0xff, 0xaa, 0xb8, 0xc2, 0xab, 0xb1, 0xb0, 0x1c0, 0xb2}

u16 = lambda b, o: struct.unpack_from("<H", b, o)[0]
i32 = lambda b, o: struct.unpack_from("<i", b, o)[0]


def collect():
    mpr = {}
    for d in MPR_DIRS:
        for p in glob.glob(os.path.join(d, "**", "*.[mM][pP][rR]"), recursive=True):
            mpr.setdefault(os.path.splitext(os.path.basename(p))[0].upper(), []).append(p)
    pbn = {os.path.splitext(f)[0].upper(): os.path.join(PBN_DIR, f)
           for f in os.listdir(PBN_DIR) if f.lower().endswith(".pbn")} if os.path.isdir(PBN_DIR) else {}
    return mpr, pbn


def records(body):
    return [body[o:o + REC] for o in range(0, len(body) - len(body) % REC, REC)]


def census(mpr, pbn):
    allm = [p for ps in mpr.values() for p in ps]
    sizes = [os.path.getsize(p) for p in allm]
    print(f"== .MPR files: {len(allm)} | size mod 100 = 0 in {sum(1 for s in sizes if s % 100 == 0)} | "
          f"min {min(sizes)} max {max(sizes)} B ({min(sizes)//100}..{max(sizes)//100} records)")
    first = collections.Counter(); last = collections.Counter(); types = collections.Counter()
    units = collections.Counter(); seqs = collections.Counter()
    for p in allm:
        b = open(p, "rb").read(); rs = records(b)
        first[u16(rs[0], 0)] += 1; last[u16(rs[-1], 0)] += 1
        unit_no = 0
        for r in rs:
            t, n = u16(r, 0), u16(r, 2); types[t] += 1
            if t not in SEQ_TYPES and n == unit_no + 1: unit_no = n; units[t] += 1
            else: seqs[t] += 1
    fmt = lambda c: {f"0x{k:x}": v for k, v in c.most_common()}
    print("   first record type:", fmt(first)); print("   last record type:", fmt(last))
    print("   record types (all):", fmt(types))
    print("   behaving as UNITS (number increments):", fmt(units))
    print("   behaving as SEQUENCE LINES (restart at 1):", fmt(seqs))
    if pbn:
        ps = list(pbn.values())
        hdr = [open(p, "rb").read(60) for p in ps]
        const = "".join(f"{hdr[0][i]:02x}" if all(h[i] == hdr[0][i] for h in hdr) else ".." for i in range(60))
        ok = sum(1 for p in ps if u16(open(p, "rb").read(), 160) == os.path.getsize(p) - PBN_PREAMBLE)
        print(f"== .PBN files: {len(ps)} | size mod 100 = 60 in {sum(1 for p in ps if os.path.getsize(p) % 100 == 60)} | "
              f"rec1.word0 == filesize-260 in {ok}/{len(ps)}")
        print("   constant header bytes:", const)


def compare(mpr, pbn):
    both = sorted(set(mpr) & set(pbn))
    ident = 0; same_len = []; diff_len = []
    offs = collections.Counter()
    for n in both:
        body = open(pbn[n], "rb").read()[PBN_PREAMBLE:]
        hit = False
        for m in mpr[n]:
            M = open(m, "rb").read()
            if M == body: hit = True; break
        if hit: ident += 1; continue
        M = open(mpr[n][0], "rb").read()
        if len(M) == len(body):
            d = [(i // REC, i % REC) for i, (a, b) in enumerate(zip(M, body)) if a != b]
            same_len.append((n, len(d)))
            for rec, off in d: offs[off // 4 * 4] += 1
        else:
            diff_len.append((n, len(M), len(body)))
    print(f"== programs in both formats: {len(both)} | MPR == PBN[260:] byte-identical: {ident} | "
          f"same length but edited: {len(same_len)} | different length (units added/removed): {len(diff_len)}")
    print("   edited int32 slots (byte offset within 100-byte record, count):", sorted(offs.items(), key=lambda x: -x[1])[:12])
    print("   same-length edits:", same_len)
    print("   length changes (name, MPR bytes, PBN body bytes):", diff_len)


def outline(path, show_hex=False):
    b = open(path, "rb").read()
    body = b[PBN_PREAMBLE:] if path.lower().endswith(".pbn") else b
    if path.lower().endswith(".pbn"):
        print("   PBN comment:", b[0x50:0x70].split(b"\0")[0].decode("latin1"))
    rs = records(body)
    print(f"== {os.path.basename(path)}: {len(rs)} records | material: {rs[0][84:92]!r} | "
          f"common-unit int32/1e4 @60..80: {[i32(rs[0], k) / 1e4 for k in range(60, 84, 4)]}")
    for i, r in enumerate(rs):
        t, n = u16(r, 0), u16(r, 2)
        vals = [i32(r, k) for k in range(36, 100, 4)]
        big = [f"{v / 1e4:g}" for v in vals if v and abs(v) < 50_000_000]
        kind = "  seq" if t in SEQ_TYPES else "UNIT"
        print(f"   rec{i:02d} {kind} type=0x{t:<4x} n={n:<3} hdr={[u16(r, k) for k in (4, 6, 8, 10)]} /1e4={big[:8]}")
        if show_hex and i < 4:
            for o in range(0, REC, 20): print("        " + r[o:o + 20].hex(" "))


def solids():
    us = glob.glob(os.path.join(MPR_DIRS[1], "**", "*.u_solid"), recursive=True)
    vs = glob.glob(os.path.join(MPR_DIRS[1], "**", "*.v_solid"), recursive=True)
    if not us: return
    sizes = collections.Counter(os.path.getsize(p) for p in us)
    distinct = len({hashlib.md5(open(p, "rb").read()).hexdigest() for p in us})
    data = [open(p, "rb").read() for p in us]
    varying = [i for i in range(min(map(len, data))) if len({d[i] for d in data}) > 1]
    print(f"== .u_solid: {len(us)} files, sizes {dict(sizes)}, {distinct} distinct contents, bytes that vary across files: {len(varying)} at {varying[:20]}")
    print(f"== .v_solid: {len(vs)} files, distinct contents: {len({open(p, 'rb').read() for p in vs})}, sizes {set(os.path.getsize(p) for p in vs)}")


if __name__ == "__main__":
    mpr, pbn = collect()
    census(mpr, pbn)
    compare(mpr, pbn)
    solids()
    for arg in [a for a in sys.argv[1:] if not a.startswith("--")]:
        key = arg.upper()
        paths = mpr.get(key, []) + ([pbn[key]] if key in pbn else [])
        if not paths: print(f"!! {key} not found"); continue
        for p in paths: outline(p, "--hex" in sys.argv)
