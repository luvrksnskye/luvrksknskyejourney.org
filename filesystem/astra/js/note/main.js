import { NoteComments } from './comments.js?v=1';
import { mountLoop, mountMusic } from './sound.js?v=1';

function trackReading() {
  const bars = document.querySelectorAll('[data-read-progress], [data-read-mirror]');
  const article = document.querySelector('.nt-article');
  if (!bars.length || !article) return;

  let queued = false;
  const update = () => {
    queued = false;
    const rect = article.getBoundingClientRect();
    const span = Math.max(1, rect.height - innerHeight);
    const progress = Math.min(1, Math.max(0, -rect.top / span));
    bars.forEach((bar) => bar.style.setProperty('--progress', progress.toFixed(4)));
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
  mountLoop(document.querySelector('[data-loop]'));
  mountMusic(document.querySelector('[data-music]'));
  const section = document.querySelector('[data-comments]');
  if (section) new NoteComments(section).mount();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
