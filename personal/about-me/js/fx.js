const CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/';
const NS = 'http://www.w3.org/2000/svg';

export const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

let loading = null;
let uid = 0;

export function motion() {
  if (!loading) {
    loading = Promise.all([
      import(CDN + 'index.js'),
      import(CDN + 'DrawSVGPlugin.js'),
      import(CDN + 'ScrambleTextPlugin.js')
    ])
      .then(([core, draw, scramble]) => {
        const gsap = core.gsap || core.default;
        gsap.registerPlugin(draw.DrawSVGPlugin || draw.default, scramble.ScrambleTextPlugin || scramble.default);
        return gsap;
      })
      .catch(() => null);
  }
  return loading;
}

export function svg(tag, attrs = {}, parent = null) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (parent) parent.append(node);
  return node;
}

export function polar(cx, cy, r, deg) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [+(cx + r * Math.cos(a)).toFixed(2), +(cy + r * Math.sin(a)).toFixed(2)];
}

export function arc(cx, cy, r, from, to) {
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  return `M${x1} ${y1} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}

function layer(className) {
  let host = document.querySelector('.' + className);
  if (!host) {
    host = document.createElement('div');
    host.className = className;
    host.setAttribute('aria-hidden', 'true');
    document.body.append(host);
  }
  return host;
}

function gradient(defs, id, attrs, stops) {
  const node = svg('linearGradient', { id, ...attrs }, defs);
  for (const [offset, color, opacity] of stops) {
    svg('stop', { offset, 'stop-color': color, 'stop-opacity': opacity }, node);
  }
  return node;
}

const STAR = 'M0 -44 C3 -9 9 -3 44 0 C9 3 3 9 0 44 C-3 9 -9 3 -44 0 C-9 -3 -3 -9 0 -44Z';

export async function sparkle(x, y, size = 230) {
  if (still) return;
  const gsap = await motion();
  if (!gsap) return;

  const root = svg('svg', { viewBox: '-115 -115 230 230', width: size, height: size, class: 'ab-sparkle' });
  root.style.left = `${x - size / 2}px`;
  root.style.top = `${y - size / 2}px`;
  layer('ab-fx').append(root);

  const flare = svg('rect', { x: -115, y: -0.9, width: 230, height: 1.8, class: 'ab-sparkle-flare' }, root);
  const halo = svg('circle', { r: 30, class: 'ab-sparkle-halo' }, root);
  const ring = svg('circle', { r: 52, class: 'ab-sparkle-ring' }, root);
  const outer = svg('circle', { r: 72, class: 'ab-sparkle-ring is-thin' }, root);
  const rays = Array.from({ length: 8 }, (_, i) => {
    const deg = i * 45 + 22.5;
    const [x1, y1] = polar(0, 0, 20, deg);
    const [x2, y2] = polar(0, 0, i % 2 ? 64 : 90, deg);
    return svg('line', { x1, y1, x2, y2, class: 'ab-sparkle-ray' }, root);
  });
  const shards = Array.from({ length: 8 }, () => svg('path', { d: 'M0 -6 L3.4 3.6 L-3.4 3.6Z', class: 'ab-sparkle-shard' }, root));
  const star = svg('path', { d: STAR, class: 'ab-sparkle-star' }, root);
  const core = svg('circle', { r: 5, class: 'ab-sparkle-core' }, root);
  const motes = Array.from({ length: 12 }, (_, i) => svg('circle', { r: i % 3 ? 1.4 : 2.3, class: 'ab-sparkle-mote' }, root));

  const tl = gsap.timeline({ onComplete: () => root.remove() });
  tl.fromTo(flare, { scaleX: 0, opacity: 0, transformOrigin: '50% 50%' }, { scaleX: 1, opacity: 1, duration: 0.2, ease: 'expo.out' }, 0)
    .to(flare, { scaleX: 0.15, opacity: 0, duration: 0.5, ease: 'power2.in' }, 0.2)
    .fromTo([star, core], { scale: 0, rotation: -70, transformOrigin: '50% 50%' }, { scale: 1.15, rotation: 0, duration: 0.45, ease: 'back.out(2.2)' }, 0)
    .fromTo(halo, { scale: 0.2, opacity: 1, transformOrigin: '50% 50%' }, { scale: 2.2, opacity: 0, duration: 0.85, ease: 'expo.out' }, 0)
    .fromTo(rays, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.24, ease: 'expo.out', stagger: 0.01 }, 0.03)
    .to(rays, { drawSVG: '100% 100%', duration: 0.4, ease: 'power3.in', stagger: 0.01 }, 0.28)
    .fromTo(ring, { scale: 0.25, opacity: 0, transformOrigin: '50% 50%' }, { scale: 1, opacity: 1, duration: 0.5, ease: 'expo.out' }, 0.1)
    .to(ring, { rotation: 120, scale: 1.35, opacity: 0, duration: 0.8, ease: 'power2.in' }, 0.55)
    .fromTo(outer, { scale: 0.5, opacity: 0, transformOrigin: '50% 50%' }, { scale: 1.2, opacity: 0.85, duration: 0.6, ease: 'expo.out' }, 0.2)
    .to(outer, { rotation: -90, opacity: 0, duration: 0.6, ease: 'power2.in' }, 0.7)
    .to([star, core], { scale: 0.15, opacity: 0, duration: 0.55, ease: 'power3.in' }, 0.58);

  for (const shard of shards) {
    const deg = gsap.utils.random(0, 360);
    const [tx, ty] = polar(0, 0, gsap.utils.random(62, 108), deg);
    tl.fromTo(shard,
      { x: 0, y: 0, rotation: deg, scale: gsap.utils.random(0.8, 1.7), opacity: 1, transformOrigin: '50% 50%' },
      { x: tx, y: ty, rotation: deg + gsap.utils.random(-240, 240), opacity: 0, duration: gsap.utils.random(0.6, 0.95), ease: 'expo.out' },
      0.04);
  }

  motes.forEach((mote, i) => {
    const deg = (i / motes.length) * 360 + gsap.utils.random(-14, 14);
    const [fx, fy] = polar(0, 0, 18, deg);
    const [tx, ty] = polar(0, 0, gsap.utils.random(58, 98), deg);
    tl.fromTo(mote, { x: fx, y: fy, opacity: 0 }, { x: tx, y: ty, opacity: 1, duration: 0.55, ease: 'power2.out' }, 0.22)
      .to(mote, { opacity: 0, duration: 0.45 }, 0.74);
  });
}

const GLASS = [
  { angle: [0, 0, 1, 1], stops: [['0%', '#eaf4ff', 0.34], ['45%', '#9cc6ff', 0.07], ['100%', '#ffffff', 0.26]] },
  { angle: [1, 0, 0, 1], stops: [['0%', '#ffffff', 0.22], ['60%', '#7fb3f5', 0.05], ['100%', '#d6e9ff', 0.3]] },
  { angle: [0, 1, 1, 0], stops: [['0%', '#bcd9ff', 0.1], ['100%', '#ffffff', 0.32]] },
  { angle: [0.5, 0, 0.5, 1], stops: [['0%', '#ffffff', 0.3], ['50%', '#cfe4ff', 0.06], ['100%', '#9cc6ff', 0.2]] }
];

export async function wipe(dir, onCover) {
  const gsap = still ? null : await motion();
  if (!gsap) {
    onCover?.();
    return;
  }

  const random = gsap.utils.random;
  const w = innerWidth;
  const h = innerHeight;
  const cellW = Math.max(120, w / 10);
  const cellH = cellW * 0.82;
  const cols = Math.ceil(w / cellW) + 1;
  const rows = Math.ceil(h / cellH) + 1;
  const id = ++uid;

  const host = layer('ab-wipe');
  const root = svg('svg', { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: 'ab-wipe-svg' });
  host.append(root);
  const defs = svg('defs', {}, root);

  const fills = GLASS.map(({ angle, stops }, i) => {
    const fillId = `ab-wipe-glass-${id}-${i}`;
    gradient(defs, fillId, { x1: angle[0], y1: angle[1], x2: angle[2], y2: angle[3] }, stops);
    return `url(#${fillId})`;
  });

  const bandId = `ab-wipe-band-${id}`;
  gradient(defs, bandId, { x1: 0, y1: 0, x2: 1, y2: 0 }, [
    ['0%', '#eef5ff', 0],
    ['50%', '#eef5ff', 0.26],
    ['100%', '#eef5ff', 0]
  ]);

  const bloomId = `ab-wipe-bloom-${id}`;
  const bloomFill = svg('radialGradient', { id: bloomId, cx: '50%', cy: '50%', r: '62%' }, defs);
  svg('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': 0.55 }, bloomFill);
  svg('stop', { offset: '55%', 'stop-color': '#cfe4ff', 'stop-opacity': 0.16 }, bloomFill);
  svg('stop', { offset: '100%', 'stop-color': '#cfe4ff', 'stop-opacity': 0 }, bloomFill);

  const warpId = `ab-wipe-warp-${id}`;
  const warp = svg('filter', { id: warpId, x: 0, y: 0, width: w, height: h, filterUnits: 'userSpaceOnUse' }, defs);
  svg('feTurbulence', {
    type: 'fractalNoise',
    baseFrequency: '0.009 0.026',
    numOctaves: 2,
    seed: Math.round(Math.random() * 999),
    result: 'noise'
  }, warp);
  const displace = svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'noise', scale: 0, xChannelSelector: 'R', yChannelSelector: 'G' }, warp);

  const glowId = `ab-wipe-glow-${id}`;
  const glow = svg('filter', { id: glowId, x: '-60%', y: '-10%', width: '220%', height: '120%' }, defs);
  svg('feGaussianBlur', { stdDeviation: 8, result: 'soft' }, glow);
  const merge = svg('feMerge', {}, glow);
  svg('feMergeNode', { in: 'soft' }, merge);
  svg('feMergeNode', { in: 'soft' }, merge);
  svg('feMergeNode', { in: 'SourceGraphic' }, merge);

  const glass = svg('g', { filter: `url(#${warpId})` }, root);
  const bodies = svg('g', {}, glass);
  const rims = svg('g', { class: 'ab-wipe-rims' }, glass);
  const softId = `ab-wipe-soft-${id}`;
  const soft = svg('filter', { id: softId, x: '-10%', y: '-10%', width: '120%', height: '120%' }, defs);
  svg('feGaussianBlur', { stdDeviation: 9 }, soft);
  const specs = svg('g', { filter: `url(#${softId})` }, root);
  const lights = svg('g', {}, root);

  const points = [];
  for (let r = 0; r <= rows; r++) {
    points[r] = [];
    for (let c = 0; c <= cols; c++) {
      const border = r === 0 || c === 0 || r === rows || c === cols;
      points[r][c] = [
        c * cellW - cellW * 0.5 + (border ? 0 : random(-0.28, 0.28) * cellW),
        r * cellH - cellH * 0.5 + (border ? 0 : random(-0.28, 0.28) * cellH)
      ];
    }
  }

  const originX = dir < 0 ? w : 0;
  const originY = h * 0.5;
  const reach = Math.hypot(w, h);
  const pieces = [];
  const glints = [];
  const pathOf = (tri) => `M${tri[0][0]} ${tri[0][1]}L${tri[1][0]} ${tri[1][1]}L${tri[2][0]} ${tri[2][1]}Z`;

  const addShard = (tri) => {
    const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3;
    const cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
    const move = {
      order: Math.hypot(cx - originX, cy - originY) / reach,
      tilt: random(-70, 70),
      spin: random(-170, 170),
      fromX: -dir * random(40, 150),
      fromY: random(30, 110),
      toX: dir * random(60, 210),
      toY: -random(40, 170)
    };
    const d = pathOf(tri);
    const body = svg('path', { d, fill: fills[Math.floor(Math.random() * fills.length)], class: 'ab-wipe-shard' }, bodies);
    const rim = svg('path', { d, class: Math.random() < 0.3 ? 'ab-wipe-rim is-bright' : 'ab-wipe-rim' }, rims);
    body.move = move;
    rim.move = move;
    pieces.push(body, rim);
    if (Math.random() < 0.22) {
      const inner = tri.map(([x, y]) => [cx + (x - cx) * 0.62, cy + (y - cy) * 0.62]);
      const spec = svg('path', { d: pathOf(inner), class: 'ab-wipe-spec' }, specs);
      spec.move = move;
      glints.push(spec);
    }
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = points[r][c];
      const b = points[r][c + 1];
      const d = points[r + 1][c];
      const e = points[r + 1][c + 1];
      if ((r + c) % 2) {
        addShard([a, b, e]);
        addShard([a, e, d]);
      } else {
        addShard([a, b, d]);
        addShard([b, e, d]);
      }
    }
  }

  const stars = Array.from({ length: 18 }, () => svg('path', { d: STAR, class: 'ab-wipe-star' }, lights));
  const bloom = svg('rect', { x: 0, y: 0, width: w, height: h, fill: `url(#${bloomId})`, opacity: 0 }, root);

  const sweep = svg('g', { filter: `url(#${glowId})` }, root);
  svg('rect', { x: -160, y: -h, width: 320, height: h * 3, fill: `url(#${bandId})` }, sweep);
  svg('rect', { x: 4, y: -h, width: 2, height: h * 3, class: 'ab-wipe-line is-prism' }, sweep);
  svg('rect', { x: -1.5, y: -h, width: 3, height: h * 3, class: 'ab-wipe-line' }, sweep);

  const ordered = (spread) => (i, el) => el.move.order * spread;
  const start = dir > 0 ? -380 : w + 380;
  const end = dir > 0 ? w + 380 : -380;

  gsap.set(pieces, {
    opacity: 0,
    x: (i, el) => el.move.fromX,
    y: (i, el) => el.move.fromY,
    rotation: (i, el) => el.move.tilt,
    scale: 1.35,
    transformOrigin: '50% 50%'
  });
  gsap.set(glints, { opacity: 0 });
  gsap.set(stars, { x: () => random(0, w), y: () => random(0, h), scale: 0, rotation: () => random(0, 90), transformOrigin: '50% 50%' });
  gsap.set(sweep, { x: start, rotation: -18, svgOrigin: '0 0' });

  await new Promise((resolve) => {
    gsap.timeline({
      onComplete: () => {
        host.remove();
        resolve();
      }
    })
      .fromTo(host, { '--wipe-blur': '0px', '--wipe-bright': 1 }, { '--wipe-blur': '22px', '--wipe-bright': 1.06, duration: 0.55, ease: 'power2.out' }, 0)
      .to(pieces, { opacity: 1, x: 0, y: 0, rotation: 0, scale: 1, duration: 0.62, ease: 'expo.out', stagger: ordered(0.32) }, 0)
      .fromTo(displace, { attr: { scale: 60 } }, { attr: { scale: 0 }, duration: 0.8, ease: 'power3.out' }, 0)
      .to(sweep, { x: end, duration: 0.95, ease: 'power2.inOut' }, 0.05)
      .to(glints, { opacity: 0.55, duration: 0.14, stagger: ordered(0.3) }, 0.3)
      .to(glints, { opacity: 0, duration: 0.5, stagger: ordered(0.3) }, 0.46)
      .to(stars, { scale: () => random(0.14, 0.34), rotation: '+=45', duration: 0.36, ease: 'back.out(3)', stagger: { each: 0.035, from: 'random' } }, 0.22)
      .to(stars, { scale: 0, rotation: '+=45', duration: 0.42, ease: 'power2.in', stagger: { each: 0.03, from: 'random' } }, 0.72)
      .to(bloom, { attr: { opacity: 0.9 }, duration: 0.18, ease: 'power2.out' }, 0.44)
      .call(() => onCover?.(), null, 0.56)
      .to(bloom, { attr: { opacity: 0 }, duration: 0.5, ease: 'power2.inOut' }, 0.62)
      .to(pieces, {
        opacity: 0,
        x: (i, el) => el.move.toX,
        y: (i, el) => el.move.toY,
        rotation: (i, el) => el.move.spin,
        scale: 0.55,
        duration: 0.72,
        ease: 'power2.in',
        stagger: ordered(0.28)
      }, 0.66)
      .to(displace, { attr: { scale: 40 }, duration: 0.6, ease: 'power2.in' }, 0.7)
      .to(host, { '--wipe-blur': '0px', '--wipe-bright': 1, duration: 0.6, ease: 'power2.in' }, 0.86);
  });
}

