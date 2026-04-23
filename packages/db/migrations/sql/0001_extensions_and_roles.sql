-- =============================================================================
-- 0001_extensions_and_roles.sql
--
-- Extensions Postgres et roles Supabase necessaires avant toute autre
-- migration. A appliquer en premier, avant les migrations Drizzle.
--
-- Supabase preinstalle deja la plupart des extensions, mais on les active
-- explicitement pour etre reproductible en local (supabase start).
-- =============================================================================

-- pgcrypto : gen_random_uuid() pour les PK uuid
create extension if not exists "pgcrypto" with schema "extensions";

-- pg_trgm : recherche fuzzy sur les noms d'amateurs
create extension if not exists "pg_trgm" with schema "extensions";

-- citext : email case-insensitive (optionnel, on n'utilise pas pour l'instant)
-- create extension if not exists "citext" with schema "extensions";

-- Les roles authenticated, anon, service_role sont preexistants sur Supabase.
-- En local (supabase start) ils sont crees automatiquement par le setup.

-- On revoque tout sur public par defaut, on attribue explicitement plus loin.
revoke all on schema public from public;
grant usage on schema public to authenticated, anon, service_role;
