# DATA-SCHEMA.md — Schémas de données
## HelloArabic PWA

> Ce document définit la structure exacte de chaque fichier JSON et de chaque objet en mémoire.
> Claude Code doit s'y conformer strictement lors de la création ou manipulation de données.

---

## 1. Vue d'ensemble

```
data/
├── courses.json              ← Configuration des cours disponibles
├── themes.json               ← Thèmes de vocabulaire (structure d'organisation)
├── vocabulary/               ← Fichiers sources bruts (94 fichiers, NE PAS MODIFIER)
│   └── {theme}/{deck}.json
├── decks/                    ← Decks générés par Python (prêts à l'emploi)
│   ├── arabic.json
│   └── french.json
├── lessons/
│   ├── index.json            ← Index de toutes les leçons (métadonnées légères)
│   └── {lessonId}.json       ← Contenu complet d'une leçon
├── alphabet/
│   └── letters.json          ← Lettres arabes avec formes et règles
└── roots/
    └── roots.json            ← Racines trilittères et familles de mots
```

---

## 2. `courses.json` — Configuration des cours

Ce fichier remplace l'ancien `data/courses.js` (plus de `window.COURSES_DATA`).

```jsonc
[
  {
    "id": "arabic",                          // string — identifiant unique du cours
    "name": "العربية",                        // string — nom dans la langue cible
    "nameLocal": "Arabe",                    // string — nom en français
    "flag": "🇸🇦",                            // string — emoji drapeau
    "description": "Apprends l'arabe coranique et classique",
    "color": "#3fb950",                      // string — couleur d'accent du cours
    "decksFile": "data/decks/arabic.json",   // string — chemin vers le fichier decks
    "config": {
      "frontLang": "ar-SA",                  // string — code BCP47 pour la synthèse vocale
      "backLang": "fr-FR",
      "frontLabel": "Arabe",                 // string — label affiché dans les options
      "backLabel": "Français",
      "frontFont": "'Amiri', serif",         // string — font-family CSS
      "backFont": "'Inter', sans-serif",
      "frontDir": "rtl",                     // "rtl" | "ltr"
      "backDir": "ltr",
      "hasTranslit": true,                   // boolean — afficher la translitération ?
      "hasDiacritics": true,                 // boolean — le front a des harakats ?
      "frontFontSize": "2.5rem",             // string — taille CSS du texte front
      "backFontSize": "1.3rem"
    }
  }
  // ... autres cours (french, etc.)
]
```

### Champs obligatoires
Tous les champs sont obligatoires. Pas de champ optionnel dans cette structure.

---

## 3. `themes.json` — Thèmes de vocabulaire

Remplace `data/themes.js`.

```jsonc
[
  {
    "id": "premiers-mots",                   // string — identifiant unique
    "name": "Premiers mots",                 // string — nom français
    "nameAr": "الكلمات الأولى",               // string — nom arabe
    "color": "#a8d5a2",                      // string — couleur thème (hex)
    "icon": "🔤",                             // string — emoji icône
    "decks": [                               // string[] — IDs des decks dans ce thème
      "nombres",
      "couleurs",
      "formes",
      "mouvements",
      "se-reperer",
      "jours-semaine",
      "mois-annee",
      "fetes",
      "saisons",
      "temps"
    ]
  }
  // ... 16 thèmes au total
]
```

### Champs obligatoires
Tous. `nameAr` peut être une string vide `""` si non traduit.

---

## 4. Fichiers `vocabulary/{theme}/{deck}.json` — Sources brutes

> **NE JAMAIS MODIFIER CES FICHIERS via Claude Code.**
> Ils sont la source de vérité éditée à la main ou via le script Python.

Structure actuelle (à préserver) :

```jsonc
{
  "id": "couleurs",                           // string — doit correspondre au nom du fichier
  "name": "Les couleurs",                     // string — nom français
  "nameAr": "الألوان",                         // string — nom arabe
  "category": "Premiers mots",               // string — nom du thème parent
  "cards": [
    {
      "fr": "rouge",                          // string — mot en français (OBLIGATOIRE)
      "en": "red",                            // string — mot en anglais (OBLIGATOIRE)
      "ar": "أَحْمَر",                          // string — mot en arabe avec harakats (OBLIGATOIRE)
      "ar_translit": "ahmar",                 // string — translitération (OBLIGATOIRE)
      "emoji": "🔴",                           // string — emoji (OBLIGATOIRE, peut être "")
      "image": "images/couleurs/rouge.png"    // string — chemin image (OPTIONNEL — 28/767 cartes en ont)
    }
  ]
}
```

