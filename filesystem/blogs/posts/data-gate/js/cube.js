import * as THREE from '/assets/js/vendor/three/three.module.min.js';
import { pageScale } from '/assets/js/page-scale.js';

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DATA_URL = new URL('../data/koi-latent.json', import.meta.url);
const DISPOSITIONS = ['confirmado', 'candidato', 'falso positivo'];
const HIGHLIGHT = /^Kepler-90 [b-i]$/;

let dataPromise;
const loadLatent = () => (dataPromise ??= fetch(DATA_URL, { credentials: 'omit' }).then((res) => {
  if (!res.ok) throw new Error(`latent ${res.status}`);
  return res.json();
}).then((data) => {
  const valid = data && data.version === 2 && data.stride === 8 && Array.isArray(data.points) && data.points.length === data.count * 8;
  if (!valid) throw new Error('latent format');
  return data;
}));

const POINT_VERT = `
  attribute float aDisp;
  attribute float aRare;
  attribute float aSize;
  attribute float aDelay;
  attribute vec3 aSeed;
  uniform float uTime;
  uniform float uReveal;
  uniform float uPixel;
  uniform float uScan;
  uniform float uRareMode;
  uniform vec3 uShow;
  uniform vec3 uC0;
  uniform vec3 uC1;
  uniform vec3 uC2;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vHot;

  void main() {
    float show = aDisp < 0.5 ? uShow.x : (aDisp < 1.5 ? uShow.y : uShow.z);
    float t = clamp((uReveal - aDelay) / 0.55, 0.0, 1.0);
    float e = 1.0 - pow(1.0 - t, 4.0);
    vec3 drift = sin(uTime * 0.35 + aSeed * 6.2831) * 0.012;
    vec3 p = mix(aSeed * 3.4, position, e) + drift;

    vec3 base = aDisp < 0.5 ? uC0 : (aDisp < 1.5 ? uC1 : uC2);
    vec3 rare = mix(vec3(0.16, 0.24, 0.40), vec3(1.0, 0.97, 0.89), smoothstep(0.55, 1.0, aRare));
    vColor = mix(base, rare, uRareMode);

    float scan = exp(-pow((p.y - uScan) * 9.0, 2.0));
    vHot = scan;
    vAlpha = show * e * (0.55 + 0.45 * sin(uTime * 1.3 + aSeed.x * 40.0) * 0.5 + 0.45) + scan * 0.6;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float grow = 1.0 + scan * 1.6 + uRareMode * smoothstep(0.9, 1.0, aRare) * 1.2;
    gl_PointSize = step(0.01, show) * aSize * grow * uPixel / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const POINT_FRAG = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vHot;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float core = smoothstep(0.16, 0.0, d);
    float halo = smoothstep(0.5, 0.0, d);
    vec3 color = mix(vColor, vec3(1.0), vHot * 0.7 + core * 0.35);
    gl_FragColor = vec4(color, (core * 0.9 + halo * halo * 0.35) * vAlpha);
  }
`;

const PANEL_VERT = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const PANEL_FRAG = `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uScan;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 grid = vUv * 96.0;
    vec2 id = floor(grid);
    float dotMask = smoothstep(0.45, 0.12, length(fract(grid) - 0.5));
    float flow = sin(id.y * 0.17 - uTime * 0.9 + sin(id.x * 0.07 + uTime * 0.25) * 3.0) * 0.5 + 0.5;
    float rain = step(0.93, hash(vec2(id.x, floor(uTime * 2.0 - id.y * 0.08 + id.x * 1.7))));
    float fresnel = pow(1.0 - abs(dot(vNormal, vView)), 2.2);
    float edge = max(smoothstep(0.02, 0.0, min(vUv.x, 1.0 - vUv.x)), smoothstep(0.02, 0.0, min(vUv.y, 1.0 - vUv.y)));
    float scanline = exp(-pow((vUv.y * 2.0 - 1.0 - uScan) * 22.0, 2.0));
    float lit = dotMask * (flow * flow * 0.35 + rain * 0.5) + fresnel * 0.35 + edge * 0.25 + scanline * 0.5;
    gl_FragColor = vec4(vec3(0.73, 0.84, 0.97), lit * uOpacity);
  }
`;

const DUST_VERT = `
  uniform float uTime;
  uniform float uPixel;
  attribute float aPhase;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.y += mod(uTime * 0.02 + aPhase * 4.0, 4.0) - 2.0;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vAlpha = 0.25 + 0.25 * sin(uTime * 0.8 + aPhase * 30.0);
    gl_PointSize = (4.0 + aPhase * 6.0) * uPixel / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const DUST_FRAG = `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    gl_FragColor = vec4(vec3(0.81, 0.88, 0.99), smoothstep(0.5, 0.0, d) * vAlpha);
  }
