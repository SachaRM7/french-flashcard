// js/pages/alphabet.js — Section alphabet arabe

import { store } from '../store.js';
import { renderHeader } from '../components/header.js';
import { renderTabBar } from '../components/tab-bar.js';
import { renderBottomNav } from '../components/bottom-nav.js';
import { escapeHtml } from '../utils.js';
import { playWord } from '../audio.js';

const $app = () => document.getElementById('app');

const TABS = [
  { id: 'letters', label: 'Lettres' },
  { id: 'diacritics', label: 'Voyelles brèves' },
  { id: 'rules', label: 'Règles' },
];

let _state = { data: null, selectedLetter: null, activeTab: 'letters' };

export async function renderAlphabet() {
  let data = store.get('alphabetData');
  if (!data) {
    data = await fetch('data/alphabet/letters.json').then(r => r.json());
    store.set('alphabetData', data);
  }
  _state.data = data;
  _state.selectedLetter = null;
  _state.activeTab = 'letters';
  _render();
}

const TYPE_LABELS = { sun: '☀️ Solaire', moon: '🌙 Lunaire', vowel: 'Voyelle' };
const TYPE_COLORS = { sun: '#d29922', moon: '#58a6ff', vowel: '#3fb950' };

function _render() {
  const { data, activeTab, selectedLetter } = _state;
  const tabIndex = TABS.findIndex(t => t.id === activeTab);

  $app().innerHTML = `
    ${renderHeader({ title: 'Alphabet', back: '/home' })}
    ${renderTabBar(TABS, activeTab)}
    <div class="swipe-tabs-container has-bottom-nav" id="alpha-swipe-container">
      <div class="swipe-tabs-track" id="alpha-swipe-track"
           style="width:300%;transform:translateX(-${tabIndex * 33.333}%);transition:none">
        <div class="swipe-tabs-panel" style="width:33.333%">${_renderLettersGrid(data.letters)}</div>
        <div class="swipe-tabs-panel" style="width:33.333%">${_renderDiacritics(data.diacritics)}</div>
        <div class="swipe-tabs-panel" style="width:33.333%">${_renderRules(data.rules)}</div>
      </div>
    </div>
    ${selectedLetter ? _renderLetterModal(selectedLetter) : ''}
    ${renderBottomNav('home')}
  `;

  _bindEvents();
  feather.replace();
}

function _switchTab(index) {
  if (index < 0 || index >= TABS.length) return;
  _state.activeTab = TABS[index].id;

  document.querySelectorAll('.tab-bar__tab').forEach((tab, i) => {
    tab.classList.toggle('tab-bar__tab--active', i === index);
  });

  const track = document.getElementById('alpha-swipe-track');
  if (track) {
    track.style.transition = 'transform 0.3s ease';
    track.style.transform = `translateX(-${index * 33.333}%)`;
  }
}

function _bindEvents() {
  // Tab clicks — switch without full re-render
  $app().querySelectorAll('.tab-bar__tab').forEach((btn, i) => {
    btn.addEventListener('click', () => _switchTab(i));
  });

  // Letter card click → modal (re-render needed)
  $app().querySelectorAll('.alpha-card').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.idx);
      _state.selectedLetter = _state.data.letters[idx];
      _render();
    });
  });

  // Audio play buttons
  $app().querySelectorAll('[data-play-ar]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      playWord(btn.dataset.playAr, 'ar-SA');
    });
  });

  // Modal close
  document.getElementById('modal-close')?.addEventListener('click', () => {
    _state.selectedLetter = null;
    _render();
  });
  document.getElementById('modal-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'modal-overlay') {
      _state.selectedLetter = null;
      _render();
    }
  });

  // Swipe
  _bindSwipe();
}

function _bindSwipe() {
  const container = document.getElementById('alpha-swipe-container');
  const track = document.getElementById('alpha-swipe-track');
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
      const tabIdx = TABS.findIndex(t => t.id === _state.activeTab);
      const base = -tabIdx * 33.333;
      track.style.transform = `translateX(calc(${base}% + ${dx}px))`;
    }
  }, { passive: false });

  container.addEventListener('touchend', e => {
    if (!dragging) return;
    dragging = false;
    if (!isHorizontal) return;
    const dx = e.changedTouches[0].clientX - startX;
    const tabIdx = TABS.findIndex(t => t.id === _state.activeTab);
    if (dx < -80) _switchTab(tabIdx + 1);
    else if (dx > 80) _switchTab(tabIdx - 1);
    else {
      track.style.transition = 'transform 0.3s ease';
      track.style.transform = `translateX(-${tabIdx * 33.333}%)`;
    }
  }, { passive: true });
}

