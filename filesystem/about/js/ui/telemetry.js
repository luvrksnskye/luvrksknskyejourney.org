import { still, clamp, loop, watchVisible, onSeen, pageScale } from '../core/env.js?v=3';
import { FIRST_LIGHT, DAY, stamp, monthLabel } from '../core/time.js?v=3';

const NS = 'http://www.w3.org/2000/svg';
const TAU = 900 * DAY;
const PAGE = 8;
const SEGMENTS = 40;
const MONTHS = ['j', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'];

const svgEl = (name, attrs, parent) => {
  const node = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  parent?.append(node);
  return node;
};

const monthKey = (ms) => {
  const d = new Date(ms);
  return d.getUTCFullYear() * 12 + d.getUTCMonth();
};

const level = (n) => (n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n < 5 ? 3 : 4);

function startMeter(card) {
  const value = card.querySelector('[data-meter-value]');
  const bar = card.querySelector('[data-segments]');
  if (!value || !bar) return;
  const cells = Array.from({ length: SEGMENTS }, (_, i) => {
    const cell = document.createElement('i');
    cell.style.setProperty('--i', i);
    bar.append(cell);
    return cell;
  });
  const progress = () => 1 - Math.exp(-(Date.now() - FIRST_LIGHT) / TAU);
  const paint = () => { value.textContent = (progress() * 100).toFixed(8); };
  paint();
  onSeen(card, () => {
    const on = Math.floor(progress() * SEGMENTS);
    cells.forEach((cell, i) => {
      cell.classList.toggle('is-on', i < on);
      cell.classList.toggle('is-edge', i === on);
    });
  });
  const ticker = loop(paint);
  watchVisible(card, (visible) => { ticker.running = visible && !still; });
}

function startHexmap(card, onPick) {
  const svg = card.querySelector('[data-hexmap]');
  const readout = card.querySelector('[data-hex-readout]');
  if (!svg) return () => {};
  const idle = readout?.textContent || '';
  let picked = null;

  function render(buckets) {
    svg.replaceChildren();
    const r = 22;
    const w = Math.sqrt(3) * r;
    const padX = 56;
    const padY = 34;
    const firstYear = new Date(FIRST_LIGHT).getUTCFullYear();
    const lastYear = new Date().getUTCFullYear();
    const years = lastYear - firstYear + 1;
    const W = padX + 12 * w + w / 2 + 4;
    const H = padY + years * r * 1.5 + r * 0.5 + 4;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    MONTHS.forEach((m, i) => {
      const t = svgEl('text', { class: 'tm-col-label', x: padX + i * w + w / 2, y: 14, 'text-anchor': 'middle' }, svg);
      t.textContent = m;
    });

    const nowKey = monthKey(Date.now());
    const startKey = monthKey(FIRST_LIGHT);
    let i = 0;
    for (let y = 0; y < years; y++) {
      const year = firstYear + y;
      const cy = padY + r + y * r * 1.5;
      const label = svgEl('text', { class: 'tm-row-label', x: 0, y: cy + 4 }, svg);
      label.textContent = String(year);
      for (let m = 0; m < 12; m++) {
        const key = year * 12 + m;
        const cx = padX + m * w + w / 2 + (y % 2 ? w / 2 : 0);
        const points = Array.from({ length: 6 }, (_, k) => {
          const a = Math.PI / 6 + (k * Math.PI) / 3;
          return `${(cx + r * 0.94 * Math.cos(a)).toFixed(1)},${(cy + r * 0.94 * Math.sin(a)).toFixed(1)}`;
        }).join(' ');
        const inRange = key >= startKey && key <= nowKey;
        const items = buckets.get(key) || [];
        const cell = svgEl('polygon', {
          class: 'tm-cell',
          points,
          'data-level': inRange ? level(items.length) : 'none',
          'data-key': key
        }, svg);
        cell.style.setProperty('--i', i++);
        if (inRange) {
          cell.setAttribute('tabindex', '0');
          cell.setAttribute('role', 'button');
          cell.setAttribute('aria-label', `${monthLabel(Date.UTC(year, m, 1))}, ${items.length} kept`);
        }
        if (picked === key) cell.classList.add('is-picked');
      }
    }
    onSeen(svg, () => svg.classList.add('is-in'), '0px 0px -10% 0px');
  }

  let current = new Map();

  const describe = (key) => {
    const items = current.get(key) || [];
    const when = monthLabel(Date.UTC(Math.floor(key / 12), key % 12, 1));
    if (!items.length) return `${when} · quiet`;
    return `${when} · ${items.length} kept · ${items.slice(0, 2).map((x) => x.title).join(', ')}${items.length > 2 ? '…' : ''}`;
  };

  const cellOf = (target) => (target instanceof SVGPolygonElement && target.dataset.level !== 'none' ? target : null);

  svg.addEventListener('pointerover', (e) => {
    const cell = cellOf(e.target);
    svg.querySelectorAll('.tm-cell.is-hot').forEach((c) => c.classList.remove('is-hot'));
    if (!cell) return;
    cell.classList.add('is-hot');
    if (readout) readout.textContent = describe(Number(cell.dataset.key));
  });

  svg.addEventListener('pointerleave', () => {
    svg.querySelectorAll('.tm-cell.is-hot').forEach((c) => c.classList.remove('is-hot'));
    if (readout) readout.textContent = picked == null ? idle : describe(picked);
  });

  const pick = (cell) => {
    const key = Number(cell.dataset.key);
    picked = picked === key ? null : key;
    svg.querySelectorAll('.tm-cell.is-picked').forEach((c) => c.classList.remove('is-picked'));
    if (picked != null) cell.classList.add('is-picked');
    onPick(picked, picked == null ? '' : monthLabel(Date.UTC(Math.floor(key / 12), key % 12, 1)));
  };

  svg.addEventListener('click', (e) => {
    const cell = cellOf(e.target);
    if (cell) pick(cell);
  });

  svg.addEventListener('keydown', (e) => {
    const cell = cellOf(e.target);
    if (!cell) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(cell);
    }
    if (e.key === 'Escape' && picked != null) pick(svg.querySelector('.tm-cell.is-picked'));
  });

  svg.addEventListener('focusin', (e) => {
    const cell = cellOf(e.target);
    if (cell && readout) readout.textContent = describe(Number(cell.dataset.key));
  });

  return {
    render(buckets) {
      current = buckets;
      render(buckets);
    },
    clear() {
      picked = null;
      svg.querySelectorAll('.tm-cell.is-picked').forEach((c) => c.classList.remove('is-picked'));
      if (readout) readout.textContent = idle;
    }
  };
}

