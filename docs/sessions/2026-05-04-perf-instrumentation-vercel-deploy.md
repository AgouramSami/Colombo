# Session 2026-05-04 — Perf instrumentation + setup deploy Vercel prod

Session courte centrée sur la mesure perf et la mise en route du déploiement Vercel.

## PRs mergées sur main

| PR | Branch | Commit | Sujet |
|---|---|---|---|
| #16 | `chore/perf-instrumentation` | `a21450a` | Helper `time()` + wrappers loaders |
| #17 | `chore/add-start-script` | `71975bb` | Alias `pnpm start` au root |
| #18 | `chore/align-start-port-3005` | `7069abf` | `next start --port 3005` cohérence dev/prod |
| #19 | `chore/vercel-prod-setup` | `25a1519` | Speed Insights SDK + `vercel.json` régions fra1 |
| #20 | `fix/perf-ignore-next-redirect` | `a4414a6` | `time()` ignore les NEXT_REDIRECT/NOT_FOUND |
| #21 | `fix/vercel-region-paris` | `f13151c` | `vercel.json` régions **cdg1** (Paris, colocalise Supabase eu-west-3) |

## Ce qui a été fait

### 1. Diagnostic perf — instrumentation (PR #16)

Helper `apps/web/src/lib/perf.ts` avec `time<T>(label, fn)` async + `timeSync<T>` sync. Log dans terminal `pnpm dev` ou Vercel logs avec tag `[perf:ok|warn|slow|fail]` selon ms (<200 / 200-500 / >500 / exception). Désactivable via `COLOMBO_PERF=0`.

Wrappers ajoutés sur :
- `loadUserPigeonResults` : total + chunks lofts/pigeons/pigeon_results + log volume
- `loadDashboardData` : total + users + user_badges select/upsert
- `/dashboard`, `/concours`, `/pigeonnier`, `/performance` : total page + auth + chunks

### 2. Mesures effectuées (compte test : 230 pigeons, 988 results, 79 races)

**Dev mode** : warmup 130-300ms par page, mais cold compile Next.js ajoute 200-500ms par première visite d'une route → ressenti 1-2s.

**Prod build (`pnpm start` local)** :
| Page | Cold | Warm |
|---|---|---|
| /pigeonnier | 691ms | 132-158ms |
| /concours | 405ms | 169-207ms |
| /performance | 851ms (1 outlier DB cold) | 164-266ms |
| /dashboard | 713ms (DB cold) | 172-261ms |

Aucune query > 200ms individuellement en warm. Pas de hot path à fixer. **L'app est rapide en prod.** Le ressenti de lenteur venait du dev mode compile.

### 3. Découverte région Supabase

CLAUDE.md disait Frankfurt. Réalité : **Paris (eu-west-3, t4g.nano)**. Corrigé. `vercel.json` aligné sur **cdg1** (Paris) au lieu de fra1.

### 4. Setup Vercel prod (PR #19)

- Installé `@vercel/speed-insights` + intégré dans `apps/web/src/app/layout.tsx` à côté de `<Analytics />`
- Créé `apps/web/vercel.json` avec `regions: ["cdg1"]`
- Ajouté alias `pnpm start` au root `package.json`
- Aligné `next start --port 3005` (cohérence dev/prod)

### 5. Cleanup logs build (PR #20)

`time()` détecte les `NEXT_REDIRECT` et `NEXT_NOT_FOUND` (control flow Next.js) et n'émet pas de `[perf:FAIL]` dessus. Ces "erreurs" sont normales lors de la pre-render static.

## Bilan perf

**App saine.** Aucun bug perf identifié. Pas d'optimisation urgente. Le dataset actuel (230 pigeons / 988 results) tient confortablement sous 300ms warm en prod.

Quick wins disponibles si besoin futur (non urgents) :
- SQL filter période sur dashboard/performance (réduit 988 → 250 lignes pour Saison N) — gain ~50ms
- `unstable_cache` Next.js sur `lofts` (changent rarement) — gain ~30ms par nav
- Vérif index Postgres `pigeon_results.pigeon_matricule` (probablement déjà OK, à confirmer via EXPLAIN)
- React `cache()` sur `auth.getUser()` — déjà dédup en pratique, gain marginal

Reportés à plus tard quand dataset > 5000 results ou si Speed Insights flag des problèmes.

## Bloquant Vercel — action utilisateur requise

