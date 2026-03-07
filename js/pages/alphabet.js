// js/pages/alphabet.js — Section alphabet arabe

import { store } from '../store.js';
import { renderHeader } from '../components/header.js';
import { renderTabBar } from '../components/tab-bar.js';
import { renderBottomNav } from '../components/bottom-nav.js';
import { escapeHtml } from '../utils.js';
import { playWord } from '../audio.js';

const $app = () => document.getElementById('app');
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
  const { data, activeTab } = _state;
  const tabs = [
    { id: 'letters', label: 'Lettres' },
    { id: 'diacritics', label: 'Voyelles brèves' },
    { id: 'rules', label: 'Règles' },
  ];

  $app().innerHTML = `
    ${renderHeader({ title: 'Alphabet', back: '/home' })}
    ${renderTabBar(tabs, activeTab)}
    <main class="page-content page-content--nav">
      ${_renderTab()}
    </main>
    ${_state.selectedLetter ? _renderLetterModal(_state.selectedLetter) : ''}
    ${renderBottomNav('home')}
  `;

  $app().querySelectorAll('.tab-bar__tab').forEach(btn => {
    btn.addEventListener('click', () => {
      _state.activeTab = btn.dataset.tabId;
      _state.selectedLetter = null;
      _render();
    });
  });

  $app().querySelectorAll('.alpha-card').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.idx);
      _state.selectedLetter = data.letters[idx];
      _render();
    });
  });

  $app().querySelectorAll('[data-play-ar]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      playWord(btn.dataset.playAr, 'ar-SA');
    });
  });

  document.getElementById('modal-close')?.addEventListener('click', () => {
    _state.selectedLetter = null;
    _render();
  });

  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') {
      _state.selectedLetter = null;
      _render();
    }
  });

  feather.replace();
}

function _renderTab() {
  const { data, activeTab } = _state;
  if (activeTab === 'letters') return _renderLettersGrid(data.letters);
  if (activeTab === 'diacritics') return _renderDiacritics(data.diacritics);
  if (activeTab === 'rules') return _renderRules(data.rules);
  return '';
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
