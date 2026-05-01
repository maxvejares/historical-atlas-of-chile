# Chile Data Atlas — Platform README

A research platform for two centuries of Chilean economic, political, and social history. Built by Maximiliano Véjares (Net Zero Industrial Policy Lab, Johns Hopkins University). Historical administrative borders sourced from *La Política en el Espacio*.

## Run locally

```bash
cd gis_platform && python3 -m http.server 8766
# open http://localhost:8766/
```

## Architecture

- `index.html` — slim shell, loads ES modules and the inline data block.
- `data/window_data.js` — extracted from the canonical inline `window._data` block; contains `department_data`, `province_data`, `national_timeseries`. Snake-case keys throughout. National series carry `display_label` for human-readable text.
- `data/variable_manifest.json` — the per-variable manifest. Source of truth for what the UI renders.
- `data/dataset_stats.json` — aggregate stats used in the hero / topic strip.
- `data/events.json` — events for the annotations rail.
- `data/*.geojson` — historical administrative geometries (1865 through 1924).
- `js/` — UI modules (header, hero, topic_grid, control_strip, year_slider, chart, map_view, citation, footer, app).
- `css/tokens.css` + `css/app.css` — design tokens + component styles.
- `scripts/` — data and platform build scripts (see below).

## Topic governance rule

Topics live in `TOPIC_CATEGORIES`, declared in two places:
- `scripts/build_variable_manifest.py` (Python build pipeline)
- `scripts/lint_manifest.py` (validator)

The closed list is:

```
economy, demography, politics, agriculture, mining,
labor, education, infrastructure, fiscal, trade
```

**Adding a new topic requires three things, in one PR:**
1. Edit the constant in both files above.
2. Add at least three variables tagged with the new topic. Topics with fewer than three variables fail the linter (warning).
3. Include a rationale comment next to the constant explaining why the existing topics are insufficient.

The linter rejects any variable whose `topic_category` is not in the closed list.

## Coverage tiers

Every variable carries a `published` field computed by the build pipeline from the variable's coverage at its declared scale:

| Tier        | Rule                                                  | UI behavior |
|-------------|-------------------------------------------------------|-------------|
| `complete`  | ≥90% coverage in the declared `valid_years` range     | Rendered normally. No badge. |
| `partial`   | 50–90% coverage                                       | Rendered with broken line segments across gap years. Badge: `PARTIAL`. |
| `sparse`    | <50% coverage but ≥3 observations                     | Rendered as dots only, regardless of cadence. Badge: `SPARSE`. |
| `false`     | <3 observations or fails the commit rule              | Hidden from UI. Direct URL access still works. |

Coverage definitions:
- **National series**: years populated / 186 (1810–1995 target window).
- **Department/province series**: observations / (panel size × number of valid_years).

The 80% panel-coverage commit rule from `CLAUDE.md` continues to apply: a department variable that exists in <80% of its panel years for any year does not enter the master `chile_master_data.csv`. Tiering is downstream of that gate.

## Citation

Every chart and map view exposes a "Cite this view" button generating APA or Chicago citations. Citations center the **original source** (Chilean Census, Anuario Estadístico, Memoria, Sinopsis, Díaz/Lüders/Wagner, or compiled). The platform's compiler credit is separate and below.

Citations never include CSV filenames or build artifact paths. Stable URLs encode the full view state (`scale`, `variable`, `year`, `pc`) so a citation paste always lands on the same view.

## Build pipeline

```bash
# 1. Extract canonical data from the legacy inline block (if regenerating)
python3 scripts/extract_window_data.py

# 2. Inject any new staged batches into window_data.js
python3 scripts/inject_all_staged_into_platform.py

# 3. Normalize national series to snake_case ids with display_label
python3 scripts/normalize_window_data_ids.py

# 4. Build the variable manifest
python3 scripts/build_variable_manifest.py

# 5. Lint the manifest (run on pre-commit + CI)
python3 scripts/lint_manifest.py --strict
```

The lint step writes `extraction_output/manifest_audit_<date>.md` with tier transitions, hidden variables, and topic-coverage warnings.

## Map projection notes

The choropleth uses CartoDB Positron (CSS-tinted to the warm-paper palette) with year-appropriate boundaries from `gis_platform/data/{departments,provinces}_<year>.geojson`. The map snaps to the nearest available geometry year and surfaces a small "Showing YYYY boundaries (closest available)" notice when slider year and geometry year diverge.

The map's `MAINLAND_BOUNDS` are tightened to mainland Chile + 50 km coastal margin. Magallanes, Tacna, Tarapacá, and Antofagasta render but the default viewport prioritizes the 52-panel core.

## Style

Design tokens live in `css/tokens.css`. Editorial light mode only — no dark mode this pass. Source Serif 4 for display, Inter for UI, JetBrains Mono for numerics. Oxblood (#7A1E2B) for accents and the choropleth ramp; warm paper (#FAFAF7) for the ground.

## License

Data: CC-BY-4.0 (with required attribution to original sources per the citation generator). Code: MIT.
