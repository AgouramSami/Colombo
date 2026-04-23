-- =============================================================================
-- 0002_rls_policies.sql
--
-- Row Level Security pour toutes les tables.
-- A appliquer APRES la migration Drizzle qui cree les tables.
--
-- Principes :
--   - Tables privees (users, lofts, pigeons, pedigrees, trainings, pigeon_notes,
--     subscriptions) : un utilisateur ne voit et ne modifie que ses donnees.
--   - Tables publiques (regions, clubs, races, pigeon_results, race_pdfs,
--     race_amateur_stats) : SELECT ouvert, ecritures reservees au service_role
--     (scraper).
--   - Table pigeons : cas special. Un pigeon orphelin (loft_id IS NULL) est
--     visible par tout le monde (resultats scrapes). Un pigeon avec loft_id
--     n'est visible que par son proprietaire.
-- =============================================================================

-- =============================================================================
-- users
-- =============================================================================

alter table public.users enable row level security;

create policy users_select_self on public.users
  for select to authenticated
  using (auth.uid() = id);

create policy users_update_self on public.users
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Pas de policy INSERT ni DELETE direct : gere par trigger et RPC
-- (voir 0003_functions_and_triggers.sql).

-- =============================================================================
-- subscriptions
-- =============================================================================

alter table public.subscriptions enable row level security;

create policy subscriptions_select_own on public.subscriptions
  for select to authenticated
  using (auth.uid() = user_id);

-- Ecritures via webhook Stripe uniquement (service_role bypass RLS).

-- =============================================================================
-- lofts
-- =============================================================================

alter table public.lofts enable row level security;

create policy lofts_select_own on public.lofts
  for select to authenticated
  using (auth.uid() = user_id);

create policy lofts_insert_own on public.lofts
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy lofts_update_own on public.lofts
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy lofts_delete_own on public.lofts
  for delete to authenticated
  using (auth.uid() = user_id);

-- =============================================================================
-- pigeons (cas special : orphelins publics)
-- =============================================================================

alter table public.pigeons enable row level security;

create policy pigeons_select_own_or_orphan on public.pigeons
  for select to authenticated, anon
  using (
    loft_id is null
    or loft_id in (
      select id from public.lofts where user_id = auth.uid()
    )
  );

create policy pigeons_insert_own on public.pigeons
  for insert to authenticated
  with check (
    loft_id is not null
    and loft_id in (
      select id from public.lofts where user_id = auth.uid()
    )
  );

create policy pigeons_update_own on public.pigeons
  for update to authenticated
  using (
    loft_id in (
      select id from public.lofts where user_id = auth.uid()
    )
  )
  with check (
    loft_id in (
      select id from public.lofts where user_id = auth.uid()
    )
  );

create policy pigeons_delete_own on public.pigeons
  for delete to authenticated
  using (
    loft_id in (
      select id from public.lofts where user_id = auth.uid()
    )
  );

-- =============================================================================
-- pedigrees (herite ownership de pigeons)
-- =============================================================================

alter table public.pedigrees enable row level security;

create policy pedigrees_select_own on public.pedigrees
  for select to authenticated
  using (
    pigeon_matricule in (
      select matricule from public.pigeons
      where loft_id in (
        select id from public.lofts where user_id = auth.uid()
      )
    )
  );

create policy pedigrees_write_own on public.pedigrees
  for all to authenticated
  using (
    pigeon_matricule in (
      select matricule from public.pigeons
      where loft_id in (
        select id from public.lofts where user_id = auth.uid()
      )
    )
  )
  with check (
    pigeon_matricule in (
      select matricule from public.pigeons
      where loft_id in (
        select id from public.lofts where user_id = auth.uid()
      )
    )
  );

-- =============================================================================
-- trainings (herite ownership de pigeons)
-- =============================================================================

alter table public.trainings enable row level security;

create policy trainings_select_own on public.trainings
  for select to authenticated
  using (
    pigeon_matricule in (
      select matricule from public.pigeons
      where loft_id in (
        select id from public.lofts where user_id = auth.uid()
      )
    )
  );

create policy trainings_write_own on public.trainings
  for all to authenticated
  using (
    pigeon_matricule in (
      select matricule from public.pigeons
      where loft_id in (
        select id from public.lofts where user_id = auth.uid()
      )
    )
  )
  with check (
    pigeon_matricule in (
      select matricule from public.pigeons
      where loft_id in (
        select id from public.lofts where user_id = auth.uid()
      )
    )
  );

-- =============================================================================
-- pigeon_notes (herite ownership de pigeons)
-- =============================================================================

alter table public.pigeon_notes enable row level security;

create policy pigeon_notes_select_own on public.pigeon_notes
  for select to authenticated
  using (
    pigeon_matricule in (
      select matricule from public.pigeons
      where loft_id in (
        select id from public.lofts where user_id = auth.uid()
      )
    )
  );

create policy pigeon_notes_write_own on public.pigeon_notes
  for all to authenticated
  using (
    pigeon_matricule in (
      select matricule from public.pigeons
      where loft_id in (
        select id from public.lofts where user_id = auth.uid()
      )
    )
  )
  with check (
    pigeon_matricule in (
      select matricule from public.pigeons
      where loft_id in (
        select id from public.lofts where user_id = auth.uid()
      )
    )
  );

-- =============================================================================
-- Tables publiques en lecture (regions, clubs, races, etc)
-- =============================================================================

alter table public.regions enable row level security;
create policy regions_public_read on public.regions
  for select to authenticated, anon
  using (true);

alter table public.clubs enable row level security;
create policy clubs_public_read on public.clubs
  for select to authenticated, anon
  using (true);

alter table public.races enable row level security;
create policy races_public_read on public.races
  for select to authenticated, anon
  using (true);

alter table public.race_pdfs enable row level security;
create policy race_pdfs_public_read on public.race_pdfs
  for select to authenticated, anon
  using (true);

alter table public.pigeon_results enable row level security;
create policy pigeon_results_public_read on public.pigeon_results
  for select to authenticated, anon
  using (true);

alter table public.race_amateur_stats enable row level security;
create policy race_amateur_stats_public_read on public.race_amateur_stats
  for select to authenticated, anon
  using (true);

-- Pas de policy INSERT/UPDATE/DELETE sur ces tables publiques.
-- Seul service_role (scraper) peut ecrire, RLS etant bypass pour ce role.

-- =============================================================================
-- Grants explicites (sinon auth/anon ne peuvent rien faire meme avec RLS permissive)
-- =============================================================================

grant select on public.regions, public.clubs, public.races, public.race_pdfs,
  public.pigeon_results, public.race_amateur_stats, public.pigeons
  to authenticated, anon;

grant select, insert, update, delete on public.users, public.lofts,
  public.pedigrees, public.trainings, public.pigeon_notes
  to authenticated;

grant select on public.subscriptions to authenticated;

-- Pigeons : INSERT/UPDATE/DELETE pour authenticated (mais RLS limite aux siens)
grant insert, update, delete on public.pigeons to authenticated;

-- Sequences : aucune car on utilise des uuid partout et des enums.
