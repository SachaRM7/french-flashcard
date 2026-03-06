// js/utils.js — Fonctions utilitaires

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function removeHarakats(str) {
  return str.replace(/[\u064B-\u065F\u0670]/g, '');
}

export function removeFrenchAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeAnswer(str, level = 'flexible') {
  let s = str.trim().toLowerCase();
  if (level === 'flexible' || level === 'moderate') {
    s = removeFrenchAccents(s);
  }
  if (level === 'flexible') {
    s = s.replace(/[^a-z0-9\u0600-\u06ff\s]/g, '');
  }
  return s.trim();
}

export function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function checkWrittenAnswer(userAnswer, correctAnswer, level = 'flexible') {
  const u = normalizeAnswer(userAnswer, level);
  const c = normalizeAnswer(correctAnswer, level);
  if (u === c) return true;
  if (level === 'strict') return false;
  const maxDist = level === 'flexible' ? 2 : 1;
  return levenshtein(u, c) <= maxDist;
}

export function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function isToday(dateStr) {
  const today = new Date().toISOString().slice(0, 10);
  return dateStr === today;
}

export function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1 + 'T00:00:00');
  const d2 = new Date(dateStr2 + 'T00:00:00');
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}