### Statistiques actuelles
- **94 fichiers** répartis dans 16 dossiers
- **767 cartes** au total
- **28 cartes** ont un champ `image`
- **6 champs** possibles : `fr`, `en`, `ar`, `ar_translit`, `emoji`, `image`

---

## 5. `decks/arabic.json` — Decks générés

Produit par `scripts/generate-decks.py`. Remplace `data/arabic/decks.js`.

Format cible (nouveau — adapté du format existant) :

```jsonc
{
  "version": "2026-03-06T14:00:00.000Z",     // string ISO — pour cache-busting
  "courseId": "arabic",
  "decks": [
    {
      "id": "couleurs",                       // string — correspond au vocab source
      "name": "Les couleurs",
      "nameAr": "الألوان",
      "category": "Premiers mots",            // string — nom du thème
      "tags": ["A1", "premiers-mots"],        // string[] — pour le croisement avec les leçons
      "cards": [
        {
          "id": "couleurs:0",                 // string — "{deckId}:{index}" — identifiant unique global
          "front": "أَحْمَر",                   // string — texte recto (arabe avec harakats)
          "frontPlain": "احمر",               // string — arabe sans harakats (pour recherche/comparaison)
          "back": "rouge",                    // string — texte verso (français)
          "en": "red",                        // string — anglais (pour les cours multi-langues)
          "translit": "ahmar",                // string — translitération
          "emoji": "🔴",                       // string — emoji
          "image": "images/couleurs/rouge.png", // string | null — chemin image
          "audio": null,                      // string | null — chemin audio MP3
          "tags": ["couleur", "adjectif"]     // string[] — tags sémantiques
        }
      ]
    }
  ]
}
```

### Différences avec le format actuel
| Aspect | Ancien (`decks.js`) | Nouveau (`arabic.json`) |
|--------|---------------------|-------------------------|
| Format | `.js` avec `window.DECKS_DATA = ` | `.json` pur |
| Card ID | Aucun (index array) | `"{deckId}:{index}"` |
| `frontPlain` | N'existe pas | Ajouté (arabe sans harakats) |
| `en` | N'existe pas dans le deck | Ajouté depuis vocab source |
| `image` | N'existe pas dans le deck | Ajouté depuis vocab source |
| `audio` | N'existe pas | Ajouté (null par défaut) |
| `tags` | N'existent pas | Ajoutés (deck + carte) |
| Version | `window.DECKS_VERSION` | Champ `version` dans le JSON |

### Génération de `frontPlain`
```python
import re
def remove_harakats(text):
    return re.sub(r'[\u064B-\u065F\u0670]', '', text)
```

### Génération de `id`
```python
card_id = f"{deck_id}:{index}"  # ex: "couleurs:0", "couleurs:1"
```

---

## 6. `lessons/index.json` — Index des leçons

Métadonnées légères de toutes les leçons. Chargé au démarrage pour afficher les listes.

```jsonc
{
  "version": "2026-03-06",
  "lessons": [
    {
      "id": "traditions-1-1",                  // string — identifiant unique
      "seriesId": "traditions-1",              // string — série parent
      "seriesName": "Traditions 1",
      "number": 1,                             // number — numéro dans la série
      "title": "Are you American?",            // string — titre anglais
      "titleFr": "Tu es Américain ?",          // string — titre français
      "description": "Sam meets a border agent at the airport.",
      "descriptionFr": "Sam rencontre un agent à l'aéroport.",
      "level": "A1",                           // "A1" | "A2" | "B1" | "B2" | "C1"
      "tags": ["salutations", "nationalité", "aéroport"],  // string[] — croisement vocab
      "duration": "7:59",                      // string — durée audio format "MM:SS"
      "coverUrl": "images/lessons/traditions-1-1.jpg",      // string | null
      "hasAudio": true,                        // boolean — fichier audio disponible ?
      "vocabCount": 4,                         // number — nombre de mots dans le vocab de la leçon
      "exerciseCount": 3                       // number — nombre d'exercices
    }
  ]
}
```

---

## 7. `lessons/{lessonId}.json` — Contenu complet d'une leçon

Chargé à la demande (lazy load) quand l'utilisateur ouvre une leçon.

