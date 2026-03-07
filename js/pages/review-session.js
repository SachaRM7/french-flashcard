// js/pages/review-session.js — Session de révision SRS (mots dus)

import { store } from '../store.js';
import { navigate } from '../router.js';
import { renderHeader } from '../components/header.js';
import { shuffle, escapeHtml, checkWrittenAnswer } from '../utils.js';
import { db } from '../db.js';
import { createSRSEntry, processAnswer } from '../srs.js';
import { playWord } from '../audio.js';

const $app = () => document.getElementById('app');
let _state = {};

export function renderReviewSession() {
  const course = store.get('currentCourse');
  const cards = store.get('reviewCards');

  if (!course || !cards || !cards.length) {
    navigate('/revision');
    return;
  }

  const srsAll = [];
  db.getSRS(course.id).then(data => {
    _state.srsMap = Object.fromEntries(data.map(e => [e.cardId, e]));
  });

  _state = {
    course,
    queue: [...cards],
    retrySet: new Set(),
    correct: 0,
    wrong: 0,
    answered: false,
    srsMap: {},
    writtenMode: false,
    correctionLevel: 'flexible',
  };

  // Pre-load SRS map
  db.getSRS(course.id).then(data => {
    _state.srsMap = Object.fromEntries(data.map(e => [e.cardId, e]));
    _renderQuestion();
  });
}

function _getChoices(card) {
  const decks = store.get('decks') || [];
  const allCards = decks.flatMap(d => d.cards);
  const pool = allCards.filter(c => c.id !== card.id).map(c => c.back);
  return shuffle([card.back, ...shuffle(pool).slice(0, 3)]);
}

function _renderQuestion() {
  const card = _state.queue[0];
  if (!card) { _renderCompletion(); return; }

  const total = (store.get('reviewCards') || []).length;
  const done = total - _state.queue.filter(c => !_state.retrySet.has(c.id)).length;
  const progress = total > 0 ? (done / total) * 100 : 0;

  const answerHTML = `<div class="choice-grid">
    ${_getChoices(card).map(c =>
      `<button class="choice-btn" data-value="${escapeHtml(c)}">${escapeHtml(c)}</button>`
    ).join('')}
  </div>`;

  $app().innerHTML = `
    ${renderHeader({ title: 'Révision', back: '/revision' })}
    <main class="page-content">
      <div class="flash-progress" style="margin-bottom:var(--space-xl)">
        <span style="color:var(--accent-green);font-weight:600">${_state.correct}</span>
        <div class="flash-progress__bar"><div class="flash-progress__fill" style="width:${progress}%"></div></div>
        <span style="color:var(--accent-red);font-weight:600">${_state.wrong}</span>
      </div>
      <div class="learn-container">
        <div class="learn-question">
          <div class="learn-question__front text-ar" dir="rtl">${escapeHtml(card.front)}</div>
          ${card.translit ? `<div class="learn-question__translit">${escapeHtml(card.translit)}</div>` : ''}
          <button class="learn-question__audio" id="btn-audio" title="Écouter">
            <i data-feather="volume-2"></i>
          </button>
        </div>
        ${answerHTML}
        <div class="learn-feedback" id="feedback"></div>
        <button class="primary-btn learn-next-btn" id="btn-next" style="display:none">Suivant</button>
      </div>
    </main>
  `;

  _state.answered = false;
  document.getElementById('btn-audio')?.addEventListener('click', () => {
    playWord(card.front, _state.course.config?.frontLang || 'ar-SA');
  });

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

  $app().querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const isCorrect = btn.dataset.value === correct;
      btn.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
      if (!isCorrect) {
        $app().querySelectorAll('.choice-btn').forEach(b => {
          if (b.dataset.value === correct) b.classList.add('is-correct');
        });
      }
      $app().querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
      handleAnswer(isCorrect);
    });
  });

  document.getElementById('btn-next')?.addEventListener('click', () => {
    const card = _state.queue.shift();
    if (card && _state.retrySet.has(card.id)) _state.queue.push(card);
    _renderQuestion();
  });
}

function _renderCompletion() {
  const { correct, wrong } = _state;
  const total = correct + wrong;
  const pct = total ? Math.round((correct / total) * 100) : 0;

  $app().innerHTML = `
    ${renderHeader({ title: 'Session terminée !', back: '/revision' })}
    <div class="completion">
      <div class="completion__icon">${pct >= 80 ? '🏆' : '📝'}</div>
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
        <button class="secondary-btn" data-navigate="/revision">Retour au tableau de bord</button>
      </div>
    </div>
  `;
  feather.replace();
}
