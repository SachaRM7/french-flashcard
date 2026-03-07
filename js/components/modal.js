// js/components/modal.js — Modal d'options

import { escapeHtml } from '../utils.js';

export function renderOptionsModal({ currentOptions = {}, courseConfig = {}, showWrittenToggle = true }) {
  const { shuffle = false, favoritesOnly = false, frontSide = 'front', writtenMode = false, correctionLevel = 'flexible' } = currentOptions;
  const frontLabel = courseConfig.frontLabel || 'Recto';
  const backLabel = courseConfig.backLabel || 'Verso';

  return `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal">
        <div class="modal__header">
          <span class="modal__title">Options</span>
          <button class="modal__close" id="modal-close">✕</button>
        </div>

        <div class="modal-section">
          <div class="modal-option">
            <span>Mélanger les cartes</span>
            <label class="toggle">
              <input type="checkbox" id="opt-shuffle" ${shuffle ? 'checked' : ''}>
              <span class="toggle__slider"></span>
            </label>
          </div>
          <div class="modal-option">
            <span>Favoris uniquement</span>
            <label class="toggle">
              <input type="checkbox" id="opt-favorites" ${favoritesOnly ? 'checked' : ''}>
              <span class="toggle__slider"></span>
            </label>
          </div>
        </div>

        <div class="modal-section">
          <div class="modal-section__title">Recto de la carte</div>
          <div class="direction-btns">
            <button class="direction-btn ${frontSide === 'front' ? 'is-active' : ''}" data-side="front">
              ${escapeHtml(frontLabel)}
            </button>
            <button class="direction-btn ${frontSide === 'back' ? 'is-active' : ''}" data-side="back">
              ${escapeHtml(backLabel)}
            </button>
          </div>
        </div>

        ${showWrittenToggle ? `
        <div class="modal-section">
          <div class="modal-option">
            <span>Mode écrit</span>
            <label class="toggle">
              <input type="checkbox" id="opt-written" ${writtenMode ? 'checked' : ''}>
              <span class="toggle__slider"></span>
            </label>
          </div>
          ${writtenMode ? `
          <div class="correction-btns">
            ${['flexible','moderate','strict'].map(l => `
              <button class="correction-btn ${correctionLevel === l ? 'is-active' : ''}" data-level="${l}">
                ${l.charAt(0).toUpperCase() + l.slice(1)}
              </button>
            `).join('')}
          </div>` : ''}
        </div>` : ''}
      </div>
    </div>
  `;
}

export function showModal(html) {
  const existing = document.getElementById('modal-overlay');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', html);
  requestAnimationFrame(() => {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.style.opacity = '1';
  });
}

export function hideModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.remove();
}

export function showConfirmModal(title, message, onConfirm, onCancel) {
  showModal(`
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal">
        <div class="modal__header">
          <span class="modal__title">${escapeHtml(title)}</span>
          <button class="modal__close" id="modal-close">&#x2715;</button>
        </div>
        <p class="confirm-modal__message">${escapeHtml(message)}</p>
        <div class="confirm-modal__actions">
          <button class="primary-btn" id="confirm-ok">Recommencer</button>
          <button class="secondary-btn" id="confirm-cancel">Annuler</button>
        </div>
      </div>
    </div>
  `);
  const cancel = () => { hideModal(); if (onCancel) onCancel(); };
  document.getElementById('confirm-ok')?.addEventListener('click', () => { hideModal(); onConfirm(); });
  document.getElementById('confirm-cancel')?.addEventListener('click', cancel);
  document.getElementById('modal-close')?.addEventListener('click', cancel);
  document.getElementById('modal-overlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) cancel();
  });
}

export function bindModalEvents(onOptionChange) {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

  overlay.addEventListener('click', e => {
    if (e.target === overlay) hideModal();
  });

  const closeBtn = document.getElementById('modal-close');
  if (closeBtn) closeBtn.addEventListener('click', hideModal);

  const shuffleEl = document.getElementById('opt-shuffle');
  if (shuffleEl) shuffleEl.addEventListener('change', e => onOptionChange({ key: 'shuffle', value: e.target.checked }));

  const favEl = document.getElementById('opt-favorites');
  if (favEl) favEl.addEventListener('change', e => onOptionChange({ key: 'favoritesOnly', value: e.target.checked }));

  const writtenEl = document.getElementById('opt-written');
  if (writtenEl) writtenEl.addEventListener('change', e => onOptionChange({ key: 'writtenMode', value: e.target.checked }));

  overlay.querySelectorAll('.direction-btn').forEach(btn => {
    btn.addEventListener('click', () => onOptionChange({ key: 'frontSide', value: btn.dataset.side }));
  });

  overlay.querySelectorAll('.correction-btn').forEach(btn => {
    btn.addEventListener('click', () => onOptionChange({ key: 'correctionLevel', value: btn.dataset.level }));
  });
}
