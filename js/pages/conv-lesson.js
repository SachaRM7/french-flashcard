// js/pages/conv-lesson.js — Vue leçon : dialogue, vocabulaire, grammaire, exemples

import { store } from '../store.js';
import { navigate } from '../router.js';
import { renderHeader } from '../components/header.js';
import { renderTabBar } from '../components/tab-bar.js';
import { renderPlayer, bindPlayerEvents } from '../components/player.js';
import { escapeHtml } from '../utils.js';
import { db } from '../db.js';
import { playWord } from '../audio.js';

const $app = () => document.getElementById('app');
let _state = {};

export async function renderConvLesson(params) {
  const { lessonId } = params;

  let lesson = store.get('currentLesson');
  if (!lesson || lesson.id !== lessonId) {
    try {
      lesson = await fetch(`data/lessons/${lessonId}.json`).then(r => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      });
    } catch {
      $app().innerHTML = `
        ${renderHeader({ title: 'Leçon introuvable', back: '/conversations' })}
        <div class="completion">
          <div class="completion__icon">❌</div>
          <div class="completion__title">Leçon introuvable</div>
          <button class="secondary-btn" data-navigate="/conversations">Retour</button>
        </div>
      `;
      feather.replace();
      return;
    }
    store.set('currentLesson', lesson);
  }

  _state = {
    lesson,
    lessonId,
    activeTab: 'dialogue',
    showTranslation: true,
    showTranslit: true,
    showHarakats: true,
    revealedLines: new Set(),
  };

  _render();
}

function _render() {
  const { lesson } = _state;
  const tabs = [
    { id: 'dialogue', label: 'Dialogue' },
    { id: 'vocabulary', label: 'Vocabulaire' },
    { id: 'grammar', label: 'Grammaire' },
    { id: 'examples', label: 'Exemples' },
    { id: 'exercises', label: 'Exercices' },
  ];

  const hasPlayer = lesson.hasAudio;

  $app().innerHTML = `
    ${renderHeader({ title: lesson.titleFr, back: '/conversations' })}
    <div class="lesson-toggles">
      <button class="lesson-toggle-btn ${_state.showTranslation ? 'is-active' : ''}" id="toggle-translation">FR</button>
      <button class="lesson-toggle-btn ${_state.showTranslit ? 'is-active' : ''}" id="toggle-translit">Translit.</button>
      <button class="lesson-toggle-btn ${_state.showHarakats ? 'is-active' : ''}" id="toggle-harakats">Harakats</button>
    </div>
    ${renderTabBar(tabs, _state.activeTab)}
    <main class="page-content lesson-content ${hasPlayer ? 'has-player' : ''}">
      ${_renderTabContent()}
    </main>
    ${hasPlayer ? renderPlayer(lesson) : ''}
  `;

  _bindEvents();
  if (hasPlayer) bindPlayerEvents(lesson);
  feather.replace();
}

function _renderTabContent() {
  switch (_state.activeTab) {
    case 'dialogue':   return _renderDialogue();
    case 'vocabulary': return _renderVocabulary();
    case 'grammar':    return _renderGrammar();
    case 'examples':   return _renderExamples();
    case 'exercises':  return _renderExercisesTab();
    default:           return '';
  }
}

function _renderDialogue() {
  const { lesson, showTranslation, showTranslit, showHarakats, revealedLines } = _state;
  if (!lesson.dialogue.length) {
    return `<p class="conv-empty">Dialogue bientôt disponible.</p>`;
  }
  return `<div class="dialogue-list">
    ${lesson.dialogue.map(line => {
      const speaker = lesson.speakers?.[line.speaker] || { name: line.speaker, color: '#888' };
      const arText = showHarakats ? line.ar : line.arPlain;
      const revealed = revealedLines.has(line.id);
      return `
        <div class="dialogue-line" id="line-${escapeHtml(line.id)}">
          <div class="dialogue-line__speaker" style="color:${escapeHtml(speaker.color)}">${escapeHtml(speaker.name)}</div>
          <div class="dialogue-line__body">
            <div class="dialogue-line__ar text-ar" dir="rtl">${escapeHtml(arText)}</div>
            ${showTranslit ? `<div class="dialogue-line__translit">${escapeHtml(line.translit)}</div>` : ''}
            ${showTranslation
              ? `<div class="dialogue-line__fr">${escapeHtml(line.fr)}</div>`
              : `<div class="dialogue-line__fr dialogue-line__fr--hidden ${revealed ? 'is-revealed' : ''}"
                  data-line-id="${escapeHtml(line.id)}">${revealed ? escapeHtml(line.fr) : 'Appuyer pour révéler'}</div>`
            }
          </div>
          <button class="dialogue-line__play" data-ar="${escapeHtml(line.ar)}" aria-label="Écouter">
            <i data-feather="volume-2"></i>
          </button>
        </div>
      `;
    }).join('')}
  </div>`;
}

function _renderVocabulary() {
  const { lesson } = _state;
  if (!lesson.vocabulary.length) {
    return `<p class="conv-empty">Vocabulaire bientôt disponible.</p>`;
  }
  return `<div class="vocab-list">
    ${lesson.vocabulary.map(w => `
      <div class="vocab-item">
        <div class="vocab-item__ar text-ar" dir="rtl">${escapeHtml(w.ar)}</div>
        <div class="vocab-item__translit">${escapeHtml(w.translit)}</div>
        <div class="vocab-item__fr">
          ${escapeHtml(w.fr)}
          ${(w.linkedCards && w.linkedCards.length) ? `<span class="vocab-item__linked" title="Dans les flashcards">📚</span>` : ''}
        </div>
        <button class="vocab-item__play" data-ar="${escapeHtml(w.ar)}" aria-label="Écouter">
          <i data-feather="volume-2"></i>
        </button>
      </div>
    `).join('')}
    <button class="secondary-btn" id="btn-review-vocab" style="margin-top:var(--space-lg)">
      Réviser ces mots en flashcards
    </button>
  </div>`;
}

