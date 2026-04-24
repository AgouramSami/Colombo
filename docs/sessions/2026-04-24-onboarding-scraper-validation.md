# Session du 24 avril 2026 (suite) — Onboarding effet magique + validation parser

## Ce qui a ete fait

### Onboarding "effet magique" (PR #5, feat/onboarding-magic)

#### Middleware (apps/web/src/middleware.ts)
- 4 regles de redirection selon `onboarded_at` :
  1. Non connecte sur route protegee → /login
  2. Connecte sur /login → /onboarding (non onboarde) ou /pigeonnier (onboarde)
  3. Connecte non onboarde sur route protegee → /onboarding
  4. Connecte onboarde sur /onboarding → /pigeonnier
- Requete `SELECT onboarded_at` sur `public.users` a chaque navigation connectee

#### Server Actions (apps/web/src/app/(app)/onboarding/actions.ts)
- `searchPigeonsAction(name)` : appelle la RPC `find_pigeons_by_amateur_name`, valide avec Zod, min 3 chars
- `claimPigeonsAction(matricules, loftName)` : cree le loft, appelle `claim_orphan_pigeons`, met a jour `onboarded_at`
  - Gestion des echecs partiels (pigeons deja revendiques par un autre compte)

#### Page /onboarding (Client Component)
- Etape 1 : champ de recherche, etats de chargement a 0s/2s/5s, shake sur champ vide
- Etape 2 : 3 cas geres
  - Cas A (normal) : liste pigeons, cases a cocher (toutes cochees par defaut), compteur live
  - Cas B (nom ambigu) : selecteur radio par nom distinct
  - Cas C (aucun resultat) : message positif + reessayer + continuer manuellement
- Champ nom de pigeonnier (defaut "Mon pigeonnier", editable) : apparait en cas A et cas C
- Etape 3 : ecran de confirmation, message discret si echec partiel, bouton vers /pigeonnier

#### Page /pigeonnier stub (apps/web/src/app/(app)/pigeonnier/page.tsx)
- Affiche nom du loft, compteur de pigeons, grille des pigeons

#### Infrastructure tests
- `playwright.config.ts` : chromium, workers=1, baseURL localhost:3000
- `e2e/helpers/admin.ts` : createTestUser, deleteTestUser, signInAsTestUser (magic link admin), seedTestPigeon, cleanupTestPigeon
- `e2e/onboarding.spec.ts` : happy path + cas C
- `e2e/middleware.spec.ts` : 2 tests redirect

#### Autres
- `lib/supabase/rpc.ts` : schema Zod PigeonSearchResultSchema
- `tailwind.config.ts` : animation animate-shake
- `@playwright/test` ajoute en devDependency

### Validation parser PDF Francolomb (PR #6, feat/scraper-pdf-fixtures)

#### 5 PDFs deposes dans apps/scraper/fixtures/
- `2025-07-27-La-Salvetat-Jeunes-1.pdf` (non-CLAPI, Gascogne/Pays Basque, 69 lignes)
- `2025-08-03-Chateauroux-1-An-19.pdf` (non-CLAPI, Somme, 129 lignes)
- `R21_EESE_2026-04-19-Issoudun-Vieux.pdf` (CLAPI R21, 363 lignes)
- `R21_FEDE_2025-07-28-Marsac-Jeunes.pdf` (CLAPI R21, 64 lignes)
- `R21_GOUEST_2026-04-12-Salbris-Vieux.pdf` (CLAPI R21, 148 lignes)

#### Bugs corriges dans pdf_parser.py
| Bug | Fix |
|---|---|
| francolomb_id = UNKNOWN | Extrait de la fin de ligne 1 avec `re.search(r"\b(\d{6})\s*$", lines[0])` |
| pigeons_released = None | `l[aâ]ch` pour matcher `lâchés` |
| release_time = None | `[aà]\s+` pour matcher `à 09:35` |
| distance = None | `extr[eê]me` pour matcher `extrême` |
| ecart_code = temps constate | Saute le 2e HH:MM:SS si le PDF le duplique |
| Lignes incompletes FR 650 23 | MATRICULE_RE min 3 chiffres (etait 4) |
| Categorie : 1 an non mappee | AGE_MAP : "1 an" → PigeonAgeClass.jeune |

#### Resultats finaux sur 5 PDFs
| PDF | Lignes | Confiance |
|---|---|---|
| La-Salvetat-Jeunes | 69 | 100% |
| Chateauroux-1-An | 129 | 100% |
| R21-EESE-Issoudun-Vieux | 363 | 98% |
| R21-FEDE-Marsac-Jeunes | 64 | 98% |
| R21-GOUEST-Salbris-Vieux | 148 | 99% |

18/18 tests verts.

#### Cas limites identifies, a confirmer avec l'expert metier
- `DV 88.2144 25` dans R21_FEDE : matricule avec separateur de milliers, format inconnu (2% echecs R21)
- Codes ecart `R 1`, `A 1` : signification a confirmer pour alimenter le glossaire
- `category` (vitesse/fond/etc.) absent des headers PDF : utilise le defaut vitesse

## Etat des branches

| Branche | PR | Etat |
|---|---|---|
| feat/onboarding-magic | #5 | Ouverte, prete a merger |
| feat/scraper-pdf-fixtures | #6 | Ouverte, prete a merger |
| main | — | Propre |

## Decisions prises cette session

- Onboarding : 1 seule page (pas de routes separees par etape), transition CSS douce
- Nom pigeonnier personnalisable des l'onboarding (pas force a "Mon pigeonnier")
- Playwright tests : e2e/ exclue du tsconfig principal (tsconfig propre a e2e/)
- Parser Tier 2 (LLM fallback) non necessaire : Tier 1 >= 98% sur tous les PDFs reels

## Prochaines etapes priorisees

### Immediat (apres merge des 2 PRs)
- [ ] Merger PR #5 et PR #6
- [ ] Ajouter `SUPABASE_SERVICE_ROLE_KEY` au dashboard GitHub Actions (secrets)
      pour que les tests E2E passent en CI
- [ ] Confirmer avec l'expert metier : DV 88.2144, R 1, A 1, M, u-M (glossaire)

### Court terme
- [ ] Fiche pigeon : resultats de concours, pedigree
- [ ] Crawleur Francolomb : mettre en prod (Railway ou Fly.io)
- [ ] Landing page de validation (Framer ou Next.js)

### Moyen terme
- [ ] Integration Stripe (freemium : gratuit 3 pigeons, Eleveur 9 euros/mois)
- [ ] Parser Tier 2 LLM (Claude Haiku) : declencher si confiance < 90%
      (non urgent, Tier 1 couvre deja les PDFs disponibles)

## Prompt de reprise

```
Bonjour. Je reprends le projet Colombo.

Lis dans cet ordre :
1. CLAUDE.md a la racine
2. docs/sessions/2026-04-24-onboarding-scraper-validation.md (cette session)
3. git log --oneline -10

Contexte : PR #5 (onboarding) et PR #6 (scraper) sont ouvertes.
Demander sur quoi travailler avant de coder.
```
