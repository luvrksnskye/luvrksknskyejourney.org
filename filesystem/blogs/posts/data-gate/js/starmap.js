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

const VERT = `
  attribute vec3 aSky;
  attribute float aTemp;
  attribute float aSize;
  attribute float aDelay;
  attribute float aSeed;
  uniform float uProgress;
  uniform float uTime;
  uniform float uPixel;
  uniform float uReach;
  varying vec3 vColor;
  varying float vAlpha;

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

    vColor = mix(blackbody(aTemp), vec3(1.0), pulse * 0.55);
    vAlpha = mix(0.6, 1.0, eased) * (0.5 + 0.5 * (1.0 - along * 0.6 * eased)) + pulse * 0.9;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float grow = mix(0.42, 1.0, eased);
    gl_PointSize = min(aSize * grow * uPixel / max(0.2, -mv.z), uPixel * 26.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float core = smoothstep(0.18, 0.0, d);
    float halo = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(mix(vColor, vec3(1.0), core * 0.5), (core * 0.85 + halo * halo * 0.4) * vAlpha);
  }
`;

const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const mix = (a, b, t) => a + (b - a) * t;
const reachOf = (lightyears) => Math.min(MAX_REACH, Math.sqrt(lightyears / REFERENCE_LY));

const grouped = (value) => String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

function circle(x, radius, segments) {
  const points = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const b = ((i + 1) / segments) * Math.PI * 2;
    points.push(x, Math.cos(a) * radius, Math.sin(a) * radius, x, Math.cos(b) * radius, Math.sin(b) * radius);
  }
  return points;
}

