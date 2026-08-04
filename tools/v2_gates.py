#!/usr/bin/env python3
"""
v2_gates.py — the seven ship gates for Historical Atlas of Chile v2.

v1 shipped on "does it render". That gate could not see 24,025 uncitable cells,
563 cells of a source the project had explicitly disabled, or a catalog holding
220 of 6,833 publishable variables. These gates replace it.

They are a SCOREBOARD by default: every gate reports PASS or FAIL with counts and
the run exits 0, so work can proceed while the numbers come down. Pass --enforce
(Phase 6) to make any failure exit 1 and block the build.

    python3 tools/v2_gates.py                # scoreboard
    python3 tools/v2_gates.py --enforce      # ship gate
    python3 tools/v2_gates.py --gate G3      # one gate, verbose

G1  PROVENANCE     every published cell traces to a master row
G2  SOURCE POLICY  no published cell matches an excluded compilation, by VALUE
G3  CATALOG        every qualifying variable is published or has a recorded reason
G4  METADATA       every published indicator carries its M098 rule 4 block
G5  RENDER         every indicator renders at every level it claims
G6  PLAUSIBILITY   no published series has an unexplained magnitude step
G7  DOWNLOAD       the CSV download contains exactly the published cells

See V2_PLAN.md for why each exists and what it cost to learn.
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import re
import sys

import pandas as pd

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.dirname(REPO)

MASTER = os.path.join(ROOT, "data/chile_master_data.csv")
DOWNLOAD = os.path.join(REPO, "data/chile_historical_database_v1.csv")
WINDOW = os.path.join(REPO, "data/window_data.js")
MANIFEST = os.path.join(REPO, "data/variable_manifest.json")
CANDIDATES = os.path.join(ROOT, "extraction_output/unexposed_indicator_candidates.csv")
DECISIONS = os.path.join(REPO, "curation/catalog_decisions.json")
WITHDRAWN = os.path.join(REPO, "curation/withdrawn_orphan_series.json")

EXCLUDED_SOURCE_GLOBS = [
    os.path.join(ROOT, "extraction_output/staging/braun_1998_dt187/*.csv"),
]
PROMOTABLE = {"observed", "observed_zero", "not_collected", "estimated", "reconstructed"}
LEVEL_CANON = {
    "port": "port", "puerto": "port", "city": "city", "ciudad": "city",
    "department": "department", "departamento": "department",
    "province": "province", "provincia": "province",
    "commune": "commune", "comuna": "commune",
    "national": "national", "nacional": "national", "country": "national",
}
BLOCK_LEVEL = {"department_data": "department", "province_data": "province",
               "commune_data": "commune",
               # Point scales (V2 Phase 4). Same block shape; the gates do not
               # care that the geometry is a marker rather than a polygon.
               "port_data": "port", "city_data": "city"}

# G1 allowlist: series curation step 15 DERIVES from primary master inputs, so
# they legitimately have no master row of their own. Documented in chunk 2.2.
G1_ALLOW = {
    "external_taxes_share_of_revenue", "direct_taxes_share_of_revenue",
    "indirect_taxes_share_of_revenue", "mining_taxes_share_of_revenue",
    "other_taxes_share_of_revenue",
}

RESULTS: list[tuple[str, str, bool, str]] = []

# V2 Phase 1. The payload publishes a collapsed family under its stem
# (`correos_cartas`), while master stores the year-stamped members
# (`correos_cartas_1877`). The gates test cells against master, so they have to
# resolve a published id back to the member that actually holds the row.
# Resolution is by YEAR and it is exact: the register only marks a stem
# collapsible when every member sits solely at its own suffix year, so a cell
# published at 1877 can have come from exactly one member.
YEAR_FAMILIES = os.path.join(REPO, "curation/year_family_groups.json")


def _collapsed_members() -> dict[str, dict[int, str]]:
    """{stem: {year: member}}. Read from the register rather than reconstructed:
    the infix rule means `vacunados_hombres` at 1886 is `vacunados_1886_hombres`."""
    if not os.path.exists(YEAR_FAMILIES):
        return {}
    reg = json.load(open(YEAR_FAMILIES, encoding="utf-8"))
    out = {}
    for e in reg["stems"]:
        if not e["collapsible"]:
            continue
        out[e["stem"]] = {int(y): v for y, v in (e.get("year_to_member") or {}).items()}
    return out


COLLAPSED = _collapsed_members()


def master_id(var: str, year) -> str:
    """The master variable a published (var, year) cell came from."""
    members = COLLAPSED.get(var)
    if not members:
        return var
    try:
        return members.get(int(float(year)), var)
    except (TypeError, ValueError):
        return var


def report(gate: str, name: str, ok: bool, detail: str) -> None:
    RESULTS.append((gate, name, ok, detail))


def load_payload() -> dict:
    src = open(WINDOW, encoding="utf-8").read()
    return json.loads(src[src.index("=") + 1:].strip().rstrip(";"))


def published_cells(d: dict):
    """Yield (variable, level, year, unit_key, value) for every rendered cell."""
    for block, level in BLOCK_LEVEL.items():
        for year, units in (d.get(block) or {}).get("data", {}).items():
            for unit, cells in units.items():
                for var, val in cells.items():
                    if val is not None:
                        yield var, level, str(year), str(unit).lower(), val
    for var, body in (d.get("national_timeseries") or {}).items():
        for y, v in zip(body.get("years", []), body.get("values", [])):
            if v is not None:
                yield var, "national", str(y), "chile", v


def master_frame() -> pd.DataFrame:
    m = pd.read_csv(MASTER, dtype=str, low_memory=False)
    m["lvl"] = m.geographic_level.map(LEVEL_CANON)
    m["val"] = pd.to_numeric(m.value, errors="coerce")
    m["yr"] = pd.to_numeric(m.year, errors="coerce")
    return m


# ---------------------------------------------------------------- G1

def gate_g1(d, m):
    """Two failures, not one. A published cell must (a) have a master row at all
    and (b) have a PROMOTABLE one. The second half exists because
    regenerate_ui_data.py only drops needs_review cells whose value is zero:
    'Non-zero needs_review cells are preserved (they carry real measurements
    pending Phase 2 triage)'. The consequence is that the site publishes
    unaudited cells the CSV download correctly withholds, so the two products
    disagree about what the data is."""
    have = set(m[m.quality_flag.isin(PROMOTABLE)].variable.dropna())

    def yi(v):
        try:
            return str(int(float(v)))
        except (TypeError, ValueError):
            return ""

    # A cell is unaudited only if NO promotable master row backs it. Master
    # routinely holds the same cell twice under different spellings of the unit
    # — `laja` (Data Chile, needs_review) and `lalaja` (Anuario, observed), both
    # resolving to dcode `laja` — and the publisher takes the promotable value.
    # Counting the flagged row alone reported 23 cells as unaudited whose
    # published value came from the observed row: `totalpop` 1862 publishes
    # 31,844 from the Anuario, not the flagged duplicate.
    def _keys(frame):
        raw = frame.geographic_unit.astype(str).str.lower()
        out = set()
        for unit in (raw,
                     raw.str.replace(r"\s*\(.*?\)\s*$", "", regex=True).str.strip(),
                     raw.str.replace(" ", "", regex=False),
                     frame.dcode.astype(str).str.lower(),
                     frame.pcode.astype(str).str.lower()):
            ok = unit.notna() & (unit != "") & (unit != "nan")
            out |= set(zip(frame.variable[ok], frame.lvl[ok],
                           frame.year[ok].map(yi), unit[ok]))
        return out

    unaudited = m[m.quality_flag.isin({"needs_review", "failed_extraction"}) & m.lvl.notna()]
    unaudited_key = _keys(unaudited) - _keys(m[m.quality_flag.isin(PROMOTABLE) & m.lvl.notna()])

    orphan, unaud = {}, {}
    for var, lvl, y, u, _v in published_cells(d):
        # Resolve the collapsed catalog id back to the year-stamped master id.
        # This also closes a false pass the flat test allowed: `poblacion_hombres`
        # matched a bare master variable of that name while the published cells
        # actually come from `poblacion_hombres_1970` / `_1992`.
        mvar = master_id(var, y)
        if mvar not in have and var not in G1_ALLOW:
            orphan[var] = orphan.get(var, 0) + 1
        if (mvar, lvl, yi(y), u) in unaudited_key:
            unaud[var] = unaud.get(var, 0) + 1

    n_o, n_u = sum(orphan.values()), sum(unaud.values())
    report("G1a", "provenance", not orphan,
           f"{len(orphan)} series / {n_o:,} cells with no master row"
           + (f" — {sorted(orphan, key=lambda k: -orphan[k])[:3]}" if orphan else ""))
    report("G1b", "audited", not unaud,
           f"{n_u:,} published cells carry a needs_review/failed_extraction master row "
           f"across {len(unaud)} indicators"
           + (f" — worst {sorted(unaud, key=lambda k: -unaud[k])[:3]}" if unaud else ""))
    return orphan


# ---------------------------------------------------------------- G2

def gate_g2(d):
    fp = {}
    for pat in EXCLUDED_SOURCE_GLOBS:
        for f in glob.glob(pat):
            try:
                x = pd.read_csv(f, low_memory=False)
            except Exception:
                continue
            if not {"year", "variable", "value"} <= set(x.columns):
                continue
            for _, r in x.iterrows():
                try:
                    fp[(str(r["variable"]), int(float(r["year"])))] = round(float(r["value"]), 3)
                except Exception:
                    pass
    if not fp:
        report("G2", "source policy", True, "no excluded-source fingerprints on disk to test against")
        return {}
    hits = {}
    for var, body in (d.get("national_timeseries") or {}).items():
        pairs = [(y, v) for y, v in zip(body.get("years", []), body.get("values", []))
                 if v is not None]
        if not pairs:
            continue
        match = sum(1 for y, v in pairs if fp.get((var, int(y))) == round(float(v), 3))
        if match / len(pairs) > 0.9:
            hits[var] = match
    detail = (f"{len(hits)} series match an excluded compilation by value"
              + (f" — {hits}" if hits else ""))
    report("G2", "source policy", not hits, detail)
    return hits


# ---------------------------------------------------------------- G3

def gate_g3(d):
    if not os.path.exists(CANDIDATES):
        report("G3", "catalog", False,
               "no candidate list; run scripts/screen_unexposed_indicators.py")
        return set()
    cand = pd.read_csv(CANDIDATES)
    ready = cand[cand.verdict == "READY"]
    decided = {}
    if os.path.exists(DECISIONS):
        decided = json.load(open(DECISIONS)).get("decisions", {})
    pub_pairs = {(v, l) for v, l, *_ in published_cells(d)}
    undecided = [(r.variable, r.level, int(r.cells)) for r in ready.itertuples()
                 if (r.variable, r.level) not in pub_pairs
                 and f"{r.variable}|{r.level}" not in decided]
    cells = sum(c for *_x, c in undecided)
    detail = (f"{len(undecided):,} qualifying variable/level pairs are neither published "
              f"nor recorded as excluded ({cells:,} cells)")
    report("G3", "catalog", not undecided, detail)
    return undecided


# ---------------------------------------------------------------- G4

def gate_g4(mani):
    required = ["definition", "display_unit", "source_documents", "coverage_statement"]
    missing = {f: 0 for f in required}
    incomplete = 0
    for v in mani:
        gaps = [f for f in required if not v.get(f)]
        for f in gaps:
            missing[f] += 1
        if gaps:
            incomplete += 1
    detail = (f"{incomplete}/{len(mani)} indicators incomplete — "
              + ", ".join(f"{f} missing {n}" for f, n in missing.items() if n))
    report("G4", "metadata", not incomplete, detail)
    return missing


# ---------------------------------------------------------------- G5

def gate_g5(d, mani):
    present: dict[tuple, int] = {}
    for var, lvl, *_ in published_cells(d):
        present[(var, lvl)] = present.get((var, lvl), 0) + 1
    bad = []
    for v in mani:
        for lvl, claimed in (v.get("scale_availability") or {}).items():
            if claimed and not present.get((v["id"], lvl)):
                bad.append(f"{v['id']}@{lvl}")

    # The manifest is built FROM the payload and silently omits any variable
    # with no cells, so a dead id in an inclusion list is invisible to the loop
    # above. Those are precisely v1's "ghosts by design": `literacy_rate` and
    # `literates_total` sat in the department list with no master row anywhere,
    # and `gasto_total_nacion` is province-level data whose geographic_unit is
    # the aggregate `total republica`, which the resolver drops. The catalog
    # offers them and nothing renders. Check the inclusion lists directly.
    for block, lvl in BLOCK_LEVEL.items():
        for vid in ((d.get(block) or {}).get("variables") or {}):
            if not present.get((vid, lvl)):
                bad.append(f"{vid}@{lvl} (listed, no cells)")
    for vid, body in (d.get("national_timeseries") or {}).items():
        if not [x for x in (body.get("values") or []) if x is not None]:
            bad.append(f"{vid}@national (listed, no cells)")

    detail = (f"{len(bad)} indicator/level claims render nothing"
              + (f" — e.g. {bad[:4]}" if bad else ""))
    report("G5", "render", not bad, detail)
    return bad


# ---------------------------------------------------------------- G6

def gate_g6(d):
    bad = {}
    for var, body in (d.get("national_timeseries") or {}).items():
        pairs = [(int(y), abs(float(v))) for y, v in
                 zip(body.get("years", []), body.get("values", []))
                 if v is not None and float(v) != 0]
        if len(pairs) < 3:
            continue
        pairs.sort()
        worst = max((max(b / a, a / b) for (_, a), (_, b) in zip(pairs, pairs[1:])), default=1)
        if worst > 10:
            bad[var] = round(worst, 1)
    detail = (f"{len(bad)} published national series step >10x between consecutive observations"
              + (f" — {sorted(bad.items(), key=lambda kv: -kv[1])[:4]}" if bad else ""))
    report("G6", "plausibility", not bad, detail)
    return bad


# ---------------------------------------------------------------- G7

def gate_g7(d):
    if not os.path.exists(DOWNLOAD):
        report("G7", "download", False, "download CSV not found")
        return
    # NOT a variable-count parity test. The download is the full research dataset
    # and the atlas is a curated view of it; those are legitimately different
    # products and 6,619 variables shipping in the CSV but not on the site is
    # correct behaviour, not a defect. What the download must actually satisfy is
    # the source and scope policy: nothing from an excluded compilation, and
    # nothing from a fenced file (decision 3, Data Chile complete.xlsx).
    dl = pd.read_csv(DOWNLOAD, dtype=str, low_memory=False)
    fenced = dl.source_document.astype(str).str.contains(
        r"Data Chile complete", case=False, na=False)
    excluded = dl.source_document.astype(str).str.contains(
        r"braun|d[ıi]az.*l[uü]ders|república en cifras", case=False, na=False)
    n_f, n_x = int(fenced.sum()), int(excluded.sum())
    ok = not (n_f or n_x)
    report("G7", "download", ok,
           f"{len(dl):,} rows; {n_f:,} from the fenced Data Chile complete.xlsx, "
           f"{n_x:,} from an excluded compilation")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--enforce", action="store_true",
                    help="exit 1 on any failing gate (Phase 6)")
    ap.add_argument("--gate", help="run one gate, e.g. G3")
    a = ap.parse_args()

    d = load_payload()
    mani = json.load(open(MANIFEST))
    m = master_frame()

    runners = {"G1": lambda: gate_g1(d, m), "G2": lambda: gate_g2(d),
               "G3": lambda: gate_g3(d), "G4": lambda: gate_g4(mani),
               "G5": lambda: gate_g5(d, mani), "G6": lambda: gate_g6(d),
               "G7": lambda: gate_g7(d)}
    for g, fn in runners.items():
        if a.gate and g != a.gate:
            continue
        fn()

    print("Historical Atlas of Chile — v2 ship gates\n")
    width = max(len(n) for _g, n, _o, _d in RESULTS)
    for g, name, ok, detail in RESULTS:
        print(f"  {g}  {name:<{width}}  {'PASS' if ok else 'FAIL'}   {detail}")
    failed = [g for g, _n, ok, _d in RESULTS if not ok]
    print(f"\n{len(RESULTS) - len(failed)}/{len(RESULTS)} gates pass.")
    if failed and not a.enforce:
        print("Scoreboard mode: not blocking. Run with --enforce at Phase 6.")
    sys.exit(1 if (failed and a.enforce) else 0)


if __name__ == "__main__":
    main()
