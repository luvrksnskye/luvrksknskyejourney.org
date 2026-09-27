import { pageScale } from '/assets/js/page-scale.js';
import { loadLut, lookupInto, notation, snapHue, encode, rgbToHex, TAU } from '../munsell.js?v=1';

const W = 480;
const H = 360;
const CX = 250;
const CY = 214;
const R = 92;
const HORIZON = 150;
const SUN = (() => {
  const v = [0.62, 0.6, 0.5];
  const l = Math.hypot(...v);
  return v.map((x) => x / l);
})();

const mix = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

class ShadowStudy {
  constructor(host, lut) {
    this.host = host;
    this.lut = lut;
    const q = (role) => host.querySelector(`[data-role="${role}"]`);
    this.canvas = q('canvas');
    this.read = q('read');
    this.warm = q('warm');
    this.warmOut = q('warm-out');
    this.sky = q('sky');
    this.skyOut = q('sky-out');
    this.spaceButton = q('space');
    this.localButton = q('local');
    this.space = false;
    this.red = false;
    this.canvas.width = W;
    this.canvas.height = H;
    this.ctx = this.canvas.getContext('2d');
    this.image = this.ctx.createImageData(W, H);
    this.buildRead();

    this.warm.addEventListener('input', () => this.render());
    this.sky.addEventListener('input', () => this.render());
    this.spaceButton.addEventListener('click', () => {
      this.space = !this.space;
      this.spaceButton.setAttribute('aria-pressed', String(this.space));
      this.render();
    });
    this.localButton.addEventListener('click', () => {
      this.red = !this.red;
      this.localButton.setAttribute('aria-pressed', String(this.red));
      this.render();
    });
    this.render();
  }

  buildRead() {
    this.slots = ['la luz', 'la sombra propia', 'la sombra en el suelo'].map((label) => {
      const row = document.createElement('div');
      const swatch = document.createElement('i');
      const title = document.createElement('b');
      const text = document.createElement('span');
      text.textContent = label;
      row.append(swatch, title, text);
      return { row, swatch, title };
    });
    this.wheel = document.createElement('canvas');
    this.wheel.setAttribute('aria-hidden', 'true');
    this.wctx = this.wheel.getContext('2d');
    this.read.replaceChildren(...this.slots.map((s) => s.row), this.wheel);
  }

  lights() {
    const t = Number(this.warm.value);
    const s = Number(this.sky.value);
    const cool = [0.66, 0.8, 1.0];
    const neutral = [1, 1, 1];
    const warm = [1.0, 0.72, 0.46];
    const sunColor = t < 0.5 ? mix(cool, neutral, t / 0.5) : mix(neutral, warm, (t - 0.5) / 0.5);
    const sun = sunColor.map((x) => x * 1.75);
    const skyColor = this.space ? [0, 0, 0] : mix([0.8, 0.81, 0.84], [0.26, 0.48, 1.0], s).map((x) => x * 0.8);
    this.warmOut.textContent = t < 0.4 ? 'fría' : t > 0.6 ? 'cálida' : 'neutra';
    this.skyOut.textContent = this.space ? 'no hay' : s > 0.55 ? 'azul' : s < 0.3 ? 'nublado' : 'claro';
    return { sun, sky: skyColor };
  }

  shade(x, y, light, albedo, ground) {
    const { sun, sky } = light;
    const dx = (x - CX) / R;
    const dy = (y - CY) / R;
    const d2 = dx * dx + dy * dy;
    if (d2 <= 1) {
      const nx = dx;
      const ny = -dy;
      const nz = Math.sqrt(1 - d2);
      const direct = Math.max(0, nx * SUN[0] + ny * SUN[1] + nz * SUN[2]);
      const up = 0.5 + 0.5 * ny;
      const down = 0.5 - 0.5 * ny;
      const bounce = this.space ? 0 : 0.3 * Math.max(0, SUN[1]);
      return [0, 1, 2].map((k) => albedo[k] * (sun[k] * direct + sky[k] * up + ground[k] * sun[k] * bounce * down));
    }
    if (y < HORIZON) {
      const h = 1 - y / HORIZON;
      if (this.space) return [0.004, 0.004, 0.008];
      return sky.map((k) => k * (1.45 + 0.5 * (1 - h)) + 0.06 * (1 - h));
    }
    const sx = (x - (CX - 1.1 * R)) / (1.35 * R);
    const sy = (y - (CY + 0.8 * R)) / (0.3 * R);
    const cast = 1 - smooth(0.78, 1.18, Math.hypot(sx, sy));
    const cx = (x - CX) / (0.95 * R);
    const cy = (y - (CY + 0.98 * R)) / (0.16 * R);
    const occlusion = 1 - smooth(0.2, 1.25, Math.hypot(cx, cy));
    const lit = (1 - cast) * (1 - occlusion * 0.9);
    const open = 1 - occlusion * 0.75 - cast * 0.15;
    return [0, 1, 2].map((k) => ground[k] * (sun[k] * SUN[1] * lit + sky[k] * open));
  }

