import { pageScale } from '/assets/js/page-scale.js';
import { loadMunsell, hueLabel, notation, parseNotation, snapHue, grayHex, cssColor, supportsP3, inkFor, still } from '../munsell.js?v=1';

const hueOf = (index) => ((index + 1) * 2.5) % 100;
const indexOf = (hue) => ((Math.round(hue / 2.5) - 1) % 40 + 40) % 40;

class Address {
  constructor(host, data) {
    this.host = host;
    this.data = data;
    this.p3 = supportsP3();
    const q = (role) => host.querySelector(`[data-role="${role}"]`);
    this.swatch = q('swatch');
    this.code = q('code');
    this.words = q('words');
    this.state = q('state');
    this.map = q('map');
    this.inputs = { hue: q('hue'), value: q('value'), chroma: q('chroma') };
    this.outputs = { hue: q('hue-out'), value: q('value-out'), chroma: q('chroma-out') };
    this.type = q('type');
    this.ctx = this.map.getContext('2d', this.p3 ? { colorSpace: 'display-p3' } : undefined);
    this.flash = 0;

    for (const input of Object.values(this.inputs)) {
      input.addEventListener('input', () => this.fromSliders());
    }
    this.type.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.fromText();
    });
    this.type.addEventListener('change', () => this.fromText());
    this.type.addEventListener('input', () => this.type.classList.remove('is-bad'));
    this.map.addEventListener('pointerdown', (e) => this.fromMap(e));
    new ResizeObserver(() => this.drawMap()).observe(this.map);
    this.fromSliders(true);
  }

  current() {
    return {
      h: hueOf(Number(this.inputs.hue.value)),
      v: Number(this.inputs.value.value),
      c: Number(this.inputs.chroma.value) * 2
    };
  }

  setSliders({ h, v, c }) {
    this.inputs.hue.value = String(indexOf(h));
    this.inputs.value.value = String(Math.min(9, Math.max(1, Math.round(v))));
    this.inputs.chroma.value = String(Math.min(19, Math.max(0, Math.round(c / 2))));
  }

  fromSliders(first = false) {
    this.render(this.current(), first);
  }

  fromText() {
    const raw = this.type.value.trim();
    if (!raw) return;
    const parsed = parseNotation(raw);
    if (!parsed) {
      this.type.classList.add('is-bad');
      this.state.textContent = 'no entendí esa dirección · prueba algo como 5R 4/14, 10YR 3/2 o N 5';
      this.nudge('is-shake');
      return;
    }
    const wanted = { h: snapHue(parsed.h || 2.5), v: Math.min(9, Math.max(1, Math.round(parsed.v))), c: Math.round(parsed.c / 2) * 2 };
    if (parsed.c < 1) wanted.c = 0;
    const exact = Math.abs(parsed.v - wanted.v) < 0.01 && Math.abs(parsed.c - wanted.c) < 0.01 && Math.abs((parsed.h || 2.5) - wanted.h) < 0.01;
    this.setSliders(wanted);
    this.render(this.current(), false, exact ? '' : `la redondeé a la ficha más cercana del libro, ${notation(wanted.h, wanted.v, wanted.c, 0)} · `);
  }

  fromMap(e) {
    const rect = this.map.getBoundingClientRect();
    const { left, top, cell, rows } = this.layout;
    const x = (e.clientX - rect.left) / rect.width * this.map.clientWidth;
    const y = (e.clientY - rect.top) / rect.height * this.map.clientHeight;
    const c = Math.round((x - left) / cell) * 2 + 2;
    const v = rows - Math.floor((y - top) / cell);
    if (v < 1 || v > 9 || c < 0) return;
    const { h } = this.current();
    this.setSliders({ h, v, c: Math.max(0, c) });
    this.render(this.current());
  }

  nudge(name) {
    if (still) return;
    this.swatch.classList.remove('is-bump', 'is-shake');
    void this.swatch.offsetWidth;
    this.swatch.classList.add(name);
  }

  render({ h, v, c }, first = false, prefix = '') {
    const label = hueLabel(h);
    this.outputs.hue.textContent = label;
    this.outputs.value.textContent = String(v);
    this.outputs.chroma.textContent = String(c);
    this.selected = { h, v, c };

    let background;
    let text;
    let kind;
    if (c === 0) {
      background = grayHex(v);
      kind = 'gray';
      text = `N ${v}`;
    } else {
      const i = this.data.at(h, v, c);
      text = `${label} ${v}/${c}`;
      if (i < 0) {
        kind = 'none';
        background = null;
      } else {
        this.index = i;
        const g = this.data.gamut[i];
        kind = g === 2 ? 'fits' : g === 1 ? (this.p3 ? 'p3' : 'out') : 'out';
        background = cssColor(this.data, i, this.p3);
      }
    }

    this.swatch.classList.toggle('is-none', kind === 'none');
    this.swatch.classList.toggle('is-out', kind === 'out');
    if (background) this.swatch.style.setProperty('--chip', background);
    const ink = kind === 'none' ? '#1b2046' : inkFor(v);
    this.swatch.style.setProperty('--on-chip', ink);
    this.code.textContent = text;
    this.words.textContent = c === 0 ? `el tronco gris · piso ${v}` : `calle ${label} · piso ${v} · puerta ${c}`;

    const reach = this.data.reach(h, v);
    const messages = {
      gray: `un gris puro, sin croma · refleja cerca del ${Math.round((grayY(v)) * 100)}% de la luz`,
      fits: 'existe, y tu pantalla puede mostrarlo',
      p3: 'existe, y tu pantalla P3 puede mostrarlo · una pantalla común no',
      out: 'existe en el mundo, pero tu pantalla no llega · lo muestro con menos croma y con rayitas',
      none: `no existe · en el piso ${v} de la calle ${label}, los colores reales llegan hasta el croma ${reach}`
    };
    this.state.textContent = prefix + messages[kind];
    if (!first) this.nudge(kind === 'none' ? 'is-shake' : 'is-bump');
    this.drawMap();
  }

  drawMap() {
    const width = this.map.clientWidth;
    const height = this.map.clientHeight;
    if (!width || !height || !this.selected) return;
    const ratio = Math.min(devicePixelRatio || 1, 2) * pageScale();
    if (this.map.width !== Math.round(width * ratio)) {
      this.map.width = Math.round(width * ratio);
      this.map.height = Math.round(height * ratio);
    }
    const ctx = this.ctx;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const { h, v: sv, c: sc } = this.selected;
    let maxC = 2;
    for (let v = 1; v <= 9; v++) maxC = Math.max(maxC, this.data.reach(h, v));
    const columns = Math.max(8, maxC / 2 + 1);
    const rows = 9;
    const cell = Math.min((width - 34) / columns, (height - 30) / rows);
    const left = 30;
    const top = (height - cell * rows) / 2;
    this.layout = { left, top, cell, rows };

    ctx.font = '9px departure-mono, monospace';
    ctx.fillStyle = 'rgba(27,32,70,0.5)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let v = 1; v <= 9; v++) {
      const y = top + (rows - v) * cell;
      ctx.fillText(String(v), left - 8, y + cell / 2);
      ctx.fillStyle = grayHex(v);
      ctx.fillRect(left - 4, y + 1, 3, cell - 2);
      ctx.fillStyle = 'rgba(27,32,70,0.5)';
      for (let c = 2; c <= 38; c += 2) {
        const i = this.data.at(h, v, c);
        if (i < 0) continue;
        const x = left + (c / 2 - 1) * cell + 1;
        ctx.fillStyle = cssColor(this.data, i, this.p3);
        ctx.fillRect(x, y + 1, cell - 2, cell - 2);
        if (this.data.gamut[i] < (this.p3 ? 1 : 2)) {
          ctx.strokeStyle = 'rgba(255,255,255,0.55)';
          ctx.beginPath();
          ctx.moveTo(x + 2, y + cell - 3);
          ctx.lineTo(x + cell - 4, y + 1);
          ctx.stroke();
        }
      }
      ctx.fillStyle = 'rgba(27,32,70,0.5)';
    }
    const selX = sc === 0 ? left - 5 : left + (sc / 2 - 1) * cell;
    const selY = top + (rows - sv) * cell;
    ctx.strokeStyle = '#1b2046';
    ctx.lineWidth = 2;
    ctx.strokeRect(selX - 1, selY - 1, (sc === 0 ? 5 : cell) + 0, cell);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(27,32,70,0.55)';
    ctx.fillText(`${hueLabel(h)} · valor ↑ · croma →`, left, height - 8);
  }
}

function grayY(v) {
  return (1.1914 * v - 0.22533 * v ** 2 + 0.23352 * v ** 3 - 0.020484 * v ** 4 + 0.00081939 * v ** 5) / 100;
}

export async function mount(host) {
  const data = await loadMunsell();
  return new Address(host, data);
}
