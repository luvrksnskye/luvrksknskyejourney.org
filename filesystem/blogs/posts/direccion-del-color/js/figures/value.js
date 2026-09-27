import { DECODE, valueFromY, yFromValue, encode, still } from '../munsell.js?v=1';

const WIDTH = 320;
const HEIGHT = 180;

class ValueStudy {
  constructor(host) {
    this.host = host;
    this.figure = host.closest('.dd-figure');
    this.canvas = host.querySelector('[data-role="canvas"]');
    this.scale = host.querySelector('[data-role="scale"]');
    this.readout = host.querySelector('[data-role="readout"]');
    this.steps = host.querySelector('[data-role="steps"]');
    this.stepsOut = host.querySelector('[data-role="steps-out"]');
    this.colorButton = host.querySelector('[data-role="color"]');
    this.squintButton = host.querySelector('[data-role="squint"]');
    this.video = document.getElementById('ddVideo');
    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.color = false;
    this.squint = false;
    this.active = false;
    this.lastScale = 0;
    this.values = new Uint8Array(WIDTH * HEIGHT);
    this.grayTable = new Uint8Array(11 * 11);

    this.steps.addEventListener('input', () => {
      this.stepsOut.textContent = this.steps.value;
      this.buildScale();
      this.render(true);
    });
    this.colorButton.addEventListener('click', () => {
      this.color = !this.color;
      this.colorButton.setAttribute('aria-pressed', String(this.color));
      this.render(true);
    });
    this.squintButton.addEventListener('click', () => {
      this.squint = !this.squint;
      this.squintButton.setAttribute('aria-pressed', String(this.squint));
      this.render(true);
    });

    this.buildScale();
    new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.setActive(this.visible && !document.hidden);
    }).observe(this.canvas);
    document.addEventListener('visibilitychange', () => this.setActive(this.visible && !document.hidden));
  }

  levels() {
    const n = Number(this.steps.value);
    return Array.from({ length: n }, (_, k) => (n === 1 ? 5 : (k / (n - 1)) * 10));
  }

  buildScale() {
    const levels = this.levels();
    this.scale.replaceChildren(...levels.map((v) => {
      const span = document.createElement('span');
      const g = encode(yFromValue(v));
      span.style.background = `rgb(${g}, ${g}, ${g})`;
      span.style.color = v >= 6 ? '#1b2046' : '#ffffff';
      span.dataset.v = `V ${Math.round(v * 10) / 10}`;
      return span;
    }));
  }

  setActive(next) {
    if (next === this.active) return;
    this.active = next;
    if (next) {
      const loop = (now) => {
        if (!this.active) return;
        this.frame = requestAnimationFrame(loop);
        if (now - (this.last || 0) < (still ? 1000 : 50)) return;
        this.last = now;
        this.render(false, now);
      };
      this.frame = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(this.frame);
    }
  }

  render(force, now = performance.now()) {
    const video = this.video;
    if (!video || video.readyState < 2) {
      this.readout.textContent = 'esperando al video de fondo…';
      return;
    }
    const ctx = this.ctx;
    ctx.filter = this.squint ? 'blur(3px)' : 'none';
    ctx.drawImage(video, 0, 0, WIDTH, HEIGHT);
    ctx.filter = 'none';
    if (this.color) {
      if (force || now - this.lastScale > 600) this.describe(null);
      return;
    }
    const image = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    const px = image.data;
    const levels = this.levels();
    const n = levels.length;
    const grays = levels.map((v) => encode(yFromValue(v)));
    const counts = new Uint32Array(n);
    for (let i = 0, p = 0; i < px.length; i += 4, p++) {
      const y = 0.2126 * DECODE[px[i]] + 0.7152 * DECODE[px[i + 1]] + 0.0722 * DECODE[px[i + 2]];
      const v = valueFromY(y);
      const k = Math.min(n - 1, Math.max(0, Math.round((v / 10) * (n - 1))));
      counts[k]++;
      const g = grays[k];
      px[i] = g;
      px[i + 1] = g;
      px[i + 2] = g;
    }
    ctx.putImageData(image, 0, 0);
    if (force || now - this.lastScale > 600) {
      this.lastScale = now;
      this.describe(counts);
    }
  }

  describe(counts) {
    const levels = this.levels();
    if (!counts) {
      this.readout.textContent = 'el fondo con su color de siempre · vuelve a apagarlo para ver solo el valor';
      return;
    }
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    [...this.scale.children].forEach((span, k) => {
      span.style.flexGrow = String(0.25 + (counts[k] / total) * levels.length * 2);
    });
    let high = 0;
    for (let k = 0; k < levels.length; k++) if (levels[k] >= 7) high += counts[k];
    const share = Math.round((high / total) * 100);
    const key = share > 60 ? 'clave alta, luminosa' : share < 30 ? 'clave baja, oscura' : 'clave media';
    this.readout.textContent = `${levels.length} escalones · el ${share}% del fondo está en valor 7 o más · ${key}`;
  }
}

export function mount(host) {
  return new ValueStudy(host);
}
