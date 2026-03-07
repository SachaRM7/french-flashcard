// js/pages/conv-home.js — Accueil conversations

import { store } from '../store.js';
import { navigate } from '../router.js';
import { renderHeader } from '../components/header.js';
import { escapeHtml } from '../utils.js';

const $app = () => document.getElementById('app');

const LEVEL_COLORS = {
  A1: { bg: '#e8f5e9', text: '#2e7d32' },
  A2: { bg: '#e3f2fd', text: '#1565c0' },
  B1: { bg: '#f3e5f5', text: '#6a1b9a' },
  B2: { bg: '#fff3e0', text: '#e65100' },
  C1: { bg: '#fce4ec', text: '#c2185b' },
};

let _state = { lessons: [], filter: null, filterType: null };

export async function renderConvHome() {
  let lessons = store.get('lessons');
  if (!lessons) {
    const data = await fetch('data/lessons/index.json').then(r => r.json());
    lessons = data.lessons;
    store.set('lessons', lessons);
  }
  _state.lessons = lessons;
  _state.filter = null;
  _state.filterType = null;
  _render();
}

function _render() {
  const { lessons, filter, filterType } = _state;

  const popular = [...lessons].sort((a, b) => (b.playCount || 0) - (a.playCount || 0))[0];

  // Count by level
  const levelCounts = {};
  lessons.forEach(l => { levelCounts[l.level] = (levelCounts[l.level] || 0) + 1; });

  // Group by series
  const seriesMap = {};
  lessons.forEach(l => {
    if (!seriesMap[l.seriesId]) seriesMap[l.seriesId] = { id: l.seriesId, name: l.seriesName, count: 0 };
    seriesMap[l.seriesId].count++;
  });
  const series = Object.values(seriesMap);

  // Filter lessons
  let filtered = lessons;
  if (filter) {
    if (filterType === 'level') filtered = lessons.filter(l => l.level === filter);
    if (filterType === 'series') filtered = lessons.filter(l => l.seriesId === filter);
  }

  $app().innerHTML = `
    ${renderHeader({ title: 'Conversations', back: '/home' })}
    <main class="page-content">

      ${popular ? `
      <section class="conv-section">
        <div class="conv-section__title">Populaire</div>
        <div class="conv-popular-card" data-lesson-id="${escapeHtml(popular.id)}">
          <div class="conv-popular-card__badge">
            <span style="background:${LEVEL_COLORS[popular.level]?.bg};color:${LEVEL_COLORS[popular.level]?.text};padding:3px 10px;border-radius:10px;font-size:0.75rem;font-weight:700">${escapeHtml(popular.level)}</span>
          </div>
          <div class="conv-popular-card__title">${escapeHtml(popular.seriesName)} | ${popular.number} : ${escapeHtml(popular.titleFr)}</div>
          <div class="conv-popular-card__desc">${escapeHtml(popular.descriptionFr)}</div>
          <div class="conv-popular-card__meta">${(popular.playCount || 0).toLocaleString('fr-FR')} lectures &middot; ${escapeHtml(popular.duration)}</div>
        </div>
      </section>
      ` : ''}

      <section class="conv-section">
        <div class="conv-section__title">Par niveau</div>
        <div class="conv-filter-grid">
          ${Object.entries(LEVEL_COLORS).map(([lvl, col]) => `
            <button class="conv-filter-btn ${filterType === 'level' && filter === lvl ? 'is-active' : ''}"
              style="--filter-bg:${col.bg};--filter-text:${col.text}"
              data-filter="${escapeHtml(lvl)}" data-filter-type="level">
              <span class="conv-filter-btn__level">${escapeHtml(lvl)}</span>
              <span class="conv-filter-btn__count">${levelCounts[lvl] || 0} leçon${(levelCounts[lvl] || 0) !== 1 ? 's' : ''}</span>
            </button>
          `).join('')}
        </div>
      </section>

      <section class="conv-section">
        <div class="conv-section__title">Par thème</div>
        <div class="conv-filter-grid">
          ${series.map(s => `
            <button class="conv-filter-btn conv-filter-btn--series ${filterType === 'series' && filter === s.id ? 'is-active' : ''}"
              data-filter="${escapeHtml(s.id)}" data-filter-type="series">
              <span class="conv-filter-btn__level">${escapeHtml(s.name)}</span>
              <span class="conv-filter-btn__count">${s.count} leçon${s.count !== 1 ? 's' : ''}</span>
            </button>
          `).join('')}
        </div>
      </section>

      <section class="conv-section">
        <div class="conv-section__title">
          ${filter ? `${filterType === 'level' ? 'Niveau ' + filter : filter} ` : 'Toutes les leçons '}
          <span style="color:var(--text-tertiary);font-weight:400">(${filtered.length})</span>
          ${filter ? `<button class="conv-clear-filter" id="btn-clear-filter">Tout afficher</button>` : ''}
        </div>
        <div class="conv-lesson-list">
          ${filtered.map(l => `
            <div class="conv-lesson-card" data-lesson-id="${escapeHtml(l.id)}">
              <div class="conv-lesson-card__body">
                <div class="conv-lesson-card__meta">
                  <span class="conv-lesson-card__badge" style="background:${LEVEL_COLORS[l.level]?.bg};color:${LEVEL_COLORS[l.level]?.text}">${escapeHtml(l.level)}</span>
                  <span class="conv-lesson-card__duration">${escapeHtml(l.duration)}</span>
                </div>
                <div class="conv-lesson-card__title">${escapeHtml(l.seriesName)} | ${l.number} : ${escapeHtml(l.titleFr)}</div>
                <div class="conv-lesson-card__desc">${escapeHtml(l.descriptionFr)}</div>
              </div>
              <div class="conv-lesson-card__arrow"><i data-feather="chevron-right"></i></div>
            </div>
          `).join('')}
        </div>
      </section>

    </main>
  `;

  // Bind events
  $app().querySelectorAll('[data-lesson-id]').forEach(el => {
    el.addEventListener('click', () => navigate(`/conversations/lecon/${el.dataset.lessonId}`));
  });

  $app().querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      const ft = btn.dataset.filterType;
      if (_state.filter === f && _state.filterType === ft) {
        _state.filter = null; _state.filterType = null;
      } else {
        _state.filter = f; _state.filterType = ft;
      }
      _render();
    });
  });

  document.getElementById('btn-clear-filter')?.addEventListener('click', () => {
    _state.filter = null; _state.filterType = null;
    _render();
  });

  feather.replace();
}
