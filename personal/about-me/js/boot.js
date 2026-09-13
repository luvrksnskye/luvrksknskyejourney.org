import { motion, svg, still, polar, arc, finePointer } from './fx.js?v=8';

const C = 500;

const LABELS = [
  { r: 268, deg: -34, text: 'OBS.SELF', anchor: 'end' },
  { r: 214, deg: 16, text: 'SKYE', anchor: 'start' },
  { r: 306, deg: 60, text: 'SHE / THEY', anchor: 'start' },
  { r: 262, deg: 134, text: 'LOG 001', anchor: 'start' },
  { r: 150, deg: 196, text: ':freq 21', anchor: 'start' },
  { r: 236, deg: 252, text: 'VE / US', anchor: 'end' }
];

function build(host) {
  const root = svg('svg', { viewBox: '0 0 1000 1000', class: 'ab-boot-svg' });
  const defs = svg('defs', {}, root);
  const sweepFill = svg('linearGradient', {
    id: 'ab-boot-sweep',
    gradientUnits: 'userSpaceOnUse',
    x1: C,
    y1: C - 205,
    x2: C + 150,
    y2: C - 140
  }, defs);
  svg('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': 0.95 }, sweepFill);
  svg('stop', { offset: '100%', 'stop-color': '#ffffff', 'stop-opacity': 0 }, sweepFill);

  const tilt = svg('g', { class: 'ab-boot-tilt' }, root);
  const scale = svg('g', { class: 'ab-boot-scale' }, tilt);
  const thick = svg('g', { class: 'ab-boot-thick' }, tilt);
  const main = svg('g', { class: 'ab-boot-main' }, tilt);
  const counter = svg('g', { class: 'ab-boot-counter' }, tilt);
  const sweep = svg('g', { class: 'ab-boot-sweep' }, tilt);
  const fore = svg('g', { class: 'ab-boot-fore' }, tilt);

  const draw = (parent, tag, attrs) => {
    const node = svg(tag, attrs, parent);
    node.dataset.draw = '';
    return node;
  };

  const ray = (parent, r1, r2, deg, className = '') => {
    const [x1, y1] = polar(C, C, r1, deg);
    const [x2, y2] = polar(C, C, r2, deg);
    return draw(parent, 'line', { x1, y1, x2, y2, class: className });
  };

  const curve = (from, bend, to) => {
    const [x1, y1] = polar(C, C, from[0], from[1]);
    const [qx, qy] = polar(C, C, bend[0], bend[1]);
    const [x2, y2] = polar(C, C, to[0], to[1]);
    return draw(fore, 'path', { d: `M${x1} ${y1} Q${qx} ${qy} ${x2} ${y2}`, class: 'is-soft' });
  };

  const node = (r, deg, size, className = '') => {
    const [x, y] = polar(C, C, r, deg);
    const g = svg('g', { class: `ab-boot-node ${className}`, transform: `translate(${x} ${y})` }, fore);
    if (className.includes('is-pulse')) svg('circle', { r: size, class: 'ab-boot-pulse' }, g);
    svg('circle', { r: size }, g).dataset.node = '';
    if (size > 12) svg('circle', { r: size * 0.35, class: 'is-fill' }, g).dataset.node = '';
  };

  draw(scale, 'path', { d: arc(C, C, 300, 206, 334), class: 'is-soft' });
  for (let d = 208; d <= 332; d += 2) {
    const major = d % 10 === 0;
    const [x1, y1] = polar(C, C, 300, d);
    const [x2, y2] = polar(C, C, major ? 320 : 309, d);
    svg('line', { x1, y1, x2, y2, class: major ? 'ab-boot-tick is-major' : 'ab-boot-tick' }, scale);
  }
  for (let d = 214; d <= 238; d += 8) {
    const [cx, cy] = polar(C, C, 338, d);
    svg('circle', { cx, cy, r: 5, class: 'ab-boot-dot' }, scale);
  }

  draw(thick, 'path', { d: arc(C, C, 274, 238, 266), class: 'is-thick' });
  draw(thick, 'path', { d: arc(C, C, 262, 196, 300), class: 'is-soft' });
  draw(thick, 'path', { d: arc(C, C, 250, 22, 150), class: 'is-soft' });

  [[-24, 96], [112, 246], [262, 324]].forEach(([from, to]) => draw(main, 'path', { d: arc(C, C, 170, from, to), class: 'is-main' }));
  ray(main, 170, 470, 225);
  ray(main, 170, 450, 90);
  ray(main, 170, 350, 32);
  ray(main, 40, 150, 225, 'is-soft');

  draw(counter, 'path', { d: arc(C, C, 120, 0, 359.9), class: 'is-dash' });
  draw(counter, 'path', { d: arc(C, C, 136, 300, 350), class: 'is-soft' });

  const sweepArc = svg('path', { d: arc(C, C, 205, 0, 48), class: 'ab-boot-sweeparc' }, sweep);
  sweepArc.style.stroke = 'url(#ab-boot-sweep)';

  curve([350, 32], [410, 50], [318, 66]);
  curve([170, 140], [236, 124], [262, 134]);
  curve([170, -24], [224, -18], [262, -34]);

  for (let i = 0; i < 3; i++) {
    const y = C - 262 + i * 15;
    svg('path', { d: `M${C - 13} ${y} L${C} ${y + 10} L${C + 13} ${y}`, class: 'ab-boot-chevron' }, fore);
  }

  for (let i = 0; i < 6; i++) {
    const x = C + 224 + i * 38;
    svg('line', { x1: x, y1: C - 5 - (i % 2) * 5, x2: x, y2: C + 5, class: 'ab-boot-mark' }, fore);
  }

  svg('rect', { x: 736, y: C + 24, width: 62, height: 38, rx: 12, class: 'ab-boot-pill' }, fore);
  const zero = svg('text', { x: 767, y: C + 49, 'text-anchor': 'middle', class: 'ab-boot-pilltext' }, fore);
  zero.textContent = '00';
  svg('rect', { x: 810, y: C + 24, width: 112, height: 38, rx: 12, class: 'ab-boot-pill' }, fore);
  const zoom = svg('text', { x: 850, y: C + 49, 'text-anchor': 'middle', class: 'ab-boot-pilltext ab-boot-zoom' }, fore);
  zoom.textContent = 'X3';
  svg('path', { d: `M906 ${C + 36} L894 ${C + 43} L906 ${C + 50}Z`, class: 'ab-boot-arrow' }, fore);

  const reading = svg('text', { x: C + 300, y: C - 18, 'text-anchor': 'middle', class: 'ab-boot-num' }, fore);
  reading.textContent = '0.845';

  node(350, 32, 8);
  node(170, -24, 7);
  node(250, 150, 8);
  node(170, 140, 22, 'is-pulse');
  node(170, 262, 6);
  node(470, 225, 5);
  node(120, 300, 4);

  for (const { r, deg, text, anchor } of LABELS) {
    const [x, y] = polar(C, C, r, deg);
    const label = svg('text', { x, y, 'text-anchor': anchor, class: 'ab-boot-label' }, fore);
    label.textContent = text;
    label.dataset.label = text;
  }

  host.append(root);
  return root;
}

