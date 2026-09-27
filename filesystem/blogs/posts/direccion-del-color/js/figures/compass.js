import { still } from '../munsell.js?v=1';

const NS = 'http://www.w3.org/2000/svg';
const DIRECTIONS = [
  { key: 'n', label: 'norte', angle: -90 },
  { key: 'e', label: 'este', angle: 0 },
  { key: 's', label: 'sur', angle: 90 },
  { key: 'w', label: 'oeste', angle: 180 }
];

const CULTURES = {
  china: {
    title: 'China · Kǎogōngjì',
    text: 'Del texto sobre los oficios de pintar y bordar. El cielo se llama xuán, un negro profundo con algo de rojo, y la tierra es amarilla. 青, qīng, es el color del este: azul, verde o incluso negro, según el contexto.',
    source: 'Kǎogōngjì, sección de pintura y bordado · Shuōwén jiězì, entrada 青',
    colors: { e: ['#2f7f8b', '东 · 青 qīng'], s: ['#c23a2b', '南 · 赤 chì'], w: ['#f3f0e8', '西 · 白 bái'], n: ['#1e1d22', '北 · 黑 hēi'] },
    center: ['#d4a322', '地 · 黄 huáng', 'la tierra', '黄', '#1b2046'],
    ring: ['#3b2530', '天 · 玄 xuán', 'el cielo']
  },
  japon: {
    title: 'Japón · los cuatro guardianes',
    text: 'Las cuatro borlas que cuelgan sobre el ring de sumo. Cada una es un punto cardinal, una estación y un animal guardián: el dragón azul, el ave bermellón, el tigre blanco y la tortuga negra.',
    source: 'Ciudad de Masuda, sobre el ring de sumo y los cuatro guardianes (四神)',
    colors: { e: ['#2d7b8c', '東 · 青房 · primavera'], s: ['#c8323c', '南 · 赤房 · verano'], w: ['#f3f1ec', '西 · 白房 · otoño'], n: ['#1c1c20', '北 · 黒房 · invierno'] },
    center: null,
    ring: null
  },
  maya: {
    title: 'Maya · Chilam Balam de Chumayel',
    text: 'Cada rumbo tiene su color y su ceiba. En el centro crece la ceiba yax, azul y verde a la vez, la que sostiene el mundo.',
    source: 'Ciencia UNAM, con Laura Elena Sotelo Santos',
    colors: { e: ['#b83a2c', 'este · chak, rojo'], s: ['#e0b12b', 'sur · k’an, amarillo'], w: ['#1e1c1b', 'oeste · ek’, negro'], n: ['#f2efe6', 'norte · sak, blanco'] },
    center: ['#2f8f86', 'yax', 'azul y verde', 'yax', '#ffffff'],
    ring: null
  },
  mexica: {
    title: 'Mexica · Códice Fejérváry-Mayer',
    text: 'En su primera página, los colores aparecen en las franjas que rodean cada espacio del universo. El este sigue siendo rojo, pero el norte ahora es amarillo.',
    source: 'Enrique Vela, Arqueología Mexicana',
    colors: { e: ['#b83a2c', 'oriente · rojo'], s: ['#3f8f4f', 'sur · verde'], w: ['#2f6fae', 'poniente · azul'], n: ['#e0b12b', 'norte · amarillo'] },
    center: ['#e8703a', 'Xiuhtecuhtli', 'el centro, el fuego', '', '#ffffff'],
    ring: null
  },
  munsell: {
    title: 'Munsell · la esfera, 1905',
    text: 'Munsell no usó el este ni el oeste: usó la geografía de un globo. El polo norte es blanco, el polo sur es negro y el ecuador es un anillo de colores medios. Aquí la rosa se vuelve de lado.',
    source: 'A. H. Munsell, A Color Notation, párrafo 12',
    colors: { n: ['#ffffff', 'polo norte · N 10'], s: ['#101010', 'polo sur · N 0'], e: null, w: null },
    center: ['#797979', 'N 5', 'el eje gris', 'N5', '#ffffff'],
    ring: 'hues'
  }
};

const HUES = ['#d04c50', '#b6651a', '#927702', '#698318', '#3b8767', '#238781', '#2d849a', '#267ccb', '#9b62b6', '#c54f85'];

const el = (tag, attrs = {}, parent) => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  parent?.append(node);
  return node;
};

function petal(angle) {
  const a = (angle * Math.PI) / 180;
  const tip = [Math.cos(a) * 150, Math.sin(a) * 150];
  const base = [Math.cos(a) * 46, Math.sin(a) * 46];
  const side = [Math.cos(a + Math.PI / 2) * 30, Math.sin(a + Math.PI / 2) * 30];
  const mid = [Math.cos(a) * 88, Math.sin(a) * 88];
  return `M ${base[0].toFixed(1)} ${base[1].toFixed(1)} L ${(mid[0] + side[0]).toFixed(1)} ${(mid[1] + side[1]).toFixed(1)} L ${tip[0].toFixed(1)} ${tip[1].toFixed(1)} L ${(mid[0] - side[0]).toFixed(1)} ${(mid[1] - side[1]).toFixed(1)} Z`;
}

class Compass {
  constructor(host) {
    this.host = host;
    this.figure = host.closest('.dd-figure');
    this.svg = host.querySelector('[data-role="svg"]');
    this.note = host.querySelector('[data-role="note"]');
    this.buttons = [...this.figure.querySelectorAll('[data-culture]')];
    this.build();
    for (const button of this.buttons) {
      button.addEventListener('click', () => this.show(button.dataset.culture));
    }
    this.show('china', true);
  }

