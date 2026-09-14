import { fragments } from './fragments.js?v=9';
import { shapes, placeBox } from './shapes.js?v=10';

const NS = 'http://www.w3.org/2000/svg';

const GRID = { w: 1000, h: 640 };
const GRID_NARROW = { w: 560, h: 1820 };
const FOCUS = { x: 262, y: 320, scale: 1.4 };

function span(className) {
  const el = document.createElement('span');
  el.className = className;
  return el;
}

export class CrystalField {
  constructor({ stage, section, panel, intro, onBuild, onHover, onSelect, onStep, onClear }) {
    this.stage = stage;
    this.section = section;
    this.onBuild = onBuild;
    this.onHover = onHover;
    this.panel = panel;
    this.intro = intro;
    this.onSelect = onSelect;
    this.onClear = onClear;
    this.onStep = onStep;
    this.stepping = false;
    this.narrow = window.matchMedia('(max-width: 860px)');
    this.shards = new Map();
    this.selected = null;
    this.formed = false;

    this.build();
    this.narrow.addEventListener('change', () => this.build());

    document.addEventListener('keydown', (e) => {
      if (!this.selected) return;
      if (e.key === 'Escape') this.clear();
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') this.step(1, e);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') this.step(-1, e);
    });

    this.section?.addEventListener('click', (e) => {
      if (!this.selected) return;
      if (this.panel.contains(e.target) || e.target.closest('.ab-shard')) return;
      this.clear();
    });
  }

  step(dir, e) {
    e?.preventDefault();
    if (this.stepping) return;
    const ids = fragments.map((frag) => frag.id);
    const at = ids.indexOf(this.selected);
    const next = ids[(at + dir + ids.length) % ids.length];
    if (!this.onStep) {
      this.select(next);
      return;
    }
    this.stepping = true;
    Promise.resolve(this.onStep(dir, () => this.select(next))).finally(() => {
      this.stepping = false;
    });
  }

  build() {
    const mobile = this.narrow.matches;
    const grid = mobile ? GRID_NARROW : GRID;
    this.grid = grid;
    this.stage.style.setProperty('--grid-ratio', `${grid.w} / ${grid.h}`);
    this.stage.replaceChildren();
    this.shards.clear();

    fragments.forEach((frag, i) => {
      const shape = shapes[frag.shape];
      const pos = mobile ? frag.posM : frag.pos;
      const laid = placeBox(shape, grid, pos.x, pos.y, pos.w, frag.rot);

      const shard = document.createElement('button');
      shard.type = 'button';
      shard.className = 'ab-shard';
      shard.dataset.id = frag.id;
      shard.setAttribute('aria-label', frag.title);
      Object.assign(shard.style, laid.box);
      shard.style.setProperty('--origin-x', laid.label.left);
      shard.style.setProperty('--origin-y', laid.label.top);
      shard.style.setProperty('--form-delay', `${260 + i * 95}ms`);
      shard.style.setProperty('--float-dur', `${13 + i * 1.6}s`);
      shard.style.setProperty('--float-y', `${(-7 - (i % 4) * 4).toFixed(0)}px`);
      shard.style.setProperty('--float-x', `${(((i * 5) % 7) - 3) * 2.5}px`);
      if (this.formed) shard.classList.add('is-formed');

      const hit = span('ab-shard-hit');
      hit.style.clipPath = laid.clip;

      const num = span('ab-shard-num');
      num.textContent = String(i + 1).padStart(2, '0');
      const label = span('ab-shard-label');
      label.textContent = frag.label;

      const tag = span('ab-shard-tag');
      tag.style.left = laid.label.left;
      tag.style.top = laid.label.top;
      tag.append(num, label);

      shard.append(hit, tag);
      shard.addEventListener('click', () => this.select(frag.id));
      hit.addEventListener('pointerenter', () => {
        if (this.selected) return;
        shard.classList.add('is-lit');
        this.onHover?.(frag);
      });
      hit.addEventListener('pointerleave', () => shard.classList.remove('is-lit'));

      this.shards.set(frag.id, { shard, frag, pos, laid });
      this.stage.append(shard);
    });

    if (this.selected) this.clear(true);
    this.onBuild?.({ entries: this.entries(), grid: this.grid });
  }

  entries() {
    return [...this.shards.values()].map(({ shard, laid }) => ({ shard, laid }));
  }

  reveal() {
    if (this.formed) return;
    this.formed = true;
    for (const { shard } of this.shards.values()) shard.classList.add('is-formed');
  }

  select(id) {
    if (this.selected === id) return;
    const entry = this.shards.get(id);
    if (!entry) return;

    if (this.selected) this.shards.get(this.selected)?.shard.classList.remove('is-selected');

    this.centre();
    this.selected = id;
    this.stage.classList.add('is-focused');
    entry.shard.classList.add('is-selected');

    if (!this.narrow.matches) {
      const { boxW, boxH } = entry.laid;
      entry.shard.style.setProperty('--focus-x', `${(((FOCUS.x - entry.pos.x) / boxW) * 100).toFixed(2)}%`);
      entry.shard.style.setProperty('--focus-y', `${(((FOCUS.y - entry.pos.y) / boxH) * 100).toFixed(2)}%`);
      entry.shard.style.setProperty('--focus-scale', FOCUS.scale);
    }

    document.body.dataset.fragment = id;
    document.body.dataset.temp = entry.frag.temp;
    document.body.dataset.locked = 'true';

    this.renderPanel(entry.frag, fragments.indexOf(entry.frag));
    this.onSelect?.(entry.frag, entry.shard);
  }

  centre() {
    if (!this.section || this.narrow.matches) return;
    const top = this.section.offsetTop + (this.section.offsetHeight - innerHeight) / 2;
    scrollTo({ top, behavior: 'instant' });
  }

  clear(silent = false) {
    if (!this.selected) return;
    const entry = this.shards.get(this.selected);
    if (entry) entry.shard.classList.remove('is-selected');

    this.selected = null;
    this.stage.classList.remove('is-focused');
    entry?.shard.classList.remove('is-lit');
    delete document.body.dataset.fragment;
    delete document.body.dataset.locked;
    document.body.dataset.temp = 'warm';

    this.panel.classList.remove('is-open');
    setTimeout(() => {
      if (!this.selected) this.panel.hidden = true;
    }, 700);

    if (silent) return;
    entry?.shard.focus({ preventScroll: true });
    this.onClear?.();
  }

  renderPanel(frag, index) {
    this.panel.replaceChildren();
    this.panel.setAttribute('aria-label', frag.title);

    const head = document.createElement('div');
    head.className = 'ab-panel-head';

    const num = span('ab-panel-index');
    num.textContent = String(index + 1).padStart(2, '0');

    const title = document.createElement('h3');
    title.className = 'ab-panel-title';
    title.textContent = frag.title;

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'ab-panel-close';
    close.textContent = 'CLOSE';
    close.addEventListener('click', () => this.clear());

    head.append(num, title, close);

    const data = document.createElement('ul');
    data.className = 'ab-panel-data';
    for (const item of frag.data) {
      const li = document.createElement('li');
      li.textContent = item;
      data.append(li);
    }

    const body = document.createElement('div');
    body.className = 'ab-panel-body';
    for (const para of frag.body) {
      const p = document.createElement('p');
      p.textContent = para;
      body.append(p);
    }

    const nav = document.createElement('div');
    nav.className = 'ab-panel-nav';
    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'ab-panel-step';
    prev.textContent = '◂ PREV';
    prev.addEventListener('click', () => this.step(-1));
    const count = span('ab-panel-count');
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(fragments.length).padStart(2, '0')}`;
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'ab-panel-step';
    next.textContent = 'NEXT ▸';
    next.addEventListener('click', () => this.step(1));
    const keys = span('ab-panel-keys');
    keys.textContent = '← → TO SWITCH';
    nav.append(prev, count, next, keys);

    this.panel.append(head, data, body, nav);
    this.panel.hidden = false;
    void this.panel.offsetWidth;
    this.panel.classList.add('is-open');
    close.focus({ preventScroll: true });
  }
}
