import { NoteComments } from './comments.js?v=1';

function trackReading() {
  const bar = document.querySelector('[data-read-progress]');
  const article = document.querySelector('.nt-article');
  if (!bar || !article) return;

  let queued = false;
  const update = () => {
    queued = false;
    const rect = article.getBoundingClientRect();
    const span = Math.max(1, rect.height - innerHeight);
    const progress = Math.min(1, Math.max(0, -rect.top / span));
    bar.style.setProperty('--progress', progress.toFixed(4));
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  update();
}

function start() {
  trackReading();
  const section = document.querySelector('[data-comments]');
  if (section) new NoteComments(section).mount();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
