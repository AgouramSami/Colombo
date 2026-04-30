-- =============================================================================
-- 0010_relax_pigeon_results_race_place_unique.sql
--
-- Certaines courses contiennent des ex-aequo ou des collisions de "place".
-- La contrainte UNIQUE (race_id, place) bloque alors l'import complet.
-- On remplace donc cet index unique par un index non-unique pour conserver
-- les performances de lecture sans perdre de lignes valides.
-- =============================================================================

drop index if exists public.pigeon_results_race_place_idx;

create index if not exists pigeon_results_race_place_idx
  on public.pigeon_results (race_id, place);
