import { Scene } from './scene.js?v=6';

const MUSIC = '/filesystem/astra/assets/astraBGmusic.mp3';
const VOLUME = 0.16;

const LAYERS = [
  { key: '1', id: 'depth', name: 'deep field' },
  { key: '2', id: 'strands', name: 'filaments' },
  { key: '3', id: 'floor', name: 'ground' },
  { key: '4', id: 'mesh', name: 'proximity' },
  { key: '5', id: 'index', name: 'index' },
  { key: 'l', id: 'labels', name: 'labels' },
  { key: 'c', id: 'compass', name: 'compass' }
];

const KEYS = [
  ['arrows', 'orbit'],
  ['+ −', 'zoom'],
  ['tab', 'next node'],
  ['enter', 'open note'],
  ['space', 'hold still'],
  ['r', 'reset'],
  ['esc', 'leave']
];

let live = null;

export const networkScene = () => live;

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

function ambience(src, seconds = 8) {
  const audio = new Audio(src);
  audio.loop = true;
  audio.volume = 0;
  let raf = 0;

  const ramp = (to, span) => {
    cancelAnimationFrame(raf);
    const from = audio.volume;
    const started = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - started) / (span * 1000));
      audio.volume = from + (to - from) * t;
      if (t < 1) raf = requestAnimationFrame(step);
      else if (to === 0) audio.pause();
    };
    raf = requestAnimationFrame(step);
  };

  const start = () => {
    audio
      .play()
      .then(() => ramp(VOLUME, seconds))
      .catch(() => {
        addEventListener('pointerdown', start, { once: true, passive: true });
        addEventListener('keydown', start, { once: true });
      });
  };

  return { start, stop: () => ramp(0, 0.7) };
}

function chrome(stars, links) {
  const wrap = el('div', 'nn-chrome');
  for (const corner of ['tl', 'tr', 'bl', 'br']) wrap.append(el('i', `nn-corner nn-${corner}`));

  const bar = el('header', 'nn-hud');
  const mark = el('span', 'nn-mark');
  mark.append(el('b', null, 'astra'), el('span', null, 'memory network'));
  const readout = el('span', 'nn-readout');
  readout.append(
    el('b', null, String(stars.length).padStart(3, '0')),
    el('span', null, 'nodes'),
    el('i', null, '//'),
    el('b', null, String(links.length).padStart(3, '0')),
    el('span', null, 'links')
  );
  const exit = el('button', 'nn-exit', 'exit');
  exit.type = 'button';
  bar.append(mark, el('span', 'nn-rule'), readout, exit);

  const boot = el('ol', 'nn-boot');
  ['link established', 'loading memory graph', 'drawing filaments', 'network online'].forEach((line, i) => {
    const item = el('li', null, line);
    item.style.animationDelay = `${260 + i * 700}ms`;
    boot.append(item);
  });

  return { wrap, bar, boot, exit };
}

function controls(scene) {
  const box = el('div', 'nn-controls');
  box.append(el('span', 'nn-controls-title', 'layers'));
  const rows = new Map();

  LAYERS.forEach((layer, i) => {
    const row = el('button', 'nn-layer');
    row.type = 'button';
    row.style.animationDelay = `${140 + i * 60}ms`;
    row.append(el('kbd', null, layer.key), el('span', null, layer.name), el('i', 'nn-layer-state'));
    row.addEventListener('click', () => scene.toggle(layer.id));
    rows.set(layer.id, row);
    box.append(row);
  });

  const paint = (state) => {
    for (const [id, row] of rows) row.classList.toggle('is-on', Boolean(state[id]));
  };
  paint(scene.layers);
  return { box, paint };
}

function legend() {
  const box = el('div', 'nn-keys');
  KEYS.forEach(([key, what], i) => {
    const row = el('span', 'nn-key');
    row.style.animationDelay = `${320 + i * 50}ms`;
    row.append(el('kbd', null, key), el('span', null, what));
    box.append(row);
  });
  return box;
}

function panel() {
  const aside = el('aside', 'nn-panel');
  aside.hidden = true;
  const stage = el('span', 'nn-panel-stage');
  const title = el('h2', 'nn-panel-title');
  const meta = el('p', 'nn-panel-meta');
  const summary = el('p', 'nn-panel-summary');
  const read = el('a', 'nn-panel-read', 'open the note');
  const close = el('button', 'nn-panel-close', 'close');
  close.type = 'button';
  aside.append(close, stage, title, meta, summary, read);
  return { aside, stage, title, meta, summary, read, close };
}

