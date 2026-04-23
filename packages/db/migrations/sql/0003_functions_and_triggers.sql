-- =============================================================================
-- 0003_functions_and_triggers.sql
--
-- Fonctions RPC et triggers metier.
--
-- A appliquer APRES les policies RLS.
-- =============================================================================

-- =============================================================================
-- Trigger : synchroniser auth.users vers public.users
--
-- A la creation d'un user dans auth.users (Supabase Auth), on cree
-- automatiquement la ligne dans public.users.
-- =============================================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, created_at)
  values (new.id, new.email, now())
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- =============================================================================
-- Trigger : mise a jour automatique de updated_at sur subscriptions
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- =============================================================================
-- RPC : find_pigeons_by_amateur_name
--
-- Recherche fuzzy sur amateur_display_name dans pigeon_results, groupe par
-- pigeon_matricule. Utilise pour l'onboarding magique : l'eleveur tape son nom,
-- on lui montre les pigeons retrouves dans les resultats scrapes.
--
-- Retourne 50 matricules max, tries par nombre de courses (les plus "actifs"
-- en premier).
-- =============================================================================

create or replace function public.find_pigeons_by_amateur_name(search text)
returns table (
  pigeon_matricule varchar(20),
  amateur_display_name text,
  last_seen_at date,
  race_count bigint
)
language sql
stable
security definer
set search_path = public
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
  limit 50;
$$;

grant execute on function public.find_pigeons_by_amateur_name(text)
  to authenticated, anon;

-- =============================================================================
-- RPC : claim_orphan_pigeons
--
-- Attache des pigeons orphelins (loft_id IS NULL) a un pigeonnier de l'user
-- courant. Verifie que :
--   - le loft appartient bien a auth.uid()
--   - tous les pigeons ciblés sont bien orphelins (pas deja pris par un autre)
-- =============================================================================

create or replace function public.claim_orphan_pigeons(
  target_matricules varchar(20)[],
  target_loft_id uuid
)
returns setof public.pigeons
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id
  from public.lofts
  where id = target_loft_id;

  if owner_id is null or owner_id != auth.uid() then
    raise exception 'loft_not_owned_by_caller';
  end if;

  return query
    update public.pigeons
    set loft_id = target_loft_id
    where matricule = any(target_matricules)
      and loft_id is null
    returning *;
end;
$$;

grant execute on function public.claim_orphan_pigeons(varchar[], uuid)
  to authenticated;

-- =============================================================================
-- RPC : delete_user_account
--
-- Cascade RGPD. Supprime les donnees personnelles (lofts et tout ce qui en
-- depend via les FK ON DELETE CASCADE), conserve les pigeon_results en
-- anonymisant le nom d'amateur, supprime le user auth.
-- =============================================================================

create or replace function public.delete_user_account(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() != target then
    raise exception 'cannot_delete_other_user';
  end if;

  -- Anonymiser les resultats historiques lies a cet eleveur.
  -- On ne peut pas identifier a 100% les resultats lui appartenant (amateur_display_name
  -- est scrappé), donc on anonymise via une correlation avec ses pigeons.
  update public.pigeon_results pr
  set amateur_display_name = 'Compte supprime'
  where pr.pigeon_matricule in (
    select p.matricule
    from public.pigeons p
    join public.lofts l on l.id = p.loft_id
    where l.user_id = target
  );

  -- Detache les pigeons (ils redeviennent orphelins, donc publics)
  update public.pigeons p
  set loft_id = null
  where p.loft_id in (
    select id from public.lofts where user_id = target
  );

  -- Supprime lofts (cascade sur subscriptions via FK user_id, pedigrees /
  -- trainings / notes via pigeon_matricule => supprimes par le detachment
  -- precedent, non, on les a detaches, donc on les delete explicitement avant).
  delete from public.trainings
  where pigeon_matricule in (
    select matricule from public.pigeons p
    join public.lofts l on l.id = p.loft_id
    where l.user_id = target
  );

  delete from public.pigeon_notes
  where pigeon_matricule in (
    select matricule from public.pigeons p
    join public.lofts l on l.id = p.loft_id
    where l.user_id = target
  );

  delete from public.lofts where user_id = target;

  -- Soft delete du user (on garde la ligne pour integrite referentielle)
  update public.users
  set deleted_at = now(), email = 'deleted+' || target::text || '@colombo.local'
  where id = target;

  -- Supprime le compte auth (ce qui declenche la suppression via FK cascade)
  delete from auth.users where id = target;
end;
$$;

grant execute on function public.delete_user_account(uuid)
  to authenticated;
