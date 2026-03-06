// js/app.js — Bootstrap : init DB, charger store, démarrer router

import { db } from './db.js';
import { store } from './store.js';
import { route, startRouter } from './router.js';
import { renderHome, renderCourseSelect } from './pages/home.js';
import { renderWordsHome, renderWordsTheme } from './pages/words-home.js';
import { renderWordsDeck } from './pages/words-deck.js';
import { renderConvHome } from './pages/conv-home.js';
import { renderReviewDashboard } from './pages/review-dashboard.js';

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

  route('/', renderCourseSelect);
  route('/home', renderHome);
  route('/mots', renderWordsHome);
  route('/mots/:themeId', renderWordsTheme);
  route('/mots/:themeId/:deckId', renderWordsDeck);
  route('/conversations', renderConvHome);
  route('/revision', renderReviewDashboard);

  startRouter();
  feather.replace();
}

document.addEventListener('DOMContentLoaded', init);
