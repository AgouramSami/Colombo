# Workflow Git

Ce document decrit la maniere de contribuer du code au projet Colombo. Il est
a respecter strictement, y compris en solo, car il garantit un historique
propre et un deploiement fiable.

## Modele retenu : GitHub Flow enrichi

Une branche `main` toujours deployable, une branche `staging` pour la preprod,
des branches de feature courtes. Pas de `develop`, pas de `release`, pas de
`hotfix`.

### Pourquoi pas Git Flow

Git Flow (Driessen, 2010) a ete concu pour des releases logicielles packagees.
Pour un SaaS web deploye en continu sur Vercel, il ajoute de la ceremonie sans
valeur : merges dans deux branches, branches release maintenues en parallele,
hotfix a mettre a jour sur main et develop. On reste simple.

## Les branches

| Branche | Role | Qui deploie | Duree de vie |
|---|---|---|---|
| `main` | Production, toujours deployable | Deploy prod Vercel auto | Permanente |
| `staging` | Preprod stable | Deploy preview permanent | Permanente |
| `feat/xxx` | Nouvelle fonctionnalite | Preview Vercel par PR | 1 a 3 jours max |
| `fix/xxx` | Correction de bug | Preview Vercel par PR | Quelques heures |
| `chore/xxx` | Maintenance, deps, config | Preview Vercel par PR | Quelques heures |
| `docs/xxx` | Documentation uniquement | Pas de deploy | Quelques heures |

Aucune autre branche ne doit exister. Si le besoin se fait sentir d'un
`develop` ou d'un `release`, c'est le signe que le projet a grossi et qu'il
faut revoir le modele. Ne pas anticiper.

## Convention de nommage

```
feat/onboarding-magique
feat/scraper-francolomb
fix/matricule-parse-7-digits
chore/upgrade-next-15-3
docs/data-model-update
```

Kebab-case, court, descriptif. Pas de numeros d'issue dans le nom de branche
(on les met dans le titre de PR).

## Conventional Commits

Tous les commits suivent le format suivant, sans exception :

```
type(scope): description courte a l'imperatif

Corps optionnel expliquant le pourquoi (pas le quoi).

Refs #12
```

### Types autorises

- `feat` : nouvelle fonctionnalite visible par l'utilisateur
- `fix` : correction de bug
- `perf` : amelioration de performance sans changement fonctionnel
- `refactor` : refonte de code sans changement de comportement
- `docs` : documentation uniquement
- `test` : ajout ou modification de tests
- `chore` : taches de maintenance (deps, config, tooling)
- `ci` : pipeline CI / CD uniquement
- `style` : formatage (jamais utilise si Biome tourne sur chaque commit)

### Scopes recommandes pour Colombo

`web`, `scraper`, `db`, `auth`, `shared`, `ui`, `ci`, `domain`, `deps`.

### Exemples

```
feat(scraper): parse section 2 of francolomb pdf for amateur stats
fix(shared): handle 7-digit matricule from belgian pigeons
docs(domain): add glossaire questions answered by father
chore(deps): bump drizzle-orm to 0.30.4
refactor(web): extract pigeon card into its own component
```

### Breaking changes

Ajouter `!` apres le scope et expliquer en pied de commit :

```
feat(shared)!: rename matricule helper from formatMatricule to toDisplayMatricule

BREAKING CHANGE: toutes les utilisations de formatMatricule doivent etre
remplacees par toDisplayMatricule. Voir PR #42.
```

## Cycle de vie d'une feature

```bash
git switch main
git pull --rebase
git switch -c feat/onboarding-magique

# travail, commits atomiques
git add -p
git commit -m "feat(auth): add magic link flow"
git commit -m "test(auth): cover magic link expiration"
git commit -m "docs(auth): explain magic link ux choice"

# push + PR
git push -u origin feat/onboarding-magique
gh pr create --fill

# reviews + corrections
git commit --amend  # ou git commit --fixup <sha>
git push --force-with-lease

# apres merge squash
git switch main
git pull --rebase
git branch -D feat/onboarding-magique
```

La commande `--force-with-lease` protege contre l'ecrasement accidentel si
quelqu'un a pousse entre temps. Jamais `git push --force` sec.

## Regles de commit

1. Un commit = une unite logique atomique. Si vous hesitez a ecrire "et" dans
   le message, c'est qu'il faut deux commits.
2. Pas de commit "WIP", "fix typo", "update". Toujours un message descriptif.
   Commit temporaire ? `fixup!` puis `git rebase -i --autosquash main` avant
   de push.
3. Les commits compilent et passent les tests en local. Un commit qui casse
   la CI est un commit a ne pas pousser.
4. Pas de secret, pas de cle, pas de mot de passe dans un commit. Si ca
   arrive, considerer la cle comme compromise, la revoquer, rebaser.
5. Pas de fichier genere (`dist/`, `.next/`, `node_modules/`, coverage HTML)
   dans un commit.
6. Pas de code commente. Si inutile, on supprime. Git garde l'historique.