function basis(axis) {
  const up = Math.abs(axis.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3().crossVectors(axis, up).normalize();
  const lift = new THREE.Vector3().crossVectors(side, axis).normalize();
  return { side, lift };
}

export async function mount(figure) {
  const host = figure.querySelector('[data-role="host"]');
  const labels = figure.querySelector('[data-role="labels"]');
  const toggle = figure.querySelector('[data-role="morph"]');
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

  for (let i = 0; i < count; i++) {
    const o = i * 8;
    const direction = new THREE.Vector3(data.points[o], data.points[o + 1], data.points[o + 2]).sub(earth).normalize();
    directions.set([direction.x, direction.y, direction.z], i * 3);
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
  const direction = new THREE.Vector3();

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
    seed[i] = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    spread[i] = Math.hypot(tanSide, tanLift);
    distances[i] = lightyears;
  }

  const rim = [...spread].sort((a, b) => a - b)[Math.floor(count * 0.95)] * APERTURE;
  const sortedDistances = [...distances].sort((a, b) => a - b);
  const near = sortedDistances[Math.floor(count * 0.05)];
  const far = sortedDistances[Math.floor(count * 0.95)];

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.02, 80);
  const rig = new THREE.Group();
  const cone = new THREE.Group();
  rig.add(cone);
  scene.add(rig);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('aSky', new THREE.BufferAttribute(sky, 3));
  geometry.setAttribute('aTemp', new THREE.BufferAttribute(temp, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geometry.setAttribute('aDelay', new THREE.BufferAttribute(delay, 1));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

  const uniforms = {
    uProgress: { value: 0 },
    uTime: { value: 0 },
    uPixel: { value: 1 },
    uReach: { value: MAX_REACH * LENGTH }
  };

  cone.add(new THREE.Points(geometry, new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })));

  const guideMaterial = new THREE.LineBasicMaterial({ color: 0xb9d6f8, transparent: true, opacity: 0, depthWrite: false });
  const guides = [];
  for (const lightyears of RINGS) {
    const x = reachOf(lightyears) * LENGTH;
    guides.push(...circle(x, rim * x, 96));
  }
  const edgeReach = 1.3 * LENGTH;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    guides.push(0, 0, 0, edgeReach, Math.cos(a) * rim * edgeReach, Math.sin(a) * rim * edgeReach);
  }
  const guideGeometry = new THREE.BufferGeometry();
  guideGeometry.setAttribute('position', new THREE.Float32BufferAttribute(guides, 3));
  cone.add(new THREE.LineSegments(guideGeometry, guideMaterial));

  const markerMaterial = new THREE.LineBasicMaterial({ color: 0xf6efe3, transparent: true, opacity: 0, depthWrite: false });
  const marker = new THREE.Group();
  marker.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.035)), markerMaterial));
  const markerRing = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(circle(0, 0.075, 48), 3)), markerMaterial);
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

  let width = 1;
  let height = 1;
  let zFlat = 1;
  let zOpen = 3;
  let pivotOpen = 1.7;
  let target = 0;
  let progress = 0;
  let active = false;
  let visible = false;
  let started = false;
  let frame = 0;
  let elapsed = 0;
  let last = performance.now();
  const view = { yaw: 0, pitch: 0, velocity: 0 };
  const anchor = new THREE.Vector3();

  const say = () => {
    readout.textContent = progress < 0.5
      ? `${grouped(count)} estrellas vistas desde aquí · los cuadritos son los 21 módulos de la cámara de Kepler`
      : `${grouped(count)} estrellas en su lugar · casi todas entre ${grouped(near)} y ${grouped(far)} años luz`;
  };

  function place(element, x, y, z, opacity) {
    anchor.set(x, y, z).applyMatrix4(rig.matrixWorld).project(camera);
    const hidden = anchor.z > 1 || opacity < 0.01;
    element.style.opacity = hidden ? '0' : opacity.toFixed(3);
    if (hidden) return;
    const left = (anchor.x * 0.5 + 0.5) * width;
    const top = (-anchor.y * 0.5 + 0.5) * height;
    element.style.transform = `translate(${left.toFixed(1)}px, ${top.toFixed(1)}px)`;
  }

  function draw() {
    const eased = smoother(progress);
    const open = smoother(Math.min(1, Math.max(0, (progress - 0.55) / 0.45)));
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

    uniforms.uProgress.value = progress;
    guideMaterial.opacity = 0.2 * open;
    markerMaterial.opacity = 0.75 * smoother(Math.min(1, Math.max(0, (progress - 0.3) / 0.5)));

    renderer.render(scene, camera);
    rig.updateMatrixWorld();

    place(earthLabel, -pivot, -0.14, 0, markerMaterial.opacity);
    for (const ring of ringLabels) place(ring.element, ring.x - pivot, rim * ring.x + 0.08, 0, open * 0.9);
  }

  function resize() {
    width = host.clientWidth;
    height = host.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(devicePixelRatio || 1, 1.75) * pageScale();
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height);

    const aspect = width / height;
    const tanV = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const tanH = tanV * aspect;
    const tight = Math.min(tanV, tanH);
    zFlat = (rim * SKY) / (0.62 * tight) - SKY;
    const portrait = aspect < 1;
    pivotOpen = portrait ? 1.3 : 1.7;
    zOpen = Math.max((portrait ? 1.75 : 2.65) / tanH, 1.2 / tanV);

    const rail = document.querySelector('.dg-rail');
    const right = rail && matchMedia('(min-width: 1101px)').matches ? rail.offsetWidth + 60 : 0;
    const left = Math.min(170, width * 0.12);
    const offset = (right - left) * 0.5;
    camera.aspect = aspect;
    camera.setViewOffset(width, height, offset, 0, width, height);
    camera.updateProjectionMatrix();

    uniforms.uPixel.value = (ratio * Math.min(width, height)) / 620;
    draw();
  }

  function loop(now) {
    if (!active) return;
    frame = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (!still) {
      elapsed += dt;
      uniforms.uTime.value = elapsed;
      view.velocity *= Math.pow(0.94, dt * 60);
      view.yaw += view.velocity * dt;
    }

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

  resize();
  say();
}
