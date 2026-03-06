# STACK.md — Spécifications Techniques
## HelloArabic PWA

> Ce document est la référence technique pour Claude Code.
> Chaque fichier créé doit respecter ces conventions.

---

## 1. Stack technique

| Couche | Technologie | Version / Notes |
|--------|-------------|-----------------|
| Langage | JavaScript ES2022+ | Modules natifs (`import`/`export`) |
| CSS | Vanilla CSS | Variables custom, pas de preprocesseur |
| Routing | Hash router custom | Fichier `js/router.js` |
| État | Store pattern maison | Fichier `js/store.js` |
| Persistance | IndexedDB | Via wrapper `idb-keyval` (CDN) |
| Audio | Web Speech API + HTMLAudioElement | TTS fallback, fichiers MP3 prioritaires |
| Icônes | Feather Icons | CDN `cdn.jsdelivr.net/npm/feather-icons` |
| Fonts | Google Fonts | `Inter` (UI) + `Amiri` (arabe) |
| PWA | Service Worker + manifest.json | Cache-first pour assets, network-first pour data |
| Déploiement | GitHub Pages | Branche `main`, pas de build step |
| Scripts data | Python 3.10+ | Génération decks, extraction vocab leçons |

### Ce qu'on n'utilise PAS
- Pas de React, Vue, Svelte, Angular
- Pas de bundler (Vite, Webpack, Parcel)
- Pas de TypeScript
- Pas de Tailwind / Bootstrap / framework CSS
- Pas de Node.js côté serveur
- Pas de base de données serveur (Phase 1)

---

## 2. Arborescence du projet

```
helloarabic/
├── index.html                          ← Shell unique (< 50 lignes)
├── manifest.json
├── sw.js
│
├── css/
│   ├── variables.css                   ← Tokens design (couleurs, spacing, fonts)
│   ├── base.css                        ← Reset, body, typo globale
│   ├── components.css                  ← Boutons, cards, modals, toggles, badges
│   ├── layout.css                      ← Grilles, header, nav, page containers
│   └── pages/
│       ├── home.css
│       ├── words.css                   ← Tous les modes mots (flash, learn, test…)
│       ├── conversations.css           ← Leçon, player, dialogue
│       └── review.css                  ← Dashboard SRS
│
├── js/
│   ├── app.js                          ← Bootstrap : init DB, charger store, démarrer router
│   ├── router.js                       ← Hash router avec params
│   ├── store.js                        ← État global réactif
│   ├── db.js                           ← Couche IndexedDB
│   ├── audio.js                        ← TTS + HTMLAudio unifié
│   ├── utils.js                        ← shuffle, normalize, levenshtein, dates
│   ├── srs.js                          ← Logique Leitner (calcul boîte, next review)
│   │
│   ├── pages/                          ← Chaque page = 1 fichier
│   │   ├── home.js
│   │   ├── words-home.js
│   │   ├── words-deck.js
│   │   ├── words-flashcards.js
│   │   ├── words-learn.js
│   │   ├── words-test.js
│   │   ├── words-match.js
│   │   ├── words-listen.js
│   │   ├── words-image.js
│   │   ├── conv-home.js
│   │   ├── conv-lesson.js
│   │   ├── conv-exercise.js
│   │   ├── review-dashboard.js
│   │   ├── alphabet.js
│   │   └── roots.js
│   │
│   └── components/                     ← Composants réutilisables
│       ├── header.js
│       ├── card.js
│       ├── progress-bar.js
│       ├── modal.js
│       ├── player.js
│       ├── dialogue-line.js
│       └── tab-bar.js
│
├── data/
│   ├── courses.json
│   ├── themes.json
│   ├── vocabulary/                     ← 94 fichiers JSON existants (NE PAS TOUCHER)
│   │   ├── premiers-mots/
│   │   │   ├── couleurs.json
│   │   │   └── ...
│   │   └── ...
│   ├── decks/
│   │   ├── arabic.json                 ← Généré par Python
│   │   └── french.json
│   ├── lessons/
│   │   ├── index.json                  ← Métadonnées de toutes les leçons
│   │   └── traditions-1-1.json         ← Contenu complet par leçon
│   ├── alphabet/
│   │   └── letters.json
│   └── roots/
│       └── roots.json
│
├── images/                             ← Existant (NE PAS TOUCHER)
├── audio/
│   ├── words/
│   └── lessons/
│
└── scripts/
    ├── generate-decks.py               ← Existant (à adapter format sortie)
    └── generate-lesson-vocab.py        ← Nouveau
```

---

## 3. Conventions de code

### 3.1 — JavaScript

#### Modules
```javascript
// TOUJOURS utiliser ES Modules
import { navigate } from '../router.js';
import { store } from '../store.js';

// TOUJOURS exporter explicitement
export function renderHome(params) { ... }
export default class PlayerComponent { ... }
```

