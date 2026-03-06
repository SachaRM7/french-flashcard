# PROMPTS-SEQUENCE.md — Plan d'exécution Claude Code
## HelloArabic PWA

> Ce document contient la liste exacte et ordonnée des prompts à envoyer à Claude Code.
> Chaque prompt est une **action unitaire**. Ne pas combiner plusieurs prompts en un.
> Après chaque bloc de prompts, un **checkpoint** indique quoi vérifier avant de continuer.
> 
> **Avant chaque session Claude Code**, donner ce contexte initial :
> ```
> Lis les fichiers dans /docs : ARCHITECTURE.md, STACK.md et DATA-SCHEMA.md.
> Ces documents définissent les conventions et schémas du projet HelloArabic.
> Respecte-les strictement pour chaque fichier que tu crées.
> ```

---

## PHASE 1 — Fondations (squelette technique)

L'objectif : avoir un shell qui fonctionne avec un router, un store, une DB, et une page blanche qui dit "Hello" quand on navigue. Aucune fonctionnalité métier.

---

### PROMPT 1.1 — Arborescence vide

```
Crée l'arborescence complète du projet HelloArabic telle que définie dans STACK.md section 2.
Crée uniquement les dossiers et des fichiers vides (ou avec un commentaire placeholder).
Ne crée PAS les fichiers dans data/vocabulary/ ni images/ — ils existent déjà.
Crée les dossiers suivants avec leurs fichiers vides :
- css/ (variables.css, base.css, components.css, layout.css, pages/home.css, pages/words.css, pages/conversations.css, pages/review.css)
- js/ (app.js, router.js, store.js, db.js, audio.js, utils.js, srs.js)
- js/pages/ (home.js, words-home.js, words-deck.js, words-flashcards.js, words-learn.js, words-test.js, words-match.js, words-listen.js, words-image.js, conv-home.js, conv-lesson.js, conv-exercise.js, review-dashboard.js, alphabet.js, roots.js)
- js/components/ (header.js, card.js, progress-bar.js, modal.js, player.js, dialogue-line.js, tab-bar.js)
- data/decks/ (vide)
- data/lessons/ (vide)
- data/alphabet/ (vide)
- data/roots/ (vide)
- audio/words/ (vide)
- audio/lessons/ (vide)
Chaque fichier JS doit contenir juste : // TODO: implement
Chaque fichier CSS doit contenir juste : /* TODO: implement */
```

---

### PROMPT 1.2 — index.html (shell)

```
Crée le fichier index.html tel que défini dans STACK.md section 3.3.
C'est un shell minimal de moins de 50 lignes.
Il contient :
- Les meta tags (viewport, apple-mobile-web-app, theme-color)
- Les liens vers Google Fonts (Inter + Amiri)
- Les liens vers tous les fichiers CSS dans l'ordre : variables.css, base.css, components.css, layout.css, puis les pages/*.css
- Le lien vers Feather Icons CDN
- Un unique <div id="app"></div>
- Un <script type="module" src="js/app.js"></script>
Aucun autre HTML dans le body.
```

---

### PROMPT 1.3 — manifest.json + meta PWA

```
Crée le fichier manifest.json pour une PWA appelée "HelloArabic" avec :
- name: "HelloArabic"
- short_name: "HelloArabic"
- start_url: "/"
- display: "standalone"
- background_color: "#0B0F16"
- theme_color: "#0B0F16"
- orientation: "portrait"
- Des icônes placeholder (on les remplacera plus tard) : 192x192 et 512x512
Ajoute aussi le lien <link rel="manifest"> dans index.html si ce n'est pas déjà fait.
```

---

### PROMPT 1.4 — css/variables.css

```
Implémente css/variables.css avec tous les tokens design définis dans STACK.md section 3.2 "Variables (tokens design)".
Copie exactement le bloc :root et body.light-mode tel que spécifié.
Inclus : couleurs (dark + light), spacing, radius, fonts, font sizes, transitions, shadows, z-index, layout.
```

---

### PROMPT 1.5 — css/base.css

```
Implémente css/base.css avec :
- Un reset CSS minimal (*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; })
- -webkit-tap-highlight-color: transparent sur *
- body : font-family var(--font-ui), background var(--bg-primary), color var(--text-primary), min-height 100vh, overflow-x hidden
- Styles de base pour la typographie arabe : .text-ar { font-family: var(--font-arabic); direction: rtl; }
- .text-translit { font-style: italic; color: var(--text-secondary); }
- Scrollbar custom subtle pour webkit
- ::selection avec accent-blue
```

---

### PROMPT 1.6 — js/utils.js

```
Implémente js/utils.js avec les fonctions utilitaires suivantes, toutes exportées :
- escapeHtml(str) — échappe les caractères HTML dangereux
- shuffle(array) — mélange Fisher-Yates, retourne un nouvel array
- removeHarakats(str) — supprime les diacritiques arabes (Unicode range 064B-065F et 0670)
- removeFrenchAccents(str) — normalize NFD + supprime 0300-036f
- normalizeAnswer(str, level) — normalize une réponse selon le niveau de correction ('flexible', 'moderate', 'strict')
- levenshtein(a, b) — distance de Levenshtein
- checkWrittenAnswer(userAnswer, correctAnswer, level) — retourne true/false
- formatDate(dateStr) — formate une date ISO en "6 mars 2026"
- isToday(dateStr) — vérifie si une date ISO est aujourd'hui
- daysBetween(dateStr1, dateStr2) — nombre de jours entre deux dates

Reprends la logique existante du projet (voir les fonctions shuffle, removeArabicDiacritics, normalizeAnswer, levenshtein, checkWrittenAnswer dans l'ancien index.html) mais adapte au nouveau format modulaire.
```

---

### PROMPT 1.7 — js/store.js

```
Implémente js/store.js — un store global simple.
API publique (toutes exportées) :
- store.get(key) → retourne la valeur
- store.set(key, value) → met à jour et notifie les subscribers
- store.subscribe(key, callback) → enregistre un callback appelé quand la clé change, retourne une fonction unsubscribe

Implémentation :
- Un objet _state privé
- Un objet _listeners privé (Map de key → Set de callbacks)
- store.set appelle tous les callbacks enregistrés pour cette clé
- Exporter un singleton : export const store = new Store();

Clés initiales à pré-remplir avec null :
currentCourse, courses, themes, decks, currentDeck, currentLesson, lessonIndex, preferences, favorites, srsData
```

---

### PROMPT 1.8 — js/db.js

