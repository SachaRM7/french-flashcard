// js/pages/words-flashcards.js — Mode flashcard avec swipe

import { store } from '../store.js';
import { navigate } from '../router.js';
import { renderHeader } from '../components/header.js';
import { shuffle, escapeHtml } from '../utils.js';
import { db } from '../db.js';
import { createSRSEntry, processAnswer } from '../srs.js';
import { playWord } from '../audio.js';
import { renderOptionsModal, showModal, bindModalEvents } from '../components/modal.js';

const $app = () => document.getElementById('app');
let _state = {};

export async function renderWordsFlashcards(params) {
  const { themeId, deckId } = params;
  const deck = (store.get('decks') || []).find(d => d.id === deckId);
  if (!deck) { navigate(`/mots/${themeId}/${deckId}`); return; }

  const course = store.get('currentCourse');
  const favData = await db.getFavorites(course.id);
  const srsAll = await db.getSRS(course.id);
  const srsMap = Object.fromEntries(srsAll.map(e => [e.cardId, e]));

  _state = {
    themeId, deckId, deck, course,
    options: { shuffle: false, frontSide: 'front', favoritesOnly: false },
    favorites: new Set(favData.words),
    srsMap,
    cards: [], index: 0, known: 0, unknown: 0,
  };

  _initCards();
  _render();
}

function _initCards() {
  let cards = [..._state.deck.cards];
  if (_state.options.favoritesOnly) cards = cards.filter(c => _state.favorites.has(c.id));
  if (_state.options.shuffle) cards = shuffle(cards);
  _state.cards = cards;
  _state.index = 0;
  _state.known = 0;
  _state.unknown = 0;
}

function _cardText(card, side) {
  const front = _state.options.frontSide === 'front';
  if (side === 'front') return front ? card.front : card.back;
  return front ? card.back : card.front;
}

function _isAr(side) {
  const course = _state.course;
  const front = _state.options.frontSide === 'front';
  return side === 'front' ? (front ? course.config.frontDir === 'rtl' : course.config.backDir === 'rtl')
    : (front ? course.config.backDir === 'rtl' : course.config.frontDir === 'rtl');
}

function _render() {
  const { cards, index, known, unknown, deck } = _state;
  if (index >= cards.length) { _renderCompletion(); return; }
  const card = cards[index];
  const isFav = _state.favorites.has(card.id);
  const total = cards.length;
  const progress = total > 0 ? (index / total) * 100 : 0;

  $app().innerHTML = `
    ${renderHeader({ title: escapeHtml(deck.name), back: `/mots/${_state.themeId}/${_state.deckId}`,
      actions: [{ id: 'options', icon: 'settings', label: 'Options' }] })}
    <div class="flash-container">
      <div class="flash-progress">
        <span style="color:var(--accent-orange);font-weight:600">${unknown}</span>
        <div class="flash-progress__bar"><div class="flash-progress__fill" style="width:${progress}%"></div></div>
        <span style="color:var(--accent-green);font-weight:600">${known}</span>
      </div>
      <div class="swipe-area">
        <div class="swipe-card" id="swipe-card">
          <div class="card-inner" id="card-inner">
            <div class="card-face card-face--front">
              ${card.emoji ? `<div class="card-face__emoji">${card.emoji}</div>` : ''}
              <div class="card-face__text ${_isAr('front') ? 'card-face__text--ar' : ''}">${escapeHtml(_cardText(card, 'front'))}</div>
              ${_isAr('front') && card.translit ? `<div class="card-face__translit">${escapeHtml(card.translit)}</div>` : ''}
              <div class="card-face__hint">Tape pour retourner</div>
            </div>
            <div class="card-face card-face--back">
              <div class="card-face__text ${_isAr('back') ? 'card-face__text--ar' : ''}">${escapeHtml(_cardText(card, 'back'))}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="flash-actions">
        <button class="icon-btn ${isFav ? 'is-active' : ''}" id="btn-fav" aria-label="Favori"><i data-feather="star"></i></button>
        <button class="icon-btn" id="btn-audio" aria-label="Audio"><i data-feather="volume-2"></i></button>
      </div>
      <div class="flash-controls">
        <button class="flash-ctrl-btn flash-ctrl-btn--unknown" id="btn-unknown" aria-label="À revoir">✗</button>
        <button class="flash-ctrl-btn flash-ctrl-btn--flip" id="btn-flip" aria-label="Retourner"><i data-feather="refresh-cw"></i></button>
        <button class="flash-ctrl-btn flash-ctrl-btn--known" id="btn-known" aria-label="Connu">✓</button>
      </div>
    </div>
  `;

  feather.replace();
  _bindSwipe();
  _bindButtons();
}

function _bindButtons() {
  document.getElementById('btn-flip')?.addEventListener('click', _flip);
  document.getElementById('btn-known')?.addEventListener('click', () => _swipeCard(true));
  document.getElementById('btn-unknown')?.addEventListener('click', () => _swipeCard(false));
  document.getElementById('btn-audio')?.addEventListener('click', _playAudio);
  document.getElementById('btn-fav')?.addEventListener('click', _toggleFav);
  document.querySelector('[data-action="options"]')?.addEventListener('click', _openOptions);
}

