// js/pages/words-home.js — Thèmes → decks
// TODO: Phase 2

import { renderHeader } from '../components/header.js';

const $app = () => document.getElementById('app');

export function renderWordsHome() {
  $app().innerHTML = `
    ${renderHeader({ title: 'Vocabulaire', back: '/home' })}
    <main class="page-content">
      <p style="color:var(--text-secondary);text-align:center;margin-top:var(--space-4xl)">
        Mode Mots — Phase 2
      </p>
    </main>
  `;
  feather.replace();
}

export function renderWordsTheme(params) {
  renderWordsHome();
}
