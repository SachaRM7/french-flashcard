// js/pages/words-home.js — Themes et liste de decks

import { store } from '../store.js';
import { navigate } from '../router.js';
import { renderHeader } from '../components/header.js';
import { renderBottomNav } from '../components/bottom-nav.js';
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

  // Charger les decks de lecons depuis IndexedDB
  const lessonDeckEntries = course ? await db.getLessonDecks(course.id) : [];

  $app().innerHTML = `
    ${renderHeader({ title: `${course?.flag ?? ''} Vocabulaire`, back: '/home' })}
    <main class="page-content page-content--nav">
      ${lessonDeckEntries.length > 0 ? `
        <div class="lesson-decks-section">
          <div class="lesson-decks-section__title">
            <i data-feather="message-square"></i>
            Mots des lecons
          </div>
          <div class="deck-grid">
            ${lessonDeckEntries.map(entry => `
              <div class="deck-card deck-card--lesson"
                   data-lesson-id="${escapeHtml(entry.lessonId)}"
                   role="button" tabindex="0">
                <div>
                  <div class="deck-card__name">
                    <span class="deck-card__badge">Lecon</span>
                    ${escapeHtml(entry.deck.name)}
                  </div>
                  <div class="deck-card__meta">${entry.deck.cards.length} cartes</div>
                </div>
                <div style="display:flex;align-items:center;gap:var(--space-sm)">
                  <button class="deck-card__delete"
                          data-delete-lesson-id="${escapeHtml(entry.lessonId)}"
                          aria-label="Supprimer">
                    <i data-feather="trash-2"></i>
                  </button>
                  <div class="deck-card__arrow"><i data-feather="chevron-right"></i></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      <div class="themes-grid">
        ${themeItems.map(({ theme, deckCount, totalCards }) => `
          <div class="theme-card" data-theme-id="${escapeHtml(theme.id)}"
               role="button" tabindex="0" aria-label="${escapeHtml(theme.name)}"
               style="--theme-color: ${escapeHtml(theme.color)}">
            <div class="theme-card__icon">${theme.icon}</div>
            <div class="theme-card__name">${escapeHtml(theme.name)}</div>
            <div class="theme-card__name-ar">${escapeHtml(theme.nameAr)}</div>
            <div class="theme-card__count">${deckCount} decks · ${totalCards} cartes</div>
          </div>
        `).join('')}
      </div>
    </main>
    ${renderBottomNav('mots')}
  `;

  // Lesson deck clicks
  $app().querySelectorAll('.deck-card--lesson').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.deck-card__delete')) return;
      navigate(`/mots/lecons/${el.dataset.lessonId}`);
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate(`/mots/lecons/${el.dataset.lessonId}`);
      }
    });
  });

  // Delete lesson deck
  $app().querySelectorAll('.deck-card__delete').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const lessonId = btn.dataset.deleteLessonId;
      await db.deleteLessonDeck(course.id, lessonId);
      // Supprimer du store aussi
      const updatedDecks = store.get('decks') || [];
      store.set('decks', updatedDecks.filter(d => d.id !== `lesson-vocab-${lessonId}`));
      renderWordsHome();
    });
  });

  // Theme clicks
  $app().querySelectorAll('.theme-card').forEach(el => {
    const go = () => navigate(`/mots/${el.dataset.themeId}`);
    el.addEventListener('click', go);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
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
    <main class="page-content page-content--nav">
      <div class="deck-grid">
        ${themeDecks.map(deck => `
          <div class="deck-card" data-deck-id="${escapeHtml(deck.id)}" role="button" tabindex="0" aria-label="${escapeHtml(deck.name)}">
            <div>
              <div class="deck-card__name">${escapeHtml(deck.name)}</div>
              <div class="deck-card__meta">${deck.cards.length} cartes · 0 acquises</div>
            </div>
            <div class="deck-card__arrow"><i data-feather="chevron-right"></i></div>
          </div>
        `).join('')}
      </div>
    </main>
    ${renderBottomNav('mots')}
  `;

  $app().querySelectorAll('.deck-card').forEach(el => {
    el.addEventListener('click', () => navigate(`/mots/${themeId}/${el.dataset.deckId}`));
  });
  feather.replace();
}
