import { pageScale } from '/assets/js/page-scale.js';

const INK = '#f6efe3';
const DIM = 'rgba(246, 239, 227, 0.42)';
const LINE = 'rgba(206, 228, 255, 0.12)';
const ACCENT = '#b9d6f8';
const MONO = '10px departure-mono, ui-monospace, monospace';
const PUBLISHED_PERIOD = 4.885488596;

const cache = new Map();

export function loadCurve(name) {
  if (!cache.has(name)) {
    cache.set(name, fetch(new URL(`../data/${name}.bin`, import.meta.url))
      .then((res) => {
        if (!res.ok) throw new Error(`${name} ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        const raw = new Float32Array(buffer);
        const count = raw.length / 2;
        const time = new Float64Array(count);
        const ppm = new Float32Array(count);
        for (let i = 0; i < count; i++) {
          time[i] = raw[i * 2];
          ppm[i] = raw[i * 2 + 1];
        }
        return { time, ppm, count };
      }));
  }
  return cache.get(name);
}

export function percentile(values, p) {
  const sorted = Float32Array.from(values).sort();
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))))];
}

export function prepare(canvas) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const ratio = Math.min(devicePixelRatio || 1, 2) * pageScale();
  const pixelWidth = Math.round(width * ratio);
  const pixelHeight = Math.round(height * ratio);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  return { ctx, width, height };
}

function lowerBound(array, value) {
  let lo = 0;
  let hi = array.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (array[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function drawAxisLabel(ctx, text, x, y, align = 'left') {
  ctx.font = MONO;
  ctx.fillStyle = DIM;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

export function mountOverview(figure) {
  const overview = figure.querySelector('[data-role="overview"]');
  const detail = figure.querySelector('[data-role="detail"]');
  const readout = figure.querySelector('[data-role="readout"]');
  const SPAN = 45;

  loadCurve('kepler-90').then(({ time, ppm, count }) => {
    const t0 = time[0];
    const t1 = time[count - 1];
    const SOFT = 240;
    const warp = (value) => Math.asinh(value / SOFT);
    const low = warp(Math.min(percentile(ppm, 0.0005), -9000));
    const high = warp(percentile(ppm, 0.999) + 900);
    const TICKS = [0, -300, -1000, -3000, -8000];
    let center = 1450;

    const yOf = (value, top, height) => top + ((high - warp(value)) / (high - low)) * height;

    function drawOverview() {
      const { ctx, width, height } = prepare(overview);
      const columns = Math.max(1, Math.floor(width));
      const min = new Float32Array(columns).fill(Infinity);
      const max = new Float32Array(columns).fill(-Infinity);
      for (let i = 0; i < count; i++) {
        const c = Math.min(columns - 1, Math.floor(((time[i] - t0) / (t1 - t0)) * columns));
        if (ppm[i] < min[c]) min[c] = ppm[i];
        if (ppm[i] > max[c]) max[c] = ppm[i];
      }
      ctx.fillStyle = 'rgba(246, 239, 227, 0.5)';
      for (let c = 0; c < columns; c++) {
        if (min[c] === Infinity) continue;
        const y0 = yOf(max[c], 8, height - 16);
        const y1 = yOf(min[c], 8, height - 16);
        ctx.fillRect(c, y0, 1, Math.max(1, y1 - y0));
      }
      const x0 = ((center - SPAN / 2 - t0) / (t1 - t0)) * width;
      const w = (SPAN / (t1 - t0)) * width;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.strokeRect(x0 + 0.5, 0.5, w, height - 1);
      ctx.fillStyle = 'rgba(185, 214, 248, 0.14)';
      ctx.fillRect(x0, 0, w, height);
    }

    function drawDetail() {
      const { ctx, width, height } = prepare(detail);
      const pad = { left: 86, right: 10, top: 10, bottom: 24 };
      const plotW = width - pad.left - pad.right;
      const plotH = height - pad.top - pad.bottom;
      const from = center - SPAN / 2;
      const to = center + SPAN / 2;

      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      for (const level of TICKS) {
        const y = Math.round(yOf(level, pad.top, plotH)) + 0.5;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(width - pad.right, y);
        ctx.stroke();
        drawAxisLabel(ctx, `${level} ppm`, pad.left - 6, y + 4, 'right');
      }

      const start = lowerBound(time, from);
      const end = lowerBound(time, to);
      const columns = Math.max(1, Math.round(plotW));
      const sums = new Float64Array(columns);
      const counts = new Uint16Array(columns);
      let deepest = 0;

      ctx.fillStyle = 'rgba(232, 226, 216, 0.5)';
      for (let i = start; i < end; i++) {
        const t = (time[i] - from) / SPAN;
        const x = pad.left + t * plotW;
        ctx.fillRect(x - 0.9, yOf(ppm[i], pad.top, plotH) - 0.9, 1.8, 1.8);
        const c = Math.min(columns - 1, Math.max(0, Math.floor(t * columns)));
        sums[c] += ppm[i];
        counts[c]++;
        if (ppm[i] < deepest) deepest = ppm[i];
      }

      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      let drawing = false;
      for (let c = 0; c < columns; c++) {
        if (!counts[c]) {
          drawing = false;
          continue;
        }
        const x = pad.left + c + 0.5;
        const y = yOf(sums[c] / counts[c], pad.top, plotH);
        if (drawing) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
        drawing = true;
      }
      ctx.stroke();

      drawAxisLabel(ctx, `BKJD ${from.toFixed(1)}`, pad.left, height - 6);
      drawAxisLabel(ctx, `${to.toFixed(1)}`, width - pad.right, height - 6, 'right');

      const points = end - start;
      readout.textContent = points
        ? `${points} mediciones en ${SPAN} días · mínimo ${Math.round(deepest)} ppm${deepest < -3000 ? ' · ¡ahí hay un tránsito de un planeta gigante!' : ''}`
        : 'hueco en los datos: la estrella cayó en un módulo averiado en este tramo';
    }

    const render = () => {
      drawOverview();
      drawDetail();
    };

    const setCenter = (value) => {
      center = Math.min(t1 - SPAN / 2, Math.max(t0 + SPAN / 2, value));
      requestAnimationFrame(render);
    };

    const timeAt = (e) => {
      const rect = overview.getBoundingClientRect();
      return t0 + ((e.clientX - rect.left) / rect.width) * (t1 - t0);
    };

    overview.addEventListener('pointerdown', (e) => {
      overview.setPointerCapture(e.pointerId);
      setCenter(timeAt(e));
    });
    overview.addEventListener('pointermove', (e) => {
      if (overview.hasPointerCapture(e.pointerId)) setCenter(timeAt(e));
    });
    overview.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? SPAN : SPAN / 4;
      if (e.key === 'ArrowLeft') setCenter(center - step);
      else if (e.key === 'ArrowRight') setCenter(center + step);
      else return;
      e.preventDefault();
    });

    new ResizeObserver(render).observe(overview);
    render();
  });
}

export function mountFold(figure) {
  const canvas = figure.querySelector('[data-role="canvas"]');
  const input = figure.querySelector('[data-role="period"]');
  const output = figure.querySelector('[data-role="value"]');
  const snap = figure.querySelector('[data-role="snap"]');
  const readout = figure.querySelector('[data-role="readout"]');
  const BINS = 220;
  const RANGE = 0.25;

  loadCurve('kepler-7').then(({ time, ppm, count }) => {
    const SOFT = 240;
    const warp = (value) => Math.asinh(value / SOFT);
    const low = warp(percentile(ppm, 0.002)) - 0.2;
    const high = warp(percentile(ppm, 0.998)) + 0.2;
    const TICKS = [0, -400, -1500, -5000];

    let epoch = time[0];
    {
      const width = 0.2;
      const sums = new Map();
      for (let i = 0; i < count; i++) {
        const key = Math.floor(time[i] / width);
        const bin = sums.get(key) || [0, 0];
        bin[0] += ppm[i];
        bin[1]++;
        sums.set(key, bin);
      }
      let lowest = Infinity;
      for (const [key, [sum, n]] of sums) {
        if (n < 4) continue;
        const mean = sum / n;
        if (mean < lowest) {
          lowest = mean;
          epoch = (key + 0.5) * width;
        }
      }
    }

    function refine(period) {
      let best = epoch;
      let bestDepth = 0;
      for (let shift = -0.3; shift <= 0.3; shift += 0.01) {
        const t = epoch + shift;
        let sum = 0;
        let n = 0;
        for (let i = 0; i < count; i += 3) {
          const phase = (((time[i] - t) / period) % 1 + 1.5) % 1 - 0.5;
          if (Math.abs(phase) < 0.004) {
            sum += ppm[i];
            n++;
          }
        }
        if (n && sum / n < bestDepth) {
          bestDepth = sum / n;
          best = t;
        }
      }
      return best;
    }
    epoch = refine(PUBLISHED_PERIOD);

    function draw() {
      const period = Number(input.value);
      output.textContent = `${period.toFixed(4)} d`;
      const { ctx, width, height } = prepare(canvas);
      const pad = { left: 86, right: 10, top: 12, bottom: 26 };
      const plotW = width - pad.left - pad.right;
      const plotH = height - pad.top - pad.bottom;
      const yOf = (value) => pad.top + ((high - warp(value)) / (high - low)) * plotH;
      const xOf = (phase) => pad.left + ((phase + RANGE) / (2 * RANGE)) * plotW;

      ctx.strokeStyle = LINE;
      for (const level of TICKS) {
        const y = Math.round(yOf(level)) + 0.5;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(width - pad.right, y);
        ctx.stroke();
        ctx.font = MONO;
        ctx.fillStyle = DIM;
        ctx.textAlign = 'right';
        ctx.fillText(`${level} ppm`, pad.left - 6, y + 4);
      }

      const sums = new Float64Array(BINS);
      const counts = new Uint32Array(BINS);
      ctx.fillStyle = 'rgba(246, 239, 227, 0.16)';
      for (let i = 0; i < count; i++) {
        const phase = (((time[i] - epoch) / period) % 1 + 1.5) % 1 - 0.5;
        if (Math.abs(phase) > RANGE) continue;
        ctx.fillRect(xOf(phase) - 0.6, yOf(ppm[i]) - 0.6, 1.2, 1.2);
        const bin = Math.min(BINS - 1, Math.floor(((phase + RANGE) / (2 * RANGE)) * BINS));
        sums[bin] += ppm[i];
        counts[bin]++;
      }

      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let depth = 0;
      let started = false;
      for (let b = 0; b < BINS; b++) {
        if (!counts[b]) continue;
        const mean = sums[b] / counts[b];
        if (mean < depth) depth = mean;
        const x = pad.left + ((b + 0.5) / BINS) * plotW;
        if (started) ctx.lineTo(x, yOf(mean));
        else ctx.moveTo(x, yOf(mean));
        started = true;
      }
      ctx.stroke();

      ctx.font = MONO;
      ctx.fillStyle = DIM;
      ctx.textAlign = 'center';
      ctx.fillText('FASE -0.25', pad.left + 30, height - 8);
      ctx.fillText('0', pad.left + plotW / 2, height - 8);
      ctx.fillText('+0.25', width - pad.right - 22, height - 8);

      const error = Math.abs(period - PUBLISHED_PERIOD);
      const sharpness = Math.min(1, Math.abs(depth) / 7400);
      readout.textContent = `profundidad del promedio ${Math.round(depth)} ppm · nitidez ${Math.round(sharpness * 100)}% · diferencia con el periodo publicado ${error.toFixed(4)} d`;
    }

    let queued = false;
    const request = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        draw();
      });
    };

    input.addEventListener('input', request);
    snap.addEventListener('click', () => {
      input.value = PUBLISHED_PERIOD.toFixed(4);
      request();
    });
    new ResizeObserver(request).observe(canvas);
    draw();
  });
}
