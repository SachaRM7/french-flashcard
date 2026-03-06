# AUDIT-PLAN.md — Plan d'audit et de contrôle qualité
## HelloArabic PWA

> Ce document complète PROMPTS-SEQUENCE.md.
> Il détaille **comment** vérifier chaque checkpoint, quels outils utiliser,
> les erreurs fréquentes à surveiller, et les prompts de correction à envoyer à Claude Code.
>
> À utiliser après chaque phase, mais aussi en audit global une fois l'app complète.

---

## 1. Outils de test

### Navigateur — DevTools

| Onglet | Quoi vérifier |
|--------|---------------|
| Console | Erreurs JS, warnings, logs inattendus |
| Network | Fichiers JSON chargés correctement, pas de 404, taille des réponses |
| Application > IndexedDB | Base "helloarabic" créée, stores présents, données écrites |
| Application > Service Workers | SW enregistré, status "activated", cache rempli |
| Application > Manifest | Manifest détecté, icônes valides |
| Elements | Vérifier que le DOM est propre (pas de styles inline, pas de divs orphelines) |
| Lighthouse | Onglet PWA + Performance + Accessibility (tester en mode mobile) |

### Appareils de test

Tester sur au minimum :
- **Chrome Desktop** (test principal pendant le dev)
- **Safari iOS** (cible prioritaire — tester via iPhone réel ou Xcode Simulator)
- **Chrome Android** (tester via appareil réel ou Chrome DevTools device mode)

Pour Safari iOS, attention à :
- IndexedDB peut être purgé si l'app n'est pas utilisée pendant 7 jours
- Web Speech API a des voix différentes (et parfois pas de voix arabe)
- `position: sticky` se comporte différemment dans les scrollables

### Test rapide — Checklist mentale

À chaque navigation de page, vérifier mentalement :
1. La page s'affiche sans flash blanc
2. Le bouton retour ramène au bon endroit
3. L'URL hash correspond à ce qui est affiché
4. Feather icons sont rendues (pas de `<i data-feather="x">` visible en texte)
5. Le texte arabe s'affiche en RTL avec la bonne police (Amiri)

---

## 2. Audit Phase 1 — Fondations

### 2.1 Tests structurels

```
VÉRIFICATION                                    OÙ TESTER                  ATTENDU
─────────────────────────────────────────────────────────────────────────────────────
index.html charge                               Navigateur                 Page visible, pas d'écran blanc
Pas d'erreur dans la console                    Console                    0 erreur, 0 warning critique
data/courses.json est du JSON valide            Network ou terminal        Réponse 200, JSON parsable
data/themes.json est du JSON valide             Network ou terminal        Réponse 200, JSON parsable
IndexedDB "helloarabic" créée                   Application > IndexedDB    5 stores visibles
Les 5 stores existent                           Application > IndexedDB    preferences, srs, favorites, lessonProgress, stats
Le hash #/ affiche la sélection de cours        URL bar                    Deux cartes (Arabe, Français)
Clic sur Arabe → #/home                         URL bar + écran            Hash change, page d'accueil
Page d'accueil affiche 2 modes                  Écran                      Vocabulaire + Conversations
Clic Vocabulaire → #/mots                       URL bar                    Hash change (page vide OK)
Bouton retour fonctionne                        Écran                      Retour à la page précédente
data-navigate fonctionne sur tous les liens     Clic partout               Pas de liens morts
Thème dark appliqué                             Écran                      Fond sombre, texte clair
CSS variables chargées                          Elements > Computed        --bg-primary = #0B0F16
Fonts chargées                                  Network                    Inter + Amiri (Google Fonts)
Feather icons rendues                           Écran                      Pas de texte brut "<i data-feather"
```

### 2.2 Erreurs fréquentes Phase 1

