-- Ibai Tudanca Portfolio — Initial Supabase schema draft
-- This is a starting point for the functional version.

create extension if not exists "pgcrypto";

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  auth_user_id uuid,
  name text not null,
  client_type text not null check (client_type in ('player','club','agency','personal')),
  email text unique,
  status text not null default 'active' check (status in ('draft','active','archived')),
  preferred_language text not null default 'es' check (preferred_language in ('es','en')),
  club_name text,
  league text,
  country text,
  category_group text,
  agency_type text,
  agency_coverage text,
  personal_relation text,
  internal_notes text
);

create table if not exists public.client_experiences (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  hero_image_url text,
  hero_crop_x integer default 50,
  hero_crop_y integer default 50,
  profile_image_url text,
  profile_crop_x integer default 50,
  profile_crop_y integer default 50,
  welcome_title_en text,
  welcome_title_es text,
  welcome_message_en text,
  welcome_message_es text,
  personal_note_en text,
  personal_note_es text,
  license_text_en text,
  license_text_es text,
  unique (client_id)
);

create table if not exists public.galleries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  slug text unique,
  event_name text,
  event_date date,
  location text,
  city text,
  country text,
  cover_image_url text,
  cover_crop_x integer default 50,
  cover_crop_y integer default 50,
  status text not null default 'created' check (status in ('created','in_progress','ready','archived')),
  visibility text not null default 'draft' check (visibility in ('draft','published')),
  gallery_note_en text,
  gallery_note_es text,
  allow_individual_download boolean not null default true,
  allow_selected_download boolean not null default true,
  allow_favourites_download boolean not null default true,
  allow_retouch_requests boolean not null default true,
  available_sizes jsonb not null default '["6000x4000","3000x2000","1600x1067"]'::jsonb,
  internal_notes text
);

create table if not exists public.gallery_clients (
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (gallery_id, client_id)
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  created_at timestamptz not null default now(),
  display_order integer not null default 0,
  file_name text not null,
  file_code text,
  orientation text check (orientation in ('horizontal','vertical','square')),
  original_url text,
  large_url text,
  preview_url text,
  event_name text,
  event_date date,
  location text,
  city text,
  photographer text default 'Ibai Tudanca',
  usage_label text,
  is_hidden boolean not null default false
);

create table if not exists public.favourites (
  client_id uuid not null references public.clients(id) on delete cascade,
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, photo_id)
);

create table if not exists public.selections (
  client_id uuid not null references public.clients(id) on delete cascade,
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, photo_id)
);

create table if not exists public.retouch_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_id uuid not null references public.clients(id) on delete cascade,
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  message text,
  status text not null default 'new' check (status in ('new','in_progress','done','cancelled')),
  replacement_photo_url text
);

create table if not exists public.download_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_id uuid references public.clients(id) on delete set null,
  gallery_id uuid references public.galleries(id) on delete set null,
  photo_id uuid references public.photos(id) on delete set null,
  download_type text check (download_type in ('single','selected','favourites','all')),
  size_label text,
  photo_count integer default 1
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  event_date date not null,
  start_time time,
  location text,
  coverage_owner text default 'Ibai Tudanca',
  related_client_id uuid references public.clients(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','confirmed','covering','completed','cancelled')),
  notes text
);

-- RLS will be enabled and policies added when authentication is connected.
