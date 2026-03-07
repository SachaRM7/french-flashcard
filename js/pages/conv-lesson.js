// js/pages/conv-lesson.js — Vue lecon : dialogue, vocabulaire, grammaire, exemples (swipe)

import { store } from '../store.js';
import { navigate } from '../router.js';
import { renderHeader } from '../components/header.js';
import { renderTabBar } from '../components/tab-bar.js';
import { renderPlayer, bindPlayerEvents } from '../components/player.js';
import { escapeHtml } from '../utils.js';
import { db } from '../db.js';
import { playWord } from '../audio.js';

const $app = () => document.getElementById('app');

const TABS = ['dialogue', 'vocabulary', 'grammar', 'examples', 'exercises'];
const TAB_LABELS = {
  dialogue: 'Dialogue',
  vocabulary: 'Vocabulaire',
  grammar: 'Grammaire',
  examples: 'Exemples',
  exercises: 'Exercices',
};

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
        ${renderHeader({ title: 'Lecon introuvable', back: '/conversations' })}
        <div class="completion">
          <div class="completion__icon">X</div>
          <div class="completion__title">Lecon introuvable</div>
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
  const { lesson, activeTab } = _state;
  const tabIndex = TABS.indexOf(activeTab);
  const hasPlayer = lesson.hasAudio;

  const tabs = TABS.map(id => ({ id, label: TAB_LABELS[id] }));

  $app().innerHTML = `
    ${renderHeader({ title: escapeHtml(lesson.titleFr), back: '/conversations' })}
    <div class="lesson-toggles">
      <button class="lesson-toggle ${_state.showTranslation ? 'is-active' : ''}" id="toggle-translation">
        <span class="lesson-toggle__icon">FR</span>
        <span class="lesson-toggle__label">Traduction</span>
      </button>
      <button class="lesson-toggle ${_state.showTranslit ? 'is-active' : ''}" id="toggle-translit">
        <span class="lesson-toggle__icon">Abc</span>
        <span class="lesson-toggle__label">Translit.</span>
      </button>
      <button class="lesson-toggle ${_state.showHarakats ? 'is-active' : ''}" id="toggle-harakats">
        <span class="lesson-toggle__icon text-ar">◌َ</span>
        <span class="lesson-toggle__label">Harakats</span>
      </button>
    </div>
    ${renderTabBar(tabs, activeTab)}
    <div class="swipe-tabs-container ${hasPlayer ? 'has-player' : ''}" id="lesson-swipe-container">
      <div class="swipe-tabs-track" id="lesson-swipe-track"
           style="transform:translateX(-${tabIndex * 20}%);transition:none">
        <div class="swipe-tabs-panel">${_renderDialogue()}</div>
        <div class="swipe-tabs-panel">${_renderVocabulary()}</div>
        <div class="swipe-tabs-panel">${_renderGrammar()}</div>
        <div class="swipe-tabs-panel">${_renderExamples()}</div>
        <div class="swipe-tabs-panel">${_renderExercisesTab()}</div>
      </div>
    </div>
    ${hasPlayer ? renderPlayer(lesson) : ''}
  `;

  _bindEvents();
  if (hasPlayer) bindPlayerEvents(lesson);
  feather.replace();
}

function _switchTab(index, animate = true) {
  if (index < 0 || index >= TABS.length) return;
  _state.activeTab = TABS[index];

  document.querySelectorAll('.tab-bar__tab').forEach((tab, i) => {
    tab.classList.toggle('tab-bar__tab--active', i === index);
  });

  const track = document.getElementById('lesson-swipe-track');
  if (track) {
    track.style.transition = animate ? 'transform 0.3s ease' : 'none';
    track.style.transform = `translateX(-${index * 20}%)`;
  }
}