| Erreur | Cause probable | Prompt de correction |
|--------|---------------|----------------------|
| `Failed to fetch courses.json` | Chemin incorrect ou fichier pas créé | `Le fetch de data/courses.json échoue. Vérifie que le fichier existe et que le chemin dans app.js est correct (relatif à index.html).` |
| `db.init is not a function` | Export mal fait dans db.js | `db.js n'exporte pas correctement. Vérifie que le singleton est exporté : export const db = new Database(); et que app.js importe { db } from './db.js'.` |
| `Cannot read properties of null (reading 'innerHTML')` | `#app` pas trouvé, ou JS chargé avant le DOM | `Le DOM n'est pas prêt quand app.js s'exécute. Assure-toi que init() est appelé via document.addEventListener('DOMContentLoaded', init) ou que le script est type="module" (qui est déjà defer par défaut).` |
| Écran blanc, aucune erreur | Le router ne matche pas la route initiale | `L'app affiche un écran blanc. Vérifie que startRouter() traite le hash initial (pas seulement hashchange). Si le hash est vide, il doit rediriger vers #/.` |
| Feather icons en texte brut | `feather.replace()` pas appelé après le render | `Les icônes Feather s'affichent en texte. Ajoute feather.replace() à la fin de chaque fonction renderXxx() dans les pages, après l'insertion du HTML dans le DOM.` |
| CORS error sur les JSON | Ouverture en file:// au lieu de serveur local | `Les fetch échouent à cause de CORS. L'app doit tourner sur un serveur local. Utilise : python3 -m http.server 8080 ou npx serve .` |

### 2.3 Validation terminal (optionnel)

```bash
# Vérifier que les JSON sont valides
python3 -c "import json; json.load(open('data/courses.json')); print('courses.json OK')"
python3 -c "import json; json.load(open('data/themes.json')); print('themes.json OK')"

# Vérifier que tous les fichiers JS existent
for f in js/app.js js/router.js js/store.js js/db.js js/utils.js js/srs.js js/audio.js; do
  [ -f "$f" ] && echo "✅ $f" || echo "❌ $f MANQUANT"
done

# Vérifier que tous les fichiers CSS existent
for f in css/variables.css css/base.css css/components.css css/layout.css css/pages/home.css css/pages/words.css css/pages/conversations.css css/pages/review.css; do
  [ -f "$f" ] && echo "✅ $f" || echo "❌ $f MANQUANT"
done
```

---

## 3. Audit Phase 2 — Mode Mots

### 3.1 Tests fonctionnels

```
VÉRIFICATION                                    COMMENT TESTER                         ATTENDU
─────────────────────────────────────────────────────────────────────────────────────────────────
data/decks/arabic.json existe et est valide     Terminal: python3 -c "..."             JSON valide, structure avec "version", "courseId", "decks"
Chaque carte a un id unique                     Terminal: script de vérif              Pas de doublons
Chaque carte a frontPlain                       Terminal: grep                         Présent sur toutes les cartes
#/mots affiche 16 thèmes                        Navigateur                             Grille 2 colonnes, 16 cartes avec icônes
Compteurs decks/cartes corrects                 Comparer avec les données              Ex: "Premiers mots" = 10 decks
Clic thème → liste de decks                     Navigateur                             #/mots/{themeId}, liste de decks
Clic deck → page deck avec modes                Navigateur                             6 modes affichés
```

#### Flashcards
```
Swipe droite → carte verte → suivante           Touch ou souris              Animation fly-right, compteur droite +1
Swipe gauche → carte orange → suivante          Touch ou souris              Animation fly-left, compteur gauche +1
Tap sur carte → flip                             Tap/clic                     Rotation 3D, verso affiché
Bouton ★ → favori sauvé                          Clic étoile                  Étoile remplie, persisté après refresh
Bouton 🔊 → audio joue                           Clic audio                   Mot prononcé via TTS
Options > Mélanger                               Toggle dans modal            Cartes dans un ordre différent
Options > Favoris uniquement                     Toggle                       Seules les cartes favorites apparaissent
Options > Direction inversée                     Toggle                       Français en front, arabe en back
Fin du deck → écran complétion                   Swiper toutes les cartes     Score affiché, boutons rejouer/retour
SRS mis à jour                                   DevTools > IndexedDB > srs   Entrées créées avec box et nextReview
```

#### Mode Apprendre
```
Question affichée avec 4 choix                   Écran                        1 bonne réponse + 3 distracteurs
Clic bonne réponse → vert                        Clic                         Background vert, bouton Suivant activé
Clic mauvaise réponse → rouge + bonne en vert    Clic                         Feedback visuel
Mot raté → réapparaît plus tard                  Continuer les questions       Badge "Essayons à nouveau"
Mode écrit → champ texte                         Options > Écrit              Input affiché, QCM masqué
Réponse écrite correcte → vert                   Taper la bonne réponse       Feedback vert
Réponse écrite incorrecte → rouge + correction   Taper une mauvaise réponse   Bonne réponse affichée
Tolérance "flexible" accepte 1-2 typos           Taper avec une faute         Accepté comme correct
Fin → écran complétion avec stats                Terminer toutes les questions Correct/incorrect + boutons
```

