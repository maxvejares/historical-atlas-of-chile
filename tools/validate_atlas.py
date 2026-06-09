#!/usr/bin/env python3
"""
validate_atlas.py — deterministic invariant checker for the Historical Atlas of Chile.

Runs a battery of assertions over data/variable_manifest.json, data/national_aggregates.json,
and the inlined copies in historical_atlas_of_chile.html. Each failure is a real, shippable
defect that no longer needs a human or an LLM to catch.

Usage:  python3 tools/validate_atlas.py [--repo PATH]
Exit 0 = clean, 1 = one or more ERRORs. WARNs do not fail the build.
"""
import json, re, sys, os, argparse

ERRORS, WARNS = [], []
def err(code, msg): ERRORS.append((code, msg))
def warn(code, msg): WARNS.append((code, msg))

def load(repo):
    mani = json.load(open(os.path.join(repo, 'data/variable_manifest.json')))
    nagg = json.load(open(os.path.join(repo, 'data/national_aggregates.json')))
    html = open(os.path.join(repo, 'historical_atlas_of_chile.html'), encoding='utf-8').read()
    return mani, nagg, html

def extract_inline(html, varname):
    """Pull a JSON literal assigned to `*.__INLINE_<varname> = <json>;` by bracket-balancing."""
    m = re.search(r'__INLINE_' + re.escape(varname) + r'\s*=\s*', html)
    if not m: return None
    i = m.end()
    while i < len(html) and html[i] not in '[{': i += 1
    if i >= len(html): return None
    open_c = html[i]; close_c = ']' if open_c == '[' else '}'
    depth, j, instr, esc = 0, i, False, False
    while j < len(html):
        c = html[j]
        if instr:
            if esc: esc = False
            elif c == '\\': esc = True
            elif c == '"': instr = False
        else:
            if c == '"': instr = True
            elif c == open_c: depth += 1
            elif c == close_c:
                depth -= 1
                if depth == 0:
                    return json.loads(html[i:j+1])
        j += 1
    return None

def topic_landings(html):
    return re.findall(r'id:\s*"([a-z_]+)",\s*label:\s*"[^"]+",\s*landing:\s*"([a-z_0-9]+)"', html)

# ----- checks -------------------------------------------------------------
SHARE_MAX = 1000.0          # generous ceiling for any % / share series at any scale
# Raw, un-anglicized field names that should never reach a user-facing label.
RAW_LABEL = re.compile(r'(Poblacion|Viviendas?|\bhogares\b|_\d{4}\b|cabezas|superficie|'
                       r'\btenencia\b|\bhombres\b|\bmujeres\b)', re.I)
ALT_PRES = {'retired', 'alternate_variant', 'alternate_currency'}
# Flags that make a series unfit to be a topic landing (withheld / unit-broken).
# A methodological break is an honest, annotated discontinuity and is fine as a landing.
def disqualifying_flag(flag):
    if not flag: return None
    f = str(flag).lower()
    return flag if ('splice' in f or 'corrupt' in f or 'withh' in f or 'invalid' in f) else None

