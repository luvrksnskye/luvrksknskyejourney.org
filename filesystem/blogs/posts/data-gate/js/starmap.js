import * as THREE from '/assets/js/vendor/three/three.module.min.js';
import { pageScale } from '/assets/js/page-scale.js';

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DATA_URL = new URL('../data/kepler-field.json', import.meta.url);

const LENGTH = 3.2;
const APERTURE = 2.4;
const REFERENCE_LY = 8000;
const MAX_REACH = 1.45;
const SKY = 1;
const DURATION = 3.4;
const FOV = 40;
const RINGS = [1000, 3000, 8000];
const EDGES = 12;
const RIPPLES = 7;
const STRANDS = 3;
const TURNS = 7;
const BLOOM_LEVELS = 3;

const STAR_VERT = `
  attribute vec3 aSky;
  attribute float aTemp;
  attribute float aSize;
  attribute float aDelay;
  attribute float aSeed;
  uniform float uProgress;
  uniform float uTime;
  uniform float uPixel;
  uniform float uReach;
  uniform float uHeat;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vHeat;

  vec3 temperature(float kelvin) {
    float colder = clamp((5780.0 - kelvin) / 1380.0, 0.0, 1.0);
    float hotter = clamp((kelvin - 5780.0) / 1020.0, 0.0, 1.0);
    vec3 color = vec3(1.0, 0.86, 0.6);
    color = mix(color, vec3(1.0, 0.42, 0.12), pow(colder, 0.55));
    color = mix(color, vec3(0.3, 0.56, 1.0), pow(hotter, 0.55));
    return color;
  }

  vec3 blackbody(float kelvin) {
    float t = clamp((kelvin - 3200.0) / 4200.0, 0.0, 1.0);
    vec3 cool = vec3(1.0, 0.72, 0.45);
    vec3 mid = vec3(1.0, 0.94, 0.84);
    vec3 hot = vec3(0.74, 0.84, 1.0);
    return t < 0.5 ? mix(cool, mid, t * 2.0) : mix(mid, hot, (t - 0.5) * 2.0);
  }

  void main() {
    float local = clamp(uProgress * 1.6 - aDelay * 0.6, 0.0, 1.0);
    float eased = local * local * local * (local * (local * 6.0 - 15.0) + 10.0);
    vec3 p = mix(aSky, position, eased);
    p.yz += vec2(sin(uTime * 0.4 + aSeed * 6.2831), cos(uTime * 0.33 + aSeed * 6.2831)) * 0.004;

    float along = clamp(position.x / uReach, 0.0, 1.0);
    float pulse = pow(smoothstep(0.88, 1.0, fract(along * 1.3 + uTime * 0.07)), 2.0) * eased;
    float twinkle = 0.82 + 0.18 * sin(uTime * 1.7 + aSeed * 40.0);

    vHeat = uHeat;
    vColor = mix(mix(blackbody(aTemp), temperature(aTemp), uHeat), vec3(1.0), pulse * mix(0.55, 0.25, uHeat));
    vAlpha = mix(0.6, 1.0, eased) * (0.5 + 0.5 * (1.0 - along * 0.6 * eased)) * twinkle * mix(1.0, 0.72, uHeat) + pulse * mix(0.9, 0.5, uHeat);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float grow = mix(0.42, 1.0, eased);
    gl_PointSize = min(aSize * grow * uPixel / max(0.2, -mv.z), uPixel * 26.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const STAR_FRAG = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vHeat;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float core = smoothstep(0.18, 0.0, d);
    float halo = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(mix(vColor, vec3(1.0), core * mix(0.5, 0.18, vHeat)), (core * 0.85 + halo * halo * 0.4) * vAlpha);
  }
`;

const LINE_VERT = `
  attribute float aT;
  varying float vT;

  void main() {
    vT = aT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const LINE_FRAG = `
  uniform vec3 uColor;
  uniform float uDraw;
  uniform float uOpacity;
  uniform float uGlow;
  varying float vT;

  void main() {
    float drawn = 1.0 - smoothstep(uDraw - 0.006, uDraw, vT);
    float moving = step(0.001, uDraw) * (1.0 - step(0.999, uDraw));
    float head = exp(-pow((vT - uDraw) * 55.0, 2.0)) * uGlow * moving;
    float alpha = drawn * uOpacity + head;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(mix(uColor, vec3(1.0), clamp(head, 0.0, 1.0)), alpha);
  }
