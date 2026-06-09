export type CitySnapshot = {
  city?: string | null
  country?: string | null
  region?: string | null
  flag?: string | null
  price_cad?: number | null
  median_rent_1br_cad?: number | null
  median_monthly_salary_cad?: number | null
  baseline_entry_count?: number | null
  market_entry_count?: number | null
  data_quality_label?: string | null
}

export type DistributionStats = {
  count: number
  mean: number | null
  median: number | null
  min: number | null
  max: number | null
  range: number | null
  varianceSample: number | null
  variancePopulation: number | null
  stdDevSample: number | null
  stdDevPopulation: number | null
  standardError: number | null
  coefficientOfVariation: number | null
  q1: number | null
  q3: number | null
  iqr: number | null
  p5: number | null
  p10: number | null
  p25: number | null
  p50: number | null
  p75: number | null
  p90: number | null
  p95: number | null
  mad: number | null
  skewness: number | null
  excessKurtosis: number | null
  geometricMean: number | null
  harmonicMean: number | null
  trimmedMean5: number | null
  trimmedMean10: number | null
  trimmedMean20: number | null
  ci95Low: number | null
  ci95High: number | null
  lowerOutlierFence: number | null
  upperOutlierFence: number | null
  outlierCount: number
}

export function percentile(sortedValues: number[], p: number): number | null {
  if (sortedValues.length === 0) return null
  if (sortedValues.length === 1) return sortedValues[0]
  const idx = (sortedValues.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  const weight = idx - lo
  return sortedValues[lo] * (1 - weight) + sortedValues[hi] * weight
}

export function trimmedMean(sortedValues: number[], trimFraction = 0.05): number | null {
  if (sortedValues.length === 0) return null
  const k = Math.round(sortedValues.length * trimFraction)
  const trimmed = k > 0 ? sortedValues.slice(k, sortedValues.length - k) : sortedValues
  const source = trimmed.length ? trimmed : sortedValues
  return source.reduce((s, v) => s + v, 0) / source.length
}

export function distributionStats(values: number[]): DistributionStats {
  const sorted = values.filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b)
  const count = sorted.length
  const mean = count ? sorted.reduce((s, v) => s + v, 0) / count : null
  const median = percentile(sorted, 0.5)
  const min = count ? sorted[0] : null
  const max = count ? sorted[count - 1] : null
  const range = min !== null && max !== null ? max - min : null
  const variancePopulation = mean !== null && count > 0
    ? sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / count
    : null
  const varianceSample = mean !== null && count > 1
    ? sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / (count - 1)
    : null
  const stdDevPopulation = variancePopulation !== null ? Math.sqrt(variancePopulation) : null
  const stdDevSample = varianceSample !== null ? Math.sqrt(varianceSample) : null
  const standardError = stdDevSample !== null && count > 0 ? stdDevSample / Math.sqrt(count) : null
  const coefficientOfVariation = stdDevSample !== null && mean !== null && mean !== 0 ? stdDevSample / mean : null
  const q1 = percentile(sorted, 0.25)
  const q3 = percentile(sorted, 0.75)
  const iqr = q1 !== null && q3 !== null ? q3 - q1 : null
  const deviations = median !== null ? sorted.map((v) => Math.abs(v - median)).sort((a, b) => a - b) : []
  const mad = percentile(deviations, 0.5)
  const skewness = mean !== null && stdDevPopulation !== null && stdDevPopulation > 0 && count > 2
    ? sorted.reduce((s, v) => s + ((v - mean) / stdDevPopulation) ** 3, 0) / count
    : null
  const excessKurtosis = mean !== null && stdDevPopulation !== null && stdDevPopulation > 0 && count > 3
    ? sorted.reduce((s, v) => s + ((v - mean) / stdDevPopulation) ** 4, 0) / count - 3
    : null
  const geometricMean = count ? Math.exp(sorted.reduce((s, v) => s + Math.log(v), 0) / count) : null
  const harmonicMean = count ? count / sorted.reduce((s, v) => s + 1 / v, 0) : null
  const ci95Low = mean !== null && standardError !== null ? mean - 1.96 * standardError : null
  const ci95High = mean !== null && standardError !== null ? mean + 1.96 * standardError : null
  const lowerOutlierFence = q1 !== null && iqr !== null ? q1 - 1.5 * iqr : null
  const upperOutlierFence = q3 !== null && iqr !== null ? q3 + 1.5 * iqr : null
  const outlierCount = lowerOutlierFence !== null && upperOutlierFence !== null
    ? sorted.filter((v) => v < lowerOutlierFence || v > upperOutlierFence).length
    : 0

  return {
    count,
    mean,
    median,
    min,
    max,
    range,
    varianceSample,
    variancePopulation,
    stdDevSample,
    stdDevPopulation,
    standardError,
    coefficientOfVariation,
    q1,
    q3,
    iqr,
    p5: percentile(sorted, 0.05),
    p10: percentile(sorted, 0.1),
    p25: q1,
    p50: median,
    p75: q3,
    p90: percentile(sorted, 0.9),
    p95: percentile(sorted, 0.95),
    mad,
    skewness,
    excessKurtosis,
    geometricMean,
    harmonicMean,
    trimmedMean5: trimmedMean(sorted, 0.05),
    trimmedMean10: trimmedMean(sorted, 0.1),
    trimmedMean20: trimmedMean(sorted, 0.2),
    ci95Low,
    ci95High,
    lowerOutlierFence,
    upperOutlierFence,
    outlierCount,
  }
}

export function money(n: number | null | undefined) {
  return n === null || n === undefined || !Number.isFinite(n) ? '-' : `CA$${n.toFixed(2)}`
}

export function num(n: number | null | undefined, decimals = 2) {
  return n === null || n === undefined || !Number.isFinite(n) ? '-' : n.toFixed(decimals)
}

export function validPositive(values: Array<number | null | undefined>) {
  return values.map(Number).filter((v) => Number.isFinite(v) && v > 0)
}

export function rentBurden(city: CitySnapshot): number | null {
  const rent = Number(city.median_rent_1br_cad ?? 0)
  const salary = Number(city.median_monthly_salary_cad ?? 0)
  return rent > 0 && salary > 0 ? (rent / salary) * 100 : null
}

export function percentileRank(index: number, total: number) {
  return total > 1 ? Math.round((index / (total - 1)) * 100) : 100
}