function _renderDialogue() {
  const { lesson, showTranslation, showTranslit, showHarakats, revealedLines } = _state;
  if (!lesson.dialogue || !lesson.dialogue.length) {
    return `<p class="conv-empty">Dialogue bientot disponible.</p>`;
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
                  data-line-id="${escapeHtml(line.id)}">${revealed ? escapeHtml(line.fr) : 'Appuyer pour reveler'}</div>`
            }
          </div>
          <button class="dialogue-line__play" data-ar="${escapeHtml(line.ar)}" aria-label="Ecouter">
            <i data-feather="volume-2"></i>
          </button>
        </div>
      `;
    }).join('')}
  </div>`;
}

function _renderVocabulary() {
  const { lesson } = _state;
  if (!lesson.vocabulary || !lesson.vocabulary.length) {
    return `<p class="conv-empty">Vocabulaire bientot disponible.</p>`;
  }
  return `<div class="vocab-list">
    ${lesson.vocabulary.map(w => `
      <div class="vocab-item">
        <div class="vocab-item__ar text-ar" dir="rtl">${escapeHtml(w.ar)}</div>
        <div class="vocab-item__translit">${escapeHtml(w.translit)}</div>
        <div class="vocab-item__fr">
          ${escapeHtml(w.fr)}
          ${(w.linkedCards && w.linkedCards.length) ? `<span class="vocab-item__linked" title="Dans les flashcards">&#x1F4DA;</span>` : ''}
        </div>
        <button class="vocab-item__play" data-ar="${escapeHtml(w.ar)}" aria-label="Ecouter">
          <i data-feather="volume-2"></i>
        </button>
      </div>
    `).join('')}
    <button class="secondary-btn" id="btn-review-vocab" style="margin-top:var(--space-lg)">
      Reviser ces mots &rarr;
    </button>
  </div>`;
}

function _renderGrammar() {
  const { lesson } = _state;
  if (!lesson.grammar || !lesson.grammar.length) {
    return `<p class="conv-empty">Points de grammaire bientot disponibles.</p>`;
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
                <button class="vocab-item__play" data-ar="${escapeHtml(ex.ar)}" aria-label="Ecouter">
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
  if (!lesson.examples || !lesson.examples.length) {
    return `<p class="conv-empty">Exemples bientot disponibles.</p>`;
  }
  return `<div class="vocab-list">
    ${lesson.examples.map(ex => `
      <div class="vocab-item">
        <div class="vocab-item__ar text-ar" dir="rtl">${escapeHtml(ex.ar)}</div>
        <div class="vocab-item__translit">${escapeHtml(ex.translit)}</div>
        <div class="vocab-item__fr">${escapeHtml(ex.fr)}</div>
        <button class="vocab-item__play" data-ar="${escapeHtml(ex.ar)}" aria-label="Ecouter">
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
        <div class="exercises-tab__icon">&#x270F;&#xFE0F;</div>
        <div class="exercises-tab__count">${total} exercice${total !== 1 ? 's' : ''}</div>
        <p class="exercises-tab__desc">Mettez en pratique ce que vous avez appris dans cette lecon.</p>
      </div>
      ${total > 0
        ? `<button class="primary-btn" id="btn-start-exercises">Commencer</button>`
        : `<p class="conv-empty">Exercices bientot disponibles.</p>`
      }
    </div>
  `;
}

function _bindEvents() {
  // Tab bar clicks
  $app().querySelectorAll('.tab-bar__tab').forEach((btn, i) => {
    btn.addEventListener('click', () => _switchTab(i, false));
  });

  // Toggles
  document.getElementById('toggle-translation')?.addEventListener('click', () => {
    _state.showTranslation = !_state.showTranslation;
    _state.revealedLines.clear();
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
    btn.addEventListener('click', e => {
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

  // Vocab -> page deck (amelioration 3 + 4)
  document.getElementById('btn-review-vocab')?.addEventListener('click', async () => {
    const vocab = _state.lesson.vocabulary;
    if (!vocab || !vocab.length) return;

    const course = store.get('currentCourse');
    const deck = {
      id: `lesson-vocab-${_state.lessonId}`,
      name: `Vocab — ${_state.lesson.seriesName} ${_state.lesson.number}`,
      nameAr: '',
      category: 'Lecons',
      source: 'lesson',
      lessonId: _state.lessonId,
      tags: _state.lesson.tags || [],
      cards: vocab.map((word, index) => ({
        id: `lesson-vocab-${_state.lessonId}:${index}`,
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

    // Sauvegarder dans IndexedDB (amelioration 4)
    await db.saveLessonDeck(course.id, _state.lessonId, deck);

    // Ajouter au store pour acces immediat
    const decks = store.get('decks') || [];
    const idx = decks.findIndex(d => d.id === deck.id);
    if (idx >= 0) decks[idx] = deck; else decks.push(deck);
    store.set('decks', decks);

    navigate(`/mots/lecons/${_state.lessonId}`);
  });

  // Swipe horizontal pour changer d'onglet
  _bindSwipe();
}

function _bindSwipe() {
  const container = document.getElementById('lesson-swipe-container');
  const track = document.getElementById('lesson-swipe-track');
  if (!container || !track) return;

  let startX = 0, startY = 0, dragging = false, isHorizontal = null;

  container.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    dragging = true;
    isHorizontal = null;
    track.style.transition = 'none';
  }, { passive: true });

  container.addEventListener('touchmove', e => {
    if (!dragging) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;

    if (isHorizontal === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      isHorizontal = Math.abs(dx) > Math.abs(dy) * 1.5;
    }

    if (isHorizontal) {
      e.preventDefault();
      const tabIdx = TABS.indexOf(_state.activeTab);
      const base = -tabIdx * 20;
      track.style.transform = `translateX(calc(${base}% + ${dx}px))`;
    }
  }, { passive: false });

  container.addEventListener('touchend', e => {
    if (!dragging) return;
    dragging = false;
    if (!isHorizontal) return;
    const dx = e.changedTouches[0].clientX - startX;
    const tabIdx = TABS.indexOf(_state.activeTab);
    if (dx < -80) _switchTab(tabIdx + 1);
    else if (dx > 80) _switchTab(tabIdx - 1);
    else {
      track.style.transition = 'transform 0.3s ease';
      track.style.transform = `translateX(-${tabIdx * 20}%)`;
    }
  }, { passive: true });
}