```jsonc
{
  "id": "traditions-1-1",
  "seriesId": "traditions-1",
  "seriesName": "Traditions 1",
  "number": 1,
  "title": "Are you American?",
  "titleFr": "Tu es Américain ?",
  "description": "Sam meets a border agent at the airport.",
  "descriptionFr": "Sam rencontre un agent à l'aéroport.",
  "level": "A1",
  "tags": ["salutations", "nationalité", "aéroport"],
  "duration": "7:59",
  "audioUrl": "audio/lessons/traditions-1-1.mp3",
  "coverUrl": "images/lessons/traditions-1-1.jpg",

  "speakers": {
    "sam": {
      "name": "Sam",
      "gender": "male",
      "color": "#58a6ff"
    },
    "agent": {
      "name": "L'agent",
      "gender": "male",
      "color": "#3fb950"
    }
  },

  "dialogue": [
    {
      "id": "d1",                               // string — ID unique dans la leçon
      "speaker": "sam",                          // string — clé dans speakers
      "ar": "مَرْحَبًا!",                          // string — arabe avec harakats
      "arPlain": "مرحبا!",                       // string — arabe sans harakats
      "translit": "marhaban!",                   // string — translitération
      "fr": "Salut !",                           // string — traduction française
      "en": "Hi!",                               // string — traduction anglaise
      "audioStart": 0.0,                         // number — début dans l'audio (secondes)
      "audioEnd": 1.2                            // number — fin dans l'audio (secondes)
    },
    {
      "id": "d2",
      "speaker": "agent",
      "ar": "مَرْحَبَتَيْن! أَنْتَ أَمِيرِكِيّ؟",
      "arPlain": "مرحبتين! أنت أميركي؟",
      "translit": "marhabatayn! anta amiriki?",
      "fr": "Salut ! Tu es Américain ?",
      "en": "Hi! Are you American?",
      "audioStart": 1.5,
      "audioEnd": 4.0
    },
    {
      "id": "d3",
      "speaker": "sam",
      "ar": "نَعَمْ.",
      "arPlain": "نعم.",
      "translit": "na'am.",
      "fr": "Oui.",
      "en": "Yes.",
      "audioStart": 4.5,
      "audioEnd": 5.2
    },
    {
      "id": "d4",
      "speaker": "agent",
      "ar": "مَرْحَبًا بِكَ فِي الْأُرْدُنّ!",
      "arPlain": "مرحبا بك في الأردن!",
      "translit": "marhaban bika fi al-urdunn!",
      "fr": "Bienvenue en Jordanie !",
      "en": "Welcome to Jordan!",
      "audioStart": 5.5,
      "audioEnd": 7.8
    }
  ],

  "vocabulary": [
    {
      "id": "traditions-1-1:v0",               // string — ID unique
      "ar": "مَرْحَبًا",
      "arPlain": "مرحبا",
      "translit": "marhaban",
      "fr": "bienvenue / salut",
      "en": "welcome / hi",
      "root": "ر-ح-ب",                         // string | null — racine trilittère
      "tags": ["salutation", "A1"],
      "linkedCards": ["premiers-mots:12"]       // string[] — IDs de cartes dans les decks thématiques
    },
    {
      "id": "traditions-1-1:v1",
      "ar": "أَنْتَ",
      "arPlain": "أنت",
      "translit": "anta",
      "fr": "tu (masculin)",
      "en": "you (masc.)",
      "root": null,
      "tags": ["pronom", "A1"],
      "linkedCards": []
    },
    {
      "id": "traditions-1-1:v2",
      "ar": "فِي",
      "arPlain": "في",
      "translit": "fi",
      "fr": "dans",
      "en": "in",
      "root": null,
      "tags": ["préposition", "A1"],
      "linkedCards": []
    },
    {
      "id": "traditions-1-1:v3",
      "ar": "الْأُرْدُنّ",
      "arPlain": "الأردن",
      "translit": "al-urdunn",
      "fr": "la Jordanie",
      "en": "Jordan",
      "root": null,
      "tags": ["pays", "géographie", "A1"],
      "linkedCards": []
    }
  ],

  "grammar": [
    {
      "id": "traditions-1-1:g0",
      "title": "Pronom personnel 2ème pers. masc. sing. : أَنْتَ",
      "titleFr": "Tu (masculin)",
      "explanation": "Utilisé pour s'adresser à un homme. Équivalent de 'tu' au masculin.",
      "examples": [
        {
          "ar": "أَنْتَ بريطاني.",
          "translit": "anta britani.",
          "fr": "Tu es Britannique.",
          "en": "You are British."
        },
        {
          "ar": "أَنْتَ تَعْبَان.",
          "translit": "anta ta'ban.",
          "fr": "Tu es fatigué.",
          "en": "You are tired."
        }
      ]
    }
  ],

  "examples": [
    {
      "ar": "أَنْتَ فِي الْبَيْت؟",
      "translit": "anta fi al-bayt?",
      "fr": "Tu es à la maison ?",
      "en": "Are you at home?"
    },
    {
      "ar": "الْقَلَمُ فِي جَيْبِي.",
      "translit": "al-qalamu fi jaybi.",
      "fr": "Le stylo est dans ma poche.",
      "en": "The pen is in my pocket."
    }
  ],

  "exercises": {
    "fillBlanks": [
      {
        "id": "traditions-1-1:fb0",
        "type": "word",                         // "word" — compléter un mot dans une phrase
        "sentenceAr": "_____ أَمِيرِكِيّ؟",
        "sentenceFr": "_____ Américain ?",
        "answer": "أَنْتَ",
        "answerTranslit": "anta",
        "choices": ["أَنَا", "أَنْتَ", "هُوَ", "هِيَ"],
        "hint": "Pronom 'tu' masculin"          // string | null
      }
    ],
    "dialogueBlanks": [
      {
        "id": "traditions-1-1:db0",
        "type": "reply",                        // "reply" — choisir la bonne réponse dans un dialogue
        "contextAr": "مَرْحَبًا!",
        "contextFr": "Salut !",
        "contextSpeaker": "sam",
        "answerAr": "مَرْحَبَتَيْن! أَنْتَ أَمِيرِكِيّ؟",
        "answerFr": "Salut ! Tu es Américain ?",
        "choices": [
          "مَرْحَبَتَيْن! أَنْتَ أَمِيرِكِيّ؟",
          "نَعَمْ، أَنَا أَمِيرِكِيّ.",
          "مَعَ السَّلَامَة!"
        ]
      }
    ]
  }
}
```

