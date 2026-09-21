import { $, el, state, store, bus, clamp, damp, lerp, smoother, shortAngle, rng, breathe } from './core.js?v=1';
import { data } from './vault.js?v=1';
import { gl } from './gl.js?v=1';
import { audio } from './audio.js?v=1';
import { createSpirit } from './spirit.js?v=1';

export const intro = (function () {
  'use strict';

  const SCRIPT = [
    { cue: 'vortex',        dur: 2.5, line: '',                                                                   stat: null },
    { cue: 'beacon',        dur: 4.5, line: 'ASTRA is the lighthouse I built inside this site.',                   stat: 'days' },
    { cue: 'iris',          dur: 4.5, line: 'She watches what comes in, and what tries to leave.',                 stat: null },
    { cue: 'cube',          dur: 4.5, line: 'Everything I study turns into a note, and all of them live in here.', stat: null },
    { cue: 'lattice',       dur: 5.0, line: 'Thousands of small records. Each one finished on its own, and all of them connected.', stat: null },
    { cue: 'edges',         dur: 4.5, line: 'Two words in a note decide everything. Is it private, and is it finished.', stat: 'leaks' },
    { cue: 'gyro',          dur: 4.5, line: 'She is written in a strict language, one that catches my mistakes before they happen.', stat: null },
    { cue: 'gate',          dur: 4.5, line: 'She never goes online. She reads, she checks, she writes, and that is it.', stat: 'closed' },
    { cue: 'horizon',       dur: 4.5, line: 'Whatever she keeps, she keeps. Nothing slips out of here by accident.', stat: null },
    { cue: 'tree',          dur: 4.5, line: 'She is new, and she has a long way to go.',                           stat: null },
    { cue: 'forest',        dur: 4.0, line: 'So much left to find, and to write down.',                            stat: null },
    { cue: 'vector',        dur: 4.5, line: 'Every note is also a long list of numbers that stands for what it means.', stat: 'dims' },
    { cue: 'cosine',        dur: 4.5, line: 'The numbers let her measure how close two ideas are.',                stat: null },
    { cue: 'neuron',        dur: 4.5, line: 'She learns the way a brain does. Small pieces, and the paths between them.', stat: null },
    { cue: 'network',       dur: 4.5, line: 'So she can find a note by an idea instead of a word,',                stat: null },
    { cue: 'networkLoose',  dur: 4.5, line: 'and she notices which ones belong together, even the ones I never linked.', stat: 'links' },
    { cue: 'binary',        dur: 4.5, line: 'She is not alone. There is another station out there,',               stat: 'stations' },
    { cue: 'mobius',        dur: 4.5, line: 'and a shape we both agreed on, so our sites can read each other.',    stat: null },
    { cue: 'binaryBridge',  dur: 3.0, line: 'ASTRA and APOLLO.',                                                   stat: null },
    { cue: 'constellation', dur: 3.5, line: 'Enjoy the journey.',                                                  stat: null }
  ];

  const three = n => String(Math.max(0, n | 0)).padStart(3, '0');

  const STATS = {
    days: () => [String(Math.floor((Date.now() - Date.UTC(2023, 8, 1)) / 86400000)), 'days on record'],
    leaks: () => ['000', 'leaks, ever'],
    dims: () => ['384', 'numbers per note'],
    closed: () => ['000', 'connections opened'],
    links: () => data.stats.links ? [three(data.stats.links), 'links drawn between notes'] : null,
    stations: () => data.stats.apollo ? ['02', 'stations mirrored'] : ['01', 'station online']
  };

  const SIDE = window.innerWidth < 760 ? 112 : 200;
  const P = SIDE * SIDE;
  const RS = rng(0x51AA);

  let THREE = null;
  let scene = null, cam = null, spirit = null;
  let ready = false;
  let running = false, done = false;
  let beat = -1, mix = 1, elapsed = 0;
  let wallStart = 0, audioStart = null;

  const STARTS = [];
  const TOTAL = (function () {
    let t = 0;
    SCRIPT.forEach(b => { STARTS.push(t); t += b.dur; });
    return t;
  })();
  let camDist = 300, camWant = 300, camAz = 0, camAzSpeed = 0.08, camAzWant = null, camEl = 0.1, camElWant = 0.1;
  let spinY = 0, drawSpinY = 0, fit = 1;
  let root, lineEl, statEl, statN, statC, ruler, ticks = [];

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const growTmp = new Float32Array(P);

  function alloc() {
    growTmp.fill(0);
    return new Float32Array(P * 3);
  }

  function facePoint(out, i, s, jitter) {
    const f = (RS() * 6) | 0;
    const u = (RS() - 0.5) * s, v = (RS() - 0.5) * s, h = s * 0.5;
    let x, y, z;
    if (f === 0) { x = h; y = u; z = v; }
    else if (f === 1) { x = -h; y = u; z = v; }
    else if (f === 2) { x = u; y = h; z = v; }
    else if (f === 3) { x = u; y = -h; z = v; }
    else if (f === 4) { x = u; y = v; z = h; }
    else { x = u; y = v; z = -h; }
    const j = jitter || 0;
    out[i * 3] = x + (RS() - 0.5) * j;
    out[i * 3 + 1] = y + (RS() - 0.5) * j;
    out[i * 3 + 2] = z + (RS() - 0.5) * j;
  }

  function formDust(r) {
    const o = alloc();
    for (let i = 0; i < P; i++) {
      const rr = r * (0.35 + Math.pow(RS(), 0.4) * 0.9);
      const th = RS() * Math.PI * 2, ph = Math.acos(2 * RS() - 1);
      o[i * 3] = Math.sin(ph) * Math.cos(th) * rr;
      o[i * 3 + 1] = Math.cos(ph) * rr * 0.62;
      o[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * rr;
    }
    return o;
  }


  const SEGS = 1200;
  let draw = null, drawMat = null, drawPos = null, drawOrder = null, drawUsed = 0;

  const DRAW_VS = `
    attribute float aOrder;
    attribute float aKind;
    uniform float uDraw;
    varying float vFade;
    varying float vKind;
    void main() {
      vKind = aKind;
      float d = uDraw - aOrder;
      vFade = clamp(d * 7.0, 0.0, 1.0) * step(0.0, d);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const DRAW_FS = `
    precision highp float;
    uniform float uFade;
    varying float vFade;
    varying float vKind;
    void main() {
      float a = vFade * uFade * (vKind > 0.5 ? 0.62 : 0.3);
      if (a < 0.004) discard;
      gl_FragColor = vec4(vec3(1.0), a);
    }
  `;

  function line(out, a, b, kind) { out.push([a[0], a[1], a[2], b[0], b[1], b[2], kind || 0]); }

  function ring(out, cx, cy, cz, r, steps, kind) {
    for (let i = 0; i < steps; i++) {
      const t0 = (i / steps) * Math.PI * 2, t1 = ((i + 1) / steps) * Math.PI * 2;
      line(out, [cx + Math.cos(t0) * r, cy, cz + Math.sin(t0) * r],
                [cx + Math.cos(t1) * r, cy, cz + Math.sin(t1) * r], kind);
    }
  }

  function ringXY(out, cx, cy, r, steps, kind) {
    for (let i = 0; i < steps; i++) {
      const t0 = (i / steps) * Math.PI * 2, t1 = ((i + 1) / steps) * Math.PI * 2;
      line(out, [cx + Math.cos(t0) * r, cy + Math.sin(t0) * r, 0],
                [cx + Math.cos(t1) * r, cy + Math.sin(t1) * r, 0], kind);
    }
  }

  function boxWire(out, cx, cy, cz, s, kind) {
    const h = s * 0.5;
    const c = [[-h,-h,-h],[h,-h,-h],[h,h,-h],[-h,h,-h],[-h,-h,h],[h,-h,h],[h,h,h],[-h,h,h]];
    const e = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    e.forEach(p => line(out,
      [cx + c[p[0]][0], cy + c[p[0]][1], cz + c[p[0]][2]],
      [cx + c[p[1]][0], cy + c[p[1]][1], cz + c[p[1]][2]], kind));
  }

  function dimension(out, a, b, tick) {
    line(out, a, b, 1);
    const t = tick || 6;
    [a, b].forEach(p => {
      line(out, [p[0], p[1] - t, p[2]], [p[0], p[1] + t, p[2]], 1);
    });
  }

  function scaleBar(out, x0, x1, y, z, count) {
    line(out, [x0, y, z], [x1, y, z], 1);
    for (let i = 0; i <= count; i++) {
      const x = x0 + (x1 - x0) * (i / count);
      const h = i % 5 === 0 ? 7 : 3.2;
      line(out, [x, y, z], [x, y - h, z], 1);
    }
  }

  function bracket(out, cx, cy, cz, w, h, kind) {
    const x = w * 0.5, y = h * 0.5, arm = Math.min(w, h) * 0.24;
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(s => {
      line(out, [cx + s[0] * x, cy + s[1] * y, cz], [cx + s[0] * (x - arm), cy + s[1] * y, cz], kind);
      line(out, [cx + s[0] * x, cy + s[1] * y, cz], [cx + s[0] * x, cy + s[1] * (y - arm), cz], kind);
    });
  }

  const DRAWINGS = {
    vortex() {
      const o = [];
      [150, 104, 58].forEach((r, k) => ring(o, 0, -34 - k * 6, 0, r, 56, k === 1 ? 1 : 0));
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const r0 = 150, r1 = i % 6 === 0 ? 166 : 158;
        line(o, [Math.cos(a) * r0, -34, Math.sin(a) * r0], [Math.cos(a) * r1, -34, Math.sin(a) * r1], 1);
      }
      return o;
    },
    forest() {
      const o = [];
      const half = 190, step = half * 2 / 14, floor = -80;
      for (let i = 0; i <= 14; i++) {
        line(o, [-half + i * step, floor, -half], [-half + i * step, floor, half], 0);
        line(o, [-half, floor, -half + i * step], [half, floor, -half + i * step], 0);
      }
      ring(o, 0, floor, 0, 46, 48, 1);
      dimension(o, [-208, floor, 0], [-208, 120, 0], 6);
      return o;
    },
    mobius() {
      const o = [];
      const R = 96, w = 34, steps = 180;
      let prev = null;
      for (let i = 0; i <= steps * 2; i++) {
        const u = (i / steps) * Math.PI;
        const v = (i <= steps ? w : -w);
        const c = Math.cos(u * 0.5), s = Math.sin(u * 0.5);
        const rr = R + v * c;
        const p = [Math.cos(u) * rr, v * s, Math.sin(u) * rr];
        if (prev) line(o, prev, p, 1);
        prev = p;
      }
      bracket(o, 0, 0, 0, 290, 150, 0);
      return o;
    },
    iris() {
      const o = [];
      ringXY(o, 0, 0, 120, 72, 1);
      ringXY(o, 0, 0, 132, 72, 0);
      ringXY(o, 0, 0, 32.4, 48, 1);
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const r0 = 132, r1 = i % 6 === 0 ? 148 : 140;
        line(o, [Math.cos(a) * r0, Math.sin(a) * r0, 0], [Math.cos(a) * r1, Math.sin(a) * r1, 0], 1);
      }
      dimension(o, [0, 0, 0], [32.4, 0, 0], 5);
      return o;
    },
    neuron() {
      const o = [];
      bracket(o, 0, 0, 0, 320, 210, 0);
      scaleBar(o, -150, 150, -124, 0, 30);
      return o;
    },
    cosine() {
      const o = [];
      ringXY(o, 0, 0, 112, 72, 0);
      ring(o, 0, 0, 0, 112, 72, 0);
      const u = [0.82, 0.42, 0.38], v = [0.36, 0.74, -0.57];
      const n1 = Math.hypot(u[0], u[1], u[2]), n2 = Math.hypot(v[0], v[1], v[2]);
      const a = [u[0] / n1 * 112, u[1] / n1 * 112, u[2] / n1 * 112];
      const b = [v[0] / n2 * 112, v[1] / n2 * 112, v[2] / n2 * 112];
      line(o, [0, 0, 0], a, 1);
      line(o, [0, 0, 0], b, 1);
      bracket(o, 0, 0, 0, 280, 280, 0);
      return o;
    },
    gyro() {
      const o = [];
      [62, 85, 108].forEach((r, k) => ring(o, 0, 0, 0, r, 48, k === 2 ? 1 : 0));
      bracket(o, 0, 0, 0, 250, 250, 0);
      return o;
    },
    gate() {
      const o = [];
      const h = 75;
      line(o, [-h, h, 0], [h, h, 0], 1);
      line(o, [h, h, 0], [h, -h, 0], 1);
      line(o, [h, -h, 0], [-h, -h, 0], 1);
      line(o, [-h, -h, 0], [-h, h, 0], 1);
      dimension(o, [-h, -h - 26, 0], [h, -h - 26, 0], 6);
      for (let i = 0; i <= 10; i++) {
        const y = -h + (i / 10) * h * 2;
        line(o, [h, y, 0], [h + (i % 5 === 0 ? 12 : 6), y, 0], 0);
      }
      return o;
    },
    horizon() {
      const o = [];
      const rs = 51;
      ring(o, 0, 0, 0, rs, 64, 1);
      ring(o, 0, 0, 0, rs * 1.25, 64, 0);
      ring(o, 0, 0, 0, 150 * 1.3, 72, 0);
      dimension(o, [0, 0, 0], [rs, 0, 0], 6);
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const r0 = 150 * 1.3, r1 = i % 4 === 0 ? r0 + 16 : r0 + 8;
        line(o, [Math.cos(a) * r0, 0, Math.sin(a) * r0], [Math.cos(a) * r1, 0, Math.sin(a) * r1], 1);
      }
      return o;
    },
    beacon() {
      const o = [];
      ring(o, 0, -59, 0, 150, 64, 0);
      ring(o, 0, -59, 0, 96, 64, 0);
      dimension(o, [0, 0, 0], [160, 0, 0], 7);
      bracket(o, 0, 0, 0, 30, 30, 1);
      return o;
    },
    cube() {
      const o = [];
      boxWire(o, 0, 0, 0, 126, 0);
      dimension(o, [-63, -78, 63], [63, -78, 63], 6);
      return o;
    },
    lattice() {
      const o = [];
      const cell = 140 / 3;
      for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) for (let z = 0; z < 3; z++) {
        boxWire(o, (x - 1) * cell, (y - 1) * cell, (z - 1) * cell, cell * 0.66, 0);
      }
      return o;
    },
    edges() {
      const o = [];
      boxWire(o, 0, 0, 0, 126, 1);
      line(o, [-63, 63, -63], [63, 63, 63], 1);
      line(o, [-63, -63, 63], [63, -63, -63], 1);
      bracket(o, 0, 63, 0, 150, 26, 1);
      bracket(o, 0, -63, 0, 150, 26, 1);
      return o;
    },
    tree() {
      const o = [];
      const half = 135, step = half * 2 / 12, floor = -63;
      for (let i = 0; i <= 12; i++) {
        line(o, [-half + i * step, floor, -half], [-half + i * step, floor, half], 0);
        line(o, [-half, floor, -half + i * step], [half, floor, -half + i * step], 0);
      }
      dimension(o, [-152, floor, 0], [-152, 96, 0], 6);
      return o;
    },
    treeFull() {
      const o = [];
      const half = 160, step = half * 2 / 12, floor = -75;
      for (let i = 0; i <= 12; i++) {
        line(o, [-half + i * step, floor, -half], [-half + i * step, floor, half], 0);
        line(o, [-half, floor, -half + i * step], [half, floor, -half + i * step], 0);
      }
      ring(o, 0, floor, 0, 44, 48, 1);
      dimension(o, [-180, floor, 0], [-180, 118, 0], 6);
      return o;
    },
    vector() {
      const o = [];
      const w = 124, h = 78;
      [-1, 1].forEach(s => {
        line(o, [s * w, -h, 0], [s * w, h, 0], 1);
        line(o, [s * w, h, 0], [s * (w - 14), h, 0], 1);
        line(o, [s * w, -h, 0], [s * (w - 14), -h, 0], 1);
      });
      scaleBar(o, -w, w, -h - 16, 0, 30);
      return o;
    },
    networkLoose() {
      const o = [];
      bracket(o, 0, 0, 0, 300, 220, 0);
      return o;
    },
    binary() {
      const o = [];
      bracket(o, -104, 0, 0, 120, 120, 0);
      bracket(o, 104, 0, 0, 120, 120, 0);
      dimension(o, [-104, -92, 0], [104, -92, 0], 7);
      return o;
    },
    binaryBridge() {
      const o = [];
      bracket(o, -104, 0, 0, 120, 120, 1);
      bracket(o, 104, 0, 0, 120, 120, 1);
      dimension(o, [-104, -92, 0], [104, -92, 0], 7);
      ring(o, -104, -70, 0, 46, 40, 0);
      ring(o, 104, -70, 0, 46, 40, 0);
      return o;
    }
  };

  function buildDraw() {
    drawPos = new Float32Array(SEGS * 6);
    drawOrder = new Float32Array(SEGS * 2);
    const kind = new Float32Array(SEGS * 2);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(drawPos, 3));
    g.setAttribute('aOrder', new THREE.BufferAttribute(drawOrder, 1));
    g.setAttribute('aKind', new THREE.BufferAttribute(kind, 1));
    g.setDrawRange(0, 0);
    drawMat = new THREE.ShaderMaterial({
      uniforms: { uDraw: { value: 0 }, uFade: { value: 1 } },
      vertexShader: DRAW_VS, fragmentShader: DRAW_FS,
      transparent: true, depthWrite: false, depthTest: false,
      blending: THREE.AdditiveBlending
    });
    draw = new THREE.LineSegments(g, drawMat);
    draw.frustumCulled = false;
    draw.renderOrder = 5;
    draw._kind = kind;
    scene.add(draw);
  }

  function setDrawing(name) {
    if (!draw) return;
    const make = DRAWINGS[name];
    const segs = make ? make() : [];
    drawUsed = Math.min(segs.length, SEGS);
    for (let i = 0; i < drawUsed; i++) {
      const s = segs[i];
      const o = i / Math.max(1, drawUsed - 1);
      drawPos[i * 6] = s[0]; drawPos[i * 6 + 1] = s[1]; drawPos[i * 6 + 2] = s[2];
      drawPos[i * 6 + 3] = s[3]; drawPos[i * 6 + 4] = s[4]; drawPos[i * 6 + 5] = s[5];
      drawOrder[i * 2] = o; drawOrder[i * 2 + 1] = o;
      draw._kind[i * 2] = s[6]; draw._kind[i * 2 + 1] = s[6];
    }
    draw.geometry.setDrawRange(0, drawUsed * 2);
    draw.geometry.attributes.position.needsUpdate = true;
    draw.geometry.attributes.aOrder.needsUpdate = true;
    draw.geometry.attributes.aKind.needsUpdate = true;
    drawMat.uniforms.uDraw.value = 0;
  }

  function hash2(a, b) {
    const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  function formBeacon(r) {
    const o = alloc();
    for (let i = 0; i < P; i++) {
      const roll = RS();
      if (roll < 0.20) {
        const th = RS() * Math.PI * 2, ph = Math.acos(2 * RS() - 1);
        const rr = r * 0.055 * Math.pow(RS(), 0.4);
        o[i * 3] = Math.sin(ph) * Math.cos(th) * rr;
        o[i * 3 + 1] = Math.cos(ph) * rr;
        o[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * rr;
      } else if (roll < 0.76) {
        const t = Math.pow(RS(), 0.8);
        const w = r * (0.008 + t * 0.16);
        o[i * 3] = t * r * 1.25;
        o[i * 3 + 1] = (RS() - 0.5) * w;
        o[i * 3 + 2] = (RS() - 0.5) * w;
        growTmp[i] = 0.12 + t * 0.7;
      } else {
        const rr = r * (0.5 + RS() * 2.0);
        const th = RS() * Math.PI * 2;
        o[i * 3] = Math.cos(th) * rr;
        o[i * 3 + 1] = -r * 0.46 + (RS() - 0.5) * r * 0.06;
        o[i * 3 + 2] = Math.sin(th) * rr;
      }
    }
    return o;
  }

  function formCubeLattice(s, n) {
    const o = alloc();
    const cell = s / n, gap = cell * 0.34, inner = cell - gap;
    const half = (n - 1) / 2;
    const tmp = new Float32Array(3);
    for (let i = 0; i < P; i++) {
      const cx = (RS() * n) | 0, cy = (RS() * n) | 0, cz = (RS() * n) | 0;
      if (RS() < 0.13) {
        const axis = (RS() * 3) | 0;
        const t = RS();
        o[i * 3] = (cx - half) * cell + (axis === 0 ? (t - 0.5) * cell : 0);
        o[i * 3 + 1] = (cy - half) * cell + (axis === 1 ? (t - 0.5) * cell : 0);
        o[i * 3 + 2] = (cz - half) * cell + (axis === 2 ? (t - 0.5) * cell : 0);
        growTmp[i] = 0.86;
        continue;
      }
      facePoint(tmp, 0, inner, inner * 0.05);
      o[i * 3] = tmp[0] + (cx - half) * cell;
      o[i * 3 + 1] = tmp[1] + (cy - half) * cell;
      o[i * 3 + 2] = tmp[2] + (cz - half) * cell;
      growTmp[i] = (cx + cy + cz) / ((n - 1) * 3) * 0.78;
    }
    return o;
  }

  function formVector(s, rows) {
    const o = alloc();
    const cols = 30;
    const step = s / rows;
    for (let i = 0; i < P; i++) {
      const r = (RS() * rows) | 0;
      const c = (RS() * cols) | 0;
      const v = hash2(r + 1, c + 1) - 0.5;
      o[i * 3] = (c / (cols - 1) - 0.5) * s * 1.6 + (RS() - 0.5) * step * 0.3;
      o[i * 3 + 1] = (r / (rows - 1) - 0.5) * s + v * step * 0.86;
      o[i * 3 + 2] = (RS() - 0.5) * s * 0.03;
      growTmp[i] = (c / cols) * 0.86;
    }
    return o;
  }

  function formVortex(r) {
    const o = alloc();
    const arms = 5;
    for (let i = 0; i < P; i++) {
      const roll = RS();
      if (roll < 0.10) {
        const t = RS();
        const rr = r * 0.06 * (1 - t);
        const th = RS() * Math.PI * 2;
        o[i * 3] = Math.cos(th) * rr;
        o[i * 3 + 1] = -r * 0.5 + t * r * 1.0;
        o[i * 3 + 2] = Math.sin(th) * rr;
        growTmp[i] = 0.72 + t * 0.26;
        continue;
      }
      const arm = (RS() * arms) | 0;
      const t = Math.pow(RS(), 0.62);
      const rr = r * (0.08 + t * 0.95);
      const th = (arm / arms) * Math.PI * 2 + t * 4.1 + (RS() - 0.5) * 0.24;
      const fall = (1 - t) * (1 - t);
      o[i * 3] = Math.cos(th) * rr;
      o[i * 3 + 1] = -fall * r * 0.42 + (RS() - 0.5) * r * 0.05;
      o[i * 3 + 2] = Math.sin(th) * rr;
      growTmp[i] = (1 - t) * 0.8;
    }
    return o;
  }

  function branchOut(segs, box, x, y, z, dx, dy, dz, len, depth, from, maxDepth, minLen) {
    const ex = x + dx * len, ey = y + dy * len, ez = z + dz * len;
    const at = from + len;
    segs.push([x, y, z, ex, ey, ez, depth, from, at]);
    if (at > box.span) box.span = at;
    if (depth >= maxDepth || len < minLen) return;
    const n = depth < 2 ? 2 + ((RS() * 2) | 0) : (RS() > 0.42 ? 2 : 1);
    for (let b = 0; b < n; b++) {
      let nx = dx + (RS() - 0.5) * 1.5;
      let ny = dy + 0.18 + RS() * 0.2;
      let nz = dz + (RS() - 0.5) * 1.5;
      const m = Math.hypot(nx, ny, nz) || 1;
      branchOut(segs, box, ex, ey, ez, nx / m, ny / m, nz / m, len * (0.6 + RS() * 0.22), depth + 1, at, maxDepth, minLen);
    }
  }

  function scatterOn(o, i, half, floor, reach) {
    const lineIdx = (RS() * 13) | 0;
    const step = (half * 2) / 12;
    if (RS() < 0.5) {
      o[i * 3] = (RS() - 0.5) * half * 2;
      o[i * 3 + 2] = -half + lineIdx * step;
    } else {
      o[i * 3] = -half + lineIdx * step;
      o[i * 3 + 2] = (RS() - 0.5) * half * 2;
    }
    o[i * 3 + 1] = floor + (RS() - 0.5) * reach * 0.006;
  }

  function formForest(reach, count) {
    const o = alloc();
    const floor = -reach * 0.42;
    const groves = [];
    let widest = 1;

    for (let k = 0; k < count; k++) {
      const a = (k / count) * Math.PI * 2 + 0.6;
      const d = k === 0 ? 0 : reach * (0.3 + RS() * 0.42);
      const cx = Math.cos(a) * d, cz = Math.sin(a) * d;
      const scale = k === 0 ? 1 : 0.5 + RS() * 0.42;
      const box = { span: 1 };
      const segs = [];
      branchOut(segs, box, cx, floor, cz, 0, 1, 0, reach * 0.26 * scale, 0, 0, 5, reach * 0.04);
      const lens = segs.map(s => Math.hypot(s[3] - s[0], s[4] - s[1], s[5] - s[2]));
      let total = 0;
      lens.forEach(l => { total += l; });
      groves.push({ segs: segs, lens: lens, total: total, span: box.span, order: k / count });
      widest = Math.max(widest, d);
    }

    const half = Math.max(reach * 0.9, widest + reach * 0.3);
    for (let i = 0; i < P; i++) {
      if (RS() < 0.22) {
        scatterOn(o, i, half, floor, reach);
        growTmp[i] = 0.03;
        continue;
      }
      const g = groves[(RS() * groves.length) | 0];
      let pick = RS() * g.total;
      let s = g.segs[0];
      for (let k = 0; k < g.segs.length; k++) {
        pick -= g.lens[k];
        if (pick <= 0) { s = g.segs[k]; break; }
      }
      const t = RS();
      const j = reach * 0.012 * (1 - s[6] / 7);
      o[i * 3] = lerp(s[0], s[3], t) + (RS() - 0.5) * j;
      o[i * 3 + 1] = lerp(s[1], s[4], t) + (RS() - 0.5) * j;
      o[i * 3 + 2] = lerp(s[2], s[5], t) + (RS() - 0.5) * j;
      growTmp[i] = 0.06 + g.order * 0.5 + (lerp(s[7], s[8], t) / g.span) * 0.42;
    }
    return o;
  }

  function formMobius(R, w) {
    const o = alloc();
    for (let i = 0; i < P; i++) {
      const u = RS() * Math.PI * 2;
      const edge = RS() < 0.42;
      const v = edge ? (RS() < 0.5 ? -w : w) * (0.94 + RS() * 0.06) : (RS() - 0.5) * 2 * w;
      const c = Math.cos(u * 0.5), s = Math.sin(u * 0.5);
      const rr = R + v * c;
      o[i * 3] = Math.cos(u) * rr;
      o[i * 3 + 1] = v * s;
      o[i * 3 + 2] = Math.sin(u) * rr;
      growTmp[i] = (u / (Math.PI * 2)) * 0.88;
    }
    return o;
  }

  function formIris(r) {
    const o = alloc();
    const pupil = r * 0.27;
    const fibres = 260;
    for (let i = 0; i < P; i++) {
      const roll = RS();
      let a, rr, wob = 0;
      if (roll < 0.09) {
        a = RS() * Math.PI * 2;
        rr = r * (1 + (RS() - 0.5) * 0.012);
        growTmp[i] = 0.9 + (a / (Math.PI * 2)) * 0.1;
      } else if (roll < 0.20) {
        a = RS() * Math.PI * 2;
        rr = pupil * (1 + (RS() - 0.5) * 0.04);
        growTmp[i] = 0.02 + RS() * 0.06;
      } else {
        const f = (RS() * fibres) | 0;
        const jitter = hash2(f + 1, 7) - 0.5;
        a = (f / fibres) * Math.PI * 2 + jitter * 0.02;
        const t = Math.pow(RS(), 0.85);
        rr = pupil + t * (r - pupil) * (0.72 + hash2(f + 3, 11) * 0.3);
        wob = Math.sin(t * 8.5 + f) * r * 0.012;
        growTmp[i] = 0.1 + t * 0.74;
      }
      const dome = -Math.sqrt(Math.max(0, r * r * 2.2 - rr * rr)) * 0.2;
      o[i * 3] = Math.cos(a) * rr - Math.sin(a) * wob;
      o[i * 3 + 1] = Math.sin(a) * rr + Math.cos(a) * wob;
      o[i * 3 + 2] = dome + (RS() - 0.5) * r * 0.01;
    }
    return o;
  }

  function formNeuron(r) {
    const o = alloc();
    const segs = [];
    const box = { span: 1 };

    for (let d = 0; d < 7; d++) {
      const th = (d / 7) * Math.PI * 2 + 0.4;
      const ph = (RS() - 0.5) * 1.1;
      branchOut(segs, box,
        0, 0, 0,
        Math.cos(th) * Math.cos(ph), Math.sin(ph), Math.sin(th) * Math.cos(ph),
        r * 0.2, 1, 0, 4, r * 0.035);
    }
    const axon = [];
    let ax = 0, ay = 0, az = 0, at = 0;
    for (let k = 0; k < 9; k++) {
      const nx = ax - r * 0.17, ny = ay + Math.sin(k * 0.8) * r * 0.035, nz = az + Math.cos(k * 0.6) * r * 0.02;
      const len = Math.hypot(nx - ax, ny - ay, nz - az);
      axon.push([ax, ay, az, nx, ny, nz, 0, at, at + len]);
      at += len;
      ax = nx; ay = ny; az = nz;
    }
    box.span = Math.max(box.span, at);
    for (let k = 0; k < 5; k++) {
      const th = (k / 5) * Math.PI * 2;
      branchOut(axon, box, ax, ay, az, -0.5, Math.cos(th) * 0.7, Math.sin(th) * 0.7, r * 0.1, 3, at, 4, r * 0.03);
    }
    const all = segs.concat(axon);
    const lens = all.map(s => Math.hypot(s[3] - s[0], s[4] - s[1], s[5] - s[2]));
    let total = 0;
    lens.forEach(l => { total += l; });

    for (let i = 0; i < P; i++) {
      if (RS() < 0.16) {
        const th = RS() * Math.PI * 2, ph = Math.acos(2 * RS() - 1);
        const rr = r * 0.1 * Math.pow(RS(), 0.4);
        o[i * 3] = Math.sin(ph) * Math.cos(th) * rr;
        o[i * 3 + 1] = Math.cos(ph) * rr;
        o[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * rr;
        growTmp[i] = RS() * 0.1;
        continue;
      }
      let pick = RS() * total;
      let s = all[0];
      for (let k = 0; k < all.length; k++) {
        pick -= lens[k];
        if (pick <= 0) { s = all[k]; break; }
      }
      const t = RS();
      const j = r * 0.01;
      o[i * 3] = lerp(s[0], s[3], t) + (RS() - 0.5) * j;
      o[i * 3 + 1] = lerp(s[1], s[4], t) + (RS() - 0.5) * j;
      o[i * 3 + 2] = lerp(s[2], s[5], t) + (RS() - 0.5) * j;
      growTmp[i] = 0.1 + (lerp(s[7], s[8], t) / box.span) * 0.86;
    }
    return o;
  }

  function formCosine(r) {
    const o = alloc();
    const a1 = [0.82, 0.42, 0.38], a2 = [0.36, 0.74, -0.57];
    const n1 = Math.hypot(a1[0], a1[1], a1[2]), n2 = Math.hypot(a2[0], a2[1], a2[2]);
    const u = [a1[0] / n1, a1[1] / n1, a1[2] / n1];
    const v = [a2[0] / n2, a2[1] / n2, a2[2] / n2];

    for (let i = 0; i < P; i++) {
      const roll = RS();
      if (roll < 0.46) {
        const th = RS() * Math.PI * 2, ph = Math.acos(2 * RS() - 1);
        const rr = r * (0.99 + (RS() - 0.5) * 0.02);
        o[i * 3] = Math.sin(ph) * Math.cos(th) * rr;
        o[i * 3 + 1] = Math.cos(ph) * rr;
        o[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * rr;
        growTmp[i] = RS() * 0.42;
        continue;
      }
      if (roll < 0.62) {
        const a = RS() * Math.PI * 2;
        const rr = r * (1 + (RS() - 0.5) * 0.008);
        o[i * 3] = Math.cos(a) * rr;
        o[i * 3 + 1] = (RS() - 0.5) * r * 0.008;
        o[i * 3 + 2] = Math.sin(a) * rr;
        growTmp[i] = 0.2 + (a / (Math.PI * 2)) * 0.2;
        continue;
      }
      if (roll < 0.88) {
        const w = RS() < 0.5 ? u : v;
        const t = RS();
        const j = r * 0.006;
        o[i * 3] = w[0] * r * t + (RS() - 0.5) * j;
        o[i * 3 + 1] = w[1] * r * t + (RS() - 0.5) * j;
        o[i * 3 + 2] = w[2] * r * t + (RS() - 0.5) * j;
        growTmp[i] = 0.46 + t * 0.3;
        continue;
      }
      const t = RS();
      const ax = lerp(u[0], v[0], t), ay = lerp(u[1], v[1], t), az = lerp(u[2], v[2], t);
      const m = Math.hypot(ax, ay, az) || 1;
      const rr = r * 0.42;
      o[i * 3] = (ax / m) * rr;
      o[i * 3 + 1] = (ay / m) * rr;
      o[i * 3 + 2] = (az / m) * rr;
      growTmp[i] = 0.8 + t * 0.18;
    }
    return o;
  }

  function formGyro(r) {
    const o = alloc();
    const cages = [
      [1, 0, 0, 0, 1, 0],
      [0.5, 0.86, 0, 0, 0, 1],
      [0.5, -0.5, 0.71, 0.71, 0.5, 0.5]
    ];
    for (let i = 0; i < P; i++) {
      const roll = RS();
      if (roll < 0.26) {
        const th = RS() * Math.PI * 2, ph = Math.acos(2 * RS() - 1);
        const rr = r * 0.2 * Math.pow(RS(), 0.45);
        o[i * 3] = Math.sin(ph) * Math.cos(th) * rr;
        o[i * 3 + 1] = Math.cos(ph) * rr;
        o[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * rr;
        growTmp[i] = RS() * 0.2;
        continue;
      }
      const k = (RS() * cages.length) | 0;
      const c = cages[k];
      const a = RS() * Math.PI * 2;
      const rad = r * (0.52 + k * 0.19);
      const wob = (RS() - 0.5) * r * 0.012;
      const ca = Math.cos(a), sa = Math.sin(a);
      o[i * 3] = (c[0] * ca + c[3] * sa) * rad + wob;
      o[i * 3 + 1] = (c[1] * ca + c[4] * sa) * rad + wob;
      o[i * 3 + 2] = (c[2] * ca + c[5] * sa) * rad + wob;
      growTmp[i] = 0.26 + k * 0.22 + (a / (Math.PI * 2)) * 0.2;
    }
    return o;
  }

  function formGate(s) {
    const o = alloc();
    const h = s * 0.5;
    for (let i = 0; i < P; i++) {
      const roll = RS();
      if (roll < 0.30) {
        const edge = (RS() * 4) | 0;
        const t = RS();
        const j = s * 0.012;
        if (edge < 2) {
          o[i * 3] = lerp(-h, h, t) + (RS() - 0.5) * j;
          o[i * 3 + 1] = (edge === 0 ? h : -h) + (RS() - 0.5) * j;
        } else {
          o[i * 3] = (edge === 2 ? h : -h) + (RS() - 0.5) * j;
          o[i * 3 + 1] = lerp(-h, h, t) + (RS() - 0.5) * j;
        }
        o[i * 3 + 2] = (RS() - 0.5) * j;
        growTmp[i] = (edge / 4) * 0.34 + t * 0.08;
        continue;
      }
      if (roll < 0.88) {
        const t = Math.pow(RS(), 0.6);
        o[i * 3] = (RS() - 0.5) * s * 0.9;
        o[i * 3 + 1] = (RS() - 0.5) * s * 0.9;
        o[i * 3 + 2] = -s * 0.1 - t * s * 0.8;
        growTmp[i] = 0.4 + t * 0.34;
        continue;
      }
      const t = Math.pow(RS(), 0.8);
      const a = RS() * Math.PI * 2;
      const spread = s * (0.04 + t * 0.5);
      o[i * 3] = Math.cos(a) * spread;
      o[i * 3 + 1] = Math.sin(a) * spread;
      o[i * 3 + 2] = t * s * 0.9;
      growTmp[i] = 0.78 + t * 0.2;
    }
    return o;
  }

  function formHorizon(r) {
    const o = alloc();
    const rs = r * 0.34;
    for (let i = 0; i < P; i++) {
      const roll = RS();
      if (roll < 0.70) {
        const t = Math.pow(RS(), 1.7);
        const rad = rs * 1.25 + t * r * 1.05;
        const a = RS() * Math.PI * 2 + t * 5.6;
        const thin = rs * 0.03 + t * r * 0.05;
        o[i * 3] = Math.cos(a) * rad;
        o[i * 3 + 1] = (RS() - 0.5) * thin;
        o[i * 3 + 2] = Math.sin(a) * rad;
        growTmp[i] = 0.1 + (1 - t) * 0.6;
        continue;
      }
      if (roll < 0.90) {
        const a = RS() * Math.PI * 2;
        const rad = rs * (1.02 + (RS() - 0.5) * 0.03);
        const tilt = (RS() - 0.5) * 0.06;
        o[i * 3] = Math.cos(a) * rad;
        o[i * 3 + 1] = Math.sin(a) * rad * Math.cos(tilt);
        o[i * 3 + 2] = Math.sin(a) * rad * Math.sin(tilt);
        growTmp[i] = 0.72 + (a / (Math.PI * 2)) * 0.16;
        continue;
      }
      const up = RS() < 0.5 ? 1 : -1;
      const t = Math.pow(RS(), 0.8);
      const w = rs * (0.05 + t * 0.42);
      const a = RS() * Math.PI * 2;
      o[i * 3] = Math.cos(a) * w;
      o[i * 3 + 1] = up * (rs * 0.4 + t * r * 1.25);
      o[i * 3 + 2] = Math.sin(a) * w;
      growTmp[i] = 0.9 + t * 0.1;
    }
    return o;
  }

  function formCubeVolume(s) {
    const o = alloc();
    const h = s * 0.5;
    for (let i = 0; i < P; i++) {
      const x = (RS() - 0.5) * s, y = (RS() - 0.5) * s, z = (RS() - 0.5) * s;
      const m = Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) || 1;
      const k = 1 + Math.pow(RS(), 0.5) * (h / m - 1);
      o[i * 3] = x * k;
      o[i * 3 + 1] = y * k;
      o[i * 3 + 2] = z * k;
      growTmp[i] = Math.min(0.82, (m * k) / h * 0.8);
    }
    return o;
  }

  function formCubeEdges(s) {
    const o = alloc();
    const h = s * 0.5;
    const c = [[-h, -h, -h], [h, -h, -h], [h, h, -h], [-h, h, -h],
               [-h, -h, h], [h, -h, h], [h, h, h], [-h, h, h]];
    const pairs = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    for (let i = 0; i < P; i++) {
      const corner = RS() < 0.18;
      if (corner) {
        const vi = (RS() * 8) | 0;
        const v = c[vi];
        const j = s * 0.055;
        growTmp[i] = 0.86 + (vi / 8) * 0.12;
        o[i * 3] = v[0] + (RS() - 0.5) * j;
        o[i * 3 + 1] = v[1] + (RS() - 0.5) * j;
        o[i * 3 + 2] = v[2] + (RS() - 0.5) * j;
        continue;
      }
      const ei = (RS() * pairs.length) | 0;
      const e = pairs[ei];
      const a = c[e[0]], b = c[e[1]];
      const t = RS();
      const j = s * 0.006;
      growTmp[i] = ((ei + t) / pairs.length) * 0.84;
      o[i * 3] = lerp(a[0], b[0], t) + (RS() - 0.5) * j;
      o[i * 3 + 1] = lerp(a[1], b[1], t) + (RS() - 0.5) * j;
      o[i * 3 + 2] = lerp(a[2], b[2], t) + (RS() - 0.5) * j;
    }
    return o;
  }

  function formTree(reach, fullness) {
    const o = alloc();
    const segs = [];
    let span = 0;

    function grow(x, y, z, dx, dy, dz, len, depth, from) {
      const ex = x + dx * len, ey = y + dy * len, ez = z + dz * len;
      const at = from + len;
      segs.push([x, y, z, ex, ey, ez, depth, from, at]);
      span = Math.max(span, at);
      if (depth >= (fullness > 0.5 ? 6 : 5) || len < reach * 0.045) return;
      const branches = depth < 2 ? 2 + ((RS() * 2) | 0) : (RS() > 0.42 ? 2 : 1);
      for (let b = 0; b < branches; b++) {
        let nx = dx + (RS() - 0.5) * 1.5;
        let ny = dy + 0.18 + RS() * 0.2;
        let nz = dz + (RS() - 0.5) * 1.5;
        const m = Math.hypot(nx, ny, nz) || 1;
        grow(ex, ey, ez, nx / m, ny / m, nz / m, len * (0.6 + RS() * 0.22), depth + 1, at);
      }
    }

    function root(x, y, z, dx, dy, dz, len, depth, from) {
      const ex = x + dx * len, ey = y + dy * len, ez = z + dz * len;
      const at = from + len;
      segs.push([x, y, z, ex, ey, ez, depth + 9, from, at]);
      span = Math.max(span, at);
      if (depth >= 3 || len < reach * 0.05) return;
      const branches = RS() > 0.5 ? 2 : 1;
      for (let b = 0; b < branches; b++) {
        let nx = dx + (RS() - 0.5) * 1.8;
        let ny = dy - 0.2 - RS() * 0.2;
        let nz = dz + (RS() - 0.5) * 1.8;
        const m = Math.hypot(nx, ny, nz) || 1;
        root(ex, ey, ez, nx / m, ny / m, nz / m, len * (0.58 + RS() * 0.2), depth + 1, at);
      }
    }

    const floor = -reach * 0.42;
    grow(0, floor, 0, 0, 1, 0, reach * 0.3, 0, 0);
    root(0, floor, 0, 0, -1, 0, reach * 0.16, 0, 0);

    const lens = segs.map(s => Math.hypot(s[3] - s[0], s[4] - s[1], s[5] - s[2]));
    let total = 0;
    lens.forEach(l => { total += l; });

    const half = reach * 0.9, step = (half * 2) / 12;
    for (let i = 0; i < P; i++) {
      if (RS() < 0.2) {
        const lineIdx = (RS() * 13) | 0;
        if (RS() < 0.5) {
          o[i * 3] = (RS() - 0.5) * half * 2;
          o[i * 3 + 2] = -half + lineIdx * step;
        } else {
          o[i * 3] = -half + lineIdx * step;
          o[i * 3 + 2] = (RS() - 0.5) * half * 2;
        }
        o[i * 3 + 1] = floor + (RS() - 0.5) * reach * 0.006;
        growTmp[i] = 0.04;
        continue;
      }
      let pick = RS() * total;
      let s = segs[0], k = 0;
      for (k = 0; k < segs.length; k++) {
        pick -= lens[k];
        if (pick <= 0) { s = segs[k]; break; }
      }
      const t = RS();
      const depth = s[6] % 9;
      const j = reach * 0.014 * (1 - depth / 7);
      o[i * 3] = lerp(s[0], s[3], t) + (RS() - 0.5) * j;
      o[i * 3 + 1] = lerp(s[1], s[4], t) + (RS() - 0.5) * j;
      o[i * 3 + 2] = lerp(s[2], s[5], t) + (RS() - 0.5) * j;
      growTmp[i] = 0.08 + (lerp(s[7], s[8], t) / span) * 0.9;
    }
    return o;
  }

  function formBinary(r) {
    const o = alloc();
    const sides = [-r * 0.62, r * 0.62];
    const C = [];
    for (let s = 0; s < 2; s++) {
      for (let i = 0; i < 18; i++) {
        const th = RS() * Math.PI * 2, ph = Math.acos(2 * RS() - 1);
        const rr = r * 0.30 * Math.pow(RS(), 0.55);
        C.push([sides[s] + Math.sin(ph) * Math.cos(th) * rr, Math.cos(ph) * rr * 0.78, Math.sin(ph) * Math.sin(th) * rr, s]);
      }
    }
    const L = [];
    for (let i = 0; i < C.length; i++) {
      let best = -1, bd = Infinity;
      for (let j = 0; j < C.length; j++) {
        if (i === j || C[i][3] !== C[j][3]) continue;
        const d = (C[i][0] - C[j][0]) * (C[i][0] - C[j][0]) +
                  (C[i][1] - C[j][1]) * (C[i][1] - C[j][1]) +
                  (C[i][2] - C[j][2]) * (C[i][2] - C[j][2]);
        if (d < bd) { bd = d; best = j; }
      }
      if (best > -1) L.push([i, best]);
    }
    for (let i = 0; i < P; i++) {
      const roll = RS();
      if (roll < 0.09) {
        const t = RS();
        o[i * 3] = lerp(sides[0], sides[1], t);
        o[i * 3 + 1] = Math.sin(t * Math.PI) * r * 0.34;
        o[i * 3 + 2] = (RS() - 0.5) * r * 0.008;
        growTmp[i] = 0.72 + t * 0.26;
      } else if (roll < 0.40) {
        const ci = (RS() * C.length) | 0;
        const c = C[ci];
        const j = r * 0.018;
        o[i * 3] = c[0] + (RS() - 0.5) * j;
        o[i * 3 + 1] = c[1] + (RS() - 0.5) * j;
        o[i * 3 + 2] = c[2] + (RS() - 0.5) * j;
        growTmp[i] = C[ci][3] * 0.34 + (ci % 18) / 18 * 0.2;
      } else {
        const li = (RS() * L.length) | 0;
        const e = L[li];
        const a = C[e[0]], b = C[e[1]];
        const t = RS();
        const j = r * 0.005;
        growTmp[i] = C[e[0]][3] * 0.34 + 0.14 + (li / L.length) * 0.16;
        o[i * 3] = lerp(a[0], b[0], t) + (RS() - 0.5) * j;
        o[i * 3 + 1] = lerp(a[1], b[1], t) + (RS() - 0.5) * j;
        o[i * 3 + 2] = lerp(a[2], b[2], t) + (RS() - 0.5) * j;
      }
    }
    return o;
  }

  function formNetwork(r, hubs, loose) {
    const o = alloc();
    const C = [];
    for (let i = 0; i < hubs; i++) {
      const th = RS() * Math.PI * 2, ph = Math.acos(2 * RS() - 1);
      const rr = r * (0.45 + Math.pow(RS(), 0.6) * 0.75);
      C.push([Math.sin(ph) * Math.cos(th) * rr, Math.cos(ph) * rr * 0.72, Math.sin(ph) * Math.sin(th) * rr]);
    }

    const L = [];
    for (let i = 0; i < hubs; i++) {
      let best = -1, bd = Infinity;
      for (let j = 0; j < hubs; j++) {
        if (i === j) continue;
        const d = (C[i][0] - C[j][0]) ** 2 + (C[i][1] - C[j][1]) ** 2 + (C[i][2] - C[j][2]) ** 2;
        if (d < bd) { bd = d; best = j; }
      }
      L.push([i, best]);
      if (RS() > 0.72) L.push([i, (RS() * hubs) | 0]);
    }

    for (let i = 0; i < P; i++) {
      if (RS() < 0.30) {
        const ci = (RS() * hubs) | 0;
        const c = C[ci];
        const j = r * 0.02;
        o[i * 3] = c[0] + (RS() - 0.5) * j;
        o[i * 3 + 1] = c[1] + (RS() - 0.5) * j;
        o[i * 3 + 2] = c[2] + (RS() - 0.5) * j;
        growTmp[i] = (ci / hubs) * 0.3;
      } else {
        const li = (RS() * L.length) | 0;
        const e = L[li];
        const a = C[e[0]], b = C[e[1]];
        let t = RS();
        growTmp[i] = 0.34 + (li / L.length) * (loose ? 0.62 : 0.5);

        if (loose && (t % 0.16) > 0.08) t = (t + 0.08) % 1;
        const j = r * 0.006;
        o[i * 3] = lerp(a[0], b[0], t) + (RS() - 0.5) * j;
        o[i * 3 + 1] = lerp(a[1], b[1], t) + (RS() - 0.5) * j;
        o[i * 3 + 2] = lerp(a[2], b[2], t) + (RS() - 0.5) * j;
      }
    }
    return o;
  }

  function formConstellation(scaleTo) {
    const nodes = data.nodes, edges = data.edges;
    if (!nodes.length || !edges.length) return formNetwork(scaleTo, 34, false);
    const o = alloc();
    let maxR = 1;
    nodes.forEach(n => { maxR = Math.max(maxR, Math.hypot(n.x, n.y, n.z)); });
    const k = scaleTo / maxR;

    for (let i = 0; i < P; i++) {
      if (RS() < 0.34) {
        const n = nodes[(RS() * nodes.length) | 0];
        const j = scaleTo * 0.012;
        o[i * 3] = n.x * k + (RS() - 0.5) * j;
        o[i * 3 + 1] = n.y * k + (RS() - 0.5) * j;
        o[i * 3 + 2] = n.z * k + (RS() - 0.5) * j;
      } else {
        const e = edges[(RS() * edges.length) | 0];
        const a = nodes[e.a], b = nodes[e.b];
        const t = RS();
        o[i * 3] = lerp(a.x, b.x, t) * k;
        o[i * 3 + 1] = lerp(a.y, b.y, t) * k;
        o[i * 3 + 2] = lerp(a.z, b.z, t) * k;
      }
    }
    return o;
  }

  const CUES = {
    dust:          { make: () => formDust(150),              dist: 322, el: 0.04,  spin: 0.05, spread: 17, sig: [0, 0, 0, 0] },
    vortex:        { make: () => formVortex(160),            dist: 330, el: 0.40,  spin: 0.10, spread: 18, sig: [1, 1, 1.0, 0] },
    beacon:        { make: () => formBeacon(128),            dist: 292, el: 0.12,  spin: 0.04, spread: 12, az: 0.1, turn: 0.42, sig: [4, 1, 0.17, 160] },
    iris:          { make: () => formIris(120),              dist: 256, el: 0.06,  spin: 0.02, spread: 9,  az: 0, sig: [6, 1, 1.25, 0] },
    cube:          { make: () => formCubeVolume(126),        dist: 252, el: 0.20,  spin: 0.13, spread: 14, sig: [7, 0, 0.05, 0] },
    lattice:       { make: () => formCubeLattice(140, 3),    dist: 292, el: 0.28,  spin: 0.16, spread: 11, turn: 0.10, turnDraw: 0.10, sig: [3, 0.8, 6, 0] },
    edges:         { make: () => formCubeEdges(126),         dist: 232, el: 0.09,  spin: 0.21, spread: 9,  sig: [3, 1.3, 9, 0] },
    gyro:          { make: () => formGyro(120),              dist: 268, el: 0.22,  spin: 0.28, spread: 10, sig: [7, 0, 0.32, 0] },
    gate:          { make: () => formGate(150),              dist: 286, el: 0.14,  spin: 0.04, spread: 9,  az: 0.42, sig: [3, 0.7, 12, 0] },
    horizon:       { make: () => formHorizon(150),           dist: 318, el: 0.30,  spin: 0.09, spread: 12, az: 0.2, sig: [1, 1, 1.9, 0] },
    tree:          { make: () => formTree(150, 0),           dist: 300, el: 0.08,  spin: 0.06, spread: 10, az: 0.55, sig: [2, 1, 0.9, -63] },
    forest:        { make: () => formForest(190, 5),         dist: 368, el: 0.06,  spin: 0.05, spread: 12, az: 0.8, sig: [2, 1.2, 0.8, -80] },
    vector:        { make: () => formVector(150, 26),        dist: 268, el: 0.06,  spin: 0.03, spread: 10, az: 0, sig: [3, 0.5, 5, 0] },
    cosine:        { make: () => formCosine(112),            dist: 266, el: 0.18,  spin: 0.10, spread: 10, sig: [7, 0, 0.1, 0] },
    neuron:        { make: () => formNeuron(150),            dist: 296, el: 0.14,  spin: 0.08, spread: 11, az: 1.1, sig: [0, 0, 0, 0], fire: true },
    network:       { make: () => formNetwork(140, 40, false), dist: 288, el: 0.17, spin: 0.11, spread: 16, sig: [0, 0, 0, 0], fire: true },
    networkLoose:  { make: () => formNetwork(140, 40, true), dist: 272, el: 0.24,  spin: 0.12, spread: 11, sig: [0, 0, 0, 0], fire: true },
    binary:        { make: () => formBinary(168),            dist: 330, el: 0.13,  spin: 0.05, spread: 15, az: 0, sig: [5, 7, 9, 22] },
    mobius:        { make: () => formMobius(96, 34),         dist: 292, el: 0.52,  spin: 0.16, spread: 10, sig: [7, 0, 0.13, 0] },
    binaryBridge:  { make: () => formBinary(168),            dist: 300, el: 0.04,  spin: 0.04, spread: 9,  az: 0, sig: [5, 5, 7, 20] },
    constellation: { make: () => formConstellation(135),     dist: 258, el: 0.20,  spin: 0.07, spread: 16, sig: [0, 0, 0, 0], fire: true }
  };

  function build() {
    THREE = gl.three;
    if (!THREE) return false;

    scene = new THREE.Scene();
    const sz = gl.size;
    cam = new THREE.PerspectiveCamera(48, Math.max(0.2, sz.w / sz.h), 0.8, 1600);
    fit = clamp(940 / Math.max(430, sz.h), 1, 1.5);

    try {
      spirit = createSpirit(THREE, gl.renderer, SIDE);
    } catch (err) {
      return false;
    }

    spirit.seed(formDust(360));
    spirit.setA(formDust(360), growTmp);
    spirit.setB(CUES.dust.make(), growTmp);
    spirit.draw.uPR.value = sz.pr;

    scene.add(spirit.trails);
    scene.add(spirit.points);

    buildDraw();

    bus.on('gl-resize', s => {
      if (!cam) return;
      cam.aspect = Math.max(0.2, s.w / s.h);
      cam.updateProjectionMatrix();
      if (spirit) spirit.draw.uPR.value = s.pr;
      fit = clamp(940 / Math.max(430, s.h), 1, 1.5);
    });
    ready = true;
    return true;
  }

  function buildDom() {
    root = $('#intro');
    lineEl = $('#intro-line');
    statEl = $('#intro-stat');
    statN = $('#intro-stat-n');
    statC = $('#intro-stat-c');
    ruler = $('#intro-ruler');

    ruler.innerHTML = '';
    ticks = SCRIPT.map(() => {
      const t = el('span', { class: 'itick' }, [el('i')]);
      ruler.appendChild(t);
      return t;
    });

    $('#intro-skip').addEventListener('click', finish);
  }

  function paintBeat(i) {
    const b = SCRIPT[i];
    root.classList.add('swap');
    setTimeout(() => {
      lineEl.textContent = b.line;
      const reading = b.stat && STATS[b.stat] ? STATS[b.stat]() : null;
      statEl.hidden = !reading;
      if (reading) {
        statN.textContent = reading[0];
        statC.textContent = reading[1];
      }
      root.classList.remove('swap');
    }, reduced ? 0 : 240);
    ticks.forEach((t, k) => t.classList.toggle('on', k <= i));
  }

  function clock() {
    const at = audio.time;
    if (at != null) {
      if (audioStart == null) audioStart = at;
      return Math.max(0, at - audioStart);
    }

    audioStart = null;
    return (performance.now() - wallStart) / 1000;
  }

  function gotoBeat(i) {
    beat = i;
    const b = SCRIPT[beat];
    const cue = CUES[b.cue] || CUES.dust;

    spirit.carryOver();
    spirit.setB(cue.make(), growTmp);

    const sa = spirit.sim.uSigA.value, sb = spirit.sim.uSigB.value;
    sa.copy(sb);
    const s = cue.sig || [0, 0, 0, 0];
    sb.set(s[0], s[1], s[2], s[3]);

    const fire = spirit.draw.uFire.value;
    fire.set(fire.y, cue.fire ? 1 : 0);

    mix = 0;
    spirit.sim.uFlow.value = 0.22 + (cue.spread || 10) * 0.055;
    camWant = cue.dist * fit;
    camElWant = cue.el;
    camAzSpeed = cue.spin;
    camAzWant = cue.az == null ? null : cue.az;

    setDrawing(b.cue);
    paintBeat(beat);
    breathe(0.8);
  }

  function start() {
    if (running || done) return;
    if (!build()) { finish(); return; }
    buildDom();

    running = true;
    state.phase = 'intro';
    root.hidden = false;
    const fog = $('#fog');
    if (fog) fog.hidden = false;
    bus.emit('phase', 'intro');
    elapsed = 0;
    beat = -1;
    wallStart = performance.now();
    audioStart = null;
    camDist = 500;
    camAz = 0.4;
    camAzWant = null;
    camEl = 0.05;
    gotoBeat(0);
  }

  function finish() {
    if (!running && done) return;
    done = true;
    running = false;
    store.set('intro', 1);
    if (root) {
      root.classList.add('gone');
      statEl.hidden = true;
      setTimeout(() => { root.hidden = true; root.classList.remove('gone'); }, 900);
    }
    state.phase = 'station';
    const fog = $('#fog');
    if (fog) fog.hidden = true;
    bus.emit('phase', 'station');
    bus.emit('intro-done');

    setTimeout(() => {
      if (spirit) {
        spirit.dispose();
        spirit = null;
      }
      if (draw) { draw.geometry.dispose(); drawMat.dispose(); draw = null; drawMat = null; }
      scene = null;
      ready = false;
    }, 1200);
  }

  function update(dt) {
    if (!running || !ready) return false;

    elapsed += dt;
    const now = clock();

    let i = beat;
    while (i < SCRIPT.length - 1 && now >= STARTS[i + 1]) i++;
    if (i !== beat) gotoBeat(i);

    const b = SCRIPT[beat];
    const cue = CUES[b.cue];
    const local = now - STARTS[beat];

    spinY = cue && cue.turn ? spinY + cue.turn * dt : damp(spinY, 0, 2.2, dt);
    drawSpinY = cue && cue.turnDraw ? drawSpinY + cue.turnDraw * dt : damp(drawSpinY, 0, 2.2, dt);

    mix = clamp(local / (b.dur * 0.62), 0, 1);

    const fadeIn = clamp(now / 1.6, 0, 1);
    const fadeOut = clamp((TOTAL - now) / 1.2, 0, 1);
    const fade = fadeIn * fadeOut;

    spirit.sim.uMorph.value = smoother(mix);
    spirit.sim.uGrow.value = clamp(local / (b.dur * 0.86), 0, 1);
    spirit.sim.uPull.value = lerp(0.055, 0.12, mix);
    spirit.draw.uFade.value = fade;
    spirit.trail.uFade.value = fade;
    spirit.step(dt, elapsed);

    const drawT = clamp((local - b.dur * 0.34) / (b.dur * 0.42), 0, 1);
    if (drawMat) {
      drawMat.uniforms.uDraw.value = smoother(drawT);
      drawMat.uniforms.uFade.value = fade;
    }

    spirit.points.rotation.y = spinY;
    spirit.trails.rotation.y = spinY;
    if (draw) draw.rotation.y = drawSpinY;

    camDist = damp(camDist, camWant, 1.5, dt);
    camEl = damp(camEl, camElWant, 1.4, dt);
    if (camAzWant == null) camAz += camAzSpeed * dt * (1 + (1 - mix) * 1.6);
    else camAz = damp(camAz, camAz + shortAngle(camAz, camAzWant), 1.2, dt);

    const ce = Math.cos(camEl), se = Math.sin(camEl);
    cam.position.set(Math.sin(camAz) * ce * camDist, se * camDist, Math.cos(camAz) * ce * camDist);
    cam.up.set(0, 1, 0);
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld(true);
    cam.matrixWorldInverse.copy(cam.matrixWorld).invert();

    gl.renderThrough(scene, cam, dt);

    if (now >= TOTAL) finish();
    return true;
  }

  return {
    start, update, finish,
    get running() { return running; },

    SCRIPT
  };
})();
