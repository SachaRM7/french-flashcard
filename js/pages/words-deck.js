// js/pages/words-deck.js — Vue deck avec stats et choix du mode

import { store } from '../store.js';
import { navigate } from '../router.js';
import { renderHeader } from '../components/header.js';
import { escapeHtml } from '../utils.js';
import { db } from '../db.js';

const $app = () => document.getElementById('app');

const MODES = [
  { id: 'flash',  icon: '🔄', name: 'Flashcards', desc: 'Swipe pour mémoriser' },
  { id: 'learn',  icon: '📖', name: 'Apprendre',  desc: 'QCM et réponses écrites' },
  { id: 'test',   icon: '📝', name: 'Examen',     desc: 'Teste tes connaissances' },
  { id: 'match',  icon: '🔗', name: 'Associer',   desc: 'Trouve les paires' },
  { id: 'listen', icon: '🎧', name: 'Écoute',     desc: 'Devine en écoutant' },
  { id: 'image',  icon: '🖼️', name: 'Image',      desc: 'Devine avec les images' },
];

export async function renderWordsDeck(params) {
  const { themeId, deckId } = params;
  const decks = store.get('decks') || [];
  const deck = decks.find(d => d.id === deckId);
  if (!deck) { navigate(`/mots/${themeId}`); return; }
  store.set('currentDeck', deck);

  const course = store.get('currentCourse');
  const srsEntries = await db.getSRS(course.id);
  const deckSRS = srsEntries.filter(e => e.cardId.startsWith(deckId + ':'));

  const total = deck.cards.length;
  const acquired = deckSRS.filter(e => e.box >= 4).length;
  const learning = deckSRS.filter(e => e.box >= 1 && e.box <= 3).length;

  $app().innerHTML = `
    ${renderHeader({ title: escapeHtml(deck.name), back: `/mots/${themeId}` })}
    <main class="page-content">
      <div class="deck-stats">
        <div class="deck-stats__item">
          <div class="deck-stats__value deck-stats__value--blue">${total}</div>
          <div class="deck-stats__label">Total</div>
        </div>
        <div class="deck-stats__item">
          <div class="deck-stats__value deck-stats__value--green">${acquired}</div>
          <div class="deck-stats__label">Acquis</div>
        </div>
        <div class="deck-stats__item">
          <div class="deck-stats__value deck-stats__value--orange">${learning}</div>
          <div class="deck-stats__label">En cours</div>
        </div>
      </div>
      <div class="mode-list">
        ${MODES.map(m => `
          <button class="mode-btn" data-mode="${escapeHtml(m.id)}">
            <div class="mode-btn__icon">${m.icon}</div>
            <div>
              <div class="mode-btn__name">${escapeHtml(m.name)}</div>
              <div class="mode-btn__desc">${escapeHtml(m.desc)}</div>
            </div>
          </button>
        `).join('')}
      </div>
    </main>
  `;

  $app().querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      navigate(`/mots/${themeId}/${deckId}/${btn.dataset.mode}`);
    });
  });
  feather.replace();
}
