// js/pages/words-learn.js — Mode apprendre (QCM / écrit)

import { store } from '../store.js';
import { navigate } from '../router.js';
import { renderHeader } from '../components/header.js';
import { shuffle, escapeHtml, checkWrittenAnswer } from '../utils.js';
import { db } from '../db.js';
import { createSRSEntry, processAnswer } from '../srs.js';
import { renderOptionsModal, showModal, bindModalEvents } from '../components/modal.js';

const $app = () => document.getElementById('app');
let _state = {};

export async function renderWordsLearn(params) {
  const { themeId, deckId } = params;
  const deck = (store.get('decks') || []).find(d => d.id === deckId);
  if (!deck) { navigate(`/mots/${themeId}/${deckId}`); return; }

  const course = store.get('currentCourse');
  const srsAll = await db.getSRS(course.id);
  const srsMap = Object.fromEntries(srsAll.map(e => [e.cardId, e]));

  _state = {
    themeId, deckId, deck, course, srsMap,
    options: { shuffle: true, frontSide: 'front', writtenMode: false, correctionLevel: 'flexible' },
    queue: [], retrySet: new Set(), correct: 0, wrong: 0, answered: false,
  };
  _buildQueue();
  _renderQuestion();
}

function _buildQueue() {
  let cards = [..._state.deck.cards];
  if (_state.options.shuffle) cards = shuffle(cards);
  _state.queue = [...cards];
  _state.retrySet.clear();
  _state.correct = 0;
  _state.wrong = 0;
}

function _currentCard() { return _state.queue[0] || null; }

function _cardFront(card) {
  return _state.options.frontSide === 'front' ? card.front : card.back;
}
function _cardBack(card) {
  return _state.options.frontSide === 'front' ? card.back : card.front;
}
function _isFrontAr() {
  const cfg = _state.course.config;
  return _state.options.frontSide === 'front' ? cfg.frontDir === 'rtl' : cfg.backDir === 'rtl';
}

function _getChoices(card) {
  const correct = _cardBack(card);
  const pool = _state.deck.cards.filter(c => c.id !== card.id).map(c => _cardBack(c));
  const distractors = shuffle(pool).slice(0, 3);
  return shuffle([correct, ...distractors]);
}