export function openNetwork(posts, edges) {
  if (document.querySelector('.nn')) return;
  const stars = posts
    .filter((post) => post.id)
    .map((post) => ({
      id: post.id,
      title: post.plainTitle ?? post.title,
      url: post.url,
      domain: post.category,
      stage: post.stage ?? 'main-sequence',
      summary: post.description ?? ''
    }));
  if (!stars.length) return;
  const links = edges.map((edge) => ({ from: edge.from, to: edge.to }));

  const overlay = el('div', 'nn is-entering');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'the memory network');

  const canvas = el('canvas', 'nn-canvas');
  const parts = chrome(stars, links);
  const sheet = panel();
  const tag = el('span', 'nn-tag');
  tag.hidden = true;

  overlay.append(canvas, parts.wrap, parts.bar, parts.boot, tag, sheet.aside);
  document.body.append(overlay);
  document.body.classList.add('is-diving');

  const music = ambience(MUSIC);
  music.start();

  let board = null;
  let panelTimer = 0;

  const scene = new Scene(canvas, stars, links, {
    onReady: () => overlay.classList.add('is-ready'),
    onLayers: (state) => board?.paint(state),
    onHover: (node) => {
      if (node) {
        tag.textContent = node.title;
        tag.hidden = false;
      } else if (!scene.selected) {
        tag.hidden = true;
      }
    },
    onFrame: (engine) => {
      const marked = engine.hover ?? engine.selected;
      if (!marked || tag.hidden) return;
      const at = engine.screenOf(marked);
      tag.style.transform = `translate3d(${Math.round(at.x)}px, ${Math.round(at.y)}px, 0)`;
      tag.style.opacity = at.visible ? '1' : '0';
    },
    onSelect: (node) => {
      clearTimeout(panelTimer);
      if (!node) {
        sheet.aside.classList.remove('is-in');
        panelTimer = setTimeout(() => {
          sheet.aside.hidden = true;
        }, 340);
        tag.hidden = true;
        return;
      }
      const star = stars.find((item) => item.id === node.id);
      sheet.stage.textContent = star.stage;
      sheet.title.textContent = star.title;
      sheet.meta.textContent = `${star.domain} // node ${String(stars.indexOf(star) + 1).padStart(3, '0')}`;
      sheet.summary.textContent = star.summary;
      sheet.read.href = star.url;
      sheet.aside.hidden = false;
      sheet.aside.classList.remove('is-in');
      tag.textContent = star.title;
      tag.hidden = false;
      panelTimer = setTimeout(() => sheet.aside.classList.add('is-in'), 20);
    }
  });

  board = controls(scene);
  overlay.append(board.box, legend());
  live = scene;

  const close = () => {
    if (overlay.classList.contains('is-leaving')) return;
    const wait = scene.leave();
    music.stop();
    overlay.classList.add('is-leaving');
    setTimeout(() => {
      scene.destroy();
      live = null;
      overlay.remove();
      document.body.classList.remove('is-diving');
      removeEventListener('keydown', onKey);
      document.querySelector('[data-view="network"]')?.focus();
    }, wait);
  };

  const onKey = (event) => {
    const layer = LAYERS.find((item) => item.key === event.key.toLowerCase());
    if (layer && !event.metaKey && !event.ctrlKey) {
      scene.toggle(layer.id);
      return;
    }
    switch (event.key) {
      case 'Escape':
        close();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        scene.orbit(-0.12, 0);
        break;
      case 'ArrowRight':
        event.preventDefault();
        scene.orbit(0.12, 0);
        break;
      case 'ArrowUp':
        event.preventDefault();
        scene.orbit(0, -0.08);
        break;
      case 'ArrowDown':
        event.preventDefault();
        scene.orbit(0, 0.08);
        break;
      case '+':
      case '=':
        scene.zoom(0.85);
        break;
      case '-':
      case '_':
        scene.zoom(1.18);
        break;
      case 'Tab':
        event.preventDefault();
        scene.cycle(event.shiftKey ? -1 : 1);
        break;
      case 'Enter':
        if (scene.selected) location.href = scene.selected.url;
        break;
      case ' ':
        event.preventDefault();
        overlay.classList.toggle('is-held', !scene.rest());
        break;
      case 'r':
      case 'R':
        scene.select(null);
        scene.want.yaw = 0.6;
        scene.want.pitch = 0.26;
        scene.want.distance = scene.wide;
        break;
      default:
    }
  };

  parts.exit.addEventListener('click', close);
  sheet.close.addEventListener('click', () => scene.select(null));
  addEventListener('keydown', onKey);
  setTimeout(() => {
    overlay.classList.remove('is-entering');
    overlay.classList.add('is-live');
    parts.exit.focus({ preventScroll: true });
  }, 16);
}
