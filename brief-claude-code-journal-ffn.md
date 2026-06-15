# Brief Claude Code — Système d'accès du Journal de compétition FFN

## Contexte et périmètre

On ajoute un système de **connexion par identifiant + mot de passe** et de **contrôle d'accès par rôle** à une application existante hébergée sur GitHub Pages, composée de trois pages HTML autonomes qui parlent à Supabase :

- `admin.html` — gestion (compétitions, entraîneurs, nageurs, événements)
- `dashboard.html` — tableaux de synthèse
- `journal.html` — saisie du journal de compétition par les entraîneurs

**Ton périmètre = uniquement le code GitHub (front-end).** Tu ne peux PAS, et tu ne dois PAS, interagir avec Supabase : pas de SQL, pas de création de comptes, pas de modification de politiques. Tout le backend (RLS, comptes, métadonnées) est géré séparément par le propriétaire. Tu écris du code qui *suppose* ce backend prêt.

### Contrat backend (déjà défini, à respecter tel quel)

- Authentification : **Supabase Auth, email + mot de passe.**
- Chaque compte porte, dans `app_metadata` (présent dans le JWT de session) :
  - `role` : `"dtn"` ou `"entraineur"`
  - `coach_id` : l'`id` d'une ligne de la table `coaches`, **ou absent** (cas d'un DTN qui n'anime aucun groupe)
- Le statut « staff responsable » n'est PAS dans le JWT : il se lit dans `coaches.role` (valeur `"staff_responsable"` ou `"entraineur"`).
- La clé déjà présente dans les fichiers est la clé **anon** (publique, c'est normal). Tu ne dois JAMAIS introduire de clé `service_role` ni aucun secret dans le dépôt.

### Règles de rôle (à implémenter)

| | `admin.html` | `dashboard.html` | `journal.html` |
|---|---|---|---|
| **dtn** | accès complet | vue globale (inchangée) | son carnet si `coach_id`, sinon consultation/bandeau |
| **entraineur** | interdit (redirigé) | vue filtrée sur SON `coach_id` | son carnet uniquement |

---

## Contraintes techniques impératives (éviter les régressions)

1. **Ne modifie QUE ce qui est listé dans chaque étape.** Ne réécris pas les fichiers, ne touche pas à la logique métier existante (saisie, calculs, affichage, export PDF). Procède par retouches ciblées.
2. **Pas de `<script type="module">`.** Tout le JS reste en scripts classiques pour que les `onclick` inline et les fonctions globales continuent de fonctionner.
3. **Un seul client Supabase, partagé.** Il est créé dans `assets/auth.js`. Les trois fichiers doivent **supprimer** leur propre `const SUPABASE_URL / SUPABASE_KEY / sb = createClient(...)` et réutiliser le `sb` global d'`auth.js`. (Deux `const sb` dans la même page = erreur de syntaxe.)
4. **Ordre de chargement des scripts** dans chaque page, dans le `<head>` ou en haut du `<body>`, AVANT le script inline de la page :
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="assets/auth.js"></script>
   ```
5. **Pas de `await` au niveau racine** d'un script classique. La vérification de session doit être placée dans la fonction d'initialisation existante de la page (ou dans un `(async () => { ... })()`), pas en haut du fichier.
6. **La sécurité réelle est côté base (RLS).** Les redirections et masquages que tu codes sont du confort d'interface : un entraîneur qui force l'URL `admin.html` ne doit rien casser, et c'est la RLS (côté backend) qui l'en empêche. Ne suppose jamais que masquer un bouton protège la donnée.
7. **Cohérence visuelle** : reprends la charte des fichiers journal existants (mêmes variables CSS, mêmes polices, palette FFN navy/bleu/rouge). Aucune nouvelle dépendance.
8. **Travaille étape par étape** et valide chaque étape avec ses tests d'acceptation avant de passer à la suivante.

---

## ÉTAPE 1 — Créer `assets/auth.js` (module commun)

Créer le fichier `assets/auth.js` contenant le client partagé et les utilitaires. Reprendre l'URL et la clé anon depuis les fichiers existants (identiques aux trois).

```js
const SUPABASE_URL = 'https://bpdxdljctybdmtemubjh.supabase.co';
const SUPABASE_ANON_KEY = '<clé anon existante, reprise des fichiers actuels>';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Redirige vers la connexion si pas de session ; renvoie la session sinon.
async function requireSession(redirectTo = 'index.html') {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { location.href = redirectTo; return null; }
  return session;
}

function getRole(session)    { return session?.user?.app_metadata?.role || 'anon'; }
function getCoachId(session) { return session?.user?.app_metadata?.coach_id || null; }

// Exige un rôle précis ; sinon renvoie vers journal.html.
async function requireRole(role) {
  const session = await requireSession();
  if (!session) return null;
  if (getRole(session) !== role) { location.href = 'journal.html'; return null; }
  return session;
}

async function logout() { await sb.auth.signOut(); location.href = 'index.html'; }

// Déconnexion synchronisée (expiration de session, logout dans un autre onglet)
sb.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') location.href = 'index.html';
});
```

**Tests d'acceptation**
- Le fichier se charge sans erreur console quand `supabase-js` est chargé avant lui.
- `sb`, `requireSession`, `getRole`, `getCoachId`, `requireRole`, `logout` sont accessibles globalement depuis un autre script de la page.

---

## ÉTAPE 2 — Créer `index.html` (page de connexion)

Page d'entrée de l'application. Charte visuelle identique aux fichiers journal. Contenu :

- Un logo/titre FFN + sous-titre « Journal de compétition ».
- Deux champs : email, mot de passe.
- Un bouton « Se connecter ».
- Une zone de message d'erreur (cachée par défaut).
- Inclure `supabase-js` puis `auth.js` puis le script de la page.

Logique :

```js
// Si déjà connecté, ne pas rester sur la page de login
(async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (session) location.href = (getRole(session) === 'dtn') ? 'admin.html' : 'journal.html';
})();

