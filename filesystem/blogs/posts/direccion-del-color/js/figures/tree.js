import * as THREE from '/assets/js/vendor/three/three.module.min.js';
import { pageScale } from '/assets/js/page-scale.js';
import { loadMunsell, notation, grayHex, FAMILIES, TAU, still, ease } from '../munsell.js?v=1';

const CHROMA_UNIT = 0.064;
const VALUE_UNIT = 0.31;
const STEP = (2.5 / 100) * TAU;

const mulberry = (seed) => () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

class Tree {
  constructor(host, data) {
    this.host = host;
    this.data = data;
    this.explore = host.dataset.mode === 'explore';
    this.figure = host.closest('.dd-figure') || host.closest('figure');
    this.readout = this.figure?.querySelector('[data-role="readout"]');
    this.tip = host.querySelector('[data-role="tip"]');
    this.active = false;
    this.visible = false;
    this.frame = 0;
    this.last = performance.now();
    this.grow = still ? 1 : 0;
    this.rotation = { x: 0.3, y: 0.9, velocity: 0, base: 0.9 };
    this.pointer = { x: 0, y: 0, inside: false, dirty: false, px: 0, py: 0 };
    this.set = 'real';
    this.cut = this.explore ? null : this.facingHue();
    this.sway = 0;
    this.hot = -1;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    host.prepend(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.8 * Math.PI));
    const key = new THREE.DirectionalLight(0xffffff, 0.34 * Math.PI);
    key.position.set(0.3, 1, 0.45);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.12 * Math.PI);
    fill.position.set(-0.6, 0.2, 1);
    this.scene.add(fill);

    this.buildBlocks();
    this.buildTrunk();
    this.buildLabels();

    this.loop = this.loop.bind(this);
    this.resize = this.resize.bind(this);
    new ResizeObserver(this.resize).observe(host);
    this.resize();

    new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.setActive(this.visible && !document.hidden);
    }).observe(host);
    document.addEventListener('visibilitychange', () => this.setActive(this.visible && !document.hidden));

    this.bindDrag();
    if (this.explore) this.bindControls();
    this.updateReadout();
    this.draw();
  }

  buildBlocks() {
    const { count, h, v, c, hex } = this.data;
    const random = mulberry(1943);
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.base = new Float32Array(count * 6);
    this.scale = new Float32Array(count);
    this.target = new Float32Array(count).fill(1);
    this.delay = new Float32Array(count);
    const color = new THREE.Color();
    let maxChroma = 0;
    for (let i = 0; i < count; i++) maxChroma = Math.max(maxChroma, c[i]);
    for (let i = 0; i < count; i++) {
      const angle = (h[i] / 100) * TAU;
      const radius = (c[i] - 0.5) * CHROMA_UNIT;
      const o = i * 6;
      this.base[o] = Math.cos(angle) * radius;
      this.base[o + 1] = (v[i] - 5) * VALUE_UNIT;
      this.base[o + 2] = Math.sin(angle) * radius;
      this.base[o + 3] = -angle;
      this.base[o + 4] = Math.max(0.012, (c[i] * CHROMA_UNIT) * STEP * 0.94);
      this.base[o + 5] = angle;
      this.delay[i] = (c[i] / maxChroma) * 0.62 + (v[i] / 10) * 0.18 + random() * 0.12;
      this.target[i] = this.included(i) ? 1 : 0;
      this.mesh.setColorAt(i, color.set(hex[i]));
    }
    this.mesh.instanceColor.needsUpdate = true;
    this.group.add(this.mesh);
    this.dummy = new THREE.Object3D();
    this.writeMatrices(true);
  }

  buildTrunk() {
    const trunk = new THREE.Group();
    const material = (value) => new THREE.MeshLambertMaterial({ color: new THREE.Color(grayHex(value)) });
    for (let value = 1; value <= 9; value++) {
      const block = new THREE.Mesh(new THREE.BoxGeometry(CHROMA_UNIT * 1.1, VALUE_UNIT * 0.9, CHROMA_UNIT * 1.1), material(value));
      block.position.y = (value - 5) * VALUE_UNIT;
      trunk.add(block);
    }
    const cap = (value, y, radius) => {
      const ball = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 14), material(value));
      ball.position.y = y;
      trunk.add(ball);
    };
    cap(9.9, 5.2 * VALUE_UNIT, CHROMA_UNIT * 1.4);
    cap(0.4, -5.2 * VALUE_UNIT, CHROMA_UNIT * 1.4);
    const axis = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -6 * VALUE_UNIT, 0), new THREE.Vector3(0, 6 * VALUE_UNIT, 0)]);
    trunk.add(new THREE.Line(axis, new THREE.LineBasicMaterial({ color: 0x1b2046, transparent: true, opacity: 0.25 })));
    this.group.add(trunk);

    const ring = [];
    for (let i = 0; i <= 120; i++) {
      const a = (i / 120) * TAU;
      ring.push(new THREE.Vector3(Math.cos(a) * 2.9, -5.6 * VALUE_UNIT, Math.sin(a) * 2.9));
    }
    this.ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring), new THREE.LineBasicMaterial({ color: 0x1b2046, transparent: true, opacity: 0.16 }));
    this.group.add(this.ring);
  }

  buildLabels() {
    this.labels = FAMILIES.map((family, i) => {
      const el = document.createElement('span');
      el.className = 'dd-tree-label';
      el.textContent = `5${family}`;
      el.setAttribute('aria-hidden', 'true');
      Object.assign(el.style, {
        position: 'absolute', left: '0', top: '0', pointerEvents: 'none',
        font: '10px var(--dd-mono)', letterSpacing: '0.14em', color: 'var(--ink-soft)',
        padding: '2px 6px', borderRadius: '2px', background: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap'
      });
      this.host.append(el);
      const angle = ((5 + i * 10) / 100) * TAU;
      return { el, point: new THREE.Vector3(Math.cos(angle) * 3.15, -5.6 * VALUE_UNIT, Math.sin(angle) * 3.15) };
    });
  }

  facingHue() {
    return ((((this.rotation.y + Math.PI / 2) / TAU) * 100) % 100 + 100) % 100;
  }

  included(i) {
    const { gamut, book, h } = this.data;
    if (this.set === 'book' && !book[i]) return false;
    if (this.set === 'screen' && gamut[i] < 2) return false;
    if (this.cut !== null) {
      const gap = Math.abs((((h[i] - this.cut) % 100) + 150) % 100 - 50);
      if (gap < 12.6) return false;
    }
    return true;
  }

  retarget() {
    const random = mulberry(7);
    for (let i = 0; i < this.data.count; i++) {
      this.target[i] = this.included(i) ? 1 : 0;
      this.delay[i] = random() * 0.35;
    }
    this.transition = still ? 1 : 0;
    this.updateReadout();
    if (!this.active) {
      this.transition = 1;
      this.scale.set(this.target);
      this.writeMatrices();
      this.draw();
    }
  }

  writeMatrices(initial = false) {
    const d = this.dummy;
    const b = this.base;
    for (let i = 0; i < this.data.count; i++) {
      const o = i * 6;
      const s = initial ? (still ? this.target[i] : 0) : this.scale[i];
      if (initial) this.scale[i] = s;
      d.position.set(b[o], b[o + 1], b[o + 2]);
      d.rotation.set(0, b[o + 3], 0);
      d.scale.set(CHROMA_UNIT * 1.88 * s, VALUE_UNIT * 0.9 * s, b[o + 4] * s);
      d.updateMatrix();
      this.mesh.setMatrixAt(i, d.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  animate(dt) {
    let moving = false;
    if (this.grow < 1.6) {
      this.grow = Math.min(1.6, this.grow + dt * 0.6);
      for (let i = 0; i < this.data.count; i++) {
        const t = Math.min(1, Math.max(0, (this.grow - this.delay[i]) / 0.55));
        this.scale[i] = ease(t) * this.target[i];
      }
      moving = true;
    } else if (this.transition < 1) {
      this.transition = Math.min(1, this.transition + dt * 1.4);
      for (let i = 0; i < this.data.count; i++) {
        const t = Math.min(1, Math.max(0, (this.transition * 1.35 - this.delay[i]) / 0.6));
        const k = 1 - (1 - t) ** 3;
        this.scale[i] += (this.target[i] - this.scale[i]) * k;
      }
      moving = true;
    }
    if (moving) this.writeMatrices();
  }

  resize() {
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(devicePixelRatio || 1, 1.75) * pageScale();
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    const distance = this.explore ? 11.2 : 10.4;
    const fit = this.camera.aspect < 1 ? distance / Math.max(0.55, this.camera.aspect) : distance;
    this.camera.position.set(0, fit * (this.explore ? 0.16 : 0.11), fit);
    this.camera.lookAt(0, -0.05, 0);
    this.camera.updateProjectionMatrix();
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

  bindDrag() {
    const canvas = this.renderer.domElement;
    let drag = null;
    canvas.style.touchAction = 'pan-y';
    canvas.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
      this.host.classList.add('is-dragging');
    });
    canvas.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.pointer.px = (e.clientX - rect.left) / rect.width;
      this.pointer.py = (e.clientY - rect.top) / rect.height;
      this.pointer.inside = true;
      this.pointer.dirty = true;
      if (!drag) return;
      const dx = (e.clientX - drag.x) / rect.width;
      const dy = (e.clientY - drag.y) / rect.height;
      this.rotation.y += dx * 3.4;
      this.rotation.x = THREE.MathUtils.clamp(this.rotation.x + dy * 2.4, -0.2, 1.05);
      this.rotation.velocity = dx * 160;
      drag.x = e.clientX;
      drag.y = e.clientY;
      if (!this.active) this.draw();
    });
    const release = () => {
      drag = null;
      this.host.classList.remove('is-dragging');
      if (!this.explore && this.cut !== null) {
        this.cut = this.facingHue();
        this.retarget();
      }
    };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('pointerleave', () => {
      this.pointer.inside = false;
      if (this.tip) this.tip.hidden = true;
    });
  }

  bindControls() {
    const buttons = [...this.figure.querySelectorAll('[data-set]')];
    for (const button of buttons) {
      button.addEventListener('click', () => {
        this.set = button.dataset.set;
        buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
        this.retarget();
      });
    }
    const cut = this.figure.querySelector('[data-cut]');
    cut?.addEventListener('click', () => {
      const on = cut.getAttribute('aria-pressed') !== 'true';
      cut.setAttribute('aria-pressed', String(on));
      if (on) {
        this.cut = this.facingHue();
      } else {
        this.cut = null;
      }
      this.retarget();
    });
  }

  updateReadout() {
    if (!this.readout) return;
    let shown = 0;
    for (let i = 0; i < this.data.count; i++) if (this.included(i)) shown++;
    const words = {
      real: 'todos los colores reales de la renotación de 1943',
      book: 'las fichas del Munsell Book of Color de 1929',
      screen: 'los colores reales que caben en sRGB'
    };
    this.readout.textContent = `${shown.toLocaleString('es')} bloques · ${words[this.set]}${this.cut !== null ? ' · con un corte' : ''}`;
  }

  pick() {
    this.pointer.dirty = false;
    if (!this.pointer.inside || !this.tip) return;
    this.raycaster ??= new THREE.Raycaster();
    this.raycaster.setFromCamera(new THREE.Vector2(this.pointer.x, this.pointer.y), this.camera);
    const hit = this.raycaster.intersectObject(this.mesh, false)[0];
    if (!hit || hit.instanceId === undefined || this.scale[hit.instanceId] < 0.5) {
      this.tip.hidden = true;
      return;
    }
    const i = hit.instanceId;
    const { h, v, c, gamut, book, hex } = this.data;
    const swatch = document.createElement('i');
    swatch.style.background = hex[i];
    const title = document.createElement('b');
    title.textContent = notation(h[i], v[i], c[i], 0);
    const lines = [
      `tono ${notation(h[i], v[i], c[i], 0).split(' ')[0]} · valor ${v[i]} · croma ${c[i]}`,
      `${gamut[i] === 2 ? 'cabe en tu pantalla' : gamut[i] === 1 ? 'solo cabe en pantallas P3' : 'no cabe en ninguna pantalla común'}${book[i] ? ' · estaba en 1929' : ''}`
    ];
    const text = document.createElement('span');
    text.append(lines[0], document.createElement('br'), lines[1]);
    this.tip.replaceChildren(swatch, title, text);
    this.tip.style.left = `${this.pointer.px * this.host.clientWidth}px`;
    this.tip.style.top = `${this.pointer.py * this.host.clientHeight}px`;
    this.tip.classList.toggle('is-flipped', this.pointer.px > 0.58);
    this.tip.hidden = false;
  }

  placeLabels() {
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    const p = new THREE.Vector3();
    this.group.updateMatrixWorld();
    for (const label of this.labels) {
      p.copy(label.point).applyMatrix4(this.group.matrixWorld);
      const depth = p.z;
      p.project(this.camera);
      const x = (p.x * 0.5 + 0.5) * width;
      const y = (0.5 - p.y * 0.5) * height;
      label.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
      label.el.style.opacity = String(Math.max(0.15, Math.min(1, 0.55 + depth * 0.18)));
    }
  }

  loop(now) {
    if (!this.active) return;
    this.frame = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (!still) {
      const dragging = this.host.classList.contains('is-dragging');
      this.rotation.velocity *= 0.92;
      if (this.explore) {
        this.rotation.y += (this.rotation.velocity + (dragging ? 0 : 0.12)) * dt;
      } else if (dragging || Math.abs(this.rotation.velocity) > 0.02) {
        this.rotation.y += this.rotation.velocity * dt;
        this.rotation.base = this.rotation.y - Math.sin(this.sway) * 0.42;
      } else {
        this.sway += dt * 0.32;
        this.rotation.y = this.rotation.base + Math.sin(this.sway) * 0.42;
      }
      this.animate(dt);
    } else if (this.transition < 1) {
      this.transition = 1;
      this.scale.set(this.target);
      this.writeMatrices();
    }
    this.draw();
    if (this.pointer.dirty) this.pick();
  }

  draw() {
    this.group.rotation.set(0, this.rotation.y, 0);
    this.scene.rotation.x = this.rotation.x - 0.3;
    this.placeLabels();
    this.renderer.render(this.scene, this.camera);
  }
}

export async function mount(host) {
  const data = await loadMunsell();
  return new Tree(host, data);
}