```
Implémente js/db.js — la couche IndexedDB.
Utilise l'API IndexedDB native (pas de librairie externe).

La base s'appelle "helloarabic", version 1.
Stores (object stores) à créer dans onupgradeneeded :
- "preferences" (keyPath: "id")
- "srs" (keyPath: "key") avec un index sur "courseId" et un index sur "nextReview"
- "favorites" (keyPath: "courseId")
- "lessonProgress" (keyPath: "key") avec un index sur "courseId"
- "stats" (keyPath: "courseId")

API publique (toutes async, toutes exportées) :
- db.init() → ouvre la connexion, crée les stores si nécessaire
- db.getPreferences() → retourne l'objet preferences ou un objet par défaut
- db.savePreferences(prefs) → sauvegarde
- db.getSRS(courseId) → retourne tous les enregistrements SRS pour un cours
- db.updateSRS(courseId, cardId, data) → crée ou met à jour un enregistrement SRS
- db.getDueWords(courseId) → retourne les SRS dont nextReview <= aujourd'hui
- db.getFavorites(courseId) → retourne l'objet favoris ou { words: [], lessons: [], phrases: [] }
- db.saveFavorites(courseId, favorites) → sauvegarde
- db.getLessonProgress(courseId, lessonId) → retourne la progression d'une leçon ou null
- db.saveLessonProgress(courseId, lessonId, data) → sauvegarde
- db.getStats(courseId) → retourne les stats ou un objet par défaut
- db.saveStats(courseId, data) → sauvegarde

Les structures de données sont définies dans DATA-SCHEMA.md sections 10.1 à 10.5.
Exporter un singleton : export const db = new Database();
```

---

### PROMPT 1.9 — js/router.js

```
Implémente js/router.js — un hash router.
API publique (toutes exportées) :
- route(pattern, handler) → enregistre un pattern et son handler
- navigate(path) → change le hash (donc déclenche la navigation)
- getCurrentRoute() → retourne { path, params }
- startRouter() → écoute hashchange et traite le hash initial

Le router :
- Supporte les paramètres dynamiques : '/mots/:themeId/:deckId' matche '/mots/premiers-mots/couleurs' et passe { themeId: 'premiers-mots', deckId: 'couleurs' } au handler
- Essaie d'abord un match exact, puis les patterns avec paramètres
- Si aucune route ne matche, redirige vers '#/home'
- Le handler reçoit un objet params

La navigation globale :
- Délègue les clics sur [data-navigate] : tout élément avec cet attribut déclenche navigate(element.dataset.navigate) au clic
- Ce listener est attaché une seule fois sur document.body dans startRouter()
```

---

### PROMPT 1.10 — js/srs.js

```
Implémente js/srs.js — la logique de révision espacée Leitner.
API publique (toutes exportées) :

Constante INTERVALS :
- Boîte 1 → 1 jour
- Boîte 2 → 3 jours
- Boîte 3 → 7 jours
- Boîte 4 → 14 jours
- Boîte 5 → 30 jours

Fonctions :
- createSRSEntry(courseId, cardId) → retourne un nouvel objet SRS avec box=1, nextReview=aujourd'hui, reviewCount=0, etc. (voir DATA-SCHEMA.md section 10.2)
- processAnswer(srsEntry, isCorrect) → retourne un nouvel objet SRS mis à jour : si correct, box monte de 1 (max 5) ; si incorrect, box retombe à 1. Recalcule nextReview selon le nouvel intervalle. Incrémente reviewCount, correctCount ou wrongCount.
- isDueToday(srsEntry) → retourne true si nextReview <= aujourd'hui
- getDueCount(srsEntries) → retourne le nombre d'entrées dues aujourd'hui
- getBoxDistribution(srsEntries) → retourne { 1: count, 2: count, 3: count, 4: count, 5: count }
- getNextReviewDate(box) → retourne une date ISO string (YYYY-MM-DD)
```

---

### PROMPT 1.11 — js/audio.js

```
Implémente js/audio.js — la gestion audio unifiée.
API publique (toutes exportées) :

- playWord(text, lang) → joue un mot via Web Speech API (SpeechSynthesisUtterance). lang = code BCP47 ('ar-SA', 'fr-FR'). Rate = 0.8. Retourne une Promise qui resolve quand la lecture est finie.
- playAudioFile(url) → joue un fichier audio via HTMLAudioElement. Retourne une Promise.
- pause() → met en pause l'audio en cours
- resume() → reprend
- stop() → arrête et reset
- seekTo(seconds) → déplace le curseur de lecture (seulement pour les fichiers audio)
- setSpeed(rate) → change la vitesse (0.5, 0.75, 1.0, 1.25, 1.5)
- onTimeUpdate(callback) → enregistre un callback appelé avec le temps courant (pour le karaoké)
- getDuration() → retourne la durée totale en secondes
- getCurrentTime() → retourne le temps courant

Gère un seul HTMLAudioElement réutilisé (singleton interne).
speechSynthesis.cancel() avant chaque nouveau play pour éviter l'accumulation.
```

---

### PROMPT 1.12 — js/components/header.js

```
Implémente js/components/header.js — le composant header réutilisable.
Exporte une seule fonction : renderHeader({ title, back, actions })
- title : string — texte du titre
- back : string | null — hash de retour (ex: '#/home'). Si null, pas de bouton retour.
- actions : array d'objets { id, icon, label } — boutons d'action à droite. icon = nom Feather Icon. Default = [].

Retourne une string HTML :
<header class="page-header">
  [bouton retour si back] avec data-navigate="{back}"
  <h1 class="page-header__title">{title}</h1>
  <div class="page-header__actions">
    [boutons avec data-action="{id}" et l'icône Feather <i data-feather="{icon}"></i>]
  </div>
</header>

Utilise escapeHtml de utils.js pour le titre.
```

---

### PROMPT 1.13 — css/components.css + css/layout.css

```
Implémente css/components.css et css/layout.css.

components.css — styles des composants réutilisables :
- .back-btn : 40x40, bg var(--bg-secondary), border, border-radius var(--radius-md), couleur, cursor pointer, flex center
- .primary-btn : padding 14px 28px, bg var(--accent-blue), border-radius var(--radius-md), couleur blanche, font-weight 600, width 100%, transition
- .secondary-btn : idem mais bg var(--bg-secondary), border 1px solid var(--border)
- .icon-btn : 40x40, transparent, border 1px solid var(--border), border-radius var(--radius-lg), flex center
- .toggle : switch on/off (44x24, rond qui slide)
- .badge : petit badge coloré (padding 4px 12px, border-radius 12px, font-size var(--text-xs))
- .badge--green, .badge--orange, .badge--red, .badge--blue : variantes couleur
- .modal-overlay : position fixed, inset 0, bg rgba(0,0,0,0.6), z-index var(--z-modal), flex center
- .modal : bg var(--bg-secondary), border-radius var(--radius-xl), padding, max-width 400px, width 90%
- .modal__header, .modal__title, .modal__close

layout.css — styles de structure :
- #app : min-height 100vh, display flex, flex-direction column
- .page-header : display flex, align-items center, gap 12px, padding var(--space-xl), height var(--header-height)
- .page-header__title : flex 1, font-size var(--text-lg), font-weight 600, truncate (overflow hidden, text-overflow ellipsis, white-space nowrap)
- .page-header__actions : display flex, gap var(--space-sm)
- .page-content : flex 1, padding var(--space-xl), overflow-y auto, max-width var(--max-width), margin 0 auto, width 100%
- .themes-grid : display grid, grid-template-columns repeat(2, 1fr), gap var(--space-md)
- .deck-grid : display flex, flex-direction column, gap var(--space-md)
```

