import { loadMunsell, grayHex, notation, still } from '../munsell.js?v=1';

const NS = 'http://www.w3.org/2000/svg';
const PRINCIPAL = [
  { hue: 5, name: 'rojo' },
  { hue: 25, name: 'amarillo' },
  { hue: 45, name: 'verde' },
  { hue: 65, name: 'azul' },
  { hue: 85, name: 'morado' }
];
const CAPTIONS = [
  'cinco gajos: rojo, amarillo, verde, azul y morado · del gris del centro al color puro de la cáscara',
  'la esfera: el polo norte es blanco, el polo sur negro, y en el ecuador viven los colores medios',
  'el árbol: cada rama sale a la altura donde su color es más intenso · el amarillo arriba, el morado abajo'
];

const el = (tag, attrs = {}, parent) => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  parent?.append(node);
  return node;
};

function best(data, hue, value, bookOnly) {
  let pick = -1;
  for (let i = 0; i < data.count; i++) {
    if (Math.abs(data.h[i] - hue) > 0.01 || data.v[i] !== value) continue;
    if (bookOnly && !data.book[i]) continue;
    if (pick < 0 || data.c[i] > data.c[pick]) pick = i;
  }
  return pick;
}

function nearestChroma(data, hue, value, chroma) {
  let pick = -1;
  let gap = Infinity;
  for (let i = 0; i < data.count; i++) {
    if (Math.abs(data.h[i] - hue) > 0.01 || data.v[i] !== value) continue;
    const d = Math.abs(data.c[i] - chroma);
    if (d < gap) {
      gap = d;
      pick = i;
    }
  }
  return pick;
}

class Orange {
  constructor(host, data) {
    this.host = host;
    this.data = data;
    this.figure = host.closest('.dd-figure');
    this.svg = host.querySelector('[data-role="svg"]');
    this.readout = this.figure.querySelector('[data-role="readout"]');
    this.buttons = [...this.figure.querySelectorAll('[data-step]')];
    this.groups = [this.buildOrange(), this.buildSphere(), this.buildTree()];
    this.buttons.forEach((button) => button.addEventListener('click', () => this.go(Number(button.dataset.step))));
    this.go(0, true);
  }

  group() {
    return el('g', { style: 'transition: opacity 700ms ease, transform 900ms cubic-bezier(0.16,1,0.3,1); transform-origin: 320px 190px' }, this.svg);
  }

  buildOrange() {
    const g = this.group();
    const cx = 320;
    const cy = 190;
    const rings = [0, 2, 4, 6, 8, 10];
    PRINCIPAL.forEach((p, k) => {
      const a0 = ((k * 72 - 90 - 34) * Math.PI) / 180;
      const a1 = ((k * 72 - 90 + 34) * Math.PI) / 180;
      rings.forEach((chroma, r) => {
        const inner = 26 + r * 24;
        const outer = inner + 22;
        const i = chroma ? nearestChroma(this.data, p.hue, 6, chroma) : -1;
        const fill = i >= 0 ? this.data.hex[i] : grayHex(6);
        const d = [
          `M ${cx + Math.cos(a0) * inner} ${cy + Math.sin(a0) * inner}`,
          `L ${cx + Math.cos(a0) * outer} ${cy + Math.sin(a0) * outer}`,
          `A ${outer} ${outer} 0 0 1 ${cx + Math.cos(a1) * outer} ${cy + Math.sin(a1) * outer}`,
          `L ${cx + Math.cos(a1) * inner} ${cy + Math.sin(a1) * inner}`,
          `A ${inner} ${inner} 0 0 0 ${cx + Math.cos(a0) * inner} ${cy + Math.sin(a0) * inner}`,
          'Z'
        ].join(' ');
        el('path', { d, fill, stroke: '#fff', 'stroke-width': 1.5 }, g);
      });
      const am = ((k * 72 - 90) * Math.PI) / 180;
      const t = el('text', { x: cx + Math.cos(am) * 188, y: cy + Math.sin(am) * 188 + 4, 'text-anchor': 'middle' }, g);
      t.textContent = p.name;
    });
    el('circle', { cx, cy, r: 20, fill: grayHex(6), stroke: '#fff', 'stroke-width': 1.5 }, g);
    return g;
  }

