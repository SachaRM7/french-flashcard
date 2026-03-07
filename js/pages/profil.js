// js/pages/profil.js — Profil, stats, préférences

import { store } from '../store.js';
import { navigate } from '../router.js';
import { renderHeader } from '../components/header.js';
import { renderBottomNav } from '../components/bottom-nav.js';
import { db } from '../db.js';
import { getBoxDistribution } from '../srs.js';

const $app = () => document.getElementById('app');

export async function renderProfil() {
  const course = store.get('currentCourse');
  if (!course) { navigate('/'); return; }

  const [srsAll, stats, prefs] = await Promise.all([
    db.getSRS(course.id),
    db.getStats(course.id),
    db.getPreferences(),
  ]);

  const boxDist = getBoxDistribution(srsAll);
  const acquired = (boxDist[4] || 0) + (boxDist[5] || 0);

  $app().innerHTML = `
    ${renderHeader({ title: 'Profil', back: '/home' })}
    <main class="page-content page-content--nav">

      <div class="profil-section">
        <div class="profil-section__title">Progression</div>
        <div class="profil-stats">
          <div class="profil-stat">
            <div class="profil-stat__value">${srsAll.length}</div>
            <div class="profil-stat__label">Mots rencontrés</div>
          </div>
          <div class="profil-stat">
            <div class="profil-stat__value">${acquired}</div>
            <div class="profil-stat__label">Mots acquis</div>
          </div>
          <div class="profil-stat">
            <div class="profil-stat__value">${stats.totalLessonsCompleted || 0}</div>
            <div class="profil-stat__label">Leçons terminées</div>
          </div>
        </div>
      </div>

      <div class="profil-section">
        <div class="profil-section__title">Streak</div>
        <div class="profil-streak">
          <div class="profil-streak__current">
            <div class="profil-streak__fire">🔥</div>
            <div class="profil-streak__count">${stats.currentStreak || 0}</div>
            <div class="profil-streak__label">Jours de suite</div>
          </div>
          <div class="profil-streak__best">
            <div class="profil-streak__best-count">${stats.longestStreak || 0}</div>
            <div class="profil-streak__label">Record</div>
          </div>
        </div>
      </div>

      ${(stats.weeklyActivity && stats.weeklyActivity.some(v => v > 0)) ? `
      <div class="profil-section">
        <div class="profil-section__title">Activité de la semaine</div>
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

      <div class="profil-section">
        <div class="profil-section__title">Préférences</div>
        <div class="modal-option">
          <span>Thème sombre</span>
          <label class="toggle">
            <input type="checkbox" id="pref-dark" ${prefs.theme !== 'light' ? 'checked' : ''}>
            <span class="toggle__slider"></span>
          </label>
        </div>
        <div class="modal-option">
          <span>Afficher la translitération par défaut</span>
          <label class="toggle">
            <input type="checkbox" id="pref-translit" ${prefs.showTranslit !== false ? 'checked' : ''}>
            <span class="toggle__slider"></span>
          </label>
        </div>
        <div class="modal-option">
          <span>Afficher les harakats par défaut</span>
          <label class="toggle">
            <input type="checkbox" id="pref-harakats" ${prefs.showHarakats !== false ? 'checked' : ''}>
            <span class="toggle__slider"></span>
          </label>
        </div>
        <div class="modal-option">
          <span>Niveau de correction</span>
          <div class="correction-btns">
            <button class="correction-btn ${(prefs.correctionLevel || 'flexible') === 'strict' ? 'is-active' : ''}" data-correction="strict">Strict</button>
            <button class="correction-btn ${(prefs.correctionLevel || 'flexible') === 'flexible' ? 'is-active' : ''}" data-correction="flexible">Flexible</button>
            <button class="correction-btn ${(prefs.correctionLevel || 'flexible') === 'loose' ? 'is-active' : ''}" data-correction="loose">Souple</button>
          </div>
        </div>
      </div>

      <div class="profil-section">
        <div class="profil-section__title">Données</div>
        <div class="profil-actions">
          <button class="secondary-btn" id="btn-export">Exporter mes données</button>
          <label class="secondary-btn" style="cursor:pointer;text-align:center">
            Importer des données
            <input type="file" id="btn-import" accept=".json" style="display:none">
          </label>
        </div>
      </div>

    </main>
    ${renderBottomNav('profil')}
  `;

  _bindEvents(prefs, course);
  feather.replace();
}

function _bindEvents(prefs, course) {
  const savePrefs = async (updates) => {
    const current = await db.getPreferences();
    const newPrefs = { ...current, ...updates };
    await db.savePreferences(newPrefs);
    store.set('preferences', newPrefs);
    return newPrefs;
  };

  document.getElementById('pref-dark')?.addEventListener('change', async (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    await savePrefs({ theme });
    document.body.classList.toggle('light-mode', theme === 'light');
  });

  document.getElementById('pref-translit')?.addEventListener('change', async (e) => {
    await savePrefs({ showTranslit: e.target.checked });
  });

  document.getElementById('pref-harakats')?.addEventListener('change', async (e) => {
    await savePrefs({ showHarakats: e.target.checked });
  });

  $app().querySelectorAll('[data-correction]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await savePrefs({ correctionLevel: btn.dataset.correction });
      $app().querySelectorAll('[data-correction]').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
    });
  });

  document.getElementById('btn-export')?.addEventListener('click', async () => {
    const [srsAll, stats, favs, prefs] = await Promise.all([
      db.getSRS(course.id),
      db.getStats(course.id),
      db.getFavorites(course.id),
      db.getPreferences(),
    ]);
    const payload = JSON.stringify({ version: '1.0', courseId: course.id, exportedAt: new Date().toISOString(), srs: srsAll, stats, favorites: favs, preferences: prefs }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `helloarabic-${course.id}-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('btn-import')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.srs) {
        for (const entry of data.srs) {
          await db.updateSRS(course.id, entry.cardId, entry);
        }
      }
      if (data.stats) await db.saveStats(course.id, data.stats);
      if (data.favorites) await db.saveFavorites(course.id, data.favorites);
      if (data.preferences) await db.savePreferences(data.preferences);
      alert('Données importées avec succès !');
      renderProfil();
    } catch (err) {
      alert('Erreur lors de l\'import : ' + err.message);
    }
  });
}
