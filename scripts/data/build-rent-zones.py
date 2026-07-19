"""Build per-riding 1BR rent from REAL CMHC neighbourhood-level data (Oct 2025).

Each riding is mapped to the CMHC survey neighbourhood(s) covering it; its rent is
the mean of those neighbourhoods' real 1-bedroom average rents (CMHC RMS Oct 2025,
extracted from HMIP). Ridings not yet mapped fall back to the real CMHC metro (CMA)
value from metro-assignments.json — never a fabricated number. Remote ridings with no
representative survey (>50 km) are withheld (null).

No scraping, no simulated data, no synthetic placeholders, no hardcoded overrides.
Writes scripts/data/rent-final.json.
"""
import json, os
from collections import defaultdict, Counter
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
ridings = json.load(open(f'{REPO}/scripts/data/ridings-real-data.json'))
assign  = json.load(open(f'{HERE}/metro-assignments.json'))
census  = {str(c['fed_num']): c for c in json.load(open(f'{HERE}/census-rent-2021.json'))}
WITHHOLD_KM = 50
CITE_CENSUS = 'Statistics Canada Census 2021 (98-401-X2021029)'
CITE_CMHC_TBL = 'CMHC Rental Market Survey 2025 (Statistics Canada table 34-10-0133-01)'

# --- Real CMHC Oct-2025 1BR average rent by neighbourhood (only those used) ---
NB = {
# Vancouver
'Downtown Central':2020,'Downtown North':2431,'West End N':1803,'West End S':1843,'English Bay':1950,
'Hastings/Grandview':1675,'Renfrew':1878,'Cedar Cottage':1770,'Collingwood':1628,'Sunset':1706,
'Fraserview/Killarney':1795,'South Granville':1820,'South Cambie':1668,'Marpole South':1534,
'Kits/Pt Grey N':1914,'Kits/Pt Grey S':1923,'Point Grey':1903,'Kerrisdale':1666,'UEL':2469,
'Metrotown':1664,'Central Park Bby':1974,'Brentwood':1634,'Univ/Lougheed':1848,'New West East':1821,
'Edmonds':1511,'Coquitlam West':1691,'Port Coquitlam':1634,'Central Lonsdale':1970,'Lonsdale North':1851,
'NVan DM East':2273,'Ambleside':2071,'Dundarave':2221,'Richmond City Ctr':1538,'Richmond South':1838,
'Richmond West':1838,'Ladner':1179,'North Delta':1135,'Tsawwassen':1905,'Surrey City Ctr':1738,
'Whalley':1712,'Newton':1492,'Guildford':1384,'Langley CY':1667,'South Surrey':1586,'White Rock':1435,
# Toronto
'Brampton East':1770,'Brampton West':1782,'Miss Ctr/Streetsville':1721,'Cooksville':1698,'Port Credit':1600,
'Churchill/ErinMills':1750,'Clarkson/LornePark':1724,'Meadowvale':2061,'Markham':1885,
'Bayview Woods':2192,'RichmondHill/Vaughan/King':1583,'Aurora':1853,'Newmarket':1912,
'Agincourt/Malvern':1632,'TamOShanter':1658,'Lamoreaux/Milliken':1575,'Wexford-Maryvale':1667,'Bendale':1697,
'Clairlea-Birchmount':1484,'Cliffcrest':1657,'Kennedy Park':1638,'Woburn':1663,'West Hill':1775,
'Morningside':1447,'Scarborough Village':1816,'Willowdale East':1847,'Willowdale West':1794,
'Henry Farm':1765,'DonValleyVillage':1758,'Banbury-DonMills':1628,'Leaside':1713,
'Englemount-Lawrence':1444,'Lawrence Park N':1726,'Yonge-Eglinton':1605,'Downsview':1522,'Bathurst Manor':1710,
'Black Creek':1501,'Maple Leaf':1755,'West Humber-Clairville':1712,'Elms-Old Rexdale':1790,'MountOlive':1759,
'Islington/CityCtrN':1867,'Princess-Rosethorn':2226,'Willowridge-Richview':1966,'Mimico':1399,'New Toronto':1426,
'Long Branch':1413,'Stonegate-Queensway':1620,'Weston':1687,'Mount Dennis':1634,'Rockcliffe-Smythe':1593,
'Waterfront/Island':2489,'Bay Street Corridor':2619,'Church-Yonge':1922,'Moss Park/RegentPark':1987,
'North St James Town':1739,'Cabbagetown':1903,'Playter/Danforth':1599,'Riverdale':1656,'Broadview North':1597,
'Yonge-St Clair':1868,'Humewood-Cedarvale':1817,'Forest Hill N':1773,'Casa Loma':2001,'University/Annex':2050,
'Rosedale':2203,'Moore Park':2063,'Dovercourt/Junction':2054,'Oakwood-Vaughan':1757,'Caledonia-Fairbank':1584,
'HighPark N/Junction':1863,'HighPark-Swansea':1479,'SParkdale/KingW':1826,'Roncesvalles':1495,'Orangeville/Mono':1463,
'The Beaches':1683,'EastEnd-Danforth':1885,'Woodbine Corridor':1702,'OConnor-Parkview':1576,
# Montreal
'Ville-Marie':1642,'South West Mtl':1250,'Ile-des-Soeurs':1392,'Plateau':1298,'East Ville-Marie':1202,
'Rosemont/PetitePatrie':1055,'Hochelaga-Maisonneuve':1142,'Villeray':1019,'Parc-Extension':941,
'Outremont':1563,'Mont-Royal':1214,'Cote-des-Neiges':1123,'NDG':1021,'Westmount':1313,
'LaSalle':1086,'Verdun':1105,'Dorval':1069,'Lachine':904,'Saint-Laurent':1163,'Saint-Leonard':1006,
'Ahuntsic':937,'Cartierville':922,'Montreal-Nord':1050,'Anjou':764,'Pointe-aux-Trembles':975,
'Dollard-des-Ormeaux':1195,'Roxboro-Pierrefonds':1009,'Pointe-Claire':1507,'Chomedey':1288,'Laval-Ouest':1243,
'Laval-des-Rapides':1257,'Pont-Viau':1148,'Fabreville':1055,'Sainte-Rose':1143,'Saint-Francois':1366,
'Saint-Vincent-de-Paul':1043,'Sainte-Therese':1057,'Boisbriand':1288,'Deux-Montagnes':1194,'Saint-Eustache':912,
'Mirabel':1444,'Terrebonne':1181,'Lachenaie':1466,'Repentigny':1123,'Saint-Lin':884,
'Longueuil':1106,'Greenfield Park':1064,'Saint-Hubert':1271,'Brossard':1328,'Saint-Lambert':1372,
'Beloeil':1564,'Mont-Saint-Hilaire':1568,'Varennes':1284,'Sainte-Julie':1354,'La Prairie':1193,
'Candiac':1440,'Saint-Constant':1363,'Chateauguay':1177,'Saint-Jean':869,'Vaudreuil-Dorion':1375,'Ile-Perrot':904,
# Calgary
'Cal DT/EauClaire':1651,'Cal Beltline':1614,'Cal Bridgeland':1823,'Cal CrescentHts':1363,'Cal CapitolHill':1521,
'Cal Varsity':1572,'Cal Montgomery':1782,'Cal WinstonHts':1714,'Cal Huntington':1470,'Cal Edgemont':1635,
'Cal Ranchlands':1629,'Cal SkyviewNE':1530,'Cal Marlborough':1429,'Cal ForestLawn':1497,'Cal Dover':1553,
'Cal Braeside':1728,'Cal WillowPark':1467,'Cal NorthGlenmore':1520,'Cal Midnapore':1581,'Cal McKenzieTowne':1685,
'Cal WestSprings':2166,'Cal Wildwood':1544,'Cal Glenbrook':1461,'Cal Airdrie':1448,'Cal Cochrane':1503,
# Edmonton
'Edm Downtown':1401,'Edm Oliver':1332,'Edm CentralMcDougall':1131,'Edm QueenMaryPark':1222,'Edm McCauley':1226,
'Edm Garneau':1231,'Edm University':1383,'Edm Strathearn':1089,'Edm BonnyDoon':1306,'Edm Northmount':1061,
'Edm NorthCentralW':1099,'Edm Delton':1200,'Edm Londonderry':1327,'Edm Clairview':1135,'Edm EastCastleDowns':1378,
'Edm NorthEast':1371,'Edm WestCastledowns':1348,'Edm Callingwood':1309,'Edm WestJasperPlace':1528,'Edm NorthJasperPlace':1113,
'Edm GatewayBlvdW':1428,'Edm Southgate':1252,'Edm CentralSW':1316,'Edm Riverbend':1274,'Edm Terwillegar':1493,
'Edm CentralMillwoods':1243,'Edm SouthMillwoods':1478,'Edm SherwoodPark':1576,'Edm FortSask':1416,'Edm StAlbert':1659,
'Edm Leduc':1338,'Edm SpruceGrove':1397,
# Ottawa
'Ott Downtown':1601,'Ott Chinatown/Hintonburg':1726,'Ott Glebe':1770,'Ott SandyHill':1611,'Ott Lowertown':1780,
'Ott WestCentretown':1692,'Ott AltaVista':1605,'Ott HuntClub':1440,'Ott OldOttawaS':1784,'Ott Knoxdale/Merivale':1517,
'Ott Iris/Queensway':1370,'Ott Britannia':1420,'Ott Bayshore':1629,'Ott Vanier':1407,'Ott Overbrook':1687,
'Ott BeaconHill':1713,'Ott NewEdinburgh':1354,'Ott Kanata/Stittsville':2109,'Ott EasternOrleans':2004,
'Ott GloucesterOrleans':1494,'Ott ClarenceRockland':950,
# Kitchener-Cambridge-Waterloo
'KW KitCentral':1409,'KW KitSouthCentral':1078,'KW KitSouthEast':1571,'KW KitSouthWest':1577,'KW KitNorthWest':1702,
'KW WaterlooUptown':1805,'KW WaterlooUniv':1832,'KW WaterlooNE':1742,'KW WaterlooNW':1334,'KW GaltEast':1693,
'KW GaltWest':1416,'KW PrestonOutside':1912,'KW Woolwich':1205,
}

