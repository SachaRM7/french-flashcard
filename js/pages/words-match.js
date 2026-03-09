// js/pages/words-match.js — Mode association (match)

import { store } from '../store.js';
import { navigate } from '../router.js';
import { renderHeader } from '../components/header.js';
import { shuffle, escapeHtml } from '../utils.js';
import { showConfirmModal } from '../components/modal.js';

const $app = () => document.getElementById('app');
let _state = {};

export function renderWordsMatch(params) {
  const { themeId, deckId, lessonId } = params;
  const actualDeckId = lessonId ? `lesson-vocab-${lessonId}` : deckId;
  const backPath = lessonId ? `/mots/lecons/${lessonId}` : `/mots/${themeId}/${deckId}`;

  const deck = (store.get('decks') || []).find(d => d.id === actualDeckId);
  if (!deck) { navigate(backPath); return; }
  const storedPrefs = store.get('preferences') || {};
  _state = {
    themeId, deckId: actualDeckId, lessonId, backPath, deck,
    prefs: { showHarakats: storedPrefs.showHarakats !== false },
  };
  _renderIntro();
}

function _renderIntro() {
  const { backPath } = _state;
  $app().innerHTML = `
    ${renderHeader({ title: 'Associer', back: backPath })}
    <div class="completion">
      <div class="completion__icon">&#x1F517;</div>
      <div class="completion__title">Pret a jouer ?</div>
      <p style="color:var(--text-secondary);text-align:center">
        Associe chaque mot arabe a sa traduction francaise.
      </p>
      <div class="completion__actions">
        <button class="primary-btn" id="btn-start">Commencer</button>
        <button class="secondary-btn" data-navigate="${backPath}">Retour</button>
      </div>
    </div>
  `;
  document.getElementById('btn-start')?.addEventListener('click', _startGame);
  feather.replace();
}

function _startGame() {
  if (_state.timerInterval) clearInterval(_state.timerInterval);
  const cards = shuffle([..._state.deck.cards]).slice(0, 8);
  const showHarakats = _state.prefs.showHarakats;
  const cells = shuffle([
    ...cards.map(c => ({ id: c.id, text: (!showHarakats && c.frontPlain) ? c.frontPlain : c.front, type: 'front', pairId: c.id, isAr: true })),
    ...cards.map(c => ({ id: c.id + '_b', text: c.back, type: 'back', pairId: c.id, isAr: false })),
  ]);

  _state.cells = cells;
  _state.selected = null;
  _state.matched = new Set();
  _state.startTime = Date.now();
  _state.timerInterval = setInterval(_updateTimer, 1000);

  _renderGrid();
}

function _renderGrid() {
  const { cells, matched, backPath } = _state;
  $app().innerHTML = `
    ${renderHeader({ title: 'Associer', back: backPath,
      actions: [{ id: 'reset', icon: 'refresh-cw', label: 'Recommencer' }] })}
    <main class="page-content">
      <div class="match-container">
        <div class="match-timer" id="match-timer">0:00</div>
        <div class="match-grid">
          ${cells.map((cell, i) => `
            <div class="match-cell ${cell.isAr ? 'match-cell--ar' : ''} ${matched.has(cell.id) ? 'is-matched' : ''}"
                 data-index="${i}">
              ${escapeHtml(cell.text)}
            </div>
          `).join('')}
        </div>
      </div>
    </main>
  `;

  document.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
    showConfirmModal(
      'Recommencer la session ?',
      'Ta progression actuelle sera perdue.',
      () => { clearInterval(_state.timerInterval); _startGame(); }
    );
  });

  $app().querySelectorAll('.match-cell:not(.is-matched)').forEach(el => {
    el.addEventListener('click', () => _onCellClick(parseInt(el.dataset.index)));
  });
}

function _updateTimer() {
  const el = document.getElementById('match-timer');
  if (!el) return;
  const secs = Math.floor((Date.now() - _state.startTime) / 1000);
  el.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

function _onCellClick(index) {
  const cell = _state.cells[index];
  if (_state.matched.has(cell.id)) return;

  const el = $app().querySelectorAll('.match-cell')[index];

  if (!_state.selected) {
    _state.selected = { index, cell };
    el.classList.add('is-selected');
    return;
  }

  const prev = _state.selected;
  _state.selected = null;
  $app().querySelectorAll('.match-cell').forEach(e => e.classList.remove('is-selected'));

  if (prev.index === index) return;

  if (prev.cell.pairId === cell.pairId && prev.cell.type !== cell.type) {
    _state.matched.add(prev.cell.id);
    _state.matched.add(cell.id);
    const prevEl = $app().querySelectorAll('.match-cell')[prev.index];
    if (prevEl) prevEl.classList.add('is-matched');
    if (el) el.classList.add('is-matched');

    if (_state.matched.size === _state.cells.length) {
      clearInterval(_state.timerInterval);
      const secs = Math.floor((Date.now() - _state.startTime) / 1000);
      setTimeout(() => _renderCompletion(secs), 400);
    }
  } else {
    const prevEl = $app().querySelectorAll('.match-cell')[prev.index];
    if (prevEl) prevEl.classList.add('is-wrong');
    if (el) el.classList.add('is-wrong');
    setTimeout(() => {
      $app().querySelectorAll('.match-cell').forEach(e => e.classList.remove('is-wrong'));
    }, 500);
  }
}

function _renderCompletion(secs) {
  const { backPath } = _state;
  const time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  $app().innerHTML = `
    ${renderHeader({ title: 'Termine !', back: backPath })}
    <div class="completion">
      <div class="completion__icon">&#x1F3C6;</div>
      <div class="completion__title">Bravo !</div>
      <p style="color:var(--text-secondary)">Temps : ${time}</p>
      <div class="completion__actions">
        <button class="primary-btn" id="btn-restart">Rejouer</button>
        <button class="secondary-btn" data-navigate="${backPath}">Retour</button>
      </div>
    </div>
  `;
  document.getElementById('btn-restart')?.addEventListener('click', _startGame);
  feather.replace();
}
