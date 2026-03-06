# Architecture PWA — HelloArabic
## Document de restructuration complète

---

## 1. Diagnostic de l'existant

### Ce qui existe et fonctionne
- **Mode Mots** : flashcards avec swipe, mode apprendre (QCM/écrit), test/examen, jeu d'association (match), mode écoute, mode image
- **Options riches** : mélange, favoris, choix du recto (arabe/français), correction flexible/modérée/stricte
- **Données vocabulaire** : ~50 decks JSON bien structurés, organisés par thèmes (16 thèmes), avec arabe + translitération + français + emoji + images
- **Mode Conversations** : ébauche avec structure leçon (dialogue, vocabulaire, exemples, grammaire), player audio (stub), onglets
- **Multi-cours** : arabe et français déjà configurés
- **Persistance** : localStorage pour progression, favoris, préférences

### Problèmes structurels identifiés
- **index.html = 1878 lignes** : HTML + CSS + JS monolithique, tout dans un fichier
- **Duplication massive** : `conversations.html` redéfinit les mêmes fonctions (`countLessonsByLevel`, `initFirstHome`, etc.)
- **`lessons.js` et `conversations.js` dupliquent les données** : les leçons sont définies deux fois avec des structures différentes
- **Pas de vrai routing** : navigation par `display: none/flex` sur des divs, pas d'URL
- **Styles inline partout** dans conversations.html (HTML illisible)
- **Aucune séparation des responsabilités** : données, logique, UI, état — tout mélangé
- **Pas de service worker** malgré l'objectif PWA
- **Audio = stubs** : `console.log('Play:', text)` partout
- **Aucun système de révision espacée** (type SRS/Leitner)
- **Pas de lien entre Mots et Conversations**

---

## 2. Décisions architecturales clés

### 2.1 — Relier Mots et Conversations (ta question principale)

**Réponse : les deux sont liés mais restent des modes indépendants.**

Le modèle recommandé est un **système à double entrée avec pont** :

```
┌─────────────────────────────────────────────┐
│                 ACCUEIL                      │
│  ┌──────────────┐    ┌───────────────────┐  │
│  │  📚 Mots     │    │  💬 Conversations │  │
│  │  (vocab)     │    │  (dialogues)      │  │
│  └──────┬───────┘    └────────┬──────────┘  │
│         │                     │              │
│         │    ┌────────────┐   │              │
│         └────┤  PONT      ├───┘              │
│              │  COMMUN    │                  │
│              └────────────┘                  │
│  - Chaque leçon de conversation débloque    │
│    un mini-deck de vocabulaire               │
│  - Chaque deck de mots peut renvoyer vers   │
│    les leçons qui utilisent ces mots         │
│  - Système de tags partagé                   │
└─────────────────────────────────────────────┘
```

Concrètement :
- **L'utilisateur choisit librement** son mode d'entrée (mots ou conversations)
- Quand il termine une leçon de conversation, les **mots-clés de cette leçon apparaissent** automatiquement dans un deck dédié côté Mots (ex: "Vocab — Traditions 1, Leçon 1")
- Quand il révise un deck thématique de mots, un lien "Voir les leçons avec ces mots" est proposé
- Un **système de tags** (`tags: ['salutations', 'nationalité', 'aéroport']`) permet le croisement

### 2.2 — Système de révision espacée (SRS)

Implémentation d'un **algorithme Leitner simplifié** côté client :

```
Boîte 1 → révision tous les jours
Boîte 2 → révision tous les 3 jours
Boîte 3 → révision toute la semaine
Boîte 4 → révision toutes les 2 semaines
Boîte 5 → acquis (révision mensuelle)
```

- Bonne réponse → le mot monte d'une boîte
- Mauvaise réponse → retour en boîte 1
- L'accueil affiche : "X mots à réviser aujourd'hui"
- Stocké dans IndexedDB (pas localStorage — plus robuste pour des volumes de données)

### 2.3 — Stack technique

**Pas de framework lourd.** Tu es seul sur ce projet, il tourne sur GitHub Pages, et c'est du contenu statique. La stack recommandée :

