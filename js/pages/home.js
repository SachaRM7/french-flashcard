// js/pages/home.js — Page d'accueil + sélection de cours

import { store } from '../store.js';
import { navigate } from '../router.js';
import { renderHeader } from '../components/header.js';
import { escapeHtml } from '../utils.js';
import { db } from '../db.js';

const $app = () => document.getElementById('app');

export function renderCourseSelect() {
  const courses = store.get('courses') || [];

  $app().innerHTML = `
    <div class="course-select">
      <div class="course-select__title">
        <h1>HelloArabic</h1>
        <p>Choisissez votre cours</p>
      </div>
      <div class="course-grid">
        ${courses.map(c => `
          <div class="course-card" data-course-id="${escapeHtml(c.id)}">
            <div class="course-card__flag">${c.flag}</div>
            <div>
              <div class="course-card__name">${escapeHtml(c.name)}</div>
              <div class="course-card__name-local">${escapeHtml(c.nameLocal)}</div>
              <div class="course-card__desc">${escapeHtml(c.description)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  bindCourseSelectEvents();
  feather.replace();
}

function bindCourseSelectEvents() {
  $app().querySelectorAll('.course-card').forEach(el => {
    el.addEventListener('click', () => {
      const courses = store.get('courses') || [];
      const course = courses.find(c => c.id === el.dataset.courseId);
      if (course) {
        store.set('currentCourse', course);
        navigate('/home');
      }
    });
  });
}

export async function renderHome() {
  const course = store.get('currentCourse');
  if (!course) { navigate('/'); return; }

  // Render quickly with 0, then update with real data
  _renderHomeUI(course, 0, null);

  const [dueEntries, stats, lessons] = await Promise.all([
    db.getDueWords(course.id),
    db.getStats(course.id),
    _getLastLesson(course.id),
  ]);

  store.set('dueCount', dueEntries.length);
  _renderHomeUI(course, dueEntries.length, lessons, stats);
}

async function _getLastLesson(courseId) {
  try {
    const lessonsIndex = store.get('lessons');
    if (!lessonsIndex) return null;
    for (const l of lessonsIndex) {
      const progress = await db.getLessonProgress(courseId, l.id);
      if (progress && progress.exercisesCompleted > 0) return { lesson: l, progress };
    }
  } catch {}
  return null;
}

function _renderHomeUI(course, dueCount, lastLesson, stats) {
  $app().innerHTML = `
    ${renderHeader({ title: `${course.flag} ${course.nameLocal}`, actions: [{ id: 'profil', icon: 'user', label: 'Profil' }] })}
    <main class="page-content">
      <div class="home-dashboard">

        <div class="home-modes">
          <div class="home-mode-card" data-navigate="/mots">
            <div class="home-mode-card__icon">📚</div>
            <div>
              <div class="home-mode-card__title">Vocabulaire</div>
              <div class="home-mode-card__desc">Flashcards, quiz, association</div>
            </div>
          </div>
          <div class="home-mode-card" data-navigate="/conversations">
            <div class="home-mode-card__icon">💬</div>
            <div>
              <div class="home-mode-card__title">Conversations</div>
              <div class="home-mode-card__desc">Dialogues et leçons audio</div>
            </div>
          </div>
          <div class="home-mode-card" data-navigate="/alphabet">
            <div class="home-mode-card__icon">ا</div>
            <div>
              <div class="home-mode-card__title">Alphabet</div>
              <div class="home-mode-card__desc">28 lettres, diacritiques, règles</div>
            </div>
          </div>
          <div class="home-mode-card" data-navigate="/racines">
            <div class="home-mode-card__icon">🌱</div>
            <div>
              <div class="home-mode-card__title">Racines</div>
              <div class="home-mode-card__desc">Familles de mots trilittères</div>
            </div>
          </div>
        </div>

        <div class="home-review-banner ${dueCount > 0 ? 'home-review-banner--due' : ''}" data-navigate="/revision">
          📝 ${dueCount > 0
            ? `<strong>${dueCount}</strong> mot${dueCount !== 1 ? 's' : ''} à réviser aujourd'hui`
            : 'Révision — tout est à jour !'
          }
          <i data-feather="chevron-right"></i>
        </div>

        ${lastLesson ? `
        <div class="home-section">
          <div class="home-section__title">Continuer</div>
          <div class="home-continue-card" data-navigate="/conversations/lecon/${escapeHtml(lastLesson.lesson.id)}">
            <div class="home-continue-card__icon">💬</div>
            <div class="home-continue-card__body">
              <div class="home-continue-card__title">${escapeHtml(lastLesson.lesson.titleFr)}</div>
              <div class="home-continue-card__meta">${lastLesson.progress.exercisesCompleted} / ${lastLesson.progress.exercisesTotal} exercices</div>
            </div>
            <i data-feather="chevron-right"></i>
          </div>
        </div>
        ` : ''}

        ${stats ? `
        <div class="home-quick-stats">
          <div class="home-quick-stat">
            <div class="home-quick-stat__value">${stats.totalWordsAcquired || 0}</div>
            <div class="home-quick-stat__label">Mots acquis</div>
          </div>
          <div class="home-quick-stat">
            <div class="home-quick-stat__value">${stats.totalLessonsCompleted || 0}</div>
            <div class="home-quick-stat__label">Leçons</div>
          </div>
          <div class="home-quick-stat">
            <div class="home-quick-stat__value">${stats.currentStreak || 0}</div>
            <div class="home-quick-stat__label">Jours</div>
          </div>
        </div>
        ` : ''}

      </div>
    </main>
  `;

  $app().querySelector('[data-action="profil"]')?.addEventListener('click', () => navigate('/profil'));
  feather.replace();
}
