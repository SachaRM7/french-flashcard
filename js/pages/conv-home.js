// js/pages/conv-home.js — Accueil conversations

import { store } from '../store.js';
import { navigate } from '../router.js';
import { renderHeader } from '../components/header.js';
import { renderBottomNav } from '../components/bottom-nav.js';
import { escapeHtml } from '../utils.js';

const $app = () => document.getElementById('app');

const LEVEL_COLORS = {
  A1: { bg: '#e8f5e9', text: '#2e7d32' },
  A2: { bg: '#e3f2fd', text: '#1565c0' },
  B1: { bg: '#f3e5f5', text: '#6a1b9a' },
  B2: { bg: '#fff3e0', text: '#e65100' },
  C1: { bg: '#fce4ec', text: '#c2185b' },
};

// Couleurs des cartes niveau (dark-mode compatible)
const LEVEL_CARD_STYLES = {
  A1: { bg: 'rgba(63,185,80,0.13)',   color: '#3fb950', border: 'rgba(63,185,80,0.25)'   },
  A2: { bg: 'rgba(88,166,255,0.13)',  color: '#58a6ff', border: 'rgba(88,166,255,0.25)'  },
  B1: { bg: 'rgba(163,113,247,0.13)', color: '#a371f7', border: 'rgba(163,113,247,0.25)' },
  B2: { bg: 'rgba(210,153,34,0.13)',  color: '#d29922', border: 'rgba(210,153,34,0.25)'  },
  C1: { bg: 'rgba(248,81,73,0.13)',   color: '#f85149', border: 'rgba(248,81,73,0.25)'   },
};

// Gradients pour les cartes séries (image-style)
const SERIES_GRADIENTS = [
  'linear-gradient(135deg, #1565c0 0%, #00897b 100%)',
  'linear-gradient(135deg, #7b1fa2 0%, #c2185b 100%)',
  'linear-gradient(135deg, #e64a19 0%, #ffa000 100%)',
  'linear-gradient(135deg, #2e7d32 0%, #0097a7 100%)',
  'linear-gradient(135deg, #283593 0%, #1976d2 100%)',
  'linear-gradient(135deg, #4e342e 0%, #d84315 100%)',
  'linear-gradient(135deg, #00695c 0%, #1565c0 100%)',
  'linear-gradient(135deg, #6a1b9a 0%, #1976d2 100%)',
];

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

  const popularSeriesIdx = popular ? series.findIndex(s => s.id === popular.seriesId) : 0;
  const popularGradient = SERIES_GRADIENTS[(popularSeriesIdx >= 0 ? popularSeriesIdx : 0) % SERIES_GRADIENTS.length];

  $app().innerHTML = `
    ${renderHeader({ title: 'Conversations', back: '/home' })}
    <main class="page-content page-content--nav">

      ${popular ? `
      <section class="conv-section">
        <div class="conv-section__title">Populaire</div>
        <div class="conv-popular-card" data-lesson-id="${escapeHtml(popular.id)}">
          <div class="conv-popular-card__thumb" style="background:${popularGradient}">
            <span class="conv-popular-card__play-icon">▶</span>
          </div>
          <div class="conv-popular-card__info">
            <div class="conv-popular-card__meta">
              <span class="conv-lesson-card__badge" style="background:${LEVEL_COLORS[popular.level]?.bg};color:${LEVEL_COLORS[popular.level]?.text}">${escapeHtml(popular.level)}</span>
              <span class="conv-popular-card__duration">${escapeHtml(popular.duration)}</span>
            </div>
            <div class="conv-popular-card__title">${escapeHtml(popular.seriesName)} | ${popular.number} : ${escapeHtml(popular.titleFr)}</div>
            <div class="conv-popular-card__desc">${escapeHtml(popular.descriptionFr)}</div>
            <div class="conv-popular-card__plays">▷ ${(popular.playCount || 0).toLocaleString('fr-FR')}</div>
          </div>
        </div>
      </section>
      ` : ''}

      <section class="conv-section">
        <div class="conv-section__title">Par niveau</div>
        <div class="conv-level-grid">
          ${Object.entries(LEVEL_CARD_STYLES).map(([lvl, s]) => `
            <div class="conv-level-card ${filterType === 'level' && filter === lvl ? 'is-active' : ''}"
              style="--level-bg:${s.bg};--level-color:${s.color};--level-border:${s.border}"
              data-filter="${escapeHtml(lvl)}" data-filter-type="level">
              <div class="conv-level-card__name">${escapeHtml(lvl)}</div>
              <div class="conv-level-card__count">${levelCounts[lvl] || 0} leçon${(levelCounts[lvl] || 0) !== 1 ? 's' : ''}</div>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="conv-section">
        <div class="conv-section__title">
          Par thème
          <span class="conv-section__subtitle"> — ${series.length} séries, ${lessons.length} leçons</span>
        </div>
        <div class="conv-series-grid">
          ${series.map((s, i) => `
            <div class="conv-series-card ${filterType === 'series' && filter === s.id ? 'is-active' : ''}"
              data-filter="${escapeHtml(s.id)}" data-filter-type="series">
              <div class="conv-series-card__image" style="background:${SERIES_GRADIENTS[i % SERIES_GRADIENTS.length]}">
                <div class="conv-series-card__count">${s.count} leçons</div>
              </div>
              <div class="conv-series-card__name">${escapeHtml(s.name)}</div>
            </div>
          `).join('')}
        </div>
      </section>

      ${filter ? `
      <section class="conv-section">
        <div class="conv-section__title">
          ${filterType === 'level' ? 'Niveau ' + filter : filter}
          <span style="color:var(--text-tertiary);font-weight:400;font-size:var(--text-base)"> (${filtered.length})</span>
          <button class="conv-clear-filter" id="btn-clear-filter">Tout afficher</button>
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
      ` : ''}

    </main>
    ${renderBottomNav('conversations')}
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
