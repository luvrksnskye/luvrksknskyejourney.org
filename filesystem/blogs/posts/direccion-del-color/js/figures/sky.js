import { pageScale } from '/assets/js/page-scale.js';
import { loadLut, lookupInto, notation, snapHue, rgbToHex, FAMILIES, TAU, still } from '../munsell.js?v=1';

const VW = 256;
const VH = 144;
const SW = 64;
const SH = 36;
const BANDS = {
  all: () => true,
  light: (v) => v >= 8,
  dark: (v) => v < 8
};

class SkyReader {
  constructor(host, lut) {
    this.host = host;
    this.lut = lut;
    this.figure = host.closest('.dd-figure');
    const q = (role) => host.querySelector(`[data-role="${role}"]`);
    this.videoCanvas = q('video');
    this.chart = q('chart');
    this.cross = q('cross');
    this.readout = q('readout');
    this.wheelButton = q('wheel');
    this.video = document.getElementById('ddVideo');
    this.videoCanvas.width = VW;
    this.videoCanvas.height = VH;
    this.vctx = this.videoCanvas.getContext('2d', { willReadFrequently: true });
    this.cctx = this.chart.getContext('2d');
    this.sample = document.createElement('canvas');
    this.sample.width = SW;
    this.sample.height = SH;
    this.sctx = this.sample.getContext('2d', { willReadFrequently: true });
    this.points = [];
    this.band = 'all';
    this.wheel = false;
    this.probe = null;
    this.out = {};

    for (const button of this.figure.querySelectorAll('[data-band]')) {
      button.addEventListener('click', () => {
        this.band = button.dataset.band;
        this.figure.querySelectorAll('[data-band]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
        this.drawChart();
        this.describe();
      });
    }
    this.wheelButton.addEventListener('click', () => {
      this.wheel = !this.wheel;
      this.wheelButton.setAttribute('aria-pressed', String(this.wheel));
      this.drawChart();
    });
    this.videoCanvas.addEventListener('pointermove', (e) => this.hover(e));
    this.videoCanvas.addEventListener('pointerdown', (e) => this.hover(e));
    this.videoCanvas.addEventListener('pointerleave', () => {
      this.probe = null;
      this.cross.hidden = true;
      this.drawChart();
    });
    new ResizeObserver(() => this.drawChart()).observe(this.chart);
    new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.setActive(this.visible && !document.hidden);
    }).observe(host);
    document.addEventListener('visibilitychange', () => this.setActive(this.visible && !document.hidden));
  }

  setActive(next) {
    if (next === this.active) return;
    this.active = next;
    if (!next) {
      cancelAnimationFrame(this.frame);
      return;
    }
    const loop = (now) => {
      if (!this.active) return;
      this.frame = requestAnimationFrame(loop);
      if (now - (this.lastFrame || 0) > (still ? 1000 : 66)) {
        this.lastFrame = now;
        this.drawVideo();
      }
      if (now - (this.lastSample || 0) > (still ? 3000 : 700)) {
        this.lastSample = now;
        this.samplePoints();
      }
    };
    this.frame = requestAnimationFrame(loop);
  }

  drawVideo() {
    if (!this.video || this.video.readyState < 2) {
      this.readout.textContent = 'esperando al video de fondo…';
      return;
    }
    this.vctx.drawImage(this.video, 0, 0, VW, VH);
    if (this.probe) this.readProbe();
  }

  samplePoints() {
    if (!this.video || this.video.readyState < 2) return;
    this.sctx.drawImage(this.video, 0, 0, SW, SH);
    const data = this.sctx.getImageData(0, 0, SW, SH).data;
    const points = [];
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      lookupInto(this.lut, r, g, b, this.out);
      points.push({ h: this.out.h, v: this.out.v, c: this.out.c, a: this.out.a, b: this.out.b, color: `rgb(${r},${g},${b})`, x: p % SW, y: Math.floor(p / SW) });
    }
    this.points = points;
    this.drawChart();
    this.describe();
  }

  hover(e) {
    const rect = this.videoCanvas.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return;
    this.probe = { fx, fy };
    this.readProbe();
  }

  readProbe() {
    const { fx, fy } = this.probe;
    const x = Math.min(VW - 3, Math.max(2, Math.round(fx * VW)));
    const y = Math.min(VH - 3, Math.max(2, Math.round(fy * VH)));
    const data = this.vctx.getImageData(x - 2, y - 2, 5, 5).data;
    let r = 0;
    let g = 0;
    let b = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    r = Math.round(r / 25);
    g = Math.round(g / 25);
    b = Math.round(b / 25);
    lookupInto(this.lut, r, g, b, this.out);
    this.probe.value = { h: this.out.h, v: this.out.v, c: this.out.c, color: rgbToHex(r, g, b) };
    const swatch = document.createElement('i');
    swatch.style.background = this.probe.value.color;
    this.cross.replaceChildren(swatch, notation(snapHue(this.out.h), this.out.v, this.out.c).replace(/\/(\d+)\.\d$/, '/$1'));
    this.cross.style.left = `${fx * 100}%`;
    this.cross.style.top = `${fy * 100}%`;
    this.cross.classList.toggle('is-flipped', fx > 0.6);
    this.cross.hidden = false;
    this.drawChart();
  }

  describe() {
    if (!this.points.length) return;
    const test = BANDS[this.band];
    const counts = new Array(10).fill(0);
    let total = 0;
    for (const p of this.points) {
      if (p.c < 1.5 || !test(p.v)) continue;
      counts[Math.floor(p.h / 10) % 10]++;
      total++;
    }
    if (!total) {
      this.readout.textContent = 'no hay puntos con color en esta franja';
      return;
    }
    const top = counts
      .map((n, i) => [FAMILIES[i], Math.round((n / total) * 100)])
      .filter(([, n]) => n >= 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([f, n]) => `${f} ${n}%`)
      .join(' · ');
    const label = { all: 'todo el fondo', light: 'las luces, valor 8 o más', dark: 'los medios y las sombras, valor menor a 8' }[this.band];
    this.readout.textContent = `${label}: ${top}`;
  }

  drawChart() {
    const canvas = this.chart;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(devicePixelRatio || 1, 2) * pageScale();
    if (canvas.width !== Math.round(width * ratio)) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }
    const ctx = this.cctx;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (this.wheel) this.drawWheel(ctx, width, height);
    else this.drawGrid(ctx, width, height);
  }

  drawGrid(ctx, width, height) {
    const left = 30;
    const bottom = height - 26;
    const top = 8;
    const right = width - 6;
    const x = (h) => left + (h / 100) * (right - left);
    const y = (v) => bottom - (v / 10) * (bottom - top);
    ctx.font = '9px departure-mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    FAMILIES.forEach((family, i) => {
      ctx.fillStyle = i % 2 ? 'rgba(27,32,70,0.03)' : 'rgba(27,32,70,0.06)';
      ctx.fillRect(x(i * 10), top, x(10) - x(0), bottom - top);
      ctx.fillStyle = 'rgba(27,32,70,0.55)';
      ctx.fillText(family, x(i * 10 + 5), bottom + 8);
    });
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let v = 0; v <= 10; v += 2) ctx.fillText(String(v), left - 8, y(v));
    const test = BANDS[this.band];
    for (const p of this.points) {
      const on = test(p.v) && p.c >= 1.5;
      ctx.globalAlpha = on ? 0.75 : 0.06;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(x(p.h), y(p.v), on ? 2.6 : 1.6, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (this.probe?.value) {
      const p = this.probe.value;
      ctx.strokeStyle = '#1b2046';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x(p.h), y(p.v), 8, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(27,32,70,0.5)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('valor ↑ · tono →', left, top);
  }

  drawWheel(ctx, width, height) {
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(width, height) / 2 - 16;
    const scale = r / 16;
    const colors = ['#d04c50', '#b6651a', '#927702', '#698318', '#3b8767', '#238781', '#2d849a', '#267ccb', '#9b62b6', '#c54f85'];
    colors.forEach((color, i) => {
      const a0 = (i / 10) * TAU - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 7, a0 + 0.02, a0 + TAU / 10 - 0.02);
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.fillStyle = 'rgba(27,32,70,0.55)';
      ctx.font = '9px departure-mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const am = a0 + TAU / 20;
      ctx.fillText(FAMILIES[i], cx + Math.cos(am) * (r - 10), cy + Math.sin(am) * (r - 10));
    });
    ctx.strokeStyle = 'rgba(27,32,70,0.1)';
    ctx.lineWidth = 1;
    for (const k of [4, 8, 12]) {
      ctx.beginPath();
      ctx.arc(cx, cy, k * scale, 0, TAU);
      ctx.stroke();
    }
    const test = BANDS[this.band];
    const hull = [];
    for (const p of this.points) {
      if (!test(p.v) || p.c < 1.5) continue;
      const a = (p.h / 100) * TAU - Math.PI / 2;
      const rr = Math.min(p.c, 16) * scale;
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr;
      hull.push([px, py]);
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, 2.4, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const shape = convexHull(hull);
    if (shape.length > 2) {
      ctx.beginPath();
      shape.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.closePath();
      ctx.strokeStyle = '#1b2046';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(27,32,70,0.04)';
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(27,32,70,0.55)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('la máscara de gama del fondo', 6, 4);
  }
}

function convexHull(points) {
  if (points.length < 3) return points;
  const sorted = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

export async function mount(host) {
  const lut = await loadLut();
  return new SkyReader(host, lut);
}
