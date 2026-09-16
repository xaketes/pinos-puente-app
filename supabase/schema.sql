-- Peña Futsal Manager: ejecutar en Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  number text not null,
  position text not null check (position in ('Portero', 'Cierre', 'Ala', 'Pívot')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  played_at timestamptz not null,
  location text not null default '',
  home_score integer not null default 0 check (home_score >= 0),
  away_score integer not null default 0 check (away_score >= 0),
  status text not null default 'scheduled' check (status in ('scheduled', 'played', 'cancelled')),
  mvp_player_id uuid references public.players(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.match_player_stats (
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  team text not null check (team in ('green', 'yellow')),
  goals integer not null default 0 check (goals >= 0),
  assists integer not null default 0 check (assists >= 0),
  primary key (match_id, player_id)
);

-- Anonymous users choose their roster identity on the device; user_id still limits writes to that session.
create table if not exists public.attendance (
  id uuid not null default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  attending boolean not null,
  updated_at timestamptz not null default now(),
  primary key (id),
  unique (match_id, player_id, user_id)
);

-- Safe migration for an earlier draft that used (match_id, player_id) as the key.
alter table public.attendance add column if not exists id uuid default gen_random_uuid();
update public.attendance set id = gen_random_uuid() where id is null;
alter table public.attendance alter column id set not null;
do $$ begin
  if exists (select 1 from pg_constraint where conname = 'attendance_pkey' and conrelid = 'public.attendance'::regclass) then
    alter table public.attendance drop constraint attendance_pkey;
    alter table public.attendance add primary key (id);
  end if;
exception when undefined_table then null; end $$;

create or replace function public.is_admin()
returns boolean language sql stable security invoker
as $$ select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false) $$;

alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.match_player_stats enable row level security;
alter table public.attendance enable row level security;

grant select on public.players, public.matches, public.match_player_stats, public.attendance to authenticated;
grant insert, update, delete on public.attendance to authenticated;
grant insert, update, delete on public.players, public.matches, public.match_player_stats to authenticated;

drop policy if exists "authenticated read players" on public.players;
create policy "authenticated read players" on public.players for select to authenticated using (true);
drop policy if exists "admin write players" on public.players;
create policy "admin write players" on public.players for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "authenticated read matches" on public.matches;
create policy "authenticated read matches" on public.matches for select to authenticated using (true);
drop policy if exists "admin write matches" on public.matches;
create policy "admin write matches" on public.matches for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "authenticated read match stats" on public.match_player_stats;
create policy "authenticated read match stats" on public.match_player_stats for select to authenticated using (true);
drop policy if exists "admin write match stats" on public.match_player_stats;
create policy "admin write match stats" on public.match_player_stats for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "authenticated read attendance" on public.attendance;
create policy "authenticated read attendance" on public.attendance for select to authenticated using (true);
drop policy if exists "own attendance insert" on public.attendance;
create policy "own attendance insert" on public.attendance for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "own attendance update" on public.attendance;
create policy "own attendance update" on public.attendance for update to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "own attendance delete" on public.attendance;
create policy "own attendance delete" on public.attendance for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create or replace function public.reset_season()
returns void language plpgsql security definer set search_path = public
as $$ begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  delete from public.matches where true;
end; $$;
revoke execute on function public.reset_season() from public, anon;
grant execute on function public.reset_season() to authenticated;

-- After creating the admin user in Authentication > Users, run this with that email:
-- update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb where email = 'TU_EMAIL_ADMIN';

do $$ begin
  alter publication supabase_realtime add table public.players;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.matches;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.match_player_stats;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.attendance;
exception when duplicate_object then null; end $$;