async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) { errEl.textContent = 'Identifiants incorrects.'; errEl.style.display = 'block'; return; }
  location.href = (getRole({ user: data.user }) === 'dtn') ? 'admin.html' : 'journal.html';
}
```

- Le bouton appelle `login()` ; la touche Entrée dans les champs déclenche aussi `login()`.

**Tests d'acceptation**
- Mauvais identifiants → message d'erreur, pas de redirection.
- Bon identifiant `dtn` → redirige vers `admin.html`. Bon identifiant `entraineur` → vers `journal.html`.
- Recharger `index.html` en étant déjà connecté redirige automatiquement selon le rôle.

---

## ÉTAPE 3 — Brancher `admin.html` (DTN uniquement)

1. Supprimer le bloc `const SUPABASE_URL / SUPABASE_KEY / sb = createClient(...)` du script inline (désormais dans `auth.js`).
2. Ajouter les inclusions `supabase-js` + `auth.js` avant le script de la page.
3. Au tout début de l'initialisation de la page (dans la fonction d'init existante, ou un IIFE async exécuté au chargement) :
   ```js
   const session = await requireRole('dtn');
   if (!session) return; // un non-DTN a déjà été redirigé
   ```
4. Ajouter dans l'en-tête de la page un bouton « Déconnexion » appelant `logout()`.

**Tests d'acceptation**
- Un `entraineur` qui ouvre `admin.html` est redirigé vers `journal.html`.
- Un `dtn` accède à `admin.html` ; toutes les fonctions existantes marchent comme avant.
- Le bouton Déconnexion ramène à `index.html`.

---

## ÉTAPE 4 — Brancher `journal.html` (identité issue du JWT)

1. Supprimer le bloc `createClient(...)` inline ; ajouter les inclusions `auth.js`.
2. Au début de l'init :
   ```js
   const session = await requireSession();
   if (!session) return;
   const myCoachId = getCoachId(session);
   ```
3. **Supprimer le sélecteur d'identité côté client.** Aujourd'hui l'entraîneur (et son rôle staff) est choisi dans un menu déroulant qui fixe `activeCoachId` / `activeRole`. Ce choix doit disparaître :
   - `activeCoachId = myCoachId;`
   - Déterminer le statut staff en lisant la ligne du coach connecté :
     ```js
     let activeRole = 'entraineur';
     if (myCoachId) {
       const { data } = await sb.from('coaches').select('role').eq('id', myCoachId).maybeSingle();
       if (data?.role === 'staff_responsable') activeRole = 'staff_responsable';
     }
     ```
   - Conserver toute la logique existante qui dépend de `activeRole` (affichage/masquage des sections staff) — seule la *source* du rôle change.
4. **Cas DTN sans carnet** (`myCoachId` est `null`) : afficher un bandeau « Aucun carnet ne vous est attribué — la synthèse est disponible dans le tableau de bord. », masquer ou désactiver toute la zone de saisie et les boutons d'enregistrement. La navigation reste possible mais aucune écriture n'est tentée.
5. Ajouter un bouton « Déconnexion » (→ `logout()`).
6. Le sélecteur de compétition existant reste, mais alimenté seulement par les compétitions visibles de l'utilisateur (la RLS s'en charge ; ne pas coder de filtre spécial ici au-delà de l'existant).

**Tests d'acceptation**
- Plus aucun menu permettant de « choisir » quel entraîneur on est ; l'identité affichée correspond au compte connecté.
- Un `entraineur` staff voit ses sections staff ; un `entraineur` non-staff ne les voit pas.
- Un `dtn` avec `coach_id` peut saisir son carnet ; un `dtn` sans `coach_id` voit le bandeau et ne peut pas saisir.
- Toute la saisie/enregistrement existante fonctionne pour un entraîneur normal.

---

## ÉTAPE 5 — Brancher `dashboard.html` (vue globale DTN / vue filtrée entraîneur)

1. Supprimer le `createClient(...)` inline ; ajouter `auth.js`.
2. Au début de l'init :
   ```js
   const session = await requireSession();
   if (!session) return;
   const role = getRole(session);
   const myCoachId = getCoachId(session);
   ```
3. **Si `role === 'dtn'`** : comportement actuel inchangé (vue globale, tous les onglets).
4. **Si `role === 'entraineur'`** :
   - Masquer les onglets transversaux qui comparent plusieurs entraîneurs ou relèvent du pilotage DTN : **`entraineurs`, `staff`, `rapport`**. (Garder `synthese`, `resultats`, `nations`, `mots`.)
   - Renommer le titre de la vue en « Ma synthèse » (ou équivalent discret).
   - Ajouter `.eq('coach_id', myCoachId)` à chacune des requêtes de chargement des données de journal (journal_entries, results, nation_observations, staff_entries, precomp/postcomp). La RLS le garantit déjà côté base, mais ce filtre évite les vues vides et clarifie l'affichage.
   - Si un onglet conservé n'a aucune donnée pour ce coach, afficher l'état vide existant (ne pas planter).
5. Ajouter un bouton « Déconnexion » (→ `logout()`).

**Tests d'acceptation**
- Un `dtn` retrouve le dashboard global tel qu'avant.
- Un `entraineur` ne voit que ses propres données ; les onglets `entraineurs`, `staff`, `rapport` sont absents.
- Aucune requête ne renvoie les données d'un autre entraîneur.

---

## ÉTAPE 6 — Vérification d'ensemble

- Naviguer entre les quatre pages en restant connecté (même origine = session partagée, pas de reconnexion).
- Se déconnecter depuis n'importe quelle page renvoie à `index.html` et empêche l'accès direct aux autres pages (redirection).
- Aucune erreur console liée à un double `sb`, à un `await` racine, ou à un script `module`.
- Recherche dans tout le dépôt : la chaîne `service_role` n'apparaît nulle part.

---

## Notes pour la phase de construction « cachée »

- Pendant le développement, le backend peut tourner **sans RLS activée** : l'application fonctionne, et il suffit d'1 ou 2 comptes de test (créés côté Supabase par le propriétaire) pour exercer les redirections et le filtrage. Tu n'as rien à faire de spécial pour ça : ton code suppose simplement des sessions valides avec `app_metadata`.
- L'activation de la RLS et la coupure des inscriptions publiques seront faites par le propriétaire au moment de la bascule. Ton code doit donc déjà être « auth-ready » sans dépendre de l'ordre d'activation.
- Ne crée aucun mécanisme de contournement « mode dev » qui désactiverait la connexion : ce serait une faille.