  build() {
    const s = this.svg;
    el('circle', { cx: 0, cy: 0, r: 176, fill: 'none', stroke: 'rgba(27,32,70,0.12)' }, s);
    this.ring = el('circle', { cx: 0, cy: 0, r: 166, fill: 'none', 'stroke-width': 10, stroke: 'transparent', style: 'transition: stroke 700ms ease' }, s);
    this.hueRing = el('g', { style: 'transition: opacity 700ms ease; opacity: 0' }, s);
    HUES.forEach((color, i) => {
      const a0 = ((i * 36 - 90 - 16) * Math.PI) / 180;
      const a1 = ((i * 36 - 90 + 16) * Math.PI) / 180;
      const r = 166;
      el('path', {
        d: `M ${Math.cos(a0) * r} ${Math.sin(a0) * r} A ${r} ${r} 0 0 1 ${Math.cos(a1) * r} ${Math.sin(a1) * r}`,
        fill: 'none', stroke: color, 'stroke-width': 10, 'stroke-linecap': 'butt'
      }, this.hueRing);
    });
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const r0 = i % 8 === 0 ? 172 : 175;
      el('line', { x1: Math.cos(a) * r0, y1: Math.sin(a) * r0, x2: Math.cos(a) * 180, y2: Math.sin(a) * 180, stroke: 'rgba(27,32,70,0.3)' }, s);
    }
    el('line', { x1: -150, y1: 0, x2: 150, y2: 0, stroke: 'rgba(27,32,70,0.1)', 'stroke-dasharray': '3 5' }, s);
    el('line', { x1: 0, y1: -150, x2: 0, y2: 150, stroke: 'rgba(27,32,70,0.1)', 'stroke-dasharray': '3 5' }, s);

    this.petals = {};
    this.words = {};
    DIRECTIONS.forEach((d, i) => {
      const g = el('g', { style: `transform-origin: 0 0; transition: transform 800ms cubic-bezier(0.16,1,0.3,1) ${i * 70}ms, opacity 600ms ease ${i * 70}ms` }, s);
      const path = el('path', { d: petal(d.angle), fill: '#eee', stroke: 'rgba(27,32,70,0.22)', 'stroke-width': 1, style: 'transition: fill 700ms ease' }, g);
      const a = (d.angle * Math.PI) / 180;
      const tx = Math.cos(a) * 196;
      const ty = Math.sin(a) * 196 + 4;
      const anchor = d.key === 'e' ? 'start' : d.key === 'w' ? 'end' : 'middle';
      const label = el('text', { x: tx + (d.key === 'e' ? -8 : d.key === 'w' ? 8 : 0), y: d.key === 'n' ? ty - 6 : d.key === 's' ? ty + 10 : ty, 'text-anchor': anchor }, s);
      label.textContent = d.label;
      const word = el('text', { class: 'is-word', x: Math.cos(a) * 100, y: Math.sin(a) * 100 + 5, 'text-anchor': 'middle', style: 'transition: opacity 500ms ease' }, s);
      this.petals[d.key] = { g, path };
      this.words[d.key] = word;
    });
    this.center = el('circle', { cx: 0, cy: 0, r: 40, fill: '#fff', stroke: 'rgba(27,32,70,0.2)', style: 'transition: fill 700ms ease, r 600ms ease' }, s);
    this.centerWord = el('text', { class: 'is-big', x: 0, y: 10, 'text-anchor': 'middle' }, s);
  }

  show(key, first = false) {
    const culture = CULTURES[key];
    if (!culture) return;
    this.buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.culture === key)));
    for (const d of DIRECTIONS) {
      const entry = culture.colors[d.key];
      const { g, path } = this.petals[d.key];
      const word = this.words[d.key];
      if (!still && !first) {
        g.style.transform = 'scale(0.6)';
        g.style.opacity = '0.2';
        requestAnimationFrame(() => requestAnimationFrame(() => {
          g.style.transform = 'scale(1)';
          g.style.opacity = entry ? '1' : '0';
        }));
      } else {
        g.style.opacity = entry ? '1' : '0';
      }
      if (entry) path.setAttribute('fill', entry[0]);
      word.textContent = '';
    }
    this.ring.setAttribute('stroke', culture.ring && culture.ring !== 'hues' ? culture.ring[0] : 'transparent');
    this.hueRing.style.opacity = culture.ring === 'hues' ? '1' : '0';
    this.center.setAttribute('fill', culture.center ? culture.center[0] : '#ffffff');
    this.centerWord.textContent = culture.center?.[3] ?? '';
    this.centerWord.style.fill = culture.center?.[4] ?? 'var(--ink)';

    const title = document.createElement('h4');
    title.textContent = culture.title;
    const text = document.createElement('p');
    text.textContent = culture.text;
    const list = document.createElement('p');
    const parts = DIRECTIONS.map((d) => culture.colors[d.key]?.[1]).filter(Boolean);
    if (culture.center) parts.push(`centro · ${culture.center[1]}${culture.center[2] ? `, ${culture.center[2]}` : ''}`);
    if (culture.ring && culture.ring !== 'hues') parts.push(`anillo · ${culture.ring[1]}, ${culture.ring[2]}`);
    if (culture.ring === 'hues') parts.push('ecuador · los diez tonos en valor 5');
    list.textContent = parts.join('  ·  ');
    const source = document.createElement('small');
    source.textContent = culture.source;
    this.note.replaceChildren(title, text, list, source);
    if (!still && !first) this.note.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: 'cubic-bezier(0.16,1,0.3,1)' });
  }
}

export function mount(host) {
  return new Compass(host);
}
