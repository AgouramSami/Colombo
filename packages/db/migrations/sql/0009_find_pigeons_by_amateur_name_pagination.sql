-- =============================================================================
-- 0009_find_pigeons_by_amateur_name_pagination.sql
--
-- Supprime la limite dure (50) de l'onboarding et ajoute une pagination RPC
-- pour recuperer tous les pigeons d'un eleveur en plusieurs pages.
-- =============================================================================

drop function if exists public.find_pigeons_by_amateur_name(text);

create or replace function public.find_pigeons_by_amateur_name(
  search text,
  p_limit integer default 500,
  p_offset integer default 0
)
returns table (
  pigeon_matricule varchar(20),
  amateur_display_name text,
  last_seen_at date,
  race_count bigint
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    pr.pigeon_matricule,
    pr.amateur_display_name,
    max(r.race_date) as last_seen_at,
    count(*) as race_count
  from public.pigeon_results pr
  join public.races r on r.id = pr.race_id
  where pr.amateur_display_name % search
  group by pr.pigeon_matricule, pr.amateur_display_name
  order by race_count desc, last_seen_at desc
  limit greatest(1, least(p_limit, 1000))
  offset greatest(0, p_offset);
$$;

grant execute on function public.find_pigeons_by_amateur_name(text, integer, integer)
  to authenticated, anon;