---

### PROMPT 1.14 — js/app.js + page d'accueil minimale

```
Implémente js/app.js — le point d'entrée de l'application.

app.js doit :
1. Importer db depuis './db.js'
2. Importer store depuis './store.js'
3. Importer { route, startRouter } depuis './router.js'
4. Importer les fonctions render de chaque page depuis './pages/*.js'

5. Définir une fonction async init() qui :
   a. Appelle await db.init()
   b. Charge les préférences : const prefs = await db.getPreferences(); store.set('preferences', prefs)
   c. Applique le thème : si prefs.theme === 'light', ajouter la classe 'light-mode' au body
   d. Fetch 'data/courses.json', parse, store.set('courses', data)
   e. Fetch 'data/themes.json', parse, store.set('themes', data)
   f. Enregistre les routes (voir liste ci-dessous)
   g. Appelle startRouter()
   h. Appelle feather.replace()

6. Routes à enregistrer :
   route('/', renderCourseSelect)
   route('/home', renderHome)
   route('/mots', renderWordsHome)
   route('/mots/:themeId', renderWordsTheme)  [pour l'instant = renderWordsHome avec filtre]
   route('/mots/:themeId/:deckId', renderWordsDeck)
   route('/conversations', renderConvHome)
   route('/revision', renderReviewDashboard)

7. Appeler init() au chargement

Pour l'instant, les pages n'existent pas encore en vrai.
Implémente AUSSI js/pages/home.js avec une fonction renderHome() minimale qui affiche :
- Le header avec le titre "HelloArabic"
- Deux grosses cartes cliquables : "📚 Vocabulaire" (navigate vers #/mots) et "💬 Conversations" (navigate vers #/conversations)
- Un petit encart "📝 X mots à réviser" (avec X = 0 pour l'instant)
- data-navigate sur les cartes pour la navigation

Implémente aussi un renderCourseSelect() dans js/pages/home.js qui affiche la liste des cours depuis store.get('courses') avec une carte par cours. Au clic, store.set('currentCourse', course) et navigate('/home').
```

---

### PROMPT 1.15 — Convertir courses.js et themes.js en JSON

```
Convertis les fichiers de données existants en JSON pur :

1. Lis data/courses.js et extrais le contenu de window.COURSES_DATA.
   Écris le résultat dans data/courses.json (array JSON pur, pas de variable JS).
   Change le champ decksFile de "data/arabic/decks.js" en "data/decks/arabic.json" (et idem pour french).

2. Lis data/themes.js et extrais le contenu de window.THEMES_DATA.
   Écris le résultat dans data/themes.json (array JSON pur).

Les anciens fichiers .js ne seront plus utilisés — ne les supprime pas mais ils sont obsolètes.
```

---

### PROMPT 1.16 — css/pages/home.css

```
Implémente css/pages/home.css pour la page d'accueil.
Styles nécessaires :
- .home-dashboard : padding, max-width var(--max-width), margin auto
- .home-greeting : text-align center, padding 30px 0 20px, h1 font-size var(--text-3xl), p color var(--text-secondary)
- .home-modes : display flex, flex-direction column, gap var(--space-lg), margin-top var(--space-xl)
- .home-mode-card : background var(--bg-secondary), border 1px solid var(--border), border-radius var(--radius-xl), padding var(--space-2xl), cursor pointer, display flex, align-items center, gap var(--space-xl), transition transform 0.2s et border-color 0.2s
- .home-mode-card:active : transform scale(0.98)
- .home-mode-card:hover : border-color var(--accent-blue)
- .home-mode-card__icon : font-size 2.5rem
- .home-mode-card__title : font-size var(--text-lg), font-weight 700
- .home-mode-card__desc : font-size var(--text-sm), color var(--text-secondary), margin-top 4px
- .home-review-banner : background var(--bg-card), border 1px solid var(--border), border-radius var(--radius-lg), padding var(--space-lg), text-align center, margin-top var(--space-xl), cursor pointer
- .course-select : display flex, flex-direction column, align-items center, justify-content center, min-height 100vh, padding var(--space-xl)
- .course-select__title : text-align center, margin-bottom var(--space-4xl)
- .course-grid : display flex, flex-direction column, gap var(--space-lg), max-width 400px, width 100%
- .course-card : reprendre le style existant (bg-secondary, border, border-radius 16px, padding 24px, flex, gap 20px, hover avec border-color accent-blue et translateY -2px)
```

---

### 🔵 CHECKPOINT 1 — Fondations

**Ouvre l'app dans le navigateur et vérifie :**

1. ✅ `index.html` charge sans erreur console
2. ✅ L'URL `#/` affiche la page de sélection de cours (Arabe + Français)
3. ✅ Cliquer sur "Arabe" navigue vers `#/home`
4. ✅ La page d'accueil affiche "📚 Vocabulaire" et "💬 Conversations"
5. ✅ Cliquer sur Vocabulaire navigue vers `#/mots` (page vide OK)
6. ✅ Le bouton retour fonctionne (data-navigate)
7. ✅ IndexedDB "helloarabic" est créée (vérifier dans DevTools > Application > IndexedDB)
8. ✅ Le thème dark est appliqué par défaut
9. ✅ `data/courses.json` et `data/themes.json` existent et sont du JSON valide
10. ✅ Aucune erreur dans la console

**Si un point échoue**, copie l'erreur et envoie ce prompt :
```
L'app a cette erreur : [coller l'erreur]. Corrige-la. Le contexte est dans /docs.
```

---

## PHASE 2 — Mode Mots (vocabulaire)

L'objectif : retrouver toutes les fonctionnalités actuelles du mode Mots, mais dans l'architecture propre.

---

### PROMPT 2.1 — Adapter generate-decks.py

