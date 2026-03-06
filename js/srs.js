// js/srs.js — Logique de révision espacée Leitner

export const INTERVALS = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
};

export function getNextReviewDate(box) {
  const days = INTERVALS[box] || 1;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function createSRSEntry(courseId, cardId) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    cardId,
    courseId,
    box: 1,
    nextReview: today,
    lastReview: null,
    reviewCount: 0,
    correctCount: 0,
    wrongCount: 0,
    createdAt: today,
  };
}

export function processAnswer(srsEntry, isCorrect) {
  const today = new Date().toISOString().slice(0, 10);
  const newBox = isCorrect ? Math.min(srsEntry.box + 1, 5) : 1;
  return {
    ...srsEntry,
    box: newBox,
    nextReview: getNextReviewDate(newBox),
    lastReview: today,
    reviewCount: srsEntry.reviewCount + 1,
    correctCount: srsEntry.correctCount + (isCorrect ? 1 : 0),
    wrongCount: srsEntry.wrongCount + (isCorrect ? 0 : 1),
  };
}

export function isDueToday(srsEntry) {
  const today = new Date().toISOString().slice(0, 10);
  return srsEntry.nextReview <= today;
}

export function getDueCount(srsEntries) {
  return srsEntries.filter(isDueToday).length;
}

export function getBoxDistribution(srsEntries) {
  return srsEntries.reduce(
    (acc, e) => { acc[e.box] = (acc[e.box] || 0) + 1; return acc; },
    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  );
}