#### Nommage
```
Fichiers         : kebab-case          → words-flashcards.js
Fonctions        : camelCase           → renderDeckList()
Constantes       : UPPER_SNAKE_CASE    → MAX_RETRY_COUNT
Classes          : PascalCase          → AudioPlayer
Variables DOM    : camelCase + $prefix → $container, $playBtn
Événements       : on + Action         → onCardSwipe, onAnswerSelect
Pages (export)   : render + PageName   → renderWordsHome()
```

#### Pattern de page
Chaque fichier dans `js/pages/` suit ce pattern :

```javascript
// js/pages/words-home.js
import { store } from '../store.js';
import { navigate } from '../router.js';
import { renderHeader } from '../components/header.js';

// Sélecteur du conteneur principal
const $app = () => document.getElementById('app');

export function renderWordsHome(params) {
  const course = store.get('currentCourse');
  const themes = store.get('themes');

  $app().innerHTML = `
    ${renderHeader({ title: `${course.flag} ${course.nameLocal}`, back: '#/home' })}
    <main class="page-content">
      <div class="themes-grid">
        ${themes.map(t => themeCard(t)).join('')}
      </div>
    </main>
  `;

  bindEvents();
}

function themeCard(theme) {
  return `
    <div class="theme-card" data-id="${theme.id}" style="--theme-color: ${theme.color}">
      <div class="theme-card__icon">${theme.icon}</div>
      <div class="theme-card__name">${theme.name}</div>
      <div class="theme-card__name-ar">${theme.nameAr}</div>
      <div class="theme-card__count">${theme.deckCount} decks</div>
    </div>
  `;
}

function bindEvents() {
  $app().querySelectorAll('.theme-card').forEach(el => {
    el.addEventListener('click', () => {
      navigate(`/mots/${el.dataset.id}`);
    });
  });
}
```

#### Règles strictes
- **Pas de `var`** — uniquement `const` et `let`
- **Pas de `window.` pour stocker des globales** — utiliser le store
- **Pas d'inline `onclick=`** dans le HTML — utiliser `addEventListener` dans `bindEvents()`
- **Pas d'`innerHTML` avec des données utilisateur non-échappées** — échapper avec `escapeHtml()`
- **Pas de `document.write()`**
- **Pas de `eval()`**
- **Pas de fonctions de plus de 40 lignes** — découper
- **Pas de fichiers de plus de 300 lignes** — découper en sous-modules

#### Utilitaire d'échappement obligatoire
```javascript
// js/utils.js
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

### 3.2 — CSS

#### Variables (tokens design)
```css
/* css/variables.css */
:root {
  /* Couleurs — Dark theme (défaut) */
  --bg-primary: #0B0F16;
  --bg-secondary: #121826;
  --bg-card: #1A2233;
  --bg-hover: #1E2A3D;
  --border: #2A3544;
  --border-hover: #3A4554;

  --text-primary: #FFFFFF;
  --text-secondary: #B8C1D1;
  --text-tertiary: #8E97A8;

  --accent-blue: #58a6ff;
  --accent-green: #3fb950;
  --accent-orange: #d29922;
  --accent-red: #f85149;
  --accent-purple: #a371f7;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 20px;
  --space-2xl: 24px;
  --space-3xl: 32px;
  --space-4xl: 40px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 16px;
  --radius-full: 50%;

  /* Fonts */
  --font-ui: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-arabic: 'Amiri', serif;

  /* Font sizes */
  --text-xs: 0.75rem;
  --text-sm: 0.85rem;
  --text-base: 1rem;
  --text-lg: 1.1rem;
  --text-xl: 1.3rem;
  --text-2xl: 1.5rem;
  --text-3xl: 2rem;
  --text-4xl: 2.5rem;

  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-base: 0.2s ease;
  --transition-slow: 0.4s ease;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.2);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.3);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.4);

  /* Z-index scale */
  --z-base: 1;
  --z-dropdown: 10;
  --z-modal: 100;
  --z-toast: 200;

  /* Layout */
  --max-width: 500px;
  --header-height: 60px;
  --player-height: 120px;
}

/* Light theme override */
body.light-mode {
  --bg-primary: #F5F7FA;
  --bg-secondary: #FFFFFF;
  --bg-card: #F0F3F8;
  --bg-hover: #E8EDF3;
  --border: #E1E8F0;
  --border-hover: #CBD5E0;

  --text-primary: #1A1A1A;
  --text-secondary: #666666;
  --text-tertiary: #999999;

  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.1);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
}
```

#### Nommage CSS : BEM simplifié
```css
/* Bloc */
.theme-card { ... }

/* Élément */
.theme-card__icon { ... }
.theme-card__name { ... }

