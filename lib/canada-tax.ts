// lib/canada-tax.ts

export function estimateMonthlyTakeHome(monthlyGross: number, provinceCode: string | null): number {
  if (!monthlyGross) return 0;
  const annualIncome = monthlyGross * 12;

  // 1. 2026 Federal Tax Brackets
  const federalBrackets = [
    { limit: 58523, rate: 0.14 },
    { limit: 117045, rate: 0.205 },
    { limit: 181440, rate: 0.26 },
    { limit: 258482, rate: 0.29 },
    { limit: Infinity, rate: 0.33 }
  ];

  let grossFederalTax = 0;
  let previousLimit = 0;

  for (const bracket of federalBrackets) {
    if (annualIncome > previousLimit) {
      const taxableAtThisRate = Math.min(annualIncome, bracket.limit) - previousLimit;
      grossFederalTax += taxableAtThisRate * bracket.rate;
    }
    previousLimit = bracket.limit;
  }

  // Apply 2026 Federal Basic Personal Amount (BPA) non-refundable credit
  const federalBpaCredit = 16452 * 0.14;
  const netFederalTax = Math.max(0, grossFederalTax - federalBpaCredit);

// Replace the "Provincial Tax Framework" section in lib/canada-tax.ts with this:

let netProvincialTax = 0;

if (provinceCode === 'QC') {
  // Quebec 2026: ~14% base rate, $18,056 BPA
  const qcBpaCredit = 18056 * 0.14;
  const baseProvTax = annualIncome * 0.14;
  netProvincialTax = Math.max(0, baseProvTax - qcBpaCredit);
} else if (provinceCode === 'ON') {
  // Ontario 2026: 5.05% base rate, $12,399 BPA
  const onBpaCredit = 12399 * 0.0505;
  const baseProvTax = annualIncome * 0.0505;
  netProvincialTax = Math.max(0, baseProvTax - onBpaCredit);
} else if (provinceCode === 'BC') {
  // BC 2026: 5.06% base rate, $13,216 BPA
  const bcBpaCredit = 13216 * 0.0506;
  const baseProvTax = annualIncome * 0.0506;
  netProvincialTax = Math.max(0, baseProvTax - bcBpaCredit);
} else {
  // Rest of Canada proxy
  const provincialBpaCredit = 12000 * 0.05;
  const baseProvincialTax = annualIncome * 0.07;
  netProvincialTax = Math.max(0, baseProvincialTax - provincialBpaCredit);
}

  // 3. 2026 Payroll Deductions (CPP & EI proxies)
  const cppDeduction = Math.max(0, Math.min((annualIncome - 3500) * 0.0595, 4050));
  const eiDeduction = Math.min(annualIncome * 0.0166, 1050);

  // 4. Calculate Final Disposable Income
  const annualDisposable = annualIncome - netFederalTax - netProvincialTax - cppDeduction - eiDeduction;
  
  return Math.max(0, annualDisposable / 12);
}