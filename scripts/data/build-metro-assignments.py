"""Assign real CMHC 2025 one-bedroom rents and StatCan 2024 Crime Severity Index
values to all 343 federal ridings, by nearest surveyed metro.

"Nearest" is measured from the surveyed centre to the riding's actual 2023
boundary polygon (0 km when the centre falls inside the riding), not to a
centroid -- the Halifax riding includes Sable Island, so its centroid sits in
the Atlantic.

Writes scripts/data/metro-assignments.json.
"""
import json, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))

DROP_CENTRES = {
    'Kings Subdivision, Ontario',        # no such place in the NRCan gazetteer
    'Ottawa-Gatineau, Ontario/Quebec',   # superseded by the two province parts
}
DROP_CSI = {'Ottawa-Gatineau, Ontario/Quebec'}
COORD_OVERRIDE = {
    'Ottawa-Gatineau, Quebec part, Ontario/Quebec': (45.4765, -75.7013),  # Gatineau
}

PROV_OF = {
    'Newfoundland and Labrador': 'NL', 'Prince Edward Island': 'PE',
    'Nova Scotia': 'NS', 'New Brunswick': 'NB', 'Quebec': 'QC', 'Ontario': 'ON',
    'Manitoba': 'MB', 'Saskatchewan': 'SK', 'Saskachewan': 'SK', 'Alberta': 'AB',
    'British Columbia': 'BC', 'Yukon': 'YT', 'Northwest Territories': 'NT',
    'Nunavut': 'NU',
}


def prov_of_geo(geo):
    """'Ottawa-Gatineau, Quebec part, Ontario/Quebec' -> QC.
    An explicit '<Province> part' token wins over the combined tail."""
    parts = [p.strip() for p in geo.split(',')]
    for p in parts:
        if p.endswith(' part') and p[:-5] in PROV_OF:
            return PROV_OF[p[:-5]]
    for p in reversed(parts):
        head = p.split('/')[0].strip()
        if head in PROV_OF:
            return PROV_OF[head]
    raise KeyError(geo)


def hav(lat1, lon1, lat2, lon2):
    R = 6371.0
    p = math.pi / 180
    a = (math.sin((lat2 - lat1) * p / 2) ** 2 +
         math.cos(lat1 * p) * math.cos(lat2 * p) * math.sin((lon2 - lon1) * p / 2) ** 2)
    return 2 * R * math.asin(math.sqrt(a))


# ---- riding polygons -------------------------------------------------------
topo = json.load(open(f'{REPO}/public/ridings.json'))
scale, translate = topo['transform']['scale'], topo['transform']['translate']


def decode(arc):
    x = y = 0
    out = []
    for dx, dy in arc:
        x += dx
        y += dy
        out.append((x * scale[0] + translate[0], y * scale[1] + translate[1]))
    return out


arcs = [decode(a) for a in topo['arcs']]


def ring_coords(ring):
    pts = []
    for idx in ring:
        a = arcs[~idx][::-1] if idx < 0 else arcs[idx]
        pts.extend(a[1:] if pts else a)
    if pts and pts[0] != pts[-1]:
        pts.append(pts[0])
    return pts


ridings_geom = {}
for g in topo['objects']['ridings-2023']['geometries']:
    polys = [g['arcs']] if g['type'] == 'Polygon' else g['arcs']
    rings = [ring_coords(p[0]) for p in polys]          # exterior rings only
    verts = [pt for r in rings for pt in r]
    lons = [p[0] for p in verts]
    lats = [p[1] for p in verts]
    ridings_geom[g['properties']['fed_num']] = {
        'rings': rings, 'verts': verts,
        'bbox': (min(lats), max(lats), min(lons), max(lons)),
    }


def point_in_rings(lat, lon, rings):
    for r in rings:
        inside = False
        for i in range(len(r) - 1):
            x0, y0 = r[i]
            x1, y1 = r[i + 1]
            if (y0 > lat) != (y1 > lat):
                xint = x0 + (lat - y0) * (x1 - x0) / (y1 - y0)
                if lon < xint:
                    inside = not inside
        if inside:
            return True
    return False