`;

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cornerBrackets(size, length) {
  const h = size / 2;
  const vertices = [];
  for (const x of [-h, h]) {
    for (const y of [-h, h]) {
      for (const z of [-h, h]) {
        vertices.push(x, y, z, x - Math.sign(x) * length, y, z);
        vertices.push(x, y, z, x, y - Math.sign(y) * length, z);
        vertices.push(x, y, z, x, y, z - Math.sign(z) * length);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  return geometry;
}

function tickRing(radius, count, length) {
  const vertices = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const l = i % 10 === 0 ? length * 2.5 : length;
    vertices.push(Math.cos(a) * radius, 0, Math.sin(a) * radius, Math.cos(a) * (radius + l), 0, Math.sin(a) * (radius + l));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  return geometry;
}

class DataCube {
  constructor(host, data) {
    this.host = host;
    this.data = data;
    this.explore = host.dataset.mode === 'explore';
    this.active = false;
    this.visible = false;
    this.frame = 0;
    this.elapsed = 0;
    this.last = performance.now();
    this.showTarget = new THREE.Vector3(1, 1, 1);
    this.rareTarget = 0;
    this.rotation = { x: 0.38, y: 0.7, velocity: 0 };
    this.pointer = { x: 0.5, y: 0.5, px: 0, py: 0, inside: false, dirty: false };

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    host.prepend(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.buildPoints();
    this.buildShell();
    if (!this.explore) this.buildDust();
    this.buildHighlights();

    this.loop = this.loop.bind(this);
    this.resize = this.resize.bind(this);
    new ResizeObserver(this.resize).observe(host);
    this.resize();

    new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.setActive(this.visible && !document.hidden);
    }).observe(host);
    document.addEventListener('visibilitychange', () => this.setActive(this.visible && !document.hidden));

    if (this.explore) this.bindExplore();
    else this.bindParallax();
    if (still) this.uniforms.uReveal.value = 2;
    this.draw();
  }

  buildPoints() {
    const { points, count } = this.data;
    const random = mulberry32(90);
    const position = new Float32Array(count * 3);
    const seed = new Float32Array(count * 3);
    const disp = new Float32Array(count);
    const rare = new Float32Array(count);
    const size = new Float32Array(count);
    const delay = new Float32Array(count);
    const base = this.explore ? 30 : 34;

    for (let i = 0; i < count; i++) {
      const o = i * 8;
      position[i * 3] = points[o];
      position[i * 3 + 1] = points[o + 1];
      position[i * 3 + 2] = points[o + 2];
      disp[i] = points[o + 3];
      const radius = points[o + 4] > 0 ? points[o + 4] : 1;
      size[i] = base * (0.45 + Math.min(1.3, Math.log10(radius + 1) * 0.85));
      rare[i] = points[o + 7];
      const u = random() * 2 - 1;
      const theta = random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      seed[i * 3] = r * Math.cos(theta);
      seed[i * 3 + 1] = u;
      seed[i * 3 + 2] = r * Math.sin(theta);
      delay[i] = Math.hypot(points[o], points[o + 1], points[o + 2]) * 0.6 + random() * 0.25;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
    geometry.setAttribute('aDisp', new THREE.BufferAttribute(disp, 1));
    geometry.setAttribute('aRare', new THREE.BufferAttribute(rare, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geometry.setAttribute('aDelay', new THREE.BufferAttribute(delay, 1));

    this.uniforms = {
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uPixel: { value: 1 },
      uScan: { value: -2 },
      uRareMode: { value: 0 },
      uShow: { value: new THREE.Vector3(1, 1, 1) },
      uC0: { value: new THREE.Color('#f6efe3') },
      uC1: { value: new THREE.Color('#b9d6f8') },
      uC2: { value: new THREE.Color('#55647c') }
    };

    this.position = position;
    this.disp = disp;
    this.group.add(new THREE.Points(geometry, new THREE.ShaderMaterial({
      vertexShader: POINT_VERT,
      fragmentShader: POINT_FRAG,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })));
  }

  buildShell() {
    const line = (opacity) => new THREE.LineBasicMaterial({ color: 0xcee4ff, transparent: true, opacity, depthWrite: false });
    this.group.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2, 2, 2)), line(0.22)));
    this.group.add(new THREE.LineSegments(cornerBrackets(2.16, 0.26), line(0.95)));

    this.core = new THREE.Group();
    this.core.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.3, 0.3, 0.3)), line(0.6)));
    this.core.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.24)), line(0.35)));
    this.group.add(this.core);

    this.panelUniforms = { uTime: { value: 0 }, uScan: { value: -2 }, uOpacity: { value: this.explore ? 0.1 : 0.2 } };
    this.group.add(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.ShaderMaterial({
      vertexShader: PANEL_VERT,
      fragmentShader: PANEL_FRAG,
      uniforms: this.panelUniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    })));

    this.rings = new THREE.Group();
    const ringA = new THREE.LineSegments(tickRing(1.75, 120, 0.04), line(0.35));
    const ringB = new THREE.LineSegments(tickRing(1.95, 60, 0.03), line(0.18));
    ringB.rotation.x = 0.35;
    this.rings.add(ringA, ringB);
    this.rings.visible = !this.explore;
    this.scene.add(this.rings);
  }

  buildDust() {
    const random = mulberry32(7);
    const count = 700;
    const position = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      position[i * 3] = (random() * 2 - 1) * 3.2;
      position[i * 3 + 1] = (random() * 2 - 1) * 2;
      position[i * 3 + 2] = (random() * 2 - 1) * 3.2;
      phase[i] = random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    this.dustUniforms = { uTime: { value: 0 }, uPixel: { value: 1 } };
    this.scene.add(new THREE.Points(geometry, new THREE.ShaderMaterial({
      vertexShader: DUST_VERT,
      fragmentShader: DUST_FRAG,
      uniforms: this.dustUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })));
  }

  buildHighlights() {
    const marks = Object.entries(this.data.names).filter(([, name]) => HIGHLIGHT.test(name)).map(([index]) => Number(index));
    if (marks.length < 2) return;
    const vertices = [];
    const center = new THREE.Vector3();
    marks.forEach((i) => center.add(new THREE.Vector3(this.position[i * 3], this.position[i * 3 + 1], this.position[i * 3 + 2])));
    center.divideScalar(marks.length);
    for (const i of marks) vertices.push(center.x, center.y, center.z, this.position[i * 3], this.position[i * 3 + 1], this.position[i * 3 + 2]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    this.constellation = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xb9d6f8, transparent: true, opacity: 0, depthWrite: false }));
    this.group.add(this.constellation);
  }

  resize() {
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(devicePixelRatio || 1, 1.75) * pageScale();
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    const distance = this.explore ? 6.6 : 7.4;
    this.camera.position.set(0, 0, this.camera.aspect < 1 ? distance / Math.max(0.6, this.camera.aspect) : distance);
    this.camera.updateProjectionMatrix();
    const pixel = (ratio * Math.min(width, height)) / 560;
    this.uniforms.uPixel.value = pixel;
    if (this.dustUniforms) this.dustUniforms.uPixel.value = pixel;
    this.draw();
  }

  setActive(next) {
    if (next === this.active) return;
    this.active = next;
    if (next) {
      this.last = performance.now();
      this.frame = requestAnimationFrame(this.loop);
    } else {
      cancelAnimationFrame(this.frame);
    }
  }

  bindParallax() {
    if (still || !matchMedia('(hover: hover)').matches) return;
    addEventListener('pointermove', (e) => {
      this.pointer.px = e.clientX / innerWidth - 0.5;
      this.pointer.py = e.clientY / innerHeight - 0.5;
    }, { passive: true });
  }

  bindExplore() {
    const canvas = this.renderer.domElement;
    const figure = this.host.closest('.dg-figure');
    this.tip = this.host.querySelector('[data-role="tip"]');
    this.readout = figure.querySelector('[data-role="readout"]');
    let drag = null;

    canvas.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
      this.host.classList.add('is-dragging');
    });
    canvas.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.pointer.x = (e.clientX - rect.left) / rect.width;
      this.pointer.y = (e.clientY - rect.top) / rect.height;
      this.pointer.inside = true;
      this.pointer.dirty = true;
      if (!drag) return;
      const dx = (e.clientX - drag.x) / rect.width;
      const dy = (e.clientY - drag.y) / rect.height;
      this.rotation.y += dx * 3.2;
      this.rotation.x = THREE.MathUtils.clamp(this.rotation.x + dy * 3.2, -1.3, 1.3);
      this.rotation.velocity = dx * 190;
      drag.x = e.clientX;
      drag.y = e.clientY;
      if (!this.active) this.draw();
    });
    const release = () => {
      drag = null;
      this.host.classList.remove('is-dragging');
    };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('pointerleave', () => {
      this.pointer.inside = false;
      this.tip.hidden = true;
    });

    figure.querySelectorAll('[data-disp]').forEach((button) => {
      button.addEventListener('click', () => {
        const on = button.getAttribute('aria-pressed') !== 'true';
        button.setAttribute('aria-pressed', String(on));
        this.showTarget.setComponent(Number(button.dataset.disp), on ? 1 : 0);
        this.updateReadout();
      });
    });
    figure.querySelector('[data-rare-mode]')?.addEventListener('click', (e) => {
      const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
      e.currentTarget.setAttribute('aria-pressed', String(on));
      this.rareTarget = on ? 1 : 0;
    });
    this.updateReadout();
  }

  updateReadout() {
    if (!this.readout) return;
    const counts = [0, 0, 0];
    for (let i = 0; i < this.disp.length; i++) counts[this.disp[i]]++;
    const visible = counts.reduce((sum, n, i) => sum + (this.showTarget.getComponent(i) > 0.5 ? n : 0), 0);
    this.readout.textContent = `${visible} puntos visibles · ${counts[0]} confirmados · ${counts[1]} candidatos · ${counts[2]} falsos positivos`;
  }

  pick() {
    this.pointer.dirty = false;
    if (!this.pointer.inside) return;
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    const px = this.pointer.x * width;
    const py = this.pointer.y * height;
    this.group.updateMatrixWorld();
    const e = new THREE.Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse).multiply(this.group.matrixWorld).elements;
    let best = -1;
    let bestDist = 144;

    for (let i = 0; i < this.disp.length; i++) {
      if (this.showTarget.getComponent(this.disp[i]) < 0.5) continue;
      const x = this.position[i * 3];
      const y = this.position[i * 3 + 1];
      const z = this.position[i * 3 + 2];
      const w = e[3] * x + e[7] * y + e[11] * z + e[15];
      const sx = ((e[0] * x + e[4] * y + e[8] * z + e[12]) / w * 0.5 + 0.5) * width;
      const sy = (0.5 - (e[1] * x + e[5] * y + e[9] * z + e[13]) / w * 0.5) * height;
      const d = (sx - px) ** 2 + (sy - py) ** 2;
      if (d < bestDist) {
        best = i;
        bestDist = d;
      }
    }

    if (best < 0) {
      this.tip.hidden = true;
      return;
    }
    const p = this.data.points;
    const o = best * 8;
    const known = (value, unit) => (value >= 0 ? `${value} ${unit}` : 'sin dato');
    const title = document.createElement('b');
    title.textContent = this.data.names[best] || 'objeto sin nombre';
    const lines = [
      DISPOSITIONS[p[o + 3]],
      `radio ${known(p[o + 4], 'veces la Tierra')}`,
      `temperatura ${known(p[o + 5], 'K')}`,
      `año ${known(p[o + 6], 'días')}`,
      `rareza ${Math.round(p[o + 7] * 100)}%`
    ];
    this.tip.replaceChildren(title, ...lines.flatMap((text, k) => (k ? [document.createElement('br'), text] : [text])));
    this.tip.style.left = `${px}px`;
    this.tip.style.top = `${py}px`;
    this.tip.classList.toggle('is-flipped', this.pointer.x > 0.6);
    this.tip.hidden = false;
  }

  loop(now) {
    if (!this.active) return;
    this.frame = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;

    if (!still) {
      this.elapsed += dt;
      const t = this.elapsed;
      this.uniforms.uTime.value = t;
      this.panelUniforms.uTime.value = t;
      if (this.dustUniforms) this.dustUniforms.uTime.value = t;
      this.uniforms.uReveal.value = Math.min(2, this.uniforms.uReveal.value + dt * 0.55);
      const scan = ((t * 0.28) % 1.6) * 2 - 1.3;
      this.uniforms.uScan.value = scan;
      this.panelUniforms.uScan.value = scan;
      this.core.rotation.set(t * 0.5, t * 0.7, 0);
      this.rings.rotation.y = -t * 0.08;
      if (this.explore) {
        this.rotation.velocity *= 0.93;
        this.rotation.y += (this.rotation.velocity + 0.06) * dt;
      } else {
        this.rotation.y += 0.11 * dt;
      }
      if (this.constellation) {
        const target = this.uniforms.uReveal.value > 1.4 ? 0.55 : 0;
        this.constellation.material.opacity += (target - this.constellation.material.opacity) * 0.03;
      }
    }

    this.uniforms.uShow.value.lerp(this.showTarget, still ? 1 : 0.12);
    this.uniforms.uRareMode.value += (this.rareTarget - this.uniforms.uRareMode.value) * (still ? 1 : 0.08);
    this.draw();
    if (this.explore && this.pointer.dirty) this.pick();
  }

  draw() {
    const tilt = this.explore ? 0 : this.pointer.py * 0.25;
    const turn = this.explore ? 0 : this.pointer.px * 0.35;
    this.group.rotation.set(this.rotation.x + tilt, this.rotation.y + turn, 0);
    this.rings.rotation.x = 0.2 + tilt * 0.5;
    this.renderer.render(this.scene, this.camera);
  }
}

export async function mount(host) {
  const data = await loadLatent();
  return new DataCube(host, data);
}
