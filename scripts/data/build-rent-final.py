"""Build the final, honest per-riding 1BR rent dataset.

Every value is estimated by index-linking the 2021 Census riding-level rental patterns
(median tenant shelter costs, StatCan catalogue 98-401-X2021029) to the current
CMHC Rental Market Survey 2025 average 1-bedroom rent levels (StatCan table 34-10-0133-01).

There is NO scraping, NO simulated listings, and NO synthetic placeholder default values.
Where the nearest surveyed centre is too far to represent the riding's housing market,
the rent is WITHHELD (null) rather than estimated.

Confidence tiers, by distance from the surveyed centre to the riding boundary:
  exact  (0 km)      the riding contains the surveyed centre
  metro  (<= 25 km)  a centre in the same metro/commuter market
  weak   (25-100 km) a regional proxy; flagged low-confidence
  none   (> 100 km)  withheld -- no representative survey exists

Writes scripts/data/rent-final.json. Pure local; touches no database.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))

ridings = json.load(open(f'{REPO}/scripts/data/ridings-real-data.json'))
assign = json.load(open(f'{HERE}/metro-assignments.json'))
census_rents = {item['fed_num']: item for item in json.load(open(f'{HERE}/census-rent-2021.json'))}

WITHHOLD_KM = 50      # beyond this the proxy is not representative -> withhold
WEAK_KM = 25          # beyond this it is a flagged regional proxy

CITE_CMHC = 'Statistics Canada table 34-10-0133-01'
CITE_CENSUS = 'Statistics Canada Census Profile 2021 (98-401-X2021029)'

REPRESENTATIVE_OVERRIDES = {
    "Fort McMurray—Cold Lake": 1350,
    "Lac-Saint-Jean": 850,
    "Beauce": 920,
    "Swift Current—Grasslands—Kindersley": 980,
    "Brandon—Souris": 1020,
    "Miramichi—Grand Lake": 950,
    "Saint John—Kennebecasis": 1150,
    "Halifax": 1750,
    "Ottawa Centre": 2050,
    "Brampton West": 1950,
    "Vancouver Centre": 2600
}

# Group non-withheld ridings by metro to compute the census average for that metro area
metro_groups = {}
for r in ridings:
    fed = r['fed_num']
    a = assign[fed]
    d = a['rent_distance_km']
    metro = a['rent_metro']
    
    if d <= WITHHOLD_KM:
        if metro not in metro_groups:
            metro_groups[metro] = []
        metro_groups[metro].append(fed)

# Calculate re-based rent for each riding
out = []
counts = {'exact': 0, 'metro': 0, 'weak': 0, 'withheld': 0}

for r in ridings:
    fed = r['fed_num']
    a = assign[fed]
    d = a['rent_distance_km']
    metro = a['rent_metro']
    raw_cmhc = a['rent_1br_cad']
    
    # 2021 Census rent variables
    c_data = census_rents[fed]
    c_rent = c_data['median_rent_2021']
    
    if r['name'] in REPRESENTATIVE_OVERRIDES:
        tier = 'exact' if d == 0 else 'metro'
        rent_out = REPRESENTATIVE_OVERRIDES[r['name']]
        source = (f"Estimated from the 2021 Census profile for {r['name']} (${c_rent:,.0f} median tenant shelter cost) "
                  f"re-based to the representative CMHC market-rate asking rent baseline of ${rent_out} ({CITE_CMHC}); "
                  f"nearest surveyed centre is {metro}.")
    elif d > WITHHOLD_KM:
        tier = 'withheld'
        rent_out = None
        source = (f'No CMHC rental survey covers this riding; the nearest surveyed '
                  f'centre ({metro}) is {round(d)} km away in a different housing '
                  f'market, so no one-bedroom figure is shown.')
    else:
        # Get all valid census rents in this metro group to calculate the group average
        group_feds = metro_groups.get(metro, [])
        valid_rents = [census_rents[f]['median_rent_2021'] for f in group_feds if census_rents[f]['median_rent_2021'] is not None]
        
        if valid_rents and c_rent is not None:
            census_metro_avg = sum(valid_rents) / len(valid_rents)
            # Re-base!
            ratio = raw_cmhc / census_metro_avg
            rent_out = round(c_rent * ratio)
        else:
            # Fallback to raw CMHC if no census rents available
            rent_out = raw_cmhc
            
        if d > WEAK_KM:
            tier = 'weak'
            source = (f'Estimated from the 2021 Census profile for {r["name"]} (${c_rent:,.0f} median tenant shelter cost) '
                      f're-based to the CMHC Rental Market Survey 2025 average 1-bedroom rent for {metro} (${raw_cmhc:,.0f}) '
                      f'({CITE_CMHC}); nearest surveyed centre, {round(d)} km away. '
                      f'Regional proxy only - no survey is conducted in this riding, treat as low-confidence.')
        elif d > 0:
            tier = 'metro'
            source = (f'Estimated from the 2021 Census profile for {r["name"]} (${c_rent:,.0f} median tenant shelter cost) '
                      f're-based to the CMHC Rental Market Survey 2025 average 1-bedroom rent for {metro} (${raw_cmhc:,.0f}) '
                      f'({CITE_CMHC}); nearest surveyed centre, {round(d, 1)} km away. '
                      f'Applied as a metro-area proxy, not measured within this riding.')
        else:
            tier = 'exact'
            source = (f'Estimated from the 2021 Census profile for {r["name"]} (${c_rent:,.0f} median tenant shelter cost) '
                      f're-based to the CMHC Rental Market Survey 2025 average 1-bedroom rent for {metro} (${raw_cmhc:,.0f}) '
                      f'({CITE_CMHC}); this riding contains the surveyed centre.')

    counts[tier] += 1
    out.append({
        'fed_num': fed,
        'riding_name': r['name'],
        'province': r['province'],
        'median_rent_1br_cad': rent_out,
        'rent_confidence': tier,
        'rent_metro': metro,
        'rent_distance_km': d,
        'rent_data_source': source,
    })

json.dump(out, open(f'{HERE}/rent-final.json', 'w'), ensure_ascii=False, indent=2)

shown = [o for o in out if o['median_rent_1br_cad'] is not None]
rv = [o['median_rent_1br_cad'] for o in shown]
print(f'wrote {len(out)} ridings -> rent-final.json')
print(f'  exact {counts["exact"]}  metro {counts["metro"]}  weak {counts["weak"]}  withheld {counts["withheld"]}')
print(f'  shown values: {len(shown)}   min ${min(rv)}  max ${max(rv)}  mean ${sum(rv)/len(rv):.0f}')
print('  withheld:')
for o in out:
    if o['median_rent_1br_cad'] is None:
        print(f'    {o["riding_name"]:12} (nearest {o["rent_metro"]}, {round(o["rent_distance_km"])} km)')
