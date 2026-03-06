// js/audio.js — TTS + HTMLAudio unifié

let _audioEl = null;
let _timeUpdateCallback = null;

function getAudio() {
  if (!_audioEl) {
    _audioEl = new Audio();
    _audioEl.addEventListener('timeupdate', () => {
      if (_timeUpdateCallback) _timeUpdateCallback(_audioEl.currentTime);
    });
  }
  return _audioEl;
}

export function playWord(text, lang) {
  return new Promise((resolve) => {
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.8;
    utter.onend = resolve;
    utter.onerror = resolve;
    speechSynthesis.speak(utter);
  });
}

export function playAudioFile(url) {
  return new Promise((resolve, reject) => {
    const audio = getAudio();
    audio.src = url;
    audio.load();
    audio.onended = resolve;
    audio.onerror = reject;
    audio.play().catch(reject);
  });
}

export function pause() {
  getAudio().pause();
  speechSynthesis.pause();
}

export function resume() {
  getAudio().play();
  speechSynthesis.resume();
}

export function stop() {
  speechSynthesis.cancel();
  const audio = getAudio();
  audio.pause();
  audio.currentTime = 0;
  audio.src = '';
}

export function seekTo(seconds) {
  getAudio().currentTime = seconds;
}

export function setSpeed(rate) {
  getAudio().playbackRate = rate;
}

export function onTimeUpdate(callback) {
  _timeUpdateCallback = callback;
}

export function getDuration() {
  return getAudio().duration || 0;
}

export function getCurrentTime() {
  return getAudio().currentTime || 0;
}
