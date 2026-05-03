# Colombo, contexte projet pour Claude Code

Ce fichier est lu automatiquement a chaque session. Il reste court a dessein.
Les details sont dans `docs/` et `.claude/skills/`, lus a la demande.

## 1. Qu'est-ce que Colombo

Colombo est un SaaS B2C a destination des colombophiles francais (eleveurs de
pigeons voyageurs de competition). Son but : gerer un pigeonnier de A a Z et
importer automatiquement les resultats de concours depuis les sites officiels
des federations francaises.

Cible : environ 50 000 colombophiles actifs en France, moyenne d'age 60 ans
et plus.

Friction resolue : aujourd'hui, les colombophiles vont sur
`francolomb.com/fr/resultats-championnats-par-region/` et recuperent a la main
des PDFs de resultats disperses sur des dizaines de sites de clubs regionaux.

Promesse : "Tapez votre matricule, retrouvez toute la carriere de vos pigeons."

Business model : freemium, gratuit pour 3 pigeons, Eleveur 9 euros par mois,
Club 29 euros par mois.

## 2. Documentation de reference, a lire quand pertinent

| Besoin | Fichier |
|---|---|
| Vocabulaire metier (eleveur, lacher, doublage, mises) | `docs/domain/glossaire.md` |
| Structure des PDFs Francolomb | `docs/domain/francolomb-pdf-structure.md` |
| Schema complet base de donnees et RLS | `docs/architecture/data-model.md` |
| Workflow git, branches, commits, releases | `docs/architecture/git-workflow.md` |
| Stack technique et justifications | `docs/architecture/stack.md` |
| Regles de manipulation des matricules | `.claude/skills/pigeon-matricule/SKILL.md` |
| Regles de scraping et parsing Francolomb | `.claude/skills/francolomb-scraper/SKILL.md` |
| Decisions d'architecture historiques | `docs/decisions/` (ADRs) |
| Journal des sessions precedentes | `docs/sessions/` |

Regle : avant de coder quoi que ce soit qui touche a un de ces domaines, lire
le fichier correspondant. Ne pas reinventer ce qui est deja documente.

## 3. Stack, resume

Front et API : Next.js 15 App Router, TypeScript strict, Tailwind utilitaire +
CSS maison Terroir (tokens `.cb-*` dans `apps/web/src/app/globals.css`), Server
Components + Server Actions, Zod aux frontieres externes.

DB, Auth, Storage : Supabase (Postgres, region Paris eu-west-3, t4g.nano), Drizzle ORM.

Scraper : Python 3.12, Playwright, pdfplumber (fallback Claude Haiku).

Paiement : Stripe, Stripe Tax (a brancher).

Hebergement : Vercel (web), Railway ou Fly.io (scraper).

Qualite : Biome, Vitest, Playwright, Sentry, PostHog.

Package manager : pnpm (monorepo workspace).

Details et justifications dans `docs/architecture/stack.md` + section 14
ci-dessous pour les decisions techniques actuelles.

## 4. Contraintes UX non negociables (cible senior 60 ans et plus)

Police minimum 16px, titres 24px et plus.

Contraste AAA, a tester avec Axe.

Cibles tactiles 48x48px minimum.

Pas de hover-only.

Vouvoiement, copie FR sans anglicismes tech.

Bouton aide visible avec lien WhatsApp direct.

## 5. Securite et RGPD, non negociable

RLS Supabase activee sur toutes les tables. Table sans RLS, PR refusee.

Secrets en `.env.local`, jamais committes. `.env.example` a jour.

Pas de PII dans les logs, remplacer par `<pigeon:matricule>`, `<user:id>`.

Hebergement Supabase region UE uniquement (Paris eu-west-3 actuellement).

Bouton "Supprimer mon compte" qui purge reellement (cascade).

## 6. Conventions de code

Commits : Conventional Commits. Pas de "WIP".

Branches : `feat/...`, `fix/...`, `chore/...`. Branche par defaut `main`.

PRs : max 400 lignes sauf migrations.

TypeScript : `strict: true`, `noUncheckedIndexedAccess: true`. Jamais `any`.

Fichiers : `kebab-case.tsx` pour React, `kebab-case.ts` pour utils.

Pas de `utils.ts`, `helpers.ts`, `common.ts` fourre-tout.

Validation Zod a toute frontiere d'API ou d'input externe.

## 7. Commandes projet

```bash
pnpm dev              # Next.js en dev
pnpm dev:scraper      # scraper Python en dev
pnpm db:generate      # genere une migration Drizzle
pnpm db:migrate       # applique les migrations (dev)
pnpm db:studio        # UI Drizzle
pnpm lint             # Biome
pnpm typecheck        # tsc --noEmit
pnpm test             # Vitest
pnpm test:e2e         # Playwright
```

## 8. Economie de tokens et optimisation du contexte

