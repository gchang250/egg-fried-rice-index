"""Build real per-riding climate from Environment and Climate Change Canada normals.

Every riding is matched to its nearest ECCC climate-normals station (1981-2010) and
described by that station's ACTUAL measured normals: January mean temperature, July
mean temperature and total annual precipitation. Nothing is classified or invented --
the station's published values are reported as-is, with the station named and its
distance from the riding disclosed.

Source: Environment and Climate Change Canada, Canadian Climate Normals 1981-2010,
via the MSC GeoMet OGC API (https://api.weather.gc.ca/collections/climate-normals).

WARNING, learned the hard way: the API accepts E_NORMAL_ELEMENT_NAME as a queryable
but SILENTLY IGNORES it -- a filtered request returns rows for dozens of unrelated
elements (wind speed, days with blowing snow). Only MONTH filters reliably. So we page
by MONTH and filter on the element name CLIENT-SIDE, then range-check every value.

Replaces the previous `climate` value, which was the single hardcoded string
"Humid continental / Maritime climate" on all 343 ridings.

Writes scripts/data/climate-by-riding.json. Pure fetch + local match; touches no database.
"""
import json, math, os, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
API = 'https://api.weather.gc.ca/collections/climate-normals/items'

TEMP_EL = 'Mean daily temperature deg C'
PRECIP_EL = 'Total precipitation mm'

# Plausibility bounds -- any value outside these is rejected rather than trusted.
BOUNDS = {'jan': (-45.0, 12.0), 'jul': (0.0, 32.0), 'precip': (50.0, 5000.0)}


# The API caps `offset` at ~11k rows, so a whole-country page-through silently stops
# a quarter of the way in. PROVINCE_CODE *is* honoured, so we partition by province
# to keep every result set under the cap.
PROVINCES = ['NL', 'PE', 'NS', 'NB', 'QC', 'ON', 'MB', 'SK', 'AB', 'BC', 'YT', 'NT', 'NU']
OFFSET_CAP = 11000


def fetch_month(month, element):
    """Page through one MONTH province by province, keeping exact element matches."""
    keep, scanned = {}, 0
    for prov in PROVINCES:
        offset = 0
        while True:
            q = urllib.parse.urlencode({'MONTH': month, 'PROVINCE_CODE': prov,
                                        'limit': 1000, 'offset': offset, 'f': 'json'})
            with urllib.request.urlopen(f'{API}?{q}', timeout=120) as r:
                d = json.load(r)
            feats = d.get('features', [])
            if not feats:
                break
            total = d.get('numberMatched', 0)
            if total > OFFSET_CAP and offset == 0:
                print(f'    ! {prov} month {month}: {total} rows exceeds offset cap '
                      f'-- coverage may be partial')
            for f in feats:
                p, g = f['properties'], f.get('geometry')
                if p.get('E_NORMAL_ELEMENT_NAME') != element:
                    continue
                if not g or p.get('VALUE') is None:
                    continue
                sid = p['STN_ID']
                # prefer the current normal, then the longest normal period
                rank = (1 if p.get('CURRENT_FLAG') == 'Y' else 0,
                        p.get('YEAR_COUNT_NORMAL_PERIOD') or 0)
                prev = keep.get(sid)
                if prev is None or rank > prev['rank']:
                    keep[sid] = {'name': p['STATION_NAME'], 'prov': p.get('PROVINCE_CODE'),
                                 'lat': g['coordinates'][1], 'lon': g['coordinates'][0],
                                 'value': float(p['VALUE']), 'rank': rank}
            scanned += len(feats)
            offset += len(feats)
            if offset >= total or offset >= OFFSET_CAP:
                break
    print(f'  MONTH={month:<3} {element:<30} scanned {scanned:>6} rows -> {len(keep)} stations')
    return keep


def hav(lat1, lon1, lat2, lon2):
    R, p = 6371.0, math.pi / 180
    a = (math.sin((lat2 - lat1) * p / 2) ** 2 +
         math.cos(lat1 * p) * math.cos(lat2 * p) * math.sin((lon2 - lon1) * p / 2) ** 2)
    return 2 * R * math.asin(math.sqrt(a))


