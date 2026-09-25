import { $, el, state, store, bus, clamp, damp, lerp, smoother, shortAngle, breathe } from './core.js?v=2';
import { data } from './vault.js?v=2';
import { gl } from './gl.js?v=2';
import { audio } from './audio.js?v=2';
import { createSpirit } from './spirit.js?v=2';
import { createForms } from './forms.js?v=2';

export const intro = (function () {
  'use strict';

  const SCRIPT = [
    { cue: 'genesis',       dur: 4.0, line: '',                                                              stat: null },
    { cue: 'vortex',        dur: 3.0, line: '',                                                              stat: null },
    { cue: 'beacon',        dur: 4.5, line: 'I built a lighthouse inside this website.',                     stat: 'days' },
    { cue: 'iris',          dur: 4.5, line: 'She is an eye. She watches what comes in, and what tries to leave.', stat: null },
    { cue: 'cube',          dur: 4.5, line: 'Behind the eye there is a box, and everything I study goes into it.', stat: null },
    { cue: 'lattice',       dur: 5.0, line: 'Really it is thousands of small boxes. One note each, finished on its own, all of them touching.', stat: null },
    { cue: 'edges',         dur: 4.5, line: 'Take the walls away and the rule is left. Two words decide everything. Private, or finished.', stat: 'leaks' },
    { cue: 'storm',         dur: 3.5, line: '',                                                              stat: null },
    { cue: 'gyro',          dur: 4.5, line: 'Her core turns inside three cages, in a language that catches my mistakes before they happen.', stat: null },
    { cue: 'gate',          dur: 4.5, line: 'There is one door and it never opens outward. She reads, checks, writes, and stops.', stat: 'closed' },
    { cue: 'horizon',       dur: 4.5, line: 'What she keeps falls into a black hole. Nothing comes back out by accident.', stat: null },
    { cue: 'tree',          dur: 4.5, line: 'And still, something grows. A tree, out of a seed I planted one September.', stat: null },
    { cue: 'forest',        dur: 4.0, line: 'One tree turns into a forest. So much left to find, and to write down.', stat: null },
    { cue: 'vector',        dur: 4.5, line: 'Every note also becomes a row of numbers that stands for what it means.', stat: 'dims' },
    { cue: 'cosine',        dur: 4.5, line: 'Two ideas, and the angle between them. That is how she measures how close they are.', stat: null },
    { cue: 'thought',       dur: 5.0, line: '',                                                              stat: null },
    { cue: 'neuron',        dur: 4.5, line: 'The rows fire like a neuron. Small pieces, and the paths between them.', stat: null },
    { cue: 'network',       dur: 4.5, line: 'So she finds a note by an idea instead of a word,',             stat: null },
    { cue: 'networkLoose',  dur: 4.5, line: 'and she sees which ones belong together, even the ones I never linked.', stat: 'links' },
    { cue: 'binary',        dur: 4.0, line: 'She is not alone. There is another station out there.',          stat: 'stations' },
    { cue: 'mobius',        dur: 4.5, line: 'One ribbon with a single side, and the two of us read the same shape.', stat: null },
    { cue: 'binaryBridge',  dur: 3.0, line: 'ASTRA and APOLLO.',                                              stat: null },
    { cue: 'orbit',         dur: 4.5, line: '',                                                              stat: null },
    { cue: 'constellation', dur: 4.0, line: 'A constellation. Enjoy the journey.',                            stat: null },
    { cue: 'coda',          dur: 5.5, line: '',                                                              stat: null, keep: true }
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

  const SIDE = window.innerWidth < 760 ? 128 : 256;
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const STARTS = [];
  const TOTAL = (function () {
    let t = 0;
    SCRIPT.forEach(b => { STARTS.push(t); t += b.dur; });
    return t;
  })();

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

  const CUES = {
    genesis:       { dist: 400, el: 0.22, spin: 0.10, spread: 6, flow: 0.28, release: [0.3, 0.42], field: [1, 70, 1, 0], stir: 0.5, sig: [0, 0, 0, 0] },
    storm:         { dist: 300, el: 0.18, spin: 0.34, spread: 10, release: [0.0, 0.2], stir: 2.4, emit: 0.8, life: 0.62, sig: [0, 0, 0, 0] },
    thought:       { dist: 330, el: 0.12, spin: 0.16, spread: 4, flow: 0.06, release: [0.5, 0.72], field: [3, 0.3, 4.6, 0], sig: [0, 0, 0, 0] },
    orbit:         { dist: 318, el: 0.42, spin: 0.12, spread: 4, flow: 0.07, release: [0.42, 0.66], field: [4, 0.55, 88, 0], sig: [0, 0, 0, 0] },
    coda:          { dist: 360, el: 0.28, spin: 0.07, spread: 4, flow: 0.1, release: [0.22, 0.5], field: [5, 1.1, 34, 0], sig: [0, 0, 0, 0] },
    dust:          { dist: 322, el: 0.04, spin: 0.05, spread: 17, sig: [0, 0, 0, 0] },
    vortex:        { dist: 330, el: 0.40, spin: 0.10, spread: 18, sig: [1, 1, 1.0, 0] },
    beacon:        { dist: 292, el: 0.12, spin: 0.04, spread: 12, az: 0.1, turn: 0.42, sig: [4, 1, 0.17, 160] },
    iris:          { dist: 256, el: 0.06, spin: 0.02, spread: 9,  az: 0, sig: [6, 1, 1.25, 0] },
    cube:          { dist: 252, el: 0.20, spin: 0.13, spread: 14, sig: [7, 0, 0.05, 0] },
    lattice:       { dist: 292, el: 0.28, spin: 0.16, spread: 11, turn: 0.10, turnDraw: 0.10, sig: [3, 0.8, 6, 0] },
    edges:         { dist: 232, el: 0.09, spin: 0.21, spread: 9,  sig: [3, 1.3, 9, 0] },
    gyro:          { dist: 268, el: 0.22, spin: 0.28, spread: 10, sig: [7, 0, 0.32, 0] },
    gate:          { dist: 286, el: 0.14, spin: 0.04, spread: 9,  az: 0.42, sig: [3, 0.7, 12, 0] },
    horizon:       { dist: 318, el: 0.30, spin: 0.09, spread: 12, az: 0.2, sig: [1, 1, 1.9, 0] },
    tree:          { dist: 300, el: 0.08, spin: 0.06, spread: 10, az: 0.55, sig: [2, 1, 0.9, -63] },
    forest:        { dist: 368, el: 0.06, spin: 0.05, spread: 12, az: 0.8, sig: [2, 1.2, 0.8, -80] },
    vector:        { dist: 268, el: 0.06, spin: 0.03, spread: 10, az: 0, sig: [3, 0.5, 5, 0] },
    cosine:        { dist: 266, el: 0.18, spin: 0.10, spread: 10, sig: [7, 0, 0.1, 0] },
    neuron:        { dist: 296, el: 0.14, spin: 0.08, spread: 11, az: 1.1, sig: [0, 0, 0, 0], fire: true },
    network:       { dist: 288, el: 0.17, spin: 0.11, spread: 16, sig: [0, 0, 0, 0], fire: true },
    networkLoose:  { dist: 272, el: 0.24, spin: 0.12, spread: 11, sig: [0, 0, 0, 0], fire: true },
    binary:        { dist: 330, el: 0.13, spin: 0.05, spread: 15, az: 0, sig: [5, 7, 9, 22] },
    mobius:        { dist: 292, el: 0.52, spin: 0.16, spread: 10, sig: [7, 0, 0.13, 0] },
    binaryBridge:  { dist: 300, el: 0.04, spin: 0.04, spread: 9,  az: 0, sig: [5, 5, 7, 20] },
    constellation: { dist: 258, el: 0.20, spin: 0.07, spread: 16, sig: [0, 0, 0, 0], fire: true }
  };

  const PREP = ['cloud', 'cloud', 'dust'].concat(SCRIPT.map(b => b.cue));
  const FIRST = 3;

  let bank = [];
  let worker = null, workerDead = false, run = 0, local = null;

  function graphLite() {
    return {
      nodes: data.nodes.map(n => ({ x: n.x, y: n.y, z: n.z })),
      edges: data.edges.map(e => ({ a: e.a, b: e.b }))
    };
  }

  const complete = () => bank.length === PREP.length && bank.filter(Boolean).length === PREP.length;

  function prepare() {
    warm();
    if (worker || workerDead || reducedQuery.matches || complete()) return;
    if (bank.length !== PREP.length) bank = new Array(PREP.length);
    const mine = ++run;
    try {
      worker = new Worker(new URL('./forms-worker.js?v=2', import.meta.url), { type: 'module' });
    } catch (_) {
      worker = null;
      workerDead = true;
      return;
    }
    worker.onmessage = e => {
      const m = e.data;
      if (!m || m.run !== mine) return;
      if (m.type === 'form' && !bank[m.index]) bank[m.index] = m.data;
      else if (m.type === 'done' && worker) { worker.terminate(); worker = null; }
    };
    worker.onerror = () => {
      workerDead = true;
      if (worker) worker.terminate();
      worker = null;
    };
    worker.postMessage({ type: 'run', run: mine, side: SIDE, graph: graphLite(), names: PREP });
  }

  function form(k) {
    if (bank[k]) return bank[k];
    if (!local) local = createForms(SIDE, graphLite());
    bank[k] = local.make(PREP[k]);
    return bank[k];
  }

  let THREE = null;
  let scene = null, cam = null, spirit = null;
  let ready = false, running = false, closing = 0, waiting = false;
  let still = false;
  let beat = -1, mix = 1, elapsed = 0, fade = 0;

  let tl = 0, held = false, audioBase = null, lastAt = -1, stuck = 0;

  let camDist = 300, camWant = 300, camAz = 0, camAzSpeed = 0.08, camAzWant = null, camEl = 0.1, camElWant = 0.1;
  let spinY = 0, drawSpinY = 0, fit = 1, burst = 0, slow = 0;
  let freeNow = 0, emitNow = 0, stirNow = 0;
  const fieldNow = [0, 0, 1, 0];
  let root, lineEl, statEl, statN, statC, ruler, holdEl, ticks = [];
  let statAnim = null, swapTimer = 0;

  const OUTRO = 0.8;

  bus.on('gl-resize', s => {
    fit = clamp(1010 / Math.max(430, s.h), 1, 1.7);
    if (!cam) return;
    cam.aspect = Math.max(0.2, s.w / s.h);
    cam.updateProjectionMatrix();
    if (spirit) spirit.draw.uPR.value = s.pr;
  });

  bus.on('gl-lost', () => { if (running) teardown(); });

  let assembled = false, warmed = false;

  function assemble() {
    if (assembled) return true;
    THREE = gl.three;
    if (!THREE || !gl.renderer) return false;

    scene = new THREE.Scene();
    const sz = gl.size;
    cam = new THREE.PerspectiveCamera(48, Math.max(0.2, sz.w / sz.h), 0.8, 1600);
    fit = clamp(1010 / Math.max(430, sz.h), 1, 1.7);

    still = reducedQuery.matches;
    spirit = null;
    if (!still) {
      try {
        spirit = createSpirit(THREE, gl.renderer, SIDE);
        spirit.draw.uPR.value = sz.pr;
        scene.add(spirit.trails);
        scene.add(spirit.points);
      } catch (_) {
        if (spirit) spirit.dispose();
        spirit = null;
      }
    }

    buildDraw();
    assembled = true;
    return true;
  }

  function warm() {
    if (warmed || !assemble()) return;
    const r = gl.renderer;
    if (typeof r.compileAsync !== 'function') { warmed = true; return; }
    const jobs = [r.compileAsync(scene, cam)];
    if (spirit) jobs.push(spirit.warm());
    const prime = () => {
      if (!assembled || running) { warmed = true; return; }
      const tiny = new THREE.WebGLRenderTarget(2, 2);
      r.setRenderTarget(tiny);
      r.render(scene, cam);
      r.setRenderTarget(null);
      tiny.dispose();
      warmed = true;
    };
    Promise.all(jobs).then(prime, prime);
  }

  function build() {
    if (!assemble()) return false;
    if (spirit) {
      try {
        spirit.seed(form(0));
        spirit.setA(form(1));
        spirit.setB(form(2));
      } catch (_) {
        scene.remove(spirit.trails);
        scene.remove(spirit.points);
        spirit.dispose();
        spirit = null;
      }
    }
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
    holdEl = $('#intro-hold');

    if (!ticks.length) {
      ruler.textContent = '';
      ticks = SCRIPT.map((b, k) => {
        const t = el('button', { class: 'itick', type: 'button', 'aria-label': 'line ' + (k + 1) + ' of ' + SCRIPT.length }, [el('i')]);
        t.addEventListener('click', () => jump(k));
        ruler.appendChild(t);
        return t;
      });
      $('#intro-skip').addEventListener('click', finish);
    }
  }

  function setLine(text, dur) {
    lineEl.textContent = '';
    const words = text.split(/\s+/).filter(Boolean);
    const step = Math.min(120, Math.max(46, (dur * 380) / Math.max(1, words.length)));
    lineEl.style.setProperty('--step', step + 'ms');
    words.forEach((w, k) => {
      const span = el('span', { class: 'w', text: w });
      span.style.setProperty('--k', String(k));
      lineEl.appendChild(span);
      if (k < words.length - 1) lineEl.appendChild(document.createTextNode(' '));
    });
  }

  function setStat(reading) {
    statEl.hidden = !reading;
    statAnim = null;
    if (!reading) return;
    statC.textContent = reading[1];
    statEl.classList.remove('in');
    void statEl.offsetWidth;
    statEl.classList.add('in');
    const target = reading[0];
    if (still || !/^\d+$/.test(target)) { statN.textContent = target; return; }
    statAnim = { target: target, t: 0, dur: 1.1, count: Number(target) > 60 };
    stepStat(0);
  }

  function stepStat(dt) {
    if (!statAnim) return;
    statAnim.t += dt;
    const k = clamp(statAnim.t / statAnim.dur, 0, 1);
    const s = statAnim.target;
    let out = '';
    if (statAnim.count) {
      out = String(Math.round(Number(s) * (1 - Math.pow(1 - k, 3)))).padStart(s.length, '0');
    } else {
      for (let j = 0; j < s.length; j++) {
        out += k >= (j + 1) / (s.length + 1) ? s[j] : String((Math.random() * 10) | 0);
      }
    }
    statN.textContent = out;
    if (k >= 1) statAnim = null;
  }

  function paintBeat(i) {
    const b = SCRIPT[i];
    ticks.forEach((t, k) => {
      t.classList.toggle('on', k <= i);
      t.classList.toggle('now', k === i);
    });
    if (b.keep) return;
    clearTimeout(swapTimer);
    root.classList.add('swap');
    swapTimer = setTimeout(() => {
      setLine(b.line, b.dur);
      setStat(b.stat && STATS[b.stat] ? STATS[b.stat]() : null);
      root.classList.remove('swap');
    }, still ? 0 : 240);
  }

  function beatAt(t) {
    let i = 0;
    while (i < SCRIPT.length - 1 && t >= STARTS[i + 1]) i++;
    return i;
  }

  function gotoBeat(i) {
    beat = i;
    const b = SCRIPT[beat];
    const cue = CUES[b.cue] || CUES.dust;

    if (spirit) {
      spirit.carryOver();
      spirit.setB(form(FIRST + i));

      const sa = spirit.sim.uSigA.value, sb = spirit.sim.uSigB.value;
      sa.copy(sb);
      const s = cue.sig || [0, 0, 0, 0];
      sb.set(s[0], s[1], s[2], s[3]);

      const fire = spirit.draw.uFire.value;
      fire.set(fire.y, cue.fire ? 1 : 0);
      spirit.sim.uFlow.value = cue.flow != null ? cue.flow : 0.22 + (cue.spread || 10) * 0.055;
      if (cue.field) {
        for (let k = 0; k < 4; k++) fieldNow[k] = cue.field[k];
        spirit.sim.uField.value.set(fieldNow[0], fieldNow[1], fieldNow[2], fieldNow[3]);
      }
      spirit.sim.uLife.value = cue.life || 0.35;
    }

    mix = 0;
    burst = 1;
    camWant = cue.dist * fit;
    camElWant = cue.el;
    camAzSpeed = still ? 0 : cue.spin;
    camAzWant = cue.az == null ? (still ? 0.35 : null) : cue.az;

    setDrawing(b.cue);
    paintBeat(beat);
    if (!still) breathe(0.8);
  }

  function clock(dt) {
    if (held || closing) return;
    const at = audio.time;
    if (at == null) {
      audioBase = null;
      tl += dt;
      return;
    }
    if (at === lastAt) stuck += dt;
    else { stuck = 0; lastAt = at; }
    if (stuck > 2) {
      audioBase = null;
      tl += dt;
      return;
    }
    if (audioBase == null) audioBase = at - tl;
    const want = at - audioBase;
    if (want < tl - 0.6) {
      audioBase = at - tl;
      tl += dt;
      return;
    }
    tl = want;
  }

  function jump(i) {
    if (!running || closing) return;
    const k = clamp(i, 0, SCRIPT.length - 1);
    const at = audio.time;
    tl = STARTS[k] + 0.001;
    if (at != null && audioBase != null) audio.seek(audioBase + tl);
    else audioBase = null;
    stuck = 0;
    if (k !== beat) gotoBeat(k);
  }

  function hold(on) {
    if (!running || closing) return;
    held = on == null ? !held : !!on;
    root.classList.toggle('held', held);
    if (holdEl) holdEl.textContent = held ? 'resume' : 'hold';
    if (held) audio.pause();
    else { audioBase = null; audio.play(); }
  }

  function key(e) {
    if (!running || waiting) return e.key === 'Escape' || e.key === ' ' || e.key === 'Enter';
    const k = e.key;
    if (k === 'Escape') { finish(); return true; }
    if (k === ' ' || k === 'Spacebar') { hold(); return true; }
    if (k === 'ArrowRight' || k === 'Enter') {
      if (beat >= SCRIPT.length - 1) finish();
      else jump(beat + 1);
      return true;
    }
    if (k === 'ArrowLeft') {
      const into = tl - STARTS[beat];
      jump(into > 1.5 ? beat : beat - 1);
      return true;
    }
    return false;
  }

  function start() {
    if (running) return;
    running = true;
    waiting = true;
    ready = false;
    state.phase = 'intro';
    prepare();
    const t0 = performance.now();
    const need = [0, 1, 2, FIRST, FIRST + 1];
    (function wait() {
      if (!running) return;
      const have = (reducedQuery.matches || need.every(k => bank[k])) && warmed;
      if (!have && performance.now() - t0 < 1500) { requestAnimationFrame(wait); return; }
      waiting = false;
      begin();
    })();
  }

  function begin() {
    if (!build()) {
      running = false;
      bus.emit('intro-done');
      return;
    }
    buildDom();

    closing = 0;
    held = false;
    root.classList.remove('held', 'gone');
    if (holdEl) holdEl.textContent = 'hold';
    state.phase = 'intro';
    root.hidden = false;
    const fog = $('#fog');
    if (fog) fog.classList.add('on');
    bus.emit('phase', 'intro');

    elapsed = 0;
    tl = 0;
    audioBase = null;
    lastAt = -1;
    stuck = 0;
    slow = 0;
    beat = -1;
    camDist = still ? CUES[SCRIPT[0].cue].dist * fit : 500;
    camAz = 0.4;
    camAzWant = null;
    burst = 0;
    camEl = 0.05;
    spinY = 0;
    drawSpinY = 0;
    freeNow = 0;
    emitNow = 0;
    stirNow = 0;
    fieldNow[0] = 0;
    gotoBeat(0);
  }

  function finish() {
    if (!running || closing) return;
    if (waiting || !ready) { teardown(); return; }
    closing = OUTRO;
    store.set('intro', 1);
    clearTimeout(swapTimer);
    root.classList.add('gone');
    if (held) { held = false; audio.play(); }
  }

  function teardown() {
    running = false;
    waiting = false;
    closing = 0;
    store.set('intro', 1);
    clearTimeout(swapTimer);
    statAnim = null;
    if (root) {
      root.classList.add('gone');
      setTimeout(() => {
        if (running) return;
        root.hidden = true;
        root.classList.remove('gone', 'held');
        statEl.hidden = true;
      }, 900);
    }
    const fog = $('#fog');
    if (fog) fog.classList.remove('on');
    state.phase = 'station';
    bus.emit('phase', 'station');
    bus.emit('intro-done');

    if (spirit) { spirit.dispose(); spirit = null; }
    if (draw) { draw.geometry.dispose(); drawMat.dispose(); draw = null; drawMat = null; }
    scene = null;
    cam = null;
    ready = false;
    assembled = false;
    warmed = false;
    bank = [];
    local = null;
  }

  function update(dt) {
    if (!running || !ready) return false;

    elapsed += dt;
    clock(dt);
    stepStat(dt);

    if (closing) {
      closing = Math.max(0, closing - dt);
      if (!closing) { teardown(); return false; }
    }

    const i = beatAt(tl);
    if (i !== beat) gotoBeat(i);

    const b = SCRIPT[beat];
    const cue = CUES[b.cue] || CUES.dust;
    const into = Math.max(0, tl - STARTS[beat]);

    spinY = !still && cue.turn ? spinY + cue.turn * dt : damp(spinY, 0, 2.2, dt);
    drawSpinY = !still && cue.turnDraw ? drawSpinY + cue.turnDraw * dt : damp(drawSpinY, 0, 2.2, dt);

    mix = clamp(into / (b.dur * 0.72), 0, 1);
    burst = damp(burst, 0, 1.5, dt);

    const fadeIn = clamp(tl / 1.6, 0, 1);
    const fadeOut = clamp((TOTAL - tl) / 1.2, 0, 1);
    fade = fadeIn * fadeOut * (closing ? closing / OUTRO : 1);

    if (spirit) {
      const rel = cue.release;
      const freeWant = rel ? smoother(clamp((into / b.dur - rel[0]) / Math.max(0.001, rel[1] - rel[0]), 0, 1)) : 0;
      freeNow = damp(freeNow, freeWant, 5, dt);
      emitNow = damp(emitNow, cue.emit || 0, 3, dt);
      stirNow = damp(stirNow, cue.stir || 0, 3, dt);
      if (freeNow < 0.02 && !cue.field && fieldNow[0] !== 0) {
        fieldNow[0] = 0;
        spirit.sim.uField.value.x = 0;
      }
      spirit.flow.uFree.value = freeNow;
      spirit.flow.uEmit.value = emitNow;
      spirit.sim.uStir.value = stirNow;
      spirit.sim.uMorph.value = smoother(mix);
      spirit.sim.uGrow.value = clamp(into / (b.dur * 0.9), 0, 1);
      spirit.sim.uPull.value = lerp(0.045, 0.13, smoother(mix));
      spirit.sim.uBurst.value = burst * burst;
      spirit.draw.uFade.value = fade;
      spirit.trail.uFade.value = fade;
      spirit.step(dt, elapsed);

      if (dt > 1 / 28) slow += dt;
      else slow = Math.max(0, slow - dt * 0.5);
      if (slow > 2.5 && spirit.trails.visible) { spirit.trails.visible = false; slow = 0; }

      spirit.points.rotation.y = spinY;
      spirit.trails.rotation.y = spinY;
    }

    if (drawMat) {
      if (still) {
        drawMat.uniforms.uDraw.value = 1;
        drawMat.uniforms.uFade.value = fade * clamp(into / 0.6, 0, 1);
      } else {
        const drawT = clamp((into - b.dur * 0.34) / (b.dur * 0.42), 0, 1);
        drawMat.uniforms.uDraw.value = smoother(drawT);
        drawMat.uniforms.uFade.value = fade;
      }
    }
    if (draw) draw.rotation.y = drawSpinY;

    if (still) {
      camDist = camWant;
      camEl = camElWant;
      camAz = camAzWant == null ? camAz : camAzWant;
    } else {
      camDist = damp(camDist, camWant, 1.5, dt);
      camEl = damp(camEl, camElWant, 1.4, dt);
      if (camAzWant == null) camAz += camAzSpeed * dt * (1 + (1 - mix) * 1.6);
      else camAz = damp(camAz, camAz + shortAngle(camAz, camAzWant), 1.2, dt);
    }

    const ce = Math.cos(camEl), se = Math.sin(camEl);
    cam.position.set(Math.sin(camAz) * ce * camDist, se * camDist, Math.cos(camAz) * ce * camDist);
    cam.up.set(0, 1, 0);
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld(true);
    cam.matrixWorldInverse.copy(cam.matrixWorld).invert();

    gl.renderThrough(scene, cam, dt);

    if (tl >= TOTAL && !closing) { teardown(); return false; }
    return true;
  }

  return {
    prepare, start, update, finish, key,
    get running() { return running; }
  };
})();
