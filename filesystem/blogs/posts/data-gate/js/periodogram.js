import { prepare } from './lightcurve.js?v=4';

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DATA_URL = new URL('../data/kepler-90-bls.json', import.meta.url);
const INK = '#f6efe3';
const DIM = 'rgba(185, 214, 248, 0.55)';
const LINE = 'rgba(206, 228, 255, 0.12)';
const ACCENT = '#b9d6f8';
const MONO = '10px departure-mono, ui-monospace, monospace';

export async function mount(figure) {
  const canvas = figure.querySelector('[data-role="canvas"]');
  const readout = figure.querySelector('[data-role="readout"]');

  const data = await fetch(DATA_URL, { credentials: 'omit' }).then((res) => {
    if (!res.ok) throw new Error('bls ' + res.status);
    return res.json();
  });

  const periods = data.periods;
  const power = data.power;
  const minPeriod = Math.min(...periods);
  const maxPeriod = Math.max(...periods);
  const maxPower = Math.max(...power);
  const logMin = Math.log10(minPeriod);
  const logMax = Math.log10(maxPeriod);

  let reveal = still ? 1 : 0;
  let hover = -1;

  const xOf = (period, pad, plotW) => pad.left + ((Math.log10(period) - logMin) / (logMax - logMin)) * plotW;

  function draw() {
    const { ctx, width, height } = prepare(canvas);
    const pad = { left: 46, right: 14, top: 16, bottom: 30 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const yOf = (value) => pad.top + (1 - Math.min(1, value / maxPower)) * plotH;

    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.font = MONO;
    ctx.fillStyle = DIM;
    for (const tick of [1, 10, 100]) {
      const x = Math.round(xOf(tick, pad, plotW)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, height - pad.bottom);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillText(`${tick} d`, x, height - 12);
    }

    ctx.textAlign = 'right';
    for (const level of [0.33, 0.66, 1]) {
      const y = Math.round(yOf(maxPower * level)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.strokeStyle = LINE;
      ctx.stroke();
      ctx.fillText(Math.round(maxPower * level), pad.left - 8, y + 4);
    }

    const limit = Math.floor(periods.length * reveal);

    for (const planet of data.known) {
      if (planet.period < minPeriod || planet.period > maxPeriod) continue;
      const x = xOf(planet.period, pad, plotW);
      if (x > pad.left + plotW * reveal) continue;
      ctx.strokeStyle = 'rgba(185, 214, 248, 0.35)';
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, height - pad.bottom);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.save();
      ctx.translate(x - 4, pad.top + 4);
      ctx.rotate(Math.PI / 2);
      ctx.textAlign = 'left';
      ctx.fillStyle = DIM;
      ctx.fillText(planet.name.replace('Kepler-90 ', ''), 0, 0);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.moveTo(pad.left, height - pad.bottom);
    for (let i = 0; i < limit; i++) ctx.lineTo(xOf(periods[i], pad, plotW), yOf(power[i]));
    ctx.lineTo(xOf(periods[Math.max(0, limit - 1)], pad, plotW), height - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = 'rgba(185, 214, 248, 0.1)';
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < limit; i++) {
      const x = xOf(periods[i], pad, plotW);
      const y = yOf(power[i]);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    if (hover >= 0 && hover < limit) {
      const x = xOf(periods[hover], pad, plotW);
      const y = yOf(power[hover]);
      ctx.strokeStyle = ACCENT;
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, height - pad.bottom);
      ctx.stroke();
      ctx.fillStyle = ACCENT;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const say = (index) => {
    if (index < 0) {
      const top = data.peaks.filter((peak) => peak.match && !peak.match.includes('x') && !peak.match.includes('/'));
      readout.textContent = `${data.points} mediciones · 90 000 periodos probados · ${top.length} planetas de Kepler-90 reencontrados`;
      return;
    }
    const period = periods[index];
    const planet = data.known.find((known) => Math.abs(period / known.period - 1) < 0.02);
    readout.textContent = `periodo ${period.toFixed(2)} días · señal ${power[index].toFixed(1)}${planet ? ' · aquí está ' + planet.name : ''}`;
  };

  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const pad = { left: 46, right: 14 };
    const plotW = rect.width - pad.left - pad.right;
    const ratio = (e.clientX - rect.left - pad.left) / plotW;
    if (ratio < 0 || ratio > 1) return;
    const period = 10 ** (logMin + ratio * (logMax - logMin));
    let best = 0;
    let bestGap = Infinity;
    for (let i = 0; i < periods.length; i++) {
      const gap = Math.abs(periods[i] - period);
      if (gap < bestGap) {
        bestGap = gap;
        best = i;
      }
    }
    hover = best;
    say(best);
    requestAnimationFrame(draw);
  });

  canvas.addEventListener('pointerleave', () => {
    hover = -1;
    say(-1);
    requestAnimationFrame(draw);
  });

  new ResizeObserver(() => draw()).observe(canvas);
  say(-1);
  draw();

  if (!still) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const step = (now) => {
        reveal = Math.min(1, (now - start) / 1600);
        draw();
        if (reveal < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.3 });
    observer.observe(canvas);
  }
}
