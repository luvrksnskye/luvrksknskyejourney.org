import * as THREE from '/assets/js/vendor/three/three.module.min.js';
import { pageScale } from '/assets/js/page-scale.js';
import { loadCurve, percentile } from './lightcurve.js?v=4';

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COLUMNS = 128;
const ROWS = 96;
const WINDOW = 360;
const SOFT = 260;
const STRIDE = 24;

const VERT = `
  uniform sampler2D uHeight;
  uniform float uTime;
  uniform float uNoise;
  uniform float uFreq;
  uniform float uSpeed;
  varying float vHeight;

  vec3 gradient(vec3 cell) {
    vec3 h = fract(sin(vec3(
      dot(cell, vec3(127.1, 311.7, 74.7)),
      dot(cell, vec3(269.5, 183.3, 246.1)),
      dot(cell, vec3(113.5, 271.9, 124.6))
    )) * 43758.5453);
    return normalize(h * 2.0 - 1.0);
  }

  float perlin(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    float n000 = dot(gradient(i), f);
    float n100 = dot(gradient(i + vec3(1, 0, 0)), f - vec3(1, 0, 0));
    float n010 = dot(gradient(i + vec3(0, 1, 0)), f - vec3(0, 1, 0));
    float n110 = dot(gradient(i + vec3(1, 1, 0)), f - vec3(1, 1, 0));
    float n001 = dot(gradient(i + vec3(0, 0, 1)), f - vec3(0, 0, 1));
    float n101 = dot(gradient(i + vec3(1, 0, 1)), f - vec3(1, 0, 1));
    float n011 = dot(gradient(i + vec3(0, 1, 1)), f - vec3(0, 1, 1));
    float n111 = dot(gradient(i + vec3(1, 1, 1)), f - vec3(1, 1, 1));
    return mix(
      mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
      mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
      u.z
    );
  }

  void main() {
    float h = texture2D(uHeight, uv).r;
    float fbm = perlin(vec3(uv * uFreq, uTime * uSpeed)) + 0.5 * perlin(vec3(uv * uFreq * 2.0, uTime * uSpeed * 1.7));
    h += uNoise * fbm * 0.45;
    vHeight = h;
    vec3 displaced = position + vec3(0.0, 0.0, h * 0.46);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const FRAG = `
  varying float vHeight;
  void main() {
    vec3 color = mix(vec3(0.33, 0.39, 0.49), vec3(0.96, 0.94, 0.89), clamp(vHeight * 1.3, 0.0, 1.0));
    gl_FragColor = vec4(color, 0.22 + clamp(vHeight, 0.0, 1.0) * 0.7);
  }