Chaque token envoye a un cout financier et ralentit la reponse. Claude Code
doit etre le plus frugal possible sans sacrifier la qualite.

### 8.1 Lecture de fichiers

Ne jamais relire un fichier deja lu dans la session en cours. Referencer le
contenu memorise plutot que relancer `view`.

Avant d'ouvrir un fichier, se demander si le nom ou une lecture partielle
suffit. Un `data-model.md` de 800 lignes ne merite pas une lecture complete
pour une question sur une seule table.

Preferer la lecture par plage (`view_range`) pour cibler une zone d'un gros
fichier.

Ne jamais lire les fichiers listes dans `.claudeignore` (lockfiles, PDFs,
builds, assets). Si necessaires, demander confirmation avant de les charger.

### 8.2 Recherche dans le code

Eviter `grep -r` sur la racine du repo. Cibler un dossier precis :
`packages/shared/` ou `apps/scraper/src/`.

Preferer les commandes qui tronquent la sortie : `head -50`, `grep -m 20`,
pipe vers `head`.

Eviter `ls -R` sur le repo entier. Utiliser `tree -L 2` ou `ls <dossier>`.

Pour trouver un symbole, preferer les outils AST (`ast-grep`, ts-node compiler
API) plutot que du grep textuel qui ramene du bruit.

### 8.3 Execution de commandes

Tests avec `--reporter=dot` ou `--silent` pour reduire la sortie. Exemple :
`pnpm test --reporter=dot`.

Builds : rediriger les logs verbeux, `pnpm build 2>&1 | tail -30` si on veut
juste le resultat.

`pnpm install` avec `--silent` une fois l'install connue comme stable.

Ne pas imprimer les variables d'environnement ni des objets JSON geants. Si
debug, imprimer seulement 3 a 5 champs pertinents.

Jamais de `cat` sur un fichier binaire ou un lockfile.

### 8.4 Reponses de Claude

Pas de re-explication du contexte projet a chaque message. Le CLAUDE.md est
deja en contexte.

Pas de resume du code qu'on vient d'ecrire, sauf si demande.

Pour les changements, preferer `str_replace` a la reecriture complete. Un
`str_replace` de 10 lignes coute 10 fois moins qu'un rewrite de 200 lignes.

Repondre a la question posee, pas aux questions voisines. Pas de "en bonus
je te fais aussi X".

Pas de liste a puces quand une phrase suffit. Pas d'introduction ni de
conclusion de politesse.

Pour les diffs longs, montrer seulement les hunks modifies.

### 8.5 Gestion du contexte de session

Quand la conversation depasse 30 a 40 tours, proposer `/compact` (si
disponible) ou creer une note de session et repartir propre.

Pour les taches longues, suggerer de scinder en sous-sessions ciblees.

A la fin de chaque session productive, creer `docs/sessions/YYYY-MM-DD-<titre>.md`
avec ce qui a ete fait, les decisions, les TODO, et le prompt de reprise.

### 8.6 Modele selon la tache

| Tache | Modele recommande | Raison |
|---|---|---|
| Reformater, renommer, petites corrections | Claude Haiku | 10 a 15x moins cher, suffisant |
| Ecriture de code, tests, refactor local | Claude Sonnet | Bon compromis qualite prix |
| Architecture, modele de donnees, decisions | Claude Opus | Reserve aux moments strategiques |
| Generation de texte long, doc | Claude Sonnet | Pas besoin d'Opus |

Signaler explicitement quand une tache merite Opus au lieu de rester par
defaut sur le modele en cours.

### 8.7 Outils a privilegier

`str_replace` sur les fichiers existants au lieu de reecrire.

`bash_tool` avec des commandes qui filtrent la sortie.

Demander confirmation avant une commande couteuse : `pnpm test:e2e` complet,
`git log --all`, dump SQL entier.

Utiliser les MCP quand dispo (Supabase MCP pour la DB plutot que copier-coller
des schemas dans la conversation).

### 8.8 Signaux que le contexte est sature

Plus de 5 lectures du meme fichier dans la session.

Plus de 3 reecritures completes d'un fichier quand des `str_replace` auraient
suffi.

Reponse qui se repete sur des sujets deja traites.

Grosse commande (install, build, tests complets) lancee plus de 2 fois.

Dans ces cas, proposer `/compact`, note de session, ou redemarrage avec un
prompt plus cible.

### 8.9 Regles a ne jamais transgresser

Ne pas lire `.claudeignore`, `.env*`, `node_modules`, `*.pdf`, lockfiles.

Ne pas "relire tout le projet avant de commencer". Lecture a la demande.

Ne pas coller la sortie complete d'une commande en reponse. Resumer ou tronquer.

Ne pas recopier un fichier source existant pour "montrer ce qui va changer".
Un diff suffit.

## 9. Ce que Claude Code doit toujours faire

Lire `docs/domain/glossaire.md` avant toute question de vocabulaire metier.

