// js/db.js — Couche IndexedDB

class Database {
  constructor() {
    this._db = null;
  }

  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('helloarabic', 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('srs')) {
          const srsStore = db.createObjectStore('srs', { keyPath: 'key' });
          srsStore.createIndex('courseId', 'courseId', { unique: false });
          srsStore.createIndex('nextReview', 'nextReview', { unique: false });
        }
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'courseId' });
        }
        if (!db.objectStoreNames.contains('lessonProgress')) {
          const lpStore = db.createObjectStore('lessonProgress', { keyPath: 'key' });
          lpStore.createIndex('courseId', 'courseId', { unique: false });
        }
        if (!db.objectStoreNames.contains('stats')) {
          db.createObjectStore('stats', { keyPath: 'courseId' });
        }
      };

      request.onsuccess = (event) => {
        this._db = event.target.result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  _store(name, mode = 'readonly') {
    return this._db.transaction(name, mode).objectStore(name);
  }

  _get(storeName, key) {
    return new Promise((resolve, reject) => {
      const req = this._store(storeName).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  _put(storeName, value) {
    return new Promise((resolve, reject) => {
      const req = this._store(storeName, 'readwrite').put(value);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  _getAll(storeName) {
    return new Promise((resolve, reject) => {
      const req = this._store(storeName).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getPreferences() {
    const prefs = await this._get('preferences', 'global');
    return prefs || {
      id: 'global',
      theme: 'dark',
      lastCourse: null,
      showTranslit: true,
      showHarakats: true,
      defaultFrontSide: 'front',
      correctionLevel: 'flexible',
      autoPlay: false,
      audioSpeed: 1.0,
    };
  }

  async savePreferences(prefs) {
    await this._put('preferences', { ...prefs, id: 'global' });
  }

  async getSRS(courseId) {
    const all = await this._getAll('srs');
    return all.filter(e => e.courseId === courseId);
  }

  async updateSRS(courseId, cardId, data) {
    const key = `${courseId}:${cardId}`;
    await this._put('srs', { ...data, key, courseId, cardId });
  }

  async getDueWords(courseId) {
    const today = new Date().toISOString().slice(0, 10);
    const all = await this.getSRS(courseId);
    return all.filter(e => e.nextReview <= today);
  }

  async getFavorites(courseId) {
    const favs = await this._get('favorites', courseId);
    return favs || { courseId, words: [], lessons: [], phrases: [] };
  }

  async saveFavorites(courseId, favorites) {
    await this._put('favorites', { ...favorites, courseId });
  }

  async getLessonProgress(courseId, lessonId) {
    return await this._get('lessonProgress', `${courseId}:${lessonId}`) || null;
  }

  async saveLessonProgress(courseId, lessonId, data) {
    const key = `${courseId}:${lessonId}`;
    await this._put('lessonProgress', { ...data, key, courseId, lessonId });
  }

  async getStats(courseId) {
    const stats = await this._get('stats', courseId);
    return stats || {
      courseId,
      totalWordsEncountered: 0,
      totalWordsAcquired: 0,
      totalLessonsCompleted: 0,
      totalReviewSessions: 0,
      totalCorrectAnswers: 0,
      totalWrongAnswers: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
      monthlyWords: [],
    };
  }

  async saveStats(courseId, data) {
    await this._put('stats', { ...data, courseId });
  }
}

export const db = new Database();
