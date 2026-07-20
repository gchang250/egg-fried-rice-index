/**
 * Converting the measured one-bedroom rent into a family-sized housing cost.
 *
 * This was previously a hardcoded `* 1.65` with no source behind it, which overstated
 * family housing cost by roughly a third on every riding page.
 *
 * CMHC publishes average TWO-bedroom rents per centre, so the ratio is measurable.
 * Across the 39 centres present in both the two-bedroom table and our one-bedroom
 * data, the 2BR/1BR ratio is a median of 1.21 (mean 1.21, range 1.11-1.33).
 *
 * Source: Canada Mortgage and Housing Corporation, Rental Market Survey 2025 data
 * tables, Table 1.0 (average two-bedroom rent by centre), joined to the one-bedroom
 * values in scripts/data/cmhc-1br-2025.json. Derivation and the full per-centre table
 * are reproducible via scripts/data/build-bedroom-ratio.py ->
 * scripts/data/cmhc-bedroom-ratio-2025.json.
 *
 * Note this is a national median applied uniformly; the per-centre ratio varies
 * 1.11-1.33. The figure it produces is a two-bedroom equivalent, and the UI labels
 * the family view as a modelled profile rather than a measured rent.
 */
export const FAMILY_RENT_MULTIPLIER = 1.21;

/** Two-bedroom-equivalent rent for the family profile, or null when rent is withheld. */
export function familyRent(oneBedroomRent: number | null | undefined): number | null {
  return oneBedroomRent == null ? null : Number(oneBedroomRent) * FAMILY_RENT_MULTIPLIER;
}
