-- =============================================================================
-- 0005_add_pdf_title_to_race_pdfs.sql
--
-- Stocke le titre extrait du PDF (ligne "... du DD/MM/YYYY") pour faciliter
-- les diagnostics et la distinction concours global / doublage.
-- =============================================================================

alter table public.race_pdfs
  add column if not exists pdf_title text;

create index if not exists idx_race_pdfs_pdf_title
  on public.race_pdfs (pdf_title);