---

## 8. `alphabet/letters.json` — Alphabet arabe

```jsonc
{
  "version": "2026-03-06",
  "letters": [
    {
      "id": "alif",
      "name": "Alif",
      "nameAr": "أَلِف",
      "unicode": "ا",
      "forms": {
        "isolated": "ا",
        "initial": "ا",
        "medial": "ـا",
        "final": "ـا"
      },
      "transliteration": "ā / a / ʾ",
      "pronunciation": "Voyelle longue 'a' ou coup de glotte (hamza support)",
      "type": "vowel",                          // "vowel" | "sun" | "moon"
      "order": 1,                                // number — position dans l'alphabet
      "examples": [
        {
          "word": "أَسَد",
          "translit": "asad",
          "meaning": "lion",
          "position": "initial"
        }
      ],
      "rules": [
        "L'alif ne se connecte jamais à la lettre suivante.",
        "Quand il porte un hamza (أ), il représente un coup de glotte."
      ]
    }
    // ... 28 lettres
  ],
  "diacritics": [
    {
      "id": "fatha",
      "name": "Fatha",
      "nameAr": "فَتْحَة",
      "symbol": "َ",
      "sound": "a (court)",
      "description": "Petit trait oblique au-dessus de la lettre. Produit le son 'a' court.",
      "example": {
        "letter": "بَ",
        "translit": "ba",
        "word": "بَاب",
        "wordTranslit": "bāb",
        "wordMeaning": "porte"
      }
    }
    // fatha, damma, kasra, sukun, shadda, tanwin (fathatan, dammatan, kasratan)
  ],
  "rules": [
    {
      "id": "sun-moon",
      "title": "Lettres solaires et lunaires",
      "titleAr": "الحروف الشمسية والقمرية",
      "explanation": "Les lettres solaires assimilent le 'l' de l'article 'al-'. Les lettres lunaires ne l'assimilent pas.",
      "sunLetters": ["ت", "ث", "د", "ذ", "ر", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ل", "ن"],
      "moonLetters": ["ا", "ب", "ج", "ح", "خ", "ع", "غ", "ف", "ق", "ك", "م", "ه", "و", "ي"],
      "examples": [
        { "ar": "الشَّمْس", "translit": "ash-shams", "fr": "le soleil", "type": "sun" },
        { "ar": "الْقَمَر", "translit": "al-qamar", "fr": "la lune", "type": "moon" }
      ]
    }
  ]
}
```

---

## 9. `roots/roots.json` — Racines trilittères

