'use client'

import { supabase } from '@/lib/supabase'
import { estimateMonthlyTakeHome } from '@/lib/canada-tax'
import NavBar from '@/app/components/NavBar'
import { useEffect, useRef, useState, useMemo } from 'react'
import * as d3 from 'd3'
import { feature as topoFeature } from 'topojson-client'
import { Search } from 'lucide-react'

type City = {
  city: string
  country: string | null
  region: string | null
  flag: string | null
  latitude: number | null
  longitude: number | null
  population: string | null
  blurb: string | null
  price_cad: number | null
  price_source: string | null // representing political party
  price_updated_at: string | null
  confidence_score: number | null
  median_rent_1br_cad: number | null
  median_monthly_salary_cad: number | null
  safety_index: number | null
  tech_salary_cad: number | null
  rent_data_source: string | null
}

const PROVINCE_NAMES: Record<string, string> = {
  ON: 'Ontario',
  BC: 'British Columbia',
  QC: 'Quebec',
  AB: 'Alberta',
  MB: 'Manitoba',
  SK: 'Saskatchewan',
  NS: 'Nova Scotia',
  NB: 'New Brunswick',
  NL: 'Newfoundland & Labrador',
  PE: 'Prince Edward Island',
  YT: 'Yukon',
  NT: 'Northwest Territories',
  NU: 'Nunavut'
}

const PROVINCE_TO_ABBR: Record<string, string> = {
  'Quebec': 'QC',
  'Newfoundland and Labrador': 'NL',
  'British Columbia': 'BC',
  'Nunavut': 'NU',
  'Northwest Territories': 'NT',
  'New Brunswick': 'NB',
  'Nova Scotia': 'NS',
  'Saskatchewan': 'SK',
  'Alberta': 'AB',
  'Prince Edward Island': 'PE',
  'Yukon Territory': 'YT',
  'Yukon': 'YT',
  'Manitoba': 'MB',
  'Ontario': 'ON'
}

