# CLAUDE.md — Journal de compétition FFN

Documentation de référence pour les sessions Claude Code. À mettre à jour à chaque modification significative.
Réorganisé le 2026-11-11 ; la version d'origine (2026-06-19) est recopiée intégralement dans `docs/historique-claude.md` (annexe A), avec le détail des extraits de code.

## 1. Objectif

Application web **statique** (HTML/CSS/JS vanilla) hébergée sur GitHub Pages, connectée à un backend **Supabase** (Auth + Postgres). Elle permet au staff technique de la Fédération Française de Natation de saisir et consulter le journal de suivi des compétitions internationales : carnet quotidien des entraîneurs et du responsable d'équipe (stage, voyage, compétition, bilan), résultats sportifs, observations des nations étrangères, tableau de bord et rapport final PDF pour la DTN.

## 2. Dépôts GitHub liés

| Élément | Valeur |
|---|---|
| Dépôt | `https://github.com/FFNAPP/JOURNALCOMPETITION.git` (organisation FFNAPP, visible des autres membres ; public/privé `[À VÉRIFIER]`) |
| Branche | `main` (branches de travail Claude Code web : `claude/...`, fusionnées dans `main`) |
| Dossier local | `/Users/pierre.hui/Desktop/Relève-Perf32/JOURNALCOMPETITION` |
| Hébergement | GitHub Pages (adresse `[À VÉRIFIER]`) |
| Supabase | `https://wvxgkadxqzftjrtxotuw.supabase.co` (URL et clé anon dans `assets/auth.js`) |
| Ancien dossier | `/Users/pierre.hui/Desktop/Relève-Perf32/Journal de competition` — copie de travail périmée, à ne pas utiliser pour le code (voir historique, section 4) |

## 3. Structure et fichiers clés

Chemins vérifiés le 2026-11-11.

```
index.html          — Page de connexion (email + mot de passe)
admin.html          — Back-office DTN : compétitions, épreuves, relais, nageurs, entraîneurs
journal.html        — Saisie du journal (stage / voyage / compétition / bilan, entraîneur et staff)
dashboard.html      — Tableau de bord de synthèse et rapport final PDF
assets/auth.js      — Client Supabase partagé + utilitaires d'auth + modale changement de mot de passe
brief-claude-code-journal-ffn.md — Brief d'origine du système d'accès (2026-06-15)
docs/historique-claude.md        — Historique détaillé
```

### Pages

- **`index.html`** : `sb.auth.signInWithPassword()` ; redirige vers `admin.html` (rôle `dtn`) ou `journal.html` (autres) ; redirection directe si une session existe.
- **`admin.html`** (réservé `dtn`, `requireRole('dtn')`) — onglets Compétitions (création, modification, affectation entraîneurs et nageurs), Programme (épreuves individuelles et relais), Nageurs, Entraîneurs. Bouton « Modifier » sur chaque ligne (fenêtre générique `#edit-modal`, `openEditModal`, `editCompetition/editCoach/editAthlete/editEvent`). Import CSV des engagements avec `temps_engagement`. Tours générés par `getToursForEpreuve(epreuve, typeComp)`. Relais : détection dans `onEpreuveChange()` (4 sélecteurs de nageurs + référent), enregistrés dans `relay_events` + `relay_athletes`.
- **`journal.html`** — chaque utilisateur saisit son propre carnet. Variables clés : `activeCoachId` (issu de `getCoachId(session)`), `activeCompId`. `detectPhase()` renvoie un **tableau** de phases (`stage`, `voyage`, `comp`, `postcomp`) d'après les dates de la compétition ; plusieurs zones peuvent s'afficher le même jour, chacune avec son bouton d'enregistrement. Zones : `zone-precomp`, `zone-precomp-staff`, `zone-comp`, `zone-staff`, `zone-postcomp`, `zone-postcomp-staff`, `zone-voyage`, `zone-hors-periode`. Relais : `loadRelaySection()`, `saveRelayResult()`. Export PDF du bilan staff : `generateStaffPDF()`.
- **`dashboard.html`** — filtres par date (`filterDate`) et par entraîneur (`filterCoach`, masqué pour les non-DTN), appliqués par `getFiltered()`.

