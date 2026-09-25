import { state, bus, clamp, damp, rng, breathValue } from './core.js?v=2';
import { data } from './vault.js?v=2';

export const gl = (function () {
  'use strict';

  const THREE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.159.0/three.min.js';
  const THREE_SRI = 'sha384-Lwojr+0fOVR25P8bdL6E0T2dv0q0ZT4Yy2Ia1dGOz6b5jLSzWZkdqlw0cKTQYKzT';

  let THREE = null;
  let renderer, scene, cam, canvas;
  let nodePts, edgeLines, dust, grid, hazeGroup, bridge, selRig;
  let rtScene, accumA, accumB, brightA, brightB;
  let quadScene, quadCam, passMat = {}, quadMesh;
  let W = 1, H = 1, PR = 1;
  let ready = false, failed = false;
  let time = 0;

  let liveScene = null, liveCam = null;

  const NEAR = 20, FAR = 560;
  const SEG = 14;

  const seedR = rng(0x1CE);
  let N = 0;
  let nodeState = new Float32Array(0);
  let nodeDim = new Float32Array(0);
  let nodeFav = new Float32Array(0);
  let screen = new Float32Array(0);

  function loadThree() {
    return new Promise((resolve, reject) => {
      if (window.THREE) return resolve(window.THREE);
      const s = document.createElement('script');
      s.src = THREE_SRC;
      s.integrity = THREE_SRI;
      s.crossOrigin = 'anonymous';
      s.referrerPolicy = 'no-referrer';
      s.async = false;
      s.onload = () => (window.THREE ? resolve(window.THREE) : reject(new Error('three.js did not define THREE')));
      s.onerror = () => reject(new Error('three.js could not be loaded'));
      document.head.appendChild(s);
    });
  }

  const COMMON = `
    uniform float uTime;
    uniform float uNear;
    uniform float uFar;
  `;

  const NODE_VS = COMMON + `
    attribute float aSize;
    attribute float aVis;
    attribute float aStation;
    attribute float aLoose;
    attribute float aSeed;
    attribute float aState;
    attribute float aDim;
    attribute float aFav;
    attribute float aWeight;
    uniform float uPR;
    uniform float uGainPriv;
    uniform float uGainA;
    uniform float uGainB;
    uniform float uGainLoose;
    uniform float uDepthMode;
    uniform float uStageMode;
    uniform float uSealed;
    varying float vVis;
    varying float vFog;
    varying float vGain;
    varying float vState;
    varying float vFav;

    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      float d = -mv.z;

      vFog = clamp(1.0 - (d - uNear) / (uFar - uNear), 0.0, 1.0);
      vFog = pow(vFog, 1.55);

      float g = mix(uGainA, uGainB, aStation);
      g *= mix(uGainPriv, 1.0, aVis);
      g *= mix(1.0, uGainLoose, aLoose);
      g *= mix(1.0, uSealed, aStation);
      g *= (1.0 - aDim * 0.94);
      g = mix(g, g * smoothstep(0.0, 0.55, vFog) * 1.7, uDepthMode);
      g = mix(g, g * (0.30 + aWeight * 0.95), uStageMode);
      g *= (1.0 + aFav * 0.5);

      vGain = g;
      vVis = aVis;
      vState = aState;
      vFav = aFav;

      float breathe = 1.0 + 0.15 * sin(uTime * 1.5 + aSeed * 31.4);
      float s = aSize * breathe * (1.0 + aState * 1.15 + aFav * 0.22);
      gl_PointSize = clamp(s * uPR * (400.0 / max(1.0, d)), 1.0, 110.0 * uPR);
      gl_Position = projectionMatrix * mv;
    }
  `;

  const NODE_FS = `
    precision highp float;
    varying float vVis;
    varying float vFog;
    varying float vGain;
    varying float vState;
    varying float vFav;

    void main() {
      vec2 p = gl_PointCoord * 2.0 - 1.0;
      float r = length(p);
      if (r > 1.0) discard;

      float core = exp(-r * r * 9.0);
      float halo = exp(-r * r * 1.7) * 0.30;

      float ring = 0.0;
      if (vVis > 0.5) {
        ring = smoothstep(0.78, 0.715, r) * smoothstep(0.60, 0.66, r) * 0.58;
      }

      float fav = 0.0;
      if (vFav > 0.5) {
        vec2 a = abs(p);
        float arm = (1.0 - smoothstep(0.045, 0.085, a.y)) * step(0.30, a.x) * step(a.x, 0.98)
                  + (1.0 - smoothstep(0.045, 0.085, a.x)) * step(0.30, a.y) * step(a.y, 0.98);
        fav = clamp(arm, 0.0, 1.0) * 0.55 * vFav;
      }

      float lock = 0.0;
      if (vState > 0.5) {
        lock = smoothstep(0.99, 0.92, r) * smoothstep(0.83, 0.89, r) * vState * 1.5;
      }

      float a = (core + halo + ring + fav + lock) * vFog * vGain;
      if (a < 0.002) discard;
      gl_FragColor = vec4(vec3(1.0), a);
    }
  `;

  const EDGE_VS = COMMON + `
    attribute float aT;
    attribute float aKind;
    attribute float aSeed;
    attribute float aLen;
    attribute float aDim;
    varying float vT;
    varying float vKind;
    varying float vSeed;
    varying float vLen;
    varying float vFog;
    varying float vDim;

    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      float d = -mv.z;
      vFog = clamp(1.0 - (d - uNear) / (uFar - uNear), 0.0, 1.0);
      vFog = pow(vFog, 2.1);
      vT = aT; vKind = aKind; vSeed = aSeed; vLen = aLen; vDim = aDim;
      gl_Position = projectionMatrix * mv;
    }
  `;

  const EDGE_FS = COMMON + `
    precision highp float;
    uniform float uLink;
    uniform float uLoose;
    uniform float uCross;
    uniform float uPulse;
    uniform float uSealed;
    varying float vT;
    varying float vKind;
    varying float vSeed;
    varying float vLen;
    varying float vFog;
    varying float vDim;

    void main() {
      float gain = uLink;
      if (vKind > 1.5) gain = uCross * uSealed;
      else if (vKind > 0.5) gain = uLoose;
      if (gain < 0.002) discard;

      float belly = 0.45 + 0.55 * sin(vT * 3.14159);
      float a = 0.115 * gain * vFog * belly;

      if (vKind > 0.5 && vKind < 1.5) {
        float dash = fract(vT * vLen * 0.15 - uTime * 0.2);
        if (dash > 0.40) discard;
        a *= 1.95;
      }

      float ph = fract(uTime * 0.075 + vSeed);
      float d = abs(vT - ph);
      d = min(d, 1.0 - d);
      a += exp(-d * d * 900.0) * 0.6 * vFog * gain * uPulse;

      a *= (1.0 - vDim * 0.93);
      if (a < 0.002) discard;
      gl_FragColor = vec4(vec3(1.0), a);
    }
  `;

  const DUST_VS = COMMON + `
    attribute float aSize;
    attribute float aSeed;
    uniform float uPR;
    varying float vFog;
    varying float vSeed;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      float d = -mv.z;
      vFog = clamp(1.0 - (d - uNear) / (uFar * 2.0 - uNear), 0.0, 1.0);
      vSeed = aSeed;
      gl_PointSize = clamp(aSize * uPR * (260.0 / max(1.0, d)), 0.6, 5.0 * uPR);
      gl_Position = projectionMatrix * mv;
    }
  `;

  const DUST_FS = COMMON + `
    precision highp float;
    varying float vFog;
    varying float vSeed;
    void main() {
      vec2 p = gl_PointCoord * 2.0 - 1.0;
      float r = dot(p, p);
      if (r > 1.0) discard;
      float tw = 0.5 + 0.5 * sin(uTime * 0.6 + vSeed * 62.8);
      float a = exp(-r * 3.4) * vFog * 0.30 * tw;
      if (a < 0.002) discard;
      gl_FragColor = vec4(vec3(1.0), a);
    }
  `;

  const HAZE_VS = `
    varying vec2 vUv;
    varying float vFog;
    void main() {
      vUv = uv;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vFog = clamp(1.0 - (-mv.z - 40.0) / 640.0, 0.0, 1.0);
      gl_Position = projectionMatrix * mv;
    }
  `;

  const HAZE_FS = `
    precision highp float;
    uniform float uTime;
    uniform float uSeed;
    uniform float uGain;
    varying vec2 vUv;
    varying float vFog;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 3; i++) { v += a * noise(p); p = p * 2.03 + vec2(17.3, 9.1); a *= 0.5; }
      return v;
    }

    void main() {
      vec2 p = vUv * 3.0 + vec2(uSeed * 11.0, uSeed * 7.0);
      p.x += uTime * 0.010;
      p.y -= uTime * 0.006;
      float n = fbm(p + fbm(p * 0.6) * 0.85);
      n = smoothstep(0.40, 0.94, n);
      vec2 e = abs(vUv - 0.5) * 2.0;
      float edge = (1.0 - smoothstep(0.30, 1.0, e.x)) * (1.0 - smoothstep(0.30, 1.0, e.y));
      float a = n * edge * vFog * uGain;
      if (a < 0.0015) discard;
      gl_FragColor = vec4(vec3(1.0), a);
    }
  `;

  const QUAD_VS = `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
  `;

  const FS_TRAIL = `
    precision highp float;
    uniform sampler2D tNew;
    uniform sampler2D tOld;
    uniform float uDecay;
    varying vec2 vUv;
    void main() {
      vec3 n = texture2D(tNew, vUv).rgb;
      vec3 o = texture2D(tOld, vUv).rgb * uDecay;
      gl_FragColor = vec4(max(n, o), 1.0);
    }
  `;

  const FS_BRIGHT = `
    precision highp float;
    uniform sampler2D tSrc;
    uniform float uCut;
    varying vec2 vUv;
    void main() {
      vec3 c = texture2D(tSrc, vUv).rgb;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      gl_FragColor = vec4(c * smoothstep(uCut, uCut + 0.30, l), 1.0);
    }
  `;

  const FS_BLUR = `
    precision highp float;
    uniform sampler2D tSrc;
    uniform vec2 uDir;
    varying vec2 vUv;
    void main() {
      vec3 s = texture2D(tSrc, vUv).rgb * 0.2270270270;
      s += texture2D(tSrc, vUv + uDir * 1.3846153846).rgb * 0.3162162162;
      s += texture2D(tSrc, vUv - uDir * 1.3846153846).rgb * 0.3162162162;
      s += texture2D(tSrc, vUv + uDir * 3.2307692308).rgb * 0.0702702703;
      s += texture2D(tSrc, vUv - uDir * 3.2307692308).rgb * 0.0702702703;
      gl_FragColor = vec4(s, 1.0);
    }
  `;

  const FS_FINAL = `
    precision highp float;
    uniform sampler2D tBase;
    uniform sampler2D tBloom;
    uniform float uBloom;
    uniform float uFloor;
    varying vec2 vUv;

    void main() {
      vec3 base = texture2D(tBase, vUv).rgb;
      vec3 glow = texture2D(tBloom, vUv).rgb;
      vec3 col = base + glow * uBloom;

      float l = clamp(dot(col, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);
      gl_FragColor = vec4(vec3(l), clamp(l * 1.65 + uFloor, 0.0, 1.0));
    }
  `;

  function buildNodes() {
    const pos = new Float32Array(N * 3);
    const size = new Float32Array(N);
    const vis = new Float32Array(N);
    const sta = new Float32Array(N);
    const loo = new Float32Array(N);
    const sed = new Float32Array(N);
    const wgt = new Float32Array(N);

    data.nodes.forEach((nd, i) => {
      pos[i * 3] = nd.x; pos[i * 3 + 1] = nd.y; pos[i * 3 + 2] = nd.z;
      wgt[i] = nd.weight || 1;
      size[i] = (2.6 + Math.min(nd.deg, 9) * 0.7) * wgt[i];
      vis[i] = nd.listed ? 1 : 0;
      sta[i] = nd.sealed ? 1 : 0;
      loo[i] = nd.loose.length ? 1 : 0;
      sed[i] = seedR();
    });

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aVis', new THREE.BufferAttribute(vis, 1));
    g.setAttribute('aStation', new THREE.BufferAttribute(sta, 1));
    g.setAttribute('aLoose', new THREE.BufferAttribute(loo, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(sed, 1));
    g.setAttribute('aState', new THREE.BufferAttribute(nodeState, 1));
    g.setAttribute('aDim', new THREE.BufferAttribute(nodeDim, 1));
    g.setAttribute('aFav', new THREE.BufferAttribute(nodeFav, 1));
    g.setAttribute('aWeight', new THREE.BufferAttribute(wgt, 1));

    nodePts = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uPR: { value: 1 },
        uNear: { value: NEAR }, uFar: { value: FAR },
        uGainPriv: { value: 0.44 }, uGainA: { value: 1 }, uGainB: { value: 1 },
        uGainLoose: { value: 1 }, uDepthMode: { value: 0 }, uStageMode: { value: 0 },
        uSealed: { value: 0.30 }
      },
      vertexShader: NODE_VS, fragmentShader: NODE_FS,
      transparent: true, depthWrite: false, depthTest: true,
      blending: THREE.AdditiveBlending
    }));
    nodePts.frustumCulled = false;
    scene.add(nodePts);
  }

  function buildEdges() {
    const es = data.edges;
    const verts = es.length * SEG * 2;
    const pos = new Float32Array(verts * 3);
    const t = new Float32Array(verts);
    const kind = new Float32Array(verts);
    const sed = new Float32Array(verts);
    const len = new Float32Array(verts);
    const dim = new Float32Array(verts);

    const centreOf = nd => (nd.station === 'APOLLO'
      ? { x: 205, y: 6, z: -30 } : { x: 0, y: 0, z: 0 });

    let v = 0;
    es.forEach((e, ei) => {
      const a = data.nodes[e.a], b = data.nodes[e.b];
      const L = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      const s = seedR();
      const k = e.kind === 'loose' ? 1 : (e.cross ? 2 : 0);

      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, mz = (a.z + b.z) / 2;
      let cx, cy, cz;
      if (e.cross) {

        cx = mx; cy = my + L * 0.30; cz = mz;
      } else {
        const c = centreOf(a);
        let ox = mx - c.x, oy = my - c.y, oz = mz - c.z;
        const om = Math.hypot(ox, oy, oz) || 1;
        const bow = L * (0.13 + s * 0.10);
        cx = mx + (ox / om) * bow;
        cy = my + (oy / om) * bow + L * 0.05;
        cz = mz + (oz / om) * bow;
      }

      for (let i = 0; i < SEG; i++) {
        for (let half = 0; half < 2; half++) {
          const u = (i + half) / SEG;
          const iv = 1 - u;
          pos[v * 3]     = iv * iv * a.x + 2 * iv * u * cx + u * u * b.x;
          pos[v * 3 + 1] = iv * iv * a.y + 2 * iv * u * cy + u * u * b.y;
          pos[v * 3 + 2] = iv * iv * a.z + 2 * iv * u * cz + u * u * b.z;
          t[v] = u; kind[v] = k; sed[v] = s; len[v] = L;
          v++;
        }
      }
      e._v0 = ei * SEG * 2;
    });

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aT', new THREE.BufferAttribute(t, 1));
    g.setAttribute('aKind', new THREE.BufferAttribute(kind, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(sed, 1));
    g.setAttribute('aLen', new THREE.BufferAttribute(len, 1));
    g.setAttribute('aDim', new THREE.BufferAttribute(dim, 1));

    edgeLines = new THREE.LineSegments(g, new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uNear: { value: NEAR }, uFar: { value: FAR },
        uLink: { value: 1 }, uLoose: { value: 0.18 }, uCross: { value: 1.4 },
        uPulse: { value: 1 }, uSealed: { value: 0.35 }
      },
      vertexShader: EDGE_VS, fragmentShader: EDGE_FS,
      transparent: true, depthWrite: false, depthTest: true,
      blending: THREE.AdditiveBlending
    }));
    edgeLines.frustumCulled = false;
    edgeLines._dim = dim;
    scene.add(edgeLines);
  }

  function buildDust() {
    const C = window.innerWidth < 760 ? 1400 : 4200;
    const pos = new Float32Array(C * 3);
    const size = new Float32Array(C);
    const sed = new Float32Array(C);
    for (let i = 0; i < C; i++) {
      const r = 60 + Math.pow(seedR(), 0.55) * 480;
      const a = seedR() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r + (seedR() - 0.5) * 90;
      pos[i * 3 + 1] = (seedR() - 0.5) * 220 * (1 - r / 720);
      pos[i * 3 + 2] = Math.sin(a) * r + (seedR() - 0.5) * 90;
      size[i] = 0.5 + seedR() * 1.5;
      sed[i] = seedR();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(sed, 1));

    dust = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPR: { value: 1 }, uNear: { value: NEAR }, uFar: { value: FAR } },
      vertexShader: DUST_VS, fragmentShader: DUST_FS,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    dust.frustumCulled = false;
    scene.add(dust);
  }

  function buildGrid() {
    const half = 320, step = 32, y = -100;
    const pts = [];
    for (let i = -half; i <= half; i += step) {
      pts.push(-half, y, i, half, y, i);
      pts.push(i, y, -half, i, y, half);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));

    grid = new THREE.LineSegments(g, new THREE.ShaderMaterial({
      uniforms: { uGain: { value: 1 } },
      vertexShader: `
        varying float vA;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float radial = 1.0 - clamp(length(position.xz) / 320.0, 0.0, 1.0);
          vA = radial * radial * clamp(1.0 - (-mv.z - 60.0) / 540.0, 0.0, 1.0);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        precision highp float;
        uniform float uGain;
        varying float vA;
        void main() {
          float a = vA * 0.062 * uGain;
          if (a < 0.002) discard;
          gl_FragColor = vec4(vec3(1.0), a);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    grid.frustumCulled = false;
    scene.add(grid);
  }

  function buildHaze() {
    hazeGroup = new THREE.Group();
    const geo = new THREE.PlaneGeometry(1, 1);
    for (let i = 0; i < 2; i++) {
      const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 }, uSeed: { value: seedR() * 9 },
          uGain: { value: 0.18 - i * 0.024 }
        },
        vertexShader: HAZE_VS, fragmentShader: HAZE_FS,
        transparent: true, depthWrite: false, depthTest: false,
        blending: THREE.AdditiveBlending
      }));
      const s = 360 + i * 210;
      m.scale.set(s, s * 0.62, 1);
      m.userData.depth = 90 + i * 130;
      m.renderOrder = -10 + i;
      hazeGroup.add(m);
    }
    scene.add(hazeGroup);
  }

  function buildBridge() {
    const a = new THREE.Vector3(-8, 4, -6);
    const b = new THREE.Vector3(205, 6, -30);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    mid.y += 104;

    const C = 240;
    const pos = new Float32Array(C * 3);
    const t = new Float32Array(C);
    for (let i = 0; i < C; i++) {
      const u = i / (C - 1), iv = 1 - u;
      pos[i * 3]     = iv * iv * a.x + 2 * iv * u * mid.x + u * u * b.x;
      pos[i * 3 + 1] = iv * iv * a.y + 2 * iv * u * mid.y + u * u * b.y;
      pos[i * 3 + 2] = iv * iv * a.z + 2 * iv * u * mid.z + u * u * b.z;
      t[i] = u;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aT', new THREE.BufferAttribute(t, 1));

    bridge = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uGain: { value: 0 }, uPR: { value: 1 }, uFlow: { value: 0 } },
      vertexShader: `
        attribute float aT;
        uniform float uPR;
        varying float vT;
        varying float vFog;
        void main() {
          vT = aT;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vFog = clamp(1.0 - (-mv.z - 30.0) / 580.0, 0.0, 1.0);
          gl_PointSize = clamp(2.6 * uPR * (300.0 / max(1.0, -mv.z)), 1.0, 10.0 * uPR);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform float uGain;
        uniform float uFlow;
        varying float vT;
        varying float vFog;
        void main() {
          vec2 p = gl_PointCoord * 2.0 - 1.0;
          float r = dot(p, p);
          if (r > 1.0) discard;
          float base = exp(-r * 4.5) * 0.17;
          float packet = 0.0;
          for (int i = 0; i < 3; i++) {
            float ph = fract(uTime * (0.10 + float(i) * 0.05) + float(i) * 0.37);
            float d = abs(vT - ph); d = min(d, 1.0 - d);
            packet += exp(-d * d * 800.0) * (1.0 + uFlow * 2.2);
          }
          float a = (base + packet * 0.55) * vFog * uGain;
          if (a < 0.003) discard;
          gl_FragColor = vec4(vec3(1.0), a);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    bridge.frustumCulled = false;
    scene.add(bridge);
  }

  function buildSelRig() {
    selRig = new THREE.Group();
    selRig.visible = false;

    const ringGeo = (r, seg) => {
      const p = new Float32Array((seg + 1) * 3);
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * Math.PI * 2;
        p[i * 3] = Math.cos(a) * r; p[i * 3 + 1] = Math.sin(a) * r;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(p, 3));
      return g;
    };
    const mat = o => new THREE.LineBasicMaterial({
      color: 0xffffff, transparent: true, opacity: o, depthTest: false, depthWrite: false
    });

    selRig.add(new THREE.Line(ringGeo(5.4, 72), mat(0.85)));
    const outer = new THREE.Line(ringGeo(8.8, 72), mat(0.24));
    selRig.add(outer);
    selRig.userData.outer = outer;

    const br = [];
    const R = 12, gap = 3.6;
    for (let q = 0; q < 4; q++) {
      const a0 = q * Math.PI / 2 + Math.PI / 4 - gap / R;
      const a1 = q * Math.PI / 2 + Math.PI / 4 + gap / R;
      br.push(Math.cos(a0) * R, Math.sin(a0) * R, 0, Math.cos(a1) * R, Math.sin(a1) * R, 0);
    }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(br), 3));
    selRig.add(new THREE.LineSegments(bg, mat(0.65)));

    selRig.renderOrder = 50;
    scene.add(selRig);
  }

  function makeRT(w, h) {
    return new THREE.WebGLRenderTarget(Math.max(2, w), Math.max(2, h), {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat, type: THREE.UnsignedByteType,
      depthBuffer: true, stencilBuffer: false
    });
  }

  function buildPost() {
    quadScene = new THREE.Scene();
    quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    quadMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
    quadMesh.frustumCulled = false;
    quadScene.add(quadMesh);

    const mk = (fs, uniforms) => new THREE.ShaderMaterial({
      uniforms: uniforms, vertexShader: QUAD_VS, fragmentShader: fs,
      depthTest: false, depthWrite: false
    });

    passMat.trail = mk(FS_TRAIL, { tNew: { value: null }, tOld: { value: null }, uDecay: { value: 0.84 } });
    passMat.bright = mk(FS_BRIGHT, { tSrc: { value: null }, uCut: { value: 0.26 } });
    passMat.blur = mk(FS_BLUR, { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } });
    passMat.final = mk(FS_FINAL, { tBase: { value: null }, tBloom: { value: null }, uBloom: { value: 1.05 }, uFloor: { value: 1 } });
  }

  function pass(mat, target) {
    quadMesh.material = mat;
    renderer.setRenderTarget(target || null);
    renderer.render(quadScene, quadCam);
  }

  function resize() {
    if (!renderer) return;
    const r = canvas.getBoundingClientRect();
    W = Math.max(2, Math.round(r.width));
    H = Math.max(2, Math.round(r.height));
    PR = Math.min(window.devicePixelRatio || 1, quality.pr, W * H > 2400000 ? 1.15 : 1.5);

    renderer.setPixelRatio(PR);
    renderer.setSize(W, H, false);
    cam.aspect = W / H;
    cam.updateProjectionMatrix();
    if (liveCam && liveCam !== cam) {
      liveCam.aspect = W / H;
      liveCam.updateProjectionMatrix();
    }

    const fw = Math.round(W * PR), fh = Math.round(H * PR);
    const hw = Math.max(2, Math.round(fw / 2)), hh = Math.max(2, Math.round(fh / 2));
    [rtScene, accumA, accumB].forEach(rt => rt && rt.setSize(fw, fh));
    [brightA, brightB].forEach(rt => rt && rt.setSize(hw, hh));

    nodePts.material.uniforms.uPR.value = PR;
    dust.material.uniforms.uPR.value = PR;
    bridge.material.uniforms.uPR.value = PR;
    bus.emit('gl-resize', { w: W, h: H, pr: PR });
  }

  const MODE_GAINS = {
    lattice: { link: 1.00, loose: 0.16, cross: 1.20, priv: 0.46, A: 1.00, B: 0.92, looseN: 1.00, depth: 0, stage: 0, bridge: 0.16, grid: 1.00, pulse: 1.0 },
    loose:   { link: 0.16, loose: 1.55, cross: 0.18, priv: 0.34, A: 0.52, B: 0.46, looseN: 2.60, depth: 0, stage: 0, bridge: 0.05, grid: 0.70, pulse: 0.4 },
    stage:   { link: 0.34, loose: 0.08, cross: 0.50, priv: 0.60, A: 1.25, B: 1.05, looseN: 1.00, depth: 0, stage: 1, bridge: 0.09, grid: 0.55, pulse: 0.7 },
    arche:   { link: 0.22, loose: 0.06, cross: 2.20, priv: 0.26, A: 0.44, B: 1.70, looseN: 1.00, depth: 0, stage: 0, bridge: 1.60, grid: 0.45, pulse: 1.4 },
    depth:   { link: 0.52, loose: 0.10, cross: 0.65, priv: 0.62, A: 1.00, B: 1.00, looseN: 1.00, depth: 1, stage: 0, bridge: 0.11, grid: 1.30, pulse: 0.8 }
  };
  const gains = Object.assign({}, MODE_GAINS.lattice);
  let sealGain = 0.30;

  const quality = { pr: 1.5, level: 0, slow: 0 };

  function degrade(fps, dt) {
    if (!ready) return;
    if (fps > 40 || state.phase !== 'station') { quality.slow = Math.max(0, quality.slow - dt); return; }
    quality.slow += dt;
    if (quality.slow < 4) return;
    quality.slow = 0;
    if (quality.level >= 3) return;
    quality.level++;
    if (quality.level === 1) { state.optics.haze = false; state.optics.dust = false; }
    else if (quality.level === 2) { quality.pr = 1; resize(); }
    else { state.optics.trails = false; }
    bus.emit('degraded', quality.level);
  }

  function applyMode(dt) {
    const g = MODE_GAINS[state.mode] || MODE_GAINS.lattice;
    for (const k in g) gains[k] = damp(gains[k], g[k], 5.0, dt);

    const wantSeal = state.peer === 'open' ? 1.0 : (state.peer === 'linking' ? 0.62 : 0.26);
    sealGain = damp(sealGain, wantSeal, 2.2, dt);

    const nu = nodePts.material.uniforms, eu = edgeLines.material.uniforms;
    nu.uGainPriv.value = gains.priv;
    nu.uGainA.value = gains.A;
    nu.uGainB.value = gains.B;
    nu.uGainLoose.value = gains.looseN;
    nu.uDepthMode.value = gains.depth;
    nu.uStageMode.value = gains.stage;
    nu.uSealed.value = sealGain;
    eu.uLink.value = gains.link;
    eu.uLoose.value = gains.loose;
    eu.uCross.value = gains.cross;
    eu.uPulse.value = gains.pulse;
    eu.uSealed.value = sealGain;
    bridge.material.uniforms.uGain.value = gains.bridge;
    bridge.material.uniforms.uFlow.value = state.peer === 'linking' ? 1 : 0;
    grid.material.uniforms.uGain.value = gains.grid * (state.optics.grid ? 1 : 0);
  }

  let dimDirty = true;
  function markDirty() { dimDirty = true; }

  function wantDim(i) {
    const nd = data.nodes[i];
    if (state.off.has(nd.domain)) return 1;
    if (state.favOnly && !state.favourites.has(nd.slug)) return 1;
    if (state.matches && !state.matches.has(i)) return 1;
    if (state.isolated != null) {
      const k = data.nodes[state.isolated];
      if (i !== state.isolated && k.links.indexOf(i) < 0 && k.loose.indexOf(i) < 0) return 1;
    }
    return 0;
  }

  function syncStates(dt) {
    const hov = state.hovered, sel = state.selected;
    for (let i = 0; i < N; i++) {
      const want = (i === sel ? 1 : 0) + (i === hov ? 0.7 : 0);
      nodeState[i] = damp(nodeState[i], Math.min(1.4, want), 12, dt);
      nodeDim[i] = damp(nodeDim[i], wantDim(i), 6.5, dt);
      nodeFav[i] = damp(nodeFav[i], state.favourites.has(data.nodes[i].slug) ? 1 : 0, 9, dt);
    }
    nodePts.geometry.attributes.aState.needsUpdate = true;
    nodePts.geometry.attributes.aDim.needsUpdate = true;
    nodePts.geometry.attributes.aFav.needsUpdate = true;

    if (dimDirty) {
      dimDirty = false;
      const dim = edgeLines._dim;
      const span = SEG * 2;
      data.edges.forEach((e, ei) => {
        const on = wantDim(e.a) === 0 && wantDim(e.b) === 0 ? 0 : 1;
        const base = ei * span;
        for (let k = 0; k < span; k++) dim[base + k] = on;
      });
      edgeLines.geometry.attributes.aDim.needsUpdate = true;
    }
  }

  let vecTmp = null;

  function project() {
    if (!vecTmp) vecTmp = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const nd = data.nodes[i];
      vecTmp.set(nd.x, nd.y, nd.z).project(cam);
      const x = (vecTmp.x * 0.5 + 0.5) * W;
      const y = (-vecTmp.y * 0.5 + 0.5) * H;
      screen[i * 3] = x;
      screen[i * 3 + 1] = y;
      screen[i * 3 + 2] = (vecTmp.z < 1 && x > -60 && x < W + 60 && y > -60 && y < H + 60
        && nodeDim[i] < 0.5) ? 1 : 0;
    }
  }

  function frame(rig, dt) {
    if (!ready) return;
    time += dt;

    cam.position.set(rig.pos.x, rig.pos.y, rig.pos.z);
    cam.up.set(0, 1, 0);
    cam.lookAt(rig.target.x, rig.target.y, rig.target.z);
    if (rig.roll) cam.rotateZ(rig.roll);
    if (Math.abs(cam.fov - rig.fov) > 0.01) { cam.fov = rig.fov; cam.updateProjectionMatrix(); }
    cam.updateMatrixWorld(true);
    cam.matrixWorldInverse.copy(cam.matrixWorld).invert();

    nodePts.material.uniforms.uTime.value = time;
    edgeLines.material.uniforms.uTime.value = time;
    dust.material.uniforms.uTime.value = time;
    bridge.material.uniforms.uTime.value = time;

    dust.visible = state.optics.dust;
    hazeGroup.visible = state.optics.haze;

    if (hazeGroup.visible) {
      const dx = rig.target.x - rig.pos.x, dy = rig.target.y - rig.pos.y, dz = rig.target.z - rig.pos.z;
      const m = Math.hypot(dx, dy, dz) || 1;
      for (let i = 0; i < hazeGroup.children.length; i++) {
        const p = hazeGroup.children[i], d = p.userData.depth;
        p.position.set(rig.pos.x + dx / m * d, rig.pos.y + dy / m * d - 10, rig.pos.z + dz / m * d);
        p.quaternion.copy(cam.quaternion);
        p.material.uniforms.uTime.value = time;
      }
    }

    applyMode(dt);
    syncStates(dt);

    if (state.selected != null) {
      const nd = data.nodes[state.selected];
      selRig.visible = true;
      selRig.position.set(nd.x, nd.y, nd.z);
      selRig.quaternion.copy(cam.quaternion);
      const d = Math.hypot(rig.pos.x - nd.x, rig.pos.y - nd.y, rig.pos.z - nd.z);
      selRig.scale.setScalar(clamp(d / 120, 0.42, 2.4));
      selRig.userData.outer.rotation.z = time * 0.5;
    } else {
      selRig.visible = false;
    }

    project();
    render(dt);
  }

  function render(dt) {
    const src0 = liveScene || scene;
    const c0 = liveCam || cam;

    renderer.setRenderTarget(rtScene);
    renderer.clear(true, true, false);
    renderer.render(src0, c0);

    let src = rtScene;

    if (state.optics.trails) {
      passMat.trail.uniforms.tNew.value = rtScene.texture;
      passMat.trail.uniforms.tOld.value = accumA.texture;

      const tau = state.phase === 'intro' ? 0.045 : 0.105;
      passMat.trail.uniforms.uDecay.value = clamp(Math.exp(-dt / tau), 0, 0.88);
      pass(passMat.trail, accumB);
      const t = accumA; accumA = accumB; accumB = t;
      src = accumA;
    }

    const breath = breathValue(dt);

    if (state.optics.bloom) {
      passMat.bright.uniforms.tSrc.value = src.texture;
      pass(passMat.bright, brightA);
      const w = brightA.width, h = brightA.height;
      for (let i = 0; i < 2; i++) {
        const k = 1 + i * 1.8;
        passMat.blur.uniforms.tSrc.value = brightA.texture;
        passMat.blur.uniforms.uDir.value.set(k / w, 0);
        pass(passMat.blur, brightB);
        passMat.blur.uniforms.tSrc.value = brightB.texture;
        passMat.blur.uniforms.uDir.value.set(0, k / h);
        pass(passMat.blur, brightA);
      }
      passMat.final.uniforms.tBloom.value = brightA.texture;
      passMat.final.uniforms.uBloom.value = 1.05 + breath * 0.85;
    } else {
      passMat.final.uniforms.tBloom.value = rtScene.texture;
      passMat.final.uniforms.uBloom.value = 0;
    }

    passMat.final.uniforms.tBase.value = src.texture;
    pass(passMat.final, null);
  }

  function renderThrough(s, c, dt) {
    if (!ready) return;
    liveScene = s; liveCam = c;
    render(dt);
    liveScene = null; liveCam = null;
  }

  function pickAt(x, y, radius) {
    const R = radius || 22;
    let best = -1, bestD = R * R;
    for (let i = 0; i < N; i++) {
      if (screen[i * 3 + 2] < 0.5) continue;
      const dx = screen[i * 3] - x, dy = screen[i * 3 + 1] - y;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = i; }
    }
    return best < 0 ? null : best;
  }

  async function init(cv) {
    canvas = cv;
    N = data.nodes.length;
    nodeState = new Float32Array(N);
    nodeDim = new Float32Array(N);
    nodeFav = new Float32Array(N);
    screen = new Float32Array(N * 3);
    try { THREE = await loadThree(); }
    catch (err) { failed = true; bus.emit('gl-failed', err); return false; }

    try {
      renderer = new THREE.WebGLRenderer({
        canvas: cv, antialias: false, alpha: true, premultipliedAlpha: true,
        powerPreference: 'high-performance', stencil: false
      });
    } catch (err) { failed = true; bus.emit('gl-failed', err); return false; }

    cv.addEventListener('webglcontextlost', e => {
      e.preventDefault();
      bus.emit('gl-lost');
    });

    if (THREE.LinearSRGBColorSpace && 'outputColorSpace' in renderer) {
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    } else if (THREE.LinearEncoding !== undefined) {
      renderer.outputEncoding = THREE.LinearEncoding;
    }
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();
    cam = new THREE.PerspectiveCamera(46, 1, 0.8, 1500);

    buildHaze(); buildGrid(); buildDust();
    buildEdges(); buildBridge(); buildNodes(); buildSelRig();
    buildPost();

    rtScene = makeRT(2, 2); accumA = makeRT(2, 2); accumB = makeRT(2, 2);
    brightA = makeRT(2, 2); brightB = makeRT(2, 2);
    [accumA, accumB, brightA, brightB, rtScene].forEach(rt => {
      renderer.setRenderTarget(rt);
      renderer.clear(true, true, true);
    });
    renderer.setRenderTarget(null);

    ready = true;
    resize();
    window.addEventListener('resize', resize, { passive: true });
    return true;
  }

  return {
    init, frame, resize, pickAt, markDirty, renderThrough, degrade,
    setFloor(v) { if (passMat.final) passMat.final.uniforms.uFloor.value = v; },
    get three() { return THREE; },
    get renderer() { return renderer; },
    get ready() { return ready; },
    get failed() { return failed; },
    screenOf(i) { return { x: screen[i * 3], y: screen[i * 3 + 1], on: screen[i * 3 + 2] > 0.5 }; },
    worldOf(i) { const n = data.nodes[i]; return { x: n.x, y: n.y, z: n.z }; },
    get size() { return { w: W, h: H, pr: PR }; }
  };
})();
