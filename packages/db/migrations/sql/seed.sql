-- =============================================================================
-- seed.sql
--
-- Donnees de reference stables : les 21 regions colombophiles francaises.
-- A executer une fois apres la creation des tables. Idempotent (on conflict do
-- nothing).
--
-- Source : https://www.francolomb.com/fr/resultats-championnats-par-region/
-- =============================================================================

insert into public.regions (number, name, francolomb_slug) values
  (1,  '1ere Region - Federation Colombophile Nord Pas de Calais', '1ere-region'),
  (2,  '2eme Region - Federation Colombophile de Picardie', '2eme-region'),
  (3,  '3eme Region - Federation Colombophile de Seine Maritime', '3eme-region'),
  (4,  '4eme Region', '4eme-region'),
  (5,  '5eme Region', '5eme-region'),
  (6,  '6eme Region - Federation Colombophile de la 6eme Region', '6eme-region'),
  (7,  '7eme Region - Federation Colombophile de la 7eme Region', '7eme-region'),
  (8,  '8eme Region - Federation Colombophile de la 8eme Region', '8eme-region'),
  (9,  '9eme Region', '9eme-region'),
  (10, '10eme Region', '10eme-region'),
  (11, '11eme Region', '11eme-region'),
  (12, '12eme Region - Entente Limousin Poitou Charente', '12eme-region'),
  (13, '13eme Region', '13eme-region'),
  (14, '14eme Region - Federation Colombophile de la 14eme Region', '14eme-region'),
  (15, '15eme Region - Federation Colombophile de la 15eme Region', '15eme-region'),
  (16, '16eme Region', '16eme-region'),
  (17, '17eme Region', '17eme-region'),
  (18, '18eme Region - Groupement des Landes', '18eme-region'),
  (19, '19eme Region', '19eme-region'),
  (20, '20eme Region', '20eme-region'),
  (21, '21eme Region - Federation Colombophile d''Ile de France', '21eme-region')
on conflict (number) do nothing;

-- Les clubs, groupements et ententes seront peuples par le scraper au fur et
-- a mesure. On ne seed pas ici pour eviter de partir avec des donnees
-- potentiellement perimees (les clubs changent de nom, disparaissent, etc).