export function spotlight(elements) {
  if (!finePointer) return;
  for (const el of elements) {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.removeProperty('--mx');
      el.style.removeProperty('--my');
    });
  }
}

export function frame(el, notch = 14) {
  const root = svg('svg', { class: 'ab-frame-svg', 'aria-hidden': 'true' });
  const outline = svg('path', { class: 'ab-frame-line' }, root);
  const tab = svg('rect', { class: 'ab-frame-tab', y: -1.5, height: 3 }, root);
  const cornerA = svg('path', { class: 'ab-frame-accent is-tl' }, root);
  const cornerB = svg('path', { class: 'ab-frame-accent is-br' }, root);
  const stripes = Array.from({ length: 3 }, () => svg('path', { class: 'ab-frame-stripe' }, root));
  const pips = Array.from({ length: 4 }, () => svg('rect', { class: 'ab-frame-pip', width: 4, height: 4 }, root));
  el.prepend(root);

  const layout = () => {
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (!w || !h) return;
    root.setAttribute('viewBox', `0 0 ${w} ${h}`);
    root.setAttribute('width', w);
    root.setAttribute('height', h);
    outline.setAttribute('d', `M0 0 H${w - notch} L${w} ${notch} V${h} H${notch} L0 ${h - notch} Z`);
    tab.setAttribute('width', Math.round(Math.min(72, w * 0.22)));
    cornerA.setAttribute('d', 'M0 24 V0 H24');
    cornerB.setAttribute('d', `M${w} ${h - 24} V${h} H${w - 24}`);
    stripes.forEach((stripe, i) => {
      const x = w - notch - 54 + i * 9;
      stripe.setAttribute('d', `M${x} 6 h5 l-4 8 h-5 z`);
    });
    pips.forEach((pip, i) => {
      pip.setAttribute('x', notch + 10 + i * 8);
      pip.setAttribute('y', h - 9);
    });
  };
  layout();
  new ResizeObserver(layout).observe(el);

  let drawn = false;
  return {
    async draw() {
      if (drawn) return;
      drawn = true;
      const gsap = still ? null : await motion();
      if (!gsap) return;
      const lines = [outline, cornerA, cornerB];
      gsap.timeline({
        onComplete: () => lines.forEach((line) => {
          line.style.removeProperty('stroke-dasharray');
          line.style.removeProperty('stroke-dashoffset');
        })
      })
        .from(outline, { drawSVG: 0, duration: 1.3, ease: 'expo.inOut' }, 0)
        .from(tab, { scaleX: 0, transformOrigin: '0% 50%', duration: 0.7, ease: 'expo.out' }, 0.35)
        .from([cornerA, cornerB], { drawSVG: 0, duration: 0.6, ease: 'expo.out', stagger: 0.12 }, 0.55)
        .from(stripes, { opacity: 0, x: -8, duration: 0.35, ease: 'power2.out', stagger: 0.07 }, 0.75)
        .from(pips, { opacity: 0, duration: 0.2, stagger: 0.06 }, 0.85);
    }
  };
}
