// js/pages/words-image.js — Mode image / emoji

import { store } from '../store.js';
import { navigate } from '../router.js';
import { renderHeader } from '../components/header.js';
import { shuffle, escapeHtml, checkWrittenAnswer } from '../utils.js';
import { db } from '../db.js';
import { createSRSEntry, processAnswer } from '../srs.js';

const $app = () => document.getElementById('app');
let _state = {};

export async function renderWordsImage(params) {
  const { themeId, deckId } = params;
  const deck = (store.get('decks') || []).find(d => d.id === deckId);
  if (!deck) { navigate(`/mots/${themeId}/${deckId}`); return; }

  // Only keep cards that have an emoji or image
  const validCards = deck.cards.filter(c => c.emoji || c.image);
  if (validCards.length < 2) {
    $app().innerHTML = `
      ${renderHeader({ title: 'Mode Image', back: `/mots/${themeId}/${deckId}` })}
      <div class="completion">
        <div class="completion__icon">🖼️</div>
        <div class="completion__title">Pas assez d'images</div>
        <p style="color:var(--text-secondary);text-align:center">Ce deck ne contient pas assez de cartes avec images ou emojis.</p>
        <button class="secondary-btn" data-navigate="/mots/${themeId}/${deckId}">Retour</button>
      </div>
    `;
    feather.replace();
    return;
  }

  const course = store.get('currentCourse');
  const srsAll = await db.getSRS(course.id);
  _state = {
    themeId, deckId, deck, course, validCards,
    srsMap: Object.fromEntries(srsAll.map(e => [e.cardId, e])),
    writtenMode: false, correctionLevel: 'flexible',
    queue: shuffle([...validCards]), retrySet: new Set(), correct: 0, wrong: 0, answered: false,
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

  const total = _state.validCards.length;
  const done = total - _state.queue.filter(c => !_state.retrySet.has(c.id)).length;
  const progress = total > 0 ? (done / total) * 100 : 0;

  const visual = card.image
    ? `<img src="${escapeHtml(card.image)}" alt="" style="max-height:120px;object-fit:contain">`
    : `<div style="font-size:5rem">${card.emoji}</div>`;

  let answerHTML = _state.writtenMode
    ? `<div class="written-form">
        <input class="written-input" id="written-input" type="text" placeholder="Répondre..." autocomplete="off">
        <button class="primary-btn" id="btn-validate">Valider</button>
      </div>`
    : `<div class="choice-grid">${_getChoices(card).map(c =>
        `<button class="choice-btn" data-value="${escapeHtml(c)}">${escapeHtml(c)}</button>`
      ).join('')}</div>`;

  $app().innerHTML = `
    ${renderHeader({ title: 'Image', back: `/mots/${_state.themeId}/${_state.deckId}` })}
    <main class="page-content">
      <div class="flash-progress" style="margin-bottom:var(--space-xl)">
        <span style="color:var(--accent-green);font-weight:600">${_state.correct}</span>
        <div class="flash-progress__bar"><div class="flash-progress__fill" style="width:${progress}%"></div></div>
        <span style="color:var(--accent-red);font-weight:600">${_state.wrong}</span>
      </div>
      <div class="learn-container">
        <div class="learn-question" style="min-height:180px">
          <div style="display:flex;align-items:center;justify-content:center;margin-bottom:var(--space-md)">${visual}</div>
        </div>
        ${answerHTML}
        <div class="learn-feedback" id="feedback"></div>
        <button class="primary-btn learn-next-btn" id="btn-next" style="display:none">Suivant</button>
      </div>
    </main>
  `;

  _state.answered = false;
  _bindAnswerEvents(card);
  feather.replace();
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
      <div class="completion__icon">${pct >= 80 ? '🏆' : '🖼️'}</div>
      <div class="completion__title">${pct}% de réussite</div>
      <div class="completion__actions">
        <button class="primary-btn" id="btn-restart">Recommencer</button>
        <button class="secondary-btn" data-navigate="/mots/${themeId}/${deckId}">Retour</button>
      </div>
    </div>
  `;
  document.getElementById('btn-restart')?.addEventListener('click', () => {
    _state.queue = shuffle([..._state.validCards]);
    _state.retrySet.clear(); _state.correct = 0; _state.wrong = 0;
    _renderQuestion();
  });
  feather.replace();
}
