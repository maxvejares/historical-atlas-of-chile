#!/usr/bin/env python3
"""G8 DISPLAY=DOWNLOAD — every rendered cell must be reproducible from the
curated public CSV.

The 2026-08-19 external audit's core finding: the UI renders from
window_data.js while the public download filters chile_master_data.csv, and
nothing compared the two at the CELL level. G1 traces payload cells to master
BY VARIABLE NAME, so a payload cell at a (year, unit) master never had — the
legacy `poblacion` 1869/1885 department maps, preserved forever by
regenerate_ui_data.py Step B's additive merge — passed every gate while being
irreproducible from the download and misattributed to sources that cannot
contain it.

This gate closes that class. For every payload cell whose variable is in the
published catalog (browse-visible manifest id, or a year-family member of
one), there must be a curated-CSV row at the same (variable, level, year,
unit) whose value is numerically identical. Reconstructed indicators
(curation 15) are covered too once run_m028 materializes their rows into the
curated download; until then they can be allowlisted with --allow-reconstructed
so the scoreboard separates "known, being fixed" from "new regression".

Usage:
    python3 tools/g8_display_download.py                 # scoreboard, exit 0
    python3 tools/g8_display_download.py --enforce       # exit 1 on any failure
    python3 tools/g8_display_download.py --var poblacion # one variable, verbose
    python3 tools/g8_display_download.py --csv out.csv   # full divergence dump
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import unicodedata
from collections import defaultdict

TOOLS = os.path.dirname(os.path.abspath(__file__))
GP = os.path.dirname(TOOLS)

WINDOW = os.path.join(GP, "data/window_data.js")
CURATED = os.path.join(GP, "data/historical_atlas_of_chile_curated_v2.csv")
MANIFEST = os.path.join(GP, "data/variable_manifest.json")
GEO_INDEX = os.path.join(GP, "data/geography_index.json")
YEAR_FAMILIES = os.path.join(GP, "curation/year_family_groups.json")

BLOCK_LEVEL = {
    "department_data": "department", "province_data": "province",
    "commune_data": "commune", "port_data": "port", "city_data": "city",
}

# Curation-15 series derived at regeneration time. Kept in sync with
# published_set.RECONSTRUCTED_NO_MASTER_ROWS / v2_gates.G1_ALLOW.
RECONSTRUCTED = {
    "external_taxes_share_of_revenue", "direct_taxes_share_of_revenue",
    "indirect_taxes_share_of_revenue", "mining_taxes_share_of_revenue",
    "other_taxes_share_of_revenue", "population_census_count",
}


def _slug(s: str) -> str:
    s = unicodedata.normalize("NFD", str(s))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.lower().strip()
    # "Andes (Los)" -> "los andes" style inversion
    if s.endswith(")") and "(" in s:
        head, _, tail = s.partition("(")
        s = (tail.rstrip(")") + " " + head).strip()
    out = []
    for ch in s:
        out.append(ch if ch.isalnum() else "_")
    slug = "".join(out)
    while "__" in slug:
        slug = slug.replace("__", "_")
    return slug.strip("_")


def _year_int(y) -> int | None:
    try:
        return int(float(y))
    except (TypeError, ValueError):
        return None


def _num(v) -> float | None:
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return f


def collapsed_members() -> dict[str, dict[int, str]]:
    if not os.path.exists(YEAR_FAMILIES):
        return {}
    reg = json.load(open(YEAR_FAMILIES, encoding="utf-8"))
    out = {}
    for e in reg["stems"]:
        if e.get("collapsible"):
            out[e["stem"]] = {int(y): v for y, v in (e.get("year_to_member") or {}).items()}
    return out


def published_ids() -> set[str]:
    manifest = json.load(open(MANIFEST, encoding="utf-8"))
    hidden = {"retired", "alternate_variant", "alternate_currency", "hidden_below_gate"}
    return {e["id"] for e in manifest if e.get("presentation_status") not in hidden}


def register_sources() -> dict[str, set[str]]:
    """{published id: {master/alias variable ids whose curated rows may back
    its cells}} — the same registers published_set expands for the download:
    concept aliases plus curation/indicator_master_sources.json."""
    out: dict[str, set[str]] = {}
    ca_path = os.path.join(GP, "curation/concept_aliases.json")
    if os.path.exists(ca_path):
        for g in json.load(open(ca_path, encoding="utf-8")).get("groups", []):
            out.setdefault(g["canonical"], set()).update(g.get("aliases", []))
    ims_path = os.path.join(GP, "curation/indicator_master_sources.json")
    if os.path.exists(ims_path):
        for e in json.load(open(ims_path, encoding="utf-8")).get("entries", []):
            out.setdefault(e["indicator"], set()).update(e["master_variables"])
    return out


def level_projections() -> dict[tuple, set[tuple]]:
    """{(indicator, target_level): {(master_variable, source_level)}} from
    register entries that carry `source_level` (cross-level projection,
    2026-08-19 Task 2). Step B renders such an indicator's cells at the
    TARGET level from master rows stored at a DIFFERENT as-printed level
    (n_legislators: constituency rows render as pre-1891 department maps,
    districts = departments until 1891). The curated download ships the rows
    at their as-printed level, so the gate accepts a payload cell backed by
    an equal-value curated row at (master_variable, source_level, same year,
    same unit slug)."""
    out: dict[tuple, set[tuple]] = {}
    ims_path = os.path.join(GP, "curation/indicator_master_sources.json")
    if os.path.exists(ims_path):
        for e in json.load(open(ims_path, encoding="utf-8")).get("entries", []):
            sl = e.get("source_level")
            if sl:
                out.setdefault((e["indicator"], e["level"]), set()).update(
                    (mv, sl) for mv in e["master_variables"])
    return out


def load_payload() -> dict:
    src = open(WINDOW, encoding="utf-8").read()
    return json.loads(src[src.index("=") + 1:].strip().rstrip(";"))


def payload_cells(d: dict):
    """(variable, level, year:int, unit_key, value:float) for renderable cells."""
    for block, level in BLOCK_LEVEL.items():
        for year, units in (d.get(block) or {}).get("data", {}).items():
            yi = _year_int(year)
            if yi is None:
                continue
            for unit, cells in units.items():
                for var, val in cells.items():
                    f = _num(val)
                    if f is not None:
                        yield var, level, yi, str(unit).lower(), f
    for var, body in (d.get("national_timeseries") or {}).items():
        for y, v in zip(body.get("years", []), body.get("values", [])):
            yi, f = _year_int(y), _num(v)
            if yi is not None and f is not None:
                yield var, "national", yi, "chile", f


def curated_index():
    """{(variable, level, year) -> {unit_key -> [values]}} with every unit alias
    keyed: dcode/pcode, int-normalized ccode, and slugs of geographic_unit and
    display_name. Duplicate as-printed rows are legitimate in master, so every
    value is kept and G8 accepts a match on ANY of them."""
    idx: dict[tuple, dict[str, list]] = defaultdict(dict)
    with open(CURATED, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            yi = _year_int(r["year"])
            val = _num(r["value"])
            if yi is None or val is None:
                continue
            lvl = r["geographic_level"]
            aliases = set()
            if lvl == "department" and r["dcode"]:
                aliases.add(r["dcode"].strip().lower())
            if lvl == "province" and r["pcode"]:
                aliases.add(r["pcode"].strip().lower())
            if lvl == "commune" and r["ccode"]:
                ci = _year_int(r["ccode"])  # "15101.0" -> 15101
                if ci is not None:
                    aliases.add(str(ci))
                    aliases.add(f"{ci:05d}")
            if lvl == "national":
                aliases.add("chile")
            for name in (r["geographic_unit"], r.get("display_name", "")):
                if name:
                    aliases.add(_slug(name))
            key = (r["variable"], lvl, yi)
            for a in aliases:
                idx[key].setdefault(a, []).append(val)
    return idx


def geo_alias_map():
    """payload unit key -> extra alias slugs, from the geography index."""
    if not os.path.exists(GEO_INDEX):
        return {}
    gi = json.load(open(GEO_INDEX, encoding="utf-8"))
    out = defaultdict(set)
    for e in gi:
        code = str(e.get("code", "")).lower()
        if code:
            out[code].add(_slug(e.get("name", "")))
    return out


def run(enforce: bool, only_var: str | None, dump_csv: str | None,
        allow_reconstructed: bool) -> int:
    pub = published_ids()
    members = collapsed_members()
    member_of = {m: stem for stem, ys in members.items() for m in ys.values()}
    sources = register_sources()
    projections = level_projections()
    payload = load_payload()
    idx = curated_index()
    aliases = geo_alias_map()

    def eq(a: float, b: float) -> bool:
        if a == b:
            return True
        scale = max(abs(a), abs(b), 1.0)
        return abs(a - b) <= 1e-9 * scale

    missing = defaultdict(int)     # (var, level) -> cells with no curated row
    mismatch = defaultdict(int)    # (var, level) -> value disagrees
    matched = defaultdict(int)
    examples: dict[tuple, tuple] = {}
    rows_out = []

    for var, lvl, yi, unit, val in payload_cells(payload):
        stem = member_of.get(var, var)
        if stem not in pub and var not in pub:
            continue  # retired / hidden ids in the payload never render
        if only_var and stem != only_var and var != only_var:
            continue
        if allow_reconstructed and stem in RECONSTRUCTED:
            continue
        # curated rows live under the year-stamped master id when collapsed,
        # under a concept-alias id, or under a translated master id from the
        # indicator_master_sources register
        cand_vars = {var, stem} | sources.get(stem, set())
        m = members.get(stem)
        if m and yi in m:
            cand_vars.add(m[yi])
        unit_keys = {unit, _slug(unit)} | aliases.get(unit, set()) | aliases.get(_slug(unit), set())
        found: list = []
        for cv in cand_vars:
            units = idx.get((cv, lvl, yi))
            if not units:
                continue
            for uk in unit_keys:
                found.extend(units.get(uk, []))
        # Cross-level projections: the backing curated row lives at the
        # register entry's source_level under the master variable's own id.
        for mv, sl in (projections.get((stem, lvl), set())
                       | projections.get((var, lvl), set())):
            units = idx.get((mv, sl, yi))
            if not units:
                continue
            for uk in unit_keys:
                found.extend(units.get(uk, []))
        key = (stem, lvl)
        if not found:
            missing[key] += 1
            examples.setdefault(key, (yi, unit, val, "missing"))
            rows_out.append((stem, var, lvl, yi, unit, val, "", "missing"))
        elif not any(eq(f, val) for f in found):
            mismatch[key] += 1
            examples.setdefault(key, (yi, unit, val, f"curated={found[0]}"))
            rows_out.append((stem, var, lvl, yi, unit, val, found[0], "mismatch"))
        else:
            matched[key] += 1

    n_miss = sum(missing.values())
    n_mm = sum(mismatch.values())
    n_ok = sum(matched.values())
    bad = sorted(set(missing) | set(mismatch),
                 key=lambda k: -(missing.get(k, 0) + mismatch.get(k, 0)))

    print("G8 DISPLAY=DOWNLOAD — payload cells vs curated CSV")
    print(f"  matched    {n_ok:,}")
    print(f"  missing    {n_miss:,} cells across {len(missing)} variable/level pairs")
    print(f"  mismatch   {n_mm:,} cells across {len(mismatch)} variable/level pairs")
    if allow_reconstructed:
        print("  (curation-15 reconstructed indicators excluded by --allow-reconstructed)")
    if bad:
        print(f"\n  worst offenders ({min(len(bad), 40)} of {len(bad)}):")
        for key in bad[:40]:
            var, lvl = key
            yi, unit, val, why = examples[key]
            print(f"    {var:<44} {lvl:<11} miss={missing.get(key, 0):<6,} "
                  f"mm={mismatch.get(key, 0):<5,} e.g. {yi} {unit}={val} ({why})")

    if dump_csv:
        with open(dump_csv, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["published_id", "payload_variable", "level", "year",
                        "unit_key", "payload_value", "curated_value", "kind"])
            w.writerows(rows_out)
        print(f"\n  full divergence dump: {dump_csv} ({len(rows_out):,} rows)")

    fail = bool(missing or mismatch)
    print(f"\n  G8 {'FAIL' if fail else 'PASS'}")
    return 1 if (fail and enforce) else 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--enforce", action="store_true")
    ap.add_argument("--var", default=None)
    ap.add_argument("--csv", default=None)
    ap.add_argument("--allow-reconstructed", action="store_true",
                    help="exclude curation-15 derived indicators from the test")
    a = ap.parse_args()
    sys.exit(run(a.enforce, a.var, a.csv, a.allow_reconstructed))


if __name__ == "__main__":
    main()