```
Modifie scripts/generate-decks.py pour produire le nouveau format de decks.
Les changements sont détaillés dans DATA-SCHEMA.md section 12.

Résumé des changements :
- Sortie en .json au lieu de .js (plus de window.DECKS_DATA)
- Chemin de sortie : data/decks/arabic.json et data/decks/french.json
- Chaque carte a maintenant un champ "id" : "{deckId}:{index}"
- Nouveau champ "frontPlain" : version arabe sans harakats (utiliser re.sub pour supprimer Unicode 064B-065F et 0670)
- Nouveau champ "en" : copié depuis la carte vocab source
- Nouveau champ "image" : copié depuis la carte vocab source (ou null)
- Nouveau champ "audio" : toujours null pour l'instant
- Nouveau champ "tags" : array vide pour l'instant
- Le fichier de sortie a une structure enveloppante : { "version": timestamp, "courseId": "arabic", "decks": [...] }

Préserve tout le reste de la logique existante (cache de traductions, etc.).
Lance le script pour générer les nouveaux fichiers.
```

---

### PROMPT 2.2 — words-home.js (page thèmes)

```
Implémente js/pages/words-home.js — la page qui affiche la grille de thèmes.

La fonction renderWordsHome() :
1. Récupère store.get('themes') et store.get('decks')
2. Si decks est null, fetch le fichier decks du cours actif (store.get('currentCourse').decksFile), parse le JSON, store.set('decks', data.decks)
3. Affiche le header avec titre "{flag} {nameLocal}" et bouton retour vers #/home
4. Pour chaque thème, affiche une carte avec : icône, nom français, nom arabe, nombre de decks, nombre total de cartes
5. Au clic sur un thème, navigate vers #/mots/{themeId}

Quand l'URL est #/mots/:themeId (fonction renderWordsTheme avec param themeId) :
1. Filtre les decks qui appartiennent à ce thème (theme.decks contient les IDs)
2. Affiche le header avec le nom du thème + bouton retour vers #/mots
3. Affiche la liste des decks avec pour chacun : nom, nombre de cartes, nombre de cartes acquises (depuis IndexedDB SRS — pour l'instant affiche 0)
4. Au clic sur un deck, navigate vers #/mots/{themeId}/{deckId}

Styles dans css/pages/words.css :
- .theme-card : reprendre le style existant (bg-secondary, border, border-radius 16px, padding 20px 16px, text-align center, border-left 4px solid var(--theme-color))
- .theme-card__icon : font-size 2rem
- .theme-card__name : font-weight 600
- .theme-card__name-ar : font-size var(--text-sm), color var(--text-secondary), direction rtl
- .theme-card__count : font-size var(--text-xs), color var(--text-secondary)
- .deck-card : bg-secondary, border, border-radius var(--radius-lg), padding var(--space-lg), cursor pointer
- .deck-card__name : font-weight 600
- .deck-card__meta : color var(--text-secondary), font-size var(--text-sm)
```

---

### PROMPT 2.3 — words-deck.js (vue deck)

```
Implémente js/pages/words-deck.js — la page qui affiche un deck avec ses stats et le choix du mode.

La fonction renderWordsDeck(params) avec params = { themeId, deckId } :
1. Trouve le deck dans store.get('decks') par deckId
2. Store.set('currentDeck', deck)
3. Charge la progression SRS de ce deck depuis IndexedDB
4. Affiche :
   - Header avec nom du deck + retour vers #/mots/{themeId}
   - Stats : nombre total, acquis (box >= 4), en apprentissage (box 1-3)
   - Liste des modes disponibles (boutons) :
     * 🔄 Flashcards → navigate #/mots/{themeId}/{deckId}/flash
     * 📖 Apprendre → navigate #/mots/{themeId}/{deckId}/learn
     * 📝 Examen → navigate #/mots/{themeId}/{deckId}/test
     * 🔗 Associer → navigate #/mots/{themeId}/{deckId}/match
     * 🎧 Écoute → navigate #/mots/{themeId}/{deckId}/listen
     * 🖼️ Image → navigate #/mots/{themeId}/{deckId}/image

Styles dans css/pages/words.css (ajouter) :
- .deck-stats : display flex, justify-content center, gap var(--space-xl)
- .deck-stats__item : text-align center
- .deck-stats__value : font-size var(--text-2xl), font-weight 700
- .deck-stats__value--green : color var(--accent-green)
- .deck-stats__value--orange : color var(--accent-orange)
- .deck-stats__label : font-size var(--text-xs), color var(--text-secondary)
- .mode-list : display flex, flex-direction column, gap var(--space-md), max-width 400px, margin auto
- .mode-btn : reprendre le style existant (flex, align-items center, gap 14px, padding 16px 20px, bg-secondary, border, border-radius, cursor pointer)
- .mode-btn__icon : font-size 1.5rem, width 40px, text-align center
- .mode-btn__name : font-weight 600
- .mode-btn__desc : font-size var(--text-sm), color var(--text-secondary)
```

---

### PROMPT 2.4 — Options modal (composant)

```
Implémente js/components/modal.js — le composant modal d'options.

Exporte renderOptionsModal({ mode, currentOptions, courseConfig, deck }) qui retourne du HTML pour une modale avec :
- Titre "Options"
- Bouton fermer ✕
- Section "Général" :
  * Toggle "Mélanger les cartes" (id: shuffle)
  * Toggle "Favoris uniquement" (id: favoritesOnly) avec compteur de favoris
- Section "Direction" :
  * Deux boutons pour choisir le recto : frontLabel (ex: "Arabe") ou backLabel (ex: "Français")
- Section "Mode de réponse" (visible uniquement pour les modes learn/test/listen) :
  * Toggle QCM / Écrit
  * Si écrit : options de correction (Flexible / Modéré / Strict) avec radio buttons
- Overlay modal-overlay qui ferme au clic extérieur

Exporte aussi :
- showModal(htmlContent) → affiche la modale (ajoute au DOM, anime)
- hideModal() → ferme la modale
- bindModalEvents(onOptionChange) → attache les événements des toggles, le callback reçoit { key, value }
```

---

### PROMPT 2.5 — Flashcards (swipe)

```
Implémente js/pages/words-flashcards.js — le mode flashcard avec swipe.

Route : #/mots/:themeId/:deckId/flash

Enregistre cette route dans app.js.

Reprends TOUTE la logique existante du mode flashcards de l'ancien index.html :
- Carte avec face recto/verso, flip au tap
- Swipe gauche = "à revoir" (orange), swipe droite = "connu" (vert)
- Animation fly-left / fly-right
- Boutons de contrôle en bas (✗ rouge, flip, ✓ vert)
- Barre de progression avec compteurs gauche/droite
- Bouton étoile (favoris) — persister via db.saveFavorites()
- Bouton audio — jouer le mot via audio.playWord()
- Respect des options (shuffle, frontSide, favoritesOnly)
- Écran de complétion quand toutes les cartes sont vues
- Mise à jour SRS : swipe droite = processAnswer(srs, true), swipe gauche = processAnswer(srs, false)

Le touch/swipe doit fonctionner sur mobile (touchstart, touchmove, touchend) ET desktop (mousedown, mousemove, mouseup).

Pour le front/back, utilise les infos de store.get('currentCourse').config pour les fonts, directions, tailles.

Ajoute les styles nécessaires dans css/pages/words.css (reprendre les styles .swipe-card, .card-inner, .card-face, etc. de l'ancien index.html).
```

