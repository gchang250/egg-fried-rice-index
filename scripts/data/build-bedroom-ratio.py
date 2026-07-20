"""Derive the real 1-bedroom -> 2-bedroom rent ratio from published CMHC data.

The site's "Family" profile used a hardcoded `rent * 1.65` to turn a one-bedroom rent
into a family housing cost. That number traced to nothing. CMHC publishes average
two-bedroom rents per centre, so the ratio is measurable rather than assumed.

Downloads the CMHC Rental Market Survey national data tables (Table 1.0 carries the
average two-bedroom rent by centre), joins them to the one-bedroom values already on
disk in cmhc-1br-2025.json, and writes the per-centre ratios plus the national median.

Source: Canada Mortgage and Housing Corporation, Rental Market Survey 2025 data tables
(rmr-canada-2025-en.xlsx). Reproduced under the CMHC Licence Agreement for the Use of Data.

Writes scripts/data/cmhc-bedroom-ratio-2025.json.
"""
import json, os, re, statistics, urllib.request, xml.etree.ElementTree as ET, zipfile, io

HERE = os.path.dirname(os.path.abspath(__file__))
URL = ('https://assets.cmhc-schl.gc.ca/sites/cmhc/professional/housing-markets-data-and-research/'
       'housing-data-tables/rental-market/rental-market-report-data-tables/2025/rmr-canada-2025-en.xlsx')
NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
MAIN = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'

print('downloading CMHC Rental Market Survey data tables...')
with urllib.request.urlopen(URL, timeout=120) as r:
    blob = r.read()
print(f'  {len(blob)} bytes')

z = zipfile.ZipFile(io.BytesIO(blob))
shared = ET.fromstring(z.read('xl/sharedStrings.xml'))
ss = [''.join(t.text or '' for t in si.iter(f'{MAIN}t')) for si in shared.findall('m:si', NS)]

# sheet2 = "Table 1.0 Rental Market Indicators ... Provinces and Major Centres"
root = ET.fromstring(z.read('xl/worksheets/sheet2.xml'))
rows = []
for row in root.iter(f'{MAIN}row'):
    vals = []
    for c in row.findall('m:c', NS):
        v = c.find('m:v', NS)
        vals.append('' if v is None or v.text is None else (ss[int(v.text)] if c.get('t') == 's' else v.text))
    rows.append(vals)

# Column 13 is the Oct-2025 average two-bedroom rent (col 11 is Oct-2024).
two = {}
for r_ in rows:
    if len(r_) > 14 and r_[0] and re.search(r'(CMA|CA)$', r_[0].strip()):
        centre = re.sub(r'\s+(CMA|CA)$', '', r_[0].strip())
        try:
            two[centre] = float(str(r_[13]).replace(',', ''))
        except ValueError:
            pass

one = json.load(open(f'{HERE}/cmhc-1br-2025.json'))
one_by_centre = {k.split(',')[0].strip(): v['rent_1br_2025'] for k, v in one.items()}

per_centre, ratios = {}, []
for centre, two_br in sorted(two.items()):
    one_br = one_by_centre.get(centre)
    if not one_br:
        continue
    ratio = two_br / one_br
    per_centre[centre] = {'rent_1br': one_br, 'rent_2br': two_br, 'ratio': round(ratio, 4)}
    ratios.append(ratio)

if len(ratios) < 20:
    raise SystemExit(f'only {len(ratios)} centres matched -- refusing to publish a thin ratio')

out = {
    '_meta': ('Average 2-bedroom / 1-bedroom rent ratio, CMHC Rental Market Survey 2025. '
              'Adapted from Canada Mortgage and Housing Corporation; this does not constitute '
              'an endorsement by CMHC of this product.'),
    '_source_url': URL,
    'centres_matched': len(ratios),
    'ratio_median': round(statistics.median(ratios), 4),
    'ratio_mean': round(statistics.mean(ratios), 4),
    'ratio_min': round(min(ratios), 4),
    'ratio_max': round(max(ratios), 4),
    'by_centre': per_centre,
}
json.dump(out, open(f'{HERE}/cmhc-bedroom-ratio-2025.json', 'w'), ensure_ascii=False, indent=1)
print(f"matched {len(ratios)} centres")
print(f"  2BR/1BR  median {out['ratio_median']}  mean {out['ratio_mean']}  "
      f"range {out['ratio_min']}-{out['ratio_max']}")
print('wrote cmhc-bedroom-ratio-2025.json')