def bbox_lower_bound(lat, lon, bbox):
    """Cheap lower bound on distance from a point to the riding's bbox."""
    lo_lat, hi_lat, lo_lon, hi_lon = bbox
    dlat = 0.0 if lo_lat <= lat <= hi_lat else min(abs(lat - lo_lat), abs(lat - hi_lat))
    dlon = 0.0 if lo_lon <= lon <= hi_lon else min(abs(lon - lo_lon), abs(lon - hi_lon))
    return math.hypot(dlat * 111.0, dlon * 111.0 * math.cos(lat * math.pi / 180))


def dist_to_riding(lat, lon, geom):
    if point_in_rings(lat, lon, geom['rings']):
        return 0.0
    best = float('inf')
    for x, y in geom['verts']:
        d = hav(lat, lon, y, x)
        if d < best:
            best = d
    return best


# ---- CMHC rents ------------------------------------------------------------
rents = json.load(open(f'{HERE}/cmhc-1br-2025.json'))
geo = json.load(open(f'{HERE}/surveyed-centre-coords.json'))
centres = []
for name, rec in rents.items():
    if name in DROP_CENTRES:
        continue
    g = geo.get(name)
    if not g:
        continue
    lat, lon = COORD_OVERRIDE.get(name, (g['lat'], g['lon']))
    centres.append({'name': name, 'prov': prov_of_geo(name), 'lat': lat, 'lon': lon,
                    'rent': rec['rent_1br_2025']})

# ---- CSI -------------------------------------------------------------------
csi_raw = json.load(open(f'{HERE}/statcan-csi-2024.json'))
csi_pts, csi_prov = [], {}
for base, val in csi_raw.items():
    if base in DROP_CSI:
        continue
    if ',' in base:
        cand = geo.get(base)
        if not cand:
            print(f'  csi unplaced: {base}', file=sys.stderr)
            continue
        csi_pts.append({'name': base, 'prov': prov_of_geo(base),
                        'lat': cand['lat'], 'lon': cand['lon'], 'csi': val})
    elif base in PROV_OF:
        csi_prov[PROV_OF[base]] = val

print(f'rent centres: {len(centres)}   csi metros: {len(csi_pts)}', file=sys.stderr)


CMA_CENTRES = {
    'Montréal, Quebec',
    'Toronto, Ontario',
    'Vancouver, British Columbia',
    'Calgary, Alberta',
    'Edmonton, Alberta',
    'Ottawa-Gatineau, Ontario part, Ontario/Quebec',
    'Ottawa-Gatineau, Quebec part, Ontario/Quebec',
    'Winnipeg, Manitoba',
    'Québec, Quebec',
    'Hamilton, Ontario',
    'Kitchener-Cambridge-Waterloo, Ontario',
    'London, Ontario',
    'Halifax, Nova Scotia',
    'St. Catharines-Niagara, Ontario',
    'Windsor, Ontario',
    'Oshawa, Ontario',
    'Victoria, British Columbia',
    'Saskatoon, Saskatchewan',
    'Regina, Saskatchewan',
    'Sherbrooke, Quebec',
    "St. John's, Newfoundland and Labrador",
    'Barrie, Ontario',
    'Kelowna, British Columbia',
    'Abbotsford-Mission, British Columbia',
    'Greater Sudbury, Ontario',
    'Kingston, Ontario',
    'Saguenay, Quebec',
    'Trois-Rivières, Quebec',
    'Moncton, New Brunswick',
    'Saint John, New Brunswick',
    'Peterborough, Ontario',
    'Thunder Bay, Ontario',
    'Lethbridge, Alberta',
    'Nanaimo, British Columbia',
    'Kamloops, British Columbia',
    'Chilliwack, British Columbia',
    'Fredericton, New Brunswick',
    'Red Deer, Alberta',
    'Drummondville, Quebec',
}

# Pre-calculate distance to closest CMA for all rent and CSI centres
for c in centres:
    if c['name'] in CMA_CENTRES:
        c['dist_to_cma'] = 0.0
    else:
        cma_same = [x for x in centres if x['name'] in CMA_CENTRES and x['prov'] == c['prov']]
        if cma_same:
            c['dist_to_cma'] = min(hav(c['lat'], c['lon'], x['lat'], x['lon']) for x in cma_same)
        else:
            c['dist_to_cma'] = 999.0

