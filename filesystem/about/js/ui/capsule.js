import { still, clamp, watchVisible, formatNumber, pageScale } from '../core/env.js?v=3';
import { peek, write } from '../core/cache.js?v=3';

const MAX_BLUR = 3;
const KEEP_AT = 0.9;

function wrap(paragraph, words) {
  const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const frag = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        frag.append(part);
        return;
      }
      const span = document.createElement('span');
      span.className = 'cp-w';
      span.textContent = part;
      frag.append(span);
      words.push({ el: span, decay: 0.45 + Math.random() * 0.55, blur: -1, kept: false });
    });
    node.replaceWith(frag);
  });
}

export function startCapsule(section) {
  const letter = section.querySelector('[data-capsule]');
  const keptEl = section.querySelector('[data-kept]');
  const totalEl = section.querySelector('[data-kept-total]');
  const badge = section.querySelector('.cp-integrity');
  const bar = section.querySelector('[data-kept-bar]');
  const ruler = section.querySelector('.cp-ruler');
  if (!letter) return;

  const words = [];
  letter.querySelectorAll('.cp-chapter > p').forEach((p) => wrap(p, words));
  if (totalEl) totalEl.textContent = formatNumber(words.length);

  const saved = peek('capsule-v2');
  const memory = saved?.length === words.length ? saved : '0'.repeat(words.length);
  let keptCount = 0;

  const keep = (word, fresh) => {
    word.kept = true;
    keptCount++;
    word.el.classList.add('is-kept');
    word.el.style.removeProperty('--b');
    if (fresh) {
      word.el.classList.add('is-fresh');
      setTimeout(() => word.el.classList.remove('is-fresh'), 1400);
    }
  };

  words.forEach((word, i) => {
    if (still || memory[i] === '1') keep(word, false);
  });

  let dirty = false;
  const render = () => {
    if (keptEl) keptEl.textContent = formatNumber(keptCount);
    badge?.classList.toggle('is-full', keptCount === words.length);
    bar?.style.setProperty('--kept', (keptCount / Math.max(1, words.length)).toFixed(3));
    if (dirty) {
      write('capsule-v2', words.map((w) => (w.kept ? '1' : '0')).join(''));
      dirty = false;
    }
  };
  render();
  if (still) return;

  const pointer = { x: -1e4, y: -1e4 };
  let active = false;
  let queued = false;
  let saveTimer = 0;

  const measure = () => {
    const scale = pageScale();
    for (const word of words) {
      if (word.kept) continue;
      const r = word.el.getBoundingClientRect();
      word.x = (r.left + r.width / 2) / scale;
      word.y = (r.top + r.height / 2) / scale + scrollY / scale;
    }
  };

  const update = () => {
    queued = false;
    if (!active) return;
    const scale = pageScale();
    const top = scrollY / scale;
    const view = innerHeight / scale;
    const mid = top + view * 0.5;
    const band = view * 0.3;
    const px = pointer.x / scale;
    const py = pointer.y / scale + top;
    let changed = false;
    for (const word of words) {
      if (word.kept || word.y < top - 40 || word.y > top + view + 40) continue;
      const read = clamp(1 - (Math.abs(word.y - mid) - band * 0.25) / band);
      const dx = word.x - px;
      const dy = word.y - py;
      const touch = clamp(1 - Math.sqrt(dx * dx + dy * dy) / 150);
      const focus = Math.max(read * 0.96, touch);
      if (focus >= KEEP_AT) {
        keep(word, true);
        changed = true;
        continue;
      }
      const blur = Math.round((1 - focus) * word.decay * MAX_BLUR * 2) / 2;
      if (blur !== word.blur) {
        word.blur = blur;
        word.el.style.setProperty('--b', blur);
      }
    }
    const box = letter.getBoundingClientRect();
    ruler?.style.setProperty('--read', clamp((innerHeight * 0.5 - box.top) / Math.max(1, box.height)).toFixed(3));
    if (changed) {
      dirty = true;
      bar?.style.setProperty('--kept', (keptCount / Math.max(1, words.length)).toFixed(3));
      if (keptEl) keptEl.textContent = formatNumber(keptCount);
      clearTimeout(saveTimer);
      saveTimer = setTimeout(render, 160);
    }
  };

  const queue = () => {
    if (queued || !active) return;
    queued = true;
    requestAnimationFrame(update);
  };

  addEventListener('scroll', queue, { passive: true });
  addEventListener('pointermove', (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    queue();
  }, { passive: true });

  const relayout = () => {
    measure();
    queue();
  };
  new ResizeObserver(relayout).observe(letter);
  document.fonts?.ready.then(relayout);

  watchVisible(letter, (on) => {
    active = on && keptCount < words.length;
    if (active) relayout();
  }, '20% 0px');
}