#### Mode Examen
```
Configuration : choix nombre de questions        Écran config                 10, 15, 20, toutes
Questions sans retry                             Répondre faux                Pas de "Essayons à nouveau"
Résultats : cercle SVG animé + score %           Fin de l'examen              Animation du cercle, pourcentage
Liste des réponses (correct/incorrect)           Écran résultats              Historique visible
```

#### Mode Match
```
Grille de cellules mélangées                     Écran                        Mix de mots arabes et français
Sélection 2 cellules = paire → disparition       Clic 2 cellules correctes    Animation disparition
Sélection 2 non-paire → flash rouge              Clic 2 cellules incorrectes  Flash rouge, pénalité temps
Timer en temps réel                              Écran                        Compteur qui avance
Fin → temps final affiché                        Trouver toutes les paires    Écran complétion
```

#### Modes Écoute et Image
```
Écoute : audio joue, deviner le mot              Clic "Écouter"               TTS joue, choix affichés
Image : emoji ou image affiché                   Écran                        Emoji visible, 4 choix
Si carte sans emoji/image → skippée              Vérifier                     Pas de question vide
```

### 3.2 Validation données

```bash
# Vérifier le nouveau format des decks
python3 -c "
import json
data = json.load(open('data/decks/arabic.json'))
print(f'Version: {data[\"version\"]}')
print(f'Course: {data[\"courseId\"]}')
print(f'Decks: {len(data[\"decks\"])}')
total = sum(len(d['cards']) for d in data['decks'])
print(f'Total cards: {total}')

# Vérifier qu'aucun id n'est dupliqué
all_ids = []
for d in data['decks']:
    for c in d['cards']:
        all_ids.append(c['id'])
dupes = [x for x in all_ids if all_ids.count(x) > 1]
print(f'Duplicate IDs: {len(set(dupes))}')

# Vérifier que frontPlain existe
missing_plain = sum(1 for d in data['decks'] for c in d['cards'] if 'frontPlain' not in c)
print(f'Cards missing frontPlain: {missing_plain}')
"
```

### 3.3 Erreurs fréquentes Phase 2

| Erreur | Cause | Prompt |
|--------|-------|--------|
| Grille de thèmes vide | Decks pas chargés, ou themes.json pas lié aux decks | `La grille de thèmes est vide sur #/mots. Vérifie que le fetch du fichier decks fonctionne (regarde Network tab) et que le filtrage des decks par thème utilise bien les IDs du champ "decks" dans themes.json.` |
| Swipe ne fonctionne pas sur mobile | Events touch pas gérés | `Le swipe des flashcards ne fonctionne pas sur mobile. Vérifie que touchstart, touchmove, touchend sont écoutés en plus de mousedown, mousemove, mouseup. Assure-toi aussi que touch-action: pan-y est sur la carte.` |
| QCM montre 4 fois la même réponse | Distracteurs mal générés | `Le QCM affiche des doublons. Assure-toi que les distracteurs sont choisis aléatoirement parmi les AUTRES cartes du deck (pas la carte courante) et qu'ils sont uniques.` |
| Audio ne joue pas | speechSynthesis pas supporté ou voix pas chargée | `L'audio TTS ne joue pas. Ajoute un fallback : si speechSynthesis.getVoices() est vide, attends l'event 'voiceschanged'. Sur iOS Safari, speechSynthesis nécessite un geste utilisateur pour le premier play.` |
| IndexedDB SRS vide après les flashcards | updateSRS pas appelé ou await manquant | `Les données SRS ne sont pas sauvées dans IndexedDB après les flashcards. Vérifie que processAnswer est appelé à chaque swipe et que db.updateSRS est awaité.` |

---

## 4. Audit Phase 3 — Mode Conversations

### 4.1 Tests fonctionnels

