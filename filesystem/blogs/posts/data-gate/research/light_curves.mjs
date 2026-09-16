import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BLOCK = 2880;
const SIZES = { L: 1, X: 1, B: 1, I: 2, J: 4, K: 8, E: 4, D: 8, A: 1 };

function readHeader(buf, offset) {
  const cards = {};
  let pos = offset;
  for (;;) {
    for (let i = 0; i < BLOCK; i += 80) {
      const card = buf.toString('latin1', pos + i, pos + i + 80);
      const key = card.slice(0, 8).trim();
      if (key === 'END') return { cards, dataStart: pos + BLOCK };
      if (card[8] === '=') {
        let value = card.slice(10).split('/')[0].trim();
        if (value.startsWith("'")) value = card.slice(10).match(/'([^']*)'/)[1].trim();
        cards[key] = value;
      }
    }
    pos += BLOCK;
  }
}

function parseLightCurve(path) {
  const buf = readFileSync(path);
  const primary = readHeader(buf, 0);
  const ext = readHeader(buf, primary.dataStart);
  const rows = Number(ext.cards.NAXIS2);
  const rowBytes = Number(ext.cards.NAXIS1);
  const fields = Number(ext.cards.TFIELDS);

  const columns = {};
  let offset = 0;
  for (let n = 1; n <= fields; n++) {
    const form = ext.cards[`TFORM${n}`];
    const [, repeat = '1', code] = form.match(/^(\d*)([A-Z])/);
    columns[ext.cards[`TTYPE${n}`]] = { offset, code };
    offset += Number(repeat || 1) * SIZES[code];
  }
  if (offset !== rowBytes) throw new Error(`${path}: row size mismatch ${offset} vs ${rowBytes}`);

  const view = new DataView(buf.buffer, buf.byteOffset + ext.dataStart, rows * rowBytes);
  const read = (row, name) => {
    const { offset: o, code } = columns[name];
    const at = row * rowBytes + o;
    if (code === 'D') return view.getFloat64(at);
    if (code === 'E') return view.getFloat32(at);
    if (code === 'J') return view.getInt32(at);
    throw new Error(`unsupported ${code}`);
  };

  const time = [];
  const flux = [];
  for (let r = 0; r < rows; r++) {
    const t = read(r, 'TIME');
    const f = read(r, 'PDCSAP_FLUX');
    if (read(r, 'SAP_QUALITY') !== 0 || !Number.isFinite(t) || !Number.isFinite(f)) continue;
    time.push(t);
    flux.push(f);
  }
  const sorted = [...flux].sort((a, b) => a - b);
  const median = sorted[sorted.length >> 1];
  return {
    quarter: Number(primary.cards.QUARTER),
    object: primary.cards.OBJECT,
    time,
    ppm: flux.map((f) => (f / median - 1) * 1e6)
  };
}

const [, , dir, out] = process.argv;
if (!dir || !out) {
  console.error('uso: node light_curves.mjs carpeta-con-fits salida.bin');
  process.exit(1);
}
const quarters = readdirSync(dir)
  .filter((f) => f.endsWith('_llc.fits'))
  .map((f) => parseLightCurve(join(dir, f)))
  .sort((a, b) => a.quarter - b.quarter);

const total = quarters.reduce((n, q) => n + q.time.length, 0);
const data = new Float32Array(total * 2);
let i = 0;
for (const q of quarters) {
  for (let k = 0; k < q.time.length; k++) {
    data[i++] = q.time[k];
    data[i++] = q.ppm[k];
  }
}
writeFileSync(out, Buffer.from(data.buffer));

const ppm = data.filter((_, k) => k % 2 === 1);
const first = data[0];
const last = data[data.length - 2];
console.log(JSON.stringify({
  object: quarters[0].object,
  quarters: quarters.map((q) => q.quarter),
  points: total,
  days: [first.toFixed(2), last.toFixed(2)],
  ppmRange: [Math.round(Math.min(...ppm)), Math.round(Math.max(...ppm))],
  bytes: data.byteLength
}));
