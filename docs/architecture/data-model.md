# Modele de donnees, Colombo

Source de verite pour la base de donnees. Toute modification passe par une
migration Drizzle plus mise a jour de ce fichier plus ADR si changement
structurel.

## Principes directeurs

1. Le `matricule` est la cle de voute. Primary key sur `pigeons`, join key
   partout ailleurs. Jamais remplace par un UUID.
2. Row Level Security obligatoire sur toutes les tables exposees a l'app.
3. Donnees publiques contre privees clairement separees :
   - Publiques : `races`, `pigeon_results`, `clubs`, `regions` (deja diffusees
     par francolomb)
   - Privees : `users`, `lofts`, `pigeons`, `pedigrees`, `trainings`, `notes`
4. Pas de `CASCADE DELETE` entre pigeons et resultats historiques. Un pigeon
   vendu ou transfere garde sa carriere dans `pigeon_results`.
5. Tous les timestamps en UTC, colonne `created_at TIMESTAMPTZ NOT NULL
   DEFAULT now()`.
6. Soft delete via `deleted_at TIMESTAMPTZ` pour les entites utilisateur,
   pas de delete physique.
7. Index sur toutes les FK plus index partiels pour les soft deletes.

## Vue d'ensemble

```
USERS (1:N) LOFTS (1:N) PIGEONS (1:N) PIGEON_RESULTS (N:1) RACES (N:1) CLUBS (N:1) REGIONS
                           |                                  |
                           +- PEDIGREES (self-join)           +- RACE_PDFS
                           +- TRAININGS
                           +- PIGEON_NOTES

USERS (1:N) SUBSCRIPTIONS (Stripe)
RACES (1:N) RACE_AMATEUR_STATS
```

## Enums Postgres

```sql
CREATE TYPE race_category AS ENUM (
  'vitesse',
  'petit_demi_fond',
  'demi_fond',
  'grand_demi_fond',
  'fond',
  'grand_fond',
  'jeunes'
);

CREATE TYPE pigeon_age_class AS ENUM ('vieux', 'jeune');

CREATE TYPE user_plan AS ENUM ('free', 'eleveur', 'club');

CREATE TYPE subscription_status AS ENUM (
  'trialing', 'active', 'past_due', 'canceled', 'incomplete'
);

CREATE TYPE pdf_type AS ENUM ('resultat_concours', 'doublage_club');

CREATE TYPE parse_status AS ENUM ('pending', 'success', 'partial', 'quarantine');
```

## Tables

### `users`, comptes eleveurs

Gere par Supabase Auth (`auth.users`). On complete par une table `public.users`.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | `uuid` | PK, FK vers `auth.users(id)` | |
| `email` | `text` | NOT NULL, UNIQUE | |
| `display_name` | `text` | | Nom affiche |
| `plan` | `user_plan` | NOT NULL DEFAULT `'free'` | |
| `stripe_customer_id` | `text` | UNIQUE | Rempli apres 1er paiement |
| `phone` | `text` | | Support WhatsApp optionnel |
| `onboarded_at` | `timestamptz` | | NULL si onboarding non fini |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` | |
| `deleted_at` | `timestamptz` | | Soft delete RGPD |

RLS :
- `SELECT` : `auth.uid() = id`
- `UPDATE` : `auth.uid() = id`
- `DELETE` : via RPC `delete_user_account(uuid)` seulement

Index : UNIQUE sur `email`, UNIQUE partiel sur `stripe_customer_id`.

### `subscriptions`, abonnements Stripe

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | `uuid` | PK DEFAULT `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL, FK vers `users(id)` |
| `stripe_subscription_id` | `text` | NOT NULL, UNIQUE |
| `stripe_price_id` | `text` | NOT NULL |
| `status` | `subscription_status` | NOT NULL |
| `plan` | `user_plan` | NOT NULL |
| `current_period_end` | `timestamptz` | NOT NULL |
| `cancel_at_period_end` | `boolean` | NOT NULL DEFAULT `false` |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT `now()` |

