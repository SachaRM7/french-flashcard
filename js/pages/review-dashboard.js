// js/pages/review-dashboard.js — Dashboard SRS

import { store } from '../store.js';
import { navigate } from '../router.js';
import { renderHeader } from '../components/header.js';
import { renderBottomNav } from '../components/bottom-nav.js';
import { db } from '../db.js';
import { getBoxDistribution, getDueCount } from '../srs.js';
import { shuffle } from '../utils.js';

const $app = () => document.getElementById('app');

const BOX_COLORS = ['#f85149', '#d29922', '#58a6ff', '#3fb950', '#8957e5'];
const BOX_LABELS = ['Boîte 1', 'Boîte 2', 'Boîte 3', 'Boîte 4', 'Boîte 5'];

export async function renderReviewDashboard() {
  const course = store.get('currentCourse');
  if (!course) { navigate('/'); return; }

  const [srsAll, stats] = await Promise.all([
    db.getSRS(course.id),
    db.getStats(course.id),
  ]);

  const dueEntries = await db.getDueWords(course.id);
  const dueCount = dueEntries.length;
  const boxDist = getBoxDistribution(srsAll);
  const total = srsAll.length;
  const acquired = (boxDist[4] || 0) + (boxDist[5] || 0);
  const maxBox = Math.max(...Object.values(boxDist), 1);

  $app().innerHTML = `
    ${renderHeader({ title: 'Révision', back: '/home' })}
    <main class="page-content page-content--nav">

      <div class="review-hero ${dueCount > 0 ? 'review-hero--due' : 'review-hero--done'}">
        <div class="review-hero__count">${dueCount}</div>
        <div class="review-hero__label">mot${dueCount !== 1 ? 's' : ''} à réviser aujourd'hui</div>
        ${dueCount > 0
          ? `<button class="primary-btn review-hero__btn" id="btn-start-review">Commencer la révision</button>`
          : `<div class="review-hero__done">Tout est à jour ! 🎉</div>`
        }
      </div>

      <div class="review-section">
        <div class="review-section__title">Distribution des boîtes</div>
        <div class="review-boxes">
          ${[1,2,3,4,5].map(box => {
            const count = boxDist[box] || 0;
            const pct = maxBox > 0 ? (count / maxBox) * 100 : 0;
            return `
              <div class="review-box-row">
                <div class="review-box-row__label">${BOX_LABELS[box - 1]}</div>
                <div class="review-box-row__bar-wrap">
                  <div class="review-box-row__bar" style="width:${pct}%;background:${BOX_COLORS[box - 1]}"></div>
                </div>
                <div class="review-box-row__count">${count}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="review-stats">
        <div class="review-stat">
          <div class="review-stat__value">${acquired}<span class="review-stat__total">/${total}</span></div>
          <div class="review-stat__label">Acquis</div>
        </div>
        <div class="review-stat">
          <div class="review-stat__value">${stats.currentStreak || 0}</div>
          <div class="review-stat__label">Jours de suite</div>
        </div>
        <div class="review-stat">
          <div class="review-stat__value">${stats.longestStreak || 0}</div>
          <div class="review-stat__label">Record</div>
        </div>
      </div>

      ${(stats.weeklyActivity && stats.weeklyActivity.some(v => v > 0)) ? `
      <div class="review-section">
        <div class="review-section__title">Activité cette semaine</div>
        <div class="review-week">
          ${['L','M','M','J','V','S','D'].map((day, i) => {
            const val = stats.weeklyActivity[i] || 0;
            const maxW = Math.max(...stats.weeklyActivity, 1);
            const pct = (val / maxW) * 100;
            return `
              <div class="review-week__col">
                <div class="review-week__bar-wrap">
                  <div class="review-week__bar" style="height:${pct}%"></div>
                </div>
                <div class="review-week__day">${day}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      ` : ''}

    </main>
    ${renderBottomNav('revision')}
  `;

  document.getElementById('btn-start-review')?.addEventListener('click', async () => {
    // Load full card data for due entries
    const decks = store.get('decks');
    if (!decks) {
      navigate('/mots');
      return;
    }
    const cardMap = {};
    decks.forEach(deck => {
      deck.cards.forEach(card => { cardMap[card.id] = card; });
    });

    const dueCards = dueEntries
      .map(e => cardMap[e.cardId])
      .filter(Boolean);

    if (!dueCards.length) {
      navigate('/revision');
      return;
    }

    store.set('reviewCards', shuffle(dueCards));
    navigate('/revision/session');
  });

  feather.replace();
}