function startCurve(card) {
  const svg = card.querySelector('[data-curve]');
  const readout = card.querySelector('[data-curve-readout]');
  if (!svg) return () => {};
  let points = [];
  let geometry = null;

  function render() {
    const box = svg.getBoundingClientRect();
    const scale = pageScale();
    const W = box.width / scale;
    const H = box.height / scale;
    if (!W || !H || points.length < 2) return;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.replaceChildren();

    const defs = svgEl('defs', {}, svg);
    const grad = svgEl('linearGradient', { id: 'tm-fade', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    svgEl('stop', { offset: '0%', 'stop-color': 'rgba(145,206,255,0.32)' }, grad);
    svgEl('stop', { offset: '100%', 'stop-color': 'rgba(145,206,255,0)' }, grad);

    const left = 30;
    const bottom = H - 18;
    const top = 10;
    const max = points.at(-1).total || 1;
    const t0 = points[0].at;
    const t1 = points.at(-1).at;
    const xs = (at) => left + ((at - t0) / Math.max(1, t1 - t0)) * (W - left - 6);
    const ys = (n) => bottom - (n / max) * (bottom - top);

    [0, 0.5, 1].forEach((f) => {
      const y = ys(max * f);
      svgEl('line', { class: 'tm-axis', x1: left, y1: y, x2: W, y2: y }, svg);
      const label = svgEl('text', { class: 'tm-axis-label', x: 0, y: y + 3 }, svg);
      label.textContent = String(Math.round(max * f));
    });

    const coords = points.map((p) => [xs(p.at), ys(p.total)]);
    let d = `M${coords[0][0]} ${coords[0][1]}`;
    for (let i = 1; i < coords.length; i++) {
      const [x0, y0] = coords[i - 1];
      const [x1, y1] = coords[i];
      const mx = (x0 + x1) / 2;
      d += ` C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`;
    }
    svgEl('path', { class: 'tm-area', d: `${d} L${coords.at(-1)[0]} ${bottom} L${coords[0][0]} ${bottom} Z` }, svg);
    const path = svgEl('path', { class: 'tm-path', d }, svg);
    path.style.setProperty('--len', Math.ceil(path.getTotalLength()));

    const years = new Set();
    points.forEach((p) => {
      const year = new Date(p.at).getUTCFullYear();
      if (years.has(year)) return;
      years.add(year);
      const label = svgEl('text', { class: 'tm-axis-label', x: Math.min(xs(p.at), W - 30), y: H - 2 }, svg);
      label.textContent = String(year);
    });

    const cursor = svgEl('g', { class: 'tm-cursor', opacity: 0 }, svg);
    const line = svgEl('line', { y1: top, y2: bottom }, cursor);
    const dot = svgEl('circle', { r: 4 }, cursor);
    geometry = { coords, cursor, line, dot };
    onSeen(svg, () => svg.classList.add('is-in'), '0px 0px -10% 0px');
  }

  svg.addEventListener('pointermove', (e) => {
    if (!geometry) return;
    const box = svg.getBoundingClientRect();
    const x = (e.clientX - box.left) / pageScale();
    let best = 0;
    geometry.coords.forEach(([cx], i) => {
      if (Math.abs(cx - x) < Math.abs(geometry.coords[best][0] - x)) best = i;
    });
    const [cx, cy] = geometry.coords[best];
    geometry.cursor.setAttribute('opacity', 1);
    geometry.line.setAttribute('x1', cx);
    geometry.line.setAttribute('x2', cx);
    geometry.dot.setAttribute('cx', cx);
    geometry.dot.setAttribute('cy', cy);
    if (readout) readout.textContent = `${monthLabel(points[best].at)} · ${points[best].total} kept`;
  });

  svg.addEventListener('pointerleave', () => {
    geometry?.cursor.setAttribute('opacity', 0);
    if (readout) readout.textContent = 'hover the line';
  });

  new ResizeObserver(() => requestAnimationFrame(render)).observe(svg);

  return (next) => {
    points = next;
    render();
  };
}

function startLog(card) {
  const list = card.querySelector('[data-log]');
  const more = card.querySelector('[data-log-more]');
  const scope = card.querySelector('[data-log-scope]');
  const buttons = [...card.querySelectorAll('[data-filter]')];
  let records = [];
  let kind = 'all';
  let month = null;
  let monthName = '';
  let open = false;
  let onClearMonth = () => {};

  function render() {
    const shown = records.filter((r) => (kind === 'all' || r.kind === kind) && (month == null || (r.at != null && monthKey(r.at) === month)));
    const slice = open ? shown : shown.slice(0, PAGE);
    list.replaceChildren(...slice.map((r, i) => {
      const li = document.createElement('li');
      li.className = 'tm-row';
      li.dataset.kind = r.kind;
      li.style.setProperty('--i', Math.min(i, 12));
      const index = document.createElement('span');
      index.className = 'tm-row-index';
      index.textContent = String(i + 1).padStart(2, '0');
      const time = document.createElement('time');
      time.textContent = r.kind === 'gallery' && r.label ? r.label.toLowerCase() : (r.at ? stamp(r.at) : 'someday');
      if (r.at) time.dateTime = new Date(r.at).toISOString().slice(0, 10);
      const type = document.createElement('span');
      type.className = 'tm-row-kind';
      type.textContent = r.kind;
      const link = document.createElement('a');
      link.href = r.href;
      link.textContent = r.title;
      li.append(index, time, type, link);
      return li;
    }));
    if (!slice.length) {
      const empty = document.createElement('li');
      empty.className = 'tm-row';
      empty.textContent = 'nothing kept here yet';
      list.append(empty);
    }
    more.hidden = open || shown.length <= PAGE;
    more.textContent = `show everything (${shown.length})`;
    scope.hidden = month == null;
    if (month != null) {
      scope.replaceChildren(`showing ${monthName}`);
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.textContent = 'clear';
      clear.addEventListener('click', () => {
        month = null;
        onClearMonth();
        render();
      });
      scope.append(clear);
    }
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      kind = button.dataset.filter;
      open = false;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      render();
    });
  });

  more.addEventListener('click', () => {
    open = true;
    render();
  });

  return {
    set(next) {
      records = next;
      render();
    },
    month(key, name) {
      month = key;
      monthName = name;
      open = false;
      render();
    },
    onClear(callback) {
      onClearMonth = callback;
    }
  };
}

export function startTelemetry(section) {
  startMeter(section.querySelector('[data-meter]'));
  const log = startLog(section.querySelector('.tm-log'));
  const map = startHexmap(section.querySelector('.tm-map'), (key, name) => log.month(key, name));
  log.onClear(() => map.clear());
  const curve = startCurve(section.querySelector('.tm-curve'));

  return {
    update(site) {
      const buckets = new Map();
      site.records.forEach((r) => {
        if (r.at == null || r.at < FIRST_LIGHT) return;
        const key = monthKey(r.at);
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(r);
      });
      map.render(buckets);

      const points = [];
      let total = 0;
      for (let key = monthKey(FIRST_LIGHT); key <= monthKey(Date.now()); key++) {
        total += (buckets.get(key) || []).length;
        points.push({ at: Date.UTC(Math.floor(key / 12), key % 12, 1), total });
      }
      curve(points);
      log.set(site.records);
    }
  };
}