| Couche | Choix | Pourquoi |
|--------|-------|----------|
| Structure | Vanilla JS + ES Modules | Simple, rapide, pas de build step |
| Routing | Hash router custom (`#/mots`, `#/conversations/lecon/1`) | Compatible GitHub Pages, pas de 404 |
| État | Store centralisé (pattern simple) | Un objet global réactif |
| Persistance | IndexedDB via `idb` (tiny wrapper) | Plus robuste que localStorage pour SRS |
| CSS | Un fichier CSS avec variables + utility classes | Exit les styles inline |
| Audio | Web Speech API + fichiers audio pré-générés | TTS pour le dev, vrais fichiers pour la prod |
| PWA | Service Worker + manifest.json | Offline, installable |
| Build | Aucun (ou juste un script Python pour générer les decks) | Tu as déjà `generate-decks.py` |

---

## 3. Arborescence cible

```
helloarabic/
│
├── index.html                    ← Point d'entrée unique (shell minimal)
├── manifest.json                 ← PWA manifest
├── sw.js                         ← Service Worker
│
├── css/
│   ├── variables.css             ← Couleurs, fonts, spacing (thèmes dark/light)
│   ├── base.css                  ← Reset, body, typographie
│   ├── components.css            ← Boutons, cards, modals, toggles, progress bars
│   ├── layout.css                ← Header, navigation, pages, grilles
│   └── pages/
│       ├── home.css
│       ├── words.css             ← Flashcards, swipe, learn, test, match
│       ├── conversations.css     ← Leçons, player, dialogue
│       └── review.css            ← Dashboard de révision SRS
│
├── js/
│   ├── app.js                    ← Initialisation, routing, montage
│   ├── router.js                 ← Hash router
│   ├── store.js                  ← État global (cours, progression, préférences)
│   ├── db.js                     ← Couche IndexedDB (progression SRS, favoris)
│   ├── audio.js                  ← Gestion audio (TTS + fichiers)
│   ├── utils.js                  ← Helpers (shuffle, normalize, levenshtein, etc.)
│   │
│   ├── pages/
│   │   ├── home.js               ← Page d'accueil (choix cours + dashboard)
│   │   ├── words-home.js         ← Thèmes → decks
│   │   ├── words-deck.js         ← Vue d'un deck (stats, choix du mode)
│   │   ├── words-flashcards.js   ← Mode flashcard (swipe)
│   │   ├── words-learn.js        ← Mode apprendre (QCM/écrit)
│   │   ├── words-test.js         ← Mode examen
│   │   ├── words-match.js        ← Mode association
│   │   ├── words-listen.js       ← Mode écoute
│   │   ├── words-image.js        ← Mode image
│   │   ├── conv-home.js          ← Accueil conversations (niveaux, thèmes)
│   │   ├── conv-lesson.js        ← Vue leçon (dialogue, vocab, grammaire, player)
│   │   ├── conv-exercise.js      ← Phrases à trou, dialogues à trou
│   │   ├── review-dashboard.js   ← Dashboard SRS ("X mots à réviser")
│   │   ├── alphabet.js           ← Section alphabet arabe
│   │   └── roots.js              ← Section racines trilittères
│   │
│   └── components/
│       ├── header.js             ← En-tête réutilisable (back, titre, actions)
│       ├── card.js               ← Composant carte (front/back, swipe)
│       ├── progress-bar.js       ← Barre de progression
│       ├── modal.js              ← Modal options/settings
│       ├── player.js             ← Lecteur audio (pour conversations)
│       ├── dialogue-line.js      ← Ligne de dialogue (arabe, trad, audio)
│       └── tab-bar.js            ← Navigation par onglets
│
├── data/
│   ├── courses.json              ← Configuration des cours (→ remplace courses.js)
│   ├── themes.json               ← Thèmes vocabulaire (→ remplace themes.js)
│   │
│   ├── vocabulary/               ← Garde ta structure actuelle — elle est bonne
│   │   ├── premiers-mots/
│   │   │   ├── couleurs.json
│   │   │   ├── nombres.json
│   │   │   └── ...
│   │   ├── corps-humain/
│   │   └── ...
│   │
│   ├── decks/                    ← Decks générés (par langue)
│   │   ├── arabic.json           ← Tous les decks arabe (généré par Python)
│   │   └── french.json
│   │
│   ├── lessons/                  ← UNE source de vérité pour les leçons
│   │   ├── index.json            ← Métadonnées de toutes les leçons
│   │   ├── traditions-1-1.json   ← Contenu complet d'une leçon
│   │   ├── traditions-1-2.json
│   │   └── ...
│   │
│   ├── alphabet/
│   │   └── letters.json          ← Données alphabet (formes, sons, exemples)
│   │
│   └── roots/
│       └── roots.json            ← Racines trilittères + familles de mots
│
├── images/                       ← Garde ta structure actuelle
│   ├── couleurs/
│   ├── formes/
│   └── nombres/
│
├── audio/                        ← Fichiers audio (quand tu en auras)
│   ├── words/
│   └── lessons/
│
└── scripts/
    ├── generate-decks.py         ← Ton script existant (à adapter)
    └── generate-lesson-vocab.py  ← Nouveau : extrait le vocab d'une leçon → deck
```

