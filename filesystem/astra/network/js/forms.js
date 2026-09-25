function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lerp = (a, b, t) => a + (b - a) * t;

export function createForms(side, graph) {
  'use strict';

  const P = side * side;
  const RS = rng(0x51AA);
  const growTmp = new Float32Array(P);

  function spans(segs) {
    const cum = new Float64Array(segs.length);
    let total = 0;
    for (let k = 0; k < segs.length; k++) {
      total += Math.hypot(segs[k][3] - segs[k][0], segs[k][4] - segs[k][1], segs[k][5] - segs[k][2]);
      cum[k] = total;
    }
    return {
      total: total,
      pick(r) {
        const want = r * total;
        let lo = 0, hi = cum.length - 1;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (cum[mid] >= want) hi = mid; else lo = mid + 1;
        }
        return segs[lo];
      }
    };
  }

  function alloc() {
    growTmp.fill(0);
    return new Float32Array(P * 3);
  }

  function facePoint(out, i, s, jitter) {
    const f = (RS() * 6) | 0;
    const u = (RS() - 0.5) * s, v = (RS() - 0.5) * s, h = s * 0.5;
    let x, y, z;
    if (f === 0) { x = h; y = u; z = v; }
    else if (f === 1) { x = -h; y = u; z = v; }
    else if (f === 2) { x = u; y = h; z = v; }
    else if (f === 3) { x = u; y = -h; z = v; }
    else if (f === 4) { x = u; y = v; z = h; }
    else { x = u; y = v; z = -h; }
    const j = jitter || 0;
    out[i * 3] = x + (RS() - 0.5) * j;
    out[i * 3 + 1] = y + (RS() - 0.5) * j;
    out[i * 3 + 2] = z + (RS() - 0.5) * j;
  }

  function formDust(r) {
    const o = alloc();
    for (let i = 0; i < P; i++) {
      const rr = r * (0.35 + Math.pow(RS(), 0.4) * 0.9);
      const th = RS() * Math.PI * 2, ph = Math.acos(2 * RS() - 1);
      o[i * 3] = Math.sin(ph) * Math.cos(th) * rr;
      o[i * 3 + 1] = Math.cos(ph) * rr * 0.62;
      o[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * rr;
    }
    return o;
  }

  function hash2(a, b) {
    const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  function formBeacon(r) {
    const o = alloc();
    for (let i = 0; i < P; i++) {
      const roll = RS();
      if (roll < 0.20) {
        const th = RS() * Math.PI * 2, ph = Math.acos(2 * RS() - 1);
        const rr = r * 0.055 * Math.pow(RS(), 0.4);
        o[i * 3] = Math.sin(ph) * Math.cos(th) * rr;
        o[i * 3 + 1] = Math.cos(ph) * rr;
        o[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * rr;
      } else if (roll < 0.76) {
        const t = Math.pow(RS(), 0.8);
        const w = r * (0.008 + t * 0.16);
        o[i * 3] = t * r * 1.25;
        o[i * 3 + 1] = (RS() - 0.5) * w;
        o[i * 3 + 2] = (RS() - 0.5) * w;
        growTmp[i] = 0.12 + t * 0.7;
      } else {
        const rr = r * (0.5 + RS() * 2.0);
        const th = RS() * Math.PI * 2;
        o[i * 3] = Math.cos(th) * rr;
        o[i * 3 + 1] = -r * 0.46 + (RS() - 0.5) * r * 0.06;
        o[i * 3 + 2] = Math.sin(th) * rr;
      }
    }
    return o;
  }

  function formCubeLattice(s, n) {
    const o = alloc();
    const cell = s / n, gap = cell * 0.34, inner = cell - gap;
    const half = (n - 1) / 2;
    const tmp = new Float32Array(3);
    for (let i = 0; i < P; i++) {
      const cx = (RS() * n) | 0, cy = (RS() * n) | 0, cz = (RS() * n) | 0;
      if (RS() < 0.13) {
        const axis = (RS() * 3) | 0;
        const t = RS();
        o[i * 3] = (cx - half) * cell + (axis === 0 ? (t - 0.5) * cell : 0);
        o[i * 3 + 1] = (cy - half) * cell + (axis === 1 ? (t - 0.5) * cell : 0);
        o[i * 3 + 2] = (cz - half) * cell + (axis === 2 ? (t - 0.5) * cell : 0);
        growTmp[i] = 0.86;
        continue;
      }
      facePoint(tmp, 0, inner, inner * 0.05);
      o[i * 3] = tmp[0] + (cx - half) * cell;
      o[i * 3 + 1] = tmp[1] + (cy - half) * cell;
      o[i * 3 + 2] = tmp[2] + (cz - half) * cell;
      growTmp[i] = (cx + cy + cz) / ((n - 1) * 3) * 0.78;
    }
    return o;
  }

  function formVector(s, rows) {
    const o = alloc();
    const cols = 30;
    const step = s / rows;
    for (let i = 0; i < P; i++) {
      const r = (RS() * rows) | 0;
      const c = (RS() * cols) | 0;
      const v = hash2(r + 1, c + 1) - 0.5;
      o[i * 3] = (c / (cols - 1) - 0.5) * s * 1.6 + (RS() - 0.5) * step * 0.3;
      o[i * 3 + 1] = (r / (rows - 1) - 0.5) * s + v * step * 0.86;
      o[i * 3 + 2] = (RS() - 0.5) * s * 0.03;
      growTmp[i] = (c / cols) * 0.86;
    }
    return o;
  }

  function formVortex(r) {
    const o = alloc();
    const arms = 5;
    for (let i = 0; i < P; i++) {
      const roll = RS();
      if (roll < 0.10) {
        const t = RS();
        const rr = r * 0.06 * (1 - t);
        const th = RS() * Math.PI * 2;
        o[i * 3] = Math.cos(th) * rr;
        o[i * 3 + 1] = -r * 0.5 + t * r * 1.0;
        o[i * 3 + 2] = Math.sin(th) * rr;
        growTmp[i] = 0.72 + t * 0.26;
        continue;
      }
      const arm = (RS() * arms) | 0;
      const t = Math.pow(RS(), 0.62);
      const rr = r * (0.08 + t * 0.95);
      const th = (arm / arms) * Math.PI * 2 + t * 4.1 + (RS() - 0.5) * 0.24;
      const fall = (1 - t) * (1 - t);
      o[i * 3] = Math.cos(th) * rr;
      o[i * 3 + 1] = -fall * r * 0.42 + (RS() - 0.5) * r * 0.05;
      o[i * 3 + 2] = Math.sin(th) * rr;
      growTmp[i] = (1 - t) * 0.8;
    }
    return o;
  }

  function branchOut(segs, box, x, y, z, dx, dy, dz, len, depth, from, maxDepth, minLen) {
    const ex = x + dx * len, ey = y + dy * len, ez = z + dz * len;
    const at = from + len;
    segs.push([x, y, z, ex, ey, ez, depth, from, at]);
    if (at > box.span) box.span = at;
    if (depth >= maxDepth || len < minLen) return;
    const n = depth < 2 ? 2 + ((RS() * 2) | 0) : (RS() > 0.42 ? 2 : 1);
    for (let b = 0; b < n; b++) {
      let nx = dx + (RS() - 0.5) * 1.5;
      let ny = dy + 0.18 + RS() * 0.2;
      let nz = dz + (RS() - 0.5) * 1.5;
      const m = Math.hypot(nx, ny, nz) || 1;
      branchOut(segs, box, ex, ey, ez, nx / m, ny / m, nz / m, len * (0.6 + RS() * 0.22), depth + 1, at, maxDepth, minLen);
    }
  }

  function scatterOn(o, i, half, floor, reach) {
    const lineIdx = (RS() * 13) | 0;
    const step = (half * 2) / 12;
    if (RS() < 0.5) {
      o[i * 3] = (RS() - 0.5) * half * 2;
      o[i * 3 + 2] = -half + lineIdx * step;
    } else {
      o[i * 3] = -half + lineIdx * step;
      o[i * 3 + 2] = (RS() - 0.5) * half * 2;
    }
    o[i * 3 + 1] = floor + (RS() - 0.5) * reach * 0.006;
  }

  function formForest(reach, count) {
    const o = alloc();
    const floor = -reach * 0.42;
    const groves = [];
    let widest = 1;

    for (let k = 0; k < count; k++) {
      const a = (k / count) * Math.PI * 2 + 0.6;
      const d = k === 0 ? 0 : reach * (0.3 + RS() * 0.42);
      const cx = Math.cos(a) * d, cz = Math.sin(a) * d;
      const scale = k === 0 ? 1 : 0.5 + RS() * 0.42;
      const box = { span: 1 };
      const segs = [];
      branchOut(segs, box, cx, floor, cz, 0, 1, 0, reach * 0.26 * scale, 0, 0, 5, reach * 0.04);
      groves.push({ w: spans(segs), span: box.span, order: k / count });
      widest = Math.max(widest, d);
    }

    const half = Math.max(reach * 0.9, widest + reach * 0.3);
    for (let i = 0; i < P; i++) {
      if (RS() < 0.22) {
        scatterOn(o, i, half, floor, reach);
        growTmp[i] = 0.03;
        continue;
      }
      const g = groves[(RS() * groves.length) | 0];
      const s = g.w.pick(RS());
      const t = RS();
      const j = reach * 0.012 * (1 - s[6] / 7);
      o[i * 3] = lerp(s[0], s[3], t) + (RS() - 0.5) * j;
      o[i * 3 + 1] = lerp(s[1], s[4], t) + (RS() - 0.5) * j;
      o[i * 3 + 2] = lerp(s[2], s[5], t) + (RS() - 0.5) * j;
      growTmp[i] = 0.06 + g.order * 0.5 + (lerp(s[7], s[8], t) / g.span) * 0.42;
    }
    return o;
  }

  function formMobius(R, w) {
    const o = alloc();
    for (let i = 0; i < P; i++) {
      const u = RS() * Math.PI * 2;
      const edge = RS() < 0.42;
      const v = edge ? (RS() < 0.5 ? -w : w) * (0.94 + RS() * 0.06) : (RS() - 0.5) * 2 * w;
      const c = Math.cos(u * 0.5), s = Math.sin(u * 0.5);
      const rr = R + v * c;
      o[i * 3] = Math.cos(u) * rr;
      o[i * 3 + 1] = v * s;
      o[i * 3 + 2] = Math.sin(u) * rr;
      growTmp[i] = (u / (Math.PI * 2)) * 0.88;
    }
    return o;
  }

  function formIris(r) {
    const o = alloc();
    const pupil = r * 0.27;
    const fibres = 260;
    for (let i = 0; i < P; i++) {
      const roll = RS();
      let a, rr, wob = 0;
      if (roll < 0.09) {
        a = RS() * Math.PI * 2;
        rr = r * (1 + (RS() - 0.5) * 0.012);
        growTmp[i] = 0.9 + (a / (Math.PI * 2)) * 0.1;
      } else if (roll < 0.20) {
        a = RS() * Math.PI * 2;
        rr = pupil * (1 + (RS() - 0.5) * 0.04);
        growTmp[i] = 0.02 + RS() * 0.06;
      } else {
        const f = (RS() * fibres) | 0;
        const jitter = hash2(f + 1, 7) - 0.5;
        a = (f / fibres) * Math.PI * 2 + jitter * 0.02;
        const t = Math.pow(RS(), 0.85);
        rr = pupil + t * (r - pupil) * (0.72 + hash2(f + 3, 11) * 0.3);
        wob = Math.sin(t * 8.5 + f) * r * 0.012;
        growTmp[i] = 0.1 + t * 0.74;
      }
      const dome = -Math.sqrt(Math.max(0, r * r * 2.2 - rr * rr)) * 0.2;
      o[i * 3] = Math.cos(a) * rr - Math.sin(a) * wob;
      o[i * 3 + 1] = Math.sin(a) * rr + Math.cos(a) * wob;
      o[i * 3 + 2] = dome + (RS() - 0.5) * r * 0.01;
    }
    return o;
  }

  function formNeuron(r) {
    const o = alloc();
    const segs = [];
    const box = { span: 1 };

    for (let d = 0; d < 7; d++) {
      const th = (d / 7) * Math.PI * 2 + 0.4;
      const ph = (RS() - 0.5) * 1.1;
      branchOut(segs, box,
        0, 0, 0,
        Math.cos(th) * Math.cos(ph), Math.sin(ph), Math.sin(th) * Math.cos(ph),
        r * 0.2, 1, 0, 4, r * 0.035);
    }
    const axon = [];
    let ax = 0, ay = 0, az = 0, at = 0;
    for (let k = 0; k < 9; k++) {
      const nx = ax - r * 0.17, ny = ay + Math.sin(k * 0.8) * r * 0.035, nz = az + Math.cos(k * 0.6) * r * 0.02;
      const len = Math.hypot(nx - ax, ny - ay, nz - az);
      axon.push([ax, ay, az, nx, ny, nz, 0, at, at + len]);
      at += len;
      ax = nx; ay = ny; az = nz;
    }
    box.span = Math.max(box.span, at);
    for (let k = 0; k < 5; k++) {
      const th = (k / 5) * Math.PI * 2;
      branchOut(axon, box, ax, ay, az, -0.5, Math.cos(th) * 0.7, Math.sin(th) * 0.7, r * 0.1, 3, at, 4, r * 0.03);
    }
    const all = segs.concat(axon);
    const w = spans(all);

    for (let i = 0; i < P; i++) {
      if (RS() < 0.16) {
        const th = RS() * Math.PI * 2, ph = Math.acos(2 * RS() - 1);
        const rr = r * 0.1 * Math.pow(RS(), 0.4);
        o[i * 3] = Math.sin(ph) * Math.cos(th) * rr;
        o[i * 3 + 1] = Math.cos(ph) * rr;
        o[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * rr;
        growTmp[i] = RS() * 0.1;
        continue;
      }
      const s = w.pick(RS());
      const t = RS();
      const j = r * 0.01;
      o[i * 3] = lerp(s[0], s[3], t) + (RS() - 0.5) * j;
      o[i * 3 + 1] = lerp(s[1], s[4], t) + (RS() - 0.5) * j;
      o[i * 3 + 2] = lerp(s[2], s[5], t) + (RS() - 0.5) * j;
      growTmp[i] = 0.1 + (lerp(s[7], s[8], t) / box.span) * 0.86;
    }
    return o;
  }

  function formCosine(r) {
    const o = alloc();
    const a1 = [0.82, 0.42, 0.38], a2 = [0.36, 0.74, -0.57];
    const n1 = Math.hypot(a1[0], a1[1], a1[2]), n2 = Math.hypot(a2[0], a2[1], a2[2]);
    const u = [a1[0] / n1, a1[1] / n1, a1[2] / n1];
    const v = [a2[0] / n2, a2[1] / n2, a2[2] / n2];

    for (let i = 0; i < P; i++) {
      const roll = RS();
      if (roll < 0.46) {
        const th = RS() * Math.PI * 2, ph = Math.acos(2 * RS() - 1);
        const rr = r * (0.99 + (RS() - 0.5) * 0.02);
        o[i * 3] = Math.sin(ph) * Math.cos(th) * rr;
        o[i * 3 + 1] = Math.cos(ph) * rr;
        o[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * rr;
        growTmp[i] = RS() * 0.42;
        continue;
      }
      if (roll < 0.62) {
        const a = RS() * Math.PI * 2;
        const rr = r * (1 + (RS() - 0.5) * 0.008);
        o[i * 3] = Math.cos(a) * rr;
        o[i * 3 + 1] = (RS() - 0.5) * r * 0.008;
        o[i * 3 + 2] = Math.sin(a) * rr;
        growTmp[i] = 0.2 + (a / (Math.PI * 2)) * 0.2;
        continue;
      }
      if (roll < 0.88) {
        const w = RS() < 0.5 ? u : v;
        const t = RS();
        const j = r * 0.006;
        o[i * 3] = w[0] * r * t + (RS() - 0.5) * j;
        o[i * 3 + 1] = w[1] * r * t + (RS() - 0.5) * j;
        o[i * 3 + 2] = w[2] * r * t + (RS() - 0.5) * j;
        growTmp[i] = 0.46 + t * 0.3;
        continue;
      }
      const t = RS();
      const ax = lerp(u[0], v[0], t), ay = lerp(u[1], v[1], t), az = lerp(u[2], v[2], t);
      const m = Math.hypot(ax, ay, az) || 1;
      const rr = r * 0.42;
      o[i * 3] = (ax / m) * rr;
      o[i * 3 + 1] = (ay / m) * rr;
      o[i * 3 + 2] = (az / m) * rr;
      growTmp[i] = 0.8 + t * 0.18;
    }
    return o;
  }

  function formGyro(r) {
    const o = alloc();
    const cages = [
      [1, 0, 0, 0, 1, 0],
      [0.5, 0.86, 0, 0, 0, 1],
      [0.5, -0.5, 0.71, 0.71, 0.5, 0.5]
    ];
    for (let i = 0; i < P; i++) {
      const roll = RS();
      if (roll < 0.26) {
        const th = RS() * Math.PI * 2, ph = Math.acos(2 * RS() - 1);
        const rr = r * 0.2 * Math.pow(RS(), 0.45);
        o[i * 3] = Math.sin(ph) * Math.cos(th) * rr;
        o[i * 3 + 1] = Math.cos(ph) * rr;
        o[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * rr;
        growTmp[i] = RS() * 0.2;
        continue;
      }
      const k = (RS() * cages.length) | 0;
      const c = cages[k];
      const a = RS() * Math.PI * 2;
      const rad = r * (0.52 + k * 0.19);
      const wob = (RS() - 0.5) * r * 0.012;
      const ca = Math.cos(a), sa = Math.sin(a);
      o[i * 3] = (c[0] * ca + c[3] * sa) * rad + wob;
      o[i * 3 + 1] = (c[1] * ca + c[4] * sa) * rad + wob;
      o[i * 3 + 2] = (c[2] * ca + c[5] * sa) * rad + wob;
      growTmp[i] = 0.26 + k * 0.22 + (a / (Math.PI * 2)) * 0.2;
    }
    return o;
  }

  function formGate(s) {
    const o = alloc();
    const h = s * 0.5;
    for (let i = 0; i < P; i++) {
      const roll = RS();
      if (roll < 0.30) {
        const edge = (RS() * 4) | 0;
        const t = RS();
        const j = s * 0.012;
        if (edge < 2) {
          o[i * 3] = lerp(-h, h, t) + (RS() - 0.5) * j;
          o[i * 3 + 1] = (edge === 0 ? h : -h) + (RS() - 0.5) * j;
        } else {
          o[i * 3] = (edge === 2 ? h : -h) + (RS() - 0.5) * j;
          o[i * 3 + 1] = lerp(-h, h, t) + (RS() - 0.5) * j;
        }
        o[i * 3 + 2] = (RS() - 0.5) * j;
        growTmp[i] = (edge / 4) * 0.34 + t * 0.08;
        continue;
      }
      if (roll < 0.88) {
        const t = Math.pow(RS(), 0.6);
        o[i * 3] = (RS() - 0.5) * s * 0.9;
        o[i * 3 + 1] = (RS() - 0.5) * s * 0.9;
        o[i * 3 + 2] = -s * 0.1 - t * s * 0.8;
        growTmp[i] = 0.4 + t * 0.34;
        continue;
      }
      const t = Math.pow(RS(), 0.8);
      const a = RS() * Math.PI * 2;
      const spread = s * (0.04 + t * 0.5);
      o[i * 3] = Math.cos(a) * spread;
      o[i * 3 + 1] = Math.sin(a) * spread;
      o[i * 3 + 2] = t * s * 0.9;
      growTmp[i] = 0.78 + t * 0.2;
    }
    return o;
  }

  function formHorizon(r) {
    const o = alloc();
    const rs = r * 0.34;
    for (let i = 0; i < P; i++) {
      const roll = RS();
      if (roll < 0.70) {
        const t = Math.pow(RS(), 1.7);
        const rad = rs * 1.25 + t * r * 1.05;
        const a = RS() * Math.PI * 2 + t * 5.6;
        const thin = rs * 0.03 + t * r * 0.05;
        o[i * 3] = Math.cos(a) * rad;
        o[i * 3 + 1] = (RS() - 0.5) * thin;
        o[i * 3 + 2] = Math.sin(a) * rad;
        growTmp[i] = 0.1 + (1 - t) * 0.6;
        continue;
      }
      if (roll < 0.90) {
        const a = RS() * Math.PI * 2;
        const rad = rs * (1.02 + (RS() - 0.5) * 0.03);
        const tilt = (RS() - 0.5) * 0.06;
        o[i * 3] = Math.cos(a) * rad;
        o[i * 3 + 1] = Math.sin(a) * rad * Math.cos(tilt);
        o[i * 3 + 2] = Math.sin(a) * rad * Math.sin(tilt);
        growTmp[i] = 0.72 + (a / (Math.PI * 2)) * 0.16;
        continue;
      }
      const up = RS() < 0.5 ? 1 : -1;
      const t = Math.pow(RS(), 0.8);
      const w = rs * (0.05 + t * 0.42);
      const a = RS() * Math.PI * 2;
      o[i * 3] = Math.cos(a) * w;
      o[i * 3 + 1] = up * (rs * 0.4 + t * r * 1.25);
      o[i * 3 + 2] = Math.sin(a) * w;
      growTmp[i] = 0.9 + t * 0.1;
    }
    return o;
  }

  function formCubeVolume(s) {
    const o = alloc();
    const h = s * 0.5;
    for (let i = 0; i < P; i++) {
      const x = (RS() - 0.5) * s, y = (RS() - 0.5) * s, z = (RS() - 0.5) * s;
      const m = Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) || 1;
      const k = 1 + Math.pow(RS(), 0.5) * (h / m - 1);
      o[i * 3] = x * k;
      o[i * 3 + 1] = y * k;
      o[i * 3 + 2] = z * k;
      growTmp[i] = Math.min(0.82, (m * k) / h * 0.8);
    }
    return o;
  }

  function formCubeEdges(s) {
    const o = alloc();
    const h = s * 0.5;
    const c = [[-h, -h, -h], [h, -h, -h], [h, h, -h], [-h, h, -h],
               [-h, -h, h], [h, -h, h], [h, h, h], [-h, h, h]];
    const pairs = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    for (let i = 0; i < P; i++) {
      const corner = RS() < 0.18;
      if (corner) {
        const vi = (RS() * 8) | 0;
        const v = c[vi];
        const j = s * 0.055;
        growTmp[i] = 0.86 + (vi / 8) * 0.12;
        o[i * 3] = v[0] + (RS() - 0.5) * j;
        o[i * 3 + 1] = v[1] + (RS() - 0.5) * j;
        o[i * 3 + 2] = v[2] + (RS() - 0.5) * j;
        continue;
      }
      const ei = (RS() * pairs.length) | 0;
      const e = pairs[ei];
      const a = c[e[0]], b = c[e[1]];
      const t = RS();
      const j = s * 0.006;
      growTmp[i] = ((ei + t) / pairs.length) * 0.84;
      o[i * 3] = lerp(a[0], b[0], t) + (RS() - 0.5) * j;
      o[i * 3 + 1] = lerp(a[1], b[1], t) + (RS() - 0.5) * j;
      o[i * 3 + 2] = lerp(a[2], b[2], t) + (RS() - 0.5) * j;
    }
    return o;
  }

  function formTree(reach, fullness) {
    const o = alloc();
    const segs = [];
    let span = 0;

    function grow(x, y, z, dx, dy, dz, len, depth, from) {
      const ex = x + dx * len, ey = y + dy * len, ez = z + dz * len;
      const at = from + len;
      segs.push([x, y, z, ex, ey, ez, depth, from, at]);
      span = Math.max(span, at);
      if (depth >= (fullness > 0.5 ? 6 : 5) || len < reach * 0.045) return;
      const branches = depth < 2 ? 2 + ((RS() * 2) | 0) : (RS() > 0.42 ? 2 : 1);
      for (let b = 0; b < branches; b++) {
        let nx = dx + (RS() - 0.5) * 1.5;
        let ny = dy + 0.18 + RS() * 0.2;
        let nz = dz + (RS() - 0.5) * 1.5;
        const m = Math.hypot(nx, ny, nz) || 1;
        grow(ex, ey, ez, nx / m, ny / m, nz / m, len * (0.6 + RS() * 0.22), depth + 1, at);
      }
    }

    function root(x, y, z, dx, dy, dz, len, depth, from) {
      const ex = x + dx * len, ey = y + dy * len, ez = z + dz * len;
      const at = from + len;
      segs.push([x, y, z, ex, ey, ez, depth + 9, from, at]);
      span = Math.max(span, at);
      if (depth >= 3 || len < reach * 0.05) return;
      const branches = RS() > 0.5 ? 2 : 1;
      for (let b = 0; b < branches; b++) {
        let nx = dx + (RS() - 0.5) * 1.8;
        let ny = dy - 0.2 - RS() * 0.2;
        let nz = dz + (RS() - 0.5) * 1.8;
        const m = Math.hypot(nx, ny, nz) || 1;
        root(ex, ey, ez, nx / m, ny / m, nz / m, len * (0.58 + RS() * 0.2), depth + 1, at);
      }
    }

    const floor = -reach * 0.42;
    grow(0, floor, 0, 0, 1, 0, reach * 0.3, 0, 0);
    root(0, floor, 0, 0, -1, 0, reach * 0.16, 0, 0);

    const w = spans(segs);

    const half = reach * 0.9, step = (half * 2) / 12;
    for (let i = 0; i < P; i++) {
      if (RS() < 0.2) {
        const lineIdx = (RS() * 13) | 0;
        if (RS() < 0.5) {
          o[i * 3] = (RS() - 0.5) * half * 2;
          o[i * 3 + 2] = -half + lineIdx * step;
        } else {
          o[i * 3] = -half + lineIdx * step;
          o[i * 3 + 2] = (RS() - 0.5) * half * 2;
        }
        o[i * 3 + 1] = floor + (RS() - 0.5) * reach * 0.006;
        growTmp[i] = 0.04;
        continue;
      }
      const s = w.pick(RS());
      const t = RS();
      const depth = s[6] % 9;
      const j = reach * 0.014 * (1 - depth / 7);
      o[i * 3] = lerp(s[0], s[3], t) + (RS() - 0.5) * j;
      o[i * 3 + 1] = lerp(s[1], s[4], t) + (RS() - 0.5) * j;
      o[i * 3 + 2] = lerp(s[2], s[5], t) + (RS() - 0.5) * j;
      growTmp[i] = 0.08 + (lerp(s[7], s[8], t) / span) * 0.9;
    }
    return o;
  }

  function formBinary(r) {
    const o = alloc();
    const sides = [-r * 0.62, r * 0.62];
    const C = [];
    for (let s = 0; s < 2; s++) {
      for (let i = 0; i < 18; i++) {
        const th = RS() * Math.PI * 2, ph = Math.acos(2 * RS() - 1);
        const rr = r * 0.30 * Math.pow(RS(), 0.55);
        C.push([sides[s] + Math.sin(ph) * Math.cos(th) * rr, Math.cos(ph) * rr * 0.78, Math.sin(ph) * Math.sin(th) * rr, s]);
      }
    }
    const L = [];
    for (let i = 0; i < C.length; i++) {
      let best = -1, bd = Infinity;
      for (let j = 0; j < C.length; j++) {
        if (i === j || C[i][3] !== C[j][3]) continue;
        const d = (C[i][0] - C[j][0]) * (C[i][0] - C[j][0]) +
                  (C[i][1] - C[j][1]) * (C[i][1] - C[j][1]) +
                  (C[i][2] - C[j][2]) * (C[i][2] - C[j][2]);
        if (d < bd) { bd = d; best = j; }
      }
      if (best > -1) L.push([i, best]);
    }
    for (let i = 0; i < P; i++) {
      const roll = RS();
      if (roll < 0.09) {
        const t = RS();
        o[i * 3] = lerp(sides[0], sides[1], t);
        o[i * 3 + 1] = Math.sin(t * Math.PI) * r * 0.34;
        o[i * 3 + 2] = (RS() - 0.5) * r * 0.008;
        growTmp[i] = 0.72 + t * 0.26;
      } else if (roll < 0.40) {
        const ci = (RS() * C.length) | 0;
        const c = C[ci];
        const j = r * 0.018;
        o[i * 3] = c[0] + (RS() - 0.5) * j;
        o[i * 3 + 1] = c[1] + (RS() - 0.5) * j;
        o[i * 3 + 2] = c[2] + (RS() - 0.5) * j;
        growTmp[i] = C[ci][3] * 0.34 + (ci % 18) / 18 * 0.2;
      } else {
        const li = (RS() * L.length) | 0;
        const e = L[li];
        const a = C[e[0]], b = C[e[1]];
        const t = RS();
        const j = r * 0.005;
        growTmp[i] = C[e[0]][3] * 0.34 + 0.14 + (li / L.length) * 0.16;
        o[i * 3] = lerp(a[0], b[0], t) + (RS() - 0.5) * j;
        o[i * 3 + 1] = lerp(a[1], b[1], t) + (RS() - 0.5) * j;
        o[i * 3 + 2] = lerp(a[2], b[2], t) + (RS() - 0.5) * j;
      }
    }
    return o;
  }

  function formNetwork(r, hubs, loose) {
    const o = alloc();
    const C = [];
    for (let i = 0; i < hubs; i++) {
      const th = RS() * Math.PI * 2, ph = Math.acos(2 * RS() - 1);
      const rr = r * (0.45 + Math.pow(RS(), 0.6) * 0.75);
      C.push([Math.sin(ph) * Math.cos(th) * rr, Math.cos(ph) * rr * 0.72, Math.sin(ph) * Math.sin(th) * rr]);
    }

    const L = [];
    for (let i = 0; i < hubs; i++) {
      let best = -1, bd = Infinity;
      for (let j = 0; j < hubs; j++) {
        if (i === j) continue;
        const d = (C[i][0] - C[j][0]) ** 2 + (C[i][1] - C[j][1]) ** 2 + (C[i][2] - C[j][2]) ** 2;
        if (d < bd) { bd = d; best = j; }
      }
      L.push([i, best]);
      if (RS() > 0.72) L.push([i, (RS() * hubs) | 0]);
    }

    for (let i = 0; i < P; i++) {
      if (RS() < 0.30) {
        const ci = (RS() * hubs) | 0;
        const c = C[ci];
        const j = r * 0.02;
        o[i * 3] = c[0] + (RS() - 0.5) * j;
        o[i * 3 + 1] = c[1] + (RS() - 0.5) * j;
        o[i * 3 + 2] = c[2] + (RS() - 0.5) * j;
        growTmp[i] = (ci / hubs) * 0.3;
      } else {
        const li = (RS() * L.length) | 0;
        const e = L[li];
        const a = C[e[0]], b = C[e[1]];
        let t = RS();
        growTmp[i] = 0.34 + (li / L.length) * (loose ? 0.62 : 0.5);

        if (loose && (t % 0.16) > 0.08) t = (t + 0.08) % 1;
        const j = r * 0.006;
        o[i * 3] = lerp(a[0], b[0], t) + (RS() - 0.5) * j;
        o[i * 3 + 1] = lerp(a[1], b[1], t) + (RS() - 0.5) * j;
        o[i * 3 + 2] = lerp(a[2], b[2], t) + (RS() - 0.5) * j;
      }
    }
    return o;
  }

  function formConstellation(scaleTo) {
    const nodes = graph.nodes, edges = graph.edges;
    if (!nodes.length || !edges.length) return formNetwork(scaleTo, 34, false);
    const o = alloc();
    let maxR = 1;
    nodes.forEach(n => { maxR = Math.max(maxR, Math.hypot(n.x, n.y, n.z)); });
    const k = scaleTo / maxR;

    for (let i = 0; i < P; i++) {
      if (RS() < 0.34) {
        const n = nodes[(RS() * nodes.length) | 0];
        const j = scaleTo * 0.012;
        o[i * 3] = n.x * k + (RS() - 0.5) * j;
        o[i * 3 + 1] = n.y * k + (RS() - 0.5) * j;
        o[i * 3 + 2] = n.z * k + (RS() - 0.5) * j;
      } else {
        const e = edges[(RS() * edges.length) | 0];
        const a = nodes[e.a], b = nodes[e.b];
        const t = RS();
        o[i * 3] = lerp(a.x, b.x, t) * k;
        o[i * 3 + 1] = lerp(a.y, b.y, t) * k;
        o[i * 3 + 2] = lerp(a.z, b.z, t) * k;
      }
    }
    return o;
  }

  function formPoint(r) {
    const o = alloc();
    for (let i = 0; i < P; i++) {
      const th = RS() * Math.PI * 2, ph = Math.acos(2 * RS() - 1);
      const rr = r * Math.pow(RS(), 0.33);
      o[i * 3] = Math.sin(ph) * Math.cos(th) * rr;
      o[i * 3 + 1] = Math.cos(ph) * rr;
      o[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * rr;
    }
    return o;
  }

  function trace(o, lines, burn, place, step) {
    const per = Math.ceil(P / lines);
    let i = 0;
    for (let l = 0; l < lines && i < P; l++) {
      const q = step.start();
      for (let k = 0; k < burn; k++) step.next(q);
      for (let k = 0; k < per && i < P; k++) {
        for (let n = 0; n < step.sub; n++) step.next(q);
        place(o, i, q);
        growTmp[i] = (k / per) * 0.86;
        i++;
      }
    }
    return o;
  }

  function formLorenz(s) {
    const h = 0.0035;
    return trace(alloc(), 128, 700, (o, i, q) => {
      o[i * 3] = q[0] * s;
      o[i * 3 + 1] = (q[2] - 25) * s;
      o[i * 3 + 2] = q[1] * s;
    }, {
      sub: 3,
      start: () => [(RS() - 0.5) * 20, (RS() - 0.5) * 20, 10 + RS() * 30],
      next(q) {
        const dx = 10 * (q[1] - q[0]), dy = q[0] * (28 - q[2]) - q[1], dz = q[0] * q[1] - (8 / 3) * q[2];
        q[0] += dx * h; q[1] += dy * h; q[2] += dz * h;
      }
    });
  }

  function formAizawa(s) {
    const h = 0.008;
    return trace(alloc(), 160, 900, (o, i, q) => {
      o[i * 3] = q[0] * s;
      o[i * 3 + 1] = (q[2] - 0.6) * s;
      o[i * 3 + 2] = q[1] * s;
    }, {
      sub: 3,
      start: () => [(RS() - 0.5) * 0.4 + 0.1, (RS() - 0.5) * 0.4, RS() * 0.4],
      next(q) {
        const x = q[0], y = q[1], z = q[2];
        const dx = (z - 0.7) * x - 3.5 * y;
        const dy = 3.5 * x + (z - 0.7) * y;
        const dz = 0.6 + 0.95 * z - (z * z * z) / 3 - (x * x + y * y) * (1 + 0.25 * z) + 0.1 * z * x * x * x;
        q[0] += dx * h; q[1] += dy * h; q[2] += dz * h;
      }
    });
  }

  function formThomas(s) {
    const h = 0.045, b = 0.208186;
    return trace(alloc(), 192, 600, (o, i, q) => {
      o[i * 3] = q[0] * s;
      o[i * 3 + 1] = q[1] * s;
      o[i * 3 + 2] = q[2] * s;
    }, {
      sub: 2,
      start: () => [(RS() - 0.5) * 6, (RS() - 0.5) * 6, (RS() - 0.5) * 6],
      next(q) {
        const dx = Math.sin(q[1]) - b * q[0], dy = Math.sin(q[2]) - b * q[1], dz = Math.sin(q[0]) - b * q[2];
        q[0] += dx * h; q[1] += dy * h; q[2] += dz * h;
      }
    });
  }

  const MAKERS = {
    genesis:       () => formPoint(3),
    storm:         () => formCubeEdges(126),
    thought:       () => formLorenz(4.6),
    orbit:         () => formAizawa(88),
    coda:          () => formThomas(34),
    dust:          () => formDust(150),
    vortex:        () => formVortex(160),
    beacon:        () => formBeacon(128),
    iris:          () => formIris(120),
    cube:          () => formCubeVolume(126),
    lattice:       () => formCubeLattice(140, 3),
    edges:         () => formCubeEdges(126),
    gyro:          () => formGyro(120),
    gate:          () => formGate(150),
    horizon:       () => formHorizon(150),
    tree:          () => formTree(150, 0),
    forest:        () => formForest(190, 5),
    vector:        () => formVector(150, 26),
    cosine:        () => formCosine(112),
    neuron:        () => formNeuron(150),
    network:       () => formNetwork(140, 40, false),
    networkLoose:  () => formNetwork(140, 40, true),
    binary:        () => formBinary(168),
    mobius:        () => formMobius(96, 34),
    binaryBridge:  () => formBinary(168),
    constellation: () => formConstellation(135),
    cloud:         () => formDust(360)
  };

  function pack(positions) {
    const out = new Float32Array(P * 4);
    for (let i = 0; i < P; i++) {
      out[i * 4] = positions[i * 3];
      out[i * 4 + 1] = positions[i * 3 + 1];
      out[i * 4 + 2] = positions[i * 3 + 2];
      out[i * 4 + 3] = growTmp[i];
    }
    return out;
  }

  return {
    count: P,
    make(name) {
      const fn = MAKERS[name] || MAKERS.dust;
      return pack(fn());
    }
  };
}