function _renderGrammar() {
  const { lesson } = _state;
  if (!lesson.grammar.length) {
    return `<p class="conv-empty">Points de grammaire bientôt disponibles.</p>`;
  }
  return `<div class="grammar-list">
    ${lesson.grammar.map(g => `
      <div class="grammar-item">
        <div class="grammar-item__title">${escapeHtml(g.titleFr)}</div>
        <div class="grammar-item__ar text-ar" dir="rtl">${escapeHtml(g.title)}</div>
        <p class="grammar-item__explanation">${escapeHtml(g.explanation)}</p>
        ${g.examples.length ? `
          <div class="grammar-examples">
            ${g.examples.map(ex => `
              <div class="grammar-example">
                <div class="grammar-example__ar text-ar" dir="rtl">${escapeHtml(ex.ar)}</div>
                <div class="grammar-example__translit">${escapeHtml(ex.translit)}</div>
                <div class="grammar-example__fr">${escapeHtml(ex.fr)}</div>
                <button class="vocab-item__play" data-ar="${escapeHtml(ex.ar)}" aria-label="Écouter">
                  <i data-feather="volume-2"></i>
                </button>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `).join('')}
  </div>`;
}

function _renderExamples() {
  const { lesson } = _state;
  if (!lesson.examples.length) {
    return `<p class="conv-empty">Exemples bientôt disponibles.</p>`;
  }
  return `<div class="vocab-list">
    ${lesson.examples.map(ex => `
      <div class="vocab-item">
        <div class="vocab-item__ar text-ar" dir="rtl">${escapeHtml(ex.ar)}</div>
        <div class="vocab-item__translit">${escapeHtml(ex.translit)}</div>
        <div class="vocab-item__fr">${escapeHtml(ex.fr)}</div>
        <button class="vocab-item__play" data-ar="${escapeHtml(ex.ar)}" aria-label="Écouter">
          <i data-feather="volume-2"></i>
        </button>
      </div>
    `).join('')}
  </div>`;
}

function _renderExercisesTab() {
  const { lesson } = _state;
  const fbCount = lesson.exercises?.fillBlanks?.length || 0;
  const dbCount = lesson.exercises?.dialogueBlanks?.length || 0;
  const total = fbCount + dbCount;
  return `
    <div class="exercises-tab">
      <div class="exercises-tab__summary">
        <div class="exercises-tab__icon">✏️</div>
        <div class="exercises-tab__count">${total} exercice${total !== 1 ? 's' : ''}</div>
        <p class="exercises-tab__desc">Mettez en pratique ce que vous avez appris dans cette leçon.</p>
      </div>
      ${total > 0
        ? `<button class="primary-btn" id="btn-start-exercises">Commencer</button>`
        : `<p class="conv-empty">Exercices bientôt disponibles.</p>`
      }
    </div>
  `;
}

function _bindEvents() {
  // Tab switching
  $app().querySelectorAll('.tab-bar__tab').forEach(btn => {
    btn.addEventListener('click', () => {
      _state.activeTab = btn.dataset.tabId;
      _render();
    });
  });

  // Toggles
  document.getElementById('toggle-translation')?.addEventListener('click', () => {
    _state.showTranslation = !_state.showTranslation;
    _render();
  });
  document.getElementById('toggle-translit')?.addEventListener('click', () => {
    _state.showTranslit = !_state.showTranslit;
    _render();
  });
  document.getElementById('toggle-harakats')?.addEventListener('click', () => {
    _state.showHarakats = !_state.showHarakats;
    _render();
  });

  // Audio play buttons
  $app().querySelectorAll('[data-ar]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      playWord(btn.dataset.ar, 'ar-SA');
    });
  });

  // Reveal translation on click
  $app().querySelectorAll('.dialogue-line__fr--hidden').forEach(el => {
    el.addEventListener('click', () => {
      const lineId = el.dataset.lineId;
      _state.revealedLines.add(lineId);
      const line = _state.lesson.dialogue.find(l => l.id === lineId);
      if (line) {
        el.textContent = line.fr;
        el.classList.add('is-revealed');
      }
    });
  });

  // Start exercises
  document.getElementById('btn-start-exercises')?.addEventListener('click', () => {
    navigate(`/conversations/lecon/${_state.lessonId}/exercice`);
  });

  // Vocab → flashcards bridge
  document.getElementById('btn-review-vocab')?.addEventListener('click', () => {
    const vocab = _state.lesson.vocabulary;
    if (!vocab || !vocab.length) return;
    const tempDeck = {
      id: `lesson-${_state.lessonId}`,
      name: `Leçon : ${_state.lesson.titleFr}`,
      nameAr: '',
      cards: vocab.map((w, i) => ({
        id: `${_state.lessonId}:vocab:${i}`,
        front: w.ar,
        frontPlain: w.arPlain,
        back: w.fr,
        translit: w.translit,
        emoji: '',
        image: null,
        audio: null,
        tags: w.tags || [],
      })),
    };
    const decks = store.get('decks') || [];
    const existingIdx = decks.findIndex(d => d.id === tempDeck.id);
    if (existingIdx >= 0) decks[existingIdx] = tempDeck;
    else decks.push(tempDeck);
    store.set('decks', decks);
    navigate(`/mots/lecons/${tempDeck.id}/flash`);
  });
}