---

## 4. Modèle de données unifié

### 4.1 — Carte de vocabulaire (format canonique)

```json
{
  "id": "couleur-rouge",
  "ar": "أَحْمَر",
  "ar_plain": "احمر",
  "translit": "ahmar",
  "fr": "rouge",
  "en": "red",
  "emoji": "🔴",
  "image": "images/couleurs/rouge.png",
  "audio": "audio/words/ahmar.mp3",
  "tags": ["couleur", "adjectif", "A1"],
  "root": "ح-م-ر",
  "srs": {
    "box": 1,
    "nextReview": "2026-03-10",
    "reviewCount": 0,
    "lastResult": null
  }
}
```

Note : `ar` contient les harakats, `ar_plain` est la version sans (pour la recherche et la comparaison).

### 4.2 — Leçon de conversation

```json
{
  "id": "traditions-1-1",
  "series": "traditions-1",
  "seriesName": "Traditions 1",
  "number": 1,
  "title": "Are you American?",
  "description": "Sam meets a border agent at the airport.",
  "level": "A1",
  "tags": ["salutations", "nationalité", "aéroport"],
  "duration": "7:59",
  "audioUrl": "audio/lessons/traditions-1-1.mp3",
  "coverUrl": "images/lessons/traditions-1-1.jpg",

  "dialogue": [
    {
      "id": "d1",
      "speaker": "sam",
      "speakerName": "Sam",
      "ar": "مَرْحَبًا!",
      "ar_plain": "مرحبا!",
      "translit": "marhaban!",
      "fr": "Salut !",
      "en": "Hi!",
      "audioStart": 0.0,
      "audioEnd": 1.2
    },
    {
      "id": "d2",
      "speaker": "agent",
      "speakerName": "L'agent",
      "ar": "مَرْحَبَتَيْن! أَنْتَ أَمِيرِكِيّ؟",
      "ar_plain": "مرحبتين! أنت أميركي؟",
      "translit": "marhabatayn! anta amiriki?",
      "fr": "Salut ! Tu es Américain ?",
      "en": "Hi! Are you American?",
      "audioStart": 1.5,
      "audioEnd": 4.0
    }
  ],

  "vocabulary": [
    {
      "ar": "مَرْحَبًا",
      "translit": "marhaban",
      "fr": "bienvenue / salut",
      "root": "ر-ح-ب",
      "tags": ["salutation"]
    }
  ],

  "grammar": [
    {
      "title": "Pronom personnel 2ème pers. masc. sing. : أَنْتَ",
      "explanation": "Utilisé pour s'adresser à un homme. Équivalent de 'tu' au masculin.",
      "examples": [
        { "ar": "أَنْتَ بريطاني", "fr": "Tu es Britannique" },
        { "ar": "أَنْتَ تَعْبَان", "fr": "Tu es fatigué" }
      ]
    }
  ],

  "examples": [
    { "ar": "أَنْتَ فِي الْبَيْت؟", "fr": "Tu es à la maison ?" }
  ],

  "exercises": {
    "fillBlanks": [
      {
        "type": "word",
        "sentence_ar": "_____ أَمِيرِكِيّ؟",
        "answer": "أَنْتَ",
        "choices": ["أَنَا", "أَنْتَ", "هُوَ", "هِيَ"]
      }
    ],
    "dialogueBlanks": [
      {
        "context_ar": "مَرْحَبًا!",
        "answer_ar": "مَرْحَبَتَيْن! أَنْتَ أَمِيرِكِيّ؟",
        "choices": [
          "مَرْحَبَتَيْن! أَنْتَ أَمِيرِكِيّ؟",
          "نَعَمْ، أَنَا أَمِيرِكِيّ",
          "مَعَ السَّلَامَة"
        ]
      }
    ]
  }
}
```