# --- riding -> [neighbourhoods] ---
MAP = {
# Vancouver
'Vancouver Centre':['Downtown Central','Downtown North','West End N','West End S','English Bay'],
'Vancouver East':['Hastings/Grandview','Renfrew','Cedar Cottage'],
'Vancouver Kingsway':['Cedar Cottage','Collingwood','Sunset'],
'Vancouver Fraserview—South Burnaby':['Fraserview/Killarney','Sunset','Edmonds'],
'Vancouver Granville':['South Granville','South Cambie','Marpole South'],
'Vancouver Quadra':['Kits/Pt Grey N','Kits/Pt Grey S','Point Grey','Kerrisdale','UEL'],
'Burnaby Central':['Metrotown','Central Park Bby','Brentwood'],
'Burnaby North—Seymour':['Brentwood','Univ/Lougheed'],
'New Westminster—Burnaby—Maillardville':['New West East','Edmonds','Coquitlam West'],
'North Vancouver—Capilano':['Central Lonsdale','Lonsdale North','NVan DM East'],
'Richmond East—Steveston':['Richmond South','Richmond West'],
'Richmond Centre—Marpole':['Richmond City Ctr','Marpole South'],
'Delta':['Ladner','North Delta','Tsawwassen'],
'Surrey Centre':['Surrey City Ctr','Whalley'],
'Surrey Newton':['Newton'],
'Fleetwood—Port Kells':['Guildford','Whalley'],
'Cloverdale—Langley City':['Langley CY'],
'South Surrey—White Rock':['South Surrey','White Rock'],
'Coquitlam—Port Coquitlam':['Coquitlam West','Port Coquitlam'],
'Port Moody—Coquitlam':['Coquitlam West'],
# Toronto
'Brampton Centre':['Brampton East','Brampton West'],'Brampton East':['Brampton East'],
'Brampton North—Caledon':['Brampton East'],'Brampton South':['Brampton West'],
'Brampton West':['Brampton West'],'Brampton—Chinguacousy Park':['Brampton West','Brampton East'],
'Mississauga Centre':['Miss Ctr/Streetsville','Cooksville'],'Mississauga East—Cooksville':['Cooksville','Port Credit'],
'Mississauga—Erin Mills':['Churchill/ErinMills'],'Mississauga—Lakeshore':['Port Credit','Clarkson/LornePark'],
'Mississauga—Malton':['Miss Ctr/Streetsville'],'Mississauga—Streetsville':['Miss Ctr/Streetsville','Meadowvale'],
'Markham—Stouffville':['Markham'],'Markham—Thornhill':['Markham'],'Markham—Unionville':['Markham'],
'Thornhill':['Markham','Bayview Woods'],'King—Vaughan':['RichmondHill/Vaughan/King'],
'Vaughan—Woodbridge':['RichmondHill/Vaughan/King'],'Richmond Hill South':['RichmondHill/Vaughan/King','Bayview Woods'],
'Aurora—Oak Ridges—Richmond Hill':['Aurora','RichmondHill/Vaughan/King'],'Newmarket—Aurora':['Newmarket','Aurora'],
'Scarborough—Agincourt':['Agincourt/Malvern','TamOShanter'],'Scarborough North':['Agincourt/Malvern','Lamoreaux/Milliken'],
'Scarborough Centre—Don Valley East':['Wexford-Maryvale','Bendale'],
'Scarborough Southwest':['Clairlea-Birchmount','Cliffcrest','Kennedy Park'],
'Scarborough—Woburn':['Woburn','Bendale'],'Scarborough—Guildwood—Rouge Park':['West Hill','Morningside','Scarborough Village'],
'Willowdale':['Willowdale East','Willowdale West'],'Don Valley North':['Henry Farm','DonValleyVillage','Bayview Woods'],
'Don Valley West':['Banbury-DonMills','Leaside'],'Eglinton—Lawrence':['Englemount-Lawrence','Lawrence Park N','Yonge-Eglinton'],
'York Centre':['Downsview','Bathurst Manor'],'Humber River—Black Creek':['Black Creek','Downsview','Maple Leaf'],
'Etobicoke North':['West Humber-Clairville','Elms-Old Rexdale','MountOlive'],
'Etobicoke Centre':['Islington/CityCtrN','Princess-Rosethorn','Willowridge-Richview'],
'Etobicoke—Lakeshore':['Mimico','New Toronto','Long Branch','Stonegate-Queensway'],
'York South—Weston—Etobicoke':['Weston','Mount Dennis','Rockcliffe-Smythe'],
'Spadina—Harbourfront':['Waterfront/Island','Bay Street Corridor'],
'Toronto Centre':['Church-Yonge','Moss Park/RegentPark','North St James Town','Cabbagetown'],
'Toronto—Danforth':['Playter/Danforth','Riverdale','Broadview North'],
"Toronto—St. Paul's":['Yonge-St Clair','Humewood-Cedarvale','Forest Hill N','Casa Loma'],
'University—Rosedale':['University/Annex','Rosedale','Bay Street Corridor','Moore Park'],
'Davenport':['Dovercourt/Junction','Oakwood-Vaughan','Caledonia-Fairbank'],
"Taiaiako'n—Parkdale—High Park":['HighPark N/Junction','HighPark-Swansea','SParkdale/KingW','Roncesvalles'],
'Dufferin—Caledon':['Orangeville/Mono'],
'Beaches—East York':['The Beaches','EastEnd-Danforth','Woodbine Corridor','OConnor-Parkview'],
# Montreal
'Ville-Marie—Le Sud-Ouest—Île-des-Soeurs':['Ville-Marie','South West Mtl','Ile-des-Soeurs'],
'Laurier—Sainte-Marie':['Plateau','East Ville-Marie'],'Rosemont—La Petite-Patrie':['Rosemont/PetitePatrie'],
'Hochelaga—Rosemont-Est':['Hochelaga-Maisonneuve','Rosemont/PetitePatrie'],'Papineau':['Villeray','Parc-Extension'],
'Outremont':['Outremont','Mont-Royal'],'Mount Royal':['Mont-Royal','Cote-des-Neiges'],
'Notre-Dame-de-Grâce—Westmount':['NDG','Westmount'],'LaSalle—Émard—Verdun':['LaSalle','Verdun'],
'Dorval—Lachine—LaSalle':['Dorval','Lachine','LaSalle'],'Saint-Laurent':['Saint-Laurent'],
'Saint-Léonard—Saint-Michel':['Saint-Leonard'],'Ahuntsic-Cartierville':['Ahuntsic','Cartierville'],
'Bourassa':['Montreal-Nord'],'Honoré-Mercier':['Anjou','Pointe-aux-Trembles'],
'La Pointe-de-l’Île':['Pointe-aux-Trembles'],'Pierrefonds—Dollard':['Dollard-des-Ormeaux','Roxboro-Pierrefonds'],
'Lac-Saint-Louis':['Pointe-Claire','Dorval'],'Laval—Les Îles':['Chomedey','Laval-Ouest'],
'Vimy':['Laval-des-Rapides','Pont-Viau'],'Marc-Aurèle-Fortin':['Fabreville','Sainte-Rose'],
'Alfred-Pellan':['Saint-Francois','Saint-Vincent-de-Paul'],'Thérèse-De Blainville':['Sainte-Therese','Boisbriand'],
'Rivière-des-Mille-Îles':['Deux-Montagnes','Saint-Eustache'],'Mirabel':['Mirabel'],
'Terrebonne':['Terrebonne','Lachenaie'],'Repentigny':['Repentigny'],'Montcalm':['Saint-Lin'],
'Longueuil—Charles-LeMoyne':['Longueuil','Greenfield Park'],'Longueuil—Saint-Hubert':['Saint-Hubert','Longueuil'],
'Brossard—Saint-Lambert':['Brossard','Saint-Lambert'],'Beloeil—Chambly':['Beloeil','Mont-Saint-Hilaire'],
'Pierre-Boucher—Les Patriotes—Verchères':['Varennes','Sainte-Julie'],
'La Prairie—Atateken':['La Prairie','Candiac','Saint-Constant'],
'Châteauguay—Les Jardins-de-Napierville':['Chateauguay'],'Saint-Jean':['Saint-Jean'],
'Vaudreuil':['Vaudreuil-Dorion','Ile-Perrot'],
# Calgary
'Calgary Centre':['Cal DT/EauClaire','Cal Beltline','Cal Bridgeland','Cal CrescentHts'],
'Calgary Confederation':['Cal CapitolHill','Cal Varsity','Cal Montgomery','Cal WinstonHts'],
'Calgary Nose Hill':['Cal Huntington','Cal Edgemont'],'Calgary Crowfoot':['Cal Ranchlands','Cal Edgemont'],
'Calgary Skyview':['Cal SkyviewNE'],'Calgary McKnight':['Cal SkyviewNE','Cal Marlborough'],
'Calgary East':['Cal ForestLawn','Cal Dover','Cal Marlborough'],
'Calgary Heritage':['Cal Braeside','Cal WillowPark','Cal NorthGlenmore'],
'Calgary Midnapore':['Cal Midnapore'],'Calgary Shepard':['Cal McKenzieTowne'],
'Calgary Signal Hill':['Cal WestSprings','Cal Wildwood','Cal Glenbrook'],
'Airdrie—Cochrane':['Cal Airdrie','Cal Cochrane'],
# Edmonton
'Edmonton Centre':['Edm Downtown','Edm Oliver','Edm CentralMcDougall','Edm QueenMaryPark','Edm McCauley'],
'Edmonton Griesbach':['Edm Northmount','Edm NorthCentralW','Edm Delton','Edm Londonderry'],
'Edmonton Manning':['Edm Clairview','Edm EastCastleDowns','Edm Londonderry','Edm NorthEast'],
'Edmonton Northwest':['Edm WestCastledowns','Edm NorthCentralW','Edm Callingwood'],
'Edmonton West':['Edm WestJasperPlace','Edm NorthJasperPlace','Edm Callingwood'],
'Edmonton Gateway':['Edm GatewayBlvdW','Edm Southgate','Edm CentralSW'],
'Edmonton Riverbend':['Edm Riverbend','Edm Terwillegar'],
'Edmonton Southeast':['Edm CentralMillwoods','Edm SouthMillwoods'],
'Edmonton Strathcona':['Edm Garneau','Edm University','Edm Strathearn','Edm BonnyDoon'],
'Sherwood Park—Fort Saskatchewan':['Edm SherwoodPark','Edm FortSask'],
'St. Albert—Sturgeon River':['Edm StAlbert'],'Leduc—Wetaskiwin':['Edm Leduc'],'Parkland':['Edm SpruceGrove'],
# Ottawa
'Ottawa Centre':['Ott Downtown','Ott Chinatown/Hintonburg','Ott Glebe','Ott SandyHill','Ott Lowertown','Ott WestCentretown'],
'Ottawa South':['Ott AltaVista','Ott HuntClub','Ott OldOttawaS'],
'Ottawa West—Nepean':['Ott Knoxdale/Merivale','Ott Iris/Queensway','Ott Britannia','Ott Bayshore'],
'Ottawa—Vanier—Gloucester':['Ott Vanier','Ott Overbrook','Ott BeaconHill','Ott NewEdinburgh'],
'Nepean':['Ott Knoxdale/Merivale'],'Kanata':['Ott Kanata/Stittsville'],
'Orléans':['Ott EasternOrleans','Ott GloucesterOrleans'],
'Prescott—Russell—Cumberland':['Ott ClarenceRockland','Ott GloucesterOrleans'],
# Kitchener-Cambridge-Waterloo
'Kitchener Centre':['KW KitCentral','KW KitSouthCentral'],
'Kitchener South—Hespeler':['KW KitSouthEast','KW KitSouthWest'],
'Kitchener—Conestoga':['KW KitNorthWest','KW Woolwich'],
'Waterloo':['KW WaterlooUptown','KW WaterlooUniv','KW WaterlooNE','KW WaterlooNW'],
'Cambridge':['KW GaltEast','KW GaltWest','KW PrestonOutside'],
}