function _renderLettersGrid(letters) {
  return `
    <div class="alpha-grid">
      ${letters.map((l, i) => `
        <div class="alpha-card" data-idx="${i}">
          <div class="alpha-card__letter text-ar">${escapeHtml(l.unicode)}</div>
          <div class="alpha-card__name">${escapeHtml(l.name)}</div>
          <div class="alpha-card__type" style="color:${TYPE_COLORS[l.type] || '#888'}">${TYPE_LABELS[l.type] || l.type}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function _renderDiacritics(diacritics) {
  return `
    <div class="diacritics-list">
      ${diacritics.map(d => `
        <div class="diacritic-item">
          <div class="diacritic-item__symbol text-ar">${escapeHtml(d.example.letter)}</div>
          <div class="diacritic-item__body">
            <div class="diacritic-item__name">${escapeHtml(d.name)} (${escapeHtml(d.nameAr)})</div>
            <div class="diacritic-item__sound">${escapeHtml(d.sound)}</div>
            <div class="diacritic-item__desc">${escapeHtml(d.description)}</div>
            <div class="diacritic-item__example">
              <span class="text-ar">${escapeHtml(d.example.word)}</span>
              <span class="diacritic-item__translit">${escapeHtml(d.example.wordTranslit)}</span>
              <span>${escapeHtml(d.example.wordMeaning)}</span>
              <button class="vocab-item__play" data-play-ar="${escapeHtml(d.example.word)}" aria-label="Écouter">
                <i data-feather="volume-2"></i>
              </button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function _renderRules(rules) {
  return `
    <div class="grammar-list">
      ${rules.map(r => `
        <div class="grammar-item">
          <div class="grammar-item__title">${escapeHtml(r.title)}</div>
          <div class="grammar-item__ar text-ar" dir="rtl">${escapeHtml(r.titleAr)}</div>
          <p class="grammar-item__explanation">${escapeHtml(r.explanation)}</p>
          ${r.examples ? `
          <div class="grammar-examples">
            ${r.examples.map(ex => `
              <div class="grammar-example">
                <div class="grammar-example__ar text-ar" dir="rtl">${escapeHtml(ex.ar)}</div>
                <div class="grammar-example__translit">${escapeHtml(ex.translit)}</div>
                <div class="grammar-example__fr">${escapeHtml(ex.fr)}</div>
                <button class="vocab-item__play" data-play-ar="${escapeHtml(ex.ar)}" aria-label="Écouter">
                  <i data-feather="volume-2"></i>
                </button>
              </div>
            `).join('')}
          </div>
          ` : ''}
          ${r.sunLetters ? `
          <div class="alpha-sun-moon">
            <div>
              <div style="color:#d29922;font-weight:700;margin-bottom:var(--space-xs)">☀️ Lettres solaires</div>
              <div class="alpha-letter-row text-ar">${r.sunLetters.map(l => escapeHtml(l)).join(' ')}</div>
            </div>
            <div>
              <div style="color:#58a6ff;font-weight:700;margin-bottom:var(--space-xs)">🌙 Lettres lunaires</div>
              <div class="alpha-letter-row text-ar">${r.moonLetters.map(l => escapeHtml(l)).join(' ')}</div>
            </div>
          </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function _renderLetterModal(letter) {
  return `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal alpha-modal">
        <div class="modal__header">
          <div class="modal__title">${escapeHtml(letter.name)} — ${escapeHtml(letter.nameAr)}</div>
          <button class="modal__close" id="modal-close"><i data-feather="x"></i></button>
        </div>
        <div class="alpha-modal__letter text-ar">${escapeHtml(letter.unicode)}</div>
        <div class="alpha-modal__translit">${escapeHtml(letter.transliteration)}</div>
        <div class="alpha-modal__type" style="color:${TYPE_COLORS[letter.type] || '#888'}">${TYPE_LABELS[letter.type] || letter.type}</div>
        <p class="alpha-modal__pronunciation">${escapeHtml(letter.pronunciation)}</p>
        <div class="alpha-forms">
          ${['isolated', 'initial', 'medial', 'final'].map(form => `
            <div class="alpha-form">
              <div class="alpha-form__letter text-ar">${escapeHtml(letter.forms[form])}</div>
              <div class="alpha-form__label">${form === 'isolated' ? 'Isolée' : form === 'initial' ? 'Initiale' : form === 'medial' ? 'Médiale' : 'Finale'}</div>
            </div>
          `).join('')}
        </div>
        ${letter.examples.length ? `
        <div class="alpha-modal__section">Exemples</div>
        ${letter.examples.map(ex => `
          <div class="diacritic-item__example">
            <span class="text-ar">${escapeHtml(ex.word)}</span>
            <span class="diacritic-item__translit">${escapeHtml(ex.translit)}</span>
            <span>${escapeHtml(ex.meaning)}</span>
            <button class="vocab-item__play" data-play-ar="${escapeHtml(ex.word)}" aria-label="Écouter">
              <i data-feather="volume-2"></i>
            </button>
          </div>
        `).join('')}
        ` : ''}
        <button class="primary-btn" data-play-ar="${escapeHtml(letter.unicode)}" style="margin-top:var(--space-lg)">
          Écouter la lettre
        </button>
      </div>
    </div>
  `;
}
