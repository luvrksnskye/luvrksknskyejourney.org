import { motion, svg, still, polar, arc } from './fx.js?v=8';
import { systems } from './profile.js?v=3';

const C = 500;
const RADII = [205, 325];
const OFFSETS = [-60, -16];
const EMPTY = 'EMPTY SLOT';
const pad = (n) => String(n).padStart(2, '0');

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export class OrbitMap {
  constructor({ host, card, onPick }) {
    this.host = host;
    this.card = card;
    this.onPick = onPick;
    this.nodes = [];
    this.loops = [];
    this.active = null;
    this.pulseTween = null;
    this.introduced = false;

    this.build();
    this.buildCard();

    new IntersectionObserver(([entry]) => this.setAwake(entry.isIntersecting), { rootMargin: '20% 0px' }).observe(host);
  }

  build() {
    const root = svg('svg', { viewBox: '0 0 1000 1000', class: 'ab-o', role: 'group', 'aria-label': 'Systems map' });
    this.root = root;

    svg('circle', { cx: C, cy: C, r: 468, class: 'ab-o-ring' }, root);

    const ticks = svg('g', { class: 'ab-o-ticks' }, root);
    for (let i = 0; i < 72; i++) {
      const major = i % 9 === 0;
      const [x1, y1] = polar(C, C, major ? 426 : 440, i * 5);
      const [x2, y2] = polar(C, C, 450, i * 5);
      svg('line', { x1, y1, x2, y2, class: major ? 'ab-o-tick is-major' : 'ab-o-tick' }, ticks);
    }

    const decos = svg('g', { class: 'ab-o-decos' }, root);
    const inner = svg('g', {}, decos);
    svg('circle', { cx: C, cy: C, r: 128, class: 'ab-o-deco is-dash' }, inner);

    const middle = svg('g', {}, decos);
    svg('path', { d: arc(C, C, 266, 18, 132), class: 'ab-o-deco is-arc' }, middle);
    svg('path', { d: arc(C, C, 266, 198, 312), class: 'ab-o-deco is-arc' }, middle);

    const dotted = svg('g', {}, decos);
    svg('circle', { cx: C, cy: C, r: 384, class: 'ab-o-deco is-dot' }, dotted);
    svg('circle', { cx: C, cy: C - 384, r: 11, class: 'ab-o-sat-ring' }, dotted);
    svg('circle', { cx: C, cy: C - 384, r: 4.5, class: 'ab-o-sat' }, dotted);

    const outer = svg('g', {}, decos);
    svg('path', { d: arc(C, C, 494, 296, 352), class: 'ab-o-deco is-arc' }, outer);
    svg('path', { d: arc(C, C, 494, 116, 172), class: 'ab-o-deco is-arc' }, outer);

    this.loops.push(
      { target: inner, turn: -360, duration: 90 },
      { target: middle, turn: 360, duration: 140 },
      { target: dotted, turn: -360, duration: 110 },
      { target: outer, turn: 360, duration: 220 }
    );

    const spokes = svg('g', { class: 'ab-o-spokes' }, root);
    this.pulse = svg('circle', { cx: C, cy: C, r: 4.5, class: 'ab-o-pulse' }, spokes);

    const core = svg('g', { class: 'ab-o-core' }, root);
    this.coreDash = svg('circle', { cx: C, cy: C, r: 66, class: 'ab-o-core-dash' }, core);
    svg('circle', { cx: C, cy: C, r: 36, class: 'ab-o-core-ring' }, core);
    svg('circle', { cx: C, cy: C, r: 7, class: 'ab-o-core-dot' }, core);
    const me = svg('text', { x: C, y: C + 100, class: 'ab-o-label', 'text-anchor': 'middle' }, core);
    me.textContent = 'SKYE';

    systems.forEach((system, ring) => {
      const r = RADII[ring] ?? RADII[RADII.length - 1] + (ring - RADII.length + 1) * 60;
      const offset = OFFSETS[ring] ?? 0;
      const count = system.nodes.length;
      svg('circle', { cx: C, cy: C, r, class: 'ab-o-orbit' }, root);

      const [lx, ly] = polar(C, C, r + 26, offset + 180 / count);
      const label = svg('text', { x: lx, y: ly, class: 'ab-o-label', 'text-anchor': 'middle' }, root);
      label.textContent = `${system.label.toUpperCase()} ${pad(count)}`;

      const comet = svg('g', { class: 'ab-o-comet' }, root);
      svg('circle', { cx: C, cy: C - r, r: 3.4 }, comet);
      this.loops.push({ target: comet, turn: ring % 2 ? -360 : 360, duration: 48 + ring * 26 });

      system.nodes.forEach((node, j) => {
        const [x, y] = polar(C, C, r, offset + (j * 360) / count);
        const empty = !node.name;
        const spoke = svg('line', { x1: C, y1: C, x2: x, y2: y, pathLength: 1, class: 'ab-o-spoke' }, spokes);
        const g = svg('g', {
          class: empty ? 'ab-o-node is-empty' : 'ab-o-node',
          transform: `translate(${x} ${y})`,
          tabindex: 0,
          role: 'button',
          'aria-label': `${system.label} ${pad(j + 1)}: ${empty ? 'empty slot' : node.name}`
        }, root);
        svg('circle', { r: 30, class: 'ab-o-hit' }, g);
        svg('circle', { r: 15, class: 'ab-o-node-ring' }, g);
        svg('circle', { r: 4.5, class: 'ab-o-node-dot' }, g);
        const num = svg('text', { x: 24, y: -20, class: 'ab-o-num' }, g);
        num.textContent = empty ? pad(this.nodes.length + 1) : node.name.toUpperCase();

        const entry = { g, spoke, node, system, j, x, y };
        this.nodes.push(entry);

        const pick = () => {
          this.activate(entry);
          this.onPick?.(entry);
        };
        g.addEventListener('pointerenter', () => this.activate(entry));
        g.addEventListener('focus', () => this.activate(entry));
        g.addEventListener('click', pick);
        g.addEventListener('keydown', (e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          pick();
        });
      });
    });

    this.ripple = svg('circle', { cx: C, cy: C, r: 16, class: 'ab-o-ripple' }, root);
    this.host.append(root);
  }

  buildCard() {
    this.cIndex = el('span', 'ab-node-card-index', '00');
    this.cSystem = el('span', 'ab-node-card-system', 'SYSTEMS');
    this.cCount = el('span', 'ab-node-card-count', '');
    const head = el('div', 'ab-node-card-head');
    head.append(this.cIndex, this.cSystem, this.cCount);

    this.cName = el('h3', 'ab-node-card-name', EMPTY);
    this.cNote = el('p', 'ab-node-card-note', '');

    this.cSince = el('dd', '', '···');
    this.cLevel = el('dd', 'ab-node-card-level');
    for (let i = 0; i < 5; i++) this.cLevel.append(el('i'));

    const since = el('div');
    since.append(el('dt', '', 'SINCE'), this.cSince);
    const level = el('div');
    level.append(el('dt', '', 'LEVEL'), this.cLevel);
    this.cData = el('dl', 'ab-node-card-data');
    this.cData.append(since, level);

    const hint = el('p', 'ab-node-card-hint', 'HOVER, CLICK OR TAB THROUGH THE NODES');
    this.card.append(head, this.cName, this.cNote, this.cData, hint);
  }

  async activate(entry) {
    if (!entry || this.active === entry) return;
    if (this.active) {
      this.active.g.classList.remove('is-active');
      this.active.spoke.classList.remove('is-active');
    }
    this.active = entry;
    entry.g.classList.add('is-active');
    entry.spoke.classList.add('is-active');
    this.root.classList.add('has-active');

    const { node, system, j } = entry;
    const name = node.name || EMPTY;
    this.card.classList.toggle('is-empty', !node.name);
    this.cIndex.textContent = pad(this.nodes.indexOf(entry) + 1);
    this.cSystem.textContent = system.label.toUpperCase();
    this.cCount.textContent = `${pad(j + 1)}/${pad(system.nodes.length)}`;
    this.cNote.textContent = node.note || '';
    this.cSince.textContent = node.since || '···';
    [...this.cLevel.children].forEach((bar, i) => bar.classList.toggle('is-on', i < (node.level || 0)));

    this.card.classList.remove('is-pulse');
    void this.card.offsetWidth;
    this.card.classList.add('is-pulse');

    const gsap = still ? null : await motion();
    if (this.active !== entry) return;
    if (!gsap) {
      this.cName.textContent = name;
      return;
    }

    gsap.to(this.cName, { duration: 0.6, overwrite: 'auto', scrambleText: { text: name, chars: 'upperCase', speed: 0.9 } });
    gsap.fromTo([this.cName, this.cNote, this.cData],
      { clipPath: 'inset(0 100% 0 0)' },
      { clipPath: 'inset(0 0% 0 0)', duration: 0.75, ease: 'expo.out', stagger: 0.07, overwrite: 'auto' });
    gsap.fromTo(this.ripple,
      { attr: { cx: entry.x, cy: entry.y, r: 16 }, opacity: 0.95 },
      { attr: { r: 64 }, opacity: 0, duration: 1, ease: 'expo.out', overwrite: 'auto' });

    this.pulseTween?.kill();
    this.pulseTween = gsap.fromTo(this.pulse,
      { attr: { cx: C, cy: C }, opacity: 1 },
      { attr: { cx: entry.x, cy: entry.y }, opacity: 0.15, duration: 1.1, ease: 'power2.in', repeat: -1, repeatDelay: 0.35 });
  }

  async intro() {
    if (this.introduced) return;
    this.introduced = true;
    this.host.classList.add('is-on');

    const gsap = still ? null : await motion();
    if (!gsap) {
      this.activate(this.nodes[0]);
      return;
    }

    const q = (selector) => this.root.querySelectorAll(selector);
    gsap.timeline()
      .fromTo(this.root, { filter: 'brightness(2.2)' }, { filter: 'brightness(1)', duration: 1.8, ease: 'expo.out', clearProps: 'filter' }, 0.6)
      .from(q('.ab-o-ring, .ab-o-orbit'), { drawSVG: '50% 50%', duration: 1.5, ease: 'expo.inOut', stagger: 0.1 }, 0)
      .from(q('.ab-o-deco'), { drawSVG: 0, duration: 1.6, ease: 'power3.inOut', stagger: 0.08 }, 0.2)
      .from(q('.ab-o-tick'), { opacity: 0, duration: 0.06, stagger: { each: 0.008, from: 'random' } }, 0.25)
      .from(q('.ab-o-core-ring, .ab-o-core-dot, .ab-o-sat, .ab-o-sat-ring'), { scale: 0, transformOrigin: '50% 50%', duration: 0.8, ease: 'back.out(2.2)', stagger: 0.1, clearProps: 'transform' }, 0.35)
      .from(q('.ab-o-node-ring, .ab-o-node-dot'), { scale: 0, transformOrigin: '50% 50%', duration: 0.55, ease: 'back.out(3)', stagger: 0.03, clearProps: 'transform' }, 0.9)
      .from(q('.ab-o-label, .ab-o-core-dash'), { opacity: 0, duration: 0.4, stagger: 0.05 }, 1.2)
      .call(() => this.activate(this.nodes[0]), null, 1.7);

    this.loops = this.loops.map(({ target, turn, duration }) =>
      gsap.to(target, { rotation: turn, svgOrigin: `${C} ${C}`, duration, repeat: -1, ease: 'none' })
    );
    this.loops.push(gsap.to(this.coreDash, { rotation: -360, svgOrigin: `${C} ${C}`, duration: 80, repeat: -1, ease: 'none' }));
  }

  setAwake(on) {
    for (const loop of [...this.loops, this.pulseTween]) {
      if (!loop || typeof loop.play !== 'function') continue;
      if (on) loop.play();
      else loop.pause();
    }
  }
}
