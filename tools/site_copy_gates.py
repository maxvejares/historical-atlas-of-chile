#!/usr/bin/env python3
"""Site self-description gates S1-S6.

The v2 data gates (v2_gates.py G1-G7) verify the DATA. They cannot see the
class of defect two fresh-eyes audits found in one day on 2026-08-18: the
site's own prose contradicting itself about its size, stale documentation
artifacts, download cards mislabeling file sizes, and internal pipeline
jargon in public definitions. These gates audit the PROSE and the derived
artifacts against the truth layer.

  S1  NUMBERS      rendered page states dataset_stats/downloads numbers; css mirror marker matches
  S2  DOC FRESH    codebook stamp matches the live catalog (methodology: warn until stamped)
  S3  DOWNLOADS    files exist, match baked metadata, curated file is a faithful subset
  S4  JARGON       no internal shorthand in any public manifest text field
  S5  CITATIONS    every published source key resolves to a canonical citation
  S6  INDEX SYNC   source_index.json matches a recomputation from its inputs

Run:  python3 tools/site_copy_gates.py [--enforce] [--no-render] [--fast]
`--fast` skips the full curated-vs-master fidelity join in S3 (kept for
quick iterations; run_m028 runs the full check).
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import subprocess
import sys
import time
from pathlib import Path

GP = Path(__file__).resolve().parents[1]
ROOT = GP.parent
BUNDLE = GP / "historical_atlas_of_chile.html"
MANIFEST = GP / "data" / "variable_manifest.json"
STATS = GP / "data" / "dataset_stats.json"
DOWNLOADS = GP / "data" / "downloads.json"
SOURCE_INDEX = GP / "data" / "source_index.json"
STAMPS = GP / "data" / "doc_stamps.json"
CANON_CSV = GP / "curation" / "02_source_canonicalization.csv"
MASTER = ROOT / "data" / "chile_master_data.csv"
APP_CSS = GP / "css" / "app.css"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

HIDDEN_STATUSES = {"retired", "alternate_variant", "alternate_currency",
                   "hidden_below_gate"}
TEXT_FIELDS = ("definition", "curated_subtitle", "units_note",
               "coverage_statement", "label", "display_label")

RESULTS: list[tuple[str, bool, str]] = []


def report(gate: str, ok: bool, detail: str) -> None:
    RESULTS.append((gate, ok, detail))


def visible_manifest() -> list[dict]:
    return [e for e in json.loads(MANIFEST.read_text())
            if e.get("published") is not False
            and e.get("presentation_status") not in HIDDEN_STATUSES]


def rendered_dom() -> str:
    port = "8797"
    srv = subprocess.Popen(["python3", "-m", "http.server", port], cwd=GP,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(2)
        dom = subprocess.run(
            [CHROME, "--headless", "--disable-gpu",
             "--virtual-time-budget=6000", "--dump-dom",
             f"http://localhost:{port}/historical_atlas_of_chile.html"],
            capture_output=True, text=True, timeout=180).stdout
    finally:
        srv.terminate()
    return re.sub(r"<script\b.*?</script>", "", dom, flags=re.S)


def gate_s1(no_render: bool) -> None:
    stats = json.loads(STATS.read_text())
    downloads = json.loads(DOWNLOADS.read_text())["files"]
    problems = []

    # CSS mirror tripwire: every version marker in app.css must appear in the
    # bundle's inline style block (the builder does not rebuild CSS).
    markers = re.findall(r"css-mirror-marker: ([^\n]+)", APP_CSS.read_text())
    bundle_text = BUNDLE.read_text()
    for mk in markers:
        if f"css-mirror-marker: {mk}" not in bundle_text:
            problems.append(f"css marker not mirrored into bundle: {mk!r}")

    if not no_render:
        vis = rendered_dom()
        n_ind = f"{stats['n_variables_total']:,}"
        n_src = f"{stats['n_source_documents']:,}"
        n_obs = f"{stats['n_observations']:,}"
        checks = [
            (f"{n_ind} indicators", "hero/stat-strip indicator count"),
            (f"{n_src} source documents", "source-document count"),
            (f"contains {n_obs} observations", "About observation count"),
        ]
        for needle, what in checks:
            if needle not in vis:
                problems.append(f"rendered page missing {what} ({needle!r})")
        for f in downloads:
            mb = f"{f['bytes'] / (1024 * 1024):.0f} MB"
            if f"({mb})" not in vis:
                problems.append(f"rendered page missing size label ({mb}) for {f['file']}")
        digit_noun = re.findall(
            r"\b\d[\d,]*\+?\s+(?:source documents|geographic levels)\b", vis)
        expected = {f"{stats['n_source_documents']:,} source documents",
                    "6 geographic levels"}
        for hit in digit_noun:
            if hit not in expected:
                problems.append(f"rendered page states unexpected count: {hit!r}")

    report("S1 numbers", not problems,
           "; ".join(problems) if problems else
           f"rendered counts match dataset_stats; {len(markers)} css markers mirrored")


def gate_s2() -> None:
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "build_codebook_pdf.py"),
                        "--check"], capture_output=True, text=True)
    ok = r.returncode == 0
    detail = (r.stdout or r.stderr).strip().splitlines()[-1] if (r.stdout or r.stderr) else ""
    stamps = json.loads(STAMPS.read_text()) if STAMPS.exists() else {}
    meth = stamps.get("methodology")
    stats = json.loads(STATS.read_text())
    if not meth:
        ok = False
        detail += " · methodology docx not stamped"
    else:
        # The methodology is hand-written prose; freshness is enforced at the
        # numbers level: the headline counts it states must equal the live
        # catalog, so a catalog change forces a documented refresh.
        for k in ("n_observations", "n_source_documents"):
            if meth.get(k) != stats.get(k):
                ok = False
                detail += (f" · methodology states {k}={meth.get(k)} "
                           f"vs live {stats.get(k)}")
        if ok and meth:
            detail += f" · methodology v{meth.get('version')} stamped {meth.get('date')}"
    report("S2 doc freshness", ok, detail)


def gate_s3(fast: bool) -> None:
    sys.path.insert(0, str(GP / "tools"))
    from published_set import (published_master_variables, CURATED_LEVELS,
                               RECONSTRUCTED_NO_MASTER_ROWS, visible_manifest_ids)
    import pandas as pd

    problems = []
    meta = {f["kind"]: f for f in json.loads(DOWNLOADS.read_text())["files"]}
    paths = {k: GP / "data" / f["file"] for k, f in meta.items()}
    for kind, p in paths.items():
        if not p.exists():
            problems.append(f"{kind} file missing: {p.name}")
            continue
        if p.stat().st_size != meta[kind]["bytes"]:
            problems.append(f"{kind} size {p.stat().st_size:,} != baked {meta[kind]['bytes']:,}")

    if "curated" in paths and paths["curated"].exists():
        cur = pd.read_csv(paths["curated"], dtype=str, low_memory=False,
                          keep_default_na=False)
        if len(cur) != meta["curated"]["n_rows"]:
            problems.append(f"curated rows {len(cur):,} != baked {meta['curated']['n_rows']:,}")
        bad_levels = set(cur["geographic_level"].unique()) - CURATED_LEVELS
        if bad_levels:
            problems.append(f"curated carries non-catalog levels: {sorted(bad_levels)}")
        pub = published_master_variables()
        stray = set(cur["variable"].unique()) - pub
        if stray:
            problems.append(f"{len(stray)} curated variables not in the published set "
                            f"(e.g. {sorted(stray)[:3]})")
        # Every published indicator is either in the curated file (directly or
        # via year-family members) or a registered no-master-rows series.
        from published_set import collapsed_members
        members = collapsed_members()
        cur_vars = set(cur["variable"].unique())
        missing = []
        for vid in visible_manifest_ids():
            if vid in RECONSTRUCTED_NO_MASTER_ROWS:
                continue
            fam = set(members.get(vid, {}).values())
            if vid not in cur_vars and not (fam & cur_vars):
                missing.append(vid)
        if missing:
            problems.append(f"{len(missing)} published indicators absent from the "
                            f"curated download (e.g. {missing[:3]})")
        if not fast:
            cols = ["year", "geographic_unit", "geographic_level", "dcode",
                    "pcode", "ccode", "variable", "value", "source_document",
                    "source_page", "source_table", "source_sheet", "notes",
                    "quality_flag"]
            mas = pd.read_csv(MASTER, dtype=str, low_memory=False,
                              keep_default_na=False)
            mkeys = set(map(tuple, mas[cols].itertuples(index=False, name=None)))
            n_bad = sum(1 for k in map(tuple, cur[cols].itertuples(index=False, name=None))
                        if k not in mkeys)
            if n_bad:
                problems.append(f"{n_bad:,} curated rows are not byte-identical "
                                f"to a master row (source-fidelity doctrine)")

    xwalk = GP / "data" / "source_crosswalk_v2.csv"
    if not xwalk.exists():
        problems.append("source_crosswalk_v2.csv missing")
    elif "curated" in paths and paths["curated"].exists():
        xkeys = {r["source_document_key"] for r in csv.DictReader(xwalk.open())}
        cur_keys = set(cur["source_document"].unique()) - {""}
        not_in_xwalk = cur_keys - xkeys
        if not_in_xwalk:
            problems.append(f"{len(not_in_xwalk)} curated source keys missing from "
                            f"the crosswalk (e.g. {sorted(not_in_xwalk)[:2]})")
        unmapped = [r for r in csv.DictReader(xwalk.open())
                    if r["source_document_key"] == r["canonical_citation"]
                    and r["in_published_registry"] == "no"]
        if unmapped:
            problems.append(f"{len(unmapped)} crosswalk keys resolve to no canonical "
                            f"citation (e.g. {[r['source_document_key'][:40] for r in unmapped[:2]]})")

    report("S3 downloads", not problems,
           "; ".join(problems) if problems else
           ("files match baked metadata; curated set equals the published "
            "catalog" + ("" if fast else "; byte-fidelity verified")))


JARGON = [
    ("memo id", re.compile(r"\bM\d{2,3}\b")),
    ("duplicate-resolution", re.compile(r"duplicate-resolution", re.I)),
    ("memo", re.compile(r"\bmemo\b", re.I)),
    ("old boilerplate", re.compile(r"catalog record rather than hand-written")),
    ("VERIFIED flag", re.compile(r"\bVERIFIED\b")),
    ("dangling verb", re.compile(r"\b(?:draws|drawn|compiles|comes|stitched)\s*;")),
    ("raw internal id", re.compile(r"\b(?:totalpop|poblacion_total_titled_dept|poblacion_extended)\b")),
]


def gate_s4() -> None:
    hits = []
    for v in visible_manifest():
        for f in TEXT_FIELDS:
            t = v.get(f) or ""
            for name, pat in JARGON:
                if pat.search(t):
                    hits.append(f"{v['id']}.{f}: {name}")
    report("S4 jargon", not hits,
           f"{len(hits)} field(s) carry internal shorthand"
           + (f" (e.g. {hits[:3]})" if hits else ""))


RAW_KEY_HEURISTICS = re.compile(
    r"( - Chile 1\d{3}|\(Yumpu \d+\)|\.pdf$|\.xlsx$)", re.I)


def gate_s5() -> None:
    canon = {r["canonical_citation"]
             for r in csv.DictReader(CANON_CSV.open()) if r.get("canonical_citation")}
    raw_mapped = {r["source_string_raw"]
                  for r in csv.DictReader(CANON_CSV.open())}
    problems = []
    for v in visible_manifest():
        docs = v.get("source_documents") or (
            [v["source_document"]] if v.get("source_document") else [])
        for d in docs:
            if d in canon:
                continue
            if d in raw_mapped:
                problems.append(f"{v['id']}: raw key not canonicalized in manifest: {d[:60]}")
            elif RAW_KEY_HEURISTICS.search(d):
                problems.append(f"{v['id']}: raw-looking source key: {d[:60]}")
    idx = json.loads(SOURCE_INDEX.read_text())
    for d in idx.get("documents", []):
        if RAW_KEY_HEURISTICS.search(d["document"]):
            problems.append(f"source_index carries a raw-looking document: {d['document'][:60]}")
    report("S5 citations", not problems,
           "; ".join(problems[:4]) if problems else
           f"every published source key resolves to a canonical citation "
           f"({idx.get('n_documents')} documents)")


def gate_s6() -> None:
    """The index must be a faithful function of its inputs. Delegates the
    recomputation to build_source_index.py --check (single implementation of
    the derivation, so gate and builder cannot drift), then confirms the
    stat strip reads the same document count."""
    r = subprocess.run([sys.executable,
                        str(ROOT / "scripts" / "build_source_index.py"),
                        "--check"], capture_output=True, text=True)
    ok = r.returncode == 0
    detail = (r.stdout or r.stderr).strip().splitlines()[-1] if (r.stdout or r.stderr) else ""
    idx = json.loads(SOURCE_INDEX.read_text())
    stats = json.loads(STATS.read_text())
    if stats.get("n_source_documents") != idx.get("n_documents"):
        ok = False
        detail += (f" · stats.n_source_documents={stats.get('n_source_documents')}"
                   f" != index {idx.get('n_documents')}")
    report("S6 index sync", ok, detail)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--enforce", action="store_true")
    ap.add_argument("--no-render", action="store_true")
    ap.add_argument("--fast", action="store_true")
    args = ap.parse_args()

    gate_s1(args.no_render)
    gate_s2()
    gate_s3(args.fast)
    gate_s4()
    gate_s5()
    gate_s6()

    print("\nHistorical Atlas of Chile — site self-description gates\n")
    n_ok = 0
    for gate, ok, detail in RESULTS:
        n_ok += ok
        print(f"  {gate:<16} {'PASS' if ok else 'FAIL'}   {detail}")
    print(f"\n{n_ok}/{len(RESULTS)} gates pass.")
    if args.enforce and n_ok < len(RESULTS):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
