# Mazak extraction scripts

The scripts that produced the Mazak reference datasets and the program-format analysis (2026-08-22/23). Kept here so the datasets are reproducible and the analysis can be re-run when a bug is found. All are **read-only** against their inputs and **text-only** — no page images are ever written (every Mazak manual page carries a machine-serial watermark).

Inputs they expect (the layout created by the 2026-08-22 control-PC survey):

| Input | Path |
|---|---|
| Parameter / alarm / M-code list, HA64HA0035E, 850 pp | `C:\Users\info\mazak-data\manuals\HA64HA0035E.pdf` |
| Mazatrol programming manual, H747PA0029E, 740 pp | `C:\Users\info\mazak-data\manuals\H747PA0029E.pdf` |
| Live + archived programs (`.MPR`, `.u_solid`, `.v_solid`) | `C:\Users\info\mazak-data\programs\{mc-machine-programs,mc-backup-programs}\` |
| Exported programs (`.PBN`), 253 of them | `C:\Users\info\mazak-programs\` |

Requirements: Python 3.12, `pip install pypdf pdfplumber`. Run from anywhere; paths are absolute constants at the top of each file. Set `PYTHONIOENCODING=utf-8` on Windows consoles (the manuals contain `φ`, `°`, `±`).

## The scripts

### `extract_parameters_mcodes.py` → `C:\Users\info\mazak-parameters.json`, `C:\Users\info\mazak-mcodes.json`
Parses HA64HA0035E. Section 2-2 (pp. 19–100) gives every parameter address + outline; section 2-3 (pp. 101–638) gives the detailed entries, found by banding each page between the full-width table rules and splitting into address / meaning / description columns by x-position; the two are merged on `(address, bit)`. Section 4 (pp. 841–850) gives the M-codes. Output: **2,244 parameters** (1,066 User / 1,071 Machine / 107 Data I/O; 1,840 with a detailed description; `default_value` is always null because the manual prints none) and **196 M-codes** (40 of them "Not used"). Runtime ≈ 4 min. Labels the dataset INTEGREX e-670H / SmoothX — parameters and M-codes are machine-specific.

### `extract_unit_definitions.py` → `C:\Users\info\mazak-unit-definitions.json`
Parses Section 7 of H747PA0029E (pp. 89–620). For each of the **87 unit types** it records the blue unit-data columns, the tan tool-sequence columns and the green shape-sequence columns in screen order (from the `UNo. UNIT …`, `SNo. TOOL …` and `FIG …` header lines), plus `[n]`-keyed field notes and setting ranges. Point/line/face families share one tool/shape table in the manual; those are stored once in `family_shared_tables` and inherited with `inherited_from` set. C-axis variants are kept separate (`"DRILLING [C]"`). Columns are authoritative; notes are thin for point/line/face families (the manual numbers those items differently). Runtime ≈ 3 min.

### `probe_programs.py`
Structural analysis of the program files — the evidence behind `C:\Users\info\mazak-data\PROGRAM-FORMAT.md`. Census of record types over all `.MPR` files, the `.PBN`-vs-`.MPR` byte comparison (which also lists the programs edited since the PBN export and which record slots changed), the `.u_solid`/`.v_solid` check, and an optional per-program unit outline: `python probe_programs.py 11618B [--hex]`.

### `pdf_probe.py <file.pdf> [keyword …]`
Metadata, page count, bookmark outline and keyword page-counts for any of the manuals. First thing to run on a manual you haven't opened.

### `pdf_dump_pages.py <file.pdf> text|words <page …>`
Cleaned text (or per-word x-positions) of specific pages. `words` mode is how the column boundaries for the extractors were found.

## The one trick that makes all of this work
The manuals are watermarked with the machine serial number and a diagonal copyright line, and their glyphs interleave with the real text in any naive extraction. Both are set in the **`Century`** font while body text is Arial/Helvetica/Courier, so every script filters `pdfplumber` chars by `"Century" not in fontname` before reading. If a future manual uses a different watermark font, check `page.chars` font names first (see `probe3` logic inside `pdf_dump_pages.py`).

## Re-running
```bash
cd scripts/mazak-extraction
set PYTHONIOENCODING=utf-8
python extract_parameters_mcodes.py
python extract_unit_definitions.py
python probe_programs.py 1949B
```
Each extractor asserts that the serial number string never reaches the output file.
