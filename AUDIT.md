# Platform Audit — La Política en el Espacio

Date: 2026-04-30
Stack: Leaflet 1.9.4 + Observable Plot 0.6 + d3 v7, single-page vanilla JS, inline window._data block in index.html.

This audit accompanies the editorial redesign. It catalogs presentation pathologies surfaced in user testing, locates the responsible code, and states the fix policy. Per the user's reframing, **magnitude oddities (coal, saltpeter, etc.) are presentation problems first**: log scale and axis fit handle them at render time. Data-layer unit corrections are deferred to a separate pass.

## P1. Coverage strings exceed 100% (e.g. "53 of 45 units")

**Symptom.** Map figure caption renders strings like "53 of 45 units (118%)" and "21 of 17 units (124%)" on certain (variable, year, scale) triples.

**Root cause.** `index.html:1182` computes coverage as `nums.length / currentGeoJSON.features.length`. `nums` is built from `Object.values(values)` where `values` is keyed on every dept/province present in the data for that year, including units excluded from the current geometry layer (Magallanes, Tacna, Tarapacá, Antofagasta — territories outside the 52-panel; sub-departments like quinchao, tomé, vichuquén that the panel aggregates upward; provinces that existed in 1895 but were re-drawn for the 1920 layer). When the data table has more units than the geometry, the numerator legitimately exceeds the denominator.

**Fix.** Coverage should count **geometry features that successfully matched a data value**, not the size of the data dictionary. The corrected calculation is the intersection of `geoNames` and `dataKeys` (both already computed at index.html:1147-1158 for warning logs but not used in the caption).

```javascript
// after the loop that builds geoNames / unmatchedGeo:
const matched = currentGeoJSON.features.filter(f => {
    const nk = normalizeKey(f.properties[nameField] || f.properties.name || '');
    const v = values[nk];
    return v !== undefined && v !== null && !Number.isNaN(v);
}).length;
// then:
updateMapFigureChrome(meta, varLabel, year, perCapita, currentGeoJSON.features.length, matched);
```

**Format.** "37 of 53 provinces · 70% coverage · 1865". Render as small-caps caption beneath the map, not as a Leaflet card.

**Out-of-geometry data.** Units present in data but absent from geometry are not lost — they remain in chile_master_data.csv. The platform simply does not render them. Console-log them under "Data keys with no geometry" (already done at index.html:1158) so the developer can audit alias gaps.

## P2. Coverage warning threshold is presentational only

`index.html:1178` adds a warning dot when pct < 60. After P1 the threshold itself is meaningful. Keep the dot; move the rule to the redesigned legend block (bottom-left typeset) rather than an inline span.

## P3. Single-year cross-sections rendered as time series

CLAUDE.md is explicit: "Single-year cross-sections (e.g., avaluo_1874, manorial, sna_estates, cr1865_*) MUST NOT be replayed across every census year as a fake panel — that produces misleading visualizations."

The current platform's choropleth slider implies that switching years for a single-year variable will return different data; in fact it returns the same value or no data. The variable manifest (`data/variable_manifest.json`) addresses this directly:
- `cadence: "irregular"` with `valid_years.length === 1` flags a true cross-section.
- The redesigned slider clamps to `valid_years` and renders a single tick at that year.
- The chart component does NOT draw a connecting line for irregular variables — dots only.

## P4. Magnitude oddities flagged for presentation, not data fix

Several national series carry values that exceed plausible historical magnitudes for Chile by 2-3 orders. These were originally framed as unit ingestion bugs; per the user's reframe, they are handled at render time:

| Variable | Range observed | Reference (rough) | Ratio | Proposed render |
|---|---|---|---|---|
| Coal production | 3.1M to 633M (peak 1990) | ~2M MT (peak ~1985) | ~316× | log scale (oom 2.31, below 3.0 threshold; force-flag in manifest) |
| Saltpeter production | 64K to 3.23B (peak 1929) | ~3M MT | ~1000× | log scale (oom 4.7, auto-triggers) |
| Wheat production | 1.5M to 18.7M | ~1.9M MT | ~10× | likely quintales métricos (0.1 MT); log scale not triggered (oom 1.09) — flag for unit pass |
| Real GDP | 103K to 25.9M | unitless index | n/a | linear (oom 2.4) |

The presentation fix: chart component reads `magnitude.hint` and `magnitude.orders_of_magnitude` from the manifest. When `hint === "log"`, render log y-axis; when `oom > 1.0` and the chart would otherwise compress to a corner, also surface a "log" toggle.

The data fix is deferred. Variables flagged here are noted in the manifest and surfaced in the chart's source caption ("series carries inconsistent units across publication periods; magnitudes shown as recorded"). A follow-up pass will reconcile against Mamalakis (1976) "The Growth and Structure of the Chilean Economy" reference tables.

## P5. Templating pathology — every variable rendered identically

The current chart renders annual GDP, census-year population, and a 13-year electoral panel using the same continuous-line treatment with the same fixed 1810-1995 x-domain and the same global y-axis. The redesigned chart component reads the manifest and adapts:

