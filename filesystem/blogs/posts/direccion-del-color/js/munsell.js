const DATA_URL = new URL('../data/munsell.json', import.meta.url);
const LUT_URL = new URL('../data/munsell-lut.bin', import.meta.url);
const NAMES_URL = new URL('../data/berlin-kay.json', import.meta.url);

export const FAMILIES = ['R', 'YR', 'Y', 'GY', 'G', 'BG', 'B', 'PB', 'P', 'RP'];
export const HUES = Array.from({ length: 40 }, (_, i) => i * 2.5);
export const LUT_SIZE = 33;
export const TAU = Math.PI * 2;

const HUE_PATTERN = /^\s*(\d+(?:[.,]\d+)?)\s*(YR|GY|BG|PB|RP|R|Y|G|B|P)\s*(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)\s*$/i;
const GRAY_PATTERN = /^\s*N\s*(\d+(?:[.,]\d+)?)\s*\/?\s*0?\s*$/i;

const fetchOnce = (url, kind) => fetch(url, { credentials: 'omit' }).then((res) => {
  if (!res.ok) throw new Error(`${url.pathname} ${res.status}`);
  return kind === 'bin' ? res.arrayBuffer() : res.json();
});

let munsellPromise;
let lutPromise;
let namesPromise;

export const keyOf = (h, v, c) => `${Math.round(((h % 100) + 100) % 100 * 10)}|${v}|${c}`;

function indexMunsell(raw) {
  const s = raw?.samples;
  const count = s?.h?.length ?? 0;
  const valid = raw?.format === 'munsell-renotation/1' && count > 1000
    && ['v', 'c', 'srgb', 'p3', 'gamut', 'book'].every((k) => Array.isArray(s[k]) && s[k].length === count);
  if (!valid) throw new Error('munsell format');

  const h = Float32Array.from(s.h);
  const v = Uint8Array.from(s.v);
  const c = Uint8Array.from(s.c);
  const gamut = Uint8Array.from(s.gamut);
  const book = Uint8Array.from(s.book);
  const hex = s.srgb.map((x) => `#${x}`);
  const rgb = new Uint8Array(count * 3);
  const lookup = new Map();
  const maxChroma = new Map();
  for (let i = 0; i < count; i++) {
    const n = parseInt(s.srgb[i], 16);
    rgb[i * 3] = n >> 16;
    rgb[i * 3 + 1] = (n >> 8) & 255;
    rgb[i * 3 + 2] = n & 255;
    lookup.set(keyOf(h[i], v[i], c[i]), i);
    const k = `${Math.round(h[i] * 10)}|${v[i]}`;
    maxChroma.set(k, Math.max(maxChroma.get(k) ?? 0, c[i]));
  }

  return {
    count, h, v, c, gamut, book, hex, rgb, p3: s.p3,
    neutrals: raw.neutrals.map((x) => `#${x}`),
    counts: raw.counts,
    at: (hue, value, chroma) => lookup.get(keyOf(hue, value, chroma)) ?? -1,
    reach: (hue, value) => maxChroma.get(`${Math.round((((hue % 100) + 100) % 100) * 10)}|${value}`) ?? 0,
  };
}

export const loadMunsell = () => (munsellPromise ??= fetchOnce(DATA_URL).then(indexMunsell));

export const loadLut = () => (lutPromise ??= fetchOnce(LUT_URL, 'bin').then((buffer) => {
  const lut = new Uint8Array(buffer);
  if (lut.length !== LUT_SIZE ** 3 * 3) throw new Error('lut size');
  return lut;
}));

export const loadNames = () => (namesPromise ??= fetchOnce(NAMES_URL).then((raw) => {
  if (raw?.format !== 'berlin-kay-1969/1' || !Array.isArray(raw.chips) || raw.chips.length !== 330) throw new Error('names format');
  return raw;
}));

export function hueLabel(hue) {
  let h = ((hue % 100) + 100) % 100;
  let family = Math.floor(h / 10 + 1e-6);
  let step = h - family * 10;
  if (step < 1e-6) {
    family = (family + 9) % 10;
    step = 10;
  }
  const text = Math.abs(step - Math.round(step)) < 0.05 ? String(Math.round(step)) : step.toFixed(1);
  return `${text}${FAMILIES[family]}`;
}

export const familyOf = (hue) => FAMILIES[Math.floor((((hue - 1e-6) % 100) + 100) % 100 / 10) % 10];

const tidy = (x, digits = 1) => {
  const r = Number(x.toFixed(digits));
  return Number.isInteger(r) ? String(r) : r.toFixed(digits);
};

export function notation(hue, value, chroma, digits = 1) {
  if (chroma < 0.5) return `N ${tidy(value, digits)}`;
  return `${hueLabel(hue)} ${tidy(value, digits)}/${tidy(chroma, digits === 0 ? 0 : digits)}`;
}

