# Rent-data handoff — read before touching rent

## TL;DR (updated 2026-07-18 — the fix is now LIVE)
Rent, salary and climate are all real, sourced, and **deployed** (Supabase + Vercel).
The fabricated rent pipeline described below is history — kept here because the
failure pattern keeps recurring. **Do not invent any numbers.**

**Current state:** every riding's rent traces to CMHC 2025 (neighbourhood zones where
they exist, else the measured metro average, else withheld). Salary is Census Profile
2021 (98-401-X2021029) for all 343 — the 11 hardcoded `INCOME_OVERRIDES` were removed
after an audit found they matched no source while the page credited StatCan. Climate is
per-riding ECCC 1981-2010 normals. Provincial tax uses real progressive brackets for all
13 jurisdictions. See the memory note `data-audit-history` for the full audit trail.

---

## The #1 rule (this is why the data was wrong in the first place)
**Every rent value must trace to a named, real data source, or be withheld (null).**
No simulated listings. No hardcoded "baseline" dictionaries. No plausible-looking
placeholders. No scraping listing sites (ToS). If real data doesn't exist for a
riding, show nothing — the UI already renders null rent as "Pending" and hides the
rent card. Every claim on the About page must stay literally true.

The previous rent pipeline violated all of this and had to be deleted (see below).

---

## What was wrong
- The live `cities.median_rent_1br_cad` came from a fake pipeline
  (`hybrid-rent-estimator.ts`) that used ~13 hardcoded "scraped listings" and a
  10-entry hardcoded "census" dict with an `|| 800` fallback.
- Result: **~333 of 343 ridings got `$800 × province-CPI`.** BC = `800 × 1.22 = $976`,
  repeated across ~34 ridings including HCOL Metro Vancouver (Burnaby, New West,
  South Surrey). ON = $944, etc. The `rent_data_source` strings lied ("Census
  baseline for Victoria" was really the $800 default).

## What has been done (staged locally, NOT deployed, NOT applied to Supabase)
- **Deleted** the fabricated files: `scripts/data/hybrid-rent-estimator.ts`,
  `scripts/data/hybrid-rent-estimates.json`, `scripts/patch-hybrid-estimates.ts`.
- **`scripts/data/build-rent-final.py`** → **`scripts/data/rent-final.json`**: real
  CMHC 2025 rents from `scripts/data/metro-assignments.json` (built by
  `build-metro-assignments.py` = nearest surveyed CMHC centre to each riding's
  boundary). Tiered by distance: `exact` 132, `metro` 197, `weak` 11, `withheld` 3.
  Withheld (null, no honest local value): **Nunavut, Yukon, Labrador** (nearest
  survey 268–451 km away in a different market).
- **`scripts/patch-real-rent-safety.ts`** now reads rent + source from
  `rent-final.json`. Run `npx tsx scripts/patch-real-rent-safety.ts --apply` to
  write to Supabase — **only with the user's explicit approval.** (Dry-run reads the
  prod DB; a sandbox classifier may block even the read.)
- **UI/copy fixes already made** (git-modified, not deployed):
  - `app/about/page.tsx` — rewrote rent methodology; removed all "active listings /
    scraped / hybrid" claims (they were false). Now: CMHC-only, honestly labeled.
  - `app/cities/page.tsx`, `app/explore/page.tsx` — removed 🇨🇦 flags next to riding
    names (user request).
  - `app/page.tsx` — scatter labels near the right edge now flip left (fixes
    "Vancouver Centre" clipping).
  - `app/explore/page.tsx` — map legend title now switches "Represented party" ↔
    "Housing burden" with the view mode (was hardcoded).
  - `app/cities/[city]/CityPageContent.tsx`, `app/explore/page.tsx` — "hybrid
    methodology" link text → "Learn how rent is sourced".

## The former OPEN problem — SOLVED (no multi-riding metro still shares one number)
The problem was that the per-CMA CMHC figure **smeared one metro number across every
riding in that metro** (BC $1,807 × 19, ON $1,761 × 44, etc.). Rejected as lazy/inaccurate.
Goal: **every riding distinct, current, real-data-grounded** (or withheld). **Done.**

**Two real-data methods, applied per metro by `scripts/data/build-rent-zones.py`**
(this script supersedes `build-rent-final.py`; rebuild = `python3 scripts/data/build-rent-zones.py`).
Each riding's card names which method produced its number.

Current `rent-final.json` tiers (343 ridings; 339 shown, 281 distinct values):
- **`neighbourhood` 140** — real CMHC survey-neighbourhood 1BR rents (mean of the zones
  covering each riding). Vancouver, Toronto, Montreal, Calgary, Edmonton, Ottawa, KW.
  These are *measured* 1BR values — the most accurate tier. e.g. Metro Van $1,406–$2,031.