`;

const RIPPLE_VERT = `
  attribute float aRing;
  attribute float aAngle;
  uniform float uTime;
  uniform float uReach;
  uniform float uRim;
  uniform float uCount;
  varying float vFade;

  void main() {
    float phase = fract(uTime * 0.045 + aRing / uCount);
    float x = phase * uReach;
    float radius = uRim * x;
    vFade = sin(phase * 3.14159265) * (0.6 + 0.4 * sin(aAngle * 3.0 + uTime * 0.6));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(x, cos(aAngle) * radius, sin(aAngle) * radius, 1.0);
  }
`;

const RIPPLE_FRAG = `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vFade;

  void main() {
    float alpha = vFade * uOpacity;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const HELIX_VERT = `
  attribute float aT;
  attribute float aStrand;
  uniform float uTime;
  uniform float uReach;
  uniform float uRim;
  uniform float uTurns;
  uniform float uStrands;
  varying float vT;

  void main() {
    float x = aT * uReach;
    float radius = uRim * x;
    float angle = aT * uTurns * 6.28318531 + aStrand * 6.28318531 / uStrands + uTime * 0.22;
    vT = aT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(x, cos(angle) * radius, sin(angle) * radius, 1.0);
  }
`;

const HELIX_FRAG = `
  uniform vec3 uColor;
  uniform float uDraw;
  uniform float uOpacity;
  varying float vT;

  void main() {
    float drawn = 1.0 - smoothstep(uDraw - 0.02, uDraw, vT);
    float head = exp(-pow((vT - uDraw) * 40.0, 2.0)) * step(0.001, uDraw) * (1.0 - step(0.999, uDraw));
    float alpha = drawn * uOpacity * (0.25 + 0.75 * sin(vT * 3.14159265)) + head * 0.6;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(mix(uColor, vec3(1.0), head), alpha);
  }
`;

const QUAD_VERT = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const BLUR_FRAG = `
  uniform sampler2D uSource;
  uniform vec2 uStep;
  varying vec2 vUv;

  void main() {
    vec4 color = texture2D(uSource, vUv) * 0.2270270270;
    color += texture2D(uSource, vUv + uStep * 1.3846153846) * 0.3162162162;
    color += texture2D(uSource, vUv - uStep * 1.3846153846) * 0.3162162162;
    color += texture2D(uSource, vUv + uStep * 3.2307692308) * 0.0702702703;
    color += texture2D(uSource, vUv - uStep * 3.2307692308) * 0.0702702703;
    gl_FragColor = color;
  }
`;

const COMPOSITE_FRAG = `
  uniform sampler2D uScene;
  uniform sampler2D uBloom0;
  uniform sampler2D uBloom1;
  uniform sampler2D uBloom2;
  uniform float uStrength;
  varying vec2 vUv;

  void main() {
    vec3 scene = texture2D(uScene, vUv).rgb;
    vec3 bloom = texture2D(uBloom0, vUv).rgb * 0.55 + texture2D(uBloom1, vUv).rgb * 0.8 + texture2D(uBloom2, vUv).rgb * 1.1;
    vec3 color = min(scene + bloom * uStrength, vec3(1.0));
    float alpha = max(max(color.r, color.g), color.b);
    gl_FragColor = vec4(color, alpha);
  }
`;

const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const mix = (a, b, t) => a + (b - a) * t;
const reachOf = (lightyears) => Math.min(MAX_REACH, Math.sqrt(lightyears / REFERENCE_LY));
const grouped = (value) => String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

function basis(axis) {
  const up = Math.abs(axis.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3().crossVectors(axis, up).normalize();
  const lift = new THREE.Vector3().crossVectors(side, axis).normalize();
  return { side, lift };
}

function lineGeometry(positions, progress) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aT', new THREE.Float32BufferAttribute(progress, 1));
  return geometry;
}

function lineMaterial(color, opacity, glow) {
  return new THREE.ShaderMaterial({
    vertexShader: LINE_VERT,
    fragmentShader: LINE_FRAG,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uDraw: { value: 0 },
      uOpacity: { value: opacity },
      uGlow: { value: glow }
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
}

function buildEdges(rim, reach) {
  const positions = [];
  const progress = [];
  for (let i = 0; i < EDGES; i++) {
    const angle = (i / EDGES) * Math.PI * 2;
    positions.push(0, 0, 0, reach, Math.cos(angle) * rim * reach, Math.sin(angle) * rim * reach);
    progress.push(0, 1);
  }
  return lineGeometry(positions, progress);
}

function buildRings(rim) {
  const positions = [];
  const progress = [];
  const segments = 144;
  RINGS.forEach((lightyears, index) => {
    const x = reachOf(lightyears) * LENGTH;
    const radius = rim * x;
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const b = ((i + 1) / segments) * Math.PI * 2;
      positions.push(x, Math.cos(a) * radius, Math.sin(a) * radius, x, Math.cos(b) * radius, Math.sin(b) * radius);
      progress.push((index + i / segments) / RINGS.length, (index + (i + 1) / segments) / RINGS.length);
    }
  });
  return lineGeometry(positions, progress);
}

function buildAxis(reach) {
  const positions = [];
  const progress = [];
  const dashes = 90;
  for (let i = 0; i < dashes; i++) {
    const a = i / dashes;
    const b = (i + 0.45) / dashes;
    positions.push(a * reach, 0, 0, b * reach, 0, 0);
    progress.push(a, b);
  }
  return lineGeometry(positions, progress);
}

function buildArc(rim, radius) {
  const positions = [];
  const progress = [];
  const segments = 48;
  const theta = Math.atan(rim);
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * theta;
    const b = ((i + 1) / segments) * theta;
    positions.push(Math.cos(a) * radius, Math.sin(a) * radius, 0, Math.cos(b) * radius, Math.sin(b) * radius, 0);
    progress.push(i / segments, (i + 1) / segments);
  }
  return lineGeometry(positions, progress);
}

function buildRipples() {
  const segments = 120;
  const count = RIPPLES * segments * 2;
  const geometry = new THREE.BufferGeometry();
  const ring = new Float32Array(count);
  const angle = new Float32Array(count);
  let v = 0;
  for (let r = 0; r < RIPPLES; r++) {
    for (let i = 0; i < segments; i++) {
      ring[v] = r;
      angle[v++] = (i / segments) * Math.PI * 2;
      ring[v] = r;
      angle[v++] = ((i + 1) / segments) * Math.PI * 2;
    }
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute('aRing', new THREE.BufferAttribute(ring, 1));
  geometry.setAttribute('aAngle', new THREE.BufferAttribute(angle, 1));
  return geometry;
}

function buildHelix() {
  const segments = 720;
  const count = STRANDS * segments * 2;
  const geometry = new THREE.BufferGeometry();
  const t = new Float32Array(count);
  const strand = new Float32Array(count);
  let v = 0;
  for (let s = 0; s < STRANDS; s++) {
    for (let i = 0; i < segments; i++) {
      t[v] = i / segments;
      strand[v++] = s;
      t[v] = (i + 1) / segments;
      strand[v++] = s;
    }
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute('aT', new THREE.BufferAttribute(t, 1));
  geometry.setAttribute('aStrand', new THREE.BufferAttribute(strand, 1));
  return geometry;
}

class Bloom {
  constructor(renderer) {
    this.renderer = renderer;
    const floats = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');
    this.type = floats ? THREE.HalfFloatType : THREE.UnsignedByteType;
    const options = { type: this.type, depthBuffer: false };
    this.scene = new THREE.WebGLRenderTarget(1, 1, { ...options, samples: 4 });
    this.levels = Array.from({ length: BLOOM_LEVELS }, () => ({
      across: new THREE.WebGLRenderTarget(1, 1, options),
      down: new THREE.WebGLRenderTarget(1, 1, options)
    }));

    this.blur = new THREE.ShaderMaterial({
      vertexShader: QUAD_VERT,
      fragmentShader: BLUR_FRAG,
      uniforms: { uSource: { value: null }, uStep: { value: new THREE.Vector2() } },
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending
    });
    this.composite = new THREE.ShaderMaterial({
      vertexShader: QUAD_VERT,
      fragmentShader: COMPOSITE_FRAG,
      uniforms: {
        uScene: { value: this.scene.texture },
        uBloom0: { value: this.levels[0].down.texture },
        uBloom1: { value: this.levels[1].down.texture },
        uBloom2: { value: this.levels[2].down.texture },
        uStrength: { value: 1 }
      },
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending
    });

    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.blur);
    this.quad.frustumCulled = false;
    this.post = new THREE.Scene();
    this.post.add(this.quad);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.size = new THREE.Vector2();
  }

  resize() {
    this.renderer.getDrawingBufferSize(this.size);
    this.scene.setSize(this.size.x, this.size.y);
    this.levels.forEach((level, index) => {
      const w = Math.max(1, this.size.x >> (index + 1));
      const h = Math.max(1, this.size.y >> (index + 1));
      level.across.setSize(w, h);
      level.down.setSize(w, h);
    });
  }

  pass(material, target) {
    this.quad.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.post, this.camera);
  }

  render(scene, camera, strength) {
    const { renderer } = this;
    renderer.setRenderTarget(this.scene);
    renderer.clear();
    renderer.render(scene, camera);

    let source = this.scene.texture;
    for (const level of this.levels) {
      const { width, height } = level.across;
      this.blur.uniforms.uSource.value = source;
      this.blur.uniforms.uStep.value.set(1 / width, 0);
      this.pass(this.blur, level.across);
      this.blur.uniforms.uSource.value = level.across.texture;
      this.blur.uniforms.uStep.value.set(0, 1 / height);
      this.pass(this.blur, level.down);
      source = level.down.texture;
    }

    this.composite.uniforms.uStrength.value = strength;
    this.pass(this.composite, null);
  }
}

export async function mount(figure) {
  const host = figure.querySelector('[data-role="host"]');
  const labels = figure.querySelector('[data-role="labels"]');
  const toggle = figure.querySelector('[data-role="morph"]');
  const heatToggle = figure.querySelector('[data-role="heat"]');
  const readout = figure.querySelector('[data-role="readout"]');

  const data = await fetch(DATA_URL, { credentials: 'omit' }).then((res) => {
    if (!res.ok) throw new Error('field ' + res.status);
    return res.json();
  });
  if (data.stride !== 8 || data.points.length !== data.count * 8) throw new Error('field format');

  const count = data.count;
  const earth = new THREE.Vector3(...data.earth);
  const directions = new Float32Array(count * 3);
  const axis = new THREE.Vector3();
  const direction = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    const o = i * 8;
    direction.set(data.points[o], data.points[o + 1], data.points[o + 2]).sub(earth).normalize();
    direction.toArray(directions, i * 3);
    axis.add(direction);
  }
  axis.normalize();
  const { side, lift } = basis(axis);

  const position = new Float32Array(count * 3);
  const sky = new Float32Array(count * 3);
  const temp = new Float32Array(count);
  const size = new Float32Array(count);
  const delay = new Float32Array(count);
  const seed = new Float32Array(count);
  const spread = new Float32Array(count);
  const distances = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const o = i * 8;
    direction.fromArray(directions, i * 3);
    const along = direction.dot(axis);
    const tanSide = direction.dot(side) / along;
    const tanLift = direction.dot(lift) / along;
    const lightyears = data.points[o + 7];
    const reach = reachOf(lightyears);
    const x = reach * LENGTH;

    position.set([x, tanSide * APERTURE * x, tanLift * APERTURE * x], i * 3);
    sky.set([SKY, tanSide * APERTURE * SKY, tanLift * APERTURE * SKY], i * 3);
    temp[i] = data.points[o + 3];
    const radius = Math.max(0.2, data.points[o + 4]);
    size[i] = 18 * (0.5 + Math.min(1.1, Math.log10(radius + 1) * 1.4)) * (data.points[o + 5] > 1 ? 1.5 : 1);
    delay[i] = reach / MAX_REACH;
    seed[i] = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1);
    spread[i] = Math.hypot(tanSide, tanLift);
    distances[i] = lightyears;
  }

  const rim = [...spread].sort((a, b) => a - b)[Math.floor(count * 0.95)] * APERTURE;
  const sortedDistances = [...distances].sort((a, b) => a - b);
  const near = sortedDistances[Math.floor(count * 0.05)];
  const far = sortedDistances[Math.floor(count * 0.95)];
  const edgeReach = 1.3 * LENGTH;
  const arcRadius = 0.55;

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.prepend(renderer.domElement);
  const bloom = new Bloom(renderer);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.02, 80);
  const rig = new THREE.Group();
  const cone = new THREE.Group();
  rig.add(cone);
  scene.add(rig);

  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  starGeometry.setAttribute('aSky', new THREE.BufferAttribute(sky, 3));
  starGeometry.setAttribute('aTemp', new THREE.BufferAttribute(temp, 1));
  starGeometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  starGeometry.setAttribute('aDelay', new THREE.BufferAttribute(delay, 1));
  starGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

  const starUniforms = {
    uProgress: { value: 0 },
    uTime: { value: 0 },
    uPixel: { value: 1 },
    uReach: { value: MAX_REACH * LENGTH },
    uHeat: { value: 0 }
  };

  const stars = new THREE.Points(starGeometry, new THREE.ShaderMaterial({
    vertexShader: STAR_VERT,
    fragmentShader: STAR_FRAG,
    uniforms: starUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  stars.frustumCulled = false;
  cone.add(stars);

  const edgeMaterial = lineMaterial(0xb9d6f8, 0.2, 1.4);
  const ringMaterial = lineMaterial(0xb9d6f8, 0.28, 1.2);
  const axisMaterial = lineMaterial(0xf6efe3, 0.14, 0.9);
  const arcMaterial = lineMaterial(0xf6efe3, 0.55, 1.2);
  cone.add(new THREE.LineSegments(buildEdges(rim, edgeReach), edgeMaterial));
  cone.add(new THREE.LineSegments(buildRings(rim), ringMaterial));
  cone.add(new THREE.LineSegments(buildAxis(edgeReach), axisMaterial));
  cone.add(new THREE.LineSegments(buildArc(rim, arcRadius), arcMaterial));

  const rippleMaterial = new THREE.ShaderMaterial({
    vertexShader: RIPPLE_VERT,
    fragmentShader: RIPPLE_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uReach: { value: edgeReach },
      uRim: { value: rim },
      uCount: { value: RIPPLES },
      uColor: { value: new THREE.Color(0xb9d6f8) },
      uOpacity: { value: 0 }
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const ripples = new THREE.LineSegments(buildRipples(), rippleMaterial);
  ripples.frustumCulled = false;
  cone.add(ripples);

  const helixMaterial = new THREE.ShaderMaterial({
    vertexShader: HELIX_VERT,
    fragmentShader: HELIX_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uReach: { value: LENGTH * 1.15 },
      uRim: { value: rim },
      uTurns: { value: TURNS },
      uStrands: { value: STRANDS },
      uColor: { value: new THREE.Color(0xd8e8fd) },
      uDraw: { value: 0 },
      uOpacity: { value: 0.16 }
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const helix = new THREE.LineSegments(buildHelix(), helixMaterial);
  helix.frustumCulled = false;
  cone.add(helix);

  const markerMaterial = new THREE.LineBasicMaterial({ color: 0xf6efe3, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const marker = new THREE.Group();
  marker.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.035)), markerMaterial));
  const halo = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const b = ((i + 1) / 48) * Math.PI * 2;
    halo.push(0, Math.cos(a) * 0.075, Math.sin(a) * 0.075, 0, Math.cos(b) * 0.075, Math.sin(b) * 0.075);
  }
  const markerRing = new THREE.LineSegments(
    new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(halo, 3)),
    markerMaterial
  );
  marker.add(markerRing);
  cone.add(marker);

  const labelFor = (text, kind) => {
    const element = document.createElement('span');
    element.className = `dg-starmap-label is-${kind}`;
    element.textContent = text;
    labels.append(element);
    return element;
  };
  const earthLabel = labelFor('nosotros', 'earth');
  const ringLabels = RINGS.map((lightyears) => ({
    x: reachOf(lightyears) * LENGTH,
    element: labelFor(`${grouped(lightyears)} años luz`, 'ring')
  }));
  const thetaLabel = labelFor('θ', 'theta');
  const formulaLabel = labelFor('radio = distancia × tan θ', 'formula');

  let width = 1;
  let height = 1;
  let zFlat = 1;
  let zOpen = 3;
  let pivotOpen = 1.7;
  let target = 0;
  let progress = 0;
  let heatTarget = 0;
  let heat = 0;
  let active = false;
  let visible = false;
  let started = false;
  let frame = 0;
  let elapsed = 0;
  let last = performance.now();
  const view = { yaw: 0, pitch: 0, velocity: 0 };
  const anchor = new THREE.Vector3();

  const say = () => {
    if (heatTarget === 1) {
      readout.textContent = 'naranja: más frías que el Sol · dorado: parecidas al Sol · azul: más calientes';
      return;
    }
    readout.textContent = progress < 0.5
      ? `${grouped(count)} estrellas vistas desde aquí · los cuadritos son los 21 módulos de la cámara de Kepler`
      : `${grouped(count)} estrellas en su lugar · casi todas entre ${grouped(near)} y ${grouped(far)} años luz`;
  };

  function place(element, matrix, x, y, z, opacity) {
    anchor.set(x, y, z).applyMatrix4(matrix).project(camera);
    const hidden = anchor.z > 1 || opacity < 0.01;
    element.style.opacity = hidden ? '0' : opacity.toFixed(3);
    if (hidden) return;
    const left = (anchor.x * 0.5 + 0.5) * width;
    const top = (-anchor.y * 0.5 + 0.5) * height;
    element.style.transform = `translate(${left.toFixed(1)}px, ${top.toFixed(1)}px)`;
  }

  function draw() {
    const eased = smoother(progress);
    const grow = smoother(clamp01((progress - 0.15) / 0.75));
    const open = smoother(clamp01((progress - 0.55) / 0.45));
    const pivot = mix(0, pivotOpen, eased);

    rig.rotation.set(
      mix(0, -0.1, eased) + view.pitch,
      mix(Math.PI / 2, 0.3 + Math.sin(elapsed * 0.12) * 0.1, eased) + view.yaw,
      0
    );
    cone.position.x = -pivot;
    cone.rotation.x = elapsed * 0.1;
    markerRing.rotation.x = elapsed * 0.4;
    camera.position.set(0, 0, mix(zFlat, zOpen, eased));
    camera.updateMatrixWorld();

    starUniforms.uProgress.value = progress;
    edgeMaterial.uniforms.uDraw.value = grow;
    axisMaterial.uniforms.uDraw.value = grow;
    ringMaterial.uniforms.uDraw.value = open;
    arcMaterial.uniforms.uDraw.value = open;
    helixMaterial.uniforms.uDraw.value = open;
    rippleMaterial.uniforms.uOpacity.value = 0.34 * open;
    markerMaterial.opacity = 0.75 * smoother(clamp01((progress - 0.3) / 0.5));

    bloom.render(scene, camera, mix(0.55, 1.05, eased) * (1 - 0.35 * smoother(heat)));

    rig.updateMatrixWorld();
    const theta = Math.atan(rim) * 0.5;
    place(earthLabel, rig.matrixWorld, -pivot, -0.14, 0, markerMaterial.opacity);
    for (const ring of ringLabels) place(ring.element, rig.matrixWorld, ring.x - pivot, rim * ring.x + 0.08, 0, open * 0.9);
    place(thetaLabel, cone.matrixWorld, Math.cos(theta) * (arcRadius + 0.12), Math.sin(theta) * (arcRadius + 0.12), 0, open);
    const formulaX = reachOf(RINGS[1]) * LENGTH;
    place(formulaLabel, rig.matrixWorld, formulaX - pivot, -rim * formulaX - 0.16, 0, open * 0.85);
  }

  function resize() {
    width = host.clientWidth;
    height = host.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(devicePixelRatio || 1, 1.75) * pageScale();
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height);
    bloom.resize();

    const aspect = width / height;
    const tanV = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const tanH = tanV * aspect;
    const tight = Math.min(tanV, tanH);
    const portrait = aspect < 1;
    zFlat = (rim * SKY) / (0.62 * tight) - SKY;
    pivotOpen = portrait ? 1.3 : 1.7;
    zOpen = Math.max((portrait ? 1.75 : 2.65) / tanH, 1.2 / tanV);

    const rail = document.querySelector('.dg-rail');
    const right = rail && matchMedia('(min-width: 1101px)').matches ? rail.offsetWidth + 60 : 0;
    const left = Math.min(170, width * 0.12);
    camera.aspect = aspect;
    camera.setViewOffset(width, height, (right - left) * 0.5, 0, width, height);
    camera.updateProjectionMatrix();

    starUniforms.uPixel.value = (ratio * Math.min(width, height)) / 620;
    draw();
  }

  function loop(now) {
    if (!active) return;
    frame = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (!still) {
      elapsed += dt;
      starUniforms.uTime.value = elapsed;
      rippleMaterial.uniforms.uTime.value = elapsed;
      helixMaterial.uniforms.uTime.value = elapsed;
      view.velocity *= Math.pow(0.94, dt * 60);
      view.yaw += view.velocity * dt;
    }

    const heatStep = still ? 1 : dt / 1.2;
    heat = heatTarget > heat ? Math.min(heatTarget, heat + heatStep) : Math.max(heatTarget, heat - heatStep);
    starUniforms.uHeat.value = smoother(heat);

    const before = progress;
    const step = still ? 1 : dt / DURATION;
    progress = target > progress ? Math.min(target, progress + step) : Math.max(target, progress - step);
    if ((before - 0.5) * (progress - 0.5) <= 0 && before !== progress) say();
    draw();
  }

  function setActive(next) {
    if (next === active) return;
    active = next;
    if (active) {
      last = performance.now();
      frame = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(frame);
    }
  }

  function setTarget(next) {
    started = true;
    target = next;
    toggle.setAttribute('aria-pressed', String(next === 1));
    toggle.textContent = next === 1 ? 'volver a verlo desde aquí' : 'ver dónde están de verdad';
    if (still) {
      progress = next;
      say();
      draw();
    }
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    setActive(visible && !document.hidden);
    if (!started && !still && entry.intersectionRatio >= 0.45) {
      started = true;
      setTimeout(() => {
        if (target === 0) setTarget(1);
      }, 900);
    }
  }, { threshold: [0, 0.45] }).observe(host);
  document.addEventListener('visibilitychange', () => setActive(visible && !document.hidden));
  new ResizeObserver(resize).observe(host);

  const canvas = renderer.domElement;
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
    host.classList.add('is-dragging');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    const dx = (e.clientX - drag.x) / rect.width;
    const dy = (e.clientY - drag.y) / rect.height;
    view.yaw += dx * 2.6;
    view.pitch = Math.max(-0.9, Math.min(0.9, view.pitch + dy * 2.6));
    view.velocity = dx * 120;
    drag.x = e.clientX;
    drag.y = e.clientY;
    if (!active) draw();
  });
  const release = () => {
    drag = null;
    host.classList.remove('is-dragging');
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  toggle.addEventListener('click', () => setTarget(target === 1 ? 0 : 1));

  heatToggle.addEventListener('click', () => {
    heatTarget = heatTarget === 1 ? 0 : 1;
    heatToggle.setAttribute('aria-pressed', String(heatTarget === 1));
    heatToggle.textContent = heatTarget === 1 ? 'verlas en blanco' : 'ver sus temperaturas';
    if (still) {
      heat = heatTarget;
      starUniforms.uHeat.value = heat;
      draw();
    }
    say();
  });

  resize();
  say();
}
