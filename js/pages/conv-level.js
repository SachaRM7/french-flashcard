// js/pages/conv-level.js — Page par niveau (liste des lecons par niveau avec swipe)

import { store } from '../store.js';
import { navigate } from '../router.js';
import { renderHeader } from '../components/header.js';
import { escapeHtml } from '../utils.js';

const $app = () => document.getElementById('app');

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

const LEVEL_COLORS = {
  A1: '#3a8a3f',
  A2: '#1565c0',
  B1: '#6a1b9a',
  B2: '#e65100',
  C1: '#c2185b',
};

let _state = { lessons: [], activeIndex: 0 };

export async function renderConvLevel(params) {
  const { level } = params;

  let lessons = store.get('lessons');
  if (!lessons) {
    const data = await fetch('data/lessons/index.json').then(r => r.json());
    lessons = data.lessons;
    store.set('lessons', lessons);
  }

  const idx = LEVELS.indexOf(level);
  _state = { lessons, activeIndex: idx >= 0 ? idx : 0 };
  _render();
}

function _render() {
  const { lessons, activeIndex } = _state;
  const color = LEVEL_COLORS[LEVELS[activeIndex]];

  $app().innerHTML = `
    <div class="conv-level-page" id="conv-level-page" style="--level-bg:${color}">
      <div class="conv-level-header-area">
        ${renderHeader({ title: 'Tous les sujets', back: '/conversations' })}
        <div class="level-tabs" id="level-tabs">
          ${LEVELS.map((lvl, i) => `
            <button
              class="level-tabs__tab ${i === activeIndex ? 'level-tabs__tab--active' : ''}"
              data-index="${i}">
              ${escapeHtml(lvl)}
            </button>
          `).join('')}
        </div>
      </div>
      <div class="conv-level-card-container">
        <div class="level-swipe-container" id="level-swipe-container">
          <div class="level-swipe-track" id="level-swipe-track"
               style="transform:translateX(-${activeIndex * 20}%);transition:none">
            ${LEVELS.map(lvl => _renderPanel(lvl, lessons)).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  _bindEvents();
  feather.replace();
}

function _renderPanel(lvl, lessons) {
  const lvlLessons = lessons.filter(l => l.level === lvl);
  const color = LEVEL_COLORS[lvl];
  return `
    <div class="level-swipe-panel">
      <div class="level-panel-header">
        <span class="level-panel-header__title">Liste de lecons</span>
        <span class="level-panel-header__count">${lvlLessons.length} Lessons</span>
      </div>
      <button class="level-listen-btn" disabled>
        <i data-feather="play-circle"></i>
        Ecoutez tout (${lvlLessons.length} Lessons)
      </button>
      <div class="lesson-card-list">
        ${lvlLessons.map(lesson => `
          <div class="lesson-card" data-lesson-id="${escapeHtml(lesson.id)}">
            <div class="lesson-card__image-wrap">
              <div class="lesson-card__image"></div>
              <span class="lesson-card__level-badge"
                    style="background:${escapeHtml(color)}">${escapeHtml(lvl)}</span>
            </div>
            <div class="lesson-card__content">
              <div class="lesson-card__title">
                ${escapeHtml(lesson.seriesName)} | ${lesson.number} : ${escapeHtml(lesson.titleFr)}
              </div>
              <div class="lesson-card__desc">${escapeHtml(lesson.descriptionFr)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function _activateLevel(index) {
  if (index < 0 || index >= LEVELS.length) return;
  _state.activeIndex = index;
  const color = LEVEL_COLORS[LEVELS[index]];

  // Mettre a jour le fond coloré
  const page = document.getElementById('conv-level-page');
  if (page) page.style.setProperty('--level-bg', color);

  // Mettre a jour les tabs
  document.querySelectorAll('.level-tabs__tab').forEach((tab, i) => {
    tab.classList.toggle('level-tabs__tab--active', i === index);
  });

  // Deplacer le track
  const track = document.getElementById('level-swipe-track');
  if (track) {
    track.style.transition = 'transform 0.3s ease';
    track.style.transform = `translateX(-${index * 20}%)`;
  }
}

function _bindEvents() {
  document.querySelectorAll('.level-tabs__tab').forEach(btn => {
    btn.addEventListener('click', () => _activateLevel(parseInt(btn.dataset.index)));
  });

  $app().querySelectorAll('.lesson-card[data-lesson-id]').forEach(el => {
    el.addEventListener('click', () => navigate(`/conversations/lecon/${el.dataset.lessonId}`));
  });

  _bindSwipe();
}

function _bindSwipe() {
  const container = document.getElementById('level-swipe-container');
  const track = document.getElementById('level-swipe-track');
  if (!container || !track) return;

  let startX = 0, startY = 0, dragging = false, moved = false;

  container.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    dragging = true;
    moved = false;
    track.style.transition = 'none';
  }, { passive: true });

  container.addEventListener('touchmove', e => {
    if (!dragging) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    if (Math.abs(dx) > 10) moved = true;
    if (moved && Math.abs(dx) > 30) {
      const base = -_state.activeIndex * 20;
      track.style.transform = `translateX(calc(${base}% + ${dx}px))`;
    }
  }, { passive: true });

  container.addEventListener('touchend', e => {
    if (!dragging) return;
    dragging = false;
    const dx = e.changedTouches[0].clientX - startX;
    if (dx < -80) _activateLevel(_state.activeIndex + 1);
    else if (dx > 80) _activateLevel(_state.activeIndex - 1);
    else {
      track.style.transition = 'transform 0.3s ease';
      track.style.transform = `translateX(-${_state.activeIndex * 20}%)`;
    }
  }, { passive: true });
}