RLS : `SELECT` seulement, `auth.uid() = user_id`. Ecritures via webhook Stripe
(service role).

Index : UNIQUE sur `stripe_subscription_id`, index sur `(user_id, status)`.

### `lofts`, pigeonniers

Un eleveur peut avoir plusieurs pigeonniers (rare mais possible).

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | `uuid` | PK DEFAULT `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL, FK vers `users(id)` |
| `name` | `text` | NOT NULL |
| `address` | `text` | |
| `latitude` | `numeric(9,6)` | |
| `longitude` | `numeric(9,6)` | |
| `licence_number` | `text` | Numero FCF de l'eleveur |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` |
| `deleted_at` | `timestamptz` | |

RLS : toutes operations conditionnees a `auth.uid() = user_id`.

Index : `(user_id) WHERE deleted_at IS NULL`.

### `pigeons`, pigeons individuels

La table centrale. `matricule` est la PK, pas un UUID.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `matricule` | `varchar(20)` | PK | Format `FR-123456-26-F` |
| `loft_id` | `uuid` | FK vers `lofts(id)` | NULL si pigeon orphelin |
| `country_iso` | `char(2)` | NOT NULL | Derive du matricule |
| `year_of_birth` | `smallint` | NOT NULL | 4 chiffres, calcule |
| `is_female` | `boolean` | NOT NULL | Derive du suffixe F |
| `name` | `text` | | Nom donne par l'eleveur |
| `color` | `text` | | bleu, rouge, ecaille, etc |
| `father_matricule` | `varchar(20)` | FK vers `pigeons(matricule)` | Pedigree partiel OK |
| `mother_matricule` | `varchar(20)` | FK vers `pigeons(matricule)` | |
| `breeder_matricule` | `text` | | Matricule eleveur, licence |
| `notes` | `text` | | Notes libres |
| `photo_url` | `text` | | Supabase Storage |
| `acquired_at` | `date` | | Arrivee dans le pigeonnier |
| `sold_at` | `date` | | |
| `deceased_at` | `date` | | |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` | |
| `deleted_at` | `timestamptz` | | |

Notes :

Un pigeon peut exister avec `loft_id = NULL`, c'est un pigeon orphelin vu dans
un resultat scrape mais dont aucun eleveur Colombo n'est proprietaire. Utile
pour l'effet "on a retrouve X pigeons a votre nom".

Les FK `father_matricule`, `mother_matricule` sont `ON DELETE SET NULL` pour
tolerer les pedigrees partiels.

Les FK sur `pigeons` ne font jamais `ON DELETE CASCADE`.

RLS :
- `SELECT` : `loft_id IS NULL OR loft_id IN (SELECT id FROM lofts WHERE user_id = auth.uid())`
- `INSERT / UPDATE / DELETE` : si `loft_id` appartient a `auth.uid()`

Index :
- `(loft_id) WHERE deleted_at IS NULL`
- `(country_iso, year_of_birth)`
- `(father_matricule)`, `(mother_matricule)`
- Full-text sur `name` et `breeder_matricule`

### `regions`, 21 regions colombophiles

Referentiel quasi statique.

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | `uuid` | PK |
| `number` | `smallint` | NOT NULL, UNIQUE |
| `name` | `text` | NOT NULL |
| `francolomb_slug` | `text` | URL slug Francolomb |

RLS : `SELECT` public (USING `true`).

### `clubs`, clubs, societes, groupements

Hierarchie : Region, Groupement, Club, Societe. Modelisation uniforme avec
`type` et `parent_club_id` optionnel.

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | `uuid` | PK |
| `region_id` | `uuid` | NOT NULL, FK |
| `parent_club_id` | `uuid` | FK vers `clubs(id)`, NULL |
| `name` | `text` | NOT NULL |
| `type` | `text` | federation, groupement, entente, club, societe |
| `francolomb_url` | `text` | UNIQUE si present |
| `city` | `text` | |

RLS : `SELECT` public.

Index : `(region_id)`, `(parent_club_id)`, `(francolomb_url) WHERE francolomb_url IS NOT NULL`.

### `races`, concours

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `francolomb_id` | `text` | UNIQUE | Cle de dedup, ex 260007 |
| `club_id` | `uuid` | NOT NULL, FK | Organisateur |
| `race_date` | `date` | NOT NULL | Date du lacher |
| `release_time` | `time` | | Heure, ex 10:30 |
| `release_point` | `text` | NOT NULL | Ex Lamotte Beuvron |
| `release_lat` | `numeric(9,6)` | | A geocoder |
| `release_lng` | `numeric(9,6)` | | |
| `category` | `race_category` | NOT NULL | |
| `age_class` | `pigeon_age_class` | NOT NULL | vieux ou jeune |
| `pigeons_released` | `integer` | | Ex 1052 |
| `distance_min_km` | `integer` | | Pt avant |
| `distance_max_km` | `integer` | | Pt extreme |
| `mises_schema` | `jsonb` | | Liste des mises dispos |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` | |

