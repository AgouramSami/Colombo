-- =============================================================================
-- 0006_pigeon_pdf_links_security_invoker.sql
--
-- Corrige l'alerte "Security Definer View" en forçant la vue
-- public.pigeon_pdf_links a s'executer avec les droits de l'appelant
-- (SECURITY INVOKER), et non ceux du createur de la vue.
-- =============================================================================

create or replace view public.pigeon_pdf_links
with (security_invoker = true) as
select
  pr.pigeon_matricule,
  pr.race_id,
  rp.id as race_pdf_id,
  rp.pdf_url,
  rp.pdf_title,
  rp.type as pdf_type,
  rp.downloaded_at,
  rp.parsed_at
from public.pigeon_results pr
join public.race_pdfs rp on rp.race_id = pr.race_id;

grant select on public.pigeon_pdf_links to authenticated, anon, service_role;
