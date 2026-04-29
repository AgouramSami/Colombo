-- =============================================================================
-- 0004_pigeon_pdf_links_view.sql
--
-- Vue de commodite pour retrouver rapidement les PDFs associes a un pigeon,
-- via la relation pigeon_results -> races -> race_pdfs.
-- =============================================================================

-- Index de support (idempotents)
create index if not exists idx_pigeon_results_pigeon_race
  on public.pigeon_results (pigeon_matricule, race_id);

create index if not exists idx_race_pdfs_race_id
  on public.race_pdfs (race_id);

-- Vue de lien pigeon <-> PDF source
create or replace view public.pigeon_pdf_links as
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
