# CLAUDE.md — Journal de compétition FFN

Documentation de référence pour les sessions Claude Code. À mettre à jour à chaque modification significative.

---

## Vue d'ensemble

Application web **statique** (HTML/CSS/JS vanilla) hébergée sur GitHub Pages, connectée à un backend **Supabase** (Auth + Postgres). Elle permet au staff technique de la Fédération Française de Natation de saisir et consulter le journal de suivi des compétitions internationales.

**Dépôt** : `ffnapp/journalcompetition`  
**Branche de développement** : `claude/dazzling-babbage-fz6fzr`  
**Supabase** : `https://wvxgkadxqzftjrtxotuw.supabase.co`

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
