const BASE = 'music/';

const TRACKS = [
  'ww.mp3',
  'turnbacktime.mp3',
  'ghostdata.mp3',
];

export class Music {
  constructor(audio, toggle) {
    this.audio = audio || null;
    this.button = toggle || null;
    if (!this.audio) return;

    this.playlist = TRACKS.slice();
    this.index = 0;
    this.userMuted = false;
    this.errorRun = 0;

    this.audio.volume = 0.35;
    this.audio.loop = false;
    this.audio.src  = BASE + this.playlist[0];

    this.audio.addEventListener('ended', () => this.next());
    this.audio.addEventListener('error', () => this.#onError());
    this.audio.addEventListener('play',  () => this.#sync(true));
    this.audio.addEventListener('pause', () => this.#sync(false));
  }

  #sync(playing) {
    this.button?.setAttribute('aria-pressed', playing ? 'true' : 'false');
  }

  #onError() {
    if (this.errorRun >= this.playlist.length) return;
    this.errorRun += 1;
    this.next();
  }

  start() {
    if (!this.audio || this.userMuted) return;
    this.audio.play().catch(() => {});
  }

  toggle() {
    if (!this.audio) return;
    if (this.audio.paused) {
      this.userMuted = false;
      this.audio.play().catch(() => {});
    } else {
      this.userMuted = true;
      this.audio.pause();
    }
  }

  next() {
    if (!this.audio) return;
    this.index = (this.index + 1) % this.playlist.length;
    this.audio.src = BASE + this.playlist[this.index];
    if (!this.userMuted) this.audio.play().then(() => { this.errorRun = 0; }).catch(() => {});
  }

  dispose() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.removeAttribute('src');
  }
}