```
VÉRIFICATION                                    COMMENT                                ATTENDU
─────────────────────────────────────────────────────────────────────────────────────────────────
data/lessons/index.json valide                   Terminal                               JSON valide, array de leçons
data/lessons/traditions-1-1.json valide           Terminal                               Dialogue complet, vocab, grammar
#/conversations affiche les niveaux              Navigateur                             5 niveaux colorés avec compteurs
Filtre par niveau fonctionne                     Clic sur A1                            Seules les leçons A1 affichées
Clic leçon → #/conversations/lecon/{id}          Clic                                   Dialogue affiché
Toggle traduction : masquer/révéler              Toggle                                 Texte français disparaît/apparaît
Toggle translitération                           Toggle                                 Translitération masquée/visible
Toggle harakats                                  Toggle                                 Texte arabe change (avec/sans diacritiques)
Clic audio sur une phrase → TTS joue             Clic icône volume                      Phrase prononcée
Onglet Vocabulaire → liste de mots               Clic onglet                            Mots avec arabe, translit, français
Onglet Grammaire → points de grammaire           Clic onglet                            Titre, explication, exemples
Onglet Exemples → phrases d'exemple              Clic onglet                            Phrases avec audio
Onglet Exercices → résumé + bouton               Clic onglet                            Compteur, bouton "Commencer"
Player audio visible en bas                      Écran                                  Barre, boutons, timer
Exercices phrases à trou → QCM                   #/.../exercice                         Phrase avec ___, 4 choix
Exercices dialogue à trou → QCM                  Suite                                  Contexte + choix de réponse
Score final des exercices                        Fin des exercices                      Score affiché, sauvé en IndexedDB
```

### 4.2 Tests de données croisées

```bash
# Vérifier que chaque leçon de index.json a un fichier correspondant
python3 -c "
import json, os
index = json.load(open('data/lessons/index.json'))
for lesson in index['lessons']:
    path = f'data/lessons/{lesson[\"id\"]}.json'
    exists = os.path.exists(path)
    status = '✅' if exists else '❌'
    print(f'{status} {lesson[\"id\"]} → {path}')
"
```

### 4.3 Erreurs fréquentes Phase 3

| Erreur | Cause | Prompt |
|--------|-------|--------|
| Leçon affiche un écran vide | Fetch du JSON échoue (mauvais chemin ou ID) | `La leçon s'affiche vide. Vérifie dans Network tab que le fetch de data/lessons/{lessonId}.json retourne 200. Le lessonId vient de la route params — log-le pour vérifier.` |
| Toggle harakats ne change rien | Le remplacement ar ↔ arPlain ne se fait pas | `Le toggle harakats ne change pas le texte. Quand showHarakats est false, le rendu doit utiliser le champ arPlain au lieu de ar pour chaque ligne de dialogue.` |
| Player audio bugge | HTMLAudioElement pas reset entre les pages | `Le player audio a un comportement erratique. Assure-toi que audio.stop() est appelé quand on quitte la page de leçon (dans la navigation ou le bouton retour). Le singleton audio doit être proprement reset.` |
| Exercices : pas de validation | Event listener pas bindé sur les choix | `Les exercices ne réagissent pas au clic. Vérifie que bindEvents() dans conv-exercise.js attache les listeners APRÈS l'insertion du HTML dans le DOM.` |

---

## 5. Audit Phase 4 — SRS + Pont

### 5.1 Tests fonctionnels

```
VÉRIFICATION                                    COMMENT                                ATTENDU
─────────────────────────────────────────────────────────────────────────────────────────────────
#/revision affiche le bon nombre de mots dus     Navigateur + IndexedDB                 Nombre cohérent avec les nextReview
Distribution des boîtes correcte                 Comparer avec IndexedDB                5 barres, total = nb entrées SRS
Session de révision fonctionne                   Clic "Commencer"                       QCM avec mots dus, SRS mis à jour après
Page d'accueil : bannière révision à jour        #/home                                 "X mots à réviser" = même nombre que #/revision
Section "Continuer" avec dernière leçon          #/home                                 Dernière leçon vue affichée
Lien "Réviser ces mots" dans une leçon           Onglet Vocabulaire d'une leçon         Bouton visible, lance les flashcards
Lien "Leçons avec ces mots" dans un deck         Vue deck                               Lien visible si tags matchent
```

### 5.2 Test SRS en profondeur