RLS : `SELECT` public. Ecritures via service role uniquement (scraper).

Index : `(race_date DESC)`, `(club_id, race_date DESC)`, UNIQUE sur
`francolomb_id`.

### `race_pdfs`, fichiers source et tracabilite

Un concours peut avoir plusieurs PDF associes (resultat plus doublages).

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | `uuid` | PK |
| `race_id` | `uuid` | NOT NULL, FK |
| `pdf_url` | `text` | NOT NULL |
| `type` | `pdf_type` | NOT NULL |
| `content_hash` | `char(64)` | NOT NULL, UNIQUE (SHA-256) |
| `storage_path` | `text` | NOT NULL |
| `parse_status` | `parse_status` | NOT NULL DEFAULT `'pending'` |
| `parse_method` | `text` | pdfplumber, claude-haiku, manual |
| `parse_error` | `text` | |
| `downloaded_at` | `timestamptz` | NOT NULL DEFAULT `now()` |
| `parsed_at` | `timestamptz` | |

RLS : `SELECT` public. Ecritures scraper uniquement.

Index : `(race_id)`, UNIQUE sur `content_hash`, `(parse_status) WHERE parse_status != 'success'`.

### `pigeon_results`, classements

La table qui porte toute la valeur metier. Ligne = un pigeon arrive dans un
concours.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `race_id` | `uuid` | NOT NULL, FK | |
| `pigeon_matricule` | `varchar(20)` | NOT NULL, FK vers `pigeons(matricule)` | |
| `amateur_display_name` | `text` | NOT NULL | Nom scrape depuis le PDF |
| `society_name` | `text` | | Societe a l'enlogement |
| `place` | `integer` | NOT NULL | Classement global |
| `n_pigeon_amateur` | `integer` | | Numero chez son eleveur |
| `n_constatation` | `integer` | | Ex 21 dans 21/41 |
| `n_engagement` | `integer` | | Ex 41 dans 21/41 |
| `distance_m` | `integer` | | Distance effective |
| `clocked_at_time` | `time` | NOT NULL | Heure de constatation |
| `velocity_m_per_min` | `numeric(7,3)` | NOT NULL | Ex 1283.359 |
| `ecart_code` | `text` | | Codes bruts, J, R 1, A 1, M |
| `mise_type` | `text` | | U-M, M, etc |
| `mise_eur` | `numeric(6,2)` | | Ex 2.15 |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` | |

Contrainte : UNIQUE `(race_id, pigeon_matricule)`.

RLS : `SELECT` public.

Index :
- `(pigeon_matricule, race_id)` le plus important
- `(race_id, place)` pour afficher un classement
- `(amateur_display_name)` pour matcher par nom

### `race_amateur_stats`, stats par amateur par concours

Pre-calcule depuis la Section 2 du PDF, evite les agregations couteuses.

| Colonne | Type | Contraintes |
|---|---|---|
| `race_id` | `uuid` | NOT NULL, FK |
| `amateur_display_name` | `text` | NOT NULL |
| `society_name` | `text` | |
| `pigeons_engaged` | `integer` | NOT NULL |
| `pigeons_classed` | `integer` | NOT NULL |
| `success_rate` | `numeric(5,2)` | NOT NULL |
| `total_mise_eur` | `numeric(8,2)` | NOT NULL DEFAULT 0 |
| `places` | `integer[]` | NOT NULL |
| PK | | `(race_id, amateur_display_name)` |

RLS : `SELECT` public.

### `pedigrees`, arbre genealogique enrichi

Les FK `father_matricule`, `mother_matricule` sur `pigeons` gerent la structure.
Cette table stocke seulement les meta-donnees enrichies facultatives.

| Colonne | Type | Contraintes |
|---|---|---|
| `pigeon_matricule` | `varchar(20)` | PK, FK |
| `pdf_url` | `text` | Pedigree officiel scanne |
| `notes_ascendance` | `text` | |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT `now()` |

RLS : herite des regles de `pigeons`.

### `trainings`, carnet d'entrainement

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | `uuid` | PK |
| `pigeon_matricule` | `varchar(20)` | NOT NULL, FK |
| `training_date` | `date` | NOT NULL |
| `release_point` | `text` | |
| `distance_km` | `integer` | |
| `return_time` | `time` | |
| `weather` | `text` | |
| `notes` | `text` | |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` |