export function parseNotation(text) {
  const gray = GRAY_PATTERN.exec(text);
  if (gray) return { h: 0, v: Number(gray[1].replace(',', '.')), c: 0 };
  const match = HUE_PATTERN.exec(text);
  if (!match) return null;
  const step = Number(match[1].replace(',', '.'));
  if (!(step > 0 && step <= 10)) return null;
  const family = FAMILIES.indexOf(match[2].toUpperCase());
  return {
    h: (step + family * 10) % 100,
    v: Number(match[3].replace(',', '.')),
    c: Number(match[4].replace(',', '.')),
  };
}

export const snapHue = (hue) => ((Math.round(hue / 2.5) * 2.5) % 100 + 100) % 100;

export function decode(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function encode(linear) {
  const c = Math.min(1, Math.max(0, linear));
  return Math.round((c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055) * 255);
}

export const DECODE = Float32Array.from({ length: 256 }, (_, i) => decode(i));

export function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}

export const rgbToHex = (r, g, b) => `#${[r, g, b].map((x) => Math.round(Math.min(255, Math.max(0, x))).toString(16).padStart(2, '0')).join('')}`;

export const luminance = (r, g, b) => 0.2126 * DECODE[r] + 0.7152 * DECODE[g] + 0.0722 * DECODE[b];

export function yFromValue(value) {
  const v = value;
  return (1.1914 * v - 0.22533 * v ** 2 + 0.23352 * v ** 3 - 0.020484 * v ** 4 + 0.00081939 * v ** 5) / 100;
}

const VALUE_TABLE = (() => {
  const size = 1024;
  const table = new Float32Array(size + 1);
  let v = 0;
  for (let i = 0; i <= size; i++) {
    const y = (i / size) ** 3;
    while (v < 10.5 && yFromValue(v + 0.001) < y) v += 0.001;
    table[i] = v;
  }
  return table;
})();

export function valueFromY(y) {
  const t = Math.cbrt(Math.min(1, Math.max(0, y))) * 1024;
  const i = Math.min(1023, Math.floor(t));
  const f = t - i;
  return VALUE_TABLE[i] + (VALUE_TABLE[i + 1] - VALUE_TABLE[i]) * f;
}

export function grayHex(value) {
  const g = encode(yFromValue(value));
  return rgbToHex(g, g, g);
}

export function lookupInto(lut, r, g, b, out) {
  const step = (LUT_SIZE - 1) / 255;
  const fr = r * step;
  const fg = g * step;
  const fb = b * step;
  const r0 = Math.min(fr | 0, LUT_SIZE - 2);
  const g0 = Math.min(fg | 0, LUT_SIZE - 2);
  const b0 = Math.min(fb | 0, LUT_SIZE - 2);
  const tr = fr - r0;
  const tg = fg - g0;
  const tb = fb - b0;
  let a = 0;
  let bb = 0;
  let v = 0;
  for (let db = 0; db < 2; db++) {
    const wb = db ? tb : 1 - tb;
    for (let dg = 0; dg < 2; dg++) {
      const wg = (dg ? tg : 1 - tg) * wb;
      for (let dr = 0; dr < 2; dr++) {
        const w = (dr ? tr : 1 - tr) * wg;
        const i = (((b0 + db) * LUT_SIZE + (g0 + dg)) * LUT_SIZE + (r0 + dr)) * 3;
        a += w * (lut[i] - 128);
        bb += w * (lut[i + 1] - 128);
        v += w * lut[i + 2];
      }
    }
  }
  out.a = a / 4;
  out.b = bb / 4;
  out.v = v / 25;
  out.c = Math.hypot(out.a, out.b);
  out.h = ((Math.atan2(out.b, out.a) / TAU) * 100 + 100) % 100;
  return out;
}

export const lookup = (lut, r, g, b) => lookupInto(lut, r, g, b, {});

export function supportsP3() {
  return typeof matchMedia === 'function'
    && matchMedia('(color-gamut: p3)').matches
    && typeof CSS !== 'undefined' && CSS.supports('color', 'color(display-p3 1 0 0)');
}

export function cssColor(data, i, p3 = false) {
  if (p3 && data.gamut[i] >= 1) {
    const [r, g, b] = data.p3[i];
    return `color(display-p3 ${r} ${g} ${b})`;
  }
  return data.hex[i];
}

export function inkFor(value) {
  return value >= 6 ? '#1b2046' : '#ffffff';
}

export const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function ease(t) {
  return 1 - (1 - t) ** 4;
}

export function hueDistance(a, b) {
  return ((b - a + 150) % 100 + 100) % 100 - 50;
}