```
SCÉNARIO DE TEST MANUEL :
1. Ouvre un deck, lance les flashcards
2. Swipe 3 cartes à droite (connu), 2 à gauche (à revoir)
3. Vérifie IndexedDB : les 3 "connu" sont en box 2, nextReview = dans 3 jours
4. Les 2 "à revoir" sont en box 1, nextReview = demain
5. Va sur #/revision → les 2 "à revoir" n'apparaissent PAS (nextReview = demain, pas aujourd'hui)
6. Change manuellement la date de nextReview dans IndexedDB pour tester :
   - Mets une date passée sur 1 entrée
   - Recharge #/revision → cette entrée apparaît maintenant
7. Lance une session de révision, réponds correctement
8. Vérifie : box est passée de 1 à 2, nextReview recalculée
```

### 5.3 Erreurs fréquentes Phase 4

| Erreur | Cause | Prompt |
|--------|-------|--------|
| "0 mots à réviser" alors qu'il y en a | Comparaison de dates incorrecte | `getDueWords retourne 0 alors que des mots ont nextReview dans le passé. Vérifie que la comparaison de dates utilise le format YYYY-MM-DD et compare des strings ou des Date objects correctement. Attention aux timezones.` |
| Session de révision : deck vide | getDueWords retourne les données SRS, pas les cartes | `La session de révision affiche un deck vide. getDueWords retourne les entrées SRS (avec cardId) mais il faut aussi charger les decks pour avoir le contenu des cartes (front, back, translit). Croise les deux sources.` |
| Pont leçon→mots ne fonctionne pas | linkedCards vide ou pas de match | `Les linkedCards sont vides dans les leçons. As-tu lancé le script generate-lesson-vocab.py ? Si oui, vérifie que le matching compare bien arPlain (leçon) avec frontPlain (deck) après suppression des harakats.` |

---

## 6. Audit Phase 5 — Sections supplémentaires

### 6.1 Tests fonctionnels

```
VÉRIFICATION                                    COMMENT                                ATTENDU
─────────────────────────────────────────────────────────────────────────────────────────────────
#/alphabet affiche 28 lettres                    Navigateur                             Grille de lettres
Clic lettre → détail avec 4 formes               Clic                                   isolated, initial, medial, final
Diacritiques listés                              Scroll                                 fatha, damma, kasra, sukun, shadda, tanwin
Règles solaires/lunaires                         Scroll                                 Explication + exemples
#/racines affiche les racines                    Navigateur                             15+ racines listées
Clic racine → famille de mots                    Clic                                   Dérivés avec schèmes
Audio sur les mots                               Clic audio                             TTS joue
#/profil affiche stats                           Navigateur                             Mots acquis, streak, activité
Toggle thème fonctionne                          Toggle dark/light                      Changement immédiat + persisté
Export données → fichier JSON                    Clic bouton                            Téléchargement d'un .json
Import données → restauration                    Upload du .json exporté                Données restaurées
```

### 6.2 Validation données alphabet et racines

```bash
# Vérifier alphabet
python3 -c "
import json
data = json.load(open('data/alphabet/letters.json'))
print(f'Letters: {len(data[\"letters\"])}')
print(f'Diacritics: {len(data[\"diacritics\"])}')
print(f'Rules: {len(data[\"rules\"])}')
for l in data['letters']:
    forms = l.get('forms', {})
    if len(forms) != 4:
        print(f'⚠️ {l[\"name\"]} has {len(forms)} forms instead of 4')
"

# Vérifier racines
python3 -c "
import json
data = json.load(open('data/roots/roots.json'))
print(f'Roots: {len(data[\"roots\"])}')
for r in data['roots']:
    print(f'  {r[\"letters\"]} ({r[\"meaning\"]}) → {len(r[\"family\"])} words')
"
```

---

## 7. Audit Phase 6 — PWA + Polish

### 7.1 Service Worker

```
VÉRIFICATION                                    COMMENT                                ATTENDU
─────────────────────────────────────────────────────────────────────────────────────────────────
SW enregistré                                    Application > Service Workers           Status: activated and running
Cache créé                                       Application > Cache Storage            Cache "v1.0.0" avec les assets
Offline fonctionne                               Network tab > cocher "Offline" > F5    App se charge normalement
Nouveaux JSON récupérés quand online             Modifier un JSON, recharger            Nouvelles données affichées
```

Test offline détaillé :
1. Charge l'app normalement (online)
2. Navigue dans 2-3 pages pour remplir le cache
3. Passe en offline (DevTools > Network > Offline)
4. Recharge la page → l'app doit s'afficher
5. Navigue vers #/mots → les thèmes s'affichent (données cachées)
6. Ouvre un deck → les flashcards fonctionnent
7. L'audio TTS ne fonctionnera pas offline (normal)
8. Repasse en online → tout fonctionne normalement

