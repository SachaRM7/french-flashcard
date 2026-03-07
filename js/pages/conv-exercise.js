// js/pages/conv-exercise.js — Exercices d'une leçon

import { store } from '../store.js';
import { navigate } from '../router.js';
import { renderHeader } from '../components/header.js';
import { escapeHtml, shuffle } from '../utils.js';
import { db } from '../db.js';
import { createSRSEntry, processAnswer } from '../srs.js';

const $app = () => document.getElementById('app');
let _state = {};

export async function renderConvExercise(params) {
  const { lessonId } = params;

  let lesson = store.get('currentLesson');
  if (!lesson || lesson.id !== lessonId) {
    try {
      lesson = await fetch(`data/lessons/${lessonId}.json`).then(r => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      });
      store.set('currentLesson', lesson);
    } catch {
      navigate(`/conversations/lecon/${lessonId}`);
      return;
    }
  }

  const fillBlanks = lesson.exercises?.fillBlanks || [];
  const dialogueBlanks = lesson.exercises?.dialogueBlanks || [];
  const exercises = shuffle([
    ...fillBlanks.map(e => ({ ...e, exerciseType: 'fillBlanks' })),
    ...dialogueBlanks.map(e => ({ ...e, exerciseType: 'dialogueBlanks' })),
  ]);

  if (!exercises.length) {
    navigate(`/conversations/lecon/${lessonId}`);
    return;
  }

  _state = {
    lesson, lessonId,
    exercises,
    current: 0,
    correct: 0,
    wrong: 0,
    answered: false,
  };

  _renderQuestion();
}

function _renderQuestion() {
  const { exercises, current, correct, wrong } = _state;
  const total = exercises.length;

  if (current >= total) {
    _renderCompletion();
    return;
  }

  const ex = exercises[current];
  const progress = total > 0 ? (current / total) * 100 : 0;

  $app().innerHTML = `
    ${renderHeader({ title: 'Exercices', back: `/conversations/lecon/${_state.lessonId}` })}
    <main class="page-content">
      <div class="flash-progress" style="margin-bottom:var(--space-xl)">
        <span style="color:var(--accent-green);font-weight:600">${correct}</span>
        <div class="flash-progress__bar"><div class="flash-progress__fill" style="width:${progress}%"></div></div>
        <span style="color:var(--accent-red);font-weight:600">${wrong}</span>
      </div>
      <div class="learn-container">
        <div class="exercise-count" style="color:var(--text-tertiary);font-size:var(--text-sm);text-align:center;margin-bottom:var(--space-md)">${current + 1} / ${total}</div>
        ${ex.exerciseType === 'fillBlanks' ? _renderFillBlank(ex) : _renderDialogueBlank(ex)}
        <div class="learn-feedback" id="feedback"></div>
        <button class="primary-btn learn-next-btn" id="btn-next" style="display:none">Suivant</button>
      </div>
    </main>
  `;

  _state.answered = false;
  _bindAnswerEvents(ex);
  feather.replace();
}

