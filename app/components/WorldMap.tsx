'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import { supabase } from '@/lib/supabase'

export type MapCity = {
  city: string; country: string | null; region: string | null; flag: string | null
  latitude: number | null; longitude: number | null; population: string | null
  blurb: string | null; price_cad: number | null; price_source: string | null
  price_updated_at: string | null; confidence_score: number | null
  median_rent_1br_cad: number | null; median_monthly_salary_cad: number | null
}

export function dotColor(p: number | null): string {
  if (!p || p <= 0) return '#44443e'
  if (p < 5)  return '#3db870'
  if (p < 9)  return '#7fc05a'
  if (p < 14) return '#c4890f'
  if (p < 18) return '#d9682a'
  return '#c0392b'
}

export const LEGEND = [
  { color: '#3db870', label: '< CA$5' },
  { color: '#7fc05a', label: 'CA$5–9' },
  { color: '#c4890f', label: 'CA$9–14' },
  { color: '#d9682a', label: 'CA$14–18' },
  { color: '#c0392b', label: 'CA$18+' },
]

export interface WorldMapHandle { reset: () => void }

interface Props {
  onSelect: (c: MapCity | null) => void
  selected: MapCity | null
  mapH?: number
}

const WorldMap = forwardRef<WorldMapHandle, Props>(function WorldMap({ onSelect, selected, mapH = 380 }, ref) {
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef   = useRef<SVGGElement>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const [cities, setCities] = useState<MapCity[]>([])

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (svgRef.current && zoomRef.current)
        d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity)
    },
  }))

  useEffect(() => {
    supabase.from('cities')
      .select('city,country,region,flag,latitude,longitude,population,blurb,price_cad,price_source,price_updated_at,confidence_score,median_rent_1br_cad,median_monthly_salary_cad')
      .order('city', { ascending: true })
      .then(({ data }) => {
        if (data) setCities((data as MapCity[]).filter(c =>
          c.latitude != null && c.longitude != null &&
          Number.isFinite(+c.latitude!) && Number.isFinite(+c.longitude!)))
      })
  }, [])

  useEffect(() => {
    if (!svgRef.current || !gRef.current || cities.length === 0) return
    const W = 700, H = mapH
    const svg = d3.select(svgRef.current)
    const g   = d3.select(gRef.current)
    g.selectAll('*').remove()

    const proj = d3.geoNaturalEarth1().scale(115).translate([W / 2, H / 2 + 14])
    const path = d3.geoPath().projection(proj)

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 12])
      .on('zoom', ev => {
        g.attr('transform', ev.transform)
        const k = ev.transform.k
        g.selectAll<SVGCircleElement, unknown>('.cdot').attr('r', 6 / k).attr('stroke-width', 1.5 / k)
        g.selectAll<SVGTextElement, unknown>('.clbl')
          .attr('font-size', 9 / k).attr('opacity', k >= 3 ? 1 : 0)
          .attr('x', function() { return parseFloat(d3.select((this as Element).parentNode as Element).select('circle').attr('cx')) + 9 / k })
          .attr('y', function() { return parseFloat(d3.select((this as Element).parentNode as Element).select('circle').attr('cy')) + 3.5 / k })
      })
    zoomRef.current = zoom
    svg.call(zoom)

    g.append('rect').attr('width', W).attr('height', H).attr('fill', '#0b1510')

    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((world: unknown) => {
      const w = world as any
      g.append('g').selectAll('path')
        .data((topojson.feature(w, w.objects.countries) as unknown as { features: object[] }).features)
        .enter().append('path')
        .attr('d', path as unknown as string)
        .attr('fill', '#152018').attr('stroke', '#1e3024').attr('stroke-width', 0.5)

      cities.forEach(city => {
        const pt = proj([+city.longitude!, +city.latitude!] as [number, number])
        if (!pt) return
        const [x, y] = pt
        const grp = g.append('g').style('cursor', 'pointer').attr('pointer-events', 'all')

        grp.append('circle').attr('class', 'cdot')
          .attr('cx', x).attr('cy', y).attr('r', 6)
          .attr('fill', dotColor(city.price_cad))
          .attr('stroke', 'rgba(0,0,0,0.4)').attr('stroke-width', 1.5)

        grp.append('text').attr('class', 'clbl')
          .attr('x', x + 9).attr('y', y + 3.5).attr('font-size', 9)
          .attr('fill', '#8a8680').attr('font-family', 'Bricolage Grotesque, system-ui, sans-serif')
          .attr('pointer-events', 'none').attr('opacity', 0)
          .text(city.city)

        grp.on('click', () => onSelect(selected?.city === city.city ? null : city))
      })
    })
  }, [cities, mapH, onSelect, selected])

  return (
    <svg ref={svgRef} viewBox={`0 0 700 ${mapH}`}
      style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none', cursor: 'grab' }}>
      <g ref={gRef} />
    </svg>
  )
})

export default WorldMap