### 7.2 Animations

```
VÉRIFICATION                                    COMMENT                                ATTENDU
─────────────────────────────────────────────────────────────────────────────────────────────────
Transition de page                               Naviguer entre les pages               Fade-in subtil, pas de flash blanc
Hover sur les cartes                             Desktop, survoler                      Lift + shadow
Active sur les cartes                            Clic maintenu                          Scale 0.98
Modal apparition                                 Ouvrir les options                     Fade + scale
Flashcard flip                                   Tap sur carte                          Rotation 3D fluide
Barres de progression                            Répondre à un QCM                      Remplissage animé
Stagger dans les listes                          Ouvrir une page avec liste             Éléments apparaissent en cascade
```

### 7.3 Responsive

```
VÉRIFICATION                                    TAILLE ÉCRAN                           ATTENDU
─────────────────────────────────────────────────────────────────────────────────────────────────
iPhone SE                                        320px                                  Tout visible, pas de scroll horizontal
iPhone 14                                        390px                                  Layout confortable
iPad                                             768px                                  Grilles 3 colonnes si pertinent
Desktop                                          1200px                                 Contenu centré, max-width respecté
Flashcard swipe sur mobile                       Touch device                           Fluide, pas de scroll parasite
Player audio                                     Toutes tailles                         Fixé en bas, pas coupé
Modale options                                   320px                                  Pas de débordement
Texte arabe long                                 Petits écrans                          Pas de coupure, wrapping correct
```

### 7.4 Accessibilité

```
VÉRIFICATION                                    COMMENT                                ATTENDU
─────────────────────────────────────────────────────────────────────────────────────────────────
Tab navigation                                   Appuyer Tab plusieurs fois              Focus visible sur chaque élément interactif
Boutons icônes ont un aria-label                 Inspecter le DOM                       aria-label présent
Contraste suffisant                              Lighthouse > Accessibility             Score > 90
Flashcards au clavier                            Espace, flèches                        Flip, connu, à revoir
Pas de piège focus dans les modales              Tab dans une modale                    Focus reste dans la modale, Escape ferme
Screen reader basics                             VoiceOver / NVDA                       Structure compréhensible
```

### 7.5 Lighthouse

Exécuter Lighthouse en mode mobile sur chaque page principale :

```
PAGE                    PERFORMANCE    PWA    ACCESSIBILITY    BEST PRACTICES
─────────────────────────────────────────────────────────────────────────────
#/                      > 90           ✅     > 90             > 90
#/home                  > 90           ✅     > 90             > 90
#/mots                  > 85           ✅     > 90             > 90
#/mots/.../flash        > 80           ✅     > 90             > 90
#/conversations         > 85           ✅     > 90             > 90
#/conversations/lecon/  > 80           ✅     > 90             > 90
#/revision              > 90           ✅     > 90             > 90
```

Score PWA = tous les critères PWA verts (installable, offline, etc.)

---

## 8. Audit global — Cohérence des données

À exécuter une fois toutes les phases terminées.

