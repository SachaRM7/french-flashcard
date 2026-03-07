// js/components/player.js — Lecteur audio pour les leçons

import { playAudioFile, pause, resume, seekTo, setSpeed, onTimeUpdate, getDuration, getCurrentTime } from '../audio.js';

const SPEEDS = [0.75, 1.0, 1.25, 1.5];
let _speed = 1.0;
let _isPlaying = false;

export function renderPlayer(lesson) {
  return `
    <div class="player" id="lesson-player">
      <div class="player__progress-wrap">
        <span class="player__time" id="player-current">0:00</span>
        <input class="player__progress" id="player-progress" type="range" min="0" max="100" value="0" step="0.1">
        <span class="player__time" id="player-duration">0:00</span>
      </div>
      <div class="player__controls">
        <button class="player__btn" id="player-rewind" title="Reculer 15s">
          <i data-feather="rotate-ccw"></i>
        </button>
        <button class="player__btn player__btn--play" id="player-play" title="Lecture">
          <i data-feather="play"></i>
        </button>
        <button class="player__btn" id="player-forward" title="Avancer 15s">
          <i data-feather="rotate-cw"></i>
        </button>
        <button class="player__btn player__btn--speed" id="player-speed" title="Vitesse">
          ${_speed}x
        </button>
      </div>
    </div>
  `;
}

function _formatTime(secs) {
  const s = Math.floor(secs);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function bindPlayerEvents(lesson) {
  const playBtn = document.getElementById('player-play');
  const rewindBtn = document.getElementById('player-rewind');
  const forwardBtn = document.getElementById('player-forward');
  const speedBtn = document.getElementById('player-speed');
  const progressEl = document.getElementById('player-progress');
  const currentEl = document.getElementById('player-current');
  const durationEl = document.getElementById('player-duration');

  if (!playBtn) return;

  if (lesson.audioUrl) {
    playAudioFile(lesson.audioUrl);
    _isPlaying = true;
    _updatePlayBtn();
  }

  playBtn.addEventListener('click', () => {
    if (_isPlaying) {
      pause();
      _isPlaying = false;
    } else {
      resume();
      _isPlaying = true;
    }
    _updatePlayBtn();
  });

  rewindBtn?.addEventListener('click', () => {
    const t = Math.max(0, getCurrentTime() - 15);
    seekTo(t);
  });

  forwardBtn?.addEventListener('click', () => {
    const dur = getDuration();
    const t = Math.min(dur, getCurrentTime() + 15);
    seekTo(t);
  });

  speedBtn?.addEventListener('click', () => {
    const idx = SPEEDS.indexOf(_speed);
    _speed = SPEEDS[(idx + 1) % SPEEDS.length];
    setSpeed(_speed);
    speedBtn.textContent = `${_speed}x`;
  });

  progressEl?.addEventListener('input', () => {
    const dur = getDuration();
    if (dur) seekTo((parseFloat(progressEl.value) / 100) * dur);
  });

  onTimeUpdate((current, duration) => {
    if (currentEl) currentEl.textContent = _formatTime(current);
    if (durationEl && duration) durationEl.textContent = _formatTime(duration);
    if (progressEl && duration) progressEl.value = (current / duration) * 100;

    // Karaoké: highlight active dialogue line
    if (lesson.dialogue) {
      lesson.dialogue.forEach(line => {
        const el = document.getElementById(`line-${line.id}`);
        if (!el) return;
        const active = current >= line.audioStart && current < line.audioEnd;
        el.classList.toggle('dialogue-line--active', active);
        if (active) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  });

  function _updatePlayBtn() {
    if (!playBtn) return;
    playBtn.innerHTML = _isPlaying
      ? '<i data-feather="pause"></i>'
      : '<i data-feather="play"></i>';
    feather.replace();
  }
}