```jsonc
{
  "version": "2026-03-06",
  "roots": [
    {
      "id": "k-t-b",
      "letters": "ك-ت-ب",
      "meaning": "écrire",
      "meaningEn": "to write",
      "family": [
        {
          "ar": "كِتَاب",
          "translit": "kitāb",
          "fr": "livre",
          "form": "nom",                         // "nom" | "verbe" | "adjectif" | "participe" | "masdar"
          "pattern": "فِعَال"                     // string — schème morphologique
        },
        {
          "ar": "كَاتِب",
          "translit": "kātib",
          "fr": "écrivain",
          "form": "participe",
          "pattern": "فَاعِل"
        },
        {
          "ar": "مَكْتَبَة",
          "translit": "maktaba",
          "fr": "bibliothèque",
          "form": "nom",
          "pattern": "مَفْعَلَة"
        },
        {
          "ar": "كَتَبَ",
          "translit": "kataba",
          "fr": "il a écrit",
          "form": "verbe",
          "pattern": "فَعَلَ"
        },
        {
          "ar": "يَكْتُبُ",
          "translit": "yaktub",
          "fr": "il écrit",
          "form": "verbe",
          "pattern": "يَفْعُلُ"
        },
        {
          "ar": "مَكْتُوب",
          "translit": "maktūb",
          "fr": "écrit / destin",
          "form": "participe",
          "pattern": "مَفْعُول"
        }
      ],
      "linkedCards": ["le-travail:5"],           // string[] — lien vers les decks thématiques
      "linkedLessons": ["traditions-2-1"]        // string[] — lien vers les leçons
    }
  ]
}
```

---

## 10. Données en mémoire — IndexedDB

### 10.1 — Store `preferences`

Clé : `"global"`

```jsonc
{
  "theme": "dark",                               // "dark" | "light"
  "lastCourse": "arabic",                        // string — dernier cours utilisé
  "showTranslit": true,                          // boolean
  "showHarakats": true,                          // boolean
  "defaultFrontSide": "front",                   // "front" | "back"
  "correctionLevel": "flexible",                 // "flexible" | "moderate" | "strict"
  "autoPlay": false,                             // boolean
  "audioSpeed": 1.0                              // number — 0.5, 0.75, 1.0, 1.25, 1.5
}
```

### 10.2 — Store `srs`

Clé : `"{courseId}:{cardId}"` — ex: `"arabic:couleurs:0"`

```jsonc
{
  "cardId": "couleurs:0",                        // string — référence vers la carte dans le deck
  "courseId": "arabic",
  "box": 1,                                      // number — 1 à 5 (boîte Leitner)
  "nextReview": "2026-03-10",                    // string — date ISO (YYYY-MM-DD)
  "lastReview": "2026-03-06",                    // string | null
  "reviewCount": 3,                              // number — total de révisions
  "correctCount": 2,                             // number — total de bonnes réponses
  "wrongCount": 1,                               // number — total de mauvaises réponses
  "createdAt": "2026-03-01"                      // string — première rencontre avec ce mot
}
```

### 10.3 — Store `favorites`

Clé : `"{courseId}"` — ex: `"arabic"`

```jsonc
{
  "words": ["couleurs:0", "couleurs:3", "animaux:5"],      // string[] — IDs de cartes
  "lessons": ["traditions-1-1"],                            // string[] — IDs de leçons
  "phrases": ["traditions-1-1:d2", "traditions-1-1:d4"]     // string[] — IDs de lignes de dialogue
}
```

### 10.4 — Store `lessonProgress`

Clé : `"{courseId}:{lessonId}"` — ex: `"arabic:traditions-1-1"`

```jsonc
{
  "lessonId": "traditions-1-1",
  "completed": false,                            // boolean — leçon terminée ?
  "dialogueRead": true,                          // boolean — dialogue lu au moins une fois
  "audioListened": false,                        // boolean — audio écouté au moins une fois
  "vocabUnlocked": true,                         // boolean — vocab accessible dans le mode Mots
  "lastViewed": "2026-03-06",                    // string — date ISO
  "viewCount": 3,                                // number
  "exercises": {
    "fillBlanks": {
      "attempted": true,
      "bestScore": 2,                            // number — meilleur score
      "totalQuestions": 3,
      "lastAttempt": "2026-03-06"
    },
    "dialogueBlanks": {
      "attempted": false,
      "bestScore": 0,
      "totalQuestions": 2,
      "lastAttempt": null
    }
  }
}
```

