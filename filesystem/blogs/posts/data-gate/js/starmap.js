import * as THREE from '/assets/js/vendor/three/three.module.min.js';
import { pageScale } from '/assets/js/page-scale.js';

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DATA_URL = new URL('../data/kepler-field.json', import.meta.url);

const VERT = `
  attribute vec3 aSpace;
  attribute float aTemp;
  attribute float aSize;
  attribute float aDelay;
  uniform float uMorph;
  uniform float uTime;
  uniform float uPixel;
  uniform vec3 uEarth;
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
    float wave = clamp((uMorph * 1.7 - aDelay) / 0.7, 0.0, 1.0);
    float eased = wave * wave * (3.0 - 2.0 * wave);
    vec3 toStar = aSpace - uEarth;
    float reach = length(toStar);
    vec3 sky = uEarth + normalize(toStar) * 0.62;
    vec3 p = mix(sky, aSpace, eased);
    p += sin(uTime * 0.25 + aDelay * 9.0) * 0.0025;

    vColor = blackbody(aTemp);
    float far = smoothstep(2.4, 0.2, reach);
    vAlpha = 0.35 + 0.65 * mix(1.0, far, eased);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aSize * uPixel / max(0.35, -mv.z);
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

function ring(radius, segments) {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    points.push(Math.cos(a) * radius, 0, Math.sin(a) * radius);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  return geometry;
}

export async function mount(figure) {
  const host = figure.querySelector('[data-role="host"]');
  const toggle = figure.querySelector('[data-role="morph"]');
  const readout = figure.querySelector('[data-role="readout"]');

  const data = await fetch(DATA_URL, { credentials: 'omit' }).then((res) => {
    if (!res.ok) throw new Error('field ' + res.status);
    return res.json();
  });
  if (data.stride !== 8 || data.points.length !== data.count * 8) throw new Error('field format');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 60);
  const group = new THREE.Group();
  scene.add(group);

  const earth = new THREE.Vector3(...data.earth);
  const count = data.count;
  const space = new Float32Array(count * 3);
  const temp = new Float32Array(count);
  const size = new Float32Array(count);
  const delay = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const o = i * 8;
    const x = data.points[o];
    const y = data.points[o + 1];
    const z = data.points[o + 2];
    space[i * 3] = x;
    space[i * 3 + 1] = y;
    space[i * 3 + 2] = z;
    temp[i] = data.points[o + 3];
    const radius = Math.max(0.2, data.points[o + 4]);
    const planets = data.points[o + 5];
    size[i] = 22 * (0.5 + Math.min(1.1, Math.log10(radius + 1) * 1.4)) * (planets > 1 ? 1.5 : 1);
    delay[i] = Math.min(1, Math.hypot(x - earth.x, y - earth.y, z - earth.z) / 2.2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(space, 3));
  geometry.setAttribute('aSpace', new THREE.BufferAttribute(space, 3));
  geometry.setAttribute('aTemp', new THREE.BufferAttribute(temp, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geometry.setAttribute('aDelay', new THREE.BufferAttribute(delay, 1));

  const uniforms = {
    uMorph: { value: 0 },
    uTime: { value: 0 },
    uPixel: { value: 1 },
    uEarth: { value: earth }
  };

  group.add(new THREE.Points(geometry, new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })));

  const line = new THREE.LineBasicMaterial({ color: 0xb9d6f8, transparent: true, opacity: 0.32, depthWrite: false });
  const marker = new THREE.Group();
  marker.position.copy(earth);
  marker.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.035)), line));
  const halo = new THREE.Line(ring(0.07, 64), line);
  marker.add(halo);
  group.add(marker);

  let morphTarget = 0;
  let active = false;
  let visible = false;
  let frame = 0;
  let elapsed = 0;
  let last = performance.now();
  const spin = { x: 0.12, y: 0.4, velocity: 0 };
  let aspect = 1;

  const say = () => {
    readout.textContent = uniforms.uMorph.value < 0.5
      ? `${count} estrellas con candidatos a planeta, puestas donde las vemos en el cielo`
      : `${count} estrellas en su sitio · la mitad está a más de ${data.median_ly.toLocaleString('es')} años luz`;
  };

  function draw() {
    const morph = uniforms.uMorph.value;
    const eased = morph * morph * (3 - 2 * morph);
    group.rotation.set(spin.x * eased, spin.y, 0);
    group.position.copy(earth).multiplyScalar(-(1 - eased));
    halo.rotation.x = elapsed * 0.3;
    const near = aspect < 1 ? 1.15 / Math.max(0.6, aspect) : 1.15;
    const far = aspect < 1 ? 3.4 / Math.max(0.6, aspect) : 3.4;
    camera.position.z = near + (far - near) * eased;
    renderer.render(scene, camera);
  }

  function resize() {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(devicePixelRatio || 1, 1.75) * pageScale();
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height);
    aspect = width / height;
    camera.aspect = aspect;
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
      spin.velocity *= 0.94;
      spin.y += (spin.velocity + 0.03 + 0.04 * uniforms.uMorph.value) * dt;
    }
    const before = uniforms.uMorph.value;
    uniforms.uMorph.value += (morphTarget - before) * (still ? 1 : 0.035);
    if ((before - 0.5) * (uniforms.uMorph.value - 0.5) <= 0) say();
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

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    setActive(visible && !document.hidden);
  }).observe(host);
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
    spin.y += dx * 3;
    spin.x = Math.max(-1.2, Math.min(1.2, spin.x + dy * 3));
    spin.velocity = dx * 160;
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

  toggle.addEventListener('click', () => {
    const on = toggle.getAttribute('aria-pressed') !== 'true';
    toggle.setAttribute('aria-pressed', String(on));
    toggle.textContent = on ? 'volver al cielo plano' : 'ver dónde están de verdad';
    morphTarget = on ? 1 : 0;
    if (still) {
      uniforms.uMorph.value = morphTarget;
      say();
      draw();
    }
  });

  resize();
  say();
}