`;

export async function mount(figure) {
  const host = figure.querySelector('[data-role="host"]');
  const noiseButton = figure.querySelector('[data-role="noise"]');
  const pauseButton = figure.querySelector('[data-role="pause"]');
  const readout = figure.querySelector('[data-role="readout"]');

  const { time, ppm, count } = await loadCurve('kepler-90');
  const warp = (value) => Math.asinh(value / SOFT);
  const low = warp(percentile(ppm, 0.0005));
  const high = warp(percentile(ppm, 0.9995));
  const pixels = new Uint8Array(COLUMNS * ROWS);
  const profile = new Float32Array(ROWS);

  function column(start) {
    profile.fill(0);
    let mean = 0;
    for (let k = 0; k < WINDOW; k++) mean += ppm[(start + k) % count];
    mean /= WINDOW;
    let variance = 0;
    for (let k = 0; k < WINDOW; k++) {
      const value = ppm[(start + k) % count];
      variance += (value - mean) ** 2;
      const row = ((warp(value) - low) / (high - low)) * (ROWS - 1);
      const center = Math.round(row);
      for (let r = Math.max(0, center - 6); r <= Math.min(ROWS - 1, center + 6); r++) {
        profile[r] += Math.exp(-((r - row) ** 2) / 14);
      }
    }
    let peak = 0;
    for (let r = 0; r < ROWS; r++) {
      profile[r] = Math.log1p(profile[r]);
      if (profile[r] > peak) peak = profile[r];
    }
    return { profile, peak, std: Math.sqrt(variance / WINDOW), day: time[start % count] };
  }

  let cursor = 0;
  let last = { std: 0, day: time[0] };

  function writeColumn(c, start) {
    const result = column(start);
    for (let r = 0; r < ROWS; r++) pixels[r * COLUMNS + c] = Math.round((result.profile[r] / (result.peak || 1)) * 255);
    return result;
  }

  for (let c = 0; c < COLUMNS; c++) last = writeColumn(c, cursor + c * STRIDE);

  function shift() {
    for (let r = 0; r < ROWS; r++) {
      const row = r * COLUMNS;
      pixels.copyWithin(row, row + 1, row + COLUMNS);
    }
    cursor = (cursor + STRIDE) % count;
    last = writeColumn(COLUMNS - 1, cursor + (COLUMNS - 1) * STRIDE);
  }

  const texture = new THREE.DataTexture(pixels, COLUMNS, ROWS, THREE.RedFormat);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  const uniforms = {
    uHeight: { value: texture },
    uTime: { value: 0 },
    uNoise: { value: 0 },
    uFreq: { value: 3 },
    uSpeed: { value: 0.15 }
  };

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  camera.position.set(0, 2.3, 3.3);
  camera.lookAt(0, 0.05, 0);

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 2.4, COLUMNS - 1, ROWS - 1),
    new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, wireframe: true, transparent: true, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  scene.add(mesh);

  let noiseTarget = 0;
  let paused = still;
  let active = false;
  let frame = 0;
  let elapsed = 0;
  let accumulator = 0;
  let previous = performance.now();

  pauseButton.setAttribute('aria-pressed', String(paused));

  function resize() {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75) * pageScale());
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }

  function updateReadout() {
    const variation = Math.min(1, last.std / 900);
    uniforms.uFreq.value = 2 + variation * 7;
    uniforms.uSpeed.value = 0.08 + variation * 0.5;
    readout.textContent = `ventana en BKJD ${last.day.toFixed(1)} · desviación ${Math.round(last.std)} ppm · ruido: frecuencia ${uniforms.uFreq.value.toFixed(1)}, velocidad ${uniforms.uSpeed.value.toFixed(2)}`;
  }

  function loop(now) {
    if (!active) return;
    frame = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - previous) / 1000);
    previous = now;
    if (!paused) {
      elapsed += dt;
      accumulator += dt;
      if (accumulator > 0.09) {
        accumulator = 0;
        shift();
        texture.needsUpdate = true;
        updateReadout();
      }
      mesh.rotation.z = Math.sin(elapsed * 0.1) * 0.18;
    }
    uniforms.uTime.value = elapsed;
    uniforms.uNoise.value += (noiseTarget - uniforms.uNoise.value) * 0.08;
    renderer.render(scene, camera);
  }

  function setActive(next) {
    if (next === active) return;
    active = next;
    if (active) {
      previous = performance.now();
      frame = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(frame);
    }
  }

  let visible = false;
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    setActive(visible && !document.hidden);
  }).observe(host);
  document.addEventListener('visibilitychange', () => setActive(visible && !document.hidden));
  new ResizeObserver(resize).observe(host);

  noiseButton.addEventListener('click', () => {
    const on = noiseButton.getAttribute('aria-pressed') !== 'true';
    noiseButton.setAttribute('aria-pressed', String(on));
    noiseTarget = on ? 1 : 0;
    if (!active) {
      uniforms.uNoise.value = noiseTarget;
      renderer.render(scene, camera);
    }
  });

  pauseButton.addEventListener('click', () => {
    paused = !paused;
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.textContent = paused ? 'REANUDAR' : 'PAUSA';
  });

  resize();
  updateReadout();
}
