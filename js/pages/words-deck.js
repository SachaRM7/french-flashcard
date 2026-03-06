// js/pages/words-deck.js — Vue d'un deck (stats, choix du mode)
// TODO: Phase 2

import { renderHeader } from '../components/header.js';

const $app = () => document.getElementById('app');

export function renderWordsDeck(params) {
  $app().innerHTML = `
    ${renderHeader({ title: 'Deck', back: '/mots' })}
    <main class="page-content">
      <p style="color:var(--text-secondary);text-align:center;margin-top:var(--space-4xl)">
        Deck — Phase 2
      </p>
    </main>
  `;
  feather.replace();
}