function _renderQuestion() {
  const card = _currentCard();
  if (!card) { _renderCompletion(); return; }

  const total = _state.deck.cards.length;
  const done = total - _state.queue.filter(c => !_state.retrySet.has(c.id)).length;
  const progress = total > 0 ? (done / total) * 100 : 0;
  const isRetry = _state.retrySet.has(card.id);
  const isAr = _isFrontAr();

  let answerHTML = '';
  if (_state.options.writtenMode) {
    answerHTML = `<div class="written-form">
      <input class="written-input" id="written-input" type="text" placeholder="Répondre..." autocomplete="off">
      <button class="primary-btn" id="btn-validate">Valider</button>
    </div>`;
  } else {
    const choices = _getChoices(card);
    answerHTML = `<div class="choice-grid">
      ${choices.map(c => `<button class="choice-btn" data-value="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('')}
    </div>`;
  }

  $app().innerHTML = `
    ${renderHeader({ title: escapeHtml(_state.deck.name), back: `/mots/${_state.themeId}/${_state.deckId}`,
      actions: [{ id: 'options', icon: 'settings', label: 'Options' }] })}
    <main class="page-content">
      <div class="flash-progress" style="margin-bottom:var(--space-xl)">
        <span style="color:var(--accent-green);font-weight:600">${_state.correct}</span>
        <div class="flash-progress__bar"><div class="flash-progress__fill" style="width:${progress}%"></div></div>
        <span style="color:var(--accent-red);font-weight:600">${_state.wrong}</span>
      </div>
      <div class="learn-container">
        <div class="learn-question">
          ${isRetry ? '<div class="learn-question__retry">Essayons à nouveau</div>' : ''}
          <div class="learn-question__text ${isAr ? 'learn-question__text--ar' : ''}">${escapeHtml(_cardFront(card))}</div>
          ${isAr && card.translit && _state.options.frontSide === 'front' ? `<div class="learn-question__translit">${escapeHtml(card.translit)}</div>` : ''}
        </div>
        ${answerHTML}
        <div class="learn-feedback" id="feedback"></div>
        <button class="primary-btn learn-next-btn" id="btn-next" style="display:none">Suivant</button>
      </div>
    </main>
  `;

  _state.answered = false;
  _bindQuestionEvents(card);
  document.querySelector('[data-action="options"]')?.addEventListener('click', _openOptions);
  if (_state.options.writtenMode) {
    document.getElementById('written-input')?.focus();
  }
  feather.replace();
}

function _bindQuestionEvents(card) {
  const correct = _cardBack(card);

  if (_state.options.writtenMode) {
    document.getElementById('btn-validate')?.addEventListener('click', () => {
      if (_state.answered) return;
      const input = document.getElementById('written-input');
      const userVal = input?.value || '';
      const isCorrect = checkWrittenAnswer(userVal, correct, _state.options.correctionLevel);
      _handleAnswer(isCorrect, card, correct);
    });
    document.getElementById('written-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !_state.answered) document.getElementById('btn-validate')?.click();
    });
  } else {
    $app().querySelectorAll('.choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (_state.answered) return;
        const isCorrect = btn.dataset.value === correct;
        btn.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
        if (!isCorrect) {
          $app().querySelectorAll('.choice-btn').forEach(b => {
            if (b.dataset.value === correct) b.classList.add('is-correct');
          });
        }
        $app().querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
        _handleAnswer(isCorrect, card, correct);
      });
    });
  }

  document.getElementById('btn-next')?.addEventListener('click', _nextQuestion);
}

async function _handleAnswer(isCorrect, card, correct) {
  _state.answered = true;
  const feedback = document.getElementById('feedback');
  if (feedback) {
    feedback.textContent = isCorrect ? '✓ Correct !' : `✗ Réponse : ${correct}`;
    feedback.className = `learn-feedback ${isCorrect ? 'learn-feedback--correct' : 'learn-feedback--wrong'}`;
  }

  if (isCorrect) { _state.correct++; _state.retrySet.delete(card.id); }
  else { _state.wrong++; _state.retrySet.add(card.id); }

  const srsEntry = _state.srsMap[card.id] || createSRSEntry(_state.course.id, card.id);
  const updated = processAnswer(srsEntry, isCorrect);
  _state.srsMap[card.id] = updated;
  await db.updateSRS(_state.course.id, card.id, updated);

  const nextBtn = document.getElementById('btn-next');
  if (nextBtn) nextBtn.style.display = '';
  document.getElementById('written-input')?.blur();
}

function _nextQuestion() {
  const card = _state.queue.shift();
  if (card && _state.retrySet.has(card.id)) _state.queue.push(card);
  _renderQuestion();
}

function _openOptions() {
  showModal(renderOptionsModal({ currentOptions: _state.options, courseConfig: _state.course.config }));
  bindModalEvents(({ key, value }) => {
    _state.options[key] = value;
    hideModal(); _buildQueue(); _renderQuestion();
  });
}

function _renderCompletion() {
  const { correct, wrong, themeId, deckId } = _state;
  const total = correct + wrong;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  $app().innerHTML = `
    ${renderHeader({ title: 'Terminé !', back: `/mots/${themeId}/${deckId}` })}
    <div class="completion">
      <div class="completion__icon">${pct >= 80 ? '🏆' : '📖'}</div>
      <div class="completion__title">${pct}% de réussite</div>
      <div class="completion__stats">
        <div class="completion__stat-item">
          <div class="completion__stat-value" style="color:var(--accent-green)">${correct}</div>
          <div class="completion__stat-label">Corrects</div>
        </div>
        <div class="completion__stat-item">
          <div class="completion__stat-value" style="color:var(--accent-red)">${wrong}</div>
          <div class="completion__stat-label">Erreurs</div>
        </div>
      </div>
      <div class="completion__actions">
        <button class="primary-btn" id="btn-restart">Recommencer</button>
        <button class="secondary-btn" data-navigate="/mots/${themeId}/${deckId}">Retour</button>
      </div>
    </div>
  `;
  document.getElementById('btn-restart')?.addEventListener('click', () => { _buildQueue(); _renderQuestion(); });
  feather.replace();
}

function hideModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.remove();
}