function _renderFillBlank(ex) {
  return `
    <div class="learn-question">
      <div style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-md)">Complétez la phrase</div>
      <div class="exercise-sentence text-ar" dir="rtl" style="font-size:1.5rem;margin-bottom:var(--space-sm)">${escapeHtml(ex.sentenceAr)}</div>
      <div class="exercise-sentence-fr" style="color:var(--text-secondary);margin-bottom:var(--space-xl)">${escapeHtml(ex.sentenceFr)}</div>
      ${ex.hint ? `<div class="exercise-hint">💡 ${escapeHtml(ex.hint)}</div>` : ''}
    </div>
    <div class="choice-grid">
      ${ex.choices.map(c => `<button class="choice-btn" data-value="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('')}
    </div>
  `;
}

function _renderDialogueBlank(ex) {
  const speaker = _state.lesson.speakers?.[ex.contextSpeaker] || { name: ex.contextSpeaker, color: '#888' };
  return `
    <div class="learn-question">
      <div style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-md)">Choisissez la bonne réponse</div>
      <div class="dialogue-context" style="margin-bottom:var(--space-xl)">
        <span style="color:${escapeHtml(speaker.color)};font-weight:600;font-size:var(--text-sm)">${escapeHtml(speaker.name)} :</span>
        <div class="text-ar" dir="rtl" style="font-size:1.4rem;margin-top:var(--space-sm)">${escapeHtml(ex.contextAr)}</div>
        <div style="color:var(--text-secondary);font-size:var(--text-sm)">${escapeHtml(ex.contextFr)}</div>
      </div>
    </div>
    <div class="choice-grid">
      ${ex.choices.map(c => `<button class="choice-btn choice-btn--ar" data-value="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('')}
    </div>
  `;
}

function _bindAnswerEvents(ex) {
  const correctAnswer = ex.exerciseType === 'fillBlanks' ? ex.answer : ex.answerAr;

  const handleAnswer = async (isCorrect) => {
    if (_state.answered) return;
    _state.answered = true;

    const feedback = document.getElementById('feedback');
    if (feedback) {
      feedback.textContent = isCorrect ? '✓ Correct !' : `✗ Réponse : ${correctAnswer}`;
      feedback.className = `learn-feedback ${isCorrect ? 'learn-feedback--correct' : 'learn-feedback--wrong'}`;
    }

    if (isCorrect) _state.correct++;
    else _state.wrong++;

    // Update SRS for vocabulary words if this exercise is linked
    const course = store.get('currentCourse');
    if (course && _state.lesson.vocabulary.length) {
      const srsAll = await db.getSRS(course.id);
      const srsMap = Object.fromEntries(srsAll.map(e => [e.cardId, e]));
      // Only update SRS for vocabulary items linked to this exercise
      const linkedCards = _state.lesson.vocabulary.flatMap(v => v.linkedCards || []);
      for (const cardId of linkedCards) {
        const entry = srsMap[cardId] || createSRSEntry(course.id, cardId);
        await db.updateSRS(course.id, cardId, processAnswer(entry, isCorrect));
      }
    }

    const nextBtn = document.getElementById('btn-next');
    if (nextBtn) nextBtn.style.display = '';
  };

  $app().querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const isCorrect = btn.dataset.value === correctAnswer;
      btn.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
      if (!isCorrect) {
        $app().querySelectorAll('.choice-btn').forEach(b => {
          if (b.dataset.value === correctAnswer) b.classList.add('is-correct');
        });
      }
      $app().querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
      handleAnswer(isCorrect);
    });
  });

  document.getElementById('btn-next')?.addEventListener('click', async () => {
    _state.current++;

    // Save progress in IndexedDB
    const course = store.get('currentCourse');
    if (course) {
      await db.saveLessonProgress(course.id, _state.lessonId, {
        exercisesCompleted: _state.current,
        exercisesTotal: _state.exercises.length,
        lastAttempt: new Date().toISOString(),
      });
    }

    _renderQuestion();
  });
}

function _renderCompletion() {
  const { correct, wrong, lessonId } = _state;
  const total = correct + wrong;
  const pct = total ? Math.round((correct / total) * 100) : 0;

  $app().innerHTML = `
    ${renderHeader({ title: 'Terminé !', back: `/conversations/lecon/${lessonId}` })}
    <div class="completion">
      <div class="completion__icon">${pct >= 80 ? '🏆' : '✏️'}</div>
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
        <button class="secondary-btn" data-navigate="/conversations/lecon/${lessonId}">Retour à la leçon</button>
      </div>
    </div>
  `;

  document.getElementById('btn-restart')?.addEventListener('click', () => {
    _state.current = 0;
    _state.correct = 0;
    _state.wrong = 0;
    _state.exercises = shuffle([..._state.exercises]);
    _renderQuestion();
  });

  feather.replace();
}