export default function Explore() {
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef  = useRef<SVGGElement>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)

  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [expanded, setExpanded]         = useState(false)
  const [cities, setCities]             = useState<City[]>([])
  const [loadingCities, setLoadingCities] = useState(true)
  const [isMobile, setIsMobile]         = useState(false)
  const [ridingsTopo, setRidingsTopo]   = useState<any>(null)

  // Filters State
  const [rentBurdenMax, setRentBurdenMax] = useState(100)
  const [provinceFilter, setProvinceFilter] = useState('All')

  // Tooltip & Search State
  const [hoveredCity, setHoveredCity] = useState<City | null>(null)
  const [hoveredProvince, setHoveredProvince] = useState<{ name: string; abbr: string } | null>(null)
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [colorMode, setColorMode] = useState<'party' | 'burden'>('party')
  const [profile, setProfile] = useState<'single_renter' | 'family_homeowner'>('single_renter')
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const cvt = (cad: number) => `CA$${cad.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const legendTiers = useMemo(() => {
    if (colorMode === 'party') {
      return [
        { color: 'rgba(229, 57, 53, 0.75)', label: 'Liberal Party' },
        { color: 'rgba(13, 71, 161, 0.75)', label: 'Conservative Party' },
        { color: 'rgba(255, 152, 0, 0.75)', label: 'New Democratic Party (NDP)' },
        { color: 'rgba(41, 182, 246, 0.75)', label: 'Bloc Québécois' },
        { color: 'rgba(76, 175, 80, 0.75)', label: 'Green Party' },
        { color: 'rgba(255, 255, 255, 0.75)', label: 'Independent' }
      ]
    } else {
      return [
        { color: 'rgba(76, 175, 80, 0.75)', label: 'Affordable (≤ 30% burden)' },
        { color: 'rgba(139, 195, 74, 0.75)', label: 'Moderate (31% - 40%)' },
        { color: 'rgba(255, 152, 0, 0.75)', label: 'High (41% - 50%)' },
        { color: 'rgba(229, 57, 53, 0.75)', label: 'Severe (> 50% burden)' }
      ]
    }
  }, [colorMode])

  const provincesList = useMemo(() => {
    const seen = new Set<string>()
    cities.forEach(c => { if (c.region) seen.add(c.region) })
    return ['All', ...Array.from(seen).sort()]
  }, [cities])

  const provinceMetrics = useMemo(() => {
    const metrics: Record<string, { pluralityParty: string; avgBurden: number | null; partyColor: string }> = {}
    const grouped: Record<string, City[]> = {}
    cities.forEach(c => {
      if (c.region) {
        if (!grouped[c.region]) grouped[c.region] = []
        grouped[c.region].push(c)
      }
    })
    
    const partyColorFn = (party: string | null) => {
      const p = party?.toLowerCase() || ''
      if (p.includes('liberal')) return '#E53935'
      if (p.includes('conservative')) return '#0D47A1'
      if (p.includes('ndp') || p.includes('new democratic')) return '#FF9800'
      if (p.includes('bloc') || p.includes('québécois')) return '#29B6F6'
      if (p.includes('green')) return '#4CAF50'
      if (p.includes('independent')) return '#FFFFFF'
      return '#888888'
    }

    Object.entries(grouped).forEach(([region, list]) => {
      const partyCounts: Record<string, number> = {}
      list.forEach(c => {
        const p = c.price_source || 'Unknown'
        partyCounts[p] = (partyCounts[p] || 0) + 1
      })
      let pluralityParty = 'Unknown'
      let maxCount = 0
      Object.entries(partyCounts).forEach(([p, count]) => {
        if (count > maxCount) {
          maxCount = count
          pluralityParty = p
        }
      })
      
      let sumBurden = 0
      let validCount = 0
      list.forEach(c => {
        const isSingle = profile === 'single_renter'
        const rent = isSingle
          ? (c.median_rent_1br_cad != null ? Number(c.median_rent_1br_cad) : null)
          : (c.median_rent_1br_cad != null ? Number(c.median_rent_1br_cad) * 1.65 : null)
          
        const salary = isSingle
          ? (c.median_monthly_salary_cad != null ? Number(c.median_monthly_salary_cad) : null)
          : (c.tech_salary_cad != null ? Number(c.tech_salary_cad) : c.median_monthly_salary_cad != null ? Number(c.median_monthly_salary_cad) * 1.5 : null)

        if (rent && salary) {
          sumBurden += Math.round((rent / salary) * 100)
          validCount++
        }
      })
      const avgBurden = validCount > 0 ? Math.round(sumBurden / validCount) : null

      metrics[region] = {
        pluralityParty,
        avgBurden,
        partyColor: partyColorFn(pluralityParty)
      }
    })
    return metrics
  }, [cities, profile])

  const filteredCities = useMemo(() => {
    return cities.filter(city => {
      const rent = city.median_rent_1br_cad
      const salary = city.median_monthly_salary_cad
      const burden = rent && salary ? (rent / salary) * 100 : null
      
      const matchRent = burden === null || burden <= rentBurdenMax
      const matchProvince = provinceFilter === 'All' || city.region === provinceFilter
      
      return matchRent && matchProvince
    })
  }, [cities, rentBurdenMax, provinceFilter])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Real federal riding boundaries (2023 Representation Order), loaded once
  useEffect(() => {
    d3.json('/ridings.json').then((t: any) => setRidingsTopo(t))
  }, [])

  const ridingFeatures = useMemo(() => {
    if (!ridingsTopo) return []
    const objKey = Object.keys(ridingsTopo.objects)[0]
    return (topoFeature(ridingsTopo, ridingsTopo.objects[objKey]) as any).features
  }, [ridingsTopo])

  useEffect(() => {
    async function fetchCities() {
      setLoadingCities(true)
      const { data, error } = await supabase
        .from('cities')
        .select(`
          city, country, region, flag, latitude, longitude,
          population, blurb, price_cad,
          price_source, price_updated_at, confidence_score,
          median_rent_1br_cad, median_monthly_salary_cad,
          safety_index, tech_salary_cad, rent_data_source
        `)
        .order('city', { ascending: true })

      if (error) { setLoadingCities(false); return }
      setCities(
        (data ?? []).filter(c =>
          c.latitude != null && c.longitude != null &&
          Number.isFinite(Number(c.latitude)) && Number.isFinite(Number(c.longitude))
        ) as City[]
      )
      setLoadingCities(false)
    }
    fetchCities()
  }, [])

  // In-memory Rankings inside Canada
  const ranks = useMemo(() => {
    const burdenSorted = [...cities]
      .filter(c => c.median_rent_1br_cad != null && c.median_monthly_salary_cad != null && c.median_monthly_salary_cad > 0)
      .sort((a, b) => {
        const burdenA = (a.median_rent_1br_cad ?? 0) / (a.median_monthly_salary_cad ?? 1)
        const burdenB = (b.median_rent_1br_cad ?? 0) / (b.median_monthly_salary_cad ?? 1)
        return burdenA - burdenB
      })

    const leftover = (c: City) => {
      const takeHome = estimateMonthlyTakeHome(c.median_monthly_salary_cad, c.region)
      return takeHome == null ? -Infinity : takeHome - (c.median_rent_1br_cad ?? 0)
    }
    const leftoverSorted = [...cities]
      .filter(c => c.median_rent_1br_cad != null && c.median_monthly_salary_cad != null)
      .sort((a, b) => leftover(b) - leftover(a))

    const burdenRankMap: Record<string, number> = {}
    burdenSorted.forEach((c, idx) => { burdenRankMap[c.city] = idx + 1 })

    const leftoverRankMap: Record<string, number> = {}
    leftoverSorted.forEach((c, idx) => { leftoverRankMap[c.city] = idx + 1 })

    return {
      burdenRank: burdenRankMap,
      leftoverRank: leftoverRankMap,
      totalBurdenCount: burdenSorted.length,
      totalLeftoverCount: leftoverSorted.length,
    }
  }, [cities])

  const suggestions = useMemo(() => {
    if (!searchQuery) return []
    const q = searchQuery.toLowerCase()
    return cities.filter(c => c.city.toLowerCase().includes(q) || (PROVINCE_NAMES[c.region ?? ''] ?? '').toLowerCase().includes(q))
  }, [searchQuery, cities])

  // Programmatic travel transition
  const zoomToCity = (city: City) => {
    setSelectedProvince(city.region ?? null)
    setSelectedCity(city)
    setSearchQuery('')
    setShowSuggestions(false)
  }

  const handleAddressSearch = async (query: string) => {
    const raw = query.trim()
    if (!raw) return
    setIsGeocoding(true)
    setGeoError(null)
    try {
      // Canadian postal code shapes: full "A1A 1A1" or just the FSA "A1A".
      const compact = raw.replace(/\s+/g, '').toUpperCase()
      const isFullPostal = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/.test(compact)
      const isFsa = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]$/.test(compact)

      let lat: number | null = null
      let lon: number | null = null

      if (isFullPostal || isFsa) {
        const fsa = compact.substring(0, 3)
        try {
          const zRes = await fetch(`https://api.zippopotam.us/ca/${fsa}`)
          if (zRes.ok) {
            const zData = await zRes.json()
            const place = zData.places?.[0]
            if (place && place.latitude && place.longitude) {
              lat = parseFloat(place.latitude)
              lon = parseFloat(place.longitude)
            }
          }
        } catch (err) {
          console.warn('Zippopotam lookup failed, falling back to OSM:', err)
        }
      }

      if (lat === null || lon === null) {
        // Free-text search resolves full postal codes, FSAs and place names alike
        // (OSM's structured postalcode= param returns nothing for full Canadian
        // codes). countrycodes=ca stops a weak match from wandering to another
        // country; addressdetails lets us verify the hit is actually in Canada.
        const url =
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1` +
          `&countrycodes=ca&limit=1&q=${encodeURIComponent(raw + ', Canada')}`

        const res = await fetch(url)
        const data = await res.json()
        const hit = Array.isArray(data) ? data[0] : null

        // Reject anything OSM couldn't place inside Canada rather than silently
        // zooming to a wrong location (the old behaviour: a bad postal match in
        // Toronto could land the map in Newfoundland).
        if (!hit || hit.address?.country_code !== 'ca') {
          setGeoError(
            (isFullPostal || isFsa)
              ? `Couldn't locate postal code "${raw}". Try the first 3 characters or a community name.`
              : `Couldn't find "${raw}" in Canada. Try a community name or postal code.`
          )
          return
        }

        lat = parseFloat(hit.lat)
        lon = parseFloat(hit.lon)
      }

      // Nearest surveyed community. Scale longitude by cos(latitude) so the
      // distance is geographically correct at Canadian latitudes (a degree of
      // longitude is much shorter than a degree of latitude up here).
      const kx = Math.cos((lat * Math.PI) / 180)
      let closest: City | null = null
      let minDist = Infinity
      cities.forEach(c => {
        if (c.latitude != null && c.longitude != null) {
          const dist = Math.hypot(c.latitude - lat, (c.longitude - lon) * kx)
          if (dist < minDist) {
            minDist = dist
            closest = c
          }
        }
      })

      if (closest) {
        zoomToCity(closest)
      } else {
        setGeoError('No surveyed community is available near that location yet.')
      }
    } catch (e) {
      console.error('Geocoding error:', e)
      setGeoError('Search failed — please try again.')
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleZoomIn = () => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 1.5)
  }

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 1 / 1.5)
  }

  const resetZoom = () => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity)
  }

  useEffect(() => {
    if (!svgRef.current || !gRef.current || !ridingFeatures.length) return
    const W = 800, H = 450
    const svg = d3.select(svgRef.current)
    const g   = d3.select(gRef.current)
    svg.selectAll('defs').remove()
    g.selectAll('*').remove()

    const projection = d3.geoConicConformal()
      .rotate([96, 0])
      .parallels([49, 77])

    const pathGen = d3.geoPath().projection(projection)

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 30])
      .translateExtent([[-W, -H], [W * 2, H * 2]])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
        g.selectAll('path')
          .attr('stroke-width', 0.6 / event.transform.k)
      })

    svg.call(zoom)
    zoomRef.current = zoom
    // Stroke widths are set in the g's local (pre-zoom) coordinate space, so any
    // absolute value gets multiplied by the current zoom scale on screen. Dividing
    // by k keeps borders a constant, thin screen-space width at every zoom level,
    // otherwise hover/selection highlights balloon into huge blobs on small, densely
    // packed ridings once the user has zoomed in.
    const currentK = () => d3.zoomTransform(svgRef.current!).k

    const defs = svg.append('defs')

    const shadowFilter = defs.append('filter')
      .attr('id', 'landShadow')
      .attr('x', '-10%').attr('y', '-10%')
      .attr('width', '120%').attr('height', '120%')

    shadowFilter.append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '1')
      .attr('stdDeviation', '1.5')
      .attr('flood-color', '#000')
      .attr('flood-opacity', '0.10')

    // Ocean rect
    g.append('rect')
      .attr('width', W)
      .attr('height', H)
      .style('fill', 'var(--color-surface-2)')

    // Load Canada GeoJSON
    d3.json('/canada.geojson').then((canada: any) => {
      // Fit the projection so the full country (incl. southern Ontario/BC) is
      // guaranteed to sit inside the viewBox instead of overflowing a hardcoded scale
      const pad = 16
      projection.fitExtent([[pad, pad], [W - pad, H - pad]], { type: 'FeatureCollection', features: canada.features } as any)

      // Create clip path for Canada land mass to keep boundaries on land
      const clip = defs.append('clipPath').attr('id', 'canada-clip')
      clip.selectAll('path')
        .data(canada.features)
        .enter()
        .append('path')
        .attr('d', pathGen as any)

      // If we have selectedProvince, create a clip-path for that province
      if (selectedProvince) {
        const provFeature = canada.features.find((f: any) => PROVINCE_TO_ABBR[f.properties.name] === selectedProvince)
        if (provFeature) {
          const pClip = defs.append('clipPath').attr('id', 'province-clip')
          pClip.append('path')
            .attr('d', pathGen(provFeature) as string)
        }
      }

      // Draw Canada Provinces
      g.append('g')
        .selectAll('path')
        .data(canada.features)
        .enter()
        .append('path')
        .attr('d', pathGen as any)
        .attr('fill', (d: any) => {
          const abbr = PROVINCE_TO_ABBR[d.properties.name]
          
          if (selectedProvince && selectedProvince !== abbr) {
            return 'rgba(226, 211, 184, 0.75)'
          }
          
          const m = provinceMetrics[abbr]
          if (!m) return 'rgba(128, 128, 128, 0.15)'
          if (colorMode === 'party') {
            return m.partyColor + '44'
          } else {
            if (m.avgBurden === null) return 'rgba(128, 128, 128, 0.15)'
            if (m.avgBurden <= 30) return 'rgba(76, 175, 80, 0.4)'
            if (m.avgBurden <= 40) return 'rgba(139, 195, 74, 0.4)'
            if (m.avgBurden <= 50) return 'rgba(255, 152, 0, 0.4)'
            return 'rgba(229, 57, 53, 0.4)'
          }
        })
        .attr('stroke', 'var(--color-border)')
        .attr('stroke-width', (d: any) => {
          const abbr = PROVINCE_TO_ABBR[d.properties.name]
          return (selectedProvince === abbr ? 1.4 : 0.6) / currentK()
        })
        .style('cursor', selectedProvince ? 'default' : 'pointer')
        .on('click', (event, d: any) => {
          const abbr = PROVINCE_TO_ABBR[d.properties.name]
          if (!selectedProvince) {
            setSelectedProvince(abbr)
            setHoveredProvince(null)
          }
        })
        .on('mouseover', (event, d: any) => {
          const abbr = PROVINCE_TO_ABBR[d.properties.name]
          if (!selectedProvince) {
            setHoveredProvince({ name: d.properties.name, abbr })
            setTooltipPos({ x: event.clientX, y: event.clientY })
            d3.select(event.currentTarget)
              .attr('stroke', 'var(--color-text-1)')
              .attr('stroke-width', 1.0 / currentK())
          }
        })
        .on('mousemove', (event) => {
          if (!selectedProvince) {
            setTooltipPos({ x: event.clientX, y: event.clientY })
          }
        })
        .on('mouseleave', (event, d: any) => {
          setHoveredProvince(null)
          d3.select(event.currentTarget)
            .attr('stroke', 'var(--color-border)')
            .attr('stroke-width', 0.6 / currentK())
        })

      // Draw real federal riding boundaries (2023 Representation Order)
      const cityByName = new Map(filteredCities.map(c => [c.city, c]))
      const ridingFeaturesWithCity = ridingFeatures
        .map((f: any) => ({ feature: f, city: cityByName.get(f.properties.name) }))
        .filter((d: any) => d.city)

      g.append('g')
        .attr('clip-path', selectedProvince ? 'url(#province-clip)' : 'url(#canada-clip)')
        .selectAll('path')
        .data(ridingFeaturesWithCity)
        .enter()
        .append('path')
        .attr('d', (d: any) => pathGen(d.feature))
        .attr('display', (d: any) => {
          if (!selectedProvince) return 'none'
          return d.city.region === selectedProvince ? 'block' : 'none'
        })
        .attr('fill', (d: any) => {
          if (colorMode === 'party') {
            const party = d.city.price_source?.toLowerCase() || ''
            if (party.includes('liberal')) return 'rgba(229, 57, 53, 0.35)'
            if (party.includes('conservative')) return 'rgba(13, 71, 161, 0.35)'
            if (party.includes('ndp')) return 'rgba(255, 152, 0, 0.35)'
            if (party.includes('bloc')) return 'rgba(41, 182, 246, 0.35)'
            if (party.includes('green')) return 'rgba(76, 175, 80, 0.35)'
            if (party.includes('independent')) return 'rgba(255, 255, 255, 0.35)'
            return 'rgba(128, 128, 128, 0.2)'
          } else {
            const burden = rentBurden(d.city)
            if (burden === null) return 'rgba(128, 128, 128, 0.2)'
            if (burden <= 30) return 'rgba(76, 175, 80, 0.4)'
            if (burden <= 40) return 'rgba(139, 195, 74, 0.4)'
            if (burden <= 50) return 'rgba(255, 152, 0, 0.4)'
            return 'rgba(229, 57, 53, 0.4)'
          }
        })
        .attr('stroke', 'rgba(46, 28, 16, 0.35)')
        .attr('stroke-width', () => 0.6 / currentK())
        .style('cursor', 'pointer')
        .attr('pointer-events', 'all')
        .on('click', (event, d: any) => {
          zoomToCity(d.city)
        })
        .on('mouseover', (event, d: any) => {
          setHoveredCity(d.city)
          setTooltipPos({ x: event.clientX, y: event.clientY })
          d3.select(event.currentTarget)
            .attr('stroke', 'var(--color-text-1)')
            .attr('stroke-width', 1.3 / currentK())
            .raise()
        })
        .on('mousemove', (event) => {
          setTooltipPos({ x: event.clientX, y: event.clientY })
        })
        .on('mouseleave', (event) => {
          setHoveredCity(null)
          d3.select(event.currentTarget)
            .attr('stroke', 'rgba(46, 28, 16, 0.35)')
            .attr('stroke-width', 0.6 / currentK())
        })

      // Declarative zoom transitions based on selectedProvince and selectedCity
      if (selectedCity) {
        const feature = ridingFeatures.find((f: any) => f.properties.name === selectedCity.city)
        if (feature) {
          const [[x0, y0], [x1, y1]] = pathGen.bounds(feature)
          const dx = x1 - x0
          const dy = y1 - y0
          const x = (x0 + x1) / 2
          const y = (y0 + y1) / 2
          // Fit bounds but with a maximum scale (e.g. 18) so it doesn't zoom in infinitely
          // and a minimum scale (e.g. 5.5) so it zooms in enough for small ridings.
          const scale = Math.max(5.5, Math.min(18, 0.7 / Math.max(dx / W, dy / H)))
          const targetTransform = d3.zoomIdentity
            .translate(W / 2 - x * scale, H / 2 - y * scale)
            .scale(scale)
          
          svg.transition()
            .duration(750)
            .call(zoom.transform, targetTransform)
        } else if (selectedCity.latitude != null && selectedCity.longitude != null) {
          const projected = projection([Number(selectedCity.longitude), Number(selectedCity.latitude)])
          if (projected) {
            const [x, y] = projected
            const scale = 8
            const targetTransform = d3.zoomIdentity
              .translate(W / 2 - x * scale, H / 2 - y * scale)
              .scale(scale)
            
            svg.transition()
              .duration(750)
              .call(zoom.transform, targetTransform)
          }
        }
      } else if (selectedProvince) {
        const provFeature = canada.features.find((f: any) => PROVINCE_TO_ABBR[f.properties.name] === selectedProvince)
        if (provFeature) {
          const [[x0, y0], [x1, y1]] = pathGen.bounds(provFeature)
          const dx = x1 - x0
          const dy = y1 - y0
          const x = (x0 + x1) / 2
          const y = (y0 + y1) / 2
          const scale = Math.max(1, Math.min(8, 0.85 / Math.max(dx / W, dy / H)))
          const targetTransform = d3.zoomIdentity
            .translate(W / 2 - x * scale, H / 2 - y * scale)
            .scale(scale)
          
          svg.transition()
            .duration(750)
            .call(zoom.transform, targetTransform)
        }
      } else {
        svg.transition()
          .duration(750)
          .call(zoom.transform, d3.zoomIdentity)
      }
    })
  }, [expanded, cities, isMobile, filteredCities, selectedCity, colorMode, profile, selectedProvince, provinceMetrics, ridingFeatures])

  const rentBurden = (city: City) => {
    const isSingle = profile === 'single_renter'
    const rent = isSingle
      ? (city.median_rent_1br_cad != null ? Number(city.median_rent_1br_cad) : null)
      : (city.median_rent_1br_cad != null ? Number(city.median_rent_1br_cad) * 1.65 : null)
      
    const salary = isSingle
      ? (city.median_monthly_salary_cad != null ? Number(city.median_monthly_salary_cad) : null)
      : (city.tech_salary_cad != null ? Number(city.tech_salary_cad) : city.median_monthly_salary_cad != null ? Number(city.median_monthly_salary_cad) * 1.5 : null)

    if (!rent || !salary) return null
    return Math.round((rent / salary) * 100)
  }

  return (
    <main style={{ fontFamily: 'var(--font-body)', background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text-1)', overflowX: 'hidden', WebkitTapHighlightColor: 'transparent' }}>

      {selectedCity && (
        <div onClick={() => setSelectedCity(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />
      )}

      {/* Floating Hover Tooltip */}
      {hoveredCity && (
        <div style={{
          position: 'fixed',
          left: tooltipPos.x + 15,
          top: tooltipPos.y - 15,
          zIndex: 1000,
          pointerEvents: 'none',
          background: 'var(--color-surface)',
          backdropFilter: 'blur(12px)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 12,
          padding: '10px 14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          color: 'var(--color-text-1)',
          minWidth: 180,
          transform: 'translate3d(0,0,0)',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>🇨🇦</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{hoveredCity.city}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginBottom: 2 }}>
            {PROVINCE_NAMES[hoveredCity.region ?? ''] || hoveredCity.region}, Canada
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, borderTop: '0.5px solid var(--color-border)', paddingTop: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-2)' }}>Represented by:</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-accent)' }}>
              {hoveredCity.price_source ?? 'Unknown'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--color-text-3)' }}>Rent Burden:</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-green)' }}>
              {rentBurden(hoveredCity) ? `${rentBurden(hoveredCity)}%` : 'Pending'}
            </span>
          </div>
        </div>
      )}

      {/* Floating Hover Province Tooltip */}
      {hoveredProvince && (
        <div style={{
          position: 'fixed',
          left: tooltipPos.x + 15,
          top: tooltipPos.y - 15,
          zIndex: 1000,
          pointerEvents: 'none',
          background: 'var(--color-surface)',
          backdropFilter: 'blur(12px)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 12,
          padding: '10px 14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          color: 'var(--color-text-1)',
          minWidth: 200,
          transform: 'translate3d(0,0,0)',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>🍁</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{hoveredProvince.name}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginBottom: 2 }}>
            Province-level Averages
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, borderTop: '0.5px solid var(--color-border)', paddingTop: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-2)' }}>Plurality Party:</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-accent)' }}>
              {provinceMetrics[hoveredProvince.abbr]?.pluralityParty ?? 'Unknown'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--color-text-3)' }}>Avg Rent Burden:</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-green)' }}>
              {provinceMetrics[hoveredProvince.abbr]?.avgBurden ? `${provinceMetrics[hoveredProvince.abbr].avgBurden}%` : 'N/A'}
            </span>
          </div>
          <div style={{ fontSize: 9.5, color: 'var(--color-accent)', marginTop: 8, fontStyle: 'italic', borderTop: '0.5px solid var(--color-border)', paddingTop: 4 }}>
            Click to explore federal ridings
          </div>
        </div>
      )}

      {/* Sliding Glass Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0,
        width: isMobile ? '100vw' : 390, maxWidth: '100vw',
        height: '100vh',
        background: 'var(--color-surface)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderLeft: isMobile ? 'none' : '0.5px solid var(--color-border)',
        zIndex: 100, overflowY: 'auto',
        transform: selectedCity ? 'translateX(0)' : isMobile ? 'translateX(100vw)' : 'translateX(420px)',
        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        padding: isMobile ? '1.5rem 1.25rem' : '2rem',
        boxSizing: 'border-box',
        boxShadow: selectedCity ? '-10px 0 40px rgba(0, 0, 0, 0.15)' : 'none',
      }}>
        {selectedCity && (() => {
          const burden = rentBurden(selectedCity)
          const provName = selectedCity.region ? PROVINCE_NAMES[selectedCity.region] || selectedCity.region : ''
          
          const isSingle = profile === 'single_renter'
          const rent = isSingle
            ? (selectedCity.median_rent_1br_cad != null ? Number(selectedCity.median_rent_1br_cad) : null)
            : (selectedCity.median_rent_1br_cad != null ? Number(selectedCity.median_rent_1br_cad) * 1.65 : null)
          const salary = isSingle
            ? (selectedCity.median_monthly_salary_cad != null ? Number(selectedCity.median_monthly_salary_cad) : null)
            : (selectedCity.tech_salary_cad != null ? Number(selectedCity.tech_salary_cad) : selectedCity.median_monthly_salary_cad != null ? Number(selectedCity.median_monthly_salary_cad) * 1.5 : null)

          const takeHomeMonthly = salary != null ? estimateMonthlyTakeHome(salary, selectedCity.region) : null
          const disposableVal = takeHomeMonthly != null && rent != null ? takeHomeMonthly - rent : null
          
          let rentDisclaimer = ''
          if (selectedCity.rent_data_source) {
            const parts = selectedCity.rent_data_source.split('; ')
            if (parts.length > 1) {
              const geoInfo = parts[1]
              const centreMatch = selectedCity.rent_data_source.match(/average one-bedroom rent for ([^(]+)/)
              if (centreMatch) {
                const centreName = centreMatch[1].trim().replace(/,\s*$/, '').split(',')[0]
                if (centreName.toLowerCase() !== selectedCity.city.toLowerCase()) {
                  rentDisclaimer = `Sourced from ${centreName} (${geoInfo.replace('nearest surveyed centre, ', '')})`
                }
              }
            }
          }

          let displayPopulation = selectedCity.population ? Number(selectedCity.population) : null
          let displayVoters: number | null = null
          try {
            if (selectedCity.population && selectedCity.population.startsWith('{')) {
              const parsed = JSON.parse(selectedCity.population)
              displayPopulation = Number(parsed.population)
              displayVoters = Number(parsed.registered_voters)
            }
          } catch (e) {}

          return (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>🇨🇦</div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, letterSpacing: -0.5, margin: 0, color: 'var(--color-text-1)', fontWeight: 400 }}>
                    {selectedCity.city}
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--color-text-3)', margin: '4px 0 0' }}>
                    {provName} · Canada
                    {displayPopulation ? ` · Pop. ${displayPopulation.toLocaleString()}` : ''}
                    {displayVoters ? ` (Voters: ${displayVoters.toLocaleString()})` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCity(null)}
                  style={{ background: 'none', border: '0.5px solid var(--color-border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-3)', fontFamily: 'var(--font-body)', flexShrink: 0 }}
                >
                  ✕
                </button>
              </div>

              {/* Political Party Representation Section */}
              <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-3)', margin: '0 0 0.5rem' }}>Represented party</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--color-accent)', margin: 0, lineHeight: 1 }}>
                  {selectedCity.price_source ?? 'Unknown'}
                </p>
              </div>

              {/* Ranks Cards Section */}
              <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-3)', margin: '0 0 0.75rem' }}>Affordability ranks</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {ranks.burdenRank[selectedCity.city] ? (
                    <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '8px', textAlign: 'center', border: '0.5px solid var(--color-border)' }}>
                      <p style={{ fontSize: 13, color: 'var(--color-text-3)', margin: '0 0 4px' }}>Rent burden</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--color-green)', margin: 0, fontWeight: 500 }}>
                        #{ranks.burdenRank[selectedCity.city]}
                      </p>
                      <p style={{ fontSize: 8, color: 'var(--color-text-4)', margin: '2px 0 0' }}>of {ranks.totalBurdenCount}</p>
                    </div>
                  ) : null}
                  {ranks.leftoverRank[selectedCity.city] ? (
                    <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '8px', textAlign: 'center', border: '0.5px solid var(--color-border)' }}>
                      <p style={{ fontSize: 13, color: 'var(--color-text-3)', margin: '0 0 4px' }}>After tax &amp; rent</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--color-accent)', margin: 0, fontWeight: 500 }}>
                        #{ranks.leftoverRank[selectedCity.city]}
                      </p>
                      <p style={{ fontSize: 8, color: 'var(--color-text-4)', margin: '2px 0 0' }}>of {ranks.totalLeftoverCount}</p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Economic stats */}
              <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-3)', margin: '0 0 0.75rem' }}>Local affordability</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{isSingle ? 'Median gross pay:' : 'Median gross pay (Family):'}</span>
                    <p style={{ fontSize: 15, margin: '2px 0 0', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                      {salary ? cvt(salary) : 'N/A'}<span style={{ fontSize: 10, color: 'var(--color-text-3)' }}>/mo</span>
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>Est. take-home:</span>
                    <p style={{ fontSize: 15, margin: '2px 0 0', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                      {takeHomeMonthly != null ? cvt(takeHomeMonthly) : 'N/A'}<span style={{ fontSize: 10, color: 'var(--color-text-3)' }}>/mo</span>
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{isSingle ? 'Median 1BR rent:' : 'Typical housing cost:'}</span>
                    <p style={{ fontSize: 15, margin: '2px 0 0', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                      {rent ? cvt(rent) : 'N/A'}<span style={{ fontSize: 10, color: 'var(--color-text-3)' }}>/mo</span>
                    </p>
                  </div>
                </div>

                {rentDisclaimer && (
                  <div style={{ fontSize: 9.5, color: 'var(--color-text-4)', lineHeight: 1.3, marginTop: -4, marginBottom: 12 }}>
                    ℹ️ {rentDisclaimer}
                  </div>
                )}

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: 'var(--color-text-3)' }}>Rent burden share:</span>
                    <span style={{ fontWeight: 600, color: burden && burden > 50 ? 'var(--color-red)' : burden && burden > 35 ? 'var(--color-accent)' : 'var(--color-green)' }}>{burden ? `${burden}%` : 'N/A'}</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: burden ? `${burden}%` : '0%', background: burden && burden > 50 ? 'var(--color-red)' : burden && burden > 35 ? 'var(--color-accent)' : 'var(--color-green)', borderRadius: 3 }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: 'var(--color-text-3)' }}>Left after tax &amp; rent:</span>
                    <span style={{ fontWeight: 600, color: disposableVal != null && disposableVal < 0 ? 'var(--color-red)' : 'var(--color-green)' }}>{disposableVal != null ? `${disposableVal < 0 ? '−' : ''}${cvt(Math.abs(disposableVal))}` : 'N/A'}</span>
                  </div>
                  <p style={{ fontSize: 9, color: 'var(--color-text-4)', margin: '2px 0 0', lineHeight: 1.4 }}>
                    Take-home est. after federal &amp; provincial tax, CPP &amp; EI ({isSingle ? 'single individual' : 'family estimation'}). Excludes provincial surtaxes &amp; health premiums.
                  </p>
                </div>
              </div>

              {/* Blurb */}
              {selectedCity.blurb && (
                <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6, margin: 0 }}>
                    {selectedCity.blurb}
                  </p>
                </div>
              )}

              <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <a href={`/cities/${selectedCity.city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} style={{ fontSize: 12.5, color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500 }}>
                  Detailed profile & stats →
                </a>
              </div>
            </>
          )
        })()}
      </div>

      {/* NavBar */}
      <NavBar active="explore" />

      {/* Main Map Area Container */}
      <div style={{ position: 'relative', width: '100vw', height: 'calc(100vh - 68px)', overflow: 'hidden' }}>
        
        {/* Dynamic Zooming Map */}
        {loadingCities && (
          <div style={{ position: 'absolute', inset: 0, background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            INITIALIZING MAP DATABASES...
          </div>
        )}

        <svg ref={svgRef} viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet" style={{ display: 'block', width: '100%', height: '100%', outline: 'none' }}>
          <g ref={gRef} />
        </svg>

        {selectedProvince && (
          <button
            onClick={() => {
              setSelectedProvince(null)
              resetZoom()
            }}
            style={{
              position: 'absolute',
              top: 20,
              left: isMobile ? 20 : 380,
              marginTop: isMobile ? 60 : 0,
              zIndex: 25,
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              borderRadius: 8,
              padding: '8px 12px',
              color: 'var(--color-text-1)',
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
            }}
          >
            🍁 Back to Canada Map
          </button>
        )}

        {/* Floating Search Controls */}
        <div style={{
          position: 'absolute', top: 20, left: 20, zIndex: 20,
          display: 'flex', flexDirection: 'column', gap: 10,
          width: isMobile ? 'calc(100vw - 40px)' : 340
        }}>
          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--color-surface)', backdropFilter: 'blur(16px)',
                border: '0.5px solid var(--color-border)', borderRadius: 10,
                padding: '8px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                flex: 1
              }}>
                <Search size={16} style={{ color: 'var(--color-text-3)' }} />
                <input
                  type="text"
                  placeholder={isGeocoding ? "Geocoding address..." : "Search community or postal code..."}
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value)
                    setShowSuggestions(true)
                    if (geoError) setGeoError(null)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleAddressSearch(searchQuery)
                    }
                  }}
                  style={{
                    background: 'none', border: 'none', color: 'var(--color-text-1)',
                    fontSize: 13.5, width: '100%', outline: 'none', fontFamily: 'var(--font-body)'
                  }}
                />
              </div>
              {isMobile && (
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  style={{
                    background: showMobileFilters ? 'var(--color-accent)' : 'var(--color-surface)',
                    color: showMobileFilters ? '#fff' : 'var(--color-text-1)',
                    border: '0.5px solid var(--color-border)',
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(16px)',
                    transition: 'all 0.2s',
                    fontFamily: 'var(--font-body)',
                    flexShrink: 0
                  }}
                >
                  ⚙️ {showMobileFilters ? 'Hide' : 'Filters'}
                </button>
              )}
            </div>
            {geoError && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6,
                background: 'var(--color-surface)', backdropFilter: 'blur(20px)',
                border: '0.5px solid var(--color-border)', borderRadius: 10,
                padding: '10px 14px', boxShadow: '0 12px 40px rgba(0,0,0,0.1)', zIndex: 31,
                fontSize: 12.5, color: 'var(--color-red)', fontFamily: 'var(--font-body)', lineHeight: 1.5
              }}>
                {geoError}
              </div>
            )}
            {!geoError && showSuggestions && (suggestions.length > 0 || searchQuery.trim() !== '') && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                marginTop: 6, background: 'var(--color-surface)',
                backdropFilter: 'blur(20px)', border: '0.5px solid var(--color-border)',
                borderRadius: 10, boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
                maxHeight: 280, overflowY: 'auto', zIndex: 30
              }}>
                {suggestions.map(c => (
                  <button
                    key={c.city}
                    onClick={() => zoomToCity(c)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', background: 'none', border: 'none',
                      textAlign: 'left', cursor: 'pointer', borderBottom: '0.5px solid var(--color-border)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <span style={{ fontSize: 16 }}>🇨🇦</span>
                    <div>
                      <span style={{ fontSize: 13, color: 'var(--color-text-1)', fontWeight: 500 }}>{c.city}</span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-3)', marginLeft: 8 }}>{PROVINCE_NAMES[c.region ?? ''] || c.region}</span>
                    </div>
                  </button>
                ))}
                {searchQuery.trim() !== '' && (
                  <button
                    onClick={() => handleAddressSearch(searchQuery)}
                    disabled={isGeocoding}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 14px', background: 'var(--color-surface-2)', border: 'none',
                      textAlign: 'left', cursor: 'pointer', borderTop: '0.5px solid var(--color-border)',
                      transition: 'background 0.2s', color: 'var(--color-accent)'
                    }}
                  >
                    <span style={{ fontSize: 12.5, fontWeight: 500, fontFamily: 'var(--font-body)' }}>
                      {isGeocoding ? '🔍 Geocoding address...' : `🔎 Search address/postal code: "${searchQuery}"`}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Filter Card */}
          {(!isMobile || showMobileFilters) && (
            <div style={{
              background: 'var(--color-surface)', backdropFilter: 'blur(16px)',
              border: '0.5px solid var(--color-border)', borderRadius: 10,
              padding: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              display: 'flex', flexDirection: 'column', gap: 12
            }}>
            {/* Expanded toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-1)' }}>Index controls</span>
              <button
                onClick={() => setExpanded(!expanded)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-1)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}
              >
                {expanded ? 'Hide filters' : 'Show filters'}
              </button>
            </div>

            {/* Always Visible stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '0.5px solid var(--color-border)', paddingTop: 10 }}>
              <div>
                <span style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Filtered ridings</span>
                <p style={{ fontSize: 16, margin: '2px 0 0', fontWeight: 500, color: 'var(--color-text-1)' }}>
                  {filteredCities.length} of {cities.length}
                </p>
              </div>
              <div>
                <span style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Avg rent burden</span>
                <p style={{ fontSize: 16, margin: '2px 0 0', fontWeight: 500, color: 'var(--color-accent)' }}>
                  {filteredCities.length > 0
                    ? `${Math.round(filteredCities.reduce((s, c) => s + (rentBurden(c) ?? 0), 0) / filteredCities.length)}%`
                    : 'N/A'
                  }
                </p>
              </div>
            </div>

            {/* Coloring Mode */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '0.5px solid var(--color-border)', paddingTop: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--color-text-3)', fontWeight: 600 }}>Map view mode</span>
              <div style={{ display: 'flex', background: 'var(--color-surface-2)', padding: 2, borderRadius: 8, border: '0.5px solid var(--color-border)' }}>
                <button
                  onClick={() => setColorMode('party')}
                  style={{
                    flex: 1, border: 'none', background: colorMode === 'party' ? 'var(--color-surface)' : 'none',
                    color: colorMode === 'party' ? 'var(--color-text-1)' : 'var(--color-text-3)',
                    padding: '5px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                    boxShadow: colorMode === 'party' ? '0 1px 4px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.2s', fontFamily: 'var(--font-body)'
                  }}
                >
                  Political Party
                </button>
                <button
                  onClick={() => setColorMode('burden')}
                  style={{
                    flex: 1, border: 'none', background: colorMode === 'burden' ? 'var(--color-surface)' : 'none',
                    color: colorMode === 'burden' ? 'var(--color-text-1)' : 'var(--color-text-3)',
                    padding: '5px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                    boxShadow: colorMode === 'burden' ? '0 1px 4px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.2s', fontFamily: 'var(--font-body)'
                  }}
                >
                  Housing Burden
                </button>
              </div>
            </div>

            {/* Living Profile Switcher */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--color-text-3)', fontWeight: 600 }}>Living profile</span>
              <div style={{ display: 'flex', background: 'var(--color-surface-2)', padding: 2, borderRadius: 8, border: '0.5px solid var(--color-border)' }}>
                <button
                  onClick={() => setProfile('single_renter')}
                  style={{
                    flex: 1, border: 'none', background: profile === 'single_renter' ? 'var(--color-surface)' : 'none',
                    color: profile === 'single_renter' ? 'var(--color-text-1)' : 'var(--color-text-3)',
                    padding: '5px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                    boxShadow: profile === 'single_renter' ? '0 1px 4px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.2s', fontFamily: 'var(--font-body)'
                  }}
                >
                  Single Renter
                </button>
                <button
                  onClick={() => setProfile('family_homeowner')}
                  style={{
                    flex: 1, border: 'none', background: profile === 'family_homeowner' ? 'var(--color-surface)' : 'none',
                    color: profile === 'family_homeowner' ? 'var(--color-text-1)' : 'var(--color-text-3)',
                    padding: '5px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                    boxShadow: profile === 'family_homeowner' ? '0 1px 4px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.2s', fontFamily: 'var(--font-body)'
                  }}
                >
                  Family Homeowner
                </button>
              </div>
            </div>

            {/* Filter controls */}
            {expanded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '0.5px solid var(--color-border)', paddingTop: 12, animation: 'fadeIn 0.2s ease-out' }}>
                {/* Max rent burden */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: 'var(--color-text-2)' }}>Max rent burden:</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{rentBurdenMax}%</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="100"
                    step="5"
                    value={rentBurdenMax}
                    onChange={e => setRentBurdenMax(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--color-accent)' }}
                  />
                </div>

                {/* Province Filter */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-2)', marginBottom: 5 }}>Province / Territory:</label>
                  <select
                    value={provinceFilter}
                    onChange={e => setProvinceFilter(e.target.value)}
                    style={{
                      width: '100%', background: 'var(--color-bg)', border: '0.5px solid var(--color-border)',
                      borderRadius: 6, padding: '6px 10px', color: 'var(--color-text-1)', fontSize: 13,
                      outline: 'none', fontFamily: 'var(--font-body)'
                    }}
                  >
                    {provincesList.map(prov => (
                      <option key={prov} value={prov} style={{ background: 'var(--color-bg)' }}>
                        {prov === 'All' ? 'All Canada' : PROVINCE_NAMES[prov] || prov}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
          )}
        </div>

        {/* Floating Map Utility Buttons (Zoom +/- Reset) */}
        <div style={{
          position: 'absolute', bottom: 20, right: 20, zIndex: 20,
          display: 'flex', flexDirection: 'column', gap: 6
        }}>
          <button onClick={handleZoomIn} style={{ width: 34, height: 34, background: 'var(--color-surface)', backdropFilter: 'blur(12px)', border: '0.5px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-1)', fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>+</button>
          <button onClick={handleZoomOut} style={{ width: 34, height: 34, background: 'var(--color-surface)', backdropFilter: 'blur(12px)', border: '0.5px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-1)', fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>−</button>
          <button onClick={resetZoom} style={{ width: 34, height: 34, background: 'var(--color-surface)', backdropFilter: 'blur(12px)', border: '0.5px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-2)', fontSize: 11, cursor: 'pointer' }}>Reset</button>
        </div>

        {/* Map Legend Overlay */}
        <div style={{
          position: 'absolute', bottom: 20, left: 20, zIndex: 20,
          background: 'var(--color-surface)', backdropFilter: 'blur(12px)',
          border: '0.5px solid var(--color-border)', borderRadius: 10,
          padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          display: 'flex', flexDirection: 'column', gap: 6
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-3)', marginBottom: 2 }}>Represented party</span>
          {legendTiers.map(tier => (
            <div key={tier.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: tier.color }} />
              <span style={{ fontSize: 11, color: 'var(--color-text-2)' }}>{tier.label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
