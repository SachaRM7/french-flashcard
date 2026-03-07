# IMPROVEMENTS-V1.md — Améliorations UX
## Spécifications pour Claude Code

> Ce document décrit 5 améliorations à implémenter dans l'app HelloArabic.
> Lis d'abord CLAUDE.md, /docs/STACK.md et /docs/DATA-SCHEMA.md pour le contexte.
> Respecte toutes les conventions décrites.
> 
> Implémente ces améliorations **une par une**, dans l'ordre.
> Chaque section = 1 prompt unitaire.

---

## Amélioration 1 — Page intermédiaire par niveau (Conversations)

### Problème actuel
Quand l'utilisateur clique sur un niveau (A1, A2…) depuis l'accueil conversations, il est redirigé vers une liste filtrée en bas de page. C'est peu intuitif, oblige à scroller, et ne permet pas de naviguer entre niveaux facilement.

### Comportement souhaité

Créer une **page dédiée par niveau** accessible via la route `#/conversations/niveau/:level`.

**Structure de la page (de haut en bas) :**

1. **Header fixe**
   - Bouton retour ← vers `#/conversations`
   - Titre centré : "Tous les sujets"

2. **Barre de niveaux (tabs horizontales)**
   - 5 onglets en ligne : A1 — A2 — B1 — B2 — C1
   - Le niveau actif a un **underline** épais (3px) dans sa couleur propre et un texte en gras noir/blanc
   - Les niveaux inactifs ont un texte grisé (var(--text-tertiary)), pas d'underline
   - Au clic sur un onglet → change le niveau affiché (sans changer de page, juste re-render le contenu)
   - La barre est fixe en haut sous le header (sticky)

3. **Zone de contenu (swipable)**
   - **Swipe horizontal gauche/droite** sur toute cette zone pour passer au niveau suivant/précédent
   - Quand on swipe de droite à gauche sur A1 → le contenu passe à A2 avec une transition slide (le contenu sort à gauche, le nouveau entre par la droite)
   - L'onglet actif dans la barre se met à jour en même temps
   - Sur le dernier niveau (C1), swiper à gauche ne fait rien. Sur A1, swiper à droite ne fait rien.

