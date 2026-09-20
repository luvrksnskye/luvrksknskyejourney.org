const STAGE_GLYPH = { nebula: 'dust', protostar: 'cross', 'main-sequence': 'bracket', giant: 'ring', remnant: 'hollow' };
const ENTER = 4600;
const LEAVE = 900;
const SPAN = 130;
const MONO = '"departure mono", ui-monospace, monospace';

const ease = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const code = (n) => String(n).padStart(3, '0');
const noise = (i) => {
  const x = Math.sin(i * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

function layout(nodes, links) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  nodes.forEach((node, index) => {
    const y = nodes.length === 1 ? 0 : 1 - (index / (nodes.length - 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = golden * index;
    const shell = SPAN * (0.45 + 0.55 * Math.sqrt((index + 1) / nodes.length));
    node.x = Math.cos(angle) * ring * shell;
    node.y = y * shell * 0.45;
    node.z = Math.sin(angle) * ring * shell;
  });

  const byId = new Map(nodes.map((node) => [node.id, node]));
  for (let round = 0; round < 160; round++) {
    const cooling = 1 - round / 160;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dz = b.z - a.z;
        const distance = Math.max(6, Math.hypot(dx, dy, dz));
        const push = (1500 / (distance * distance)) * cooling / distance;
        dx *= push; dy *= push; dz *= push;
        a.x -= dx; a.y -= dy; a.z -= dz;
        b.x += dx; b.y += dy; b.z += dz;
      }
    }
    for (const link of links) {
      const a = byId.get(link.from);
      const b = byId.get(link.to);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dz = b.z - a.z;
      const distance = Math.max(1, Math.hypot(dx, dy, dz));
      const pull = ((distance - 62) / distance) * 0.05 * cooling;
      a.x += dx * pull; a.y += dy * pull; a.z += dz * pull;
      b.x -= dx * pull; b.y -= dy * pull; b.z -= dz * pull;
    }
  }

  let reach = 1;
  nodes.forEach((node, i) => {
    node.home = { x: node.x, y: node.y, z: node.z };
    node.seed = i * 1.7;
    reach = Math.max(reach, Math.hypot(node.x, node.y, node.z));
  });
  for (const node of nodes) node.reach = Math.hypot(node.x, node.y, node.z) / reach;
  nodes.spread = reach;
  return nodes;
}

function elbow(a, b, bias) {
  const mid = bias % 3;
  const points = [{ x: a.x, y: a.y, z: a.z }];
  if (mid === 0) points.push({ x: b.x, y: a.y, z: a.z }, { x: b.x, y: b.y, z: a.z });
  else if (mid === 1) points.push({ x: a.x, y: b.y, z: a.z }, { x: b.x, y: b.y, z: a.z });
  else points.push({ x: a.x, y: a.y, z: b.z }, { x: b.x, y: a.y, z: b.z });
  points.push({ x: b.x, y: b.y, z: b.z });
  return points;
}

function strand(spread, seed) {
  const angle = seed * 2.399;
  const lift = Math.sin(seed * 1.31) * 0.62;
  const ring = Math.cos(seed * 0.77);
  const length = spread * (0.55 + noise(seed) * 1.15);
  const dir = { x: Math.cos(angle) * ring, y: lift, z: Math.sin(angle) * ring };
  const norm = Math.hypot(dir.x, dir.y, dir.z) || 1;
  dir.x /= norm; dir.y /= norm; dir.z /= norm;
  const at = (f) => ({ x: dir.x * length * f, y: dir.y * length * f, z: dir.z * length * f });
  const a = at(0.05);
  const b = at(0.42);
  const c = at(0.74);
  const d = at(1);
  return [a, { x: b.x, y: a.y, z: b.z }, b, { x: c.x, y: b.y, z: c.z }, c, { x: d.x, y: c.y, z: d.z }, d];
}

function fragments(spread, count) {
  return Array.from({ length: count }, (_, i) => {
    const angle = noise(i * 3.1) * Math.PI * 2;
    const radius = spread * (0.6 + noise(i * 5.7) * 4.2);
    return {
      x: Math.cos(angle) * radius,
      y: (noise(i * 7.3) - 0.5) * spread * 2.6,
      z: Math.sin(angle) * radius,
      w: 1 + noise(i * 11.9) * 9,
      h: noise(i * 13.7) > 0.86 ? 2 : 1,
      lit: noise(i * 17.3)
    };
  });
}

export class Scene {
  constructor(canvas, stars, links, hooks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.hooks = hooks;
    this.quiet = matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.nodes = layout(stars.map((star, i) => ({ ...star, no: i + 1 })), links);
    this.spread = Math.max(this.nodes.spread, 96);
    this.index = new Map(this.nodes.map((node, i) => [node.id, i]));
    this.links = links
      .filter((link) => this.index.has(link.from) && this.index.has(link.to))
      .map((link, i) => ({
        a: this.nodes[this.index.get(link.from)],
        b: this.nodes[this.index.get(link.to)],
        bias: i,
        heat: 0
      }));

    this.mesh = [];
    const close = this.spread * 1.15;
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const a = this.nodes[i];
        const b = this.nodes[j];
        if (Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < close) this.mesh.push([a, b]);
      }
    }

    this.strands = Array.from({ length: 46 }, (_, i) => strand(this.spread, i + 1));
    this.field = fragments(this.spread, 620);

    this.wide = this.spread * 3.2;
    this.view = { yaw: 0.6, pitch: 0.26, distance: this.wide, cx: 0, cy: 0, cz: 0 };
    this.want = { yaw: 0.6, pitch: 0.26, distance: this.wide, cx: 0, cy: 0, cz: 0 };
    this.layers = { depth: false, strands: true, floor: true, mesh: false, index: false, labels: true, compass: true };
    this.spin = true;
    this.focal = 900;
    this.time = 0;
    this.last = performance.now();
    this.reveal = this.quiet ? 1 : 0;
    this.fade = this.quiet ? 1 : 0;
    this.hover = null;
    this.selected = null;
    this.ping = null;
    this.phase = 'enter';
    this.pointer = { x: -1e4, y: -1e4 };
    this.drag = null;
    this.screen = new Map();

    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    this.bind();
    this.resize();
    this.handle = requestAnimationFrame(this.frame);
  }

  bind() {
    addEventListener('resize', this.resize);
    const canvas = this.canvas;
    canvas.addEventListener('pointermove', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.pointer.x = event.clientX - rect.left;
      this.pointer.y = event.clientY - rect.top;
      if (this.drag) {
        this.want.yaw -= (event.clientX - this.drag.x) * 0.005;
        this.want.pitch = clamp(this.want.pitch + (event.clientY - this.drag.y) * 0.004, -0.85, 0.85);
        this.drag = { x: event.clientX, y: event.clientY, moved: true };
      }
    });
    canvas.addEventListener('pointerdown', (event) => {
      canvas.setPointerCapture(event.pointerId);
      this.drag = { x: event.clientX, y: event.clientY, moved: false };
      canvas.style.cursor = 'grabbing';
    });
    canvas.addEventListener('pointerup', () => {
      const moved = this.drag?.moved;
      this.drag = null;
      canvas.style.cursor = this.hover ? 'pointer' : 'grab';
      if (!moved) this.select(this.hover);
    });
    canvas.addEventListener('pointerleave', () => {
      this.drag = null;
      this.pointer.x = -1e4;
    });
    canvas.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault();
        this.zoom(event.deltaY > 0 ? 1.1 : 0.9);
      },
      { passive: false }
    );
  }

  resize() {
    const ratio = Math.min(2, devicePixelRatio || 1);
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.round(rect.width * ratio);
    this.canvas.height = Math.round(rect.height * ratio);
    this.ratio = ratio;
    this.w = rect.width;
    this.h = rect.height;
    this.focal = Math.max(700, rect.width * 0.78);
  }

  project(point) {
    point = { x: point.x - this.view.cx, y: point.y - this.view.cy, z: point.z - this.view.cz };
    const cosY = Math.cos(this.view.yaw);
    const sinY = Math.sin(this.view.yaw);
    const cosP = Math.cos(this.view.pitch);
    const sinP = Math.sin(this.view.pitch);
    const x = point.x * cosY - point.z * sinY;
    let z = point.x * sinY + point.z * cosY;
    const y = point.y * cosP - z * sinP;
    z = point.y * sinP + z * cosP + this.view.distance;
    if (z < 14) return null;
    const k = this.focal / z;
    return { x: this.w / 2 + x * k, y: this.h * 0.47 + y * k, z, k };
  }

  select(node) {
    this.selected = node ?? null;
    this.ping = node ? { node, age: 0 } : null;
    if (node) {
      this.want.cx = node.home.x;
      this.want.cy = node.home.y;
      this.want.cz = node.home.z;
      this.want.distance = Math.min(this.want.distance, this.wide * 0.6);
    } else {
      this.want.cx = 0;
      this.want.cy = 0;
      this.want.cz = 0;
      this.want.distance = this.wide;
    }
    this.hooks.onSelect?.(node ?? null);
  }

  toggle(layer) {
    if (!(layer in this.layers)) return null;
    this.layers[layer] = !this.layers[layer];
    this.hooks.onLayers?.({ ...this.layers });
    return this.layers[layer];
  }

  orbit(dx, dy) {
    this.want.yaw += dx;
    this.want.pitch = clamp(this.want.pitch + dy, -0.85, 0.85);
  }

  zoom(factor) {
    this.want.distance = clamp(this.want.distance * factor, this.spread * 0.5, this.wide * 2.6);
  }

  cycle(step) {
    if (!this.nodes.length) return null;
    const at = this.selected ? this.index.get(this.selected.id) : -1;
    const next = ((at + step) % this.nodes.length + this.nodes.length) % this.nodes.length;
    const node = this.nodes[next];
    this.want.yaw = Math.atan2(node.home.x, node.home.z) - 0.5;
    this.select(node);
    return node;
  }

  rest() {
    this.spin = !this.spin;
    return this.spin;
  }

  focusOnId(id) {
    const at = this.index.get(id);
    if (at === undefined) return;
    const node = this.nodes[at];
    this.want.yaw = Math.atan2(node.home.x, node.home.z) - 0.5;
    this.select(node);
  }

  screenOf(node) {
    const at = this.screen.get(node.id);
    return { x: at?.x ?? 0, y: at?.y ?? 0, visible: Boolean(at) };
  }

  leave() {
    this.phase = 'leave';
    this.leaveAt = this.time;
    return LEAVE;
  }

  destroy() {
    cancelAnimationFrame(this.handle);
    removeEventListener('resize', this.resize);
  }

  pick() {
    let best = null;
    let distance = 32;
    for (const node of this.nodes) {
      const at = this.screen.get(node.id);
      if (!at) continue;
      const away = Math.hypot(at.x - this.pointer.x, at.y - this.pointer.y);
      if (away < distance) {
        distance = away;
        best = node;
      }
    }
    return best;
  }

  frame(now) {
    this.handle = requestAnimationFrame(this.frame);
    const delta = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += delta * 1000;

    if (this.phase === 'enter') {
      const t = clamp(this.time / ENTER, 0, 1);
      this.reveal = this.quiet ? 1 : ease(clamp(t * 1.4, 0, 1));
      this.fade = this.quiet ? 1 : clamp(t * 2.6, 0, 1);
      const travel = easeInOut(clamp((this.time - 600) / (ENTER - 600), 0, 1));
      this.view.distance = this.spread * 0.2 + travel * (this.wide - this.spread * 0.2);
      this.view.yaw = 0.35 + travel * 1.05;
      this.view.pitch = 0.02 + travel * 0.24;
      this.want.distance = this.view.distance;
      this.want.yaw = this.view.yaw;
      this.want.pitch = this.view.pitch;
      if (t >= 1) {
        this.phase = 'live';
        this.hooks.onReady?.();
      }
    } else if (this.phase === 'leave') {
      const t = clamp((this.time - this.leaveAt) / LEAVE, 0, 1);
      this.view.distance = this.wide * (1 - easeInOut(t)) + this.spread * 0.06;
      this.fade = 1 - t;
    } else {
      if (!this.quiet && this.spin && !this.drag) this.want.yaw += delta * 0.04;
      const glide = 1 - Math.pow(0.0016, delta);
      this.view.yaw += (this.want.yaw - this.view.yaw) * glide;
      this.view.pitch += (this.want.pitch - this.view.pitch) * glide;
      this.view.distance += (this.want.distance - this.view.distance) * glide;
      this.view.cx += (this.want.cx - this.view.cx) * glide;
      this.view.cy += (this.want.cy - this.view.cy) * glide;
      this.view.cz += (this.want.cz - this.view.cz) * glide;
    }

    if (!this.quiet) {
      for (const node of this.nodes) {
        node.x = node.home.x + Math.sin(this.time / 2100 + node.seed) * this.spread * 0.012;
        node.y = node.home.y + Math.cos(this.time / 2500 + node.seed) * this.spread * 0.012;
        node.z = node.home.z + Math.sin(this.time / 2900 + node.seed * 1.3) * this.spread * 0.012;
      }
    }

    this.draw();

    const found = this.phase === 'live' ? this.pick() : null;
    if (found !== this.hover) {
      this.hover = found;
      this.canvas.style.cursor = found ? 'pointer' : 'grab';
      this.hooks.onHover?.(found ?? null);
    }
    this.hooks.onFrame?.(this);
  }

  ink(alpha) {
    return `rgba(255, 255, 255, ${clamp(alpha * this.fade, 0, 1)})`;
  }

  line(points, grow = 1) {
    const ctx = this.ctx;
    ctx.beginPath();
    let started = false;
    const total = points.length - 1;
    for (let i = 0; i < points.length; i++) {
      if (total > 0 && i / total > grow) break;
      const at = this.project(points[i]);
      if (!at) {
        started = false;
        continue;
      }
      if (!started) {
        ctx.moveTo(at.x, at.y);
        started = true;
      } else {
        ctx.lineTo(at.x, at.y);
      }
    }
    ctx.stroke();
  }

  draw() {
    const ctx = this.ctx;
    ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    ctx.lineWidth = 1;

    this.screen.clear();
    for (const node of this.nodes) {
      const at = this.project(node);
      if (at && node.reach <= this.reveal + 0.02) this.screen.set(node.id, at);
    }

    if (this.layers.depth) this.drawDeep();
    if (this.layers.floor) this.drawFloor();
    this.drawCore();
    if (this.layers.strands) this.drawStrands();
    if (this.layers.mesh) this.drawMesh();
    this.drawLinks();
    this.drawNodes();
    this.drawPing();
    if (this.layers.index) this.drawSheet();
    if (this.layers.compass) this.drawCompass();
  }

  drawDeep() {
    const ctx = this.ctx;
    for (const bit of this.field) {
      const at = this.project(bit);
      if (!at) continue;
      const near = clamp(at.k * 1.6, 0.05, 1);
      ctx.fillStyle = this.ink((bit.lit > 0.93 ? 0.5 : 0.14) * near * this.reveal);
      ctx.fillRect(at.x, at.y, Math.max(0.6, bit.w * at.k), Math.max(0.6, bit.h * at.k));
    }
  }

  drawFloor() {
    const ctx = this.ctx;
    const floor = this.spread * 0.95;
    const rings = 7;
    for (let r = 1; r <= rings; r++) {
      const radius = (this.spread * 2.1 * r) / rings;
      if (radius / (this.spread * 2.1) > this.reveal * 1.2) continue;
      ctx.strokeStyle = this.ink(0.05);
      ctx.beginPath();
      let started = false;
      for (let a = 0; a <= 64; a++) {
        const angle = (a / 64) * Math.PI * 2;
        const at = this.project({ x: Math.cos(angle) * radius, y: floor, z: Math.sin(angle) * radius });
        if (!at) {
          started = false;
          continue;
        }
        if (!started) {
          ctx.moveTo(at.x, at.y);
          started = true;
        } else {
          ctx.lineTo(at.x, at.y);
        }
      }
      ctx.stroke();
    }

    for (let i = 0; i < 380; i++) {
      const angle = noise(i * 2.7) * Math.PI * 2;
      const radius = this.spread * 2.1 * Math.sqrt(noise(i * 4.3));
      if (radius / (this.spread * 2.1) > this.reveal * 1.2) continue;
      const at = this.project({ x: Math.cos(angle) * radius, y: floor, z: Math.sin(angle) * radius });
      if (!at) continue;
      ctx.fillStyle = this.ink(0.2 * clamp(at.k * 1.3, 0.06, 1));
      ctx.fillRect(at.x, at.y, clamp(at.k, 0.5, 1.4), clamp(at.k, 0.5, 1.4));
    }
  }

  drawCore() {
    const ctx = this.ctx;
    const spin = this.time / 9000;
    for (let ring = 0; ring < 3; ring++) {
      const radius = this.spread * (0.16 + ring * 0.1);
      const ticks = 48 + ring * 24;
      const turn = spin * (ring % 2 === 0 ? 1 : -1) * (1 + ring * 0.4);
      ctx.strokeStyle = this.ink(ring === 1 ? 0.22 : 0.12);
      ctx.beginPath();
      let started = false;
      for (let a = 0; a <= 72; a++) {
        const angle = (a / 72) * Math.PI * 2;
        const at = this.project({ x: Math.cos(angle) * radius, y: 0, z: Math.sin(angle) * radius });
        if (!at) {
          started = false;
          continue;
        }
        if (!started) {
          ctx.moveTo(at.x, at.y);
          started = true;
        } else {
          ctx.lineTo(at.x, at.y);
        }
      }
      ctx.stroke();

      ctx.strokeStyle = this.ink(0.3);
      ctx.beginPath();
      for (let t = 0; t < ticks; t++) {
        const angle = (t / ticks) * Math.PI * 2 + turn;
        const long = t % 6 === 0;
        if (!long && ring !== 1) continue;
        const inner = radius * (long ? 0.93 : 0.97);
        const a = this.project({ x: Math.cos(angle) * inner, y: 0, z: Math.sin(angle) * inner });
        const b = this.project({ x: Math.cos(angle) * radius, y: 0, z: Math.sin(angle) * radius });
        if (!a || !b) continue;
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();
    }

    const middle = this.project({ x: 0, y: 0, z: 0 });
    if (middle) {
      ctx.strokeStyle = this.ink(0.5);
      ctx.beginPath();
      ctx.moveTo(middle.x - 9, middle.y);
      ctx.lineTo(middle.x + 9, middle.y);
      ctx.moveTo(middle.x, middle.y - 9);
      ctx.lineTo(middle.x, middle.y + 9);
      ctx.stroke();
    }
  }

  drawStrands() {
    const ctx = this.ctx;
    const grow = clamp((this.reveal - 0.03) * 1.5, 0, 1);
    if (grow <= 0) return;
    this.strands.forEach((points, i) => {
      ctx.strokeStyle = this.ink(0.07 + (i % 5) * 0.012);
      this.line(points, grow);
      const tip = this.project(points[Math.max(1, Math.round((points.length - 1) * grow))]);
      if (tip) {
        ctx.fillStyle = this.ink(0.35);
        ctx.fillRect(tip.x - 1, tip.y - 1, 2, 2);
      }
    });
  }

  drawMesh() {
    const ctx = this.ctx;
    ctx.strokeStyle = this.ink(0.06);
    for (const [a, b] of this.mesh) {
      if (Math.max(a.reach, b.reach) > this.reveal) continue;
      const pa = this.project(a);
      const pb = this.project(b);
      if (!pa || !pb) continue;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }
  }

  drawLinks() {
    const ctx = this.ctx;
    const marked = this.hover ?? this.selected;
    for (const link of this.links) {
      const lit = marked && (link.a.id === marked.id || link.b.id === marked.id);
      link.heat += ((lit ? 1 : 0) - link.heat) * 0.18;
      const grow = clamp((this.reveal - Math.min(link.a.reach, link.b.reach)) * 3, 0, 1);
      if (grow <= 0) continue;
      const points = elbow(link.a, link.b, link.bias);
      ctx.lineWidth = 1 + link.heat;
      ctx.strokeStyle = this.ink((marked ? 0.14 : 0.42) + link.heat * 0.7);
      this.line(points, grow);
      ctx.lineWidth = 1;

      if (!this.quiet && grow >= 1) {
        const total = points.length - 1;
        const t = ((this.time / 2600 + link.bias * 0.37) % 1) * total;
        const at = this.project(points[Math.min(total, Math.floor(t))]);
        const next = this.project(points[Math.min(total, Math.floor(t) + 1)]);
        if (at && next) {
          const f = t % 1;
          ctx.fillStyle = this.ink(0.55 + link.heat * 0.45);
          ctx.fillRect(at.x + (next.x - at.x) * f - 1.5, at.y + (next.y - at.y) * f - 1.5, 3, 3);
        }
      }
    }
  }

  glyph(node, at, lit) {
    const ctx = this.ctx;
    const kind = STAGE_GLYPH[node.stage] ?? 'bracket';
    const size = clamp(at.k * 15, 5, 24);
    ctx.strokeStyle = this.ink(lit ? 1 : 0.7);
    ctx.fillStyle = this.ink(lit ? 1 : 0.7);

    if (kind === 'dust') {
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2 + node.seed;
        const radius = size * (0.5 + (i % 3) * 0.22);
        ctx.fillStyle = this.ink((lit ? 0.8 : 0.45));
        ctx.fillRect(at.x + Math.cos(angle) * radius, at.y + Math.sin(angle) * radius, 1.5, 1.5);
      }
      ctx.fillStyle = this.ink(lit ? 1 : 0.7);
      ctx.fillRect(at.x - 1.5, at.y - 1.5, 3, 3);
    } else if (kind === 'cross') {
      ctx.beginPath();
      ctx.moveTo(at.x - size, at.y);
      ctx.lineTo(at.x - size * 0.3, at.y);
      ctx.moveTo(at.x + size * 0.3, at.y);
      ctx.lineTo(at.x + size, at.y);
      ctx.moveTo(at.x, at.y - size);
      ctx.lineTo(at.x, at.y - size * 0.3);
      ctx.moveTo(at.x, at.y + size * 0.3);
      ctx.lineTo(at.x, at.y + size);
      ctx.stroke();
      ctx.fillRect(at.x - 2, at.y - 2, 4, 4);
    } else if (kind === 'ring') {
      ctx.beginPath();
      ctx.arc(at.x, at.y, size, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i < 32; i++) {
        const angle = (i / 32) * Math.PI * 2;
        const inner = size * (i % 8 === 0 ? 0.7 : 0.87);
        ctx.moveTo(at.x + Math.cos(angle) * inner, at.y + Math.sin(angle) * inner);
        ctx.lineTo(at.x + Math.cos(angle) * size, at.y + Math.sin(angle) * size);
      }
      ctx.stroke();
      ctx.fillRect(at.x - 2.5, at.y - 2.5, 5, 5);
    } else if (kind === 'hollow') {
      ctx.strokeRect(at.x - size * 0.6, at.y - size * 0.6, size * 1.2, size * 1.2);
      ctx.fillRect(at.x - 1, at.y - 1, 2, 2);
    } else {
      const arm = size * 0.5;
      ctx.beginPath();
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        ctx.moveTo(at.x + sx * size - sx * arm, at.y + sy * size);
        ctx.lineTo(at.x + sx * size, at.y + sy * size);
        ctx.lineTo(at.x + sx * size, at.y + sy * size - sy * arm);
      }
      ctx.stroke();
      ctx.fillRect(at.x - 2.5, at.y - 2.5, 5, 5);
    }

    if (lit) this.reticle(at, size);
    return size;
  }

  reticle(at, size) {
    const ctx = this.ctx;
    const radius = size * 2.4;
    const turn = this.time / 2600;
    ctx.strokeStyle = this.ink(0.75);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const from = turn + (i / 4) * Math.PI * 2 + 0.18;
      const to = from + Math.PI / 2 - 0.36;
      ctx.arc(at.x, at.y, radius, from, to);
      ctx.moveTo(at.x + Math.cos(to) * radius, at.y + Math.sin(to) * radius);
    }
    ctx.stroke();

    ctx.strokeStyle = this.ink(0.45);
    ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2 - turn * 0.6;
      const inner = radius * 1.22;
      const outer = radius * (i % 6 === 0 ? 1.42 : 1.32);
      ctx.moveTo(at.x + Math.cos(angle) * inner, at.y + Math.sin(angle) * inner);
      ctx.lineTo(at.x + Math.cos(angle) * outer, at.y + Math.sin(angle) * outer);
    }
    ctx.stroke();
  }

  label(node, at, size, lit) {
    const ctx = this.ctx;
    const alpha = lit ? 1 : 0.42;
    const up = 28;
    const out = 30;
    ctx.font = `10px ${MONO}`;
    const title = node.title.toUpperCase();
    const width = Math.max(ctx.measureText(title).width, 86) + 18;
    const flip = at.x + size + up + out + width > this.w - 80;
    const way = flip ? -1 : 1;
    const anchorX = at.x + size * 0.75 * way;
    const anchorY = clamp(at.y - size * 0.75, 110, this.h - 120);

    ctx.strokeStyle = this.ink(alpha * 0.75);
    ctx.beginPath();
    ctx.moveTo(anchorX, anchorY);
    ctx.lineTo(anchorX + up * way, anchorY - up);
    ctx.lineTo(anchorX + (up + out) * way, anchorY - up);
    ctx.stroke();
    ctx.fillStyle = this.ink(alpha * 0.75);
    ctx.fillRect(anchorX + (up + out) * way - (flip ? 0 : 0) - 1, anchorY - up - 1, 2, 2);

    const x = flip ? anchorX - (up + out) - width : anchorX + up + out;
    const y = anchorY - up;
    ctx.fillStyle = this.ink(0.9 * 0.9);
    ctx.fillStyle = `rgba(0, 0, 0, ${0.85 * this.fade})`;
    ctx.fillRect(x, y - 15, width, 30);
    ctx.strokeStyle = this.ink(alpha);
    ctx.strokeRect(x, y - 15, width, 30);
    ctx.fillStyle = this.ink(alpha);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(title, x + 9, y - 1);
    ctx.font = `8px ${MONO}`;
    ctx.fillStyle = this.ink(alpha * 0.6);
    ctx.fillText(`NODE ${code(node.no)} · ${node.domain.toUpperCase()} · ${node.stage.toUpperCase()}`, x + 9, y + 10);
  }

  drawNodes() {
    const marked = this.hover ?? this.selected;
    const ordered = [...this.screen.entries()].sort((a, b) => b[1].z - a[1].z);
    const near = new Set(
      [...this.screen.entries()].sort((a, b) => a[1].z - b[1].z).slice(0, 5).map(([id]) => id)
    );
    for (const [id, at] of ordered) {
      const node = this.nodes[this.index.get(id)];
      const lit = marked?.id === id;
      const size = this.glyph(node, at, lit);
      if (this.layers.labels && (lit || (!marked && near.has(id)))) this.label(node, at, size, lit);
    }
  }

  drawPing() {
    if (!this.ping) return;
    this.ping.age += 0.02;
    if (this.ping.age > 1) {
      this.ping = null;
      return;
    }
    const at = this.screen.get(this.ping.node.id);
    if (!at) return;
    const ctx = this.ctx;
    ctx.strokeStyle = this.ink((1 - this.ping.age) * 0.55);
    ctx.beginPath();
    ctx.arc(at.x, at.y, 16 + this.ping.age * 110, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawSheet() {
    if (this.phase !== 'live' || this.w < 900) return;
    const ctx = this.ctx;
    const marked = this.hover ?? this.selected;
    const rows = this.nodes.slice(0, 12);
    const left = 58;
    const top = this.h * 0.5 - (rows.length * 22) / 2;
    ctx.font = `8px ${MONO}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    rows.forEach((node, i) => {
      const y = top + i * 22;
      const lit = marked?.id === node.id;
      const alpha = lit ? 0.9 : 0.3;
      ctx.strokeStyle = this.ink(alpha * 0.8);
      ctx.strokeRect(left, y - 8, 16, 16);
      ctx.fillStyle = this.ink(alpha);
      if (lit) ctx.fillRect(left + 4, y - 4, 8, 8);
      ctx.fillText(`${code(node.no)}  ${node.stage.toUpperCase()}`, left + 24, y);

      const at = this.screen.get(node.id);
      if (!at) return;
      ctx.strokeStyle = this.ink(lit ? 0.4 : 0.09);
      ctx.beginPath();
      ctx.moveTo(left + 150, y);
      ctx.lineTo(left + 178, y);
      ctx.lineTo(at.x, at.y);
      ctx.stroke();
    });

    ctx.strokeStyle = this.ink(0.18);
    ctx.beginPath();
    ctx.moveTo(left, top - 18);
    ctx.lineTo(left + 150, top - 18);
    ctx.moveTo(left, top + rows.length * 22 - 4);
    ctx.lineTo(left + 150, top + rows.length * 22 - 4);
    ctx.stroke();
    ctx.fillStyle = this.ink(0.35);
    ctx.fillText(`INDEX ${code(this.nodes.length)}`, left, top - 26);
  }

  drawCompass() {
    const ctx = this.ctx;
    const y = this.h - 54;
    const half = Math.min(this.w * 0.34, 340);
    const middle = this.w / 2;
    const degrees = ((this.view.yaw * 180) / Math.PI) % 360;
    ctx.font = `8px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    ctx.strokeStyle = this.ink(0.16);
    ctx.beginPath();
    ctx.moveTo(middle - half, y);
    ctx.lineTo(middle + half, y);
    ctx.stroke();

    for (let step = -12; step <= 12; step++) {
      const mark = Math.round((degrees + step * 5) / 5) * 5;
      const offset = ((mark - degrees) / 60) * half;
      if (Math.abs(offset) > half) continue;
      const tall = ((mark % 15) + 15) % 15 === 0;
      const alpha = 0.3 * (1 - Math.abs(offset) / half);
      ctx.strokeStyle = this.ink(alpha + 0.08);
      ctx.beginPath();
      ctx.moveTo(middle + offset, y);
      ctx.lineTo(middle + offset, y + (tall ? 9 : 5));
      ctx.stroke();
      if (tall) {
        ctx.fillStyle = this.ink(alpha + 0.12);
        ctx.fillText(code(((mark % 360) + 360) % 360), middle + offset, y + 12);
      }
    }

    ctx.fillStyle = this.ink(0.7);
    ctx.beginPath();
    ctx.moveTo(middle, y - 7);
    ctx.lineTo(middle - 4, y - 13);
    ctx.lineTo(middle + 4, y - 13);
    ctx.closePath();
    ctx.fill();
  }
}
