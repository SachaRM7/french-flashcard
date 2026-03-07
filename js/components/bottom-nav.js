// js/components/bottom-nav.js — Barre de navigation fixe en bas

const NAV_ITEMS = [
  { id: 'home',          path: '/home',          icon: 'home',           label: 'Accueil' },
  { id: 'mots',          path: '/mots',          icon: 'book-open',      label: 'Mots' },
  { id: 'conversations', path: '/conversations', icon: 'message-circle', label: 'Conv.' },
  { id: 'revision',      path: '/revision',      icon: 'refresh-cw',     label: 'Révision' },
  { id: 'profil',        path: '/profil',        icon: 'user',           label: 'Profil' },
];

/**
 * @param {string} activeId - id de l'onglet actif ('home'|'mots'|'conversations'|'revision'|'profil')
 * @returns {string} HTML
 */
export function renderBottomNav(activeId) {
  return `
    <nav class="bottom-nav" aria-label="Navigation principale">
      ${NAV_ITEMS.map(item => `
        <a class="bottom-nav__item ${item.id === activeId ? 'bottom-nav__item--active' : ''}"
           data-navigate="${item.path}"
           href="#${item.path}"
           aria-label="${item.label}"
           aria-current="${item.id === activeId ? 'page' : 'false'}">
          <i data-feather="${item.icon}"></i>
          <span class="bottom-nav__label">${item.label}</span>
        </a>
      `).join('')}
    </nav>
  `;
}
