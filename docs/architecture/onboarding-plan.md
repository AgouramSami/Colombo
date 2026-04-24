# Onboarding Colombo, plan complet

Document de reference pour l'implementation de l'onboarding "effet magique".
A lire integralement avant de coder la moindre ligne de l'ecran /onboarding.

## Contexte UX a integrioriser avant tout

L'onboarding est le moment le plus important du produit. C'est la premiere
chose que voit l'eleveur apres sa connexion. Il arrive avec une question dans
la tete : "est-ce que ce truc va vraiment marcher pour moi ?". L'objectif
de cet ecran n'est pas de collecter des donnees. C'est de repondre oui a
cette question en 30 secondes.

La cible a 60 ans et plus. Elle n'a jamais fait d'onboarding SaaS. Elle ne
sait pas ce qu'est un "profil" ou un "workspace". Elle sait qui elle est :
un eleveur avec des pigeons qui ont couru des concours. Partir de la.

Le ton est chaleureux, direct, jamais condescendant. On ne dit pas
"Configurez votre compte". On dit "Retrouvons vos pigeons".

## Architecture de l'ecran (3 etapes, une seule page)

L'ecran /onboarding ne se decoupe pas en pages separees. Les 3 etapes
s'enchainent sur la meme URL, avec une transition douce vers le bas (scroll
naturel ou apparition progressive). L'eleveur ne doit jamais avoir
l'impression de "passer a l'etape suivante". Il doit avoir l'impression
que le produit lui repond.

---

## Etape 1 : la recherche

### Ce que l'eleveur voit

Un seul champ de texte, grand, centre, avec un label explicite au-dessus et
un texte d'aide en dessous.

Label au-dessus du champ (taille 18px, gras) :
```
Quel est votre nom d'eleveur ?
```

Placeholder dans le champ (disparait a la saisie) :
```
Ex : Dupont, Martin J., DA COSTA...
```

Texte d'aide sous le champ (14px, couleur secondaire) :
```
C'est le nom qui apparait sur vos resultats de concours.
```

Bouton sous le champ :
```
Rechercher mes pigeons
```

### Ce que l'eleveur ne voit pas

Pas de mention de "base de donnees", "algorithme", "scraping", "IA".
Pas de case a cocher, pas de menu deroulant, pas d'autre champ.
Pas d'indication sur ce qui va se passer.

L'effet magique ne s'annonce pas. Il arrive.

### Comportements techniques attendus

- Le champ accepte les noms partiels (3 caracteres minimum avant de lancer
  la recherche, sinon message "Continuez a taper...").
- La recherche se lance aussi bien au clic du bouton qu'a l'appui sur Entree.
- Pendant la recherche : le bouton se transforme en indicateur de chargement
  avec le texte "Recherche en cours..." (pas de spinner generique, texte
  clair).
- Temps de chargement affiche si superieur a 2 secondes :
  "Nous parcourons les resultats des competitions francaises..."
- Si la recherche prend plus de 5 secondes (cas rare) : message de patience,
  pas d'erreur brutale.
- La RPC `find_pigeons_by_amateur_name` est appelee ici. Elle fait une
  recherche fuzzy sur `amateur_display_name` dans `pigeon_results`.

### Gestion des erreurs etape 1

Champ vide au clic : ne pas afficher une erreur rouge agressive. Juste
secouer doucement le champ et afficher sous lui :
```
Entrez votre nom tel qu'il apparait sur vos resultats.
```

Erreur reseau : message humain, pas de code HTTP :
```
Nous n'avons pas pu lancer la recherche. Verifiez votre connexion
et reessayez.
```

---

## Etape 2 : les resultats (l'effet magique)

C'est le moment cle. L'eleveur voit son nom, ses pigeons, ses concours. Pour
beaucoup, c'est la premiere fois qu'ils voient tout ca agregee en un seul
endroit. Ne pas gacher ce moment avec un tableau generique.

### Cas A : on a trouve des pigeons (cas normal)

Titre dynamique (taille 24px, centre) :
```
Nous avons retrouve [N] pigeon[s] a votre nom
```

Sous-titre (16px, couleur secondaire) :
```
Verifiez qu'il s'agit bien de vous avant de les ajouter a votre pigeonnier.
```

Puis la liste des pigeons trouves. Chaque ligne de pigeon affiche :

