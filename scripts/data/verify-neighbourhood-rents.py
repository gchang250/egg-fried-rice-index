"""Verify every inline neighbourhood rent in build-rent-zones.py against the CMHC capture.

build-rent-zones.py carries ~276 CMHC neighbourhood 1-bedroom rents as inline literals,
keyed by abbreviated names ('Kits/Pt Grey N', 'Cal DT/EauClaire') that intentionally do
not match CMHC's official row labels. That made them impossible to check, and roughly
120 ridings depend on them.

This asserts that every inline value appears among the 1-bedroom values CMHC actually
publishes for THAT metro, using the raw capture in cmhc-neighbourhoods-2025.json
(re-pullable via build-cmhc-neighbourhoods.py). It cannot confirm a value is attached to
the right neighbourhood -- the abbreviated keys prevent that -- but it does catch typos,
drift, and any number that was never in the source at all.

Exits non-zero on any mismatch. Run after editing either file.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
cap = json.load(open(f'{HERE}/cmhc-neighbourhoods-2025.json'))
src = open(f'{HERE}/build-rent-zones.py').read()
head = src.split('# --- riding ->')[0]

# The inline block is grouped by '# <Metro>' banner comments.
BANNER = re.compile(r'#\s*(Vancouver|Toronto|Montreal|Calgary|Edmonton|Ottawa|Kitchener.*)$')
metro, inline = None, {}
for line in head.splitlines():
    m = BANNER.match(line.strip())
    if m:
        metro = m.group(1)
        if metro.startswith('Kitchener'):
            metro = 'Kitchener-Cambridge-Waterloo'
    for k, v in re.findall(r"'([^']+)':(\d+),", line):
        if metro:
            inline.setdefault(metro, {})[k] = int(v)

if not inline:
    sys.exit('FAIL: could not parse any inline values -- did the banner comments change?')

failures, checked = [], 0
print(f"{'Metro':<32}{'inline':>7}{'ok':>6}{'bad':>5}")
print('-' * 52)
for m, vals in inline.items():
    if m not in cap:
        sys.exit(f'FAIL: no capture for metro {m}')
    ok_vals = {round(v['rent_1br']) for v in cap[m].values() if 'rent_1br' in v}
    bad = {k: x for k, x in vals.items() if x not in ok_vals}
    checked += len(vals)
    failures.extend((m, k, x) for k, x in bad.items())
    print(f'  {m[:30]:<30}{len(vals):>7}{len(vals) - len(bad):>6}{len(bad):>5}')

print()
if failures:
    print(f'FAIL: {len(failures)} inline value(s) are not published by CMHC for their metro:')
    for m, k, x in failures:
        print(f'    {m:<16} {k:<28} {x}')
    sys.exit(1)
print(f'OK: all {checked} inline neighbourhood rents match the CMHC capture.')
