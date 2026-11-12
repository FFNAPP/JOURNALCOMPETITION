# Historique détaillé — Journal de compétition FFN

Complément de `CLAUDE.md` (racine du dépôt). Rédigé le 2026-11-11 à partir : des 4 sessions Claude Code archivées (2026-05-29 → 2026-06-03), du `CLAUDE.md` d'origine (2026-06-19), de l'historique git du dépôt et de l'ancien dossier de travail local. Les éléments non confirmés portent la mention `[À VÉRIFIER]`. Aucun secret n'est reproduit ici.

Sommaire : 1. Sources — 2. Récit des sessions — 3. Historique git — 4. Comparaison ancien dossier / dépôt — 5. Détails techniques — 6. Pistes abandonnées et contradictions — 7. Points à vérifier — Annexe A (copie intégrale du CLAUDE.md d'origine).

---

## 1. Sources utilisées

| Source | Contenu |
|---|---|
| Session principale (2026-05-29 → 2026-06-03), lancée depuis `Desktop/Journal de competition` | Briefings v2 et v3, patchs, fichier d'instructions J-/A-, statistiques dashboard, dépannage collègue, édition complète admin, COMEN |
| 2 sous-sessions du 2026-05-29 (sous-agents) | Exploration du code et plan d'implémentation de la v3 |
| Session du 2026-06-01 « CEJ_A/CEJ undefined hoisting bug » | **Hors périmètre** : concerne un fichier `bilan_cfU18` (autre projet), lancée par erreur depuis ce dossier |
| `CLAUDE.md` d'origine (ajouté au dépôt le 2026-06-19) | Référence d'architecture après la mise en place de l'authentification — recopié intégralement en annexe A |
| `git log` du dépôt (68 commits, 2026-06-03 → 2026-07-28) | Seule trace des travaux postérieurs au 2026-06-03 (sessions Claude Code web non archivées) |
| Ancien dossier local `Relève-Perf32/Journal de competition` | Copies de travail + documents absents du dépôt (voir section 4) |

Il n'existe pas d'anciennes « mémoires » Claude pour ce projet.

---

## 2. Récit des sessions

### 2026-05-29 (après-midi) — Briefing v2 : formulaires staff et onglet Staff

Demande : « Briefing Claude Code — Journal & Dashboard FFN, modifications suite à l'analyse du carnet U21 + étude australienne » (l'étude est le PDF « L'entraînement sous pression dans le sport de haut niveau australien : la performance mentale des entraîneurs », présent dans l'ancien dossier). Cinq tâches, toutes réalisées :

1. `journal.html` : nouvelle zone `zone-precomp-staff` (staff responsable, phase pré-compétition, table `precomp_staff_entries`) — sections État du groupe (3 curseurs + observations), Checklist administrative (8 cases), Matériel et équipements (statut Conforme/Partiel/Insuffisant), Planification et objectifs. Fonctions `fillPrecompStaffForm()`, `savePrecompStaff()`.
2. `journal.html` : nouvelle zone `zone-postcomp-staff` (table `postcomp_staff_entries`) — 5 sections (Bilan sportif avec tableau de performances, Encadrement, Logistique, Déplacement, Bilan synthétique), étoiles cliquables (`renderStars`), `loadPostcompPerformances()` avec écart coloré.
3. `STAFF_ITEMS.vie` : ajout de `vie_temps_libre`, `vie_recuperation`, `vie_suivi_medical`.
4. Posture d'entraîneur : passage de 4 à 6 critères (ajout `eval_concentration`, `eval_expression_emotions`) ; pré-comp entraîneur : champs `scenarios_anticipes` et `plans_contingence`.
5. `dashboard.html` : 6e onglet « ★ Staff » avec 3 sous-onglets (Compétition / Pré-comp / Bilan post-comp), chargement parallèle des trois tables staff, graphique SVG en ligne.

Volumes à cette date : `journal.html` 1 245 → 1 695 lignes ; `dashboard.html` 569 → 737 lignes.

Architecture d'alors (avant authentification) : l'utilisateur choisissait sa compétition et son identité dans des listes déroulantes ; rôles `entraineur` / `staff_responsable` ; phases `precomp` (J-14 à J-1, calculée), `comp`, `postcomp` (J+1), sinon « hors période ».

### 2026-05-29 (soir) — Briefing v3 : simplifications et exports PDF

Sept modifications, planifiées (mode plan + sous-agents) puis appliquées :

1. Suppression de `STAFF_ITEMS.sportif` (COMEN, Médailles, MPP, Fluidité CSP) et de la section « Aspects sportifs » du journal staff quotidien. Les colonnes `sport_*` restent en base mais ne sont plus utilisées.
2. Posture d'entraîneur : boutons 1-5 remplacés par des curseurs (`eval-commu`, `eval-stress`, `eval-concentration`, `eval-expression`, `eval-decisions`, `eval-presence`). Le briefing parlait de « 5 sliders », le compte rendu de 6 `[À VÉRIFIER]`.
3. Suppression de la Checklist administrative de `zone-precomp-staff` (ajoutée le jour même par la v2) ; sections renumérotées A → B → C.
4. Export PDF du bilan staff : bibliothèque html2pdf.js 0.10.1 (CDN cdnjs), bouton « Exporter PDF », fonction `generateStaffPDF()`.
5. Onglet Synthèse du dashboard : barres de progression colorées (`renderProgressBar`).
6. Nouvel onglet « Rapport Final » (`renderRapportFinal()`), découpé en phases Préparation / Compétition / Bilan.
7. Bouton d'export PDF dans l'en-tête du dashboard (`exportDashboardPDF()`).

