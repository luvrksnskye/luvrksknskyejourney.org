import { loadMunsell, grayHex, still, ease } from '../munsell.js?v=1';

const NS = 'http://www.w3.org/2000/svg';
const SIDES = [
  { hue: 25, dir: -1, name: '5Y · amarillo' },
  { hue: 75, dir: 1, name: '5PB · morado azul' }
];
const AXIS = 360;
const TOP = 46;
const ROW = 36;
const UNIT = 9.2;
const SPHERE = 15;

const el = (tag, attrs = {}, parent) => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  parent?.append(node);
  return node;
};

const sphereReach = (v) => SPHERE * Math.sqrt(Math.max(0, 1 - ((v - 5) / 5.4) ** 2));
const rowY = (v) => TOP + (9 - v) * ROW;

class Morph {
  constructor(host, data) {
    this.host = host;
    this.data = data;
    this.figure = host.closest('.dd-figure');
    this.svg = host.querySelector('[data-role="svg"]') || host;
    this.input = this.figure.querySelector('[data-role="mix"]');
    this.output = this.figure.querySelector('[data-role="mix-out"]');
    this.touched = false;
    this.build();
    this.input.addEventListener('input', () => {
      this.touched = true;
      this.update(Number(this.input.value));
    });
    this.update(0);
    new IntersectionObserver(([entry], observer) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      if (!this.touched) this.play();
    }, { threshold: 0.5 }).observe(this.svg);
  }

  build() {
    const s = this.svg;
    this.rows = [];
    for (let v = 1; v <= 9; v++) {
      const y = rowY(v);
      el('rect', { x: AXIS - 8, y: y - 13, width: 16, height: 26, fill: grayHex(v), stroke: 'rgba(27,32,70,0.25)' }, s);
      const label = el('text', { x: AXIS, y: y + 4, 'text-anchor': 'middle', style: `fill: ${v >= 6 ? '#1b2046' : '#fff'}; font-size: 9px` }, s);
      label.textContent = String(v);
      const row = { v, sides: [] };
      for (const side of SIDES) {
        const actual = this.data.reach(side.hue, v);
        const chips = [];
        for (let c = 2; c <= 38; c += 2) {
          const x = side.dir < 0 ? AXIS - 12 - c * UNIT : AXIS + 12 + (c - 2) * UNIT;
          const i = this.data.at(side.hue, v, c);
          const top = actual > 0 ? this.data.at(side.hue, v, actual) : -1;
          const fill = i >= 0 ? this.data.hex[i] : top >= 0 ? this.data.hex[top] : grayHex(v);
          const rect = el('rect', { x: x + 1, y: y - 13, width: 2 * UNIT - 2, height: 26, rx: 1, fill, style: 'transition: opacity 180ms linear' }, s);
          chips.push({ c, rect, real: i >= 0 });
        }
        row.sides.push({ ...side, actual, chips });
      }
      this.rows.push(row);
    }
    this.outline = SIDES.map(() => el('path', { fill: 'none', stroke: '#1b2046', 'stroke-width': 1.4, 'stroke-dasharray': '4 4' }, s));
    SIDES.forEach((side) => {
      const t = el('text', { class: 'is-hue', x: side.dir < 0 ? AXIS - 24 : AXIS + 24, y: 20, 'text-anchor': side.dir < 0 ? 'end' : 'start' }, s);
      t.textContent = side.name;
    });
    const legend = el('g', { transform: 'translate(0, 404)' }, s);
    const items = [['existe', 'solid'], ['la esfera lo pide, pero no existe', 'ghost'], ['existe, pero la esfera lo deja fuera', 'faded']];
    let x = 0;
    for (const [text, kind] of items) {
      el('rect', {
        x, y: -9, width: 16, height: 11, rx: 1,
        fill: kind === 'ghost' ? 'none' : '#267ccb', opacity: kind === 'faded' ? 0.25 : 1,
        stroke: kind === 'ghost' ? '#1b2046' : 'none', 'stroke-dasharray': kind === 'ghost' ? '3 2' : ''
      }, legend);
      const t = el('text', { x: x + 22, y: 1 }, legend);
      t.textContent = text;
      x += 38 + text.length * 7.2;
    }
  }

  update(t) {
    this.t = t;
    const points = SIDES.map(() => []);
    for (const row of this.rows) {
      row.sides.forEach((side, k) => {
        const reach = sphereReach(row.v) + (side.actual - sphereReach(row.v)) * t;
        for (const chip of side.chips) {
          const inShape = chip.c <= reach + 0.9;
          let opacity = 0;
          let ghost = false;
          if (chip.real && inShape) opacity = 1;
          else if (chip.real) opacity = 0.22;
          else if (inShape) ghost = true;
          chip.rect.setAttribute('opacity', ghost ? '1' : String(opacity));
          chip.rect.setAttribute('fill-opacity', ghost ? '0' : '1');
          chip.rect.setAttribute('stroke', ghost ? 'rgba(27,32,70,0.55)' : 'none');
          chip.rect.setAttribute('stroke-dasharray', ghost ? '3 2' : '');
        }
        const x = AXIS + side.dir * (12 + reach * UNIT);
        points[k].push([x, rowY(row.v)]);
      });
    }
    this.outline.forEach((path, k) => {
      const list = points[k];
      path.setAttribute('d', `M ${AXIS} ${rowY(9.9)} ${list.slice().reverse().map(([x, y]) => `L ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')} L ${AXIS} ${rowY(0.1)}`);
    });
    this.output.textContent = t < 0.02 ? 'esfera ideal' : t > 0.98 ? 'forma real' : `${Math.round(t * 100)}% real`;
  }

  play() {
    if (still) {
      this.input.value = '1';
      this.update(1);
      return;
    }
    const start = performance.now();
    const step = (now) => {
      if (this.touched) return;
      const k = Math.min(1, (now - start) / 2600);
      const t = ease(k);
      this.input.value = String(t);
      this.update(t);
      if (k < 1) requestAnimationFrame(step);
    };
    setTimeout(() => requestAnimationFrame(step), 500);
  }
}

export async function mount(host) {
  const data = await loadMunsell();
  return new Morph(host, data);
}
