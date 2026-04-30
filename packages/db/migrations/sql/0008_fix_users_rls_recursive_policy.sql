-- =============================================================================
-- 0008_fix_users_rls_recursive_policy.sql
--
-- Supprime la policy admins_select_all_users qui causait une récursion infinie :
-- la policy requêtait public.users depuis une policy sur public.users, ce qui
-- faisait échouer tout SELECT sur la table → middleware considérait tous les
-- utilisateurs comme non-onboardés → redirect /onboarding pour tout le monde.
--
-- Le BO admin utilise le service_role client (bypass RLS complet), donc cette
-- policy n'était pas nécessaire.
-- =============================================================================

DROP POLICY IF EXISTS "admins_select_all_users" ON public.users;