---

### PROMPT 2.6 — Mode Apprendre (QCM/écrit)

```
Implémente js/pages/words-learn.js — le mode apprendre.

Route : #/mots/:themeId/:deckId/learn
Enregistre cette route dans app.js.

Reprends la logique existante du mode "Apprendre" de l'ancien index.html :
- File de mots à apprendre (learnQueue)
- Pour chaque mot : question (affiche le front ou back selon options) + réponses possibles
- Mode QCM : 4 choix, highlight vert/rouge au clic
- Mode écrit : champ texte, validation avec checkWrittenAnswer() selon le niveau de correction
- Si mauvaise réponse : le mot est remis en fin de file (retrySet)
- Badge "Essayons à nouveau" pour les mots en retry
- Barre de progression
- Compteur correct/incorrect
- Bouton "Suivant" après chaque réponse
- Écran de complétion avec stats
- Mise à jour SRS après chaque réponse
- Bouton options (ouvre la modale du prompt 2.4)
```

---

### PROMPT 2.7 — Mode Examen

```
Implémente js/pages/words-test.js — le mode examen.

Route : #/mots/:themeId/:deckId/test
Enregistre cette route dans app.js.

Reprends la logique du mode "Test" de l'ancien index.html :
- Page de configuration initiale : choix du nombre de questions (10, 15, 20, toutes), mode QCM/écrit
- Barre de progression
- Questions aléatoires depuis le deck
- Pas de retry (contrairement au mode apprendre — chaque question n'apparaît qu'une fois)
- Page de résultats à la fin : score en %, cercle SVG animé, liste de toutes les réponses (correct/incorrect avec la bonne réponse)
- Boutons : "Recommencer", "Mode Apprendre", "Retour"
- Mise à jour SRS
```

---

### PROMPT 2.8 — Mode Association (match)

```
Implémente js/pages/words-match.js — le jeu d'association.

Route : #/mots/:themeId/:deckId/match
Enregistre cette route dans app.js.

Reprends la logique du mode "Match" de l'ancien index.html :
- Page d'intro "Prêt à jouer ?"
- Grille de cellules (4x4 ou 3x4 selon le nombre de cartes) mélangées
- Moitié front (arabe), moitié back (français) — l'utilisateur associe les paires
- Au tap : sélection d'une cellule, puis d'une seconde. Si c'est une paire, elles disparaissent. Sinon, flash rouge et pénalité temps.
- Timer en temps réel (affiché en haut)
- Écran de complétion avec le temps final
- Bouton rejouer / retour
```

---

### PROMPT 2.9 — Mode Écoute + Mode Image

```
Implémente js/pages/words-listen.js et js/pages/words-image.js.

Routes :
- #/mots/:themeId/:deckId/listen
- #/mots/:themeId/:deckId/image
Enregistre ces routes dans app.js.

Mode Écoute (reprendre l'existant) :
- Joue l'audio d'un mot (via audio.playWord), l'utilisateur doit deviner le mot
- Mode QCM ou écrit
- Bouton "Écouter" pour rejouer le son
- File avec retry, progression, complétion
- Mise à jour SRS

Mode Image (reprendre l'existant) :
- Affiche l'emoji ou l'image d'un mot, l'utilisateur doit deviner
- Mode QCM ou écrit
- File avec retry, progression, complétion
- Si la carte n'a ni emoji ni image, skip cette carte
- Mise à jour SRS
```

---

### 🔵 CHECKPOINT 2 — Mode Mots

**Vérifie :**