### 4.3 — Progression utilisateur (IndexedDB)

```json
{
  "userId": "local",
  "course": "arabic",
  "preferences": {
    "theme": "dark",
    "defaultFrontSide": "front",
    "showTranslit": true,
    "showHarakats": true,
    "correctionLevel": "flexible",
    "autoPlay": false
  },
  "srs": {
    "couleur-rouge": { "box": 3, "nextReview": "2026-03-15", "reviewCount": 7 },
    "couleur-bleu": { "box": 1, "nextReview": "2026-03-07", "reviewCount": 2 }
  },
  "favorites": {
    "words": ["couleur-rouge", "animal-chat"],
    "lessons": ["traditions-1-1"],
    "phrases": ["traditions-1-1:d2"]
  },
  "lessonProgress": {
    "traditions-1-1": {
      "completed": true,
      "lastViewed": "2026-03-05",
      "exerciseScore": 85,
      "vocabUnlocked": true
    }
  },
  "stats": {
    "totalWordsLearned": 142,
    "totalLessonsCompleted": 3,
    "currentStreak": 5,
    "longestStreak": 12,
    "weeklyMinutes": [15, 22, 0, 30, 10, 0, 0]
  }
}
```

---

## 5. Routing

Hash-based routing (compatible GitHub Pages) :

```
#/                              → Choix du cours
#/home                          → Dashboard principal
#/mots                          → Thèmes vocabulaire
#/mots/:themeId                 → Decks d'un thème
#/mots/:themeId/:deckId         → Vue deck (stats + choix mode)
#/mots/:themeId/:deckId/flash   → Mode flashcard
#/mots/:themeId/:deckId/learn   → Mode apprendre
#/mots/:themeId/:deckId/test    → Mode examen
#/mots/:themeId/:deckId/match   → Mode association
#/mots/:themeId/:deckId/listen  → Mode écoute
#/mots/:themeId/:deckId/image   → Mode image
#/conversations                 → Accueil conversations (niveaux + thèmes)
#/conversations/:level          → Leçons d'un niveau
#/conversations/lecon/:id       → Vue leçon complète
#/conversations/lecon/:id/exercice → Exercices de la leçon
#/revision                      → Dashboard révision SRS
#/alphabet                      → Section alphabet
#/racines                       → Section racines trilittères
#/profil                        → Stats et préférences
```

Le router est un simple listener sur `hashchange` :

```javascript
// js/router.js
const routes = {};

export function route(path, handler) {
  routes[path] = handler;
}

export function navigate(path) {
  window.location.hash = path;
}

function matchRoute(hash) {
  const path = hash.replace('#', '') || '/';
  // Essai match exact
  if (routes[path]) return { handler: routes[path], params: {} };
  // Essai match avec paramètres
  for (const pattern in routes) {
    const regex = new RegExp('^' + pattern.replace(/:\w+/g, '([^/]+)') + '$');
    const match = path.match(regex);
    if (match) {
      const paramNames = (pattern.match(/:\w+/g) || []).map(p => p.slice(1));
      const params = {};
      paramNames.forEach((name, i) => params[name] = match[i + 1]);
      return { handler: routes[pattern], params };
    }
  }
  return null;
}

window.addEventListener('hashchange', () => {
  const result = matchRoute(window.location.hash);
  if (result) result.handler(result.params);
});
```

---

## 6. Réponses à tes zones de flou

### « Faut-il relier mots et conversations ? »
**Oui, mais sans forcer un ordre.** Le lien se fait par les tags et par le vocabulaire de chaque leçon. L'utilisateur reste libre de naviguer comme il veut. Le système propose des connexions ("Tu as appris ces mots → voici une leçon qui les utilise") sans imposer.

