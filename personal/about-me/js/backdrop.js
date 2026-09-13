const SIGIL = 'new_version-assets/exp_symbol_';
const NEAR = 1.2;

const STAGE_SIGIL = {
  arrival: 'exposition',
  present: 'exposition',
  origin: 'mark',
  record: 'portal',
  systems: 'mark',
  fragments: 'focus',
  status: 'portal',
  return: 'exposition'
};

export class Backdrop {
  constructor() {
    this.panels = [...document.querySelectorAll('.ab-panel-bg')].map((el) => ({
      el,
      video: el.querySelector('video'),
      loaded: false
    }));
    this.sigils = new Map(
      [...document.querySelectorAll('.ab-sigil')].map((el) => [el.dataset.sigil, el])
    );
    this.currentSigil = '';
    this.still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  prime() {
    this.showSigil(STAGE_SIGIL.arrival);
    if (this.still) return;
    this.load(this.panels[0]);
    this.load(this.panels[1]);
    this.update();
  }

  load(panel) {
    if (!panel || panel.loaded) return;
    panel.loaded = true;

    const { video } = panel;
    video.src = video.dataset.src;
    const ready = () => {
      video.classList.add('is-ready');
      video.play().catch(() => {});
    };
    if (video.readyState >= 3) ready();
    else video.addEventListener('canplay', ready, { once: true });
  }

  update() {
    if (this.still) return;
    const vh = innerHeight;

    for (const panel of this.panels) {
      const r = panel.el.getBoundingClientRect();
      const near = r.bottom > -NEAR * vh && r.top < (1 + NEAR) * vh;

      if (near) {
        this.load(panel);
        if (panel.video.paused && panel.video.src) panel.video.play().catch(() => {});
      } else if (panel.loaded && !panel.video.paused) {
        panel.video.pause();
      }
    }
  }

  sleep(hidden) {
    const sigil = this.sigils.get(this.currentSigil);
    if (hidden) {
      for (const panel of this.panels) {
        if (panel.loaded) panel.video.pause();
      }
      sigil?.pause();
      return;
    }
    if (this.still) return;
    this.update();
    if (sigil?.src) sigil.play().catch(() => {});
  }

  setStage(stage) {
    this.showSigil(STAGE_SIGIL[stage]);
  }

  showSigil(name) {
    if (!name || name === this.currentSigil) return;
    const prev = this.sigils.get(this.currentSigil);
    const next = this.sigils.get(name);
    this.currentSigil = name;

    if (prev) {
      prev.classList.remove('is-active');
      setTimeout(() => prev.pause(), 2400);
    }
    if (!next || this.still) return;

    if (!next.src) next.src = SIGIL + name + '.webm';
    next.play().catch(() => {});
    next.classList.add('is-active');
  }
}
