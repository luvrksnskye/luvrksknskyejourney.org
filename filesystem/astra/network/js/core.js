const core = (function () {
  'use strict';

  const handlers = new Map();
  const bus = {
    on(evt, fn) {
      if (!handlers.has(evt)) handlers.set(evt, new Set());
      handlers.get(evt).add(fn);
      return () => handlers.get(evt).delete(fn);
    },
    emit(evt, payload) {
      const set = handlers.get(evt);
      if (!set) return;
      for (const fn of set) {
        try { fn(payload); } catch (err) { console.error('[astra]', evt, err); }
      }
    }
  };

  const KEY = 'skye-astra:station';
  let disk = {};
  try { disk = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (_) { disk = {}; }

  let saveTimer = null;
  const store = {
    get(k, fallback) { return disk[k] === undefined ? fallback : disk[k]; },
    set(k, v) {
      disk[k] = v;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(store.flush, 220);
    },
    flush() {
      try { localStorage.setItem(KEY, JSON.stringify(disk)); } catch (_) {}
    },
    clear() {
      disk = {};
      try { localStorage.removeItem(KEY); } catch (_) {}
    }
  };

  const state = {
    booted: false,
    phase: 'boot',
    mode: 'lattice',
    hovered: null,
    selected: null,
    isolated: null,
    query: '',
    matches: null,
    hudVisible: true,
    autoOrbit: true,

    off: new Set(store.get('off', [])),
    favourites: new Set(store.get('fav', [])),
    favOnly: false,

    peer: store.get('peer', 'sealed'),

    optics: {
      bloom: true,
      trails: true,
      grain: true,
      grid: true,
      dust: true,
      haze: false,
      video: true
    },
    metrics: { fps: 0, dst: 0, azm: 0, elv: 0, fov: 0 }
  };

  const saved = store.get('optics', null);
  if (saved && typeof saved === 'object') {
    for (const k in state.optics) if (typeof saved[k] === 'boolean') state.optics[k] = saved[k];
  }

  const MODES = [
    { id: 'lattice', key: '1', name: 'LATTICE', blurb: 'every note, every link' },
    { id: 'loose',   key: '2', name: 'LOOSE',   blurb: 'close notes never linked' },
    { id: 'stage',   key: '3', name: 'STAGE',   blurb: 'the life cycle of every note' },
    { id: 'arche',   key: '4', name: 'ARCHE',   blurb: 'the bridge to another station' },
    { id: 'depth',   key: '5', name: 'DEPTH',   blurb: 'distance is meaning' }
  ];

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
  const smooth = t => t * t * (3 - 2 * t);
  const smoother = t => t * t * t * (t * (t * 6 - 15) + 10);
  const TAU = Math.PI * 2;

  function shortAngle(from, to) {
    let d = (to - from) % TAU;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    return d;
  }

  function pad(n, width, digits) {
    const s = Math.abs(n).toFixed(digits == null ? 0 : digits);
    const [i, f] = s.split('.');
    return (n < 0 ? '-' : '') + i.padStart(width, '0') + (f ? '.' + f : '');
  }
  const deg = r => ((r * 180 / Math.PI) % 360 + 360) % 360;
  const signed = (n, width, digits) => (n < 0 ? '-' : '+') + pad(Math.abs(n), width, digits);
  function met(ms) {
    const t = Math.floor(ms / 1000);
    return [Math.floor(t / 86400), Math.floor(t / 3600) % 24, Math.floor(t / 60) % 60, t % 60]
      .map(v => String(v).padStart(2, '0')).join(':');
  }

  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.prototype.slice.call(document.querySelectorAll(sel));
  function el(tag, attrs, kids) {
    const node = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'class') node.className = attrs[k];
      else if (k === 'text') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    }
    if (kids) for (const kid of kids) if (kid) node.appendChild(kid);
    return node;
  }
  const NS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) {
    const node = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function makeGrain(size) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size);
    const d = img.data;
    const r = rng(0x5EED);
    for (let i = 0; i < d.length; i += 4) {
      const v = (r() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL('image/png');
  }

  let cmdNode = null;
  function say(text) {
    if (!cmdNode) cmdNode = $('#cmd-line');
    if (cmdNode) cmdNode.textContent = text;
  }

  let breathT = 0;
  function breathe(amount) { breathT = Math.max(breathT, amount == null ? 1 : amount); }
  function breathValue(dt) {
    const v = breathT;
    breathT = Math.max(0, breathT - dt * 2.6);
    return v;
  }

  return {
    bus, state, store, MODES,
    rng, clamp, lerp, damp, smooth, smoother, shortAngle, TAU,
    pad, deg, signed, met,
    $, $$, el, svg, makeGrain, say, breathe, breathValue
  };
})();

export const { bus, state, store, MODES, rng, clamp, lerp, damp, smooth, smoother, shortAngle, TAU, pad, deg, signed, met, $, $$, el, svg, makeGrain, say, breathe, breathValue } = core;
