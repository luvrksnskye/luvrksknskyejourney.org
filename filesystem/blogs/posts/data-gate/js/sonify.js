import { loadCurve, percentile, prepare } from './lightcurve.js?v=4';

const STEPS = 240;
const WINDOW_DAYS = 24;
const START_DAY = 170;
const SCALE = [0, 3, 5, 7, 10];
const ROOT_HZ = 110;
const SOFT = 240;
const warp = (value) => Math.asinh(value / SOFT);

function buildSeries({ time, ppm, count }) {
  const values = new Float32Array(STEPS);
  const counts = new Uint16Array(STEPS);
  for (let i = 0; i < count; i++) {
    const offset = time[i] - START_DAY;
    if (offset < 0 || offset >= WINDOW_DAYS) continue;
    const step = Math.floor((offset / WINDOW_DAYS) * STEPS);
    values[step] += ppm[i];
    counts[step]++;
  }
  let last = 0;
  for (let s = 0; s < STEPS; s++) {
    values[s] = counts[s] ? values[s] / counts[s] : last;
    last = values[s];
  }
  return values;
}

function noteFor(norm) {
  const degree = Math.round(norm * (SCALE.length * 3 - 1));
  const octave = Math.floor(degree / SCALE.length);
  const semitone = SCALE[degree % SCALE.length] + octave * 12;
  return ROOT_HZ * 2 ** (semitone / 12);
}

export function mount(figure) {
  const canvas = figure.querySelector('[data-role="canvas"]');
  const button = figure.querySelector('[data-role="play"]');
  const readout = figure.querySelector('[data-role="readout"]');
  let series;
  let low;
  let high;
  let context;
  let playing = false;
  let step = 0;
  let timer = 0;

  function draw() {
    if (!series) return;
    const { ctx, width, height } = prepare(canvas);
    const top = 10;
    const plot = height - 20;
    const xOf = (s) => (s / (STEPS - 1)) * width;
    const yOf = (s) => top + (1 - (warp(series[s]) - low) / (high - low)) * plot;

    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let s = 0; s < STEPS; s++) ctx.lineTo(xOf(s), yOf(s));
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = 'rgba(185, 214, 248, 0.09)';
    ctx.fill();

    ctx.beginPath();
    for (let s = 0; s < STEPS; s++) {
      const x = xOf(s);
      const y = yOf(s);
      if (s) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.strokeStyle = 'rgba(232, 226, 216, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    if (!playing) return;

    ctx.beginPath();
    for (let s = 0; s <= step; s++) {
      const x = xOf(s);
      const y = yOf(s);
      if (s) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.strokeStyle = '#b9d6f8';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    const x = xOf(step);
    ctx.strokeStyle = 'rgba(185, 214, 248, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, height - 10);
    ctx.stroke();
    ctx.fillStyle = '#b9d6f8';
    ctx.beginPath();
    ctx.arc(x, yOf(step), 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function playStep() {
    if (!playing) return;
    const now = context.currentTime;
    const value = series[step];
    const norm = Math.min(1, Math.max(0, (warp(value) - low) / (high - low)));
    const change = step ? Math.abs(series[step] - series[step - 1]) / (high - low) : 0;
    const duration = Math.max(0.07, 0.2 - Math.min(0.13, change * 1.6));
    const frequency = noteFor(norm);

    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = norm < 0.35 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(norm < 0.35 ? 0.2 : 0.08, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration * (norm < 0.35 ? 3 : 1.4));
    osc.connect(gain).connect(context.destination);
    osc.start(now);
    osc.stop(now + duration * 3.2);

    readout.textContent = `día ${(START_DAY + (step / STEPS) * WINDOW_DAYS).toFixed(2)} · ${Math.round(value)} ppm · ${Math.round(frequency)} Hz · ${Math.round(duration * 1000)} ms`;
    draw();
    step = (step + 1) % STEPS;
    timer = setTimeout(playStep, duration * 1000);
  }

  function stop() {
    playing = false;
    clearTimeout(timer);
    button.setAttribute('aria-pressed', 'false');
    button.textContent = '▶ ESCUCHAR LA ESTRELLA';
    draw();
  }

  button.addEventListener('click', async () => {
    if (playing) {
      stop();
      return;
    }
    if (!series) return;
    context ??= new (window.AudioContext || window.webkitAudioContext)();
    await context.resume();
    playing = true;
    button.setAttribute('aria-pressed', 'true');
    button.textContent = '■ DETENER';
    playStep();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing) stop();
  });

  loadCurve('kepler-7').then((curve) => {
    series = buildSeries(curve);
    low = warp(percentile(series, 0)) - 0.15;
    high = warp(percentile(series, 1)) + 0.15;
    new ResizeObserver(draw).observe(canvas);
    draw();
  });
}