| Onglet | Fonction | Contenu |
|---|---|---|
| Synthèse | `renderSynthese()` | Indicateurs (entraîneurs actifs, nageurs, épreuves, taux de saisie), état des entraîneurs, nations, résultats récents |
| Résultats | `renderResultats()` | Statistiques DF / Finale / Podium / Engagement (`computeResultStats`), tableau unique par épreuve avec édition en ligne et rang initial |
| Entraîneurs | `renderEntraineurs()` | État de forme (`getFormeByCoach()`), questionnaires pré-compétition entraîneur et staff, journal détaillé |
| Nations | `renderNations()` | Thèmes d'apprentissage, observations par nation (`observation`, `a_retenir`) |
| Mots du jour | `renderMots()` | Citations des entraîneurs |
| Staff | `renderStaffSubTab()` | Sous-onglets Compétition / Pré-compétition / Post-compétition / Voyage |
| Rapport Final | `renderRapportFinal()` | Rapport synthétique, export PDF (`exportDashboardPDF()`) |

### Tables Supabase

| Groupe | Tables |
|---|---|
| Référence | `competitions` (nom, lieu, type, dates de stage / voyage / compétition / bilan), `coaches` (role : `entraineur` / `staff_responsable`), `athletes`, `nations` |
| Liaison | `competition_coaches`, `competition_athletes` |
| Journal entraîneur | `precomp_entries`, `journal_entries` (formes 1-5, `themes`, `mot_du_jour`, `eval_*` 1-5), `postcomp_entries`, `voyage_entries`, `nation_observations` |
| Journal staff | `precomp_staff_entries`, `staff_entries`, `postcomp_staff_entries` |
| Résultats | `events` (`epreuve`, `tour`, `temps_engagement` — et non `temps_reference` comme l'indiquait la version d'origine —, `ranking_initial`), `results` (`a_nage`, `temps`, `rang`), `relay_events`, `relay_athletes` (positions 1-4), `relay_results`, `relay_splits` |

Détail des colonnes : annexe A de l'historique. Colonnes voyage en vigueur : `embarquement` (entier, nul si non concerné), `attente`, `probleme_admin` ('Oui'/'Non'), `probleme_admin_obs`.

## 4. Décisions et conventions

### Rôles (dans `app_metadata` du jeton Supabase : `role`, `coach_id`)

| Rôle | `admin.html` | `dashboard.html` | `journal.html` |
|---|---|---|---|
| `dtn` | Accès complet | Toutes les compétitions, tous les entraîneurs | Seulement les compétitions où il figure dans `competition_coaches` |
| `entraineur` | Interdit (redirection) | Vue filtrée sur son `coach_id` et ses compétitions | Seulement ses compétitions |