SQL préalable fourni par Pierre (colonnes `eval_concentration`, `eval_expression_emotions` sur `journal_entries` ; `scenarios_anticipes`, `plans_contingence` sur `precomp_entries`).

### 2026-06-01 — Patchs : crash `zone-stage`, eau libre, superposition de phases

- `journal.html` : `applyPhase()` plantait en cherchant un élément `zone-stage` inexistant → `'stage'` retiré de la liste et test de nullité ajouté.
- `admin.html` : épreuves Eau Libre ajoutées au sélecteur (5km, 7,5km, 10km, Relais 4x1500m, KnockOut) ; champ « Temps engagement » masqué automatiquement pour ces épreuves (`EPREUVES_SANS_ENGAGEMENT`, `onEpreuveChange()`, enveloppe `ev-engagement-wrap`).
- `journal.html` — superposition voyage + stage : `detectPhase()` renvoie désormais un **tableau** de phases ; `applyPhase()` affiche toutes les zones concernées avec un bandeau par phase (conteneur `#phase-banners`) ; `loadDayData()` charge chaque phase indépendamment ; la barre de sauvegarde unique est supprimée, chaque zone a son bouton.

Contexte (note `NOTE_detectPhase_v2.md`, datée du 2026-06-01, ancien dossier) : la table `competitions` porte des dates explicites — `date_stage_debut`/`date_stage_fin`, `date_voyage_aller`/`date_voyage_retour`, `date_debut`/`date_fin`, `date_bilan`. La fenêtre calculée « J-14 » a été **volontairement abandonnée** : une phase n'existe que si ses dates sont renseignées. La phase `stage` réutilise les formulaires pré-compétition (`zone-precomp` / `zone-precomp-staff`). La note contient aussi le SQL de création de `voyage_entries`.

### 2026-06-02 — Fichier `instructions_claude_code.md` (J-1 à J-6, A-1 à A-5)

Pierre a demandé de lire puis d'appliquer ce fichier (919 lignes, présent uniquement dans l'ancien dossier).

`journal.html` :
- J-1 / J-2 : déjà faits la veille (crash `zone-stage`, superposition).
- J-3 : formulaire Voyage différencié par rôle — section « Conditions du voyage » réservée au staff, `applyVoyageRole()`.
- J-4 : « Trajet » retiré de `STAFF_ITEMS.logistique` ; « État de forme du responsable d'équipe » ajouté ; case « Non concerné » sur chaque curseur staff (`toggleStaffNC()`) ; section « Briefings du jour » (briefing staff / briefing nageurs).
- J-5 : bilan staff réordonné (« Bilan déplacement » en premier, sections I → IV), libellés revus, « Quantité de nourriture ».
- J-6 : section « Nageurs à l'entraînement » (non-compétiteurs du jour), `loadNonCompetitors(date)`.

`admin.html` :
- A-1 : champ « Type de compétition » (9 options natation course + eau libre), affiché en badge.
- A-2 : génération automatique des tours selon le type (`getToursForEpreuve()`, option « Automatique » du sélecteur de tour, `saveEvent()` crée plusieurs tours).
- A-3 : déjà fait (eau libre + masquage engagement).
- A-4 : bouton « Dates » et fenêtre d'édition des dates d'une compétition.
- A-5 : import CSV avec colonne `temps_engagement` (exemple de fichier : `COMEN_engagements.csv`, colonnes `athlete_nom,athlete_prenom,epreuve,tour,date,heure,temps_engagement`).

Migrations SQL annoncées ce jour-là (à exécuter à la main dans Supabase) : `competitions.type_competition` ; `staff_entries.briefing_staff`, `briefing_nageurs` ; `voyage_entries.embarquement`, `embarquement_nc`, `attente_retard`, `pb_administratif`, `pb_administratif_obs` ; `postcomp_staff_entries.resto_quantite`. Voir section 6 : les noms de colonnes voyage ont changé depuis.

Bogue corrigé le soir : `Identifier 'EPREUVES_SANS_ENGAGEMENT' has already been declared` dans `admin.html` (constante déclarée deux fois) ; l'erreur de syntaxe empêchait tout le script de se charger, d'où `loadCompetitions is not defined`. Doublon supprimé. Test local proposé via un petit serveur Python (`http://localhost:8000/`).