**Le deploy Vercel échoue** avec `Error: No Output Directory named "public" found`. Cause identifiée :

Dans **Vercel Dashboard → Settings → Build and Deployment → Framework Settings → Project Settings**, le **Framework Preset est sur "Other"**. C'est ce qui force le défaut Output Directory = `public` au lieu de `.next`.

Production Overrides ont les bonnes valeurs (Next.js, `.next`, `pnpm build`) — c'est pourquoi le précédent deploy avait marché. Mais les NOUVEAUX deploys utilisent Project Settings, donc plantent.

**Fix utilisateur** :
1. Vercel → Settings → Build and Deployment
2. Section Framework Settings → bloc Project Settings
3. Framework Preset dropdown "Other" → sélectionner **Next.js**
4. Save
5. Onglet Deployments → 3 points sur dernier deploy raté → Redeploy

URL site actuel (ancien deploy réussi) : `colombo-j88z9veit-samis-projects-8dc87455.vercel.app`

## Setup Supabase Auth restant

À faire après le 1er deploy réussi :

Supabase Dashboard → Authentication → URL Configuration :
- Site URL : `https://colombo-XXX.vercel.app` (la vraie URL Vercel)
- Redirect URLs : ajouter `https://colombo-XXX.vercel.app/**`
- Garder aussi `http://localhost:3005/**` pour dev

Update `NEXT_PUBLIC_SITE_URL` env var dans Vercel pour pointer vers l'URL prod.

## Décisions techniques

| Décision | Pourquoi |
|---|---|
| Instrumentation perf gardée en prod | Overhead < 0.01ms par mesure, désactivable via COLOMBO_PERF=0, utile pour Vercel Runtime Logs |
| Vercel cdg1 (pas fra1) | Supabase en Paris eu-west-3, colocalisation = ~3-5ms latence DB au lieu de ~15ms |
| Speed Insights actif | Web Vitals réels utilisateurs (LCP, INP, CLS), gratuit hobby plan |
| `pnpm start` aligné port 3005 | Évite collisions sur 3000 si autre process |

## TODO prochaine session

### Priorité — débloquer le deploy

1. **Action user** : Vercel Settings → Framework Preset = Next.js → Save → Redeploy
2. Vérifier que le deploy passe → noter l'URL prod
3. Update Supabase auth URLs (Site URL + Redirect URLs)
4. Update `NEXT_PUBLIC_SITE_URL` env var Vercel → Redeploy
5. Vérifier login + nav fonctionnent en prod
6. Activer Speed Insights dans Vercel Dashboard (Speed Insights tab → Enable)
7. Naviguer 30s sur le site déployé → vérifier Web Vitals + Runtime Logs `[perf:*]`
8. Confirmer que la **Function Region** est bien `cdg1` Paris (Settings → Functions)

### Polish post-deploy

9. Vérifier que les anciens TODO de la session 2026-05-03 restent valides (Santé schema, Comparateur impl, Stripe, RLS audit, etc.)
10. Si timings prod cdg1 ↔ Paris < 200ms warm → fermer ticket perf
11. Si timings > 300ms en prod → activer SQL filter période + vérif index Postgres

## Prompt de reprise

```
On a fait l'instrumentation perf hier (PR #16) et le setup Vercel prod
(PRs #17-21). L'app est rapide en prod (warm 130-260ms par page).

BLOQUÉ sur le deploy Vercel : Framework Preset = "Other" au lieu de Next.js
dans Project Settings → output défaut = public → fail.

À faire :
1. Aller sur Vercel Dashboard → Settings → Build and Deployment →
   Framework Settings → Project Settings → Framework Preset = Next.js → Save
2. Redeploy
3. Setup Supabase Auth URL pour la prod

Lis docs/sessions/2026-05-04-perf-instrumentation-vercel-deploy.md pour le contexte.

Sur quoi on bosse ?
```

## Helpers existants à réutiliser

- `apps/web/src/lib/perf.ts` — `time()` async + `timeSync()` sync
- `apps/web/src/lib/user-race-results.ts` — `loadUserPigeonResults` (déjà instrumenté)
- `apps/web/vercel.json` — config régions cdg1
- `@vercel/speed-insights/next` — `<SpeedInsights />` dans root layout

## Total

6 PRs mergées (#16 à #21). 0 régression. App fonctionnelle en local prod build, deploy Vercel bloqué par config UI side (Framework Preset).