- **`estimated` 150** — Census-indexed estimate for every other multi-riding metro: the
  riding's REAL 2021 Census median renter shelter cost, re-based so the metro group mean
  equals the REAL 2025 CMHC 1BR figure. Both inputs real gov data; **labelled "Estimated"**
  on the card. e.g. Hamilton metro now $963 (Haldimand) … $2,124 (Oakville East), was
  $1,402 flat. The census file is `scripts/data/census-rent-2021.json` (per-riding, real).
- **`exact` 46 / `cma` 3** — solo-in-metro ridings; direct real CMHC metro value (nothing
  to differentiate against). The 3 `cma`: West Vancouver—Sunshine Coast, Lakeland, Carleton.
- **`withheld` 4** — Nunavut, Yukon, Desnethé—Missinippi—Churchill River, Labrador
  (nearest survey >50 km, different market). UI shows "Pending", hides the rent card.

Why mixed (not uniform census-indexing): head-to-head on Vancouver, census all-unit rent
distorts 1BR (over-states family-suburb ridings like Delta/South Surrey, under-states dense
Vancouver East). Real CMHC neighbourhood 1BR is strictly more accurate where it exists, so
we keep it and only fall back to the census estimate where CMHC has no zone breakdown.

Provenance note: the Vancouver inline values in `build-rent-zones.py` verify 1:1 against
`scripts/data/cmhc-submetro-2025.json`; the other 6 metros' neighbourhood values live inline
in the script only (raw HMIP capture not saved to JSON) — trusted but not independently
re-verifiable here. The 150 `estimated` values are fully reproducible from on-disk data.

**About page** (`app/about/page.tsx`) rewritten to describe BOTH methods honestly, and the
riding detail footer no longer claims rent is "applied by nearest surveyed metro."

**DONE and deployed** (2026-07-18). Applied via `patch-real-rent-safety.ts --apply` and
pushed. Two corrections were needed on top of the above:
- `build-metro-assignments.py` applied its CMA-within-20km override *before* checking for
  a surveyed city inside the riding, so metros captured rural ridings (Moose Jaw showed
  Regina's $1,240 rather than its own $997; Miramichi showed Fredericton's). Fixed —
  26 ridings corrected nationally, nearly all moving down.
- Saskatchewan now skips the census re-basing entirely (guard in `build-rent-zones.py`):
  all-unit Census shelter cost over-states 1BR in family-suburb ridings and SK has no
  neighbourhood data to correct it, which had pushed Regina—Lewvan to $1,492 — above
  Regina's own measured $1,240.

Optional future accuracy bump: pull real CMHC HMIP zone data for the `estimated` metros to
upgrade them from estimate → measured (do NOT interpolate; real zone rents only).

**Always run `npm run build` before pushing** — `next dev` skips type-checking, and a
pre-existing type error silently blocked a Vercel deploy.

## Dev-only preview overlay (so localhost shows real data without a prod write)
Because `next dev` reads the same production Supabase, a helper lets localhost show
the staged real data while production stays on the fabricated values:
- `lib/rent-preview.ts` — `previewRent(rows)` overlays `lib/rent-final.json` onto
  fetched `cities` rows **only when `NODE_ENV === 'development'`** (no-op in prod builds).
- `lib/rent-final.json` — keyed mirror of `scripts/data/rent-final.json`
  (`{ ridingName: { rent, source } }`). Regenerate it whenever rent-final.json changes
  (command in the header of `lib/rent-preview.ts`).
- `previewRent(...)` is called at the 5 `cities` fetch sites: `app/page.tsx`,
  `app/explore/page.tsx`, `app/components/WorldMap.tsx`, `app/cities/page.tsx`,
  `app/cities/[city]/page.tsx`.
This is a **preview only** — the real fix still requires `patch-real-rent-safety.ts
--apply` to Supabase (with user approval). Keep or remove the overlay as you like; it
is inert in production either way.

## Other constraints
- `AGENTS.md`: this is a **modified Next.js** — read `node_modules/next/dist/docs/`
  before writing Next code; don't assume standard APIs.
- App reads rent from **Supabase** (`cities` table), not from the JSON files at runtime.
- Do **not** push to live (Supabase write or deploy) without explicit user approval.
- Real data files to trust: `scripts/data/cmhc-1br-2025.json` (169 real CMHC centres),
  `scripts/data/metro-assignments.json`, `scripts/data/ridings-real-data.json`.
