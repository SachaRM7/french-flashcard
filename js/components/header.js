// js/components/header.js — En-tête réutilisable

import { escapeHtml } from '../utils.js';

export function renderHeader({ title, back = null, actions = [] }) {
  return `
    <header class="page-header">
      ${back
        ? `<button class="back-btn" data-navigate="${escapeHtml(back)}" aria-label="Retour"><i data-feather="arrow-left"></i></button>`
        : '<div></div>'
      }
      <h1 class="page-header__title">${escapeHtml(title)}</h1>
      <div class="page-header__actions">
        ${actions.map(a => `
          <button class="icon-btn" data-action="${escapeHtml(a.id)}" aria-label="${escapeHtml(a.label || '')}">
            <i data-feather="${escapeHtml(a.icon)}"></i>
          </button>
        `).join('')}
      </div>
    </header>
  `;
}
