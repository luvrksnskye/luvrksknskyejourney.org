import { $, state, store, bus, say } from './core.js?v=2';
import { gl } from './gl.js?v=2';

const LIST = 'data/backdrops.json?v=2';
const SAFE = /^\/?[a-z0-9_-][a-z0-9._-]*(\/[a-z0-9_-][a-z0-9._-]*)*\.(mp4|webm)$/i;

let video = null;
let options = {};
let order = [];
let choice = '';
const missing = new Set();

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const small = () => window.innerWidth < 760 || window.innerHeight < 520;

function srcOf(key) {
  const entry = options[key];
  if (!entry || typeof entry !== 'object') return '';
  const src = String(entry.src || '');
  return SAFE.test(src) && src.split('/').indexOf('..') < 0 ? src : '';
}

function looks(key) {
  const entry = options[key] || {};
  const dim = typeof entry.dim === 'number' ? entry.dim : 0.34;
  const lift = typeof entry.brightness === 'number' ? entry.brightness : 0.62;
  return {
    opacity: String(Math.min(1, Math.max(0, dim))),
    filter: 'grayscale(1) brightness(' + Math.min(1.6, Math.max(0.1, lift)) + ') contrast(1.12)'
  };
}

function stop() {
  if (!video) return;
  video.pause();
  video.removeAttribute('src');
  video.load();
  video.hidden = true;
  video.style.opacity = '0';
  gl.setFloor(1);
}

function run() {
  if (!video || !choice) return;
  const src = srcOf(choice);
  if (!src) return;
  video.style.filter = looks(choice).filter;
  video.hidden = false;
  if (video.getAttribute('src') !== src) {
    video.style.opacity = '0';
    video.setAttribute('src', src);
  }
  const go = video.play();
  if (go && go.catch) go.catch(() => {});
}

function allowed() {
  return !!choice && state.phase === 'station' && state.optics.video && !reduced.matches && !small();
}

function apply() {
  if (allowed()) run();
  else stop();
}

function nextAvailable(from) {
  const at = order.indexOf(from);
  for (let i = 1; i <= order.length; i++) {
    const key = order[(at + i) % order.length];
    if (!missing.has(key) && srcOf(key)) return key;
  }
  return '';
}

function onError() {
  if (!video || !video.getAttribute('src') || !choice) return;
  missing.add(choice);
  const next = nextAvailable(choice);
  choice = next;
  if (next) apply();
  else stop();
}

export const backdrop = {
  async init() {
    video = $('#backdrop');
    if (!video) return;

    let list = null;
    try {
      const res = await fetch(LIST, { credentials: 'omit' });
      if (res.ok) list = await res.json();
    } catch (_) {
      list = null;
    }
    options = (list && typeof list.options === 'object' && list.options) || {};
    order = Object.keys(options).filter(k => srcOf(k));

    const asked = new URLSearchParams(location.search).get('bg');
    const off = asked === 'off' || asked === 'none';
    if (off) store.set('bg', '');

    const remembered = off ? null : store.get('bg', null);
    const fallback = list && typeof list.default === 'string' ? list.default : '';
    choice = off ? '' : [asked, remembered, fallback].find(k => k && order.indexOf(k) > -1) || '';
    if (asked && order.indexOf(asked) > -1) store.set('bg', asked);

    video.addEventListener('playing', () => {
      if (video.hidden || !choice) return;
      video.style.opacity = looks(choice).opacity;
      gl.setFloor(0);
    });
    video.addEventListener('error', onError);

    apply();

    document.addEventListener('visibilitychange', () => {
      if (!video || video.hidden) return;
      if (document.hidden) video.pause();
      else run();
    });
    window.addEventListener('resize', apply, { passive: true });
    bus.on('optics', apply);
    bus.on('phase', apply);
  },

  get key() { return choice; },
  get live() { return !!video && !video.hidden; },
  get names() { return order.filter(k => !missing.has(k)); },

  pick(key) {
    if (order.indexOf(key) < 0 || missing.has(key)) return false;
    choice = key;
    store.set('bg', key);
    apply();
    say('backdrop: ' + key);
    return true;
  }
};
