// lib/canada-tax.ts
//
// Estimated monthly take-home pay, 2026 tax year.
//
// Every rate, threshold and credit below is a real published figure:
//   Federal brackets + provincial/territorial brackets
//     Canada Revenue Agency, "Current year tax rates and income brackets (2026)"
//     canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year
//   Quebec brackets and basic personal amount
//     Revenu Québec, "Principal Changes for 2026" (TP-1015.3-V) -- QC administers its own tax
//   Basic personal amounts (all other jurisdictions)
//     CRA T4127, Payroll Deductions Formulas, 122nd ed. (Jan 2026), claim-code-1 TCP
//   Refundable Quebec abatement, 16.5% of basic federal tax
//     CRA, "Line 44000 - Refundable Quebec abatement"
//
// This previously applied a single FLAT rate to the whole income and used a generic
// 7% "rest of Canada" proxy for the 10 jurisdictions that were not QC/ON/BC, which
// understated tax for higher earners and was simply wrong for most of the country.
//
// Still an approximation, and deliberately so: CPP/EI are modelled with the federal
// rates everywhere (Quebec's QPP/QPIP differ slightly), and only the basic personal
// amount is credited -- no other deductions or credits are assumed.

type Bracket = { upTo: number; rate: number };

const FEDERAL: Bracket[] = [
  { upTo: 58523, rate: 0.14 },
  { upTo: 117045, rate: 0.205 },
  { upTo: 181440, rate: 0.26 },
  { upTo: 258482, rate: 0.29 },
  { upTo: Infinity, rate: 0.33 },
];
const FEDERAL_BPA = 16452;

const PROVINCIAL: Record<string, { bpa: number; brackets: Bracket[] }> = {
  AB: { bpa: 22769, brackets: [
    { upTo: 61200, rate: 0.08 }, { upTo: 154259, rate: 0.10 }, { upTo: 185111, rate: 0.12 },
    { upTo: 246813, rate: 0.13 }, { upTo: 370220, rate: 0.14 }, { upTo: Infinity, rate: 0.15 }] },
  BC: { bpa: 13216, brackets: [
    { upTo: 50363, rate: 0.056 }, { upTo: 100728, rate: 0.077 }, { upTo: 115648, rate: 0.105 },
    { upTo: 140430, rate: 0.1229 }, { upTo: 190405, rate: 0.147 }, { upTo: 265545, rate: 0.168 },
    { upTo: Infinity, rate: 0.205 }] },
  MB: { bpa: 15780, brackets: [
    { upTo: 47564, rate: 0.108 }, { upTo: 101200, rate: 0.1275 }, { upTo: Infinity, rate: 0.174 }] },
  NB: { bpa: 13664, brackets: [
    { upTo: 52333, rate: 0.094 }, { upTo: 104666, rate: 0.14 }, { upTo: 193861, rate: 0.16 },
    { upTo: Infinity, rate: 0.195 }] },
  NL: { bpa: 11188, brackets: [
    { upTo: 44678, rate: 0.087 }, { upTo: 89354, rate: 0.145 }, { upTo: 159528, rate: 0.158 },
    { upTo: 223340, rate: 0.178 }, { upTo: 285319, rate: 0.198 }, { upTo: 570638, rate: 0.208 },
    { upTo: 1141275, rate: 0.213 }, { upTo: Infinity, rate: 0.218 }] },
  NS: { bpa: 11932, brackets: [
    { upTo: 30995, rate: 0.0879 }, { upTo: 61991, rate: 0.1495 }, { upTo: 97417, rate: 0.1667 },
    { upTo: 157124, rate: 0.175 }, { upTo: Infinity, rate: 0.21 }] },
  NT: { bpa: 18198, brackets: [
    { upTo: 53003, rate: 0.059 }, { upTo: 106009, rate: 0.086 }, { upTo: 172346, rate: 0.122 },
    { upTo: Infinity, rate: 0.1405 }] },
  NU: { bpa: 19659, brackets: [
    { upTo: 55801, rate: 0.04 }, { upTo: 111602, rate: 0.07 }, { upTo: 181439, rate: 0.09 },
    { upTo: Infinity, rate: 0.115 }] },
  ON: { bpa: 12989, brackets: [
    { upTo: 53891, rate: 0.0505 }, { upTo: 107785, rate: 0.0915 }, { upTo: 150000, rate: 0.1116 },
    { upTo: 220000, rate: 0.1216 }, { upTo: Infinity, rate: 0.1316 }] },
  PE: { bpa: 15000, brackets: [
    { upTo: 33928, rate: 0.095 }, { upTo: 65820, rate: 0.1347 }, { upTo: 106890, rate: 0.166 },
    { upTo: 142520, rate: 0.1762 }, { upTo: 200000, rate: 0.19 }, { upTo: Infinity, rate: 0.20 }] },
  QC: { bpa: 18952, brackets: [
    { upTo: 54345, rate: 0.14 }, { upTo: 108680, rate: 0.19 }, { upTo: 132245, rate: 0.24 },
    { upTo: Infinity, rate: 0.2575 }] },
  SK: { bpa: 20381, brackets: [
    { upTo: 54532, rate: 0.105 }, { upTo: 155805, rate: 0.125 }, { upTo: Infinity, rate: 0.145 }] },
  YT: { bpa: 16452, brackets: [
    { upTo: 58523, rate: 0.064 }, { upTo: 117045, rate: 0.09 }, { upTo: 181440, rate: 0.109 },
    { upTo: 500000, rate: 0.128 }, { upTo: Infinity, rate: 0.15 }] },
};

/** Progressive tax: each portion of income is taxed only at its own bracket's rate. */
function applyBrackets(income: number, brackets: Bracket[]): number {
  let tax = 0;
  let floor = 0;
  for (const b of brackets) {
    if (income <= floor) break;
    tax += (Math.min(income, b.upTo) - floor) * b.rate;
    floor = b.upTo;
  }
  return tax;
}

/** Basic personal amount is a non-refundable credit valued at the lowest bracket rate. */
function bpaCredit(bpa: number, brackets: Bracket[]): number {
  return bpa * brackets[0].rate;
}

export function estimateMonthlyTakeHome(monthlyGross: number, provinceCode: string | null): number {
  if (!monthlyGross) return 0;
  const annualIncome = monthlyGross * 12;

  // Federal
  const basicFederalTax = Math.max(0, applyBrackets(annualIncome, FEDERAL) - bpaCredit(FEDERAL_BPA, FEDERAL));

  // Quebec residents receive a refundable abatement of 16.5% of basic federal tax,
  // because Quebec administers programs the federal government funds elsewhere.
  const netFederalTax = provinceCode === 'QC' ? basicFederalTax * (1 - 0.165) : basicFederalTax;

  // Provincial / territorial. Unknown codes fall back to the national median-ish
  // Ontario schedule rather than a made-up flat rate.
  const prov = PROVINCIAL[provinceCode ?? ''] ?? PROVINCIAL.ON;
  const netProvincialTax = Math.max(0, applyBrackets(annualIncome, prov.brackets) - bpaCredit(prov.bpa, prov.brackets));

  // Payroll deductions (2026 federal CPP/EI maxima; QPP/QPIP differ slightly in Quebec)
  const cppDeduction = Math.max(0, Math.min((annualIncome - 3500) * 0.0595, 4050));
  const eiDeduction = Math.min(annualIncome * 0.0166, 1050);

  const annualDisposable = annualIncome - netFederalTax - netProvincialTax - cppDeduction - eiDeduction;
  return Math.max(0, annualDisposable / 12);
}