export async function boot(host) {
  if (!host) return;
  const root = build(host);
  const gsap = still ? null : await motion();
  host.classList.add('is-on');
  if (!gsap) return;

  const q = (selector) => root.querySelectorAll(selector);
  const origin = `${C} ${C}`;
  const labels = [...q('[data-label]')];
  labels.forEach((label) => {
    label.textContent = '';
  });

  const tl = gsap.timeline({ delay: 0.45 });
  tl.fromTo(root, { filter: 'brightness(2.4)' }, { filter: 'brightness(1)', duration: 1.6, ease: 'expo.out', clearProps: 'filter' }, 0.8)
    .from(q('.ab-boot-main [data-draw]'), { drawSVG: '50% 50%', duration: 1.3, ease: 'expo.inOut', stagger: 0.06 }, 0)
    .from(q('.ab-boot-scale [data-draw]'), { drawSVG: 0, duration: 1.2, ease: 'power3.inOut' }, 0.25)
    .from(q('.ab-boot-tick'), { opacity: 0, duration: 0.12, stagger: { each: 0.01, from: 'center' } }, 0.5)
    .from(q('.ab-boot-thick [data-draw]'), { drawSVG: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1 }, 0.35)
    .from(q('.ab-boot-counter [data-draw], .ab-boot-fore [data-draw]'), { drawSVG: 0, duration: 1, ease: 'power3.inOut', stagger: 0.07 }, 0.65)
    .from(q('.ab-boot-dot, [data-node]'), { scale: 0, transformOrigin: '50% 50%', duration: 0.6, ease: 'back.out(3)', stagger: 0.045, clearProps: 'transform' }, 0.9)
    .from(q('.ab-boot-mark, .ab-boot-pill, .ab-boot-pilltext, .ab-boot-arrow, .ab-boot-chevron, .ab-boot-num, .ab-boot-sweeparc'), { opacity: 0, duration: 0.5, ease: 'expo.out', stagger: 0.04 }, 1.1);
  labels.forEach((label, i) => {
    tl.to(label, { duration: 0.9, scrambleText: { text: label.dataset.label, chars: '01<>/_:', speed: 0.5 } }, 1.2 + i * 0.09);
  });

  gsap.to(q('.ab-boot-scale'), { rotation: 18, svgOrigin: origin, duration: 9, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to(q('.ab-boot-thick'), { rotation: -24, svgOrigin: origin, duration: 11, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to(q('.ab-boot-counter'), { rotation: -360, svgOrigin: origin, duration: 70, ease: 'none', repeat: -1 });
  gsap.to(q('.ab-boot-sweep'), { rotation: 360, svgOrigin: origin, duration: 6, ease: 'none', repeat: -1 });
  gsap.to(q('.ab-boot-chevron'), { opacity: 0.18, duration: 0.55, ease: 'sine.inOut', stagger: { each: 0.16, repeat: -1, yoyo: true } });
  gsap.fromTo(q('.ab-boot-pulse'), { attr: { r: 22 }, opacity: 0.9 }, { attr: { r: 66 }, opacity: 0, duration: 2.2, ease: 'expo.out', repeat: -1, repeatDelay: 0.5 });

  const reading = root.querySelector('.ab-boot-num');
  const tickReading = () => {
    gsap.to(reading, { duration: 0.5, scrambleText: { text: Math.random().toFixed(3), chars: '0123456789', speed: 1 } });
    gsap.delayedCall(gsap.utils.random(1.6, 3.2), tickReading);
  };
  gsap.delayedCall(2.6, tickReading);

  const zoom = root.querySelector('.ab-boot-zoom');
  let level = 3;
  const cycleZoom = () => {
    level = level % 3 + 1;
    gsap.to(zoom, { duration: 0.35, scrambleText: { text: `X${level}`, chars: 'X0123', speed: 1 } });
    gsap.delayedCall(gsap.utils.random(3, 5), cycleZoom);
  };
  gsap.delayedCall(4, cycleZoom);

  const arcs = [...q('.ab-boot-main path, .ab-boot-thick path')];
  const recalibrate = () => {
    const pick = gsap.utils.shuffle(arcs.slice()).slice(0, 2);
    gsap.timeline()
      .to(pick, { drawSVG: '50% 50%', duration: 0.35, ease: 'power3.in' })
      .to(pick, { drawSVG: '0% 100%', duration: 0.8, ease: 'expo.out' });
    gsap.delayedCall(gsap.utils.random(5, 9), recalibrate);
  };
  gsap.delayedCall(6.5, recalibrate);

  if (finePointer) {
    const tilt = root.querySelector('.ab-boot-tilt');
    gsap.set(tilt, { svgOrigin: origin });
    const moveX = gsap.quickTo(host, 'x', { duration: 1.2, ease: 'power3.out' });
    const moveY = gsap.quickTo(host, 'y', { duration: 1.2, ease: 'power3.out' });
    const turn = gsap.quickTo(tilt, 'rotation', { duration: 1.4, ease: 'power3.out' });
    addEventListener('pointermove', (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      moveX(nx * -24);
      moveY(ny * -18);
      turn(nx * 6);
    }, { passive: true });
  }
}
