# Session du 24 avril 2026, migrations DB, scraper, CI, auth Next.js

## Ce qui a ete fait

### Migrations Supabase (via MCP)
- 5 migrations appliquees dans l'ordre : extensions + roles, schema Drizzle
  (13 tables, 6 enums, indexes), RLS policies, fonctions + triggers, seed 21 regions
- Correctif applique : find_pigeons_by_amateur_name utilise
  `set search_path = public, extensions` pour que l'operateur % de pg_trgm
  fonctionne (l'extension est dans le schema extensions, pas public)

### packages/shared/src/matricule/
- 5 fichiers : schema.ts (Zod), parse.ts, format.ts, properties.ts, index.ts
- Parser regex structurel qui gere les cas sans separateur (NL1234567/24F)
- 23 tests Vitest, 100% verts

### GitHub Actions CI (.github/workflows/ci.yml)
- Job Node : lint Biome + typecheck tsc + vitest
- Job Python : ruff check + ruff format + pytest

### Scraper Python (apps/scraper/)
- pyproject.toml Python 3.12, deps pdfplumber / pydantic / httpx / tenacity
- src/parser/models.py : modeles Pydantic (RaceMetadata, PigeonResult, ParseResult)
- src/parser/pdf_parser.py : parser Tier 1 pdfplumber avec les regexes du skill
- src/crawler/francolomb.py : crawler rate-limited (1 req/2s, 1 req/5s clubs)
- 10 tests pytest passes, 6 skipped en attente de PDFs dans fixtures/

### Next.js 15 (apps/web/)
- App Router, TypeScript strict, Tailwind v3
- Helpers @supabase/ssr : client browser + server cookies
- Middleware auth : redirect /login si non connecte, /dashboard si connecte
- Page login senior-first : font 18px, cibles 48px, vouvoiement
- Server Action loginAction : signInWithOtp, validation Zod, redirect
- Route /auth/callback : echange code OTP en session
- Route /auth/signout : POST
- Dashboard stub avec email de l'eleveur
- .env.example + .env.local configure avec cles Supabase (Frankfurt)
- Auth magic link teste et valide en local

## Etat des branches et PRs
- main : tout integre (PR #2, #3, #4 mergees, PR #1 fermee comme doublon)
- feat/web-setup : supprimee apres merge

## Supabase
- Projet : ctylccdzyjhubszuejji (Frankfurt)
- URL redirect configuree : http://localhost:3000/auth/callback
- 13 tables avec RLS, 21 regions seedees

## Prochaines etapes priorisees

### Immediat
- [ ] Recevoir les PDFs Francolomb de l'expert metier (au moins 4 PDF varies)
      -> les deposer dans apps/scraper/fixtures/ -> valider confiance >= 90%
- [ ] Recuperer la service_role key Supabase (dashboard > Settings > API)
      et l'ajouter dans .env.local pour le scraper

### Court terme
- [ ] Onboarding "effet magique" : page ou l'eleveur tape son nom, on appelle
      find_pigeons_by_amateur_name, on affiche les pigeons trouves, bouton
      "Revendiquer ces pigeons"
- [ ] Implémenter claim_orphan_pigeons depuis l'UI (Server Action)
- [ ] Page pigeonnier : liste des pigeons de l'eleveur
- [ ] Fiche pigeon : resultats de concours, pedigree

### Moyen terme
- [ ] Integration Stripe (freemium : gratuit 3 pigeons, Eleveur 9 euros/mois)
- [ ] Premiere version du scraper en production (Railway ou Fly.io)
- [ ] Landing page de validation (Framer ou Next.js)

## Decisions prises cette session
- typedRoutes sorti de experimental dans Next.js 15, corrige dans next.config.ts
- .env.local doit etre dans apps/web/ (Next.js charge depuis le dossier du projet)
- Pas de tRPC pour l'instant, Server Actions suffisent pour les premiers ecrans

## Prompt de reprise

```
Bonjour. Je reprends le projet Colombo.

Lis dans cet ordre :
1. CLAUDE.md a la racine
2. docs/sessions/2026-04-24-setup-db-web-auth.md (cette session)
3. git log --oneline -10

Contexte : auth Supabase magic link valide en local. La prochaine etape
est l'onboarding "effet magique" : page ou l'eleveur tape son nom et
retrouve ses pigeons via find_pigeons_by_amateur_name. Attends ma
confirmation avant de coder.
```