for c in csi_pts:
    if c['name'] in CMA_CENTRES:
        c['dist_to_cma'] = 0.0
    else:
        cma_same = [x for x in csi_pts if x['name'] in CMA_CENTRES and x['prov'] == c['prov']]
        if cma_same:
            c['dist_to_cma'] = min(hav(c['lat'], c['lon'], x['lat'], x['lon']) for x in cma_same)
        else:
            c['dist_to_cma'] = 999.0


def nearest(pool, geom, prov, centroid):
    same = [p for p in pool if p['prov'] == prov]
    use = same or pool
    
    candidates = []
    for p in use:
        d = dist_to_riding(p['lat'], p['lon'], geom)
        d_centroid = hav(p['lat'], p['lon'], centroid[0], centroid[1])
        candidates.append((p, d, d_centroid))
        
    # 1. CMA Core Overrides: CMA within 20 km of boundary
    cma_20 = [(p, d, dc) for p, d, dc in candidates if p['name'] in CMA_CENTRES and d <= 20.0]
    if cma_20:
        best_p, best_d, _ = min(cma_20, key=lambda x: x[1])
        return best_p, best_d
        
    # 2. Exact matches (inside the riding)
    exacts = [(p, d, dc) for p, d, dc in candidates if d == 0.0]
    if exacts:
        # Prioritize independent centres (distance to closest CMA > 50 km) to avoid suburban distortion (e.g. Sainte-Marie vs Saint-Georges)
        independents = [x for x in exacts if x[0].get('dist_to_cma', 999.0) > 50.0]
        targets = independents if independents else exacts
        best_p, best_d, _ = max(targets, key=lambda x: x[0].get('rent', x[0].get('csi', 0)))
        return best_p, best_d
        
    # 3. CMA candidates within commuting range (35 km)
    cma_candidates = [(p, d, dc) for p, d, dc in candidates if p['name'] in CMA_CENTRES and d <= 35.0]
    if cma_candidates:
        best_p, best_d, _ = min(cma_candidates, key=lambda x: x[1])
        return best_p, best_d
        
    # 4. Absolute closest centre
    best_p, best_d, _ = min(candidates, key=lambda x: x[1])
    return best_p, best_d


ridings = json.load(open(f'{REPO}/scripts/data/ridings-real-data.json'))
out = {}
for r in ridings:
    fed, prov = r['fed_num'], r['province']
    geom = ridings_geom[fed]
    centroid = (r['latitude'], r['longitude'])

    rc, rd = nearest(centres, geom, prov, centroid)

    if prov in csi_prov and not any(p['prov'] == prov for p in csi_pts):
        csi_val, csi_geo, csi_d = csi_prov[prov], f'{prov} (province/territory)', None
    else:
        cc, cd = nearest(csi_pts, geom, prov, centroid)
        csi_val, csi_geo, csi_d = cc['csi'], cc['name'], round(cd, 1)

    out[fed] = {
        'rent_1br_cad': rc['rent'],
        'rent_metro': rc['name'],
        'rent_distance_km': round(rd, 1),
        'csi': csi_val,
        'csi_geo': csi_geo,
        'csi_distance_km': csi_d,
        'safety_index': max(5, min(95, round(100 - csi_val / 2))),
    }

json.dump(out, open(f'{REPO}/scripts/data/metro-assignments.json', 'w'),
          ensure_ascii=False, indent=1, sort_keys=True)

rv = [v['rent_1br_cad'] for v in out.values()]
dv = sorted(v['rent_distance_km'] for v in out.values())
print(f'\nridings assigned: {len(out)}')
print(f'rent   min={min(rv)}  max={max(rv)}  mean={sum(rv)/len(rv):.0f}')
print(f'dist   median={dv[len(dv)//2]:.1f} km   p90={dv[int(len(dv)*.9)]:.1f} km   max={dv[-1]:.1f} km')
print(f'inside the riding (0 km): {sum(1 for d in dv if d == 0)}/343')
name = {r['fed_num']: r['name'] for r in ridings}
print('\nfarthest assignments:')
for k, v in sorted(out.items(), key=lambda kv: -kv[1]['rent_distance_km'])[:5]:
    print(f"  {name[k]:34} -> {v['rent_metro'][:38]:40} {v['rent_distance_km']:7.1f} km  ${v['rent_1br_cad']}")
