// js/pages/words-test.js — Mode examen

import { store } from '../store.js';
import { navigate } from '../router.js';
import { renderHeader } from '../components/header.js';
import { shuffle, escapeHtml, checkWrittenAnswer } from '../utils.js';
import { db } from '../db.js';
import { createSRSEntry, processAnswer } from '../srs.js';

const $app = () => document.getElementById('app');
let _state = {};

export async function renderWordsTest(params) {
  const { themeId, deckId } = params;
  const deck = (store.get('decks') || []).find(d => d.id === deckId);
  if (!deck) { navigate(`/mots/${themeId}/${deckId}`); return; }
  const course = store.get('currentCourse');
  const srsAll = await db.getSRS(course.id);
  _state = {
    themeId, deckId, deck, course,
    srsMap: Object.fromEntries(srsAll.map(e => [e.cardId, e])),
    options: { count: 10, frontSide: 'front', writtenMode: false, correctionLevel: 'flexible' },
    questions: [], index: 0, results: [],
  };
  _renderConfig();
}

function _cardFront(card) { return _state.options.frontSide === 'front' ? card.front : card.back; }
function _cardBack(card)  { return _state.options.frontSide === 'front' ? card.back : card.front; }
function _isFrontAr() { const c = _state.course.config; return _state.options.frontSide === 'front' ? c.frontDir === 'rtl' : c.backDir === 'rtl'; }

function _renderConfig() {
  const total = _state.deck.cards.length;
  const counts = [10, 15, 20, total].filter((v, i, a) => a.indexOf(v) === i && v <= total);
  $app().innerHTML = `
    ${renderHeader({ title: 'Examen', back: `/mots/${_state.themeId}/${_state.deckId}` })}
    <main class="page-content">
      <div class="test-config">
        <div class="test-config__title">Configurer l'examen</div>
        <div class="test-config__options">
          ${counts.map((n, i) => `
            <div class="test-config-option ${i === 0 ? 'is-selected' : ''}" data-count="${n}">
              ${n === total ? `Tout (${n} questions)` : `${n} questions`}
            </div>
          `).join('')}
        </div>
        <label class="modal-option" style="justify-content:space-between;margin-bottom:var(--space-xl)">
          <span>Mode écrit</span>
          <label class="toggle"><input type="checkbox" id="opt-written"><span class="toggle__slider"></span></label>
        </label>
        <button class="primary-btn" id="btn-start">Commencer</button>
      </div>
    </main>
  `;

  $app().querySelectorAll('.test-config-option').forEach(el => {
    el.addEventListener('click', () => {
      $app().querySelectorAll('.test-config-option').forEach(e => e.classList.remove('is-selected'));
      el.classList.add('is-selected');
      _state.options.count = parseInt(el.dataset.count);
    });
  });
  document.getElementById('opt-written')?.addEventListener('change', e => { _state.options.writtenMode = e.target.checked; });
  document.getElementById('btn-start')?.addEventListener('click', _startTest);
  feather.replace();
}

function _startTest() {
  const cards = shuffle([..._state.deck.cards]).slice(0, _state.options.count);
  _state.questions = cards;
  _state.index = 0;
  _state.results = [];
  _renderQuestion();
}

function _getChoices(card) {
  const correct = _cardBack(card);
  const pool = _state.deck.cards.filter(c => c.id !== card.id).map(c => _cardBack(c));
  return shuffle([correct, ...shuffle(pool).slice(0, 3)]);
}

