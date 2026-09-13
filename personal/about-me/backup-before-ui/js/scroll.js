const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

export class ScrollDriver {
  constructor({ onStage, onDescend, onReveal }) {
    this.root = document.body;
    this.stages = [...document.querySelectorAll('.ab-stage')];
    this.returnEl = document.querySelector('.ab-stage[data-stage="return"]');
    this.marks = new Map(
      [...document.querySelectorAll('.ab-rail-marks li')].map((li) => [li.dataset.stage, li])
    );
    this.readout = {
      stage: document.getElementById('readoutStage'),
      clock: document.getElementById('readoutClock'),
      depth: document.getElementById('readoutDepth')
    };
    this.onStage = onStage;
    this.onDescend = onDescend;
    this.onReveal = onReveal;
    this.stage = '';
    this.startedAt = 0;
    this.ticking = false;

    this.observeReveals();
    this.observeStages();

    addEventListener('scroll', () => {
      this.request();
      this.revealInView();
    }, { passive: true });
    addEventListener('resize', () => this.request());
  }

  begin() {
    this.startedAt = performance.now();
    this.tickClock();
    this.revealInView();
    this.measure();
  }

  revealInView() {
    for (const stage of this.stages) {
      if (stage.classList.contains('is-visible')) continue;
      const r = stage.getBoundingClientRect();
      if (r.top < innerHeight * 0.9 && r.bottom > 0) {
        stage.classList.add('is-visible');
        this.onReveal?.(stage.dataset.stage);
      }
    }
  }

  request() {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      this.ticking = false;
      this.measure();
    });
  }

  measure() {
    const vh = innerHeight;
    const max = Math.max(1, document.documentElement.scrollHeight - vh);
    const y = scrollY;

    const depth = clamp(y / max);
    const rise = clamp((y - vh * 0.85) / (vh * 1.8));
    const exit = this.returnEl
      ? clamp((y + vh - this.returnEl.offsetTop) / Math.max(1, this.returnEl.offsetHeight))
      : 0;
    const hud = rise * (1 - exit * 0.8);

    const descend = y / vh;
    this.root.style.setProperty('--depth', depth.toFixed(4));
    this.root.style.setProperty('--hud', hud.toFixed(4));
    this.root.style.setProperty('--descend', descend.toFixed(4));
    this.onDescend?.(descend);

    if (this.readout.depth) {
      this.readout.depth.textContent = 'DEPTH ' + String(Math.round(depth * 999)).padStart(3, '0');
    }
  }

  tickClock() {
    const el = this.readout.clock;
    if (!el) return;
    const loop = () => {
      const s = Math.floor((performance.now() - this.startedAt) / 1000);
      const hh = String(Math.floor(s / 3600)).padStart(2, '0');
      const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const ss = String(s % 60).padStart(2, '0');
      el.textContent = `${hh}:${mm}:${ss}`;
      setTimeout(loop, 1000);
    };
    loop();
  }

  observeReveals() {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.target.classList.contains('is-visible')) continue;
          entry.target.classList.add('is-visible');
          this.onReveal?.(entry.target.dataset.stage);
        }
      },
      { rootMargin: '-12% 0px -18% 0px', threshold: 0.08 }
    );
    for (const stage of this.stages) io.observe(stage);
  }

  observeStages() {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          this.setStage(entry.target.dataset.stage);
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );
    for (const stage of this.stages) io.observe(stage);
  }

  setStage(name) {
    if (!name || name === this.stage) return;
    this.stage = name;

    for (const [key, li] of this.marks) li.classList.toggle('is-current', key === name);
    if (this.readout.stage) this.readout.stage.textContent = name.toUpperCase();

    this.onStage?.(name);
  }
}