# CMHC Licence Agreement for the Use of Data requires this acknowledgement for adapted data.
CITE = ('Adapted from Canada Mortgage and Housing Corporation, Rental Market Survey (October 2025); '
        'via the Housing Market Information Portal. This does not constitute an endorsement by CMHC of this product.')
CITE_DIRECT = ('Source: Canada Mortgage and Housing Corporation, Rental Market Survey 2025 '
        '(Statistics Canada table 34-10-0133-01), reproduced under the CMHC Licence Agreement for the Use of Data.')
out, counts = [], {'neighbourhood':0,'cma':0,'exact':0,'withheld':0}
for r in ridings:
    fed, name = r['fed_num'], r['name']
    a = assign[fed]; d = a['rent_distance_km']; metro = a['rent_metro']; cma = a['rent_1br_cad']
    if name in MAP:
        vals = [NB[z] for z in MAP[name] if z in NB]
        rent = round(sum(vals)/len(vals)); tier='neighbourhood'
        src = f"CMHC 2025 average 1-bedroom rent for the {', '.join(MAP[name])} neighbourhood(s) in {metro.split(',')[0]}: {CITE}."
    elif d > WITHHOLD_KM:
        rent=None; tier='withheld'
        src=f"No CMHC survey represents this riding; nearest surveyed centre ({metro}) is {round(d)} km away. No figure shown."
    elif d == 0:
        rent=cma; tier='exact'
        src=f"CMHC 2025 average 1-bedroom rent for {metro}; this riding contains the surveyed centre. {CITE_DIRECT}"
    else:
        rent=cma; tier='cma'
        src=f"CMHC 2025 average 1-bedroom rent for {metro}; nearest surveyed centre, {round(d,1)} km away (metro-area value, neighbourhood breakdown pending). {CITE_DIRECT}"
    counts[tier]+=1
    out.append({'fed_num':fed,'riding_name':name,'province':r['province'],'median_rent_1br_cad':rent,
                'rent_confidence':tier,'rent_metro':metro,'rent_distance_km':d,'rent_data_source':src})