### « D'abord les mots puis les leçons, ou l'inverse ? »
**Pas de séquence imposée.** Certains apprenants préfèrent découvrir les mots en contexte (conversation d'abord), d'autres préfèrent mémoriser le vocabulaire avant d'écouter. Ton app doit supporter les deux parcours. Le dashboard d'accueil propose des suggestions adaptées (mots à réviser, leçon suivante, etc.).

### « Comment gérer la révision ? »
Le **système SRS (Leitner)** décrit en section 2.2. Chaque mot a un "box" et une date de prochaine révision. Le dashboard affiche "12 mots à réviser aujourd'hui" avec un bouton direct. La révision SRS est un mode à part — elle pioche les mots tous decks confondus selon leur date.

### « À quelle fréquence les examens ? »
L'examen reste à la demande de l'utilisateur (bouton dans la vue deck). Mais le système peut **suggérer** un examen quand un deck passe un seuil (ex: 80% des mots en boîte 3+). Pour les conversations, les exercices (phrases à trou) font office d'évaluation.

### « Système de compte avec base de données ? »
**Phase 1 : tout en local (IndexedDB).** C'est gratuit et suffisant pour un usage perso + quelques personnes. Les données restent sur l'appareil.

**Phase 2 (optionnel, plus tard) :** si tu veux la synchro multi-appareils, un backend minimal suffit :
- Supabase (gratuit jusqu'à 500 MB, auth inclus) ou Firebase
- L'app exporte/importe la progression en JSON
- Coût : 0€ pour < 50 utilisateurs

### « Comment automatiser le lien mots ↔ leçons ? »
Un script Python `generate-lesson-vocab.py` qui :
1. Lit chaque fichier leçon JSON
2. Extrait les mots du champ `vocabulary`
3. Cherche les correspondances dans les decks thématiques existants
4. Génère un fichier `lesson-vocab-{lessonId}.json` avec les cartes complètes
5. Met à jour un index de tags croisés

---

## 7. Plan de migration par phases

### Phase 1 — Fondations (1-2 semaines)
- [ ] Créer `index.html` minimal (shell vide)
- [ ] Écrire `router.js`, `store.js`, `db.js`
- [ ] Migrer les CSS depuis index.html → fichiers séparés
- [ ] Convertir `courses.js`, `themes.js` en JSON pur
- [ ] Créer le service worker minimal
- [ ] Tester : la navigation fonctionne, les données chargent

### Phase 2 — Mode Mots (1-2 semaines)
- [ ] Migrer flashcards (le mode le plus abouti)
- [ ] Migrer learn, test, match, listen, image
- [ ] Ajouter le SRS (remplacer le stockage localStorage)
- [ ] Dashboard révision "X mots à réviser"
- [ ] Migrer les options/settings

### Phase 3 — Mode Conversations (2-3 semaines)
- [ ] Unifier `lessons.js` + `conversations.js` → fichiers JSON séparés par leçon
- [ ] Implémenter le vrai player audio (avec timestamps par phrase)
- [ ] Effet karaoké (highlight synchro avec l'audio)
- [ ] Contrôles audio (seek, vitesse, skip ±15s)
- [ ] Toggle traduction / translitération / harakats
- [ ] Onglets (dialogue, vocabulaire, grammaire, exemples)
- [ ] Exercices : phrases à trou, dialogues à trou

### Phase 4 — Pont Mots ↔ Conversations (1 semaine)
- [ ] Script Python pour extraire le vocabulaire des leçons
- [ ] Système de tags croisés
- [ ] "Mots de cette leçon" dans la vue conversation
- [ ] "Leçons avec ces mots" dans la vue deck

### Phase 5 — Sections supplémentaires (1-2 semaines)
- [ ] Section Alphabet (lettres, formes, sons, exemples)
- [ ] Section Racines trilittères (familles de mots)
- [ ] Page profil/stats

### Phase 6 — Polish (continu)
- [ ] Animations et transitions
- [ ] Design responsive
- [ ] PWA complète (offline, install prompt)
- [ ] Système de compte (optionnel, Supabase)

---

## 8. Récapitulatif des décisions

| Question | Décision |
|----------|----------|
| Framework | Vanilla JS + ES Modules, pas de React/Vue |
| Routing | Hash router (`#/mots/couleurs/flash`) |
| Persistance | IndexedDB via `idb` wrapper |
| Mots ↔ Conversations | Liés par tags, mais modes indépendants |
| Ordre d'apprentissage | Libre — pas de séquence imposée |
| Révision | SRS Leitner 5 boîtes côté client |
| Examen | À la demande + suggestion intelligente |
| Compte utilisateur | Phase 1 : local / Phase 2 : Supabase |
| Audio | Web Speech API (dev) + fichiers MP3 (prod) |
| Déploiement | GitHub Pages (statique) |
| Build | Aucun — scripts Python pour générer les données |