RLS : via `pigeon_matricule` puis `loft_id` puis `user_id = auth.uid()`.

Index : `(pigeon_matricule, training_date DESC)`.

### `pigeon_notes`, notes libres horodatees

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | `uuid` | PK |
| `pigeon_matricule` | `varchar(20)` | NOT NULL, FK |
| `body` | `text` | NOT NULL |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` |

RLS : via ownership de `pigeons.loft_id`.

## Policies RLS, template type

Pour toute nouvelle table possedee indirectement par l'utilisateur :

```sql
ALTER TABLE public.X ENABLE ROW LEVEL SECURITY;

CREATE POLICY "X_select_own" ON public.X
  FOR SELECT USING (<condition_de_ownership>);

CREATE POLICY "X_insert_own" ON public.X
  FOR INSERT WITH CHECK (<condition_de_ownership>);

CREATE POLICY "X_update_own" ON public.X
  FOR UPDATE USING (<condition_de_ownership>)
  WITH CHECK (<condition_de_ownership>);

CREATE POLICY "X_delete_own" ON public.X
  FOR DELETE USING (<condition_de_ownership>);
```

Pour les tables publiques (`regions`, `clubs`, `races`, `pigeon_results`,
`race_pdfs`, `race_amateur_stats`) :

```sql
ALTER TABLE public.X ENABLE ROW LEVEL SECURITY;
CREATE POLICY "X_public_read" ON public.X FOR SELECT USING (true);
```

## Fonctions RPC utiles

### `find_pigeons_by_amateur_name(search text)`

Recherche fuzzy sur `amateur_display_name` dans `pigeon_results`, groupe par
`pigeon_matricule`, retourne matricule plus derniere vue. Onboarding magique.
Security definer, rate limite via Upstash.

### `claim_orphan_pigeons(matricules text[], loft_id uuid)`

Attache des pigeons orphelins (`loft_id IS NULL`) a un pigeonnier. Security
definer, verifie que `auth.uid()` est bien proprietaire du `loft_id` et que
les pigeons etaient bien orphelins.

### `delete_user_account(target uuid)`

Cascade RGPD, supprime les donnees personnelles (lofts, notes, trainings),
conserve les `pigeon_results` (publics), anonymise `amateur_display_name` si
necessaire. Security definer, verifie `auth.uid() = target`.

## Evolutions prevues (hors MVP)

- `championships`, championnats (agregats sur plusieurs concours)
- `pigeon_photos`, galerie
- `health_records`, carnet sanitaire
- `breedings`, couples reproducteurs
- `clubs_members`, adherents pour plan Club 29 euros
- `listings`, marketplace de cession (bien plus tard)

## Journal des changements

| Date | Version | Changement |
|---|---|---|
| 2026-04-22 | 0.1 | Schema initial, base PDF R21_EESE Lamotte-Beuvron |
