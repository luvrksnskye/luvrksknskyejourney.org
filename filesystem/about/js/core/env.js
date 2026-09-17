export { pageScale } from '/assets/js/page-scale.js';

export const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export const easeOut = (t) => 1 - Math.pow(1 - t, 4);

export function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

export function onSeen(el, callback, rootMargin = '0px 0px -12% 0px') {
  if (!el) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      callback(el);
    });
  }, { rootMargin });
  io.observe(el);
}

export function watchVisible(el, callback, rootMargin = '10% 0px') {
  if (!el) return;
  let inView = false;
  const emit = () => callback(inView && !document.hidden);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    emit();
  }, { rootMargin }).observe(el);
  document.addEventListener('visibilitychange', emit);
}

export function loop(step) {
  let id = 0;
  let last = 0;
  const frame = (now) => {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    step(now, dt);
    if (id) id = requestAnimationFrame(frame);
  };
  return {
    set running(on) {
      if (on && !id) id = requestAnimationFrame(frame);
      if (!on && id) {
        cancelAnimationFrame(id);
        id = 0;
        last = 0;
      }
    },
    get running() {
      return id !== 0;
    }
  };
}

export const formatNumber = (n) => Math.round(n).toLocaleString('en-US');

export function countTo(el, value, duration = 1800) {
  if (!el) return;
  const from = Number(el.dataset.shown || 0);
  el.dataset.shown = value;
  if (still || from === value) {
    el.textContent = formatNumber(value);
    return;
  }
  const start = performance.now();
  const tick = (now) => {
    const t = clamp((now - start) / duration);
    el.textContent = formatNumber(from + (value - from) * easeOut(t));
    if (t < 1) requestAnimationFrame(tick);
  };
  onSeen(el, () => requestAnimationFrame(tick), '0px');
}