| Cadence | Domain | Mark | Connector |
|---|---|---|---|
| annual | min/max valid_years | line, 1.5px | continuous |
| census | min/max valid_years | dot 4px | thin step or straight segment |
| irregular | min/max valid_years | dot 4px | none |

Sparse window: when fewer than 8 observations are visible after clamping, the chart caption reads "n = K observations" and gaps are rendered as broken segments. No interpolation across gaps under any cadence.

Y-axis: `d3.extent` on the visible data window with 5% pad. Switch to log when `manifest.magnitude.hint === "log"`. Outlier trim is a user toggle, off by default.

X-axis: clamps to the variable's `year_range`, not 1810-1995. A variable that exists only 1907-1952 renders a chart spanning 1907-1952.

Title hierarchy: ONE serif title naming the variable, ONE caption naming units. Drop subtitles, drop redundant axis labels.

## P6. Annotation rail rule applies to every chart

The current platform paints dashed vertical event lines across the plot, which collide with the data line, span unrelated y-values, and overprint event labels at high event density. Replacement:

- Strip ABOVE the plot, height 32px, NOT overlapping the data area.
- Events are 6px filled dots on a thin baseline at their year on the chart's x-scale.
- Greedy collision avoidance: sort events by `priority` descending, place each label at its dot if room exists; if not, drop to a second row; if still not, hide and surface on hover.
- Color from category (war / political / economic / institutional), muted.
- Hover grows the dot and pins a card with name + 1-line description + year.
- Events live in `data/events.json`, schema `{year, name, short_description, category, priority}`.
- Rule: no event labels overprint, ever. Pruning by priority is the escape hatch.

## P7. Variable-unaware slider

`index.html:654` declares a `<input type="range" min="0" max="5">` slider keyed on a fixed array of census years. For the 70%+ of variables that are not on those census years, the slider snaps to a year the variable does not have, the map clears, and the user sees an empty canvas with no explanation.

Replacement: variable-aware slider per Part 2 / C1. Range = manifest.scales[scale].valid_years bounds; ticks = explicit notch per valid year; snapping. On variable change, snap to closest valid year to previous selection (not min). Cadence label rendered below the slider, e.g. "Census years, 1865-1992 · Chilean census + INE" or "Annual, 1810-1995 · Mamalakis 1976".

## P8. Disabled dropdown options without explanation

Several Demographics options render disabled (Urban Population, Rural Population, Urbanization Rate, Population density, Province area) with no caption. Replacement: per-option muted caption inline, e.g. "Urban Population — not available at province scale" with one-click "Switch to Department scale" affordance.

The manifest's `scale_availability` field powers this directly. When a user selects a variable not available at the current scale, the cross-scale cascade surfaces a notice and either keeps the variable (auto-switching scale) or picks the closest equivalent, with an inline notice ("Switched to Total Population — Province scale doesn't carry the extended panel").

## P9. Floating map title duplicates control strip header

`index.html:1164-1187` paints a "Public employees (province) / Provinces, 1865 — persons" card on top of the map. This duplicates the variable name already visible in the control strip and steals visual weight from the choropleth. Drop the floating card; the control strip is canonical.

## P10. Map bbox includes unrelated geography

Default Leaflet view fits the GeoJSON bbox, which includes Tierra del Fuego, the Falklands, and Argentine border zones. Tighten to mainland Chile + 50 km coastal margin. User can pan if they want broader view.

---

## Manifest contract

`gis_platform/data/variable_manifest.json` (140 entries) is the canonical metadata for every variable on the platform. It is generated by `scripts/build_variable_manifest.py` from the inline window._data block plus chile_master_data.csv (for source attribution). Regenerate after every data pipeline run.

```jsonc
{
  "id": "enfranchised",
  "label": "Enfranchised voters (calificados/inscriptos)",
  "category": "Electoral",
  "source_type": "mixed",
  "format_hint": "count",
  "scale_availability": {"national": false, "province": false, "department": true},
  "scales": {
    "department": {
      "cadence": "irregular",
      "valid_years": [1862, 1863, 1865, 1869, 1872, 1875, 1878, ...],
      "year_range": [1862, 1921],
      "n_observations": 1077,
      "magnitude": {"min": 1.0, "max": 60000.0, "median": 800.0,
                    "orders_of_magnitude": 4.78, "hint": "log"}
    }
  },
  "source_documents": ["Anuario Estadístico Tomo XXVI (1887-1888)", ...]
}
```

Every UI surface that needs to know "what years exist for this variable", "is this variable annual or census-only", "should this be log scale", or "is this variable available at province scale" reads the manifest. Hand-authoring is forbidden — regenerate.

## Dataset stats

`gis_platform/data/dataset_stats.json` powers the hero strip:

```json
{
  "n_years_covered": 186,
  "year_span": 186,
  "year_range": [1810, 1995],
  "n_census_years": 13,
  "n_categories": 17,
  "n_variables_total": 140,
  "n_variables_department": 17,
  "n_variables_province": 22,
  "n_variables_national": 103
}
```

Hero copy: "186 years · 13 census years · 22 provinces · 17 categories · 140 variables".