Puis, toujours le 2026-06-02 — instructions « dashboard.html : onglet Résultats + Rapport Final » (D-1 à D-5), avec la règle « ne modifier que ce qui est décrit » :
- D-1 : `computeResultStats(results, events)` et `compareTemps(a, b)` (formats `58.42`, `1:02.34`, `1:02:34.56`).
- D-2 : onglet Résultats refondu — 4 indicateurs (demi-finales, finales, podiums, temps d'engagement battus), vue par épreuve, tableau complet masqué par défaut, colonne « Réf. ».
- D-3 / D-4 : Rapport Final — synthèse exécutive avec les mêmes indicateurs, section « Résultats individuels » par nageur.
- D-5 : carte « Thèmes d'apprentissage » déplacée de la Synthèse vers l'onglet Nations.

Définitions retenues :
- Taux DF = nageurs ayant nagé une demi-finale / `min(nombre d'engagés de l'épreuve, 2)` (2 nageurs maximum par nation en demi-finale), calculé par épreuve puis agrégé.
- Taux Finale = nageurs en finale / nageurs passés en demi-finale (à défaut de demi-finale : nombre d'engagés).
- Taux Podium = rangs ≤ 3 en finale / nageurs en finale.
- Temps d'engagement battu = `temps < temps_engagement`, uniquement si le temps de référence existe et que le nageur a nagé.

### 2026-06-03 — Dépannage collègue, édition complète, COMEN

**« Rien ne s'affiche » chez un collègue** (compétition et encadrant sélectionnables, mais aucun formulaire après choix de la date). Vérifications : données Supabase correctes ; `detectPhase` correct pour les dates configurées. Corrections dans `journal.html` :
1. Ouverture du journal sur la **première date configurée** de la compétition au lieu de la date du jour.
2. Carte « Hors période » rendue informative : liste des périodes configurées avec boutons d'accès direct (`goToDate()`).
3. Pierre a précisé que les dates saisies par le collègue étaient correctes. Cause jugée la plus probable : condition de course réseau — `activeComp` chargé de façon asynchrone dans `onSetupCompChange`, non rechargé par `startJournal`. Correction : `startJournal` recharge et attend les dates.
4. Afficheur d'erreurs visible (bandeau rouge avec message et navigateur, `showFatalError`, écouteurs `error` et `unhandledrejection`) et `try/catch` autour de `loadDayData`.

Le retour du collègue après ces corrections n'est pas connu `[À VÉRIFIER]`.

**Édition complète dans `admin.html`** (jusque-là : suppression seule, et dates seules pour les compétitions) : fenêtre générique réutilisable `#edit-modal` (`openEditModal`), paires `editX()` / `saveEditX()` pour compétitions (nom, lieu, type, pays, statut, 7 dates), entraîneurs (prénom, nom, club, email, rôle), nageurs (prénom, nom, club, discipline), épreuves (épreuve, tour, date, heure, temps d'engagement). Les nations restent en lecture seule.

**COMEN = classement au temps** : pour une compétition de type COMEN, une seule épreuve par course, enregistrée avec le tour `finale` (pas de série / demi-finale / finale). Le tour `finale` a été choisi pour que les podiums du dashboard (`tour = 'finale'` et `rang ≤ 3`) restent justes. Le sélecteur « Tour » est remplacé par un badge « Classement au temps » à la création et verrouillé à l'édition. `MAPPING_TOURS` n'est qu'une constante documentaire : c'est `getToursForEpreuve()` qui pilote.

Le même jour (2026-06-03), premier dépôt des fichiers sur GitHub (commit `2030990`).

---

## 3. Historique git (travaux postérieurs aux sessions archivées)

68 commits sur `main`. Auteurs : « FFNAPP » (51) et « FFN-APP » (8) = dépôts manuels « Add files via upload » depuis l'interface GitHub ; « Claude » (9) = sessions Claude Code web (branche `claude/friendly-allen-4v743x`, fusionnée dans `main`, encore présente sur `origin`).

Commits par jour : 06-03 (1), 06-15 (5), 06-17 (1), 06-18 (3), 06-19 (5), 06-22 (3), 06-23 (2), 06-24 (5), 06-25 (3), 07-02 (1), 07-03 (1), 07-06 (3), 07-10 (1), 07-15 (22), 07-20 (2), 07-22 (4), 07-27 (2), 07-28 (4).

Jalons :
- `2030990` 2026-06-03 : premier dépôt (`admin.html`, `dashboard.html`, `journal.html`).
- `96fcf4f` 2026-06-15 : ajout de `assets/auth.js`, `index.html`, `brief-claude-code-journal-ffn.md` → mise en place de l'authentification Supabase et des rôles (brief en 6 étapes, voir section 5).
- `e6920f5` 2026-06-19 : ajout de `CLAUDE.md`.
- 2026-06-15 → 2026-07-15 : nombreux dépôts manuels sans message descriptif (contenu non documenté ; d'après le CLAUDE.md d'origine : relais, voyage, observations de nations, filtrage par `competition_coaches`, modale de changement de mot de passe) `[À VÉRIFIER]`.
- `4afbef7` 2026-07-20 : onglet Entraîneurs — carte pré-compétition complète (sections A/B/C/D), carte équivalente pour le pré-comp staff ; fonction partagée `getFormeByCoach()` fusionnant la forme physique/psychologique depuis 5 sources (journal, voyage, pré-comp, staff compétition, pré-comp staff) ; l'indicateur « Entraîneurs actifs » inclut les `staff_responsable`.
- `501d368` 2026-07-22 : rang initial modifiable pour toutes les compétitions (admin : ajout et modification d'épreuve, sauf relais ; dashboard : colonne « Rang init. »), stocké dans `events.ranking_initial`.
- `4842173` 2026-07-22 : suppression du « Tableau complet » (doublon avec ids DOM dupliqués) ; « Résultats par épreuve » devient le tableau unique avec édition en ligne ; saisie des résultats manquants avec rang initial ; pour les relais, saisie des 4 temps de passage (`relay_results` puis `relay_splits`).
- `877b3f6` 2026-07-27 : Rapport final Eau Libre (types `CEJ_EL`, `EL_Senior`) — « Minima battus » et « Places gagnées » remplacés par Podiums, Top 10, taux de classés + tableau des médailles ; correction : `EL_Senior` n'était pas reconnu comme « classement sans tours ».
- `ca7ccdc` 2026-07-28 : retrait de l'indicateur « Classés » (restent Podiums et Top 10) ; bouton « Exporter en PDF » visible en haut du rapport, masqué pendant la capture.
- `9c940be` 2026-07-28 : export PDF du rapport final en **portrait** (les autres onglets restent en paysage) ; option html2pdf `pagebreak.mode: ['avoid-all','css','legacy']` ; `page-break-inside:avoid` sur les blocs et sur chaque ligne des tableaux longs.
- `ff2a981` 2026-07-28 : fusion dans `main` — HEAD actuel.

Méthode de vérification utilisée dans ces commits : rendu Playwright avec client Supabase simulé (et html2pdf simulé), contrôle de l'absence d'erreur console.

État au 2026-11-11 : branche `main`, à jour avec `origin/main`, aucune modification locale (hors `docs/historique-claude.md` créé et `CLAUDE.md` complété ce jour, non commités).

---

## 4. Comparaison ancien dossier / dépôt (2026-11-11)

Ancien dossier : `/Users/pierre.hui/Desktop/Relève-Perf32/Journal de competition` (non modifié). Les sessions archivées avaient été lancées depuis `/Users/pierre.hui/Desktop/Journal de competition`, déplacé depuis.

| Fichier | Ancien dossier | Dépôt | Constat |
|---|---|---|---|
| `admin.html` | oui (2026-07-22) | oui | identiques |
| `journal.html` | oui (2026-07-15) | oui | identiques |
| `CLAUDE.md` | oui (2026-06-19) | oui | identiques avant la présente mise à jour |
| `brief-claude-code-journal-ffn.md` | oui | oui | identiques |
| `dashboard.html` | oui (2026-07-27) | oui | **différents** : l'ancien dossier correspond au commit `877b3f6` ; il lui manque les deux commits du 2026-07-28 (`ca7ccdc`, `9c940be`). Le dépôt est plus récent. |
| `index.html`, `assets/auth.js` | non | oui | présents seulement dans le dépôt |
| `instructions_claude_code.md` | oui | non | instructions J-1…J-6 / A-1…A-5 du 2026-06-02 (919 lignes) |
| `NOTE_detectPhase_v2.md` | oui | non | note de conception des phases + SQL `voyage_entries` |
| `gestion-utilisateurs-ffn.txt` | oui | non | aide-mémoire SQL de gestion des comptes et rôles (résumé en section 5) |
| `COMEN_engagements.csv` | oui | non | exemple d'import d'engagements (46 lignes, noms de nageurs) |
| `journal_sauvegarde.html` | oui | non | sauvegarde du journal du 2026-05-29, avant refonte des phases ; contient la clé anon de l'ancien projet Supabase |
| `dashboard-2.html` | oui | non | ancienne version du dashboard (2026-05-28) ; contient la clé anon de l'ancien projet Supabase |
| PDF « L'entraînement sous pression… australien » | oui | non | étude ayant inspiré les critères de posture d'entraîneur |

Conclusion : le dépôt est la référence pour le code. L'ancien dossier ne vaut plus que pour ses documents annexes (ne pas y reprendre `dashboard.html`).

---

## 5. Détails techniques

### Authentification (brief du 2026-06-15, `brief-claude-code-journal-ffn.md`)

Six étapes : (1) `assets/auth.js` — client partagé et utilitaires ; (2) `index.html` — connexion ; (3) `admin.html` réservé au rôle `dtn` ; (4) `journal.html` — identité issue du jeton de session, suppression du sélecteur d'identité ; (5) `dashboard.html` — vue globale DTN, vue filtrée entraîneur ; (6) vérification d'ensemble.

Contrat avec la base : Supabase Auth par email + mot de passe ; `app_metadata.role` (`dtn` ou `entraineur`) et `app_metadata.coach_id` (facultatif pour un DTN) ; le statut « staff responsable » n'est **pas** dans le jeton, il se lit dans `coaches.role`. Le brief limitait le périmètre de Claude au code front-end : le SQL, les comptes et les politiques RLS sont gérés par le propriétaire. Aucun « mode dev » contournant la connexion.

Écart entre le brief et le CLAUDE.md d'origine : le brief prévoyait de masquer les onglets `entraineurs`, `staff`, `rapport` pour un entraîneur ; le CLAUDE.md d'origine décrit un accès à tous les onglets avec périmètre filtré, et un journal filtré par `competition_coaches` pour tous les rôles. Le CLAUDE.md (plus récent) fait foi ; le masquage effectif des onglets est `[À VÉRIFIER]` dans le code.

### Gestion des utilisateurs (`gestion-utilisateurs-ffn.txt`, ancien dossier)

Tout se fait dans Supabase > SQL Editor, par mise à jour de `auth.users.raw_app_meta_data` : attribuer le rôle `dtn` (avec ou sans `coach_id`), attribuer le rôle `entraineur` (avec `coach_id`), passer de l'un à l'autre (retirer `coach_id` avec l'opérateur `- 'coach_id'`), supprimer un compte (les données de journal liées au `coach_id` sont conservées), lister les droits (`select email, raw_app_meta_data ->> 'role', raw_app_meta_data ->> 'coach_id' from auth.users`). Retrouver l'identifiant d'un coach : `select id, prenom, nom from public.coaches order by nom`. Après un changement de rôle, la personne doit se déconnecter puis se reconnecter. Réinitialisation de mot de passe : console Supabase > Authentication > Users.

### Phases du journal

`detectPhase(dateStr, comp)` renvoie un tableau parmi `comp`, `postcomp`, `voyage`, `stage`, selon les dates de la compétition ; tableau vide = hors période. Zones HTML présentes dans `journal.html` : `zone-precomp`, `zone-precomp-staff`, `zone-comp`, `zone-staff`, `zone-postcomp`, `zone-postcomp-staff`, `zone-voyage`, `zone-hors-periode` (pas de `zone-stage`).

| Phase | Entraîneur | Staff responsable |
|---|---|---|
| `stage` | `zone-precomp` → `precomp_entries` | `zone-precomp-staff` → `precomp_staff_entries` |
| `voyage` | `zone-voyage` → `voyage_entries` | idem + « Conditions du voyage » |
| `comp` | `zone-comp` → `journal_entries` + `results` | `zone-staff` → `staff_entries` |
| `postcomp` | `zone-postcomp` → `postcomp_entries` | `zone-postcomp-staff` → `postcomp_staff_entries` |

### Types de compétition (`admin.html`)

Valeurs relevées dans le sélecteur : `CEJ`, `CE`, `CMJ`, `CM`, `COMEN`, `CEJ_EL` (CEJ/CMJ Eau Libre), `EL_Senior` ; liste complète à lire dans `admin.html`. Classement sans tours (tour `finale` unique) : `COMEN`, `CEJ_EL`, `EL_Senior`.

### Export PDF

html2pdf.js 0.10.1 chargé depuis cdnjs dans `journal.html` et `dashboard.html`. Fonctions : `generateStaffPDF()` (journal), `exportDashboardPDF()` (dashboard : onglet courant ; portrait pour le rapport final, paysage sinon).

### Tailles au 2026-11-11

`admin.html` 1 665 lignes, `dashboard.html` 2 839, `journal.html` 2 558, `index.html` 91.

---

## 6. Pistes abandonnées et contradictions tranchées

- **Projet Supabase** : les sessions de mai-juin 2026, le brief d'authentification et les fichiers `journal_sauvegarde.html` / `dashboard-2.html` pointent vers un premier projet (`<identifiant masqué>`). Le code actuel (`assets/auth.js`) et le CLAUDE.md d'origine pointent vers `<identifiant masqué>`. Le plus récent fait foi. La date et la raison du changement de projet ne sont pas documentées `[À VÉRIFIER]`.
- **Colonnes voyage** : la session du 2026-06-02 annonçait `embarquement_nc`, `attente_retard`, `pb_administratif`, `pb_administratif_obs`. Le code actuel et le CLAUDE.md d'origine utilisent `embarquement` (entier, nul si non concerné), `attente`, `probleme_admin` ('Oui'/'Non'), `probleme_admin_obs`. Les noms actuels font foi.
- **Checklist administrative pré-comp staff** : ajoutée (v2) puis retirée (v3) le 2026-05-29. Le CLAUDE.md d'origine mentionne pourtant des colonnes `log_convocations … log_creneaux_entrainement` dans `precomp_staff_entries` et le commit `4afbef7` cite une rubrique « logistique » du pré-comp staff : la présence actuelle de cette checklist dans le formulaire est `[À VÉRIFIER]`.
- **Catégorie « sportif » du journal staff** : retirée du formulaire le 2026-05-29 (v3). Le CLAUDE.md d'origine décrit encore « scores logistique/sportif/vie de groupe » pour `staff_entries` `[À VÉRIFIER]`.
- **Colonne du temps de référence** : le CLAUDE.md d'origine nomme `events.temps_reference` ; le code (`admin.html`, `journal.html`, `dashboard.html`) n'utilise que `events.temps_engagement`. Le code fait foi.
- **Fenêtre J-14 automatique** : abandonnée au profit de dates explicites (2026-06-01).
- **Sélecteur d'identité dans le journal** : supprimé avec l'authentification (2026-06-15) ; l'identité vient de la session.
- **Barre de sauvegarde unique** : supprimée le 2026-06-01 (un bouton par zone).
- **Indicateur « Classés » du rapport Eau Libre** : ajouté le 2026-07-27, retiré le 2026-07-28.
- **« Tableau complet » des résultats** : supprimé le 2026-07-22 (doublon).
- **Branche de développement** : le CLAUDE.md d'origine cite `claude/dazzling-babbage-fz6fzr`, qui n'existe plus sur `origin`. Les derniers travaux ont utilisé `claude/friendly-allen-4v743x`, fusionnée dans `main`.

---

## 7. Points à vérifier

1. Adresse GitHub Pages de l'application et visibilité du dépôt (public ou privé).
2. Date et raison du changement de projet Supabase ; sort de l'ancien projet.
3. RLS réellement activée sur toutes les tables (la note de 2026-06-01 créait `voyage_entries` avec une politique « acces_total »).
4. Migrations SQL effectivement exécutées (colonnes voyage, `type_competition`, `ranking_initial`, briefings, `resto_quantite`).
5. Contenu des dépôts manuels du 2026-06-15 au 2026-07-15 (aucun message de commit).
6. Checklist administrative et catégorie « sportif » : état réel dans le formulaire et en base.
7. Nombre de curseurs de posture (5 ou 6) dans le formulaire actuel.
8. Masquage des onglets `entraineurs` / `staff` / `rapport` pour un entraîneur.
9. Issue du dépannage du collègue (2026-06-03).
10. Sort de la branche distante `claude/friendly-allen-4v743x` (fusionnée, supprimable ?).

---

## Annexe A — Copie intégrale du CLAUDE.md d'origine (version du 2026-06-19)

Conservée telle quelle pour ne rien perdre lors de la réorganisation du `CLAUDE.md` du 2026-11-11. Certaines mentions sont dépassées (branche de développement, voir section 6).

~~~~markdown
# CLAUDE.md — Journal de compétition FFN

Documentation de référence pour les sessions Claude Code. À mettre à jour à chaque modification significative.

---

## Vue d'ensemble

Application web **statique** (HTML/CSS/JS vanilla) hébergée sur GitHub Pages, connectée à un backend **Supabase** (Auth + Postgres). Elle permet au staff technique de la Fédération Française de Natation de saisir et consulter le journal de suivi des compétitions internationales.

**Dépôt** : `ffnapp/journalcompetition`  
**Branche de développement** : `claude/dazzling-babbage-fz6fzr`  
**Supabase** : `<URL du projet Supabase : voir assets/auth.js>`

---

## Fichiers

```
index.html          — Page de connexion (email + mot de passe)
admin.html          — Back-office DTN : compétitions, épreuves, relais, nageurs, entraîneurs
journal.html        — Saisie du journal par les entraîneurs (phase pré/compétition/post + voyage)
dashboard.html      — Tableau de bord de synthèse pour les DTN et entraîneurs
assets/auth.js      — Client Supabase partagé + utilitaires d'auth + modale changement MDP
```

---

## Authentification et rôles

### Client partagé (`assets/auth.js`)

```js
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
function getRole(session)    { return session?.user?.app_metadata?.role || 'anon'; }
function getCoachId(session) { return session?.user?.app_metadata?.coach_id || null; }
async function requireSession(redirectTo = 'index.html') { ... }
async function requireRole(role) { ... }  // redirige vers journal.html si rôle incorrect
async function logout() { ... }
```

`auth.js` est chargé **avant** tout script inline dans chaque page. Ne jamais redéclarer `sb`.

### Rôles (stockés dans `app_metadata` du JWT Supabase)

| Rôle | `admin.html` | `dashboard.html` | `journal.html` |
|---|---|---|---|
| `dtn` | Accès complet | Toutes les compétitions, tous les entraîneurs | Seulement les compétitions où il est dans `competition_coaches` |
| `entraineur` | Interdit (redirect) | Vue filtrée sur son `coach_id`, compétitions via `competition_coaches` | Seulement ses compétitions via `competition_coaches` |

**Règle clé** :
- **Dashboard** : le DTN a une vue globale (toutes compétitions), les entraîneurs sont filtrés par `competition_coaches`.
- **Journal** : *tous* les rôles (DTN inclus) ne voient que les compétitions où ils figurent dans `competition_coaches`.

### Règles d'accès dashboard (`dashboard.html`)

```js
let _dashRole = 'dtn', _dashCoachId = null;

// Compétitions : DTN voit tout, entraîneur filtré par competition_coaches
if (_dashRole === 'dtn') {
  comps = (await sb.from('competitions').select('*').order('date_debut', { ascending: false })).data || [];
} else {
  const { data } = await sb.from('competition_coaches')
    .select('competition_id, competitions(*)').eq('coach_id', _dashCoachId);
  comps = (data || []).map(r => r.competitions).filter(Boolean);
}

// Données : filtrées par coach_id pour les non-DTN uniquement
function applyCoachFilter(query) {
  if (_dashRole !== 'dtn') return query.eq('coach_id', _dashCoachId);
  return query;
}
```

La table `results` n'est **pas** filtrée par `coach_id` (vue collective des résultats sportifs, intentionnel).

### Règles d'accès journal (`journal.html`)

```js
// Compétitions : TOUS les rôles (DTN inclus) filtrés par competition_coaches
const { data: links } = await sb.from('competition_coaches')
  .select('competition_id, competitions(*)')
  .eq('coach_id', myCoachId);
```

Un DTN sans `coach_id` dans son token voit un bandeau d'information et ne peut pas saisir.

---

## Tables Supabase

### Tables de référence

| Table | Description |
|---|---|
| `competitions` | Compétitions (nom, lieu, date_debut, date_fin) |
| `coaches` | Entraîneurs et staff (prenom, nom, role: 'entraineur'/'staff_responsable') |
| `athletes` | Nageurs (prenom, nom, date_naissance, sexe) |
| `nations` | Nations étrangères observées (code, nom) |

### Tables de liaison

| Table | Description |
|---|---|
| `competition_coaches` | Affectation entraîneurs ↔ compétitions (`competition_id`, `coach_id`) |
| `competition_athletes` | Affectation nageurs ↔ compétitions (`competition_id`, `athlete_id`) |

### Tables de saisie — journal entraîneur

| Table | Phase | Contenu principal |
|---|---|---|
| `precomp_entries` | Pré-compétition | `forme_generale`, `mental_motivation`, `mental_confiance`, `mental_anxiete`, `points_attention`, `objectifs_rappel`, `scenarios_anticipes`, `plans_contingence`, `relation_incidents`, `forme_sensations` |
| `journal_entries` | Compétition (quotidien) | `date_entree`, `forme_physique` (1-5), `forme_psychologique` (1-5), `etat_groupe`, `apprentissages`, `mot_du_jour`, `themes` (array), `eval_communication/stress/decisions/presence` (1-5), `observations_contexte/forme` |
| `postcomp_entries` | Post-compétition | Bilan nageur individuel, récupération, retour expérience |
| `voyage_entries` | Voyage aller/retour | `type_journee` ('aller'/'retour'), `date_entree`, `forme_physique`, `forme_psychologique`, `qualite_voyage` (1-5), `embarquement` (integer, null si NC), `attente` (text), `probleme_admin` ('Oui'/'Non'), `probleme_admin_obs` |
| `nation_observations` | Compétition | `nation_id`, `date_obs`, `observation` (text), `a_retenir` (text) |

### Tables de saisie — staff responsable

| Table | Phase | Contenu principal |
|---|---|---|
| `precomp_staff_entries` | Pré-compétition | Checklist logistique (log_convocations… log_creneaux_entrainement), groupe_forme_generale, groupe_motivation, groupe_cohesion, composition_staff, objectifs_groupe |
| `staff_entries` | Compétition (quotidien) | Scores logistique/sportif/vie de groupe (1-5), vie_medecin, observations_generales |
| `postcomp_staff_entries` | Post-compétition | Bilan staff, conclusions |

### Tables de résultats sportifs

| Table | Description |
|---|---|
| `events` | Épreuves individuelles (`competition_id`, `athlete_id`, `epreuve`, `tour`, `date_epreuve`, `heure`, `temps_reference`) |
| `results` | Résultats (`event_id`, `coach_id`, `a_nage`, `temps`, `rang`, `observations`) |
| `relay_events` | Épreuves relais (`competition_id`, `coach_id`, `epreuve`, `date_epreuve`, `heure`) |
| `relay_athletes` | Composition relais (`relay_event_id`, `athlete_id`, `position` 1-4) |
| `relay_results` | Résultat du relais (`relay_event_id`, `temps_final`, `rang`) |
| `relay_splits` | Passages individuels (`relay_result_id`, `athlete_id`, `position`, `temps_passage`) |

### Migration SQL requise (à exécuter si pas encore fait)

```sql
-- Colonnes voyage manquantes
ALTER TABLE voyage_entries
  ADD COLUMN IF NOT EXISTS embarquement integer,
  ADD COLUMN IF NOT EXISTS attente text,
  ADD COLUMN IF NOT EXISTS probleme_admin text,
  ADD COLUMN IF NOT EXISTS probleme_admin_obs text;
```

---

## Architecture des pages

### `index.html` — Connexion

- Formulaire email/MDP → `sb.auth.signInWithPassword()`
- Redirige vers `admin.html` (rôle `dtn`) ou `journal.html` (autres rôles)
- Vérifie la session existante au chargement et redirige directement

### `admin.html` — Back-office DTN

Accès réservé au rôle `dtn` (vérifié via `requireRole('dtn')`).

**Onglets** :
- **Compétitions** : CRUD compétitions, affectation entraîneurs et nageurs
- **Programme** : création épreuves individuelles + relais par compétition
- **Nageurs** : liste des nageurs (toutes compétitions)
- **Entraîneurs** : liste des entraîneurs (toutes compétitions)

**Gestion des relais** :
- Types disponibles : `4x50m Nage libre`, `4x100m Nage libre`, `4x200m Nage libre`, `4x100m 4 Nages`, `4x50m 4 Nages`, `4x50m 4 Nages Mixte`, `4x100m Nage libre Mixte`, `Relais 4x1500m`
- Détection automatique dans `onEpreuveChange()` : si épreuve relais → masque champ nageur, affiche 4 sélecteurs de nageurs + référent
- Sauvegarde dans `relay_events` + `relay_athletes` (positions 1-4)

### `journal.html` — Saisie entraîneur

Accès réservé aux sessions authentifiées. Chaque entraîneur saisit son propre carnet.

**Phases** (onglets en bas de page) :
1. **Pré-compétition** → `precomp_entries`
2. **Compétition** (quotidien) → `journal_entries` + `results` + `nation_observations` + relais
3. **Post-compétition** → `postcomp_entries`
4. **Voyage** (aller/retour) → `voyage_entries`
5. **Rapport staff** → `precomp_staff_entries` / `staff_entries` / `postcomp_staff_entries` (rôle `staff_responsable` uniquement)

**Variable globale clé** : `activeCoachId` (depuis `getCoachId(session)`), `activeCompId`.

**Saisie résultats relais** :
- `loadRelaySection()` : charge les relais affectés au coach sur la compétition active
- `saveRelayResult(relayEventId, athletes)` : upsert dans `relay_results` puis `relay_splits`

### `dashboard.html` — Tableau de bord

Accès à tous les rôles authentifiés, périmètre filtré par rôle.

**Variables globales** :
```js
let activeCompId = null;
let _dashRole = 'dtn', _dashCoachId = null;
let allJournals = [], allResults = [], allNationObs = [], allEvents = [];
let allStaffEntries = [], allPrecompStaff = [], allPostcompStaff = [];
let allVoyageEntries = [], allPrecompEntries = [];
```

**Onglets** :

| Onglet | Fonction | Contenu |
|---|---|---|
| Synthèse | `renderSynthese()` | KPIs (entraîneurs actifs = union journal+voyage+precomp, nageurs, épreuves, taux saisie), top nations, résultats récents |
| Entraîneurs | `renderEntraineurs()` | Bandeau état de forme (physique/psychologique, tendance), questionnaires pré-compétition (`allPrecompEntries`), journal détaillé par coach |
| Résultats | `renderResultats()` | Stats DF/Finale/Podium/Engagement, tableau par épreuve et par nageur |
| Nations | `renderNations()` | Thèmes d'apprentissage, observations groupées par nation avec `observation` et `a_retenir` |
| Mots du jour | `renderMots()` | Citations des entraîneurs |
| Staff | `renderStaffSubTab()` | 4 sous-onglets : Compétition / Pré-compétition / Post-compétition / Voyage |
| Rapport | `renderRapportFinal()` | Export PDF synthétique |

**Filtres** : par date (`filterDate`) et par entraîneur (`filterCoach`). Le filtre entraîneur est masqué pour les non-DTN. Fonction `getFiltered()` applique les deux filtres sur `allJournals`, `allResults`, `allNationObs`.

---

## Contraintes techniques

1. **Pas de `<script type="module">`** — tout le JS est en scripts classiques pour que les handlers `onclick` inline et les fonctions globales fonctionnent.
2. **Un seul client Supabase** — déclaré dans `assets/auth.js`, réutilisé partout via la variable globale `sb`. Ne jamais redéclarer.
3. **Ordre de chargement** dans chaque page :
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="assets/auth.js"></script>
   ```
4. **Pas d'`await` au niveau racine** — toujours dans une IIFE async ou une fonction.
5. **Sécurité réelle = RLS Supabase** — les redirections/masquages JS sont du confort d'interface uniquement.
6. **Clé anon uniquement** — jamais de `service_role` ni aucun secret dans le dépôt.
7. **Charte visuelle FFN** — variables CSS `--navy`, `--blue`, `--accent` (#E8632A), police DM Sans / DM Mono. Pas de nouvelle dépendance externe.

---

## Charte des modifications

- Toujours faire des **retouches ciblées** (str_replace), jamais réécrire un fichier en entier.
- Mettre à jour ce fichier `CLAUDE.md` à chaque modification qui change le comportement, les tables, les rôles ou les champs sauvegardés.
- Commits sur la branche `claude/dazzling-babbage-fz6fzr`, auteur `Claude <noreply@anthropic.com>`.
- Si le push est bloqué (403), livrer les fichiers via `SendUserFile`.

~~~~

## Décisions de Pierre du 2026-11-12 (réponses aux questions ouvertes)
Complète et remplace les [À VÉRIFIER] correspondants ci-dessus. « Fait » = exécuté le 2026-11-12 ; « À faire » = décidé, non exécuté.
- Dépôt PUBLIC ; GitHub Pages : https://ffnapp.github.io/JOURNALCOMPETITION/dashboard.html ; Pierre est le seul contributeur. L'URL et l'identifiant du projet Supabase sont masqués dans ces fichiers (à pousser).
- Ancien projet Supabase : inactif. La clé anon de l'ancien projet, présente dans l'ancien dossier `Journal de competition`, est à révoquer (action de Pierre dans Supabase).
- RLS activée partout et migrations SQL passées.
- Documents à verser dans le dépôt : `gestion-utilisateurs-ffn.txt`, `NOTE_detectPhase_v2.md`, `instructions_claude_code.md` (pas `COMEN_engagements.csv`, noms de nageurs). À FAIRE.
- Branche distante `claude/friendly-allen-4v743x` (déjà fusionnée) : À SUPPRIMER ; non fait.
