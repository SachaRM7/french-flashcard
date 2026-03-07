// js/app.js — Bootstrap : init DB, charger store, démarrer router

import { db } from './db.js';
import { store } from './store.js';
import { route, startRouter } from './router.js';
import { renderHome, renderCourseSelect } from './pages/home.js';
import { renderWordsHome, renderWordsTheme } from './pages/words-home.js';
import { renderWordsDeck } from './pages/words-deck.js';
import { renderWordsFlashcards } from './pages/words-flashcards.js';
import { renderWordsLearn } from './pages/words-learn.js';
import { renderWordsTest } from './pages/words-test.js';
import { renderWordsMatch } from './pages/words-match.js';
import { renderWordsListen } from './pages/words-listen.js';
import { renderWordsImage } from './pages/words-image.js';
import { renderConvHome } from './pages/conv-home.js';
import { renderConvLesson } from './pages/conv-lesson.js';
import { renderConvExercise } from './pages/conv-exercise.js';
import { renderReviewDashboard } from './pages/review-dashboard.js';
import { renderReviewSession } from './pages/review-session.js';
import { renderAlphabet } from './pages/alphabet.js';
import { renderRoots } from './pages/roots.js';
import { renderProfil } from './pages/profil.js';

async function init() {
  await db.init();

  const prefs = await db.getPreferences();
  store.set('preferences', prefs);

  if (prefs.theme === 'light') {
    document.body.classList.add('light-mode');
  }

  const [courses, themes] = await Promise.all([
    fetch('data/courses.json').then(r => r.json()),
    fetch('data/themes.json').then(r => r.json()),
  ]);

  store.set('courses', courses);
  store.set('themes', themes);

  if (prefs.lastCourse) {
    const course = courses.find(c => c.id === prefs.lastCourse);
    if (course) store.set('currentCourse', course);
  }

  // Phase 1 — Fondations
  route('/', renderCourseSelect);
  route('/home', renderHome);

  // Phase 2 — Mode Mots
  route('/mots', renderWordsHome);
  route('/mots/:themeId', renderWordsTheme);
  route('/mots/:themeId/:deckId', renderWordsDeck);
  route('/mots/:themeId/:deckId/flash',  renderWordsFlashcards);
  route('/mots/:themeId/:deckId/learn',  renderWordsLearn);
  route('/mots/:themeId/:deckId/test',   renderWordsTest);
  route('/mots/:themeId/:deckId/match',  renderWordsMatch);
  route('/mots/:themeId/:deckId/listen', renderWordsListen);
  route('/mots/:themeId/:deckId/image',  renderWordsImage);

  // Phase 3 — Conversations
  route('/conversations', renderConvHome);
  route('/conversations/lecon/:lessonId', renderConvLesson);
  route('/conversations/lecon/:lessonId/exercice', renderConvExercise);

  // Phase 4 — Révision SRS
  route('/revision', renderReviewDashboard);
  route('/revision/session', renderReviewSession);

  // Phase 5 — Alphabet, Racines, Profil
  route('/alphabet', renderAlphabet);
  route('/racines', renderRoots);
  route('/profil', renderProfil);

  startRouter();
  feather.replace();
}

document.addEventListener('DOMContentLoaded', init);

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