- Le statut « staff responsable » n'est pas dans le jeton : il se lit dans `coaches.role`.
- Un DTN sans `coach_id` voit un bandeau d'information dans le journal et ne peut pas saisir.
- Dashboard : `applyCoachFilter()` filtre par `coach_id` pour les non-DTN ; la table `results` n'est **pas** filtrée (vue collective, intentionnel).
- Gestion des comptes et des rôles : en SQL dans Supabase, par le propriétaire (aide-mémoire résumé dans l'historique, section 5). Après un changement de rôle, l'utilisateur doit se reconnecter.

### Contraintes techniques

1. **Pas de `<script type="module">`** : scripts classiques, pour que les `onclick` en ligne et les fonctions globales fonctionnent.
2. **Un seul client Supabase** : variable globale `sb` déclarée dans `assets/auth.js`. Ne jamais la redéclarer.
3. **Ordre de chargement** dans chaque page : `supabase-js@2` (CDN jsdelivr), puis `assets/auth.js`, puis le script de la page.
4. **Pas d'`await` au niveau racine** : toujours dans une fonction ou une IIFE async.
5. **Sécurité réelle = RLS Supabase** : redirections et masquages JS ne sont que du confort d'interface.
6. **Clé anon uniquement** : jamais de `service_role` ni d'autre secret dans le dépôt. Aucun « mode dev » contournant la connexion.
7. **Charte visuelle FFN** : variables CSS `--navy`, `--blue`, `--accent` (#E8632A), polices DM Sans / DM Mono. Pas de nouvelle dépendance externe (seule bibliothèque ajoutée : html2pdf.js 0.10.1, via cdnjs).

### Règles métier

- **Phases pilotées par des dates explicites** de la compétition (`date_stage_debut/fin`, `date_voyage_aller/retour`, `date_debut/fin`, `date_bilan`). Pas de fenêtre « J-14 » calculée : sans date renseignée, pas de formulaire. La phase `stage` utilise les formulaires pré-compétition.
- **Classement au temps sans tours** pour les types `COMEN`, `CEJ_EL`, `EL_Senior` : une seule épreuve par course, tour `finale`, afin que les podiums (`tour = 'finale'`, `rang ≤ 3`) soient comptés correctement.
- **Eau libre** (5km, 7,5km, 10km, Relais 4x1500m, KnockOut) : pas de temps d'engagement ; rapport final centré sur Podiums, Top 10 et tableau des médailles.
- **Statistiques** : taux DF = demi-finalistes / min(engagés, 2) par épreuve ; taux Finale = finalistes / demi-finalistes ; taux Podium = rangs ≤ 3 / finalistes ; engagement battu = temps < temps de référence.
- **Export PDF** : portrait pour le rapport final, paysage pour les autres onglets ; blocs protégés par `page-break-inside:avoid`.

## 5. État actuel et travaux en cours

- Dépôt propre, `main` = `origin/main`, dernier commit `ff2a981` (2026-07-28). Aucun travail en cours connu depuis cette date.
- Derniers travaux (juillet 2026) : questionnaires pré-compétition détaillés dans le dashboard, fusion de l'état de forme entraîneur + staff, rang initial modifiable partout, tableau de résultats unique, saisie des temps de passage des relais, rapport final Eau Libre, mise en page PDF.
- Fichiers créés ou complétés le 2026-11-11 et non commités : `CLAUDE.md`, `docs/historique-claude.md`.
- La branche distante `claude/friendly-allen-4v743x` existe encore (déjà fusionnée).
- Migration à exécuter dans Supabase si ce n'est pas déjà fait `[À VÉRIFIER]` :

```sql
ALTER TABLE voyage_entries
  ADD COLUMN IF NOT EXISTS embarquement integer,
  ADD COLUMN IF NOT EXISTS attente text,
  ADD COLUMN IF NOT EXISTS probleme_admin text,
  ADD COLUMN IF NOT EXISTS probleme_admin_obs text;
```

- Autres points ouverts `[À VÉRIFIER]` : RLS activée sur toutes les tables ; présence actuelle de la checklist administrative et de la catégorie « sportif » dans les formulaires staff ; masquage des onglets Entraîneurs / Staff / Rapport pour un entraîneur (liste complète : historique, section 7).

## 6. Problèmes rencontrés et solutions retenues

| Problème | Solution |
|---|---|
| Écran vide : `applyPhase()` cherchait un élément `zone-stage` inexistant | Retrait de `stage` de la liste des zones + test de nullité |
| `Identifier ... has already been declared` (constante en double) bloquant tout le script, d'où des `... is not defined` en cascade | Une seule déclaration par constante ; même cause possible avec un second `const sb` |
| « Rien ne s'affiche » chez un collègue alors que cela fonctionne ailleurs | `startJournal` recharge et attend les dates de la compétition (condition de course réseau) ; ouverture sur la première date configurée ; carte « Hors période » listant les périodes avec accès direct ; bandeau d'erreur visible (`showFatalError`) |
| Voyage et stage le même jour | `detectPhase()` renvoie un tableau ; zones affichées simultanément |
| Deux tableaux de résultats en doublon avec ids DOM dupliqués | Tableau unique « Résultats par épreuve » avec édition en ligne |
| `EL_Senior` non reconnu comme classement sans tours (podiums exclus) | Ajouté aux types sans tours |
| Blocs coupés entre deux pages dans le PDF | Portrait pour le rapport final, `pagebreak.mode: ['avoid-all','css','legacy']`, `page-break-inside:avoid` |
| Bouton d'export PDF peu visible | Bouton « Exporter en PDF » en haut du rapport, masqué pendant la capture |
| Ouverture en `file://` (erreurs d'origine) | Tester via un serveur local (`python3 -m http.server`) ou sur GitHub Pages |

## 7. Consignes de travail de Pierre

- **Retouches ciblées** uniquement : ne modifier que ce qui est demandé, ne jamais réécrire un fichier en entier ni toucher à la logique métier voisine.
- Mettre à jour ce `CLAUDE.md` à chaque modification qui change le comportement, les tables, les rôles ou les champs sauvegardés.
- Claude n'intervient pas sur Supabase : fournir le SQL (migrations, rôles) que Pierre exécute lui-même dans le SQL Editor.
- Vérifier avant de livrer : syntaxe du script, absence d'erreur console (rendu Playwright avec client Supabase simulé, utilisé en juillet 2026).
- Travailler étape par étape en validant chaque étape ; signaler clairement ce qui reste à faire côté Pierre (SQL, retransmission des fichiers).
- Commits des sessions Claude Code web : sur une branche `claude/...` puis fusion dans `main`, auteur `Claude <noreply@anthropic.com>`, messages en français décrivant le changement et la vérification. (La branche `claude/dazzling-babbage-fz6fzr` citée à l'origine n'existe plus.)
- Si le push est bloqué (403), livrer les fichiers via `SendUserFile` ; Pierre les dépose alors sur GitHub (« Add files via upload »).
- Dépôt partagé dans l'organisation : aucun secret, ton professionnel, textes en français.

## 8. Chronologie

| Date | Événement |
|---|---|
| 2026-05-28 / 29 | Premières versions locales (`dashboard-2.html`, `journal_sauvegarde.html`, ancien dossier) |
| 2026-05-29 | Briefing v2 (formulaires staff pré/post-compétition, onglet Staff) puis v3 (curseurs de posture, exports PDF, onglet Rapport Final) |
| 2026-06-01 | Correctif `zone-stage`, épreuves eau libre, phases superposées par dates explicites |
| 2026-06-02 | Instructions J-/A- (voyage par rôle, briefings, non-compétiteurs, type de compétition, tours automatiques, import CSV) ; statistiques DF / Finale / Podium |
| 2026-06-03 | Dépannage collègue, édition complète dans l'admin, COMEN au classement au temps ; premier dépôt sur GitHub (`2030990`) |
| 2026-06-15 | Authentification Supabase et rôles : `assets/auth.js`, `index.html`, brief (`96fcf4f`) |
| 2026-06-19 | Ajout du `CLAUDE.md` d'origine (`e6920f5`) |
| 2026-06-15 → 07-15 | Nombreux dépôts manuels (relais, voyage, nations, filtrage par compétition) `[À VÉRIFIER]` |
| 2026-07-20 | Questionnaires pré-compétition détaillés, `getFormeByCoach()` (`4afbef7`) |
| 2026-07-22 | Rang initial modifiable (`501d368`) ; tableau de résultats unique + temps de passage relais (`4842173`) |
| 2026-07-27 | Rapport final Eau Libre (`877b3f6`) |
| 2026-07-28 | Retrait de l'indicateur « Classés », export PDF visible, PDF portrait (`ca7ccdc`, `9c940be`, fusion `ff2a981`) |
| 2026-11-11 | Consolidation de la mémoire : ce fichier et `docs/historique-claude.md` |

---

Détail complet (récit des sessions, historique git, comparaison avec l'ancien dossier, contradictions, points à vérifier, copie du CLAUDE.md d'origine) : voir `docs/historique-claude.md`.