print('fetching ECCC climate normals (client-side element filtering)...')
jan = fetch_month(1, TEMP_EL)
jul = fetch_month(7, TEMP_EL)
pre = fetch_month(13, PRECIP_EL)

stations, rejected = [], 0
for sid in set(jan) & set(jul) & set(pre):
    v = {'jan': jan[sid]['value'], 'jul': jul[sid]['value'], 'precip': pre[sid]['value']}
    if any(not (BOUNDS[k][0] <= v[k] <= BOUNDS[k][1]) for k in v):
        rejected += 1
        continue
    if v['jul'] <= v['jan']:          # July must be warmer than January in Canada
        rejected += 1
        continue
    s = jan[sid]
    stations.append({'name': s['name'], 'prov': s['prov'], 'lat': s['lat'],
                     'lon': s['lon'], **v})

print(f'\nstations with all three values: {len(stations)}   (rejected as implausible: {rejected})')
if not stations:
    raise SystemExit('no usable stations -- aborting rather than writing bad data')

# Distance is measured to the riding's BOUNDARY POLYGON, not its centroid: the Halifax
# riding includes Sable Island, so its centroid sits in the Atlantic and centroid
# matching put its nearest station 117 km away. Same approach as build-metro-assignments.py.
topo = json.load(open(f'{REPO}/public/ridings.json'))
_scale, _translate = topo['transform']['scale'], topo['transform']['translate']


def _decode(arc):
    x = y = 0
    pts = []
    for dx, dy in arc:
        x += dx
        y += dy
        pts.append((x * _scale[0] + _translate[0], y * _scale[1] + _translate[1]))
    return pts


_arcs = [_decode(a) for a in topo['arcs']]


def _ring(ring):
    pts = []
    for idx in ring:
        a = _arcs[~idx][::-1] if idx < 0 else _arcs[idx]
        pts.extend(a[1:] if pts else a)
    return pts


GEOM = {}
for g in topo['objects']['ridings-2023']['geometries']:
    polys = [g['arcs']] if g['type'] == 'Polygon' else g['arcs']
    verts = [pt for p in polys for pt in _ring(p[0])]
    GEOM[g['properties']['fed_num']] = verts


def dist_to_riding(lat, lon, verts):
    return min(hav(lat, lon, y, x) for x, y in verts)


ridings = json.load(open(f'{REPO}/scripts/data/ridings-real-data.json'))
out, far = {}, []
for r in ridings:
    verts = GEOM.get(r['fed_num'])
    best, bestd = None, float('inf')
    for s in stations:
        d = (dist_to_riding(s['lat'], s['lon'], verts) if verts
             else hav(r['latitude'], r['longitude'], s['lat'], s['lon']))
        if d < bestd:
            best, bestd = s, d
    out[r['name']] = {
        'climate': (f"January {best['jan']:.1f}°C, July {best['jul']:.1f}°C, "
                    f"{best['precip']:.0f} mm precipitation a year"),
        'climate_source': (f"Environment and Climate Change Canada, Canadian Climate "
                           f"Normals 1981-2010, station {best['name'].title()} "
                           f"({round(bestd)} km from this riding)."),
        'station': best['name'], 'station_km': round(bestd, 1),
        'jan_c': best['jan'], 'jul_c': best['jul'], 'precip_mm': best['precip'],
    }
    if bestd > 100:
        far.append((r['name'], best['name'], round(bestd)))

json.dump(out, open(f'{HERE}/climate-by-riding.json', 'w'), ensure_ascii=False, indent=1)
ds = sorted(v['station_km'] for v in out.values())
print(f'wrote {len(out)} ridings -> climate-by-riding.json')
print(f'station distance: median {ds[len(ds)//2]:.1f} km  p90 {ds[int(len(ds)*.9)]:.1f} km  max {ds[-1]:.1f} km')
print(f'ridings whose nearest station is >100 km away: {len(far)}')
for n, s, d in far[:12]:
    print(f'    {n[:38]:<40} {s.title()} ({d} km)')
