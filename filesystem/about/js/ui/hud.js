import { formatNumber } from '../core/env.js?v=3';
import { daysAlive } from '../core/time.js?v=3';

export function startHud() {
  const body = document.body;
  const label = document.querySelector('[data-hud-section]');
  const progress = document.querySelector('[data-hud-progress]');
  const backdrop = document.querySelector('.sa-backdrop');
  const links = [...document.querySelectorAll('[data-rail]')];

  document.querySelectorAll('[data-days]').forEach((el) => {
    el.textContent = formatNumber(daysAlive());
  });

  let current = '';
  const activate = (section) => {
    if (section.id === current) return;
    current = section.id;
    body.dataset.temp = section.dataset.temp || 'warm';
    links.forEach((a) => a.setAttribute('aria-current', String(a.dataset.rail === current)));
    if (label) {
      label.classList.add('is-swapping');
      setTimeout(() => {
        label.textContent = section.dataset.section;
        label.classList.remove('is-swapping');
      }, 260);
    }
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) activate(entry.target);
    });
  }, { rootMargin: '-45% 0px -54% 0px' });
  document.querySelectorAll('[data-section]').forEach((s) => io.observe(s));

  let queued = false;
  const measure = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, scrollY / max) : 0;
    progress?.style.setProperty('--progress', p.toFixed(4));
    backdrop?.style.setProperty('--depth', p.toFixed(3));
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(measure);
  };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  measure();

  const live = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle('is-live', entry.isIntersecting));
  }, { rootMargin: '5% 0px' });
  document.querySelectorAll('.sa-section').forEach((s) => live.observe(s));
}
