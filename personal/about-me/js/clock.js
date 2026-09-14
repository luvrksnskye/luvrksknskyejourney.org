import { motion, still, svg, polar } from './fx.js?v=8';
import { clock } from './profile.js?v=10';

const C = 100;
const BASE = 50;
const REACH = 36;
const REFRESH_MS = 30 * 60000;
const pad = (n) => String(n).padStart(2, '0');

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export class ListeningClock {
  constructor(host) {
    this.host = host;
    this.data = null;
    this.drawn = false;
    this.visible = false;
    this.build();

    if (!clock.endpoint) {
      this.host.hidden = true;
      return;
    }

    new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (this.visible && !this.data) this.load();
    }, { rootMargin: '200px 0px' }).observe(host);

    setInterval(() => {
      if (this.visible && !document.hidden) this.load();
    }, REFRESH_MS);
    setInterval(() => this.markNow(), 60000);
  }

  build() {
    const head = el('div', 'ab-clock-head');
    head.append(el('span', '', 'LISTENING CLOCK'));
    this.window = el('em', '', '');
    head.append(this.window);

    const root = svg('svg', { viewBox: '0 0 200 200', class: 'ab-clock', role: 'img', 'aria-label': 'Listening clock' });
    svg('circle', { cx: C, cy: C, r: BASE - 6, class: 'ab-clock-base' }, root);
    svg('circle', { cx: C, cy: C, r: BASE + REACH + 6, class: 'ab-clock-rim' }, root);

    for (const hour of [0, 6, 12, 18]) {
      const [x, y] = polar(C, C, BASE + REACH + 13, hour * 15);
      const label = svg('text', { x, y: y + 3, class: 'ab-clock-hour', 'text-anchor': 'middle' }, root);
      label.textContent = pad(hour);
    }

    this.bars = Array.from({ length: 24 }, (_, hour) => {
      const [x1, y1] = polar(C, C, BASE, hour * 15 + 7.5);
      const line = svg('line', { x1, y1, x2: x1, y2: y1, class: 'ab-clock-bar', 'data-hour': hour }, root);
      svg('title', {}, line);
      return line;
    });

    this.now = svg('circle', { r: 2.6, class: 'ab-clock-now' }, root);
    this.peak = svg('text', { x: C, y: C + 4, class: 'ab-clock-peak', 'text-anchor': 'middle' }, root);
    this.peak.textContent = '--:--';
    this.caption = svg('text', { x: C, y: C + 17, class: 'ab-clock-caption', 'text-anchor': 'middle' }, root);
    this.caption.textContent = 'SYNCING';

    this.host.classList.add('ab-np-clock');
    this.host.append(head, root);
  }

  async load() {
    try {
      const res = await fetch(clock.endpoint, { headers: { accept: 'application/json' }, credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (!Array.isArray(data?.hours) || data.hours.length !== 24) throw new Error('shape');
      this.data = data;
      this.render();
    } catch (_) {
      if (!this.data) this.caption.textContent = 'OFFLINE';
    }
  }

  async render() {
    const { hours, total, days, timeZone } = this.data;
    const max = Math.max(1, ...hours);
    const peakHour = hours.indexOf(max);
    this.window.textContent = `LAST ${days} DAYS`;
    this.peak.textContent = total ? `${pad(peakHour)}:00` : '--:--';
    this.caption.textContent = total ? 'PEAK HOUR' : 'NO PLAYS YET';
    this.host.title = timeZone ? `Hours in ${timeZone}` : '';

    const ends = hours.map((count, hour) => {
      const reach = count ? 4 + (count / max) * (REACH - 4) : 1.5;
      return polar(C, C, BASE + reach, hour * 15 + 7.5);
    });

    this.bars.forEach((bar, hour) => {
      bar.classList.toggle('is-peak', total > 0 && hour === peakHour);
      bar.classList.toggle('is-empty', hours[hour] === 0);
      bar.firstChild.textContent = `${pad(hour)}:00  ${hours[hour]} ${hours[hour] === 1 ? 'play' : 'plays'}`;
    });

    const gsap = still || this.drawn ? null : await motion();
    this.bars.forEach((bar, hour) => {
      const [x2, y2] = ends[hour];
      if (gsap) {
        gsap.to(bar, { attr: { x2, y2 }, duration: 0.9, ease: 'expo.out', delay: hour * 0.025 });
      } else {
        bar.setAttribute('x2', x2);
        bar.setAttribute('y2', y2);
      }
    });
    this.drawn = true;
    this.markNow();
  }

  markNow() {
    if (!this.data?.timeZone) return;
    try {
      const parts = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hourCycle: 'h23', timeZone: this.data.timeZone }).formatToParts(new Date());
      const hour = Number(parts.find((p) => p.type === 'hour')?.value) % 24;
      const minute = Number(parts.find((p) => p.type === 'minute')?.value) || 0;
      const [cx, cy] = polar(C, C, BASE + REACH + 6, (hour + minute / 60) * 15);
      this.now.setAttribute('cx', cx);
      this.now.setAttribute('cy', cy);
    } catch (_) {}
  }
}