```bash
#!/bin/bash
# audit-data.sh — Vérification complète de la cohérence des données

echo "=== 1. Fichiers JSON valides ==="
for f in data/courses.json data/themes.json data/decks/arabic.json data/decks/french.json data/lessons/index.json data/alphabet/letters.json data/roots/roots.json; do
  python3 -c "import json; json.load(open('$f')); print('✅ $f')" 2>/dev/null || echo "❌ $f INVALIDE"
done

echo ""
echo "=== 2. Fichiers leçons ==="
python3 -c "
import json, os
index = json.load(open('data/lessons/index.json'))
for l in index['lessons']:
    path = f'data/lessons/{l[\"id\"]}.json'
    if os.path.exists(path):
        data = json.load(open(path))
        d = len(data.get('dialogue', []))
        v = len(data.get('vocabulary', []))
        e = len(data.get('exercises', {}).get('fillBlanks', [])) + len(data.get('exercises', {}).get('dialogueBlanks', []))
        status = '✅' if d > 0 else '⚠️ '
        print(f'{status} {l[\"id\"]}: {d} dialogue lines, {v} vocab, {e} exercises')
    else:
        print(f'❌ {l[\"id\"]}: fichier manquant')
"

echo ""
echo "=== 3. Thèmes ↔ Decks ==="
python3 -c "
import json
themes = json.load(open('data/themes.json'))
decks_data = json.load(open('data/decks/arabic.json'))
deck_ids = {d['id'] for d in decks_data['decks']}

for t in themes:
    missing = [d for d in t['decks'] if d not in deck_ids]
    if missing:
        print(f'⚠️  Thème \"{t[\"name\"]}\" référence des decks inexistants: {missing}')
    else:
        print(f'✅ Thème \"{t[\"name\"]}\" : {len(t[\"decks\"])} decks OK')
"

echo ""
echo "=== 4. IDs uniques ==="
python3 -c "
import json
decks_data = json.load(open('data/decks/arabic.json'))
ids = [c['id'] for d in decks_data['decks'] for c in d['cards']]
dupes = set(x for x in ids if ids.count(x) > 1)
if dupes:
    print(f'❌ {len(dupes)} IDs dupliqués dans les decks: {list(dupes)[:5]}...')
else:
    print(f'✅ {len(ids)} card IDs tous uniques')
"

echo ""
echo "=== 5. Stats globales ==="
python3 -c "
import json
decks = json.load(open('data/decks/arabic.json'))
themes = json.load(open('data/themes.json'))
lessons = json.load(open('data/lessons/index.json'))
print(f'Cours: arabic + french')
print(f'Thèmes: {len(themes)}')
print(f'Decks: {len(decks[\"decks\"])}')
print(f'Cartes: {sum(len(d[\"cards\"]) for d in decks[\"decks\"])}')
print(f'Leçons: {len(lessons[\"lessons\"])}')
try:
    alpha = json.load(open('data/alphabet/letters.json'))
    print(f'Lettres alphabet: {len(alpha[\"letters\"])}')
except: print('Alphabet: pas encore créé')
try:
    roots = json.load(open('data/roots/roots.json'))
    print(f'Racines: {len(roots[\"roots\"])}')
except: print('Racines: pas encore créé')
"
```

---

## 9. Prompts de correction génériques

Si un problème n'est pas couvert ci-dessus, utiliser ces templates :

### Erreur JS
```
J'ai cette erreur dans la console : [COLLER L'ERREUR EXACTE].
Elle apparaît quand je [DÉCRIRE L'ACTION].
Le fichier concerné est probablement [FICHIER].
Corrige l'erreur en respectant les conventions de /docs/STACK.md.
```

### Bug visuel
```
Sur la page [ROUTE], le composant [NOM] ne s'affiche pas correctement :
- Attendu : [DESCRIPTION]
- Réel : [DESCRIPTION]
Corrige les styles dans [FICHIER CSS] en utilisant les variables de css/variables.css.
```

### Donnée manquante ou incorrecte
```
Le fichier [CHEMIN] a un problème :
[DÉCRIRE LE PROBLÈME]
Le schéma attendu est dans /docs/DATA-SCHEMA.md section [NUMÉRO].
Corrige le fichier pour respecter le schéma.
```

### Fonctionnalité qui ne marche pas
```
La fonctionnalité [NOM] ne fonctionne pas sur la page [ROUTE].
Quand je [ACTION], il se passe [CE QUI SE PASSE] au lieu de [CE QUI DEVRAIT SE PASSER].
Le code est dans [FICHIER JS].
Vérifie la logique et corrige. Respecte les conventions de /docs/STACK.md.
```

### Régression après un prompt
```
Après le dernier changement, [FONCTIONNALITÉ] qui marchait avant ne marche plus.
L'erreur est : [ERREUR OU DESCRIPTION].
Vérifie que le dernier changement n'a pas cassé [FICHIER]. 
Corrige sans casser les fonctionnalités existantes.
```

---

## 10. Fréquence des audits

| Moment | Type d'audit | Durée estimée |
|--------|-------------|---------------|
| Après chaque prompt | Vérif rapide console + visuel | 1-2 min |
| Après chaque checkpoint | Audit de phase complet (section 2-7) | 15-30 min |
| Après Phase 6 | Audit global données (section 8) | 10 min |
| Après Phase 6 | Lighthouse complet | 15 min |
| Avant chaque commit Git | Console clean + navigation complète | 5 min |
| Hebdomadaire (en continu) | Re-tester les vieilles fonctionnalités | 20 min |
