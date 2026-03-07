// js/pages/words-listen.js — Mode écoute

import { store } from '../store.js';
import { navigate } from '../router.js';
import { renderHeader } from '../components/header.js';
import { shuffle, escapeHtml, checkWrittenAnswer } from '../utils.js';
import { db } from '../db.js';
import { createSRSEntry, processAnswer } from '../srs.js';
import { playWord } from '../audio.js';

const $app = () => document.getElementById('app');
let _state = {};

export async function renderWordsListen(params) {
  const { themeId, deckId } = params;
  const deck = (store.get('decks') || []).find(d => d.id === deckId);
  if (!deck) { navigate(`/mots/${themeId}/${deckId}`); return; }
  const course = store.get('currentCourse');
  const srsAll = await db.getSRS(course.id);
  _state = {
    themeId, deckId, deck, course,
    srsMap: Object.fromEntries(srsAll.map(e => [e.cardId, e])),
    writtenMode: false, correctionLevel: 'flexible',
    queue: shuffle([...deck.cards]), retrySet: new Set(), correct: 0, wrong: 0, answered: false,
  };
  _renderQuestion();
}

function _currentCard() { return _state.queue[0] || null; }

function _getChoices(card) {
  const pool = _state.deck.cards.filter(c => c.id !== card.id).map(c => c.back);
  return shuffle([card.back, ...shuffle(pool).slice(0, 3)]);
}

function _renderQuestion() {
  const card = _currentCard();
  if (!card) { _renderCompletion(); return; }

  const total = _state.deck.cards.length;
  const done = total - _state.queue.filter(c => !_state.retrySet.has(c.id)).length;
  const progress = total > 0 ? (done / total) * 100 : 0;
  const isRetry = _state.retrySet.has(card.id);

  let answerHTML = _state.writtenMode
    ? `<div class="written-form">
        <input class="written-input" id="written-input" type="text" placeholder="Répondre..." autocomplete="off">
        <button class="primary-btn" id="btn-validate">Valider</button>
      </div>`
    : `<div class="choice-grid">${_getChoices(card).map(c =>
        `<button class="choice-btn" data-value="${escapeHtml(c)}">${escapeHtml(c)}</button>`
      ).join('')}</div>`;

  $app().innerHTML = `
    ${renderHeader({ title: 'Écoute', back: `/mots/${_state.themeId}/${_state.deckId}` })}
    <main class="page-content">
      <div class="flash-progress" style="margin-bottom:var(--space-xl)">
        <span style="color:var(--accent-green);font-weight:600">${_state.correct}</span>
        <div class="flash-progress__bar"><div class="flash-progress__fill" style="width:${progress}%"></div></div>
        <span style="color:var(--accent-red);font-weight:600">${_state.wrong}</span>
      </div>
      <div class="learn-container">
        ${isRetry ? '<div class="learn-question__retry" style="text-align:center;color:var(--accent-orange);margin-bottom:var(--space-md)">Essayons à nouveau</div>' : ''}
        <div style="text-align:center;margin-bottom:var(--space-xl)">
          <button class="primary-btn" id="btn-play" style="width:auto;padding:14px 32px">
            🔊 Écouter
          </button>
        </div>
        ${answerHTML}
        <div class="learn-feedback" id="feedback"></div>
        <button class="primary-btn learn-next-btn" id="btn-next" style="display:none">Suivant</button>
      </div>
    </main>
  `;

  document.getElementById('btn-play')?.addEventListener('click', () => {
    playWord(card.front, _state.course.config.frontLang);
  });

  _state.answered = false;
  _bindAnswerEvents(card);
  feather.replace();

  // Auto-play
  playWord(card.front, _state.course.config.frontLang);
}

function _bindAnswerEvents(card) {
  const correct = card.back;

  const handleAnswer = async (isCorrect) => {
    if (_state.answered) return;
    _state.answered = true;
    const feedback = document.getElementById('feedback');
    if (feedback) {
      feedback.textContent = isCorrect ? '✓ Correct !' : `✗ Réponse : ${correct}`;
      feedback.className = `learn-feedback ${isCorrect ? 'learn-feedback--correct' : 'learn-feedback--wrong'}`;
    }
    if (isCorrect) { _state.correct++; _state.retrySet.delete(card.id); }
    else { _state.wrong++; _state.retrySet.add(card.id); }
    const srsEntry = _state.srsMap[card.id] || createSRSEntry(_state.course.id, card.id);
    _state.srsMap[card.id] = processAnswer(srsEntry, isCorrect);
    await db.updateSRS(_state.course.id, card.id, _state.srsMap[card.id]);
    const nextBtn = document.getElementById('btn-next');
    if (nextBtn) nextBtn.style.display = '';
  };

  if (_state.writtenMode) {
    document.getElementById('btn-validate')?.addEventListener('click', () => {
      const val = document.getElementById('written-input')?.value || '';
      handleAnswer(checkWrittenAnswer(val, correct, _state.correctionLevel));
    });
  } else {
    $app().querySelectorAll('.choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const isCorrect = btn.dataset.value === correct;
        btn.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
        if (!isCorrect) $app().querySelectorAll('.choice-btn').forEach(b => { if (b.dataset.value === correct) b.classList.add('is-correct'); });
        $app().querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
        handleAnswer(isCorrect);
      });
    });
  }

  document.getElementById('btn-next')?.addEventListener('click', () => {
    const card = _state.queue.shift();
    if (card && _state.retrySet.has(card.id)) _state.queue.push(card);
    _renderQuestion();
  });
}

function _renderCompletion() {
  const { correct, wrong, themeId, deckId } = _state;
  const total = correct + wrong;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  $app().innerHTML = `
    ${renderHeader({ title: 'Terminé !', back: `/mots/${themeId}/${deckId}` })}
    <div class="completion">
      <div class="completion__icon">${pct >= 80 ? '🏆' : '🎧'}</div>
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
  document.getElementById('btn-restart')?.addEventListener('click', () => {
    _state.queue = shuffle([..._state.deck.cards]);
    _state.retrySet.clear(); _state.correct = 0; _state.wrong = 0;
    _renderQuestion();
  });
  feather.replace();
}