  render() {
    const light = this.lights();
    const albedo = this.red ? [0.62, 0.09, 0.08] : [0.86, 0.86, 0.86];
    const ground = [0.6, 0.58, 0.54];
    const px = this.image.data;
    const exposure = 0.66;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const c = this.shade(x + 0.5, y + 0.5, light, albedo, ground);
        const o = (y * W + x) * 4;
        px[o] = encode(c[0] * exposure / (1 + c[0] * exposure * 0.18));
        px[o + 1] = encode(c[1] * exposure / (1 + c[1] * exposure * 0.18));
        px[o + 2] = encode(c[2] * exposure / (1 + c[2] * exposure * 0.18));
        px[o + 3] = 255;
      }
    }
    this.ctx.putImageData(this.image, 0, 0);
    this.readPoints();
  }

  readPoints() {
    const points = [
      [CX + 0.42 * R, CY - 0.46 * R],
      [CX - 0.86 * R, CY - 0.06 * R],
      [CX - 1.15 * R, CY + 0.8 * R]
    ];
    const out = {};
    const found = points.map(([x, y], k) => {
      const data = this.ctx.getImageData(Math.round(x) - 2, Math.round(y) - 2, 5, 5).data;
      let r = 0;
      let g = 0;
      let b = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }
      r /= 25;
      g /= 25;
      b /= 25;
      lookupInto(this.lut, Math.round(r), Math.round(g), Math.round(b), out);
      const slot = this.slots[k];
      slot.swatch.style.background = rgbToHex(r, g, b);
      slot.title.textContent = notation(snapHue(out.h), out.v, out.c).replace(/\/(\d+)\.\d$/, '/$1');
      return { h: out.h, v: out.v, c: out.c, color: rgbToHex(r, g, b) };
    });
    this.drawWheel(found);
  }

  drawWheel(found) {
    const size = this.wheel.clientWidth || 180;
    const ratio = Math.min(devicePixelRatio || 1, 2) * pageScale();
    if (this.wheel.width !== Math.round(size * ratio)) {
      this.wheel.width = Math.round(size * ratio);
      this.wheel.height = Math.round(size * ratio);
    }
    const ctx = this.wctx;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const c = size / 2;
    const r = size / 2 - 14;
    const colors = ['#d04c50', '#b6651a', '#927702', '#698318', '#3b8767', '#238781', '#2d849a', '#267ccb', '#9b62b6', '#c54f85'];
    colors.forEach((color, i) => {
      const a0 = (i / 10) * TAU - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(c, c, r + 6, a0 + 0.02, a0 + TAU / 10 - 0.02);
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(27,32,70,0.12)';
    ctx.lineWidth = 1;
    for (const k of [0.33, 0.66, 1]) {
      ctx.beginPath();
      ctx.arc(c, c, r * k, 0, TAU);
      ctx.stroke();
    }
    const place = (p) => {
      const a = ((p.h - 5) / 100) * TAU - Math.PI / 2 + TAU / 20;
      const rr = Math.min(1, p.c / 8) * r;
      return [c + Math.cos(a) * rr, c + Math.sin(a) * rr];
    };
    const [a, b, d] = found.map(place);
    ctx.strokeStyle = '#1b2046';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.lineTo(d[0], d[1]);
    ctx.stroke();
    ctx.setLineDash([]);
    [[a, found[0], 'luz'], [b, found[1], 'sombra'], [d, found[2], 'suelo']].forEach(([p, f, label]) => {
      ctx.beginPath();
      ctx.arc(p[0], p[1], 6, 0, TAU);
      ctx.fillStyle = f.color;
      ctx.fill();
      ctx.strokeStyle = '#1b2046';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = 'rgba(27,32,70,0.7)';
      ctx.font = '9px departure-mono, monospace';
      ctx.fillText(label, p[0] + 9, p[1] + 3);
    });
  }
}

export async function mount(host) {
  const lut = await loadLut();
  return new ShadowStudy(host, lut);
}
