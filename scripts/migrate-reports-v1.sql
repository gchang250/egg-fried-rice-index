-- Monthly reports table
-- Run this in the Supabase SQL editor before running seed-reports-v1.ts

create table if not exists monthly_reports (
  id                      uuid default gen_random_uuid() primary key,
  month                   text unique not null,           -- "2026-06"
  title                   text not null,                  -- "June 2026"
  subtitle                text,
  city_count              integer not null default 0,
  new_cities              text[] not null default '{}',   -- cities added this month
  analysis                text not null,
  cheapest_city           text,
  cheapest_price_cad      numeric,
  priciest_city           text,
  priciest_price_cad      numeric,
  spread_ratio            numeric,
  avg_baseline_cad        numeric,
  exchange_rates_snapshot jsonb not null default '{}',
  city_snapshot           jsonb not null default '[]',
  published_at            timestamptz default now(),
  is_published            boolean not null default true
);

alter table monthly_reports enable row level security;

create policy "Public read published reports" on monthly_reports
  for select using (is_published = true);
