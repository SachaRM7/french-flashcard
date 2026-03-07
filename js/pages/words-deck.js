// js/pages/words-deck.js — Vue deck avec stats et choix du mode

import { store } from '../store.js';
import { navigate } from '../router.js';
import { renderHeader } from '../components/header.js';
import { renderBottomNav } from '../components/bottom-nav.js';
import { escapeHtml } from '../utils.js';
import { db } from '../db.js';

const $app = () => document.getElementById('app');

const MODES = [
  { id: 'flash',  icon: '🔄', name: 'Flashcards', desc: 'Swipe pour memoriser' },
  { id: 'learn',  icon: '📖', name: 'Apprendre',  desc: 'QCM et reponses ecrites' },
  { id: 'test',   icon: '📝', name: 'Examen',     desc: 'Teste tes connaissances' },
  { id: 'match',  icon: '🔗', name: 'Associer',   desc: 'Trouve les paires' },
  { id: 'listen', icon: '🎧', name: 'Ecoute',     desc: 'Devine en ecoutant' },
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
    <main class="page-content page-content--nav">
      ${_renderDeckContent(total, acquired, learning, MODES, (modeId) => `/mots/${themeId}/${deckId}/${modeId}`)}
    </main>
    ${renderBottomNav('mots')}
  `;

  _bindModeButtons((modeId) => navigate(`/mots/${themeId}/${deckId}/${modeId}`));
  feather.replace();
}

export async function renderWordsDeckLesson(params) {
  const { lessonId } = params;
  const course = store.get('currentCourse');

  // Chercher le deck dans IndexedDB
  const lessonDecks = await db.getLessonDecks(course.id);
  const entry = lessonDecks.find(e => e.lessonId === lessonId);

  let deck;
  if (entry) {
    deck = entry.deck;
  } else {
    // Tenter de construire le deck depuis les donnees de la lecon
    try {
      const lesson = await fetch(`data/lessons/${lessonId}.json`).then(r => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      });
      deck = _buildLessonDeck(lessonId, lesson);
    } catch {
      navigate('/conversations');
      return;
    }
  }

  // Enregistrer dans le store pour que les pages de mode y aient acces
  const decks = store.get('decks') || [];
  const existingIdx = decks.findIndex(d => d.id === deck.id);
  if (existingIdx >= 0) decks[existingIdx] = deck; else decks.push(deck);
  store.set('decks', decks);
  store.set('currentDeck', deck);

  const srsEntries = await db.getSRS(course.id);
  const deckSRS = srsEntries.filter(e => e.cardId.startsWith(deck.id + ':'));

  const total = deck.cards.length;
  const acquired = deckSRS.filter(e => e.box >= 4).length;
  const learning = deckSRS.filter(e => e.box >= 1 && e.box <= 3).length;

  $app().innerHTML = `
    ${renderHeader({ title: escapeHtml(deck.name), back: `/conversations/lecon/${lessonId}` })}
    <main class="page-content page-content--nav">
      ${_renderDeckContent(total, acquired, learning, MODES, (modeId) => `/mots/lecons/${lessonId}/${modeId}`)}
    </main>
    ${renderBottomNav('mots')}
  `;

  _bindModeButtons((modeId) => navigate(`/mots/lecons/${lessonId}/${modeId}`));
  feather.replace();
}

function _renderDeckContent(total, acquired, learning, modes, _routeFn) {
  return `
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
      ${modes.map(m => `
        <button class="mode-btn" data-mode="${escapeHtml(m.id)}">
          <div class="mode-btn__icon">${m.icon}</div>
          <div>
            <div class="mode-btn__name">${escapeHtml(m.name)}</div>
            <div class="mode-btn__desc">${escapeHtml(m.desc)}</div>
          </div>
        </button>
      `).join('')}
    </div>
  `;
}

function _bindModeButtons(onSelect) {
  $app().querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => onSelect(btn.dataset.mode));
  });
}

function _buildLessonDeck(lessonId, lesson) {
  return {
    id: `lesson-vocab-${lessonId}`,
    name: `Vocab — ${lesson.seriesName} ${lesson.number}`,
    nameAr: '',
    category: 'Lecons',
    source: 'lesson',
    lessonId,
    tags: lesson.tags || [],
    cards: (lesson.vocabulary || []).map((word, index) => ({
      id: `lesson-vocab-${lessonId}:${index}`,
      front: word.ar,
      frontPlain: word.arPlain,
      back: word.fr,
      en: word.en,
      translit: word.translit,
      emoji: '',
      image: null,
      audio: null,
      tags: word.tags || [],
    })),
  };
}
