// js/pages/words-home.js — Thèmes et liste de decks

import { store } from '../store.js';
import { navigate } from '../router.js';
import { renderHeader } from '../components/header.js';
import { escapeHtml } from '../utils.js';
import { db } from '../db.js';

const $app = () => document.getElementById('app');

async function loadDecks() {
  if (store.get('decks')) return;
  const course = store.get('currentCourse');
  if (!course) return;
  const data = await fetch(course.decksFile).then(r => r.json());
  store.set('decks', data.decks);
}

export async function renderWordsHome() {
  await loadDecks();
  const course = store.get('currentCourse');
  const themes = store.get('themes') || [];
  const decks = store.get('decks') || [];

  const themeItems = themes.map(theme => {
    const themeDecks = decks.filter(d => theme.decks.includes(d.id));
    const totalCards = themeDecks.reduce((n, d) => n + d.cards.length, 0);
    return { theme, deckCount: themeDecks.length, totalCards };
  });

  $app().innerHTML = `
    ${renderHeader({ title: `${course?.flag ?? ''} Vocabulaire`, back: '/home' })}
    <main class="page-content">
      <div class="themes-grid">
        ${themeItems.map(({ theme, deckCount, totalCards }) => `
          <div class="theme-card" data-theme-id="${escapeHtml(theme.id)}"
               style="--theme-color: ${escapeHtml(theme.color)}">
            <div class="theme-card__icon">${theme.icon}</div>
            <div class="theme-card__name">${escapeHtml(theme.name)}</div>
            <div class="theme-card__name-ar">${escapeHtml(theme.nameAr)}</div>
            <div class="theme-card__count">${deckCount} decks · ${totalCards} cartes</div>
          </div>
        `).join('')}
      </div>
    </main>
  `;

  $app().querySelectorAll('.theme-card').forEach(el => {
    el.addEventListener('click', () => navigate(`/mots/${el.dataset.themeId}`));
  });
  feather.replace();
}

export async function renderWordsTheme(params) {
  await loadDecks();
  const { themeId } = params;
  const themes = store.get('themes') || [];
  const decks = store.get('decks') || [];
  const theme = themes.find(t => t.id === themeId);
  if (!theme) { navigate('/mots'); return; }

  const themeDecks = decks.filter(d => theme.decks.includes(d.id));

  $app().innerHTML = `
    ${renderHeader({ title: `${theme.icon} ${theme.name}`, back: '/mots' })}
    <main class="page-content">
      <div class="deck-grid">
        ${themeDecks.map(deck => `
          <div class="deck-card" data-deck-id="${escapeHtml(deck.id)}">
            <div>
              <div class="deck-card__name">${escapeHtml(deck.name)}</div>
              <div class="deck-card__meta">${deck.cards.length} cartes · 0 acquises</div>
            </div>
            <div class="deck-card__arrow"><i data-feather="chevron-right"></i></div>
          </div>
        `).join('')}
      </div>
    </main>
  `;

  $app().querySelectorAll('.deck-card').forEach(el => {
    el.addEventListener('click', () => navigate(`/mots/${themeId}/${el.dataset.deckId}`));
  });
  feather.replace();
}
