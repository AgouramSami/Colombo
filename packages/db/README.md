# packages/db

Schema de base de donnees, migrations et seed pour Colombo.

## Structure

```
packages/db/
├── src/
│   ├── schema.ts              # Source de verite Drizzle (tables, enums, index)
│   ├── client.ts              # Client Drizzle partage par les apps
│   └── index.ts               # Re-exports publics
├── migrations/
│   ├── drizzle/               # Migrations auto-generees par pnpm db:generate
│   └── sql/                   # Migrations manuelles (RLS, RPC, triggers, seed)
│       ├── 0001_extensions_and_roles.sql
│       ├── 0002_rls_policies.sql
│       ├── 0003_functions_and_triggers.sql
│       └── seed.sql
├── drizzle.config.ts
└── package.json
```

## Philosophie

Drizzle gere tres bien la structure des tables (colonnes, index, contraintes).
Il ne gere pas les fonctionnalites specifiques Supabase Postgres : policies
RLS, fonctions RPC, triggers, grants. Ces fichiers vivent en `.sql` manuel
dans `migrations/sql/` et sont appliques dans l'ordre numerique apres les
migrations Drizzle.

## Ordre d'application

1. `sql/0001_extensions_and_roles.sql` (extensions Postgres, grants de base)
2. Migrations Drizzle dans `drizzle/` (creation des tables et enums)
3. `sql/0002_rls_policies.sql` (activation RLS et policies)
4. `sql/0003_functions_and_triggers.sql` (RPC et triggers)
5. `sql/seed.sql` (donnees de reference, idempotent)

## Commandes

```bash
# Generer une migration Drizzle apres un changement dans schema.ts
pnpm db:generate

# Appliquer toutes les migrations sur la DB pointee par DATABASE_URL
pnpm db:migrate

# Ouvrir Drizzle Studio pour explorer la DB
pnpm db:studio

# Reset complet en local (supabase db reset recommande)
pnpm db:reset
```

## Supabase en local

Pour tester en local sans toucher la prod :

```bash
# Installer le CLI
brew install supabase/tap/supabase

# Demarrer une Supabase locale (Docker requis)
supabase start

# Appliquer toutes les migrations
pnpm db:migrate

# Seed
psql $DATABASE_URL -f migrations/sql/seed.sql
```

L'URL locale est affichee par `supabase start`, copiez-la dans `.env.local` :

```
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

## Ajouter une nouvelle table

1. Editer `src/schema.ts` pour ajouter la table
2. `pnpm db:generate` pour creer la migration
3. Reviewer le SQL genere dans `migrations/drizzle/`
4. Si la table est privee (user-owned) : ajouter une policy dans
   `migrations/sql/0002_rls_policies.sql` ou creer un fichier
   `migrations/sql/XXXX_<nom>.sql` dedie
5. Ne pas oublier les grants
6. `pnpm db:migrate` pour appliquer
7. Mettre a jour `docs/architecture/data-model.md`

## Regle d'or

Une table sans RLS activee est une faille de securite. Toute PR qui ajoute
une table sans sa policy RLS sera refusee.
