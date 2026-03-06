// js/pages/review-dashboard.js — Dashboard SRS
// TODO: Phase 4

import { renderHeader } from '../components/header.js';

const $app = () => document.getElementById('app');

export function renderReviewDashboard() {
  $app().innerHTML = `
    ${renderHeader({ title: 'Révision', back: '/home' })}
    <main class="page-content">
      <p style="color:var(--text-secondary);text-align:center;margin-top:var(--space-4xl)">
        Dashboard SRS — Phase 4
      </p>
    </main>
  `;
  feather.replace();
}
