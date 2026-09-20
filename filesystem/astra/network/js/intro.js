import { $, el, state, store, bus, clamp, damp, lerp, smoother, shortAngle, rng, breathe } from './core.js?v=1';
import { data } from './vault.js?v=1';
import { gl } from './gl.js?v=1';
import { audio } from './audio.js?v=1';

export const intro = (function () {
  'use strict';

  const SCRIPT = [
    { cue: 'dust',          dur: 2.5, line: '',                                            stat: null },
    { cue: 'dust',          dur: 4.0, line: 'i was losing days.',                           stat: 'days' },
    { cue: 'cube',          dur: 4.0, line: 'so i built something that does not.',          stat: null },
    { cue: 'edges',         dur: 4.0, line: 'two fields decide what leaves.',               stat: 'leaks' },
    { cue: 'sieve',         dur: 3.5, line: 'almost nothing does.',                         stat: null },
    { cue: 'roots',         dur: 4.5, line: 'the rest grows down here, in the dark.',       stat: 'dims' },
    { cue: 'network',       dur: 4.0, line: 'it knows what belongs together before i do.',  stat: 'links' },
    { cue: 'binary',        dur: 3.5, line: 'she is not alone.',                            stat: 'stations' },
    { cue: 'constellation', dur: 2.5, line: 'astra.',                                       stat: null },
    { cue: 'constellation', dur: 3.0, line: 'enjoy the journey.',                           stat: null }
  ];

  const three = n => String(Math.max(0, n | 0)).padStart(3, '0');

  const STATS = {
    days: () => [String(Math.floor((Date.now() - Date.UTC(2023, 8, 1)) / 86400000)), 'days on record'],
    leaks: () => ['000', 'leaks, ever'],
    dims: () => ['384', 'numbers per note'],
    links: () => [three(data.stats.links), 'links drawn between notes'],
    stations: () => data.stats.apollo ? ['02', 'stations mirrored'] : ['01', 'station online']
  };

  const P = window.innerWidth < 760 ? 4200 : 11000;
  const RS = rng(0x51AA);

  let THREE = null;
  let scene = null, cam = null, pts = null, mat = null;
  let posA = null, posB = null;
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
  let root, lineEl, statEl, statN, statC, ruler, ticks = [];

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const VS = `
    attribute vec3 aB;
    attribute float aSeed;
    attribute float aSize;
    uniform float uMix;
    uniform float uTime;
    uniform float uPR;
    uniform float uSpread;
    uniform float uDrift;
    varying float vFog;
    varying float vSeed;
    varying float vFlight;

    void main() {
      float o = aSeed * 0.34;
      float t = clamp((uMix - o) / 0.66, 0.0, 1.0);
      t = t * t * (3.0 - 2.0 * t);

      vec3 p = mix(position, aB, t);

      vec3 w = vec3(
        sin(aSeed * 57.31), cos(aSeed * 31.77), sin(aSeed * 91.13)
      );

      float bulge = sin(t * 3.14159265);
      p += w * bulge * uSpread;
      vFlight = bulge;

      p += w * sin(uTime * 0.42 + aSeed * 19.7) * uDrift;

      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      float d = -mv.z;
      vFog = clamp(1.0 - (d - 130.0) / 560.0, 0.0, 1.0);
      vFog = pow(vFog, 1.05);
      vSeed = aSeed;

      gl_PointSize = clamp(aSize * uPR * (360.0 / max(1.0, d)), 0.9, 26.0 * uPR);
      gl_Position = projectionMatrix * mv;
    }
  `;

  const FS = `
    precision highp float;
    uniform float uTime;
    uniform float uFade;
    varying float vFog;
    varying float vSeed;
    varying float vFlight;

    void main() {
      vec2 p = gl_PointCoord * 2.0 - 1.0;
      float r = dot(p, p);
      if (r > 1.0) discard;
      float core = exp(-r * 7.2);
      float halo = exp(-r * 1.9) * 0.13;
      float tw = 0.72 + 0.28 * sin(uTime * 1.1 + vSeed * 44.0);
      float a = (core + halo) * vFog * tw * uFade * (1.05 + vFlight * 0.55);
      if (a < 0.003) discard;
      gl_FragColor = vec4(vec3(1.0), a);
    }
  `;

  function alloc() { return new Float32Array(P * 3); }

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
        const v = c[(RS() * 8) | 0];
        const j = s * 0.055;
        o[i * 3] = v[0] + (RS() - 0.5) * j;
        o[i * 3 + 1] = v[1] + (RS() - 0.5) * j;
        o[i * 3 + 2] = v[2] + (RS() - 0.5) * j;
        continue;
      }
      const e = pairs[(RS() * pairs.length) | 0];
      const a = c[e[0]], b = c[e[1]];
      const t = RS();
      const j = s * 0.006;
      o[i * 3] = lerp(a[0], b[0], t) + (RS() - 0.5) * j;
      o[i * 3 + 1] = lerp(a[1], b[1], t) + (RS() - 0.5) * j;
      o[i * 3 + 2] = lerp(a[2], b[2], t) + (RS() - 0.5) * j;
    }
    return o;
  }

  function formSieve(s) {
    const o = alloc();
    const h = s * 0.5;
    const tmp = new Float32Array(3);
    for (let i = 0; i < P; i++) {
      if (RS() < 0.08) {
        const t = Math.pow(RS(), 0.7);
        const w = s * (0.03 + t * 0.12);
        o[i * 3] = (RS() - 0.5) * w;
        o[i * 3 + 1] = h + t * s * 1.2;
        o[i * 3 + 2] = (RS() - 0.5) * w;
      } else {
        facePoint(tmp, 0, s, s * 0.018);
        o[i * 3] = tmp[0];
        o[i * 3 + 1] = tmp[1];
        o[i * 3 + 2] = tmp[2];
      }
    }
    return o;
  }

  function formRoots(top, reach) {
    const o = alloc();
    const segs = [];

    (function grow(x, y, z, dx, dy, dz, len, depth) {
      const ex = x + dx * len, ey = y + dy * len, ez = z + dz * len;
      segs.push([x, y, z, ex, ey, ez, depth]);
      if (depth >= 5 || len < reach * 0.05) return;
      const branches = depth < 2 ? 3 : (RS() > 0.4 ? 2 : 1);
      for (let b = 0; b < branches; b++) {
        let nx = dx + (RS() - 0.5) * 1.6;
        let ny = dy - 0.22 - RS() * 0.22;
        let nz = dz + (RS() - 0.5) * 1.6;
        const m = Math.hypot(nx, ny, nz) || 1;
        grow(ex, ey, ez, nx / m, ny / m, nz / m, len * (0.58 + RS() * 0.22), depth + 1);
      }
    })(0, top, 0, 0, -1, 0, reach * 0.32, 0);

    const lens = segs.map(s => Math.hypot(s[3] - s[0], s[4] - s[1], s[5] - s[2]));
    let total = 0;
    lens.forEach(l => { total += l; });

    const step = (reach * 2) / 15;
    for (let i = 0; i < P; i++) {
      if (RS() < 0.24) {
        const line = (RS() * 16) | 0;
        if (RS() < 0.5) {
          o[i * 3] = (RS() - 0.5) * reach * 2;
          o[i * 3 + 2] = -reach + line * step;
        } else {
          o[i * 3] = -reach + line * step;
          o[i * 3 + 2] = (RS() - 0.5) * reach * 2;
        }
        o[i * 3 + 1] = top + (RS() - 0.5) * reach * 0.006;
        continue;
      }
      let pick = RS() * total;
      let s = segs[0], d = 0;
      for (let k = 0; k < segs.length; k++) {
        pick -= lens[k];
        if (pick <= 0) { s = segs[k]; d = s[6]; break; }
      }
      const t = RS();
      const j = reach * 0.016 * (1 - d / 6);
      o[i * 3] = lerp(s[0], s[3], t) + (RS() - 0.5) * j;
      o[i * 3 + 1] = lerp(s[1], s[4], t) + (RS() - 0.5) * j;
      o[i * 3 + 2] = lerp(s[2], s[5], t) + (RS() - 0.5) * j;
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
      } else if (roll < 0.40) {
        const c = C[(RS() * C.length) | 0];
        const j = r * 0.018;
        o[i * 3] = c[0] + (RS() - 0.5) * j;
        o[i * 3 + 1] = c[1] + (RS() - 0.5) * j;
        o[i * 3 + 2] = c[2] + (RS() - 0.5) * j;
      } else {
        const e = L[(RS() * L.length) | 0];
        const a = C[e[0]], b = C[e[1]];
        const t = RS();
        const j = r * 0.005;
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
        const c = C[(RS() * hubs) | 0];
        const j = r * 0.02;
        o[i * 3] = c[0] + (RS() - 0.5) * j;
        o[i * 3 + 1] = c[1] + (RS() - 0.5) * j;
        o[i * 3 + 2] = c[2] + (RS() - 0.5) * j;
      } else {
        const e = L[(RS() * L.length) | 0];
        const a = C[e[0]], b = C[e[1]];
        let t = RS();

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
    dust:          { make: () => formDust(150),              dist: 322, el: 0.04,  spin: 0.05, spread: 17 },
    cube:          { make: () => formCubeVolume(126),        dist: 252, el: 0.20,  spin: 0.13, spread: 14 },
    edges:         { make: () => formCubeEdges(126),         dist: 232, el: 0.09,  spin: 0.21, spread: 9  },
    sieve:         { make: () => formSieve(126),             dist: 262, el: 0.27,  spin: 0.09, spread: 11 },
    roots:         { make: () => formRoots(58, 150),         dist: 300, el: -0.26, spin: 0.06, spread: 13, az: 0.55 },
    network:       { make: () => formNetwork(140, 40, true), dist: 288, el: 0.17,  spin: 0.11, spread: 16 },
    binary:        { make: () => formBinary(168),            dist: 330, el: 0.13,  spin: 0.05, spread: 15, az: 0 },
    constellation: { make: () => formConstellation(135),     dist: 258, el: 0.20,  spin: 0.07, spread: 16 }
  };

  function build() {
    THREE = gl.three;
    if (!THREE) return false;

    scene = new THREE.Scene();
    const sz = gl.size;
    cam = new THREE.PerspectiveCamera(48, Math.max(0.2, sz.w / sz.h), 0.8, 1600);

    posA = formDust(330);
    posB = CUES.dust.make();

    const seed = new Float32Array(P);
    const size = new Float32Array(P);
    for (let i = 0; i < P; i++) {
      seed[i] = RS();
      size[i] = 1.15 + Math.pow(RS(), 2.0) * 3.0;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(posA, 3));
    g.setAttribute('aB', new THREE.BufferAttribute(posB, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));

    mat = new THREE.ShaderMaterial({
      uniforms: {
        uMix: { value: 0 }, uTime: { value: 0 }, uPR: { value: sz.pr },
        uSpread: { value: 30 }, uDrift: { value: 0.9 }, uFade: { value: 0 }
      },
      vertexShader: VS, fragmentShader: FS,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });

    pts = new THREE.Points(g, mat);
    pts.frustumCulled = false;
    scene.add(pts);

    bus.on('gl-resize', s => {
      if (!cam) return;
      cam.aspect = Math.max(0.2, s.w / s.h);
      cam.updateProjectionMatrix();
      mat.uniforms.uPR.value = s.pr;
    });
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

    posA.set(posB);
    posB.set(cue.make());
    pts.geometry.attributes.position.needsUpdate = true;
    pts.geometry.attributes.aB.needsUpdate = true;

    mix = 0;
    mat.uniforms.uSpread.value = cue.spread;
    camWant = cue.dist;
    camElWant = cue.el;
    camAzSpeed = cue.spin;
    camAzWant = cue.az == null ? null : cue.az;

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
      if (pts) {
        pts.geometry.dispose();
        mat.dispose();
        scene = null; pts = null; mat = null;
        posA = posB = null;
      }
    }, 1200);
  }

  function update(dt) {
    if (!running || !mat) return false;

    elapsed += dt;
    const now = clock();

    let i = beat;
    while (i < SCRIPT.length - 1 && now >= STARTS[i + 1]) i++;
    if (i !== beat) gotoBeat(i);

    const b = SCRIPT[beat];
    const local = now - STARTS[beat];

    mix = clamp(local / (b.dur * 0.62), 0, 1);
    mat.uniforms.uMix.value = smoother(mix);
    mat.uniforms.uTime.value = elapsed;
    mat.uniforms.uDrift.value = lerp(1.1, 0.35, mix);

    const fadeIn = clamp(now / 1.3, 0, 1);
    const fadeOut = clamp((TOTAL - now) / 1.1, 0, 1);
    mat.uniforms.uFade.value = fadeIn * fadeOut;

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
