// js/pages/home.js — Page d'accueil + sélection de cours

import { store } from '../store.js';
import { navigate } from '../router.js';
import { renderHeader } from '../components/header.js';
import { escapeHtml } from '../utils.js';

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

export function renderHome() {
  const course = store.get('currentCourse');
  const dueCount = 0;

  $app().innerHTML = `
    ${renderHeader({ title: course ? `${course.flag} ${course.nameLocal}` : 'HelloArabic' })}
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
        </div>
        <div class="home-review-banner" data-navigate="/revision">
          📝 ${dueCount} mot${dueCount !== 1 ? 's' : ''} à réviser aujourd'hui
        </div>
      </div>
    </main>
  `;

  feather.replace();
}
