const MUSIC = 'new_version-assets/music/';
const SFX = 'new_version-assets/sfx/';
const STORE_KEY = 'skye-about-muted';

const INTRO = MUSIC + 'Main_song.mp3';
const PLAYLIST = [
  MUSIC + 'playlist/astralyearning.mp3',
  MUSIC + 'playlist/subnautica2.mp3',
  MUSIC + 'playlist/thousandstrings.mp3',
  MUSIC + 'playlist/lilypads.mp3',
  MUSIC + 'playlist/belowzero.mp3',
  MUSIC + 'playlist/earth.mp3',
  MUSIC + 'playlist/floating.mp3',
  MUSIC + 'playlist/heavens.mp3',
  MUSIC + 'TBL3_AFTER_loop.mp3'
];

const INTRO_VOL = 0.52;
const PLAYLIST_VOL = 0.4;
const DUCK_VOL = 0.22;
const FADE_IN = 2500;
const GAP = 700;

const fades = new WeakMap();

function fadeTo(el, target, ms) {
  clearInterval(fades.get(el));
  if (ms <= 0) {
    el.volume = target;
    return;
  }
  const from = el.volume;
  const start = performance.now();
  const id = setInterval(() => {
    const t = Math.min(1, (performance.now() - start) / ms);
    el.volume = Math.max(0, Math.min(1, from + (target - from) * t));
    if (t >= 1) clearInterval(id);
  }, 40);
  fades.set(el, id);
}

function readMuted() {
  try {
    return localStorage.getItem(STORE_KEY) === '1';
  } catch (_) {
    return false;
  }
}

function saveMuted(muted) {
  try {
    localStorage.setItem(STORE_KEY, muted ? '1' : '0');
  } catch (_) {}
}

const MIN_GAP = 650;

class SfxPool {
  #pool = new Map();
  #muted = false;
  #last = 0;

  setMuted(muted) {
    this.#muted = muted;
  }

  warm(names) {
    for (const name of names) this.#slot(name);
  }

  #slot(name) {
    let arr = this.#pool.get(name);
    if (arr) return arr;
    arr = Array.from({ length: 3 }, () => {
      const el = new Audio(SFX + name + '.mp3');
      el.preload = 'auto';
      return el;
    });
    this.#pool.set(name, arr);
    return arr;
  }

  play(name, vol = 0.6) {
    if (this.#muted) return;
    const now = performance.now();
    if (now - this.#last < MIN_GAP) return;
    this.#last = now;

    const arr = this.#slot(name);
    const target = arr.find((a) => a.paused || a.ended) || arr[0];
    try {
      target.currentTime = 0;
      target.volume = vol;
      target.play().catch(() => {});
    } catch (_) {}
  }
}

export const sfx = new SfxPool();

export class Music {
  constructor(el) {
    this.el = el;
    this.index = -1;
    this.started = false;
    this.ducked = false;
    this.muted = readMuted();
    this.failures = 0;
    this.gapTimer = 0;

    el.loop = false;
    el.volume = 0;
    el.addEventListener('ended', () => this.next());
    el.addEventListener('playing', () => {
      this.failures = 0;
      fadeTo(el, this.targetVol(), FADE_IN);
    });
    el.addEventListener('error', () => {
      if (!this.started || !el.getAttribute('src')) return;
      this.failures += 1;
      if (this.failures <= PLAYLIST.length) this.next();
    });

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
      } catch (_) {}
    }

    this.applyMuted();
  }

  get onIntro() {
    return this.index === -1;
  }

  start() {
    if (this.started) return;
    this.started = true;
    this.index = -1;
    this.play(INTRO).then((ok) => {
      if (!ok && this.el.paused) this.started = false;
    });
  }

  unlock() {
    if (!this.started) {
      this.start();
      return;
    }
    if (this.el.paused && !this.el.ended && !this.gapTimer && this.el.getAttribute('src')) {
      this.el.play().catch(() => {});
    }
  }

  next() {
    if (!this.started || this.gapTimer) return;
    this.index = (this.index + 1) % PLAYLIST.length;
    const src = PLAYLIST[this.index];
    this.gapTimer = setTimeout(() => {
      this.gapTimer = 0;
      this.play(src);
    }, GAP);
  }

  play(src) {
    const el = this.el;
    clearInterval(fades.get(el));
    el.volume = 0;
    el.src = src;
    this.describe(src);
    return el.play().then(
      () => true,
      (err) => !(err && err.name === 'NotAllowedError')
    );
  }

  describe(src) {
    if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
    const title = src.split('/').pop().replace(/\.mp3$/, '').replace(/[_-]+/g, ' ');
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist: 'Skye Journey',
        album: 'About Skye'
      });
    } catch (_) {}
  }

  targetVol() {
    if (this.muted) return 0;
    if (this.ducked) return DUCK_VOL;
    return this.onIntro ? INTRO_VOL : PLAYLIST_VOL;
  }

  duck(on) {
    if (this.ducked === on) return;
    this.ducked = on;
    if (this.started) fadeTo(this.el, this.targetVol(), 1400);
  }

  toggleMuted() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  setMuted(muted) {
    this.muted = muted;
    saveMuted(muted);
    this.applyMuted();
  }

  applyMuted() {
    sfx.setMuted(this.muted);
    if (!this.started) return;
    fadeTo(this.el, this.targetVol(), 600);
  }
}