function _renderQuestion() {
  if (_state.index >= _state.questions.length) { _renderResults(); return; }
  const card = _state.questions[_state.index];
  const total = _state.questions.length;
  const progress = ((_state.index) / total) * 100;
  const isAr = _isFrontAr();

  let answerHTML = _state.options.writtenMode
    ? `<div class="written-form">
        <input class="written-input" id="written-input" type="text" placeholder="Répondre..." autocomplete="off">
        <button class="primary-btn" id="btn-validate">Valider</button>
      </div>`
    : `<div class="choice-grid">${_getChoices(card).map(c =>
        `<button class="choice-btn" data-value="${escapeHtml(c)}">${escapeHtml(c)}</button>`
      ).join('')}</div>`;

  $app().innerHTML = `
    ${renderHeader({ title: `Question ${_state.index + 1}/${total}`, back: `/mots/${_state.themeId}/${_state.deckId}` })}
    <main class="page-content">
      <div class="flash-progress" style="margin-bottom:var(--space-xl)">
        <span style="font-size:var(--text-sm);color:var(--text-secondary)">${_state.index + 1}/${total}</span>
        <div class="flash-progress__bar"><div class="flash-progress__fill" style="width:${progress}%"></div></div>
      </div>
      <div class="learn-container">
        <div class="learn-question">
          <div class="learn-question__text ${isAr ? 'learn-question__text--ar' : ''}">${escapeHtml(_cardFront(card))}</div>
          ${isAr && card.translit ? `<div class="learn-question__translit">${escapeHtml(card.translit)}</div>` : ''}
        </div>
        ${answerHTML}
        <div class="learn-feedback" id="feedback"></div>
        <button class="primary-btn learn-next-btn" id="btn-next" style="display:none">Suivant</button>
      </div>
    </main>
  `;

  _bindTestAnswer(card);
  feather.replace();
}

function _bindTestAnswer(card) {
  const correct = _cardBack(card);
  let answered = false;

  const handleAnswer = async (isCorrect) => {
    if (answered) return;
    answered = true;
    _state.results.push({ card, correct, isCorrect, userAnswer: '' });
    const feedback = document.getElementById('feedback');
    if (feedback) {
      feedback.textContent = isCorrect ? '✓ Correct !' : `✗ Réponse : ${correct}`;
      feedback.className = `learn-feedback ${isCorrect ? 'learn-feedback--correct' : 'learn-feedback--wrong'}`;
    }
    const srsEntry = _state.srsMap[card.id] || createSRSEntry(_state.course.id, card.id);
    const updated = processAnswer(srsEntry, isCorrect);
    _state.srsMap[card.id] = updated;
    await db.updateSRS(_state.course.id, card.id, updated);
    const nextBtn = document.getElementById('btn-next');
    if (nextBtn) nextBtn.style.display = '';
  };

  if (_state.options.writtenMode) {
    document.getElementById('btn-validate')?.addEventListener('click', () => {
      const val = document.getElementById('written-input')?.value || '';
      handleAnswer(checkWrittenAnswer(val, correct, _state.options.correctionLevel));
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
  document.getElementById('btn-next')?.addEventListener('click', () => { _state.index++; _renderQuestion(); });
}

function _renderResults() {
  const correct = _state.results.filter(r => r.isCorrect).length;
  const total = _state.results.length;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const r = 54; const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  $app().innerHTML = `
    ${renderHeader({ title: 'Résultats', back: `/mots/${_state.themeId}/${_state.deckId}` })}
    <main class="page-content">
      <div class="test-results">
        <div class="score-circle">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--border)" stroke-width="8"/>
            <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--accent-blue)" stroke-width="8"
              stroke-dasharray="${dash} ${circ}" stroke-linecap="round"
              style="transition:stroke-dasharray 1s ease"/>
          </svg>
          <div class="score-circle__value">${pct}%</div>
        </div>
        <p style="color:var(--text-secondary)">${correct} / ${total} corrects</p>
        <div class="result-list">
          ${_state.results.map(r => `
            <div class="result-item result-item--${r.isCorrect ? 'correct' : 'wrong'}">
              <div class="result-item__icon"></div>
              <div>
                <div style="font-family:var(--font-arabic);direction:rtl">${escapeHtml(r.card.front)}</div>
                <div style="color:var(--text-secondary)">${escapeHtml(r.correct)}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="completion__actions" style="margin-top:var(--space-xl)">
          <button class="primary-btn" id="btn-restart">Recommencer</button>
          <button class="secondary-btn" data-navigate="/mots/${_state.themeId}/${_state.deckId}">Retour</button>
        </div>
      </div>
    </main>
  `;
  document.getElementById('btn-restart')?.addEventListener('click', _renderConfig);
  feather.replace();
}