def run(mani, nagg, html):
    by_id = {e['id']: e for e in mani}
    # 1. topic landings: exist, live canonical, no quality flag
    seen_landing = set()
    for tid, lid in topic_landings(html):
        if lid in seen_landing: continue
        seen_landing.add(lid)
        e = by_id.get(lid)
        if not e: err('LANDING_MISSING', f'topic "{tid}" lands on "{lid}" which is absent from the manifest'); continue
        if disqualifying_flag(e.get('data_quality_flag')):
            err('LANDING_CORRUPT', f'topic "{tid}" lands on "{lid}" which carries data_quality_flag={e["data_quality_flag"]}')
        if e.get('presentation_status') in ALT_PRES:
            err('LANDING_ALIAS', f'topic "{tid}" lands on "{lid}" (presentation_status={e["presentation_status"]}); point at the canonical')

    # 2. share / % series magnitude ceiling
    for e in mani:
        is_share = e.get('format_hint') == 'share' or (e.get('display_unit') or '').strip() in ('%', 'percent')
        if not is_share: continue
        for sc, info in e.get('scales', {}).items():
            mx = (info.get('magnitude') or {}).get('max')
            if mx is not None and mx > SHARE_MAX:
                flagged = e.get('data_quality_flag')
                (warn if flagged else err)('SHARE_MAGNITUDE',
                    f'{e["id"]} [{sc}] unit={e.get("display_unit")} max={mx:g} exceeds {SHARE_MAX:g}'
                    + (f' (flagged {flagged})' if flagged else ' and is NOT flagged'))

    # 3. quality-flagged series must not be a landing and should be fenced
    for e in mani:
        if disqualifying_flag(e.get('data_quality_flag')) and e['id'] in seen_landing:
            err('FLAGGED_LANDING', f'{e["id"]} is a topic landing yet carries data_quality_flag={e["data_quality_flag"]}')

    # 4. label hygiene
    seen_label = {}
    for e in mani:
        lab = e.get('display_label', '')
        if e.get('presentation_status') == 'retired': continue
        if RAW_LABEL.search(lab):
            warn('RAW_LABEL', f'{e["id"]} display_label looks like a raw field name: "{lab}"')
        key = lab.strip().lower()
        if key in seen_label:
            err('DUP_LABEL', f'duplicate display_label "{lab}": {seen_label[key]} and {e["id"]}')
        else:
            seen_label[key] = e['id']

    # 5. tier vs coverage: a one-year scale cannot be "complete"
    for e in mani:
        pbs = e.get('published_by_scale') or {}
        for sc, info in e.get('scales', {}).items():
            ny = len(info.get('valid_years') or [])
            tier = pbs.get(sc) or e.get('published')
            if ny <= 1 and tier == 'complete':
                err('TIER_MISLABEL', f'{e["id"]} [{sc}] has {ny} year(s) but is badged "complete"')

    # 6. national_aggregates cross-reference siblings must be guarded in JS
    cross = [k for k, v in nagg.items()
             if isinstance(v, dict) and v.get('verdict') == 'national_sibling'
             and v.get('sibling_id') and v.get('sibling_id') != k]
    if cross and 'nationalAggIsReal' not in html:
        err('SPARKLINE_GUARD', f'{len(cross)} cross-reference siblings exist but nationalAggIsReal guard is absent from HTML')

    # 7. served JSON == inlined HTML copy
    for name, served in [('variable_manifest', mani), ('national_aggregates', nagg)]:
        inline = extract_inline(html, name)
        if inline is None:
            warn('INLINE_MISSING', f'could not extract inline {name} from HTML')
        elif json.dumps(inline, sort_keys=True) != json.dumps(served, sort_keys=True):
            err('INLINE_DESYNC', f'data/{name}.json differs from the inlined copy in the HTML; rebuild the bundle')

    # 8. magnitude sanity: NaN / negative min where zero is semantic
    for e in mani:
        for sc, info in e.get('scales', {}).items():
            m = info.get('magnitude') or {}
            for k in ('min', 'max', 'median'):
                v = m.get(k)
                if v is not None and isinstance(v, float) and v != v:
                    err('NAN_MAGNITUDE', f'{e["id"]} [{sc}] {k} is NaN')
            if e.get('semantic_zero') and m.get('min') is not None and m['min'] < 0:
                warn('NEG_MIN', f'{e["id"]} [{sc}] min={m["min"]} but semantic_zero=true')

    # 9. published series should carry a source
    for e in mani:
        if e.get('published') in ('complete', 'partial') and not e.get('source_documents') and not e.get('source_document'):
            warn('NO_SOURCE', f'{e["id"]} is published ({e["published"]}) with no source_document(s)')

    # 10. no purged secondary compilation (Braun OR Díaz-Lüders-Wagner) may leak
    # into any user-visible or shipped field. Scans text fields, breaks, and the
    # source_type enum; catches both "braun" and the DLW lineage. (purged M150;
    # extended 2026-06-08 to DLW + breaks/units_note/source_type/rule_for_chart)
    SECONDARY = ('braun', 'lüders', 'luders', 'díaz, l', 'diaz, l',
                 'república en cifras', 'republica en cifras', 'diaz_luders_wagner')
    LEAK_FIELDS = ('definition', 'curated_subtitle', 'display_label', 'label',
                   'source_document', 'source_documents', 'units_note',
                   'coverage_statement', 'source_type', 'breaks', 'rule_for_chart')
    for e in mani:
        for field in LEAK_FIELDS:
            blob = json.dumps(e.get(field), ensure_ascii=False).lower() if e.get(field) is not None else ''
            hit = next((w for w in SECONDARY if w in blob), None)
            if hit:
                err('BRAUN_LEAK', f'{e["id"]} {field} mentions a purged secondary source ("{hit}")')

    # 11. scale_availability must agree with the presence of a scales block
    for e in mani:
        for sc, avail in (e.get('scale_availability') or {}).items():
            has = sc in (e.get('scales') or {})
            if avail and not has:
                err('SCALE_MISMATCH', f'{e["id"]} marks {sc} available but has no scales.{sc} block')
            if has and not avail:
                warn('SCALE_MISMATCH', f'{e["id"]} has a scales.{sc} block but scale_availability.{sc} is false')

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--repo', default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    a = ap.parse_args()
    mani, nagg, html = load(a.repo)
    print(f'Loaded {len(mani)} indicators, {len(nagg)} national aggregates, {len(html)} bytes HTML\n')
    run(mani, nagg, html)
    if ERRORS:
        print(f'ERRORS ({len(ERRORS)}):')
        for c, m in ERRORS: print(f'  [{c}] {m}')
    if WARNS:
        print(f'\nWARNINGS ({len(WARNS)}):')
        for c, m in WARNS: print(f'  [{c}] {m}')
    if not ERRORS and not WARNS:
        print('All invariants pass.')
    print(f'\n{len(ERRORS)} error(s), {len(WARNS)} warning(s).')
    sys.exit(1 if ERRORS else 0)

if __name__ == '__main__':
    main()
