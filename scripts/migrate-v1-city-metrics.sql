-- Migration v1: Add liveability metrics to the cities table
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)

ALTER TABLE cities
  ADD COLUMN IF NOT EXISTS median_rent_1br_cad      NUMERIC,   -- median 1BR city-centre rent, monthly, in CAD
  ADD COLUMN IF NOT EXISTS median_rent_local         NUMERIC,   -- same in local currency
  ADD COLUMN IF NOT EXISTS median_monthly_salary_cad NUMERIC,   -- median gross monthly salary (all workers), in CAD
  ADD COLUMN IF NOT EXISTS median_monthly_salary_local NUMERIC, -- same in local currency
  ADD COLUMN IF NOT EXISTS tech_salary_cad           NUMERIC,   -- median gross monthly salary (tech/knowledge workers), in CAD
  ADD COLUMN IF NOT EXISTS tech_salary_local         NUMERIC,   -- same in local currency
  ADD COLUMN IF NOT EXISTS safety_index              NUMERIC,   -- 0–100, higher = safer (Numbeo methodology)
  ADD COLUMN IF NOT EXISTS healthcare_index          NUMERIC,   -- 0–100 (Numbeo methodology)
  ADD COLUMN IF NOT EXISTS english_proficiency       TEXT,      -- 'native' | 'high' | 'medium' | 'low'
  ADD COLUMN IF NOT EXISTS visa_ease                 TEXT,      -- 'easy' | 'moderate' | 'complex' (Western passport)
  ADD COLUMN IF NOT EXISTS avg_internet_mbps         NUMERIC,   -- median download speed (Mbps), Ookla / Speedtest
  ADD COLUMN IF NOT EXISTS salary_data_source        TEXT,      -- e.g. "Statistics Canada 2025"
  ADD COLUMN IF NOT EXISTS rent_data_source          TEXT;      -- e.g. "Numbeo Q1 2026"

