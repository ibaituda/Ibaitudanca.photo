-- V1.1.4 Bugfix: photo uploads, trash and compatibility
-- Run once in Supabase SQL Editor.

alter table if exists public.photos add column if not exists hidden boolean default false;
alter table if exists public.photos add column if not exists is_hidden boolean default false;
alter table if exists public.photos add column if not exists deleted_at timestamptz;
alter table if exists public.photos add column if not exists retouched_url text;
alter table if exists public.photos add column if not exists updated_at timestamptz default now();

-- The previous uploader used Date.now() as sort_order. If the column was integer,
-- Postgres rejected timestamps such as 1781015311628. Bigint prevents that and
-- the new uploader now stores small order numbers.
alter table if exists public.photos alter column sort_order type bigint using sort_order::bigint;

alter table if exists public.calendar_events add column if not exists deleted_at timestamptz;
alter table if exists public.clients add column if not exists deleted_at timestamptz;
alter table if exists public.galleries add column if not exists deleted_at timestamptz;
