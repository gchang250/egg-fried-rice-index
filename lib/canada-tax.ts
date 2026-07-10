// Estimated Canadian personal income tax and payroll deductions, 2026 tax year.
//
// This is a deliberately simplified model: it applies the federal and
// provincial/territorial marginal brackets, subtracts the basic-personal-amount
// credit (valued at each jurisdiction's lowest rate), and deducts CPP/QPP and
// EI. It intentionally excludes provincial surtaxes, health premiums, and every
// credit beyond the basic personal amount, so results are an *estimate* of take
// -home pay, not a filing-grade figure. Figures verified against CRA 2026 numbers.

export type ProvinceCode =
  | 'AB' | 'BC' | 'MB' | 'NB' | 'NL' | 'NS'
  | 'NT' | 'NU' | 'ON' | 'PE' | 'QC' | 'SK' | 'YT'

interface Bracket {
  /** Upper income bound for this bracket (Infinity for the top bracket). */
  upTo: number
  rate: number
}

const FEDERAL_BRACKETS: Bracket[] = [
  { upTo: 58_523, rate: 0.14 },
  { upTo: 117_045, rate: 0.205 },
  { upTo: 181_440, rate: 0.26 },
  { upTo: 258_482, rate: 0.29 },
  { upTo: Infinity, rate: 0.33 },
]
const FEDERAL_BPA = 16_452

// Quebec residents get a 16.5% abatement of federal tax (Quebec collects more of
// its own tax in exchange), and pay a reduced EI rate plus QPP instead of CPP.
const QUEBEC_FEDERAL_ABATEMENT = 0.165

const PROVINCES: Record<ProvinceCode, { bpa: number; brackets: Bracket[] }> = {
  BC: { bpa: 12_932, brackets: [
    { upTo: 50_363, rate: 0.0506 }, { upTo: 100_728, rate: 0.077 },
    { upTo: 115_648, rate: 0.105 }, { upTo: 140_430, rate: 0.1229 },
    { upTo: 190_405, rate: 0.147 }, { upTo: 265_545, rate: 0.168 },
    { upTo: Infinity, rate: 0.205 },
  ] },
  AB: { bpa: 22_769, brackets: [
    { upTo: 61_200, rate: 0.08 }, { upTo: 154_259, rate: 0.10 },
    { upTo: 185_111, rate: 0.12 }, { upTo: 246_813, rate: 0.13 },
    { upTo: 370_220, rate: 0.14 }, { upTo: Infinity, rate: 0.15 },
  ] },
  SK: { bpa: 19_009, brackets: [
    { upTo: 54_532, rate: 0.105 }, { upTo: 155_805, rate: 0.125 },
    { upTo: Infinity, rate: 0.145 },
  ] },
  MB: { bpa: 16_222, brackets: [
    { upTo: 47_000, rate: 0.108 }, { upTo: 100_000, rate: 0.1275 },
    { upTo: Infinity, rate: 0.174 },
  ] },
  ON: { bpa: 12_197, brackets: [
    { upTo: 53_891, rate: 0.0505 }, { upTo: 107_785, rate: 0.0915 },
    { upTo: 150_000, rate: 0.1116 }, { upTo: 220_000, rate: 0.1216 },
    { upTo: Infinity, rate: 0.1316 },
  ] },
  QC: { bpa: 19_091, brackets: [
    { upTo: 54_345, rate: 0.14 }, { upTo: 108_680, rate: 0.19 },
    { upTo: 132_245, rate: 0.24 }, { upTo: Infinity, rate: 0.2575 },
  ] },
  NB: { bpa: 13_409, brackets: [
    { upTo: 52_333, rate: 0.094 }, { upTo: 104_666, rate: 0.14 },
    { upTo: 193_861, rate: 0.16 }, { upTo: Infinity, rate: 0.195 },
  ] },
  NS: { bpa: 8_718, brackets: [
    { upTo: 30_995, rate: 0.0879 }, { upTo: 61_991, rate: 0.1495 },
    { upTo: 97_417, rate: 0.1667 }, { upTo: 157_124, rate: 0.175 },
    { upTo: Infinity, rate: 0.21 },
  ] },
  PE: { bpa: 13_878, brackets: [
    { upTo: 33_928, rate: 0.095 }, { upTo: 65_820, rate: 0.1347 },
    { upTo: 106_890, rate: 0.166 }, { upTo: 142_250, rate: 0.1762 },
    { upTo: 200_000, rate: 0.19 }, { upTo: Infinity, rate: 0.20 },
  ] },
  NL: { bpa: 11_121, brackets: [
    { upTo: 44_678, rate: 0.087 }, { upTo: 89_354, rate: 0.145 },
    { upTo: 159_528, rate: 0.158 }, { upTo: 223_340, rate: 0.178 },
    { upTo: 285_319, rate: 0.198 }, { upTo: 570_638, rate: 0.208 },
    { upTo: 1_141_275, rate: 0.213 }, { upTo: Infinity, rate: 0.218 },
  ] },
  NU: { bpa: 19_292, brackets: [
    { upTo: 55_801, rate: 0.04 }, { upTo: 111_602, rate: 0.07 },
    { upTo: 181_439, rate: 0.09 }, { upTo: Infinity, rate: 0.115 },
  ] },
  YT: { bpa: 16_581, brackets: [
    { upTo: 58_523, rate: 0.064 }, { upTo: 117_045, rate: 0.09 },
    { upTo: 181_440, rate: 0.109 }, { upTo: 500_000, rate: 0.128 },
    { upTo: Infinity, rate: 0.15 },
  ] },
  NT: { bpa: 17_859, brackets: [
    { upTo: 53_003, rate: 0.059 }, { upTo: 106_009, rate: 0.086 },
    { upTo: 172_346, rate: 0.122 }, { upTo: Infinity, rate: 0.1405 },
  ] },
}

