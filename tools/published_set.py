"""Shared definition of "the published catalog" for pipeline and gates.

2026-08-18 second-audit fix (decision 1 / Phase 3). The curated public
download and gate G7/S3 must agree on exactly which master rows belong to the
published catalog, so both import THIS module instead of re-deriving the set.

A master row belongs to the curated download when its `variable`:
  - is a browse-visible manifest id (published, not retired / alternate /
    below-gate); or
  - is a year-stamped member of a collapsible year-family whose published stem
    is browse-visible (the payload publishes `correos_cartas`, master stores
    `correos_cartas_1877`).

Reconstructed indicators (curation 15) are published with NO master rows of
their own; they are derived at regeneration time from primary inputs. They
appear in `RECONSTRUCTED_NO_MASTER_ROWS` so completeness checks can assert
that the curated download covers every published indicator EXCEPT these.
"""
from __future__ import annotations

import json
from pathlib import Path

GP = Path(__file__).resolve().parents[1]          # gis_platform/
MANIFEST = GP / "data" / "variable_manifest.json"
YEAR_FAMILIES = GP / "curation" / "year_family_groups.json"

HIDDEN_STATUSES = {"retired", "alternate_variant", "alternate_currency",
                   "hidden_below_gate"}

# Kept in sync with v2_gates.G1_ALLOW (chunk 2.2): curation-15 series derived
# from primary master inputs, legitimately absent from master.
RECONSTRUCTED_NO_MASTER_ROWS = {
    "external_taxes_share_of_revenue", "direct_taxes_share_of_revenue",
    "indirect_taxes_share_of_revenue", "mining_taxes_share_of_revenue",
    "other_taxes_share_of_revenue",
    # Master projection of total_population national rows under its own id;
    # the curated download has no rows under this name by design.
    "population_census_count",
}

# The geographic levels the published catalog carries. Master artifact levels
# (establishment, territory, macro_region, region, province_or_dept) never
# reach the curated download. `constituency` IS carried: n_legislators is a
# published indicator whose master rows are stored at their as-printed
# constituency level (electoral districts coincide with departments before
# 1891), and the fidelity doctrine ships the level as transcribed.
CURATED_LEVELS = {"national", "department", "province", "commune", "port",
                  "city", "constituency"}


def visible_manifest_ids() -> set[str]:
    manifest = json.loads(MANIFEST.read_text())
    return {e["id"] for e in manifest
            if e.get("published") is not False
            and e.get("presentation_status") not in HIDDEN_STATUSES}


def collapsed_members() -> dict[str, dict[int, str]]:
    """{stem: {year: member}} from the year-family register."""
    if not YEAR_FAMILIES.exists():
        return {}
    reg = json.loads(YEAR_FAMILIES.read_text())
    out: dict[str, dict[int, str]] = {}
    for e in reg["stems"]:
        if not e["collapsible"]:
            continue
        out[e["stem"]] = {int(y): v for y, v in (e.get("year_to_member") or {}).items()}
    return out


def published_master_variables() -> set[str]:
    """Every master `variable` name that belongs to the published catalog."""
    ids = visible_manifest_ids()
    out = set(ids)
    for stem, members in collapsed_members().items():
        if stem in ids:
            out.update(members.values())
    return out
