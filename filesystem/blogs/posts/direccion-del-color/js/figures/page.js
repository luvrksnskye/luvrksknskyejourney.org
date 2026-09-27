import { pageScale } from '/assets/js/page-scale.js';
import { loadMunsell, hueLabel, notation, grayHex, cssColor, supportsP3, FAMILIES, TAU, still } from '../munsell.js?v=1';

const HUES = Array.from({ length: 40 }, (_, i) => ((i + 1) * 2.5) % 100);

function fitCanvas(canvas, ctx) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const ratio = Math.min(devicePixelRatio || 1, 2) * pageScale();
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { width, height };
}

class Page {
  constructor(host, data) {
    this.host = host;
    this.data = data;
    this.figure = host.closest('.dd-figure');
    this.wheel = host.querySelector('[data-role="wheel"]');
    this.chart = host.querySelector('[data-role="chart"]');
    this.readout = this.figure.querySelector('[data-role="readout"]');
    this.canP3 = supportsP3();
    const options = this.canP3 ? { colorSpace: 'display-p3' } : undefined;
    this.wctx = this.wheel.getContext('2d', options);
    this.cctx = this.chart.getContext('2d', options);
    this.index = 9;
    this.shown = this.index;
    this.fade = 1;
    this.mark = true;
    this.p3 = false;
    this.bookOnly = false;
    this.hover = null;

    const markButton = this.figure.querySelector('[data-mark]');
    const p3Button = this.figure.querySelector('[data-p3]');
    const bookButton = this.figure.querySelector('[data-book]');
    markButton.addEventListener('click', () => {
      this.mark = !this.mark;
      markButton.setAttribute('aria-pressed', String(this.mark));
      this.draw();
    });
    if (this.canP3) {
      p3Button.hidden = false;
      p3Button.addEventListener('click', () => {
        this.p3 = !this.p3;
        p3Button.setAttribute('aria-pressed', String(this.p3));
        this.draw();
      });
    }
    bookButton.addEventListener('click', () => {
      this.bookOnly = !this.bookOnly;
      bookButton.setAttribute('aria-pressed', String(this.bookOnly));
      this.draw();
    });

    let dragging = false;
    const pick = (e) => {
      const rect = this.wheel.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const angle = (Math.atan2(y, x) + Math.PI / 2 + TAU) % TAU;
      this.select(Math.round((angle / TAU) * 40 - 1 + 40) % 40);
    };
    this.wheel.addEventListener('pointerdown', (e) => {
      dragging = true;
      this.wheel.setPointerCapture(e.pointerId);
      pick(e);
    });
    this.wheel.addEventListener('pointermove', (e) => dragging && pick(e));
    this.wheel.addEventListener('pointerup', () => { dragging = false; });
    this.wheel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') this.select((this.index + 1) % 40);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') this.select((this.index + 39) % 40);
      else return;
      e.preventDefault();
    });
    this.chart.addEventListener('pointermove', (e) => this.hovering(e));
    this.chart.addEventListener('pointerleave', () => {
      this.hover = null;
      this.draw();
      this.describe();
    });
    new ResizeObserver(() => this.draw()).observe(this.chart);
    this.describe();
    this.draw();
  }

  select(index) {
    if (index === this.index) return;
    this.previous = this.index;
    this.index = index;
    this.fade = still ? 1 : 0;
    this.describe();
    this.animate();
  }

  animate() {
    cancelAnimationFrame(this.frame);
    const start = performance.now();
    const step = (now) => {
      this.fade = Math.min(1, (now - start) / 320);
      this.draw();
      if (this.fade < 1) this.frame = requestAnimationFrame(step);
    };
    this.frame = requestAnimationFrame(step);
  }

  hovering(e) {
    if (!this.layout) return;
    const rect = this.chart.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * this.chart.clientWidth;
    const y = ((e.clientY - rect.top) / rect.height) * this.chart.clientHeight;
    const { left, top, cell } = this.layout;
    const c = Math.floor((x - left) / cell) * 2 + 2;
    const v = 9 - Math.floor((y - top) / cell);
    const i = v >= 1 && v <= 9 && c >= 2 ? this.data.at(HUES[this.index], v, c) : -1;
    const next = i >= 0 && this.visible(i) ? i : null;
    if (next !== this.hover) {
      this.hover = next;
      this.draw();
      this.describe();
    }
  }

  visible(i) {
    return !this.bookOnly || this.data.book[i];
  }

  describe() {
    const hue = HUES[this.index];
    if (this.hover !== null) {
      const i = this.hover;
      const g = this.data.gamut[i];
      const where = g === 2 ? 'cabe en sRGB' : g === 1 ? 'solo cabe en P3' : 'no cabe en ninguna pantalla común';
      this.readout.textContent = `${notation(hue, this.data.v[i], this.data.c[i], 0)} · ${where}${this.data.book[i] ? ' · estaba en el libro de 1929' : ''}`;
      return;
    }
    let peak = -1;
    let total = 0;
    let out = 0;
    for (let i = 0; i < this.data.count; i++) {
      if (Math.abs(this.data.h[i] - hue) > 0.01 || !this.visible(i)) continue;
      total++;
      if (this.data.gamut[i] < 2) out++;
      if (peak < 0 || this.data.c[i] > this.data.c[peak]) peak = i;
    }
    this.readout.textContent = peak < 0 ? hueLabel(hue) : `${hueLabel(hue)} · ${total} fichas · croma máximo ${this.data.c[peak]} en el valor ${this.data.v[peak]} · ${out} no caben en sRGB`;
  }

  draw() {
    this.drawWheel();
    this.drawChart();
  }

  drawWheel() {
    const ctx = this.wctx;
    const { width, height } = fitCanvas(this.wheel, ctx);
    if (!width) return;
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(width, height) / 2 - 18;
    ctx.clearRect(0, 0, width, height);
    this.ring ??= HUES.map((hue) => {
      let best = -1;
      for (let i = 0; i < this.data.count; i++) {
        if (Math.abs(this.data.h[i] - hue) > 0.01 || this.data.v[i] !== 6 || this.data.gamut[i] < 2) continue;
        if (best < 0 || this.data.c[i] > this.data.c[best]) best = i;
      }
      return best >= 0 ? this.data.hex[best] : '#999';
    });
    for (let k = 0; k < 40; k++) {
      const a0 = ((k + 1) / 40) * TAU - Math.PI / 2 - TAU / 80;
      const a1 = a0 + TAU / 40;
      ctx.beginPath();
      ctx.arc(cx, cy, r, a0 + 0.01, a1 - 0.01);
      ctx.arc(cx, cy, r * 0.62, a1 - 0.01, a0 + 0.01, true);
      ctx.closePath();
      ctx.fillStyle = this.ring[k];
      ctx.globalAlpha = k === this.index ? 1 : 0.82;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    const a = ((this.index + 1) / 40) * TAU - Math.PI / 2;
    ctx.strokeStyle = '#1b2046';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5);
    ctx.lineTo(cx + Math.cos(a) * (r + 12), cy + Math.sin(a) * (r + 12));
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * (r + 12), cy + Math.sin(a) * (r + 12), 4, 0, TAU);
    ctx.fillStyle = '#1b2046';
    ctx.fill();
    ctx.font = '10px departure-mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(27,32,70,0.6)';
    FAMILIES.forEach((family, i) => {
      const aa = ((i * 10 + 5) / 100) * TAU - Math.PI / 2;
      ctx.fillText(family, cx + Math.cos(aa) * r * 0.46, cy + Math.sin(aa) * r * 0.46);
    });
    ctx.fillStyle = '#1b2046';
    ctx.font = '15px Cinzel, serif';
    ctx.fillText(hueLabel(HUES[this.index]), cx, cy);
  }

  drawChart() {
    const ctx = this.cctx;
    const { width, height } = fitCanvas(this.chart, ctx);
    if (!width) return;
    ctx.clearRect(0, 0, width, height);
    const columns = 19;
    const left = 42;
    const top = 10;
    const cell = Math.min((width - left - 8) / columns, (height - top - 34) / 9);
    this.layout = { left, top, cell };
    const hue = HUES[this.index];
    const from = this.previous !== undefined ? HUES[this.previous] : hue;
    const k = this.fade;

    ctx.font = '10px departure-mono, monospace';
    ctx.textBaseline = 'middle';
    for (let v = 1; v <= 9; v++) {
      const y = top + (9 - v) * cell;
      ctx.fillStyle = grayHex(v);
      ctx.fillRect(left - 30, y + 2, cell - 4, cell - 4);
      ctx.fillStyle = v >= 6 ? '#1b2046' : '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(String(v), left - 30 + (cell - 4) / 2, y + cell / 2);
    }
    const drawPage = (h, alpha, shift) => {
      for (let v = 1; v <= 9; v++) {
        const y = top + (9 - v) * cell;
        for (let c = 2; c <= 38; c += 2) {
          const i = this.data.at(h, v, c);
          if (i < 0) continue;
          const x = left + (c / 2 - 1) * cell + shift;
          const shown = this.visible(i);
          ctx.globalAlpha = alpha * (shown ? 1 : 0.12);
          ctx.fillStyle = cssColor(this.data, i, this.p3);
          ctx.fillRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
          const out = this.p3 ? this.data.gamut[i] < 1 : this.data.gamut[i] < 2;
          if (this.mark && out && shown) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(x + 1.5, y + 1.5, cell - 3, cell - 3);
            ctx.clip();
            ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            ctx.lineWidth = 1;
            for (let d = -cell; d < cell; d += 5) {
              ctx.beginPath();
              ctx.moveTo(x + d, y + cell);
              ctx.lineTo(x + d + cell, y);
              ctx.stroke();
            }
            ctx.restore();
          }
          if (this.hover === i && alpha === 1) {
            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#1b2046';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, cell, cell);
          }
        }
      }
      ctx.globalAlpha = 1;
    };
    if (k < 1) drawPage(from, 1 - k, -k * 18);
    drawPage(hue, k, (1 - k) * 18);

    ctx.fillStyle = 'rgba(27,32,70,0.5)';
    ctx.textAlign = 'left';
    ctx.fillText('croma →', left, top + 9 * cell + 16);
    ctx.textAlign = 'right';
    ctx.fillText(`${hueLabel(hue)} · una página del libro`, left + columns * cell, top + 9 * cell + 16);
  }
}

export async function mount(host) {
  const data = await loadMunsell();
  return new Page(host, data);
}