// CPP / QPP (2026)
const CPP_EXEMPTION = 3_500
const CPP_YMPE = 74_600          // first earnings ceiling
const CPP_YAMPE = 85_000         // second earnings ceiling (CPP2 / QPP2)
const CPP_RATE = 0.0595
const QPP_RATE = 0.064           // Quebec's plan runs slightly higher
const CPP2_RATE = 0.04

// EI (2026)
const EI_MIE = 68_900            // maximum insurable earnings
const EI_RATE = 0.0164
const EI_RATE_QC = 0.0130        // Quebec pays a reduced EI rate (QPIP is separate)

function bracketTax(income: number, brackets: Bracket[]): number {
  let tax = 0
  let lower = 0
  for (const b of brackets) {
    if (income <= lower) break
    const taxable = Math.min(income, b.upTo) - lower
    tax += taxable * b.rate
    lower = b.upTo
  }
  return tax
}

function payrollDeductions(annualGross: number, isQuebec: boolean): number {
  const cppBase =
    Math.max(0, Math.min(annualGross, CPP_YMPE) - CPP_EXEMPTION) *
    (isQuebec ? QPP_RATE : CPP_RATE)
  const cpp2 = Math.max(0, Math.min(annualGross, CPP_YAMPE) - CPP_YMPE) * CPP2_RATE
  const ei = Math.min(annualGross, EI_MIE) * (isQuebec ? EI_RATE_QC : EI_RATE)
  return cppBase + cpp2 + ei
}

/**
 * Estimated annual after-tax (take-home) income for a gross annual salary in a
 * given province. Returns null if the province code isn't recognized.
 */
export function estimateAnnualTakeHome(
  annualGross: number,
  province: string | null | undefined,
): number | null {
  const prov = province ? PROVINCES[province as ProvinceCode] : undefined
  if (!prov || annualGross <= 0) return null

  const isQuebec = province === 'QC'

  let federalTax = Math.max(0, bracketTax(annualGross, FEDERAL_BRACKETS) - FEDERAL_BPA * FEDERAL_BRACKETS[0].rate)
  if (isQuebec) federalTax *= 1 - QUEBEC_FEDERAL_ABATEMENT

  const provincialTax = Math.max(0, bracketTax(annualGross, prov.brackets) - prov.bpa * prov.brackets[0].rate)
  const payroll = payrollDeductions(annualGross, isQuebec)

  return annualGross - federalTax - provincialTax - payroll
}

/** Convenience wrapper: take a gross MONTHLY salary, return estimated monthly take-home. */
export function estimateMonthlyTakeHome(
  grossMonthly: number | null | undefined,
  province: string | null | undefined,
): number | null {
  if (grossMonthly == null || grossMonthly <= 0) return null
  const annualNet = estimateAnnualTakeHome(grossMonthly * 12, province)
  return annualNet == null ? null : annualNet / 12
}
