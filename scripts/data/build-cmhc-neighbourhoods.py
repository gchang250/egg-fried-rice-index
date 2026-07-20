"""Capture CMHC neighbourhood-level average rents from HMIP, so they are verifiable.

The seven neighbourhood-differentiated metros previously had their ~276 zone rents
typed as INLINE LITERALS in build-rent-zones.py, with no saved capture behind them.
Only Vancouver had been persisted to cmhc-submetro-2025.json, which left roughly 120
ridings resting on numbers nothing in the repo could check. This fetches all seven
straight from the source and writes the raw table, so the pipeline reads from a file
that can be re-pulled and diffed.

HMIP endpoint (worked out by watching the portal's own requests -- the parameter names
are CASE-SENSITIVE and differ from the lowercase ones the SPA uses elsewhere):

  /hmip-pimh/en/TableMapChart/TableMatchingCriteria
      ?GeographyType=MetropolitanMajorArea
      &GeographyId=<cma id>
      &CategoryLevel1=Primary Rental Market
      &CategoryLevel2=Average Rent ($)     <- must be encoded %28%24%29
      &ColumnField=2                       <- bedroom type across the columns
      &RowField=24                         <- 22 survey zone, 23 CSD, 24 neighbourhood, 25 tract

Each row is 11 cells: name, then (value, quality grade) for Studio, 1BR, 2BR, 3BR+,
Total. Suppressed values appear as "**" with an empty grade, and positions are stable.
Quality grades: a excellent, b very good, c good, d poor.

Source: Canada Mortgage and Housing Corporation, Rental Market Survey (October 2025),
via the Housing Market Information Portal. Adapted from CMHC; this does not constitute
an endorsement by CMHC of this product.

Writes scripts/data/cmhc-neighbourhoods-2025.json.
"""
import json, os, re, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = 'https://www03.cmhc-schl.gc.ca/hmip-pimh/en/TableMapChart/TableMatchingCriteria'

# CMA GeographyIds used by HMIP
METROS = {
    'Vancouver': '2410',
    'Toronto': '2270',
    'Montreal': '1060',
    'Calgary': '0140',
    'Edmonton': '0340',
    'Ottawa': '1265',
    'Kitchener-Cambridge-Waterloo': '0850',
}
COLS = ['studio', 'rent_1br', 'rent_2br', 'rent_3br_plus', 'total']


def fetch(metro, gid):
    q = ('GeographyType=MetropolitanMajorArea'
         f'&GeographyId={gid}'
         '&CategoryLevel1=' + urllib.parse.quote('Primary Rental Market') +
         '&CategoryLevel2=' + urllib.parse.quote('Average Rent ($)') +
         '&ColumnField=2&RowField=24')
    req = urllib.request.Request(f'{BASE}?{q}', headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=120) as r:
        html = r.read().decode('utf8', 'replace')
    if 'Server Error' in html:
        raise SystemExit(f'{metro}: HMIP returned a server error -- check the parameters')

    tables = re.findall(r'<table[^>]*>(.*?)</table>', html, re.S)
    if not tables:
        raise SystemExit(f'{metro}: no table in response')

    out = {}
    for row in re.findall(r'<tr[^>]*>(.*?)</tr>', tables[0], re.S):
        cells = re.findall(r'<t[hd][^>]*>(.*?)</t[hd]>', row, re.S)
        vals = [re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', c)).replace('\xa0', ' ').strip()
                for c in cells]
        if len(vals) != 11 or not vals[0] or vals[0] in ('', '&nbsp;'):
            continue
        name = vals[0]
        rec = {}
        for i, key in enumerate(COLS):
            raw, grade = vals[1 + i * 2], vals[2 + i * 2]
            if raw in ('**', '', '-', 'n/a'):
                continue                      # suppressed by CMHC -- record nothing
            try:
                rec[key] = float(raw.replace(',', ''))
            except ValueError:
                continue
            if grade:
                rec[key + '_grade'] = grade
        if rec:
            out[name] = rec
    return out


data = {
    '_meta': ('CMHC Rental Market Survey October 2025, average rent by bedroom type at the '
              'neighbourhood level, captured from the Housing Market Information Portal '
              '(TableMatchingCriteria, RowField=24). Quality grades: a excellent, b very good, '
              'c good, d poor. Values are CAD/month; suppressed cells are omitted. Adapted from '
              'Canada Mortgage and Housing Corporation; this does not constitute an endorsement '
              'by CMHC of this product.'),
}
for metro, gid in METROS.items():
    rows = fetch(metro, gid)
    n1 = sum(1 for v in rows.values() if 'rent_1br' in v)
    print(f'  {metro:<30} {len(rows):>3} rows, {n1:>3} with a 1-bedroom value')
    data[metro] = rows

json.dump(data, open(f'{HERE}/cmhc-neighbourhoods-2025.json', 'w'), ensure_ascii=False, indent=1)
total = sum(len(v) for k, v in data.items() if k != '_meta')
print(f'\nwrote {total} neighbourhood rows across {len(METROS)} metros '
      f'-> cmhc-neighbourhoods-2025.json')