- Case a cocher a gauche (48x48px minimum, cochee par defaut)
- Matricule en gras (format affichage avec espaces : FR 123456 26 F)
- Nombre de concours courus a droite (ex : "14 concours")
- Dernier concours couru en dessous en plus petit (ex : "Dernier : Lamotte
  Beuvron, avril 2026")

Indication au-dessus de la liste si plus de 10 pigeons trouves :
```
Tous vos pigeons sont coches. Vous pouvez en decocher certains si
vous ne les reconnaissez pas.
```

Bouton principal sous la liste :
```
Ajouter ces [N] pigeons a mon pigeonnier
```

Lien texte sous le bouton (plus discret) :
```
Aucun de ces pigeons ne m'appartient
```

### Cas B : nom ambigu, plusieurs eleveurs trouves

Si la recherche retourne des pigeons avec des noms legerement differents
(ex : "DUPONT J." et "DUPONT Jean" et "DUPONT Jean-Pierre"), afficher un
selecteur de nom avant la liste :

```
Nous avons trouve plusieurs eleveurs avec ce nom.
Lequel etes-vous ?
```

Puis une liste de boutons radio, un par nom distinct trouve dans les resultats.
Quand l'eleveur en choisit un, afficher uniquement les pigeons de ce nom.

### Cas C : aucun pigeon trouve

Ne pas afficher un message d'erreur. Afficher une alternative positive :

Titre :
```
Nous n'avons pas trouve de resultats a ce nom.
```

Texte explicatif :
```
Cela peut arriver si vous etes nouvel eleveur, si votre club ne publie
pas encore ses resultats en ligne, ou si votre nom apparait
differemment dans les classements.
```

Deux options proposees :

Option 1, bouton principal :
```
Reessayer avec un autre nom
```

Option 2, lien texte :
```
Continuer sans resultats et ajouter mes pigeons manuellement
```

Ne jamais laisser l'eleveur sans sortie.

### Comportements techniques attendus etape 2

- Les cases sont toutes cochees par defaut. Un eleveur ne devrait pas avoir
  a faire d'effort si tout est correct.
- Le compteur dans le bouton se met a jour en temps reel quand l'eleveur
  decoche des pigeons.
- Pas de pagination. Si plus de 50 resultats (cas tres rare), tronquer a
  50 avec mention "Les 50 premiers resultats sont affiches. Si votre pigeon
  n'est pas dans la liste, vous pourrez l'ajouter manuellement depuis
  votre pigeonnier."
- La liste est triee par nombre de concours decroissant (les pigeons les
  plus actifs en premier, plus reconnaissables).

---

## Etape 3 : la confirmation

### Ce que l'eleveur voit apres avoir clique "Ajouter"

Pendant le traitement (Server Action claimPigeonAction) :
```
Creation de votre pigeonnier...
```

Apres succes, on ne redirige pas immediatement. On affiche d'abord un ecran
de confirmation sur la meme page (transition douce vers le bas).

Titre (24px) :
```
Votre pigeonnier est pret.
```

Texte (16px) :
```
[N] pigeon[s] ont ete ajoute[s]. Vous pouvez maintenant consulter
leurs resultats, completer leurs fiches et suivre leurs performances.
```

Un seul bouton :
```
Decouvrir mon pigeonnier
```

Ce bouton redirige vers /pigeonnier.

### Ce que le Server Action fait (claimPigeonAction)

1. Cree un loft par defaut avec le nom "Mon pigeonnier" lie a auth.uid().
2. Appelle la RPC `claim_orphan_pigeons` avec les matricules coches et
   l'id du loft cree.
3. Met a jour `users.onboarded_at = now()` pour marquer l'onboarding comme
   termine.
4. En cas d'echec partiel (certains pigeons deja pris par un autre compte) :
   ne pas bloquer. Ajouter ceux qui ont pu l'etre et signaler les autres
   en message discret :
   "2 pigeons n'ont pas pu etre ajoutes car ils sont deja associes a un
   autre compte. Contactez-nous si vous pensez qu'il s'agit d'une erreur."
5. En cas d'echec total : message d'erreur humain et bouton "Reessayer".

---

## Middleware : logique de redirection

La logique de redirection doit etre dans le middleware Next.js, pas dans les
pages. Les regles dans l'ordre :

1. Utilisateur non connecte qui accede a /app/* : redirect /login
2. Utilisateur connecte qui accede a /login : redirect /pigeonnier ou
   /onboarding selon onboarded_at
3. Utilisateur connecte, onboarded_at IS NULL, accede a /app/* : redirect
   /onboarding (sauf /onboarding lui-meme pour eviter la boucle)
4. Utilisateur connecte, onboarded_at IS NOT NULL, accede a /onboarding :
   redirect /pigeonnier

---

## Page /pigeonnier (stub)

La page /pigeonnier en version stub doit etre suffisamment accueillante pour
ne pas decevoir apres l'effet magique de l'onboarding.

Elle ne doit pas etre vide avec juste "Pigeonnier" en titre. Afficher a minima :

Titre :
```
Votre pigeonnier
```

Sous-titre dynamique si pigeons charges :
```
[N] pigeon[s] dans votre collection
```

Grille ou liste des pigeons avec pour chaque pigeon :
- Matricule
- Nombre de concours
- Vitesse moyenne si calculable
- Indicateur visuel masculin / feminin

Bandeau en haut si l'utilisateur vient de finir l'onboarding (flag en session,
retire au prochain chargement) :
```
Bienvenue dans votre pigeonnier. Cliquez sur un pigeon pour voir
sa fiche complete.
```

---

## Brand content, regles de ton pour tout l'onboarding

Toujours utiliser "votre" et jamais "ton". Vouvoiement strict.

Verbes d'action positifs : retrouver, decouvrir, consulter, ajouter. Jamais
configurer, parametrer, initialiser, synchroniser.

Jamais de jargon technique visible par l'eleveur : pas de "base de donnees",
"API", "scraping", "RPC", "UUID", "loft_id".

Les nombres de concours et les matricules sont des preuves sociales
involontaires. Les mettre en avant visuellement (gras, taille superieure).
Ils montrent que le produit connait deja les pigeons de l'eleveur.

Le mot "magique" n'apparait jamais dans l'interface. L'effet doit etre
ressenti, pas annonce.

Les messages d'erreur se terminent toujours par une action possible. Jamais
d'impasse.

---

## Instructions techniques pour Claude Code

Ce qui suit est la spec technique a implementer. Lire l'integralite du plan
ci-dessus avant de commencer le code.

### Fichiers a creer

```
apps/web/
├── app/
│   ├── (marketing)/
│   │   └── (pas touche dans cette feature)
│   └── (app)/
│       ├── onboarding/
│       │   ├── page.tsx              (Server Component, verifie auth)
│       │   ├── onboarding-form.tsx   (Client Component, logique recherche)
│       │   └── actions.ts            (Server Actions : claim + loft)
│       └── pigeonnier/
│           └── page.tsx              (stub, Server Component)
├── middleware.ts                     (logique de redirection complete)
└── lib/
    └── supabase/
        └── rpc.ts                    (wrappers type-safe pour les RPC)
```

### Schema Zod pour les RPC

Creer dans `lib/supabase/rpc.ts` des wrappers type-safe sur les deux RPC :

```typescript
// find_pigeons_by_amateur_name
export const PigeonSearchResultSchema = z.object({
  pigeon_matricule: z.string(),
  amateur_display_name: z.string(),
  last_seen_at: z.string(),
  race_count: z.number(),
});
export type PigeonSearchResult = z.infer<typeof PigeonSearchResultSchema>;

// claim_orphan_pigeons
// Retourne les pigeons qui ont pu etre reclames
```

### Contraintes de code

- Le champ de recherche est un Client Component avec `useState` et `useTransition`.
- L'appel RPC se fait via une Server Action (pas un fetch client direct) pour
  ne pas exposer la cle Supabase anon.
- claimPigeonsAction est egalement une Server Action.
- Le loft par defaut cree porte le nom "Mon pigeonnier". L'eleveur pourra le
  renommer depuis son profil plus tard.
- Utiliser `formatMatricule` de packages/shared pour l'affichage des matricules
  dans la liste (jamais le format DB avec tirets).
- Les cases a cocher doivent avoir un label associe (accessibilite, critere
  AAA).
- Pas d'animation complexe. Transitions CSS simples (opacity + translateY)
  sur les sections qui apparaissent progressivement.
- La page /onboarding doit etre fonctionnelle sans JavaScript (progressive
  enhancement). La recherche peut se degrader en soumission de formulaire
  classique si JS est desactive.

### Ordre d'implementation recommande

1. Middleware avec les 4 regles de redirection (teste manuellement)
2. Server Action `searchPigeonsAction` qui appelle `find_pigeons_by_amateur_name`
3. Page /onboarding avec etape 1 seulement, fonctionnelle
4. Ajout de l'etape 2 avec la liste des resultats
5. Server Action `claimPigeonsAction` avec creation du loft
6. Ajout de l'etape 3 et redirection
7. Page /pigeonnier stub
8. Tests Playwright sur le parcours complet (happy path + cas C aucun pigeon)

### Tests Playwright obligatoires

```
test: onboarding, happy path, trouve des pigeons et les revendique
test: onboarding, cas C, aucun pigeon, continue manuellement
test: middleware, utilisateur onboarde ne peut plus acceder a /onboarding
test: middleware, utilisateur non onboarde redirige vers /onboarding
```

### Commit attendu

```
feat(onboarding): add magic effect onboarding with pigeon search and claim
```

Avec description dans le corps du commit qui resume les 3 etapes implementees.
