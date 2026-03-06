// js/store.js — État global réactif

class Store {
  constructor() {
    this._state = {
      currentCourse: null,
      courses: null,
      themes: null,
      decks: null,
      currentDeck: null,
      currentLesson: null,
      lessonIndex: null,
      preferences: null,
      favorites: null,
      srsData: null,
    };
    this._listeners = new Map();
  }

  get(key) {
    return this._state[key];
  }

  set(key, value) {
    this._state[key] = value;
    const callbacks = this._listeners.get(key);
    if (callbacks) {
      callbacks.forEach(cb => cb(value));
    }
  }

  subscribe(key, callback) {
    if (!this._listeners.has(key)) {
      this._listeners.set(key, new Set());
    }
    this._listeners.get(key).add(callback);
    return () => this._listeners.get(key).delete(callback);
  }
}

export const store = new Store();