4. **Contenu du niveau**
   - Titre "Liste de leçons" en gras, avec le nombre total de leçons à droite (ex: "95 Lessons")
   - Bouton "▶ Écoutez tout (X Lessons)" — optionnel, placeholder pour l'instant
   - **Liste des leçons** : chaque leçon est une carte horizontale :
     * Image/placeholder à gauche (100x100px, border-radius 12px, avec badge du niveau en bas-gauche de l'image, badge = petit rectangle arrondi avec le texte "A1" en blanc sur fond de la couleur du niveau)
     * À droite de l'image : titre en gras (format "Série | N: Titre"), description en gris (2 lignes max, text-overflow ellipsis), et si progression existante : texte "Terminé à X%" en couleur du niveau
   - La liste est scrollable verticalement
   - Au clic sur une leçon → `navigate('#/conversations/lecon/' + lessonId)`

### Implémentation swipe

Le swipe doit utiliser les événements touch natifs :
```
touchstart → enregistrer la position X initiale
touchmove → calculer le delta X, si |deltaX| > 30px, commencer à déplacer le contenu
touchend → si deltaX > 80px → niveau précédent ; si deltaX < -80px → niveau suivant ; sinon snap back
```

Utiliser `transform: translateX()` pour l'animation de slide, avec `transition: transform 0.3s ease` au release.

### Couleurs des niveaux (rappel)
```
A1 → #2e7d32 (vert)
A2 → #1565c0 (bleu)
B1 → #6a1b9a (violet)
B2 → #e65100 (orange)
C1 → #c2185b (rose)
```

### Sous-titres des niveaux
```
A1 → Débutant
A2 → Élémentaire
B1 → Intermédiaire
B2 → Intermédiaire avancé
C1 → Avancé
```

### Fichiers à créer/modifier
- **Créer** `js/pages/conv-level.js` — toute la logique de cette page
- **Modifier** `js/pages/conv-home.js` — le clic sur un niveau doit maintenant faire `navigate('#/conversations/niveau/' + level)` au lieu de filtrer en place
- **Modifier** `js/app.js` — ajouter la route `route('/conversations/niveau/:level', renderConvLevel)`
- **Ajouter** les styles dans `css/pages/conversations.css`

### Styles à implémenter (conversations.css)

```css
/* Barre de niveaux */
.level-tabs {
  display: flex;
  justify-content: space-around;
  position: sticky;
  top: 0; /* sous le header */
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border);
  z-index: var(--z-dropdown);
  padding: 0 var(--space-lg);
}

.level-tabs__tab {
  flex: 1;
  text-align: center;
  padding: var(--space-lg) 0;
  font-size: var(--text-base);
  font-weight: 400;
  color: var(--text-tertiary);
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}

.level-tabs__tab--active {
  font-weight: 700;
  color: var(--text-primary);
  border-bottom-color: var(--level-color); /* défini dynamiquement */
}

/* Zone swipable */
.level-swipe-container {
  overflow: hidden;
  position: relative;
  flex: 1;
}

.level-swipe-track {
  display: flex;
  transition: transform 0.3s ease;
  /* width = 500% (5 niveaux), chaque panneau = 20% */
}

.level-swipe-panel {
  min-width: 100%;
  flex-shrink: 0;
  padding: var(--space-xl);
  overflow-y: auto;
}

/* Carte leçon */
.lesson-card {
  display: flex;
  gap: var(--space-lg);
  padding: var(--space-lg) 0;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}

.lesson-card__image {
  width: 100px;
  height: 100px;
  min-width: 100px;
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  object-fit: cover;
  position: relative;
  overflow: hidden;
}

.lesson-card__level-badge {
  position: absolute;
  bottom: 6px;
  left: 6px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: var(--text-xs);
  font-weight: 700;
  color: #fff;
  /* background défini inline avec la couleur du niveau */
}

.lesson-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0; /* pour que text-overflow fonctionne */
}

.lesson-card__title {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--accent-blue);
  margin-bottom: var(--space-xs);
}

.lesson-card__desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.lesson-card__progress {
  font-size: var(--text-sm);
  margin-top: var(--space-xs);
  font-weight: 500;
  /* color défini dynamiquement selon le niveau */
}
```

### Checkpoint
- Depuis `#/conversations`, cliquer sur A1 → arrive sur `#/conversations/niveau/A1`
- La barre A1-C1 est visible, A1 est souligné
- Swipe gauche → contenu slide vers A2, onglet A2 souligné
- Clic sur B1 → contenu passe à B1
- Les leçons du niveau sont listées avec image, titre, description
- Clic sur une leçon → `#/conversations/lecon/{id}`
- Bouton retour → `#/conversations`

---

## Amélioration 2 — Swipe entre onglets dans une leçon

### Problème actuel
Dans la page d'une leçon (`#/conversations/lecon/:id`), les onglets (Dialogue, Vocabulaire, Grammaire, Exemples, Exercices) ne sont switchables que par clic. Sur mobile, le swipe est le geste naturel.

### Comportement souhaité
Appliquer le **même pattern de swipe** que l'amélioration 1 sur le contenu des onglets de la leçon.

**Fonctionnement :**
- Les 5 onglets restent cliquables en haut (tab-bar)
- Le contenu sous la tab-bar est **swipable horizontalement**
- Swipe gauche → onglet suivant (Dialogue → Vocabulaire → Grammaire → Exemples → Exercices)
- Swipe droite → onglet précédent
- L'onglet actif dans la tab-bar se met à jour automatiquement pendant le swipe
- Transition identique : slide avec `transform: translateX()`, `transition: 0.3s ease`
- Les onglets tactiles dans la tab-bar gardent aussi un underline actif (même style que les level-tabs)

**Ordre des onglets :**
1. Dialogue
2. Vocabulaire
3. Grammaire
4. Exemples
5. Exercices

**Contrainte importante :**
- Le scroll vertical du contenu de chaque onglet doit rester fonctionnel
- Le swipe horizontal ne se déclenche que si le mouvement est **principalement horizontal** (|deltaX| > |deltaY| * 1.5)
- Si le mouvement est principalement vertical → c'est un scroll normal, ne pas intercepter

### Fichiers à modifier
- `js/pages/conv-lesson.js` — refactorer le contenu en 5 panneaux swipables
- `js/components/tab-bar.js` — ajouter le support de l'underline animé + callback onSwipe
- `css/pages/conversations.css` — réutiliser le pattern `.level-swipe-container` / `.level-swipe-track` avec une classe générique `.swipe-tabs-container` / `.swipe-tabs-track`

### Styles à ajouter

```css
/* Pattern swipe tabs réutilisable */
.swipe-tabs-container {
  overflow: hidden;
  flex: 1;
  position: relative;
}

.swipe-tabs-track {
  display: flex;
  transition: transform 0.3s ease;
}

.swipe-tabs-panel {
  min-width: 100%;
  flex-shrink: 0;
  overflow-y: auto;
  padding: var(--space-lg);
}

/* Tab bar avec underline */
.tab-bar {
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: var(--bg-primary);
  z-index: var(--z-dropdown);
}

.tab-bar::-webkit-scrollbar { display: none; }

.tab-bar__tab {
  flex-shrink: 0;
  padding: var(--space-md) var(--space-lg);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-tertiary);
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}

.tab-bar__tab--active {
  color: var(--text-primary);
  font-weight: 600;
  border-bottom-color: var(--accent-blue);
}
```

### Checkpoint
- Ouvrir une leçon → onglet Dialogue actif par défaut
- Swipe gauche → contenu slide vers Vocabulaire, onglet Vocabulaire souligné
- Continuer à swiper → Grammaire → Exemples → Exercices
- Swipe droite depuis Grammaire → retour à Vocabulaire
- Scroller verticalement le dialogue (beaucoup de lignes) ne déclenche PAS le swipe
- Clic sur un onglet → switch immédiat (sans animation de swipe)

---

## Amélioration 3 — "Réviser ces mots" → choix du mode

### Problème actuel
Dans l'onglet Vocabulaire d'une leçon, le bouton "Réviser ces mots en flashcards" lance directement le mode flashcard. L'utilisateur n'a pas le choix du mode de révision.

### Comportement souhaité
Le bouton "Réviser ces mots" doit naviguer vers **la page de choix du mode** (words-deck.js), pas directement vers les flashcards.

**Flux :**
1. Onglet Vocabulaire d'une leçon → bouton "Réviser ces mots →"
2. Clic → crée un deck à partir du vocabulaire de la leçon (voir amélioration 4 pour la persistance)
3. Navigue vers `#/mots/lecons/{lessonId}` qui affiche la page deck standard :
   - Nom du deck : "Vocab — {titre de la leçon}"
   - Stats du deck (nombre de cartes, acquis, en apprentissage)
   - Les 6 modes : Flashcards, Apprendre, Examen, Associer, Écoute, Image
4. Au clic sur un mode → lance ce mode avec le deck de la leçon

**Détail de la création du deck :**
Le vocabulaire de la leçon (champ `vocabulary` dans le JSON) doit être transformé en cartes compatibles avec le format deck :
```javascript
const lessonDeck = {
  id: `lesson-vocab-${lessonId}`,
  name: `Vocab — ${lesson.seriesName} ${lesson.number}`,
  nameAr: '', 
  category: 'Leçons',
  source: 'lesson',          // marqueur pour différencier des decks thématiques
  lessonId: lessonId,         // référence vers la leçon d'origine
  tags: lesson.tags,
  cards: lesson.vocabulary.map((word, index) => ({
    id: `lesson-vocab-${lessonId}:${index}`,
    front: word.ar,
    frontPlain: word.arPlain,
    back: word.fr,
    en: word.en,
    translit: word.translit,
    emoji: '',
    image: null,
    audio: null,
    tags: word.tags || []
  }))
};
```

### Fichiers à modifier
- `js/pages/conv-lesson.js` — modifier le bouton "Réviser ces mots" : au lieu de créer un deck temporaire et naviguer vers les flashcards, créer le deck persistant (voir amélioration 4) et naviguer vers `#/mots/lecons/{lessonId}`
- `js/pages/words-deck.js` — doit gérer les decks de type leçon (route `/mots/lecons/:lessonId`)
- `js/app.js` — ajouter les routes :
  * `route('/mots/lecons/:lessonId', renderWordsDeck)` — page choix du mode
  * `route('/mots/lecons/:lessonId/flash', renderWordsFlashcards)`
  * `route('/mots/lecons/:lessonId/learn', renderWordsLearn)`
  * `route('/mots/lecons/:lessonId/test', renderWordsTest)`
  * `route('/mots/lecons/:lessonId/match', renderWordsMatch)`
  * `route('/mots/lecons/:lessonId/listen', renderWordsListen)`
  * `route('/mots/lecons/:lessonId/image', renderWordsImage)`

### Checkpoint
- Ouvrir une leçon → Vocabulaire → "Réviser ces mots →"
- Arrive sur la page deck avec les 6 modes
- Clic "Flashcards" → flashcards avec les mots de la leçon
- Clic "Examen" → examen avec les mots de la leçon
- Bouton retour → retour à la page deck
- Bouton retour → retour à la leçon

---

## Amélioration 4 — Decks de leçon persistants

### Problème actuel
Les decks créés à partir du vocabulaire d'une leçon sont temporaires (stockés dans le store en mémoire). Ils disparaissent au rechargement de la page.

### Comportement souhaité
Les decks de leçon doivent être **persistés dans IndexedDB** et apparaître de manière permanente dans la liste des decks disponibles.

**Comportement :**
1. Quand l'utilisateur clique "Réviser ces mots" dans une leçon, le deck est **sauvé dans IndexedDB**
2. Ce deck apparaît ensuite dans `#/mots` dans une **section dédiée "Mots des leçons"** affichée en haut, avant les thèmes
3. Cette section montre tous les decks issus de leçons, avec un badge distinctif "💬 Leçon"
4. Ces decks restent même après rechargement de l'app
5. Possibilité de supprimer un deck de leçon (bouton 🗑️ sur la carte) si l'utilisateur veut nettoyer

**Stockage IndexedDB :**

Ajouter un nouveau store `lessonDecks` dans la base `helloarabic` (dans db.js, incrémenter la version de la DB) :

```javascript
// Clé : "{courseId}:{lessonId}"
// Valeur :
{
  courseId: "arabic",
  lessonId: "traditions-1-1",
  deck: { /* objet deck complet au format standard */ },
  createdAt: "2026-03-07",
  lastUsed: "2026-03-07"
}
```

**API db.js à ajouter :**
```javascript
db.saveLessonDeck(courseId, lessonId, deck)   // Créer ou mettre à jour
db.getLessonDecks(courseId)                     // Récupérer tous les decks de leçon
db.deleteLessonDeck(courseId, lessonId)         // Supprimer un deck de leçon
```

### Fichiers à créer/modifier
- `js/db.js` — ajouter le store `lessonDecks` et les 3 méthodes. **Attention** : incrémenter le numéro de version de la DB déclenche `onupgradeneeded`, il faut gérer la migration (créer le nouveau store sans toucher aux existants)
- `js/pages/conv-lesson.js` — au clic "Réviser ces mots", appeler `db.saveLessonDeck()` avant de naviguer
- `js/pages/words-home.js` — charger les lesson decks via `db.getLessonDecks()` et les afficher dans une section "Mots des leçons" en haut de la page, avant la grille des thèmes
- `css/pages/words.css` — style pour la section "Mots des leçons" et le badge "💬 Leçon"

### Styles pour la section lesson decks

```css
.lesson-decks-section {
  margin-bottom: var(--space-2xl);
}

.lesson-decks-section__title {
  font-size: var(--text-base);
  font-weight: 600;
  margin-bottom: var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.deck-card--lesson {
  border-left: 4px solid var(--accent-purple);
}

.deck-card__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  color: var(--accent-purple);
  font-weight: 600;
}

.deck-card__delete {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-fast), background var(--transition-fast);
}

.deck-card__delete:hover {
  color: var(--accent-red);
  background: rgba(248, 81, 73, 0.1);
}
```

### Checkpoint
- Ouvrir une leçon → Vocabulaire → "Réviser ces mots" → page deck créée
- Recharger l'app (F5) → aller sur `#/mots` → section "Mots des leçons" visible avec le deck
- Le deck affiche le nom "Vocab — Traditions 1, Leçon 1", badge "💬 Leçon"
- Cliquer dessus → page deck avec les 6 modes, tout fonctionne
- Créer un 2ème deck depuis une autre leçon → les 2 apparaissent
- Supprimer un deck (🗑️) → il disparaît de la liste et d'IndexedDB
- Les decks thématiques existants ne sont pas affectés

---

## Amélioration 5 — Bouton Reset dans les modes de révision

### Problème actuel
Dans tous les modes de révision de mots (flashcards, apprendre, examen, associer, écoute, image), si l'utilisateur fait un missclick ou veut recommencer, il n'y a aucun moyen de reset la session en cours. Il doit quitter et relancer le mode.

### Comportement souhaité
Ajouter un **bouton reset** (↻ ou icône Feather `refresh-cw`) accessible dans tous les modes de révision.

**Emplacement :**
- Dans le **header** de chaque mode, à droite du titre (à côté du bouton options ⚙️ quand il existe)
- Icône : `<i data-feather="refresh-cw"></i>`
- Style : même que les autres boutons du header (`.icon-btn`, 40x40, border, border-radius)

**Comportement au clic :**
1. Affiche une **confirmation modale** : "Recommencer la session ? Ta progression actuelle sera perdue."
   - Bouton "Recommencer" (primary)
   - Bouton "Annuler" (secondary)
2. Si confirmé :
   - Remet tous les compteurs à zéro (correct, incorrect, index, retrySet, etc.)
   - Remélange les cartes si l'option shuffle est activée
   - Repart de la première carte/question
   - **Ne modifie PAS le SRS** — les réponses de la session annulée ne sont pas comptées. Concrètement : ne pas appeler `db.updateSRS()` pendant la session, mais seulement à la fin si la session est complétée normalement. Ou bien : annuler (rollback) les modifications SRS faites pendant cette session.
3. Si annulé : ferme la modale, continue la session normalement

**Approche technique recommandée pour le SRS :**
La méthode la plus simple est de **collecter les résultats SRS en mémoire** pendant la session (dans un array `pendingSRS`) et ne les écrire dans IndexedDB qu'à l'écran de complétion. Ainsi, un reset = vider `pendingSRS` et recommencer.

```javascript
// Au lieu de :
// À chaque réponse → db.updateSRS(courseId, cardId, newSRS) ← IMMÉDIAT

// Faire :
let pendingSRS = []; // Collecte pendant la session

// À chaque réponse :
pendingSRS.push({ cardId, srsData: processAnswer(currentSRS, isCorrect) });

// À la complétion de la session :
for (const entry of pendingSRS) {
  await db.updateSRS(courseId, entry.cardId, entry.srsData);
}
pendingSRS = [];

// Au reset :
pendingSRS = [];
// Re-init la session
```

### Fichiers à modifier
Chaque fichier de mode de révision doit être modifié :
- `js/pages/words-flashcards.js` — ajouter le bouton reset dans le header, implémenter la confirmation et le re-init, adopter le pattern pendingSRS
- `js/pages/words-learn.js` — idem
- `js/pages/words-test.js` — idem
- `js/pages/words-match.js` — ajouter le bouton reset (le match a déjà un bouton ↻ "restart", mais il ne demande pas de confirmation et ne gère pas le SRS)
- `js/pages/words-listen.js` — idem
- `js/pages/words-image.js` — idem
- `js/components/modal.js` — ajouter une fonction `showConfirmModal(title, message, onConfirm, onCancel)` réutilisable

### Style du bouton reset

Réutiliser `.icon-btn` existant. Pas de nouveau style nécessaire.
Le bouton est placé dans `.page-header__actions` à côté de ⚙️.

### Style de la modale de confirmation

```css
.confirm-modal__message {
  font-size: var(--text-base);
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: var(--space-2xl);
  line-height: 1.5;
}

.confirm-modal__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}
```

### Checkpoint
- Flashcards : répondre à 3 cartes → clic reset → confirmation → recommence à la carte 1, compteurs à 0
- Apprendre : répondre à 2 questions → clic reset → confirmation → recommence question 1
- Examen : idem
- Match : clic reset → confirmation → grille remélangée, timer à 0
- Écoute / Image : idem que apprendre
- Après un reset, vérifier dans IndexedDB que les données SRS n'ont **PAS** été modifiées par la session annulée
- Annuler la confirmation → la session continue normalement
- Compléter une session sans reset → les données SRS sont bien écrites à la fin

---

## Résumé des prompts pour Claude Code

Envoie ces 5 prompts dans l'ordre :

| # | Prompt | Résumé |
|---|--------|--------|
| 1 | "Implémente l'amélioration 1 décrite dans /docs/IMPROVEMENTS-V1.md — Page intermédiaire par niveau" | Nouvelle page avec swipe entre niveaux |
| 2 | "Implémente l'amélioration 2 décrite dans /docs/IMPROVEMENTS-V1.md — Swipe entre onglets dans une leçon" | Onglets de leçon swipables |
| 3 | "Implémente l'amélioration 3 décrite dans /docs/IMPROVEMENTS-V1.md — Réviser ces mots → choix du mode" | Bouton vocab → page de choix du mode |
| 4 | "Implémente l'amélioration 4 décrite dans /docs/IMPROVEMENTS-V1.md — Decks de leçon persistants" | Sauvegarde IndexedDB + section dans #/mots |
| 5 | "Implémente l'amélioration 5 décrite dans /docs/IMPROVEMENTS-V1.md — Bouton Reset dans les modes de révision" | Reset session + SRS différé |

**Après chaque prompt**, teste le checkpoint correspondant avant de passer au suivant.
