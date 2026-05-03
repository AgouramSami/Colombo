-- =============================================================================
-- 0011_user_badges_inventory.sql
--
-- Inventaire de badges par utilisateur (gamification dashboard).
-- Persiste les badges debloques avec horodatage pour permettre:
-- - un inventaire durable
-- - un historique d'obtention
-- - un futur systeme de points/niveaux
-- =============================================================================

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  badge_id text not null,
  points_awarded integer not null default 0 check (points_awarded >= 0),
  source text not null default 'dashboard_auto',
  unlocked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint user_badges_user_badge_unique unique (user_id, badge_id)
);

create index if not exists idx_user_badges_user_unlocked
  on public.user_badges (user_id, unlocked_at desc);

alter table public.user_badges enable row level security;

create policy user_badges_select_own on public.user_badges
  for select to authenticated
  using (auth.uid() = user_id);

create policy user_badges_insert_own on public.user_badges
  for insert to authenticated
  with check (auth.uid() = user_id);

grant select, insert on public.user_badges to authenticated;