# --- Census-indexed differentiation for multi-riding metro groups ---
# Ridings that share ONE CMHC CMA value (tier exact/cma) still smear that single number.
# Give each a distinct, real-data-grounded estimate: take the riding's REAL 2021 Census
# median renter shelter cost (its spatial signal) and re-base the group so its mean lands
# exactly on the REAL 2025 CMHC 1BR figure for that metro. Both inputs are real government
# data; nothing is invented. The measured metro level is preserved; real per-riding pattern
# is added. Solo-riding metros keep the direct measured CMHC value (nothing to differentiate).
groups = defaultdict(list)
for o in out:
    if o['rent_confidence'] in ('exact', 'cma'):
        groups[o['rent_metro']].append(o)
for metro, rows in groups.items():
    if len(rows) < 2:
        continue
    # Saskatchewan: census all-unit shelter cost is a poor proxy for 1BR here (it
    # over-states family-suburb ridings) and there is no CMHC neighbourhood breakdown
    # to correct it, so re-basing inflated the urban Regina/Saskatoon ridings above the
    # real city average. Show the real measured CMHC metro 1BR average directly instead.
    if 'Saskatchewan' in metro:
        continue
    cmhc = rows[0]['median_rent_1br_cad']            # shared CMA value (identical across the group)
    pat = {o['fed_num']: census[str(o['fed_num'])]['median_rent_2021'] for o in rows}
    mavg = sum(pat.values()) / len(pat)
    n = len(rows)
    short = metro.split(',')[0]
    for o in rows:
        c = pat[o['fed_num']]
        o['median_rent_1br_cad'] = round(cmhc * c / mavg)
        o['rent_confidence'] = 'estimated'
        o['rent_data_source'] = (
            f"Estimated 1-bedroom rent for this riding: its 2021 Census median renter shelter "
            f"cost (${c:,.0f}/mo) scaled to the 2025 CMHC average 1-bedroom rent for {short} "
            f"(${cmhc:,}); the {n} ridings nearest this CMHC centre average to the CMHC figure. "
            f"Real-data estimate combining {CITE_CENSUS} and {CITE_CMHC_TBL}.")

json.dump(out, open(f'{HERE}/rent-final.json','w'), ensure_ascii=False, indent=2)
counts = Counter(o['rent_confidence'] for o in out)
shown=[o['median_rent_1br_cad'] for o in out if o['median_rent_1br_cad'] is not None]
print(f"wrote {len(out)} ridings -> rent-final.json")
print(f"  tiers: {dict(counts)}")
print(f"  shown {len(shown)} ridings, distinct values {len(set(shown))}, min ${min(shown)} max ${max(shown)} mean ${sum(shown)/len(shown):.0f}")
# any remaining metro still sharing one number (should be none among 2+ groups)
smear=Counter(o['rent_metro'].split(',')[0] for o in out if o['rent_confidence'] in ('exact','cma'))
multi_smear={m:n for m,n in smear.items() if n>1}
print("  metros still on a single shared number (2+ ridings):", multi_smear or "none")
