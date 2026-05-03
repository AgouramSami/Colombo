# Domain Docs

## Avant d'explorer, lire

- **`docs/domain/glossaire.md`** — vocabulaire metier (eleveur, lacher, doublage, mises, matricule...)
- **`docs/architecture/stack.md`** — stack technique et justifications
- **`docs/decisions/`** — ADRs (dossier vide pour l'instant, consulter si des fichiers y apparaissent)

## Structure

Repo single-context. Pas de CONTEXT.md ni CONTEXT-MAP.md — les skills doivent lire
`docs/domain/glossaire.md` a la place.

## Utiliser le vocabulaire du glossaire

Quand un skill nomme un concept metier (titre d'issue, proposition de refactoring,
hypothese, nom de test), utiliser le terme tel que defini dans `docs/domain/glossaire.md`.
Ne pas deriver vers des synonymes que le glossaire evite explicitement.

## Signaler les conflits avec les decisions existantes

Si une proposition contredit une decision documentee dans `docs/decisions/`,
le signaler explicitement plutot que de l'ecraser silencieusement.