## Pull requests

### Titre

Reprend le format conventional commits :

```
feat(scraper): parse section 2 of francolomb pdf
```

### Template (`.github/PULL_REQUEST_TEMPLATE.md`)

```markdown
## Contexte

Pourquoi cette PR existe, quel besoin utilisateur elle couvre.

## Changements

Ce qui change concretement, par zone du code.

## Comment tester

Etapes pour reproduire et valider localement.

## Captures d'ecran

Si changement UI.

## Checklist

- [ ] Tests ajoutes ou mis a jour
- [ ] Migrations Drizzle generees si changement de schema
- [ ] RLS verifiees si nouvelle table
- [ ] Doc mise a jour si impact sur docs/
- [ ] Pas de PII dans les logs ni les messages d'erreur
- [ ] Teste localement
```

### Taille

Objectif max 400 lignes modifiees. Exceptions tolerees pour les migrations SQL
et les fichiers de lockfile. Une PR trop grosse est une PR qu'on review mal.
Scinder si possible.

### Review

Meme en solo, ouvrir la PR et la laisser reposer 30 minutes avant de merger.
Relire comme si un tiers l'avait ecrite. Le taux de bugs evites est enorme.

### Merge strategy

`Squash and merge` par defaut. Historique lineaire sur `main`, un commit = une
feature. Le titre du squash reprend le titre de la PR.

`Rebase and merge` autorise si la PR contient deja des commits parfaitement
atomiques qu'on veut garder.

`Merge commit` interdit.

## Protection des branches

Sur GitHub, proteger `main` avec :

- [x] Require a pull request before merging
- [x] Require approvals : 1 (vous-meme apres repos)
- [x] Dismiss stale pull request approvals when new commits are pushed
- [x] Require status checks to pass before merging
  - [x] Require branches to be up to date before merging
  - Checks : `lint`, `typecheck`, `test`, `build`
- [x] Require conversation resolution before merging
- [x] Require linear history
- [x] Include administrators (oui, meme pour vous)
- [x] Restrict who can push to matching branches : personne en direct

Meme chose pour `staging`, avec approvals a 0 mais status checks obligatoires.

## Staging workflow

Regeneration de `staging` depuis `main` pour valider avant prod :

```bash
git switch staging
git reset --hard origin/main
git push --force-with-lease origin staging
```

Automatisable via une GitHub Action manuelle (`workflow_dispatch`) pour eviter
les manipulations locales.

## Versioning et tags

Semantic Versioning (MAJOR.MINOR.PATCH). Creation de tags a des jalons produit,
pas a chaque merge :

- `v0.1.0` : premiere version demo interne (pere + 2 testeurs)
- `v0.2.0` : beta privee
- `v1.0.0` : lancement public
- `v1.x.y` : ensuite

Utilisation de `release-please` (GitHub Action de Google) qui :
1. Lit les conventional commits depuis le dernier tag
2. Calcule la version suivante
3. Ouvre une PR `chore(release): v1.2.3` avec le changelog auto
4. Quand on merge la PR, tag et release GitHub crees automatiquement

Configuration dans `.github/release-please-config.json`.

## Hotfix en production

Pas de branche `hotfix` a la Git Flow. Si un bug critique atterrit en prod :

```bash
git switch main
git pull --rebase
git switch -c fix/critical-matricule-bug
# correction + test
git commit -m "fix(shared): restore matricule parsing for belgian 7-digit"
git push -u origin fix/critical-matricule-bug
gh pr create --fill
```

Review rapide (ne pas court-circuiter, mais accelerer), merge, deploiement
auto. Pas de port a faire sur une autre branche, tout est deja sur `main`.

## Commandes utiles

```bash
# Voir les commits depuis le dernier tag
git log $(git describe --tags --abbrev=0)..HEAD --oneline

# Nettoyer les branches deja mergees
git fetch --prune
git branch --merged main | grep -v '^[* ]*main$' | xargs -n 1 git branch -d

# Rebase interactif pour nettoyer avant push
git rebase -i --autosquash main

# Derniere chance avant push force
git push --force-with-lease

# Voir le graphe
git log --graph --oneline --all --decorate
```

## Ce que Claude Code doit faire

1. Toujours creer une branche avant de coder, jamais sur `main`.
2. Proposer des commits atomiques en conventional commits.
3. Avant `git push`, relancer `pnpm lint` et `pnpm typecheck`.
4. Generer le texte de PR en remplissant le template complet.
5. En cas de bug detecte pendant une review, corriger via `fixup!` plus
   autosquash, pas par un nouveau commit "fix review".
6. Jamais de `git push --force` sec, toujours `--force-with-lease`.

## Ce que Claude Code ne doit jamais faire

- Pousser directement sur `main` ou `staging`.
- Merger une PR sans CI verte.
- Creer une branche `develop`, `release`, `hotfix` ou `master`.
- Ecrire "WIP" ou "tmp" dans un message de commit.
- Ignorer la convention conventional commits.
- Commiter un fichier genere ou un secret.
