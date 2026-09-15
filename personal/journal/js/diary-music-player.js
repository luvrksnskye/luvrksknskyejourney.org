const PLAYLIST_URL = 'data/diary-playlist.json';

const $ = (id) => document.getElementById(id);
const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const pad = (n) => String(n).padStart(2, '0');
const fmt = (secs) => (Number.isFinite(secs) && secs >= 0 ? `${pad(Math.floor(secs / 60))}:${pad(Math.floor(secs % 60))}` : '--:--');

function restart(el, className) {
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

class DiaryDeck {
  constructor(root, playlist) {
    this.root = root;
    this.playlist = playlist;
    this.index = 0;
    this.scrubbing = false;
    this.audio = new Audio();
    this.audio.preload = 'metadata';
    this.el = {
      tab: $('deckTab'),
      panel: $('deckPanel'),
      overlay: $('deckOverlay'),
      now: root.querySelector('.deck-now'),
      cover: $('deckCover'),
      label: $('deckLabel'),
      index: $('deckIndex'),
      title: $('deckTitle'),
      artist: $('deckArtist'),
      rail: $('deckRail'),
      tag: $('deckRailTag'),
      current: $('deckCurrent'),
      length: $('deckLength'),
      play: $('deckPlay'),
      prev: $('deckPrev'),
      next: $('deckNext'),
      list: $('deckList')
    };
    this.items = playlist.map((track, i) => this.addItem(track, i));
  }

  get track() {
    return this.playlist[this.index];
  }

  get isOpen() {
    return this.root.classList.contains('is-open');
  }

  addItem(track, i) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    const number = document.createElement('span');
    const text = document.createElement('span');
    const title = document.createElement('span');
    const artist = document.createElement('span');

    button.type = 'button';
    button.className = 'deck-item';
    number.className = 'deck-item-number';
    text.className = 'deck-item-text';
    title.className = 'deck-item-title';
    artist.className = 'deck-item-artist';

    number.textContent = pad(i + 1);
    title.textContent = track.title;
    artist.textContent = track.artist;

    text.append(title, artist);
    button.append(number, text);
    button.addEventListener('click', () => {
      if (i === this.index) this.toggle();
      else this.load(i, { autoplay: true });
    });

    item.append(button);
    this.el.list.append(item);
    return button;
  }

  mount() {
    this.bindAudio();
    this.bindControls();
    this.bindRail();
    this.bindMediaSession();
    this.setOpen(false);
    this.load(0, { autoplay: true });
    requestAnimationFrame(() => this.root.classList.add('is-ready'));
  }

  setOpen(open) {
    this.root.classList.toggle('is-open', open);
    this.el.overlay.classList.toggle('is-active', open);
    this.el.panel.inert = !open;
    this.el.tab.setAttribute('aria-expanded', String(open));
    this.el.tab.setAttribute('aria-label', open ? 'Close music player' : 'Open music player');
    if (open) this.items[this.index]?.scrollIntoView({ block: 'nearest' });
  }

  load(index, { autoplay = false } = {}) {
    const count = this.playlist.length;
    this.index = (index + count) % count;
    const { src, cover, title, artist } = this.track;

    this.audio.src = src;
    this.el.index.textContent = `${pad(this.index + 1)} / ${pad(count)}`;
    this.el.title.textContent = title;
    this.el.artist.textContent = artist;
    this.el.current.textContent = '00:00';
    this.el.length.textContent = '--:--';
    this.el.rail.style.setProperty('--progress', 0);
    restart(this.el.now, 'is-swap');
    this.setCover(cover, title);

    this.items.forEach((button, i) => {
      const active = i === this.index;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    if (this.isOpen) this.items[this.index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        album: 'Skye Journey diary',
        artwork: [{ src: new URL(cover, location.href).href }]
      });
    }

    if (autoplay) this.play();
  }

  setCover(src, title) {
    const img = new Image();
    img.src = src;
    img.decode().catch(() => {}).then(() => {
      if (this.track.cover !== src) return;
      this.el.cover.src = src;
      this.el.cover.alt = `${title} cover`;
    });
  }

  play() {
    return this.audio.play().then(
      () => delete this.root.dataset.hint,
      () => {
        this.root.dataset.hint = 'true';
        this.setState();
      }
    );
  }

  toggle() {
    if (this.audio.paused) this.play();
    else this.audio.pause();
  }

  step(direction) {
    if (direction < 0 && this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }
    this.load(this.index + direction, { autoplay: true });
  }

  setState() {
    const playing = !this.audio.paused;
    const loading = playing && this.root.dataset.buffering;
    this.root.dataset.state = playing ? 'playing' : 'paused';
    this.el.play.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    this.el.label.textContent = loading ? 'loading' : playing ? 'now playing' : 'paused';
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  }

  setBuffering(on) {
    if (on) this.root.dataset.buffering = 'true';
    else delete this.root.dataset.buffering;
    this.setState();
  }

  syncTime() {
    const { currentTime, duration, playbackRate } = this.audio;
    const { rail } = this.el;
    const ratio = duration ? clamp(currentTime / duration) : 0;
    if (!this.scrubbing) rail.style.setProperty('--progress', ratio.toFixed(4));
    this.el.current.textContent = fmt(currentTime);
    this.el.length.textContent = fmt(duration);
    rail.setAttribute('aria-valuemax', String(Math.floor(duration || 0)));
    rail.setAttribute('aria-valuenow', String(Math.floor(currentTime)));
    rail.setAttribute('aria-valuetext', fmt(currentTime));
    if (Number.isFinite(duration) && navigator.mediaSession?.setPositionState) {
      try {
        navigator.mediaSession.setPositionState({ duration, position: currentTime, playbackRate });
      } catch {}
    }
  }

  bindAudio() {
    const { audio } = this;
    audio.addEventListener('play', () => this.setState());
    audio.addEventListener('pause', () => this.setState());
    audio.addEventListener('waiting', () => this.setBuffering(true));
    audio.addEventListener('playing', () => this.setBuffering(false));
    audio.addEventListener('canplay', () => this.setBuffering(false));
    audio.addEventListener('durationchange', () => this.syncTime());
    audio.addEventListener('timeupdate', () => this.syncTime());
    audio.addEventListener('ended', () => this.load(this.index + 1, { autoplay: true }));
  }

  bindControls() {
    this.el.tab.addEventListener('click', () => this.setOpen(!this.isOpen));
    this.el.overlay.addEventListener('click', () => this.setOpen(false));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.setOpen(false);
    });
    this.el.play.addEventListener('click', () => this.toggle());
    this.el.prev.addEventListener('click', () => this.step(-1));
    this.el.next.addEventListener('click', () => this.step(1));
  }

  bindRail() {
    const { rail, tag } = this.el;
    const ratioAt = (e) => {
      const r = rail.getBoundingClientRect();
      return clamp((e.clientX - r.left) / r.width);
    };
    const preview = (ratio) => {
      rail.style.setProperty('--hover', ratio.toFixed(4));
      tag.textContent = fmt(ratio * (this.audio.duration || 0));
    };
    const settle = () => {
      this.scrubbing = false;
      rail.classList.remove('is-scrubbing');
    };

    rail.addEventListener('pointerenter', () => rail.classList.add('is-hover'));
    rail.addEventListener('pointerleave', () => {
      if (!this.scrubbing) rail.classList.remove('is-hover');
    });
    rail.addEventListener('pointermove', (e) => {
      const ratio = ratioAt(e);
      preview(ratio);
      if (this.scrubbing) rail.style.setProperty('--progress', ratio.toFixed(4));
    });
    rail.addEventListener('pointerdown', (e) => {
      if (!this.audio.duration) return;
      this.scrubbing = true;
      rail.setPointerCapture(e.pointerId);
      rail.classList.add('is-hover', 'is-scrubbing');
      const ratio = ratioAt(e);
      preview(ratio);
      rail.style.setProperty('--progress', ratio.toFixed(4));
    });
    rail.addEventListener('pointerup', (e) => {
      if (!this.scrubbing) return;
      settle();
      this.audio.currentTime = ratioAt(e) * this.audio.duration;
      if (e.pointerType !== 'mouse') rail.classList.remove('is-hover');
    });
    rail.addEventListener('pointercancel', () => {
      settle();
      rail.classList.remove('is-hover');
      this.syncTime();
    });
    rail.addEventListener('keydown', (e) => {
      const { duration, currentTime } = this.audio;
      if (!duration) return;
      const jumps = { ArrowLeft: -5, ArrowRight: 5, PageDown: -duration * 0.1, PageUp: duration * 0.1 };
      let target = null;
      if (e.key in jumps) target = currentTime + jumps[e.key];
      else if (e.key === 'Home') target = 0;
      else if (e.key === 'End') target = duration - 0.5;
      if (target === null) return;
      e.preventDefault();
      this.audio.currentTime = clamp(target, 0, duration);
    });
  }

  bindMediaSession() {
    if (!('mediaSession' in navigator)) return;
    const actions = {
      play: () => this.play(),
      pause: () => this.audio.pause(),
      previoustrack: () => this.step(-1),
      nexttrack: () => this.step(1),
      seekto: (details) => {
        if (Number.isFinite(details.seekTime)) this.audio.currentTime = details.seekTime;
      }
    };
    for (const [action, handler] of Object.entries(actions)) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {}
    }
  }
}

const root = $('diaryDeck');

if (root) {
  fetch(PLAYLIST_URL)
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
    .then((playlist) => {
      if (!Array.isArray(playlist) || !playlist.length) throw new Error('empty playlist');
      new DiaryDeck(root, playlist).mount();
    })
    .catch(() => {
      root.hidden = true;
    });
}