### 10.5 — Store `stats`

Clé : `"{courseId}"` — ex: `"arabic"`

```jsonc
{
  "totalWordsEncountered": 234,                  // number — mots uniques vus au moins une fois
  "totalWordsAcquired": 85,                      // number — mots en boîte 4 ou 5
  "totalLessonsCompleted": 3,                    // number
  "totalReviewSessions": 47,                     // number
  "totalCorrectAnswers": 412,                    // number
  "totalWrongAnswers": 89,                       // number
  "currentStreak": 5,                            // number — jours consécutifs avec activité
  "longestStreak": 12,                           // number
  "lastActiveDate": "2026-03-06",                // string — date ISO
  "weeklyActivity": [15, 22, 0, 30, 10, 0, 0],  // number[7] — minutes par jour (lun→dim)
  "monthlyWords": [12, 18, 25, 31, 8, 0]         // number[] — mots appris par semaine ce mois
}
```

---

## 11. Mapping de migration — Ancien → Nouveau

### Cartes vocabulaire
| Ancien (vocab JSON) | Ancien (decks.js) | Nouveau (decks JSON) |
|---------------------|--------------------|----------------------|
| `fr` | `back` | `back` |
| `en` | *(absent)* | `en` |
| `ar` | `front` | `front` |
| `ar_translit` | `translit` | `translit` |
| `emoji` | `emoji` | `emoji` |
| `image` | *(absent)* | `image` |
| *(absent)* | *(absent)* | `id` |
| *(absent)* | *(absent)* | `frontPlain` |
| *(absent)* | *(absent)* | `audio` |
| *(absent)* | *(absent)* | `tags` |

### Leçons
| Ancien (`lessons.js` / `conversations.js`) | Nouveau (`lessons/*.json`) |
|--------------------------------------------|----------------------------|
| `dialogue[].speaker` = "A"/"B" | `dialogue[].speaker` = clé dans `speakers` |
| `dialogue[].ar`, `.en` | + `.arPlain`, `.translit`, `.fr`, `.audioStart`, `.audioEnd` |
| `vocabulary[].ar`, `.trans`, `.en` | + `.id`, `.arPlain`, `.root`, `.tags`, `.linkedCards` |
| `grammar[].title`, `.examples` | + `.id`, `.titleFr`, `.explanation`, `.examples[].translit` |
| *(absent)* | `exercises` (fillBlanks, dialogueBlanks) |
| *(absent)* | `speakers` object |
| Données dupliquées entre 2 fichiers | Source unique par leçon |

### Progression
| Ancien (localStorage) | Nouveau (IndexedDB) |
|-----------------------|---------------------|
| `learn-lang-{course}-{deck}` → `{known, learning, starred}` | Store `srs` : 1 entrée par carte avec box + dates |
| `learn-lang-course` | Store `preferences` → `lastCourse` |
| `learn-lang-type` | *(supprimé — géré par le routing)* |
| `theme-mode` | Store `preferences` → `theme` |
| `filter-level`, `filter-theme` | *(supprimé — géré par le routing, ex: `#/conversations/A1`)* |

---

## 12. Script de migration `generate-decks.py` — Changements

Le script existant doit être adapté pour produire le nouveau format.

### Entrée (inchangée)
Les fichiers `data/vocabulary/**/*.json`

### Sortie (modifiée)
`data/decks/arabic.json` et `data/decks/french.json` au lieu de `data/arabic/decks.js` et `data/french/decks.js`

### Changements dans la logique
```python
# Ancien
arabic_cards.append({
    "front": ar,
    "back": word_fr,
    "translit": translit,
    "emoji": emoji
})

# Nouveau
arabic_cards.append({
    "id": f"{vocab['id']}:{index}",
    "front": ar,
    "frontPlain": remove_harakats(ar),
    "back": word_fr,
    "en": en,
    "translit": translit,
    "emoji": emoji,
    "image": card.get("image", None),
    "audio": None,
    "tags": []
})
```

### Sortie fichier
```python
# Ancien
(BASE_DIR / "data" / "arabic" / "decks.js").write_text(
    f"window.DECKS_DATA = {json.dumps(arabic_decks)};"
)

# Nouveau
output = {
    "version": datetime.utcnow().isoformat(),
    "courseId": "arabic",
    "decks": arabic_decks
}
(BASE_DIR / "data" / "decks" / "arabic.json").write_text(
    json.dumps(output, ensure_ascii=False, indent=2)
)
```