Lire `docs/architecture/data-model.md` avant toute modif de DB.

Utiliser les helpers de `packages/shared/` (matricule, categories) au lieu de
reecrire.

Ecrire les tests en meme temps que le code.

Valider les inputs externes avec Zod.

Proposer une migration Drizzle, jamais d'`ALTER TABLE` manuel.

Verifier les RLS policies a chaque nouvelle table.

Poser une question avant de generer 200 lignes et plus sur une decision
d'architecture.

## 10. Ce que Claude Code ne doit jamais faire

Installer des dependances sans demander.

Toucher a `pnpm-lock.yaml` a la main.

Creer `utils.ts`, `helpers.ts`, `common.ts`.

Ajouter `any` TypeScript.

Desactiver une regle Biome sans commentaire plus ticket.

Scraper plus vite que le rate limit (1 req / 2s francolomb, 1 req / 5s sites
clubs).

Utiliser "user" comme variable cote UI. On dit `eleveur`.

Inventer du vocabulaire metier. En cas de doute, TODO plus demander.

Utiliser des tirets cadratins ou des emojis dans le code, les commentaires,
la documentation ou les commits.

## 11. Decisions ouvertes

- [ ] Partenariat FCF, Francolomb : a contacter
- [ ] Nom : Colombo (apostrophe). Dispos `.fr`, `.com`, INPI a verifier
- [ ] Fallback LLM PDF : Claude Haiku contre GPT-4o-mini (benchmark a faire)
- [ ] Paiement : Stripe direct ou Lemon Squeezy (TVA auto)

## 12. Personnes et roles

Fondateur : dev solo, PO.

Expert metier : colombophile actif, beta-testeur n 1, joignable par telephone.

Claude Code : pair programmer.

## 13. Protocole de reprise de session

Quand une nouvelle session Claude Code demarre :

1. Lire ce `CLAUDE.md` (automatique)
2. Verifier `docs/decisions/` pour les dernieres ADRs
3. Lancer `git status` et `git log --oneline -10` pour voir ou on en est
4. Lire le dernier fichier `docs/sessions/*.md` s'il existe
5. Demander a l'utilisateur "sur quoi travaille-t-on aujourd'hui" avant de coder

## 14. Decisions techniques actuelles (mini-ADRs inline)

Etat reel du code au 2026-05. A reviser via vraie ADR si on change.

**Pas de tRPC.** On utilise les Server Components + Server Actions Next.js 15
en direct sur Supabase. Validation Zod limitee aux formulaires + endpoints
externes (scraper, webhooks). Si l'app expose une API publique ou un client
mobile dedie, on reverra la decision.

**Pas de shadcn/ui.** Design system maison Terroir : classes `.cb-*` + tokens
CSS dans `apps/web/src/app/globals.css`. Choix dicte par la cible senior 60+
(typographie Fraunces/Source Sans, contrastes AAA, touch targets 52px) et
par l'identite visuelle. Si un composant complexe a11y devient bloquant,
on integrera shadcn de facon ciblee, pas en bulk.

**Charts custom SVG.** Pas de recharts/visx/nivo. Les composants
`LinePerformanceChart`, `MiniBarChart`, `StackBars`, `ChartCard` vivent dans
`apps/web/src/components/performance-charts.tsx`. Bundle leger, controle total
sur le rendu. Reviser si on doit faire de l'interaction lourde (tooltips,
zoom, brush).

**Pas de tests unitaires sur les UI primitives.** KpiCard, EmptyState,
PlaceBadge, WeatherCard, UserMenu, PigeonAddFab : pas encore de tests Vitest.
Couverts indirectement par les e2e Playwright. A combler si une regression
survient.

**Auth flow.** Supabase SSR via `@supabase/ssr`, middleware racine sur les
routes protegees (`apps/web/src/middleware.ts`). Logout = form POST
`/auth/signout`. Le menu utilisateur (`<UserMenu>`) vit dans la sidebar
desktop ; sur mobile, l'entree Profil de la bottom-bar mene a `/reglages`
qui contient une section Compte avec Aide WhatsApp + Se deconnecter.

**Helpers domaine.** `apps/web/src/lib/colombo-race-labels.ts` pour
CATEGORY_LABELS + AGE_LABELS, `apps/web/src/lib/period-labels.ts`,
`apps/web/src/lib/performance-series.ts`, `apps/web/src/lib/user-race-results.ts`,
`apps/web/src/lib/pigeon-result-race.ts`. Toujours reutiliser, jamais
redeclarer inline.

## Agent skills

### Issue tracker

Issues GitHub sur `AgouramSami/Colombo`. Voir `docs/agents/issue-tracker.md`.

### Triage labels

Labels par defaut (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix).
Voir `docs/agents/triage-labels.md`.

### Domain docs

Single-context. Glossaire dans `docs/domain/glossaire.md`, ADRs dans `docs/decisions/`.
Voir `docs/agents/domain.md`.