function _flip() {
  document.getElementById('card-inner')?.classList.toggle('is-flipped');
}

async function _playAudio() {
  const card = _state.cards[_state.index];
  const lang = _state.options.frontSide === 'front' ? _state.course.config.frontLang : _state.course.config.backLang;
  await playWord(_cardText(card, 'front'), lang);
}

async function _toggleFav() {
  const card = _state.cards[_state.index];
  const courseId = _state.course.id;
  if (_state.favorites.has(card.id)) _state.favorites.delete(card.id);
  else _state.favorites.add(card.id);
  const favData = await db.getFavorites(courseId);
  favData.words = [..._state.favorites];
  await db.saveFavorites(courseId, favData);
  document.getElementById('btn-fav')?.classList.toggle('is-active', _state.favorites.has(card.id));
}

async function _swipeCard(isKnown) {
  const card = _state.cards[_state.index];
  const courseId = _state.course.id;
  const swipeEl = document.getElementById('swipe-card');
  if (!swipeEl) return;

  swipeEl.classList.add(isKnown ? 'fly-right' : 'fly-left');
  if (isKnown) _state.known++; else _state.unknown++;

  const existing = _state.srsMap[card.id] || createSRSEntry(courseId, card.id);
  const updated = processAnswer(existing, isKnown);
  _state.srsMap[card.id] = updated;
  await db.updateSRS(courseId, card.id, updated);

  setTimeout(() => { _state.index++; _render(); }, 300);
}

let _drag = { active: false, startX: 0, startY: 0 };

function _bindSwipe() {
  const card = document.getElementById('swipe-card');
  if (!card) return;

  const onStart = (x, y) => { _drag = { active: true, startX: x, startY: y }; };
  const onMove = (x) => {
    if (!_drag.active) return;
    const dx = x - _drag.startX;
    const inner = document.getElementById('card-inner');
    if (inner) {
      inner.style.transform = inner.classList.contains('is-flipped')
        ? `rotateY(180deg) translateX(${-dx}px) rotate(${-dx * 0.05}deg)`
        : `translateX(${dx}px) rotate(${dx * 0.05}deg)`;
    }
    const face = card.querySelector('.card-face--front');
    if (face) {
      face.classList.toggle('swipe-overlay-known', dx > 40);
      face.classList.toggle('swipe-overlay-unknown', dx < -40);
    }
  };
  const onEnd = (x) => {
    if (!_drag.active) return;
    _drag.active = false;
    const dx = x - _drag.startX;
    const inner = document.getElementById('card-inner');
    if (inner) inner.style.transform = '';
    const face = card.querySelector('.card-face--front');
    if (face) { face.classList.remove('swipe-overlay-known', 'swipe-overlay-unknown'); }
    if (Math.abs(dx) > 80) _swipeCard(dx > 0);
  };

  card.addEventListener('mousedown', e => onStart(e.clientX, e.clientY));
  window.addEventListener('mousemove', e => { if (_drag.active) onMove(e.clientX); });
  window.addEventListener('mouseup', e => onEnd(e.clientX));
  card.addEventListener('touchstart', e => onStart(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  window.addEventListener('touchmove', e => { if (_drag.active) onMove(e.touches[0].clientX); }, { passive: true });
  window.addEventListener('touchend', e => onEnd(e.changedTouches[0].clientX), { passive: true });
  card.addEventListener('click', e => { if (Math.abs(e.clientX - _drag.startX) < 10) _flip(); });
}

function _openOptions() {
  const course = _state.course;
  showModal(renderOptionsModal({ currentOptions: _state.options, courseConfig: course.config, showWrittenToggle: false }));
  bindModalEvents(({ key, value }) => {
    _state.options[key] = value;
    hideModal(); _initCards(); _render();
  });
}

function _renderCompletion() {
  const { known, unknown, themeId, deckId } = _state;
  $app().innerHTML = `
    ${renderHeader({ title: 'Terminé !', back: `/mots/${themeId}/${deckId}` })}
    <div class="completion">
      <div class="completion__icon">🎉</div>
      <div class="completion__title">Deck terminé</div>
      <div class="completion__stats">
        <div class="completion__stat-item">
          <div class="completion__stat-value" style="color:var(--accent-green)">${known}</div>
          <div class="completion__stat-label">Connus</div>
        </div>
        <div class="completion__stat-item">
          <div class="completion__stat-value" style="color:var(--accent-orange)">${unknown}</div>
          <div class="completion__stat-label">À revoir</div>
        </div>
      </div>
      <div class="completion__actions">
        <button class="primary-btn" id="btn-restart">Recommencer</button>
        <button class="secondary-btn" data-navigate="/mots/${themeId}/${deckId}">Retour au deck</button>
      </div>
    </div>
  `;
  document.getElementById('btn-restart')?.addEventListener('click', () => { _initCards(); _render(); });
  feather.replace();
}

function hideModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.remove();
}
