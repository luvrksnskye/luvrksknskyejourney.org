const A = 'assets/audio/';
const POOL_SIZE = 3;

class SfxPool {
  #pool = new Map();

  #ensure(name) {
    let arr = this.#pool.get(name);
    if (arr) return arr;
    arr = Array.from({ length: POOL_SIZE }, () => {
      const el = new Audio(A + name + '.mp3');
      el.preload = 'auto';
      return el;
    });
    this.#pool.set(name, arr);
    return arr;
  }

  play(name, vol = 1) {
    const arr = this.#ensure(name);
    let target = arr[0];
    for (const a of arr) if (a.paused || a.ended) { target = a; break; }
    try {
      target.currentTime = 0;
      target.volume = Math.max(0, Math.min(1, vol));
      target.play().catch(() => {});
    } catch { }
  }
}

export const sfx = new SfxPool();
