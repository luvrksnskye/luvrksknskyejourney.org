import { loadMunsell, parseNotation, notation, hueLabel, hueDistance, snapHue, grayHex } from '../munsell.js?v=1';

const NS = 'http://www.w3.org/2000/svg';
const BASES = [
  ['la cinta', '7.5RP 4/12'],
  ['el cielo', '2.5PB 6/10'],
  ['el vestido', '7.5P 9/4'],
  ['el lazo', '5P 8/6'],
  ['una piel', '5YR 8/4'],
  ['un amarillo', '5Y 8/12'],
  ['un rojo', '5R 4/14']
];
const WARM = 25;

const SHAPES = {
  base: [
    'M 18 78 C 70 24, 132 128, 222 62 L 224 104 C 138 166, 84 66, 20 118 Z',
    'M 30 168 C 92 128, 146 214, 212 168 L 208 204 C 146 244, 98 162, 34 198 Z'
  ],
  shadow: [
    'M 20 118 C 84 66, 138 166, 224 104 L 223 90 C 140 150, 86 50, 19 102 Z',
    'M 34 198 C 98 162, 146 244, 208 204 L 210 190 C 146 228, 98 146, 32 184 Z',
    'M 96 86 C 112 102, 128 116, 146 118 C 128 132, 108 118, 92 100 Z'
  ],
  light: [
    'M 34 80 C 70 50, 104 76, 140 96',
    'M 50 172 C 90 150, 120 176, 160 190'
  ]
};

const el = (tag, attrs = {}, parent) => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  parent?.append(node);
  return node;
};

class Shade {
  constructor(host, data) {
    this.host = host;
    this.data = data;
    const q = (role) => host.querySelector(`[data-role="${role}"]`);
    this.arts = { gray: this.buildArt(q('gray')), shift: this.buildArt(q('shift')) };
    this.basesHost = q('bases');
    this.notes = q('notes');
    this.inputs = { drop: q('drop'), turn: q('turn'), toward: q('toward') };
    this.outputs = { drop: q('drop-out'), turn: q('turn-out'), toward: q('toward-out') };
    this.bases = BASES.map(([name, text]) => ({ name, spec: this.nearest(parseNotation(text)) }));
    this.selected = 0;
    this.buildBases();
    for (const input of Object.values(this.inputs)) input.addEventListener('input', () => this.render());
    this.render();
  }

  buildArt(svg) {
    const layers = {
      base: SHAPES.base.map((d) => el('path', { d }, svg)),
      shadow: SHAPES.shadow.map((d) => el('path', { d }, svg)),
      light: SHAPES.light.map((d) => el('path', { d, fill: 'none', 'stroke-width': 6, 'stroke-linecap': 'round' }, svg))
    };
    el('path', { d: SHAPES.base.join(' '), fill: 'none', stroke: 'rgba(27,32,70,0.55)', 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, svg);
    return layers;
  }

  buildBases() {
    const buttons = this.bases.map((base, k) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'dd-shade-base';
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', String(k === this.selected));
      button.setAttribute('aria-label', `${base.name}, ${notation(base.spec.h, base.spec.v, base.spec.c, 0)}`);
      button.title = `${base.name} · ${notation(base.spec.h, base.spec.v, base.spec.c, 0)}`;
      button.style.setProperty('--c', this.hex(base.spec));
      button.addEventListener('click', () => {
        this.selected = k;
        buttons.forEach((b, j) => b.setAttribute('aria-checked', String(j === k)));
        this.render();
      });
      return button;
    });
    this.basesHost.replaceChildren(...buttons);
  }

  nearest({ h, v, c }) {
    const hue = snapHue(h);
    const value = Math.min(9, Math.max(1, Math.round(v)));
    let chroma = Math.max(0, Math.round(c / 2) * 2);
    chroma = Math.min(chroma, this.data.reach(hue, value));
    while (chroma > 0 && this.data.at(hue, value, chroma) < 0) chroma -= 2;
    return { h: hue, v: value, c: chroma };
  }

  hex({ h, v, c }) {
    if (c === 0) return grayHex(v);
    const i = this.data.at(h, v, c);
    return i >= 0 ? this.data.hex[i] : '#999999';
  }

  move(from, toward, steps) {
    const gap = hueDistance(from, toward);
    const travel = Math.sign(gap) * Math.min(Math.abs(gap), steps);
    return snapHue(from + travel);
  }

  render() {
    const drop = Number(this.inputs.drop.value);
    const turn = Number(this.inputs.turn.value);
    const toward = ((Number(this.inputs.toward.value) + 1) * 2.5) % 100;
    this.outputs.drop.textContent = String(drop);
    this.outputs.turn.textContent = `${turn} pasos`;
    this.outputs.toward.textContent = hueLabel(toward);

    const base = this.bases[this.selected].spec;
    const darker = Math.max(1, base.v - drop);
    const grayShadow = this.nearest({ h: base.h, v: darker, c: base.c * 0.5 });
    const grayLight = this.nearest({ h: base.h, v: Math.min(9, base.v + 1), c: base.c * 0.8 });
    const shiftShadow = this.nearest({ h: this.move(base.h, toward, turn), v: darker, c: base.c });
    const shiftLight = this.nearest({ h: this.move(base.h, WARM, turn / 2), v: Math.min(9, base.v + 1), c: base.c * 0.9 });

    this.paint(this.arts.gray, base, grayShadow, grayLight);
    this.paint(this.arts.shift, base, shiftShadow, shiftLight);

    const rows = [
      ['color normal', base],
      ['sombra con negro', grayShadow],
      ['sombra con dirección', shiftShadow],
      ['luz con dirección', shiftLight]
    ];
    this.notes.replaceChildren(...rows.map(([label, spec]) => {
      const li = document.createElement('li');
      const swatch = document.createElement('i');
      swatch.style.background = this.hex(spec);
      const text = document.createElement('span');
      const b = document.createElement('b');
      b.textContent = notation(spec.h, spec.v, spec.c, 0);
      text.append(`${label} · `, b);
      li.append(swatch, text);
      return li;
    }));
  }

  paint(art, base, shadow, light) {
    art.base.forEach((path) => path.setAttribute('fill', this.hex(base)));
    art.shadow.forEach((path) => path.setAttribute('fill', this.hex(shadow)));
    art.light.forEach((path) => path.setAttribute('stroke', this.hex(light)));
  }
}

export async function mount(host) {
  const data = await loadMunsell();
  return new Shade(host, data);
}
