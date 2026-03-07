// js/components/tab-bar.js — Navigation par onglets

/**
 * @param {Array<{id: string, label: string}>} tabs
 * @param {string} activeId
 * @returns {string} HTML
 */
export function renderTabBar(tabs, activeId) {
  return `
    <div class="tab-bar">
      ${tabs.map(tab => `
        <button class="tab-bar__tab ${tab.id === activeId ? 'tab-bar__tab--active' : ''}"
          data-tab-id="${tab.id}">
          ${tab.label}
        </button>
      `).join('')}
    </div>
  `;
}
