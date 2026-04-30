Voici le récap complet à copier-coller à Claude Code pour qu’il reprenne exactement au bon état.

Objectif global de la session  
Stabiliser le projet après gros changements scraper \+ web.  
Corriger les échecs CI (Playwright principalement).  
Améliorer le dashboard stats/KPI/graphes.  
Améliorer la page détail pigeon.  
Traiter l’alerte sécurité Supabase sur la vue public.pigeon\_pdf\_links (SECURITY DEFINER).  
1\) CI / Playwright : corrections successives  
Plusieurs runs GitHub Actions échouaient sur E2E tests (Playwright).  
On a corrigé en chaîne :

a) URL post-onboarding  
Problème : test attendait /pigeonnier strict alors que l’app redirige vers /pigeonnier?welcome=1.  
Fix : assouplissement assertion URL regex.  
Commit : 93b6bcd  
b) Timeout download scraper (vu en logs scraper)  
Problème : timeout sur PDF important non-doublage.  
Fix crawler :  
retries HTTP sur erreurs transitoires (timeout/network/5xx/429),  
backoff exponentiel,  
timeout PDF augmenté.  
Fichier : apps/scraper/src/crawler/francolomb.py  
Commit : 4b69f6e  
c) Strict mode Playwright sur getByText('1 concours')  
Problème : texte présent plusieurs fois \-\> strict mode violation.  
Fix : getByText('1 concours').first().  
Commit : c0ce42f  
d) Timeout test onboarding  
Problème : timeout 30s sur happy path.  
Fix initial : test.setTimeout(90\_000) sur test happy path.  
Commit : b6e41eb  
e) Flakiness due to seed collisions  
Problème probable : nom amateur fixe (MARTIN TEST E2E) \=\> collisions historiques \+ lenteurs.  
Fix : nom amateur unique par run (Date.now \+ random) utilisé pour seed \+ recherche.  
Commit : bae335a  
f) Timeout potentiellement en cleanup finally  
Problème probable : appels admin Supabase (delete user/cleanup fixture) qui mangent le budget timeout.  
Fix : wrapper withTimeout(...) \+ cleanup best-effort.  
Commit : 93bffb7  
2\) Dashboard / Stats / KPI (refonte)  
Gros enrichissement de apps/web/src/app/(app)/dashboard/page.tsx :

v1  
KPI ajoutés/renforcés :  
Pigeons, Résultats saison, Concours disputés, Champions,  
Meilleure place, Taux de prix, Podiums, Top 10, Place moyenne, Vitesse moyenne.  
Graphes ajoutés :  
Évolution mensuelle (6 mois),  
Répartition par catégorie,  
Distribution des places.  
Composants UI internes ajoutés :  
ChartCard, MiniBarChart, StackBars.  
v2  
Filtre période via query param :  
?periode=season  
?periode=12m  
Recalcul KPI/graphes selon période active.  
Pills de sélection de période \+ style actif.  
v3  
KPI plus “pro” :  
icônes par carte,  
tendances “vs période précédente” quand calculables,  
logique de tendance inversée pour Place moyenne.  
Calcul des fenêtres de comparaison période précédente.  
3\) Détail pigeon : amélioration UI/UX  
Fichier : apps/web/src/app/(app)/pigeonnier/\[matricule\]/pigeon-detail-tabs.tsx

Améliorations apportées (onglet Carrière surtout) :

Ajout d’un bloc KPI dédié Carrière :  
Concours, Meilleure place, Vitesse moyenne, Top 10\.  
Graph vitesse :  
ajout légende Min/Max.  
Tableau historique :  
wrapper overflowX: auto pour mobile,  
amélioration responsive des paddings.  
4\) Vercel Analytics  
Intégration effectuée :

Dépendance ajoutée : @vercel/analytics  
apps/web/src/app/layout.tsx : \<Analytics /\> injecté dans \<body\>.  
5\) Limites Vercel/Supabase (guidance donnée)  
Infos communiquées :

Vercel Hobby: quotas limités \+ usage non-commercial.  
Supabase Free: 2 projets, DB 500MB/projet, egress 5GB, etc.  
Seuils pratiques donnés pour anticiper passage payant.  
6\) Sécurité Supabase : Security Definer View  
Problème signalé  
Vue public.pigeon\_pdf\_links détectée comme SECURITY DEFINER.  
Actions faites  
Migration créée :  
packages/db/migrations/sql/0006\_pigeon\_pdf\_links\_security\_invoker.sql  
Contenu :  
recrée la vue avec with (security\_invoker \= true),  
remet le grant select.  
Blocage actuel MCP  
Tentative apply\_migration via MCP échouée :  
erreur relation public.pigeon\_results does not exist.  
Diagnostic :  
le MCP user-supabase est connecté à un autre projet/schéma (tables colombo\_\*, race\_results, etc.).  
Statut :  
migration prête dans repo mais pas appliquée sur la bonne DB via MCP dans cette session.  
7\) État des fichiers modifiés (session)  
apps/scraper/src/crawler/francolomb.py  
apps/web/e2e/onboarding.spec.ts  
apps/web/src/app/(app)/dashboard/page.tsx  
apps/web/src/app/(app)/pigeonnier/\[matricule\]/pigeon-detail-tabs.tsx  
apps/web/src/app/layout.tsx  
apps/web/package.json  
pnpm-lock.yaml  
packages/db/migrations/sql/0006\_pigeon\_pdf\_links\_security\_invoker.sql  
8\) Commits importants créés pendant la session  
93b6bcd fix e2e URL /pigeonnier?welcome=1  
4b69f6e fix scraper retry/backoff/timeout PDF  
c0ce42f fix strict locator collision (1 concours)  
b6e41eb test timeout onboarding à 90s  
bae335a seed data onboarding unique/run  
93bffb7 cleanup best-effort avec timeout  
(plus modifications dashboard/UI/security non encore forcément commit selon ton état local actuel)

9\) Prochaine action recommandée pour Claude Code  
Vérifier git status.  
Commit/push propre des changements UI/dashboard \+ migration si pas déjà fait.  
Rebrancher MCP sur le bon projet Supabase (ctylccdzyjhubszuejji) et re-tester :  
list\_tables (doit voir pigeon\_results, race\_pdfs)  
apply\_migration de 0006...  
vérif finale vue (pg\_views / options sécurité).