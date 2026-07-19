// lib/histogram.ts

interface Riding {
  id?: string;
  name?: string;
  rent: number | null;
}

export function getSanitizedHistogram(ridings: Riding[], numBins = 19) {
  // 1. Filter out missing or zero rent data (This fixes the $0 bug)
  const validRents = ridings
    .map((r) => r.rent)
    .filter((rent): rent is number => rent !== null && rent > 0);

  if (validRents.length === 0) {
    return { bins: Array(numBins).fill(0), medianRent: 0, minRent: 0, maxRent: 0 };
  }

  // 2. Safe Median Calculation
  const sortedRents = [...validRents].sort((a, b) => a - b);
  const mid = Math.floor(sortedRents.length / 2);
  const medianRent = sortedRents.length % 2 !== 0 
    ? sortedRents[mid] 
    : (sortedRents[mid - 1] + sortedRents[mid]) / 2;

  // 3. Generate Bins dynamically based on actual data spread
  const minRent = Math.min(...validRents);
  const maxRent = Math.max(...validRents);
  const binSize = (maxRent - minRent) / numBins;

  const bins = new Array(numBins).fill(0);

  validRents.forEach((rent) => {
    // Math.min ensures the absolute max value doesn't overflow the array index
    const binIndex = Math.min(
      Math.floor((rent - minRent) / binSize),
      numBins - 1
    );
    bins[binIndex]++;
  });

  return { bins, medianRent, minRent, maxRent };
}