  buildSphere() {
    const g = this.group();
    const cx = 320;
    const cy = 190;
    const R = 160;
    for (let v = 1; v <= 9; v++) {
      const y = cy + ((5 - v) / 5) * R;
      const half = Math.sqrt(Math.max(0, R * R - (y - cy) ** 2));
      el('ellipse', { cx, cy: y, rx: half, ry: half * 0.16, fill: 'none', stroke: 'rgba(27,32,70,0.12)' }, g);
    }
    PRINCIPAL.forEach((p, k) => {
      const i = nearestChroma(this.data, p.hue, 5, 10);
      const a0 = (k / 5) * Math.PI * 2 - Math.PI / 2;
      const a1 = ((k + 1) / 5) * Math.PI * 2 - Math.PI / 2;
      const points = [];
      for (let s = 0; s <= 12; s++) {
        const a = a0 + ((a1 - a0) * s) / 12;
        points.push(`${(cx + Math.cos(a) * R).toFixed(1)},${(cy + Math.sin(a) * R * 0.16).toFixed(1)}`);
      }
      el('polyline', { points: points.join(' '), fill: 'none', stroke: i >= 0 ? this.data.hex[i] : '#999', 'stroke-width': 14, 'stroke-linecap': 'butt' }, g);
    });
    el('circle', { cx, cy, r: R, fill: 'none', stroke: 'rgba(27,32,70,0.3)' }, g);
    for (let v = 0; v <= 10; v++) {
      el('rect', { x: cx - 7, y: cy + ((5 - v) / 5) * R - 7, width: 14, height: 14, fill: grayHex(v), stroke: 'rgba(27,32,70,0.25)' }, g);
    }
    const north = el('text', { x: cx + 26, y: cy - R + 4 }, g);
    north.textContent = 'polo norte · blanco';
    const south = el('text', { x: cx + 26, y: cy + R + 4 }, g);
    south.textContent = 'polo sur · negro';
    const eq = el('text', { x: cx + R + 12, y: cy + 4 }, g);
    eq.textContent = 'ecuador';
    return g;
  }

  buildTree() {
    const g = this.group();
    const cx = 320;
    const top = 26;
    const unit = 34;
    const scale = 15;
    for (let v = 0; v <= 10; v++) {
      el('rect', { x: cx - 7, y: top + (10 - v) * unit - 7, width: 14, height: 14, fill: grayHex(v), stroke: 'rgba(27,32,70,0.25)' }, g);
    }
    const branches = PRINCIPAL.map((p) => {
      let pick = -1;
      for (let v = 1; v <= 9; v++) {
        const i = best(this.data, p.hue, v, true);
        if (i >= 0 && (pick < 0 || this.data.c[i] > this.data.c[pick])) pick = i;
      }
      return { ...p, i: pick };
    }).sort((a, b) => this.data.v[b.i] - this.data.v[a.i]);
    branches.forEach((b, k) => {
      if (b.i < 0) return;
      const side = k % 2 === 0 ? 1 : -1;
      const y = top + (10 - this.data.v[b.i]) * unit;
      const length = this.data.c[b.i] * scale;
      const x2 = cx + side * (12 + length);
      el('line', { x1: cx + side * 8, y1: y, x2, y2: y, stroke: 'rgba(27,32,70,0.35)', 'stroke-width': 2 }, g);
      for (let c = 2; c <= this.data.c[b.i]; c += 2) {
        const j = this.data.at(b.hue, this.data.v[b.i], c);
        if (j < 0) continue;
        el('rect', { x: cx + side * (12 + (c - 2) * scale) - (side < 0 ? scale * 2 : 0), y: y - 9, width: scale * 2 - 3, height: 18, rx: 1, fill: this.data.hex[j] }, g);
      }
      el('circle', { cx: x2 + side * 12, cy: y, r: 12, fill: this.data.hex[b.i], stroke: '#fff', 'stroke-width': 2 }, g);
      const t = el('text', { x: x2 + side * 30, y: y + 4, 'text-anchor': side > 0 ? 'start' : 'end' }, g);
      t.textContent = `${b.name} · ${notation(b.hue, this.data.v[b.i], this.data.c[b.i], 0)}`;
    });
    return g;
  }

  go(step, first = false) {
    this.step = step;
    this.buttons.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.step) === step)));
    this.groups.forEach((g, k) => {
      const on = k === step;
      g.style.opacity = on ? '1' : '0';
      g.style.transform = on ? 'scale(1)' : `scale(${k < step ? 0.86 : 1.12})`;
      g.style.pointerEvents = on ? 'auto' : 'none';
      if (still || first) g.style.transition = 'none';
      else g.style.transition = '';
    });
    if (this.readout) this.readout.textContent = CAPTIONS[step];
  }
}

export async function mount(host) {
  const data = await loadMunsell();
  return new Orange(host, data);
}