1. ✅ `#/mots` affiche la grille de 16 thèmes avec leurs icônes et compteurs
2. ✅ Cliquer un thème montre la liste de ses decks
3. ✅ Cliquer un deck montre les stats et 6 modes
4. ✅ Mode Flashcards : swipe fonctionne (touch + souris), flip, audio, favoris, progression
5. ✅ Mode Apprendre : QCM fonctionne, mode écrit fonctionne, retry des erreurs
6. ✅ Mode Examen : config initiale, questions, résultats avec score
7. ✅ Mode Match : grille, timer, paires, complétion
8. ✅ Mode Écoute : audio joue, deviner le mot
9. ✅ Mode Image : emoji/image affichée, deviner le mot
10. ✅ Les favoris sont persistés (fermer/rouvrir l'app, les favoris sont toujours là)
11. ✅ Les données SRS sont écrites dans IndexedDB (vérifier dans DevTools)
12. ✅ Les options (mélange, direction, correction) fonctionnent
13. ✅ Aucune erreur console

---

## PHASE 3 — Mode Conversations

L'objectif : une expérience de leçon riche avec dialogue, audio, vocabulaire, grammaire, exercices.

---

### PROMPT 3.1 — Données leçons : créer index.json et fichiers leçons

```
Crée les fichiers de données pour les leçons.

1. Crée data/lessons/index.json selon le schéma DATA-SCHEMA.md section 6.
   Migre les données depuis l'ancien data/lessons.js (window.LESSONS_DATA) et conversations.js (conversationsData.series).
   Fusionne les deux sources — les IDs de conversations.js font autorité quand il y a conflit.
   Chaque leçon dans l'index a les métadonnées légères (pas de dialogue complet).

2. Crée data/lessons/traditions-1-1.json selon le schéma DATA-SCHEMA.md section 7.
   C'est la seule leçon avec du contenu réel (dialogue, vocab, grammaire, exemples).
   Migre le contenu depuis les deux sources existantes.
   Ajoute les champs manquants : arPlain, translit (quand absent), fr (quand absent), audioStart/audioEnd (mettre des valeurs réalistes estimées).
   Ajoute le bloc speakers.
   Ajoute le bloc exercises avec au moins 2 fillBlanks et 1 dialogueBlanks.

3. Pour les autres leçons (traditions-1-2, traditions-2-1, traditions-3-1), crée des fichiers JSON avec la structure complète mais dialogue/vocabulary/grammar/examples vides (arrays vides). Exercises aussi vide.
```

---

### PROMPT 3.2 — conv-home.js (accueil conversations)

```
Implémente js/pages/conv-home.js — la page d'accueil des conversations.

Route : #/conversations
Charge data/lessons/index.json si pas déjà en store.

Affiche :
1. Header "💬 Conversations" avec retour vers #/home
2. Section "Populaire" : la leçon avec le plus haut playCount, affichée en carte large (image, titre, description, compteur plays)
3. Section "Par niveau" : grille 2 colonnes avec les 5 niveaux CECRL (A1→C1), chacun avec sa couleur pastel et le nombre de leçons
   Au clic sur un niveau → filtre la liste en-dessous
4. Section "Par thème" : grille 2 colonnes avec les séries (traditions-1, traditions-2, etc.), chacune avec image placeholder et nombre de leçons
   Au clic → filtre

5. Liste des leçons (filtrée par niveau ou thème si sélectionné) :
   Chaque leçon = carte avec : image, titre de la série | numéro : titre, description, badge niveau, durée
   Au clic → navigate #/conversations/lecon/{lessonId}

Les couleurs des niveaux sont :
A1: { bg: '#e8f5e9', text: '#2e7d32' }
A2: { bg: '#e3f2fd', text: '#1565c0' }
B1: { bg: '#f3e5f5', text: '#6a1b9a' }
B2: { bg: '#fff3e0', text: '#e65100' }
C1: { bg: '#fce4ec', text: '#c2185b' }

Ajoute les styles dans css/pages/conversations.css.
```

---

### PROMPT 3.3 — conv-lesson.js (vue leçon — dialogue)

```
Implémente js/pages/conv-lesson.js — la page de leçon complète.

Route : #/conversations/lecon/:lessonId
Enregistre dans app.js.

Au chargement : fetch data/lessons/{lessonId}.json, store.set('currentLesson', data)

Affiche :
1. Header avec titre de la leçon + retour vers #/conversations
2. Contrôles toggle :
   - Afficher/masquer traduction (par phrase)
   - Afficher/masquer translitération
   - Afficher/masquer harakats (remplace ar par arPlain quand masqué)
3. Onglets (composant tab-bar) : Dialogue | Vocabulaire | Grammaire | Exemples
4. Contenu de l'onglet actif

Onglet Dialogue :
- Pour chaque ligne du dialogue :
  * Label du speaker (nom + couleur depuis lesson.speakers)
  * Texte arabe (avec ou sans harakats selon toggle)
  * Translitération (si toggle activé)
  * Traduction française (si toggle activé, sinon masquée — clic pour révéler individuellement)
  * Bouton audio : au clic, joue cette phrase via audio.playWord(line.ar, 'ar-SA')
  * Clic sur un mot individuel dans la phrase arabe : affiche sa traduction en popup et joue l'audio du mot seul

Onglet Vocabulaire :
- Liste des mots de la leçon : arabe, translitération, français, bouton audio, bouton favori

Onglet Grammaire :
- Pour chaque point de grammaire : titre, explication, exemples (arabe + traduction + audio)

Onglet Exemples :
- Phrases d'exemple : arabe, translitération, traduction, bouton audio

Styles dans css/pages/conversations.css.
```

---

### PROMPT 3.4 — Composant player audio

```
Implémente js/components/player.js — le lecteur audio pour les leçons.

Exporte renderPlayer(lesson) qui retourne le HTML d'un player fixé en bas de page :
- Barre de progression cliquable/draggable (slider)
- Temps courant / durée totale
- Boutons : menu, reculer 15s, play/pause, avancer 15s, vitesse (cycle 0.75 → 1.0 → 1.25 → 1.5)
- Le bouton play alterne entre play et pause (icônes Feather)

Exporte aussi bindPlayerEvents(lesson) qui :
- Connecte le player à audio.js (playAudioFile, seekTo, setSpeed, etc.)
- Met à jour la barre de progression en temps réel via onTimeUpdate
- Synchronise le highlighting des lignes de dialogue (effet karaoké) :
  * Compare le currentTime avec les audioStart/audioEnd de chaque ligne
  * Ajoute la classe .dialogue-line--active sur la ligne en cours
  * Scroll automatique vers la ligne active

Style : le player est position sticky en bas, background var(--bg-secondary), border-top, z-index var(--z-dropdown), height var(--player-height).

Note : si la leçon n'a pas d'audioUrl (hasAudio=false), ne pas afficher le player.
Pour l'instant en dev, le player sera visible mais ne jouera rien (pas encore de fichiers MP3). L'interface doit quand même être fonctionnelle.
```

---

### PROMPT 3.5 — conv-exercise.js (exercices)

```
Implémente js/pages/conv-exercise.js — les exercices d'une leçon.

Route : #/conversations/lecon/:lessonId/exercice
Enregistre dans app.js.

Charge la leçon depuis le store (ou fetch si pas chargée).

Deux types d'exercices :

1. Phrases à trou (fillBlanks) :
   - Affiche la phrase arabe avec un trou (_____)
   - Mode QCM : 4 choix en arabe
   - Mode écrit : champ texte avec clavier arabe (ou normal)
   - Feedback : vert si correct, rouge si incorrect avec la bonne réponse
   - Hint optionnel affiché sous la question

2. Dialogues à trou (dialogueBlanks) :
   - Affiche le contexte (une phrase d'un speaker)
   - L'utilisateur doit choisir ou écrire la réponse de l'autre speaker
   - Mode QCM : 3 choix
   - Feedback idem

Interface :
- Barre de progression (nombre d'exercices fait / total)
- Bouton "Suivant" après chaque réponse
- Écran de résultats à la fin (score, option de recommencer)
- Mise à jour lessonProgress dans IndexedDB
- Mise à jour SRS pour les mots concernés

Styles dans css/pages/conversations.css.
```

---

### PROMPT 3.6 — Tab-bar composant + lien exercices dans la leçon

```
Implémente js/components/tab-bar.js.

Exporte renderTabBar(tabs, activeId) où tabs = [{ id, label }].
Retourne du HTML : une barre horizontale scrollable avec des boutons, l'actif ayant la classe .tab-bar__tab--active.

Puis modifie conv-lesson.js pour :
1. Utiliser renderTabBar pour les onglets (au lieu de HTML en dur)
2. Ajouter un 5ème onglet "Exercices" qui affiche un résumé (nombre d'exercices, meilleur score) et un bouton "Commencer" qui navigate vers #/conversations/lecon/{lessonId}/exercice
3. En bas de l'onglet Vocabulaire, ajouter un lien "Réviser ces mots en flashcards →" qui crée un deck temporaire dans le store avec les mots de la leçon et navigate vers le mode flashcard
```

---

### 🔵 CHECKPOINT 3 — Mode Conversations

**Vérifie :**

1. ✅ `#/conversations` affiche la section populaire, les niveaux, les thèmes, la liste des leçons
2. ✅ Filtrer par niveau fonctionne
3. ✅ Ouvrir une leçon charge le JSON et affiche le dialogue
4. ✅ Les toggles traduction/translitération/harakats fonctionnent
5. ✅ Les 4 onglets (Dialogue, Vocabulaire, Grammaire, Exemples) affichent le bon contenu
6. ✅ L'audio TTS joue quand on clique sur une phrase ou un mot
7. ✅ Le player est affiché en bas (même si pas de fichier audio réel)
8. ✅ Les exercices fonctionnent (QCM, validation, score)
9. ✅ La progression de la leçon est sauvée dans IndexedDB
10. ✅ Aucune erreur console

---

## PHASE 4 — Pont Mots ↔ Conversations + Révision SRS

---

### PROMPT 4.1 — Dashboard de révision SRS

```
Implémente js/pages/review-dashboard.js.

Route : #/revision

Affiche :
1. Header "📝 Révision" avec retour vers #/home
2. Encart principal : "X mots à réviser aujourd'hui" (gros chiffre, couleur accent)
   Si X > 0 : bouton "Commencer la révision"
   Si X = 0 : message "Tout est à jour ! 🎉"
3. Distribution des boîtes : 5 barres horizontales colorées montrant combien de mots sont dans chaque boîte (utiliser getBoxDistribution de srs.js)
4. Statistiques : mots acquis / total, streak actuel, meilleur streak
5. Graphique simple : barres de l'activité de la semaine (si stats.weeklyActivity existe)

Le bouton "Commencer la révision" :
- Charge les mots dus (db.getDueWords)
- Crée un deck temporaire dans le store avec ces mots (mélangés, tous decks confondus)
- Navigate vers un mode apprendre spécial : #/revision/session
- Ce mode utilise la même logique que words-learn.js mais avec les mots SRS dus

Implémente aussi la route #/revision/session dans app.js.

Styles dans css/pages/review.css.
```

---

### PROMPT 4.2 — Mise à jour de la page d'accueil

```
Modifie js/pages/home.js pour enrichir le dashboard :

1. Charge les données SRS au montage : const dueCount = await db.getDueWords(courseId) → store.set('dueCount', count)
2. La bannière "📝 X mots à réviser" affiche le vrai count et est cliquable vers #/revision
3. Ajoute une section "Continuer" : affiche la dernière leçon vue (depuis lessonProgress) avec un bouton "Reprendre"
4. Ajoute une section "Suggestion" : si beaucoup de mots en boîte 1, suggère une révision. Si tous les mots d'un deck sont en boîte 4+, suggère un examen.
5. Statistiques rapides : mots acquis, leçons complétées, streak
```

---

### PROMPT 4.3 — Pont vocabulaire leçon → mode mots

```
Modifie conv-lesson.js et words-deck.js pour créer le pont entre mots et conversations.

Dans conv-lesson.js, onglet Vocabulaire :
- Chaque mot affiche un badge si ce mot existe aussi dans un deck thématique (utilise le champ linkedCards)
- Bouton "Réviser les mots de cette leçon" → crée un deck temporaire et lance les flashcards
- Quand la leçon est complétée (tous les exercices faits), marquer vocabUnlocked = true dans lessonProgress

Dans words-deck.js :
- Si un deck a des mots qui apparaissent dans des leçons (vérifier via tags), afficher un lien "💬 Voir les leçons avec ces mots" → navigate vers #/conversations filtré

Dans words-home.js :
- Ajouter une section en haut : "Mots des leçons" qui liste les decks débloqués via les leçons (vocabUnlocked = true)
- Ces decks "de leçon" sont différenciés visuellement (badge "Leçon" + icône 💬)
```

---

### PROMPT 4.4 — Script Python generate-lesson-vocab.py

```
Crée scripts/generate-lesson-vocab.py.

Ce script :
1. Lit tous les fichiers data/lessons/*.json (sauf index.json)
2. Pour chaque leçon, extrait le vocabulary[]
3. Pour chaque mot du vocabulary, cherche dans data/decks/arabic.json si un mot similaire existe (comparaison sur arPlain ou frontPlain)
4. Si trouvé, ajoute le cardId dans le champ linkedCards du mot de la leçon
5. Réécrit le fichier leçon avec les linkedCards mis à jour
6. Affiche un résumé : X mots liés sur Y total

Le matching est fait sur le texte arabe sans harakats (frontPlain côté deck, arPlain côté leçon).
Si un match exact n'est pas trouvé, essayer une correspondance partielle (le mot de la leçon contient le front du deck ou vice versa).
```

---

### 🔵 CHECKPOINT 4 — SRS + Pont

**Vérifie :**

1. ✅ `#/revision` affiche le nombre de mots à réviser et la distribution des boîtes
2. ✅ Une session de révision fonctionne (pioche les mots dus, QCM, mise à jour SRS)
3. ✅ La page d'accueil affiche le vrai nombre de mots à réviser
4. ✅ La suggestion "Continuer" montre la dernière leçon vue
5. ✅ Dans une leçon, le bouton "Réviser ces mots" crée un deck temporaire et lance les flashcards
6. ✅ Dans la vue deck thématique, le lien vers les leçons apparaît si pertinent
7. ✅ Le script Python generate-lesson-vocab.py fonctionne et lie les mots
8. ✅ Aucune erreur console

---

## PHASE 5 — Sections supplémentaires

---

### PROMPT 5.1 — Section Alphabet

```
Crée data/alphabet/letters.json selon le schéma DATA-SCHEMA.md section 8.
Inclus les 28 lettres arabes avec : nom, unicode, 4 formes (isolated, initial, medial, final), translitération, prononciation, type (sun/moon/vowel), au moins 1 exemple par lettre.
Inclus les 7 diacritiques principaux : fatha, damma, kasra, sukun, shadda, fathatan, dammatan, kasratan.
Inclus la règle des lettres solaires/lunaires avec des exemples.

Puis implémente js/pages/alphabet.js.
Route : #/alphabet (ajouter dans app.js et dans la page d'accueil comme 3ème mode)

Affiche :
1. Grille des 28 lettres : chaque lettre = carte avec la forme isolée en grand, le nom en dessous
2. Au clic sur une lettre, affiche un détail : les 4 formes, la prononciation, le type, les exemples, bouton audio
3. Section diacritiques en dessous de la grille
4. Section règles (solaires/lunaires)
```

---

### PROMPT 5.2 — Section Racines trilittères

```
Crée data/roots/roots.json selon le schéma DATA-SCHEMA.md section 9.
Inclus au moins 15 racines courantes : k-t-b, d-r-s, '-l-m, q-r-', s-l-m, f-'-l, h-m-d, j-l-s, sh-r-b, '-k-l, dh-h-b, kh-r-j, d-kh-l, n-z-l, r-j-'
Pour chaque racine : la famille de mots (3-6 dérivés) avec forme, schème, traduction.

Puis implémente js/pages/roots.js.
Route : #/racines (ajouter dans app.js et dans la page d'accueil)

Affiche :
1. Liste des racines avec : les 3 lettres en arabe, le sens de base, le nombre de mots dérivés
2. Au clic sur une racine, affiche la famille : chaque mot avec son schème (pattern), sa traduction, son type (nom/verbe/adjectif/participe)
3. Bouton audio pour chaque mot
4. Lien vers les cartes de vocabulaire qui contiennent ces mots (linkedCards)
```

---

### PROMPT 5.3 — Page profil et stats

```
Implémente une page profil.
Route : #/profil (ajouter dans app.js et un bouton dans le header de #/home)

Affiche :
1. Section "Progression" : mots rencontrés, mots acquis (boîte 4+), leçons complétées
2. Section "Streak" : streak actuel (gros chiffre + emoji feu), meilleur streak
3. Section "Activité de la semaine" : 7 barres (lun→dim) avec les minutes d'activité
4. Section "Préférences" :
   - Toggle thème dark/light
   - Toggle afficher translitération par défaut
   - Toggle afficher harakats par défaut
   - Sélecteur vitesse audio par défaut
   - Sélecteur niveau de correction par défaut
   Chaque changement → db.savePreferences() et store.set('preferences')
5. Bouton "Exporter mes données" → télécharge un JSON avec toute la progression
6. Bouton "Importer des données" → charge un JSON et restaure la progression
```

---

### 🔵 CHECKPOINT 5 — Sections supplémentaires

**Vérifie :**

1. ✅ `#/alphabet` affiche les 28 lettres en grille, le détail au clic, les diacritiques, les règles
2. ✅ `#/racines` affiche les racines, la famille de mots au clic
3. ✅ `#/profil` affiche les stats, les préférences fonctionnent (changer thème = immédiat)
4. ✅ Export/import de données fonctionne
5. ✅ La page d'accueil propose les 5 modes (Mots, Conversations, Révision, Alphabet, Racines)
6. ✅ Aucune erreur console

---

## PHASE 6 — PWA + Polish

---

### PROMPT 6.1 — Service Worker

```
Implémente sw.js selon STACK.md section 6.

Stratégie :
- CACHE_VERSION = 'v1.0.0'
- Cache-first pour : css/*, js/*, images/*, fonts Google, feather-icons CDN
- Network-first pour : data/*.json
- Stale-while-revalidate pour : audio/*

Événements :
- install : pré-cache les assets essentiels (index.html, tous les CSS, tous les JS principaux, les fonts)
- activate : supprime les anciens caches dont le nom ne correspond pas à CACHE_VERSION
- fetch : applique la stratégie selon l'URL

Enregistre le SW dans app.js :
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

---

### PROMPT 6.2 — Animations et transitions

```
Ajoute des animations et transitions à l'application :

1. Transition de page : quand on navigate, la nouvelle page fait un léger fade-in (opacity 0→1, 200ms)
   Implémente ça dans le router : avant d'appeler le handler, ajoute une classe .page-entering sur #app, retire-la après 200ms

2. Cartes : les theme-card et deck-card ont un hover lift (translateY -2px + shadow-md) et un active scale(0.98)

3. Modales : apparition avec un fade + scale (0.95→1)

4. Flashcard flip : transition transform 0.5s sur .card-inner

5. Barres de progression : transition width 0.3s ease

6. Boutons : transition background 0.15s, transform 0.15s

7. Ajoute @keyframes slideUp pour les éléments qui apparaissent de bas en haut (dialogue-line, vocab-item)
   Chaque élément dans une liste a un animation-delay incrémental (index * 50ms) pour un effet stagger

Tout ça dans les fichiers CSS appropriés.
```

---

### PROMPT 6.3 — Responsive + accessibilité

```
Passe en revue toute l'application pour le responsive et l'accessibilité :

1. Responsive :
   - Tout doit fonctionner de 320px à 1200px de large
   - Sur desktop (>768px) : la page d'accueil peut afficher les modes en grille 2x2 au lieu de colonne
   - Les grilles de thèmes passent de 2 colonnes (mobile) à 3 (desktop)
   - Le player audio reste fixé en bas quel que soit le device
   - Max-width 500px pour le contenu principal (déjà dans les variables)

2. Accessibilité :
   - Ajoute aria-label sur tous les boutons qui n'ont que des icônes
   - Ajoute role="button" sur les éléments cliquables qui ne sont pas des <button>
   - Assure un contraste suffisant (déjà OK avec le palette dark)
   - Focus visible (outline) sur les éléments interactifs
   - Les flashcards sont navigables au clavier : Espace = flip, Flèche droite = connu, Flèche gauche = à revoir
```

---

### 🔵 CHECKPOINT 6 — Final

**Vérifie :**

1. ✅ L'app fonctionne en offline (couper le réseau, recharger → l'app charge)
2. ✅ Le prompt "Installer l'application" apparaît sur mobile (ou test via DevTools)
3. ✅ Les transitions sont fluides, pas de flash de contenu
4. ✅ L'app est utilisable sur un écran de 320px (iPhone SE)
5. ✅ Navigation au clavier possible (Tab, Entrée, Espace)
6. ✅ Lighthouse PWA score > 90
7. ✅ Aucune erreur console
8. ✅ Toutes les fonctionnalités des checkpoints précédents fonctionnent toujours

---

## Résumé des prompts

| Phase | Prompts | Description |
|-------|---------|-------------|
| 1 | 1.1 → 1.16 | Fondations : arborescence, shell, router, store, DB, CSS, page d'accueil |
| 2 | 2.1 → 2.9 | Mode Mots : decks, thèmes, flashcards, learn, test, match, listen, image |
| 3 | 3.1 → 3.6 | Mode Conversations : données leçons, accueil, dialogue, player, exercices |
| 4 | 4.1 → 4.4 | SRS dashboard, pont mots↔conversations, script Python |
| 5 | 5.1 → 5.3 | Alphabet, racines, profil/stats |
| 6 | 6.1 → 6.3 | Service Worker, animations, responsive |

**Total : 34 prompts + 6 checkpoints**

---

## Notes importantes

- **Un prompt = une action.** Ne combine jamais deux prompts.
- **Après chaque checkpoint**, teste tout avant de continuer. Les erreurs s'accumulent sinon.
- **Si Claude Code fait une erreur**, corrige-la avant de passer au prompt suivant.
- **Rappelle le contexte** en début de session : "Lis /docs/STACK.md et DATA-SCHEMA.md".
- **Les phases sont séquentielles** : ne commence pas la phase 3 sans avoir validé le checkpoint 2.
- **Commit sur Git après chaque checkpoint validé** pour pouvoir revenir en arrière.
