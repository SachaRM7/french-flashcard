// js/pages/roots.js — Section racines trilittères

import { store } from '../store.js';
import { renderHeader } from '../components/header.js';
import { renderBottomNav } from '../components/bottom-nav.js';
import { escapeHtml } from '../utils.js';
import { playWord } from '../audio.js';

const $app = () => document.getElementById('app');
let _state = { roots: null, selectedRoot: null };

export async function renderRoots() {
  let roots = store.get('rootsData');
  if (!roots) {
    const data = await fetch('data/roots/roots.json').then(r => r.json());
    roots = data.roots;
    store.set('rootsData', roots);
  }
  _state.roots = roots;
  _state.selectedRoot = null;
  _render();
}

const TYPE_COLORS = {
  'verbe': '#58a6ff',
  'nom': '#3fb950',
  'nom d\'action': '#d29922',
  'participe actif': '#8957e5',
  'participe passif': '#f78166',
  'prénom': '#3fb950',
  'nom de lieu': '#d29922',
};

function _render() {
  const { roots, selectedRoot } = _state;

  $app().innerHTML = `
    ${renderHeader({ title: 'Racines', back: '/home' })}
    <main class="page-content page-content--nav">
      <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-xl)">
        L'arabe est basé sur des racines trilittères. Chaque racine donne naissance à une famille de mots partageant le même sens de base.
      </p>
      <div class="roots-list">
        ${roots.map(root => `
          <div class="root-card ${selectedRoot?.id === root.id ? 'is-open' : ''}" data-root-id="${escapeHtml(root.id)}">
            <div class="root-card__header">
              <div class="root-card__letters text-ar">${root.letters.map(l => escapeHtml(l)).join(' - ')}</div>
              <div class="root-card__body">
                <div class="root-card__translit">${escapeHtml(root.transliteration)}</div>
                <div class="root-card__meaning">${escapeHtml(root.meaning)}</div>
              </div>
              <div class="root-card__count">${root.derivatives.length} mots</div>
              <i data-feather="${selectedRoot?.id === root.id ? 'chevron-up' : 'chevron-down'}"></i>
            </div>
            ${selectedRoot?.id === root.id ? `
            <div class="root-card__derivatives">
              ${root.derivatives.map(d => `
                <div class="root-derivative">
                  <div class="root-derivative__ar text-ar" dir="rtl">${escapeHtml(d.ar)}</div>
                  <div class="root-derivative__info">
                    <div class="root-derivative__translit">${escapeHtml(d.translit)}</div>
                    <div class="root-derivative__fr">${escapeHtml(d.fr)}</div>
                    <span class="root-derivative__type" style="color:${TYPE_COLORS[d.type] || '#888'}">${escapeHtml(d.type)}</span>
                    ${d.pattern !== '-' ? `<span class="root-derivative__pattern text-ar">${escapeHtml(d.pattern)}</span>` : ''}
                  </div>
                  <button class="vocab-item__play" data-ar="${escapeHtml(d.ar)}" aria-label="Écouter">
                    <i data-feather="volume-2"></i>
                  </button>
                </div>
              `).join('')}
            </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </main>
    ${renderBottomNav('home')}
  `;

  $app().querySelectorAll('.root-card').forEach(el => {
    el.addEventListener('click', () => {
      const rootId = el.dataset.rootId;
      const root = _state.roots.find(r => r.id === rootId);
      _state.selectedRoot = _state.selectedRoot?.id === rootId ? null : root;
      _render();
    });
  });

  $app().querySelectorAll('[data-ar]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      playWord(btn.dataset.ar, 'ar-SA');
    });
  });

  feather.replace();
}
