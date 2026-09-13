export class AudioPool {
  constructor(defaults = {}) {
    this.pool = new Map();
    this.defaults = { volume: 0.7, preload: 'auto', ...defaults };
  }

  register(name, src, opts = {}) {
    const audio = new Audio(src);
    audio.preload = opts.preload ?? this.defaults.preload;
    audio.volume = opts.volume ?? this.defaults.volume;
    this.pool.set(name, audio);
    return audio;
  }

  get(name) {
    return this.pool.get(name);
  }

  play(name) {
    const a = this.pool.get(name);
    if (!a) return;
    a.currentTime = 0;
    a.play().catch(() => {});
  }

  playSrc(src, { volume = this.defaults.volume } = {}) {
    const a = new Audio(src);
    a.volume = volume;
    a.play().catch(() => {});
    return a;
  }
}

export const sfx = new AudioPool();
