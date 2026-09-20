import { $, state, store, bus, say } from './core.js?v=1';
import { gl } from './gl.js?v=1';

const LIST = 'data/backdrops.json?v=1';
const ROOT = '/assets/video/loopwallpapers/';

let video = null;
let options = {};
let choice = '';
let wanted = false;

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const small = () => window.innerWidth < 760 || window.innerHeight < 520;

function fileOf(key) {
  const entry = options[key];
  if (!entry) return '';
  const name = typeof entry === 'string' ? entry : entry.file;
  return /^[a-z0-9][a-z0-9._-]*\.(mp4|webm)$/i.test(String(name)) ? ROOT + name : '';
}

function grade(key) {
  const entry = options[key];
  const dim = entry && typeof entry.dim === 'number' ? entry.dim : 0.34;
  const lift = entry && typeof entry.brightness === 'number' ? entry.brightness : 0.62;
  video.style.opacity = String(Math.min(1, Math.max(0, dim)));
  video.style.filter = 'grayscale(1) brightness(' + Math.min(1.6, Math.max(0.1, lift)) + ') contrast(1.12)';
}

function stop() {
  if (!video) return;
  video.pause();
  video.removeAttribute('src');
  video.load();
  video.hidden = true;
  gl.setFloor(1);
}

function run() {
  if (!video || !choice) return;
  const src = fileOf(choice);
  if (!src) return;
  grade(choice);
  video.hidden = false;
  if (video.getAttribute('src') !== src) video.setAttribute('src', src);
  gl.setFloor(0);
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

    const asked = new URLSearchParams(location.search).get('bg');
    const off = asked === 'off' || asked === 'none';
    if (off) store.set('bg', '');

    const remembered = off ? null : store.get('bg', null);
    const fallback = list && typeof list.default === 'string' ? list.default : '';
    choice = off ? '' : [asked, remembered, fallback].find(k => k && options[k]) || '';
    if (asked && options[asked]) store.set('bg', asked);

    wanted = allowed();
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
  get names() { return Object.keys(options); },

  pick(key) {
    if (!options[key]) return false;
    choice = key;
    store.set('bg', key);
    apply();
    say('backdrop: ' + key);
    return true;
  }
};
