create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text,
  club text,
  email text not null,
  message text not null,
  source text default 'index_contact',
  status text default 'new',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.contact_messages enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='contact_messages' and policyname='contact_messages_public_insert_v124'
  ) then
    create policy contact_messages_public_insert_v124 on public.contact_messages for insert with check (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='contact_messages' and policyname='contact_messages_public_select_v124'
  ) then
    create policy contact_messages_public_select_v124 on public.contact_messages for select using (true);
  end if;
end $$;

insert into public.app_settings(key,value) values
  ('public_contact_email','hola@ibaitudancaphoto.com'),
  ('public_instagram','@ibaitudancaphoto'),
  ('public_domain','https://ibaitudancaphoto.com')
on conflict (key) do update set value=excluded.value;
