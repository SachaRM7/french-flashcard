// js/pages/conv-home.js — Accueil conversations (niveaux, thèmes)
// TODO: Phase 3

import { renderHeader } from '../components/header.js';

const $app = () => document.getElementById('app');

export function renderConvHome() {
  $app().innerHTML = `
    ${renderHeader({ title: 'Conversations', back: '/home' })}
    <main class="page-content">
      <p style="color:var(--text-secondary);text-align:center;margin-top:var(--space-4xl)">
        Conversations — Phase 3
      </p>
    </main>
  `;
  feather.replace();
}