/* Modificateur */
.theme-card--active { ... }
.theme-card--locked { ... }

/* États */
.is-loading { ... }
.is-hidden { ... }
.is-flipped { ... }
```

#### Règles CSS strictes
- **Pas de styles inline** (`style="..."`) dans le HTML généré — tout dans les fichiers CSS
- **Pas de `!important`** sauf cas exceptionnel documenté
- **Pas de sélecteurs d'ID** pour le styling (`#myElement { }`) — IDs réservés au JS
- **Utiliser les variables CSS** pour toute valeur de couleur, taille, espacement
- **Mobile-first** : styles de base = mobile, `@media (min-width: 768px)` pour desktop
- **Pas de valeurs magiques** : si un nombre apparaît 2+ fois, en faire une variable

### 3.3 — HTML

#### index.html — Shell minimal
```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="theme-color" content="#0B0F16">
  <title>HelloArabic</title>
  <link rel="manifest" href="manifest.json">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/variables.css">
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/components.css">
  <link rel="stylesheet" href="css/layout.css">
  <link rel="stylesheet" href="css/pages/home.css">
  <link rel="stylesheet" href="css/pages/words.css">
  <link rel="stylesheet" href="css/pages/conversations.css">
  <link rel="stylesheet" href="css/pages/review.css">
</head>
<body>
  <div id="app"></div>
  <script src="https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js"></script>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

Le `<div id="app">` est le seul conteneur. Tout le reste est généré dynamiquement par JS.

### 3.4 — Données JSON

- **Pas de `.js` pour les données** — uniquement `.json`
- Chargement via `fetch()` + cache en mémoire dans le store
- Encodage UTF-8, `ensure_ascii=False` dans les scripts Python
- Les fichiers JSON existants dans `data/vocabulary/` ne sont jamais modifiés à la main — uniquement via les scripts Python

---

## 4. Patterns d'architecture

### 4.1 — Router (`js/router.js`)

Le router écoute `hashchange` et appelle la fonction `render` de la page correspondante.

```javascript
// API publique :
route(pattern, handler)    // Enregistre une route
navigate(path)             // Navigue vers un hash
getCurrentRoute()          // Retourne { path, params }
```

Patterns supportés :
```
'/home'                     → match exact
'/mots/:themeId'            → match avec 1 param
'/mots/:themeId/:deckId'    → match avec 2 params
```

Le handler reçoit un objet `params` :
```javascript
route('/mots/:themeId/:deckId', (params) => {
  // params = { themeId: 'premiers-mots', deckId: 'couleurs' }
  renderWordsDeck(params);
});
```

### 4.2 — Store (`js/store.js`)

État global centralisé. Pas réactif au sens framework (pas de proxy/signals) mais avec un système de callbacks simples.

```javascript
// API publique :
store.get(key)                   // Lire une valeur
store.set(key, value)            // Écrire une valeur
store.subscribe(key, callback)   // Réagir aux changements
```

Clés principales du store :
```
currentCourse      → Object : cours sélectionné (arabic/french)
themes             → Array  : liste des thèmes
decks              → Array  : decks chargés pour le cours actif
currentDeck        → Object : deck en cours
currentLesson      → Object : leçon en cours
preferences        → Object : { theme, frontSide, showTranslit, ... }
srsData            → Object : données SRS (chargées depuis IndexedDB)
favorites          → Object : { words: Set, lessons: Set, phrases: Set }
```

### 4.3 — Base de données (`js/db.js`)

Couche d'abstraction IndexedDB. Toutes les opérations sont `async`.

```javascript
// API publique :
await db.init()                           // Ouvrir/créer la DB
await db.getPreferences()                 // Lire préférences utilisateur
await db.savePreferences(prefs)           // Sauver préférences
await db.getSRS(courseId)                  // Lire toutes les données SRS d'un cours
await db.updateSRS(courseId, wordId, box, nextReview)
await db.getDueWords(courseId)            // Mots à réviser aujourd'hui
await db.getFavorites(courseId)           // Lire favoris
await db.toggleFavorite(courseId, type, id)
await db.getLessonProgress(courseId)      // Progression des leçons
await db.saveLessonProgress(courseId, lessonId, data)
await db.getStats(courseId)              // Statistiques globales
await db.updateStats(courseId, data)
```

Structure IndexedDB :
```
Database: "helloarabic"
├── Store: "preferences"     → clé: "global"
├── Store: "srs"             → clé: "{courseId}:{wordId}"
├── Store: "favorites"       → clé: "{courseId}"
├── Store: "lessonProgress"  → clé: "{courseId}:{lessonId}"
└── Store: "stats"           → clé: "{courseId}"
```

### 4.4 — SRS Leitner (`js/srs.js`)

```javascript
// API publique :
getBox(wordSRS)                    // Retourne le numéro de boîte (1-5)
getNextReviewDate(box)             // Calcule la prochaine date de révision
processAnswer(wordSRS, isCorrect)  // Retourne le nouveau wordSRS
isDueToday(wordSRS)                // Booléen : à réviser maintenant ?
getDueCount(allSRS)                // Nombre de mots à réviser aujourd'hui
```

Intervalles par boîte :
```
Boîte 1 → 1 jour
Boîte 2 → 3 jours
Boîte 3 → 7 jours
Boîte 4 → 14 jours
Boîte 5 → 30 jours (acquis)
```

### 4.5 — Audio (`js/audio.js`)

```javascript
// API publique :
await playWord(text, lang)         // TTS ou fichier audio
await playLessonAudio(lessonId)    // Fichier audio complet
seekTo(seconds)                    // Déplacer le curseur
setSpeed(rate)                     // 0.5, 0.75, 1.0, 1.25, 1.5
pause()
resume()
onTimeUpdate(callback)             // Pour sync karaoké
```

Priorité de source audio :
1. Fichier MP3 local (`audio/words/{id}.mp3`) si existant
2. Web Speech API en fallback (`SpeechSynthesisUtterance`)

### 4.6 — Composants (`js/components/`)

Chaque composant exporte une fonction qui retourne du HTML (string).

```javascript
// js/components/header.js
export function renderHeader({ title, back, actions = [] }) {
  return `
    <header class="page-header">
      ${back ? `<button class="back-btn" data-navigate="${back}">←</button>` : ''}
      <h1 class="page-header__title">${escapeHtml(title)}</h1>
      <div class="page-header__actions">
        ${actions.map(a => `<button class="icon-btn" data-action="${a.id}">${a.icon}</button>`).join('')}
      </div>
    </header>
  `;
}
```

Les événements sont rattachés dans le `bindEvents()` de la page, pas dans le composant.

---

## 5. Chargement des données

### Au démarrage (`app.js`)
1. `db.init()` — ouvrir IndexedDB
2. `fetch('data/courses.json')` → `store.set('courses', data)`
3. `fetch('data/themes.json')` → `store.set('themes', data)`
4. Charger les préférences depuis IndexedDB → `store.set('preferences', prefs)`
5. Charger le dernier cours utilisé
6. Démarrer le router

### Au choix d'un cours
1. `fetch(`data/decks/${courseId}.json`)` → `store.set('decks', data)`
2. `fetch('data/lessons/index.json')` → `store.set('lessonIndex', data)`
3. Charger SRS + favoris depuis IndexedDB pour ce cours

### À l'ouverture d'une leçon
1. `fetch(`data/lessons/${lessonId}.json`)` → `store.set('currentLesson', data)`
2. Lazy load — on ne charge pas toutes les leçons d'un coup

---

## 6. Service Worker (`sw.js`)

Stratégie de cache :
```
Cache-first :
  - css/*
  - js/*
  - images/*
  - fonts (Google Fonts)
  - feather-icons CDN

Network-first :
  - data/*.json (pour avoir les mises à jour)

Stale-while-revalidate :
  - audio/*
```

Le SW gère aussi un mécanisme de versioning :
```javascript
const CACHE_VERSION = 'v1.0.0';
```

Quand la version change, l'ancien cache est nettoyé.

---

## 7. Performance

- **Pas de chargement de données au-delà de ce qui est nécessaire** — lazy load les leçons et les gros decks
- **Pas de manipulation DOM inutile** — render une seule fois par navigation
- **Délégation d'événements** quand il y a beaucoup d'éléments (liste de decks, grille de thèmes)
- **`requestAnimationFrame`** pour les animations (swipe cards, progress bars)
- **Images optimisées** : WebP si possible, lazy loading natif (`loading="lazy"`)
- **Feather icons** : appeler `feather.replace()` une seule fois après chaque render de page

---

## 8. Compatibilité

Cibles navigateurs :
- Safari iOS 15+ (priorité — usage mobile)
- Chrome Android 90+
- Chrome Desktop 90+
- Firefox 90+

Fonctionnalités qui nécessitent un fallback :
- `SpeechSynthesis` — disponible partout sauf navigateurs très anciens
- IndexedDB — supporté partout, mais wrappé dans try/catch
- ES Modules — supporté partout sur les cibles

---

## 9. Sécurité

- **Échapper tout contenu dynamique** injecté dans le DOM via `escapeHtml()`
- **Pas de CDN non-vérifiés** — uniquement `cdn.jsdelivr.net`, `fonts.googleapis.com`
- **CSP headers** si possible via GitHub Pages (limité, mais `meta` tag)
- **Pas de secrets** dans le code — aucune API key côté client
- **Valider les données JSON** après fetch (vérifier que la structure est correcte avant usage)
