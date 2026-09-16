import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(import.meta.url);
const [, , CSV_ARG, OUT_ARG] = process.argv;
const CSV_PATH = CSV_ARG || new URL('./koi_cumulative.csv', import.meta.url);
const OUT_PATH = OUT_ARG || new URL('../data/koi-latent.json', import.meta.url);
const METRICS_PATH = new URL('./metrics.json', import.meta.url);
const FEATURES = ['koi_period', 'koi_duration', 'koi_depth', 'koi_prad', 'koi_teq', 'koi_insol', 'koi_impact', 'koi_model_snr', 'koi_steff', 'koi_slogg', 'koi_srad', 'koi_kepmag'];
const DISPOSITION = { CONFIRMED: 0, CANDIDATE: 1, 'FALSE POSITIVE': 2 };
const F = FEATURES.length;
const SEED = 20190130;

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const split = (line) => {
    const out = [];
    let cell = '';
    let quoted = false;
    for (const ch of line) {
      if (ch === '"') quoted = !quoted;
      else if (ch === ',' && !quoted) {
        out.push(cell);
        cell = '';
      } else cell += ch;
    }
    out.push(cell);
    return out;
  };
  const head = split(lines[0]);
  return lines.slice(1).map((line) => Object.fromEntries(split(line).map((v, i) => [head[i], v])));
}

function inverseNormal(p) {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const low = 0.02425;
  if (p < low) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - low) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

function prepareData() {
  const rows = parseCsv(readFileSync(CSV_PATH, 'utf8')).filter((r) => r.koi_disposition in DISPOSITION);
  const n = rows.length;
  const raw = new Float64Array(n * F);
  const observed = new Uint8Array(n * F);
  rows.forEach((r, i) => {
    FEATURES.forEach((key, j) => {
      const v = r[key] === '' ? NaN : Number(r[key]);
      if (Number.isFinite(v)) {
        raw[i * F + j] = v;
        observed[i * F + j] = 1;
      }
    });
  });

  const random = mulberry32(SEED);
  const split = new Uint8Array(n);
  for (const cls of [0, 1, 2]) {
    const idx = rows.map((r, i) => (DISPOSITION[r.koi_disposition] === cls ? i : -1)).filter((i) => i >= 0);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    idx.forEach((row, k) => {
      const f = k / idx.length;
      split[row] = f < 0.8 ? 0 : f < 0.9 ? 1 : 2;
    });
  }

  const sorted = FEATURES.map((_, j) => {
    const values = [];
    for (let i = 0; i < n; i++) if (split[i] === 0 && observed[i * F + j]) values.push(raw[i * F + j]);
    return Float64Array.from(values).sort();
  });

  const bound = (arr, v, upper) => {
    let lo = 0;
    let hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (upper ? arr[mid] <= v : arr[mid] < v) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };

  const X = new Float32Array(n * F);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < F; j++) {
      if (!observed[i * F + j]) continue;
      const arr = sorted[j];
      const rank = (bound(arr, raw[i * F + j], false) + bound(arr, raw[i * F + j], true)) / 2;
      const p = Math.min(0.999, Math.max(0.001, rank / arr.length));
      X[i * F + j] = inverseNormal(p);
    }
  }

  return {
    n,
    X,
    M: Float32Array.from(observed),
    split,
    disposition: Uint8Array.from(rows, (r) => DISPOSITION[r.koi_disposition]),
    rows
  };
}

const swish = (z) => z / (1 + Math.exp(-z));

function createNet(sizes, random) {
  const gaussian = () => Math.sqrt(-2 * Math.log(random() + 1e-12)) * Math.cos(2 * Math.PI * random());
  return sizes.slice(0, -1).map((inSize, l) => {
    const outSize = sizes[l + 1];
    const std = Math.sqrt(1.6 / inSize);
    return {
      inSize,
      outSize,
      linear: false,
      W: Float32Array.from({ length: inSize * outSize }, () => gaussian() * std),
      b: new Float32Array(outSize),
      gW: new Float32Array(inSize * outSize),
      gb: new Float32Array(outSize),
      mW: new Float32Array(inSize * outSize),
      vW: new Float32Array(inSize * outSize),
      mb: new Float32Array(outSize),
      vb: new Float32Array(outSize)
    };
  });
}

function forward(net, input, cache) {
  let a = input;
  for (let l = 0; l < net.length; l++) {
    const L = net[l];
    const z = cache.z[l];
    const out = cache.a[l];
    for (let o = 0; o < L.outSize; o++) {
      let s = L.b[o];
      const row = o * L.inSize;
      for (let i = 0; i < L.inSize; i++) s += L.W[row + i] * a[i];
      z[o] = s;
      out[o] = L.linear ? s : swish(s);
    }
    a = out;
  }
  return a;
}

function backward(net, input, cache, delta) {
  for (let l = net.length - 1; l >= 0; l--) {
    const L = net[l];
    const z = cache.z[l];
    if (!L.linear) {
      for (let o = 0; o < L.outSize; o++) {
        const s = 1 / (1 + Math.exp(-z[o]));
        delta[o] *= s + z[o] * s * (1 - s);
      }
    }
    const prev = l === 0 ? input : cache.a[l - 1];
    const next = cache.d[l];
    next.fill(0);
    for (let o = 0; o < L.outSize; o++) {
      const g = delta[o];
      if (g === 0) continue;
      L.gb[o] += g;
      const row = o * L.inSize;
      for (let i = 0; i < L.inSize; i++) {
        L.gW[row + i] += g * prev[i];
        next[i] += L.W[row + i] * g;
      }
    }
    delta = next;
  }
}

function makeCache(net) {
  return {
    z: net.map((L) => new Float32Array(L.outSize)),
    a: net.map((L) => new Float32Array(L.outSize)),
    d: net.map((L) => new Float32Array(L.inSize))
  };
}

function train(data, latent) {
  const random = mulberry32(SEED + latent * 101);
  const gaussian = () => Math.sqrt(-2 * Math.log(random() + 1e-12)) * Math.cos(2 * Math.PI * random());
  const sizes = [2 * F, 96, 48, 24, latent, 24, 48, 96, F];
  const net = createNet(sizes, random);
  const LATENT_LAYER = 3;
  net[LATENT_LAYER].linear = true;
  net[net.length - 1].linear = true;
  const cache = makeCache(net);

  const train = [];
  const val = [];
  const test = [];
  for (let i = 0; i < data.n; i++) [train, val, test][data.split[i]].push(i);

  const input = new Float32Array(2 * F);
  const outDelta = new Float32Array(F);
  const EPOCHS = 400;
  const WARMUP = 6;
  const BATCH = 128;
  const LR_MAX = 0.003;
  const LR_MIN = 0.00002;
  const WEIGHT_DECAY = 0.0001;
  const NOISE = 0.15;
  const DROP = 0.15;
  const PATIENCE = 35;
  const B1 = 0.9;
  const B2 = 0.999;
  let step = 0;

  const fillInput = (row, noisy) => {
    for (let j = 0; j < F; j++) {
      const k = row * F + j;
      const keep = data.M[k] && (!noisy || random() > DROP);
      input[j] = keep ? data.X[k] + (noisy ? gaussian() * NOISE : 0) : 0;
      input[F + j] = keep ? 1 : 0;
    }
  };

  const evaluate = (rows) => {
    let sum = 0;
    let count = 0;
    for (const row of rows) {
      fillInput(row, false);
      const out = forward(net, input, cache);
      for (let j = 0; j < F; j++) {
        if (!data.M[row * F + j]) continue;
        sum += (out[j] - data.X[row * F + j]) ** 2;
        count++;
      }
    }
    return sum / count;
  };

  const snapshot = () => net.map((L) => ({ W: L.W.slice(), b: L.b.slice() }));
  let best = { loss: Infinity, epoch: 0, params: snapshot() };
  const curve = [];

  for (let epoch = 0; epoch < EPOCHS; epoch++) {
    const lr = epoch < WARMUP
      ? LR_MAX * (epoch + 1) / WARMUP
      : LR_MIN + 0.5 * (LR_MAX - LR_MIN) * (1 + Math.cos(Math.PI * (epoch - WARMUP) / (EPOCHS - WARMUP)));

    for (let i = train.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [train[i], train[j]] = [train[j], train[i]];
    }

    for (let start = 0; start < train.length; start += BATCH) {
      const end = Math.min(train.length, start + BATCH);
      let observedCount = 0;
      for (let s = start; s < end; s++) for (let j = 0; j < F; j++) observedCount += data.M[train[s] * F + j];

      for (let s = start; s < end; s++) {
        const row = train[s];
        fillInput(row, true);
        const out = forward(net, input, cache);
        for (let j = 0; j < F; j++) {
          const k = row * F + j;
          outDelta[j] = data.M[k] ? (2 * (out[j] - data.X[k])) / observedCount : 0;
        }
        backward(net, input, cache, Float32Array.from(outDelta));
      }

      step++;
      const c1 = 1 - B1 ** step;
      const c2 = 1 - B2 ** step;
      for (const L of net) {
        for (let k = 0; k < L.W.length; k++) {
          const g = L.gW[k];
          L.mW[k] = B1 * L.mW[k] + (1 - B1) * g;
          L.vW[k] = B2 * L.vW[k] + (1 - B2) * g * g;
          L.W[k] -= lr * ((L.mW[k] / c1) / (Math.sqrt(L.vW[k] / c2) + 1e-8) + WEIGHT_DECAY * L.W[k]);
          L.gW[k] = 0;
        }
        for (let k = 0; k < L.b.length; k++) {
          const g = L.gb[k];
          L.mb[k] = B1 * L.mb[k] + (1 - B1) * g;
          L.vb[k] = B2 * L.vb[k] + (1 - B2) * g * g;
          L.b[k] -= lr * (L.mb[k] / c1) / (Math.sqrt(L.vb[k] / c2) + 1e-8);
          L.gb[k] = 0;
        }
      }
    }

    const valLoss = evaluate(val);
    curve.push(Math.round(valLoss * 10000) / 10000);
    if (valLoss < best.loss - 1e-5) best = { loss: valLoss, epoch, params: snapshot() };
    else if (epoch - best.epoch > PATIENCE) break;
    if (epoch % 20 === 0) parentPort?.postMessage({ progress: `k=${latent} epoch ${epoch} val ${valLoss.toFixed(4)} best ${best.loss.toFixed(4)}@${best.epoch}` });
  }

  best.params.forEach((p, l) => {
    net[l].W.set(p.W);
    net[l].b.set(p.b);
  });

  const codes = new Float32Array(data.n * latent);
  const rowError = new Float32Array(data.n);
  for (let row = 0; row < data.n; row++) {
    fillInput(row, false);
    const out = forward(net, input, cache);
    codes.set(cache.a[LATENT_LAYER].subarray(0, latent), row * latent);
    let sum = 0;
    let count = 0;
    for (let j = 0; j < F; j++) {
      if (!data.M[row * F + j]) continue;
      sum += (out[j] - data.X[row * F + j]) ** 2;
      count++;
    }
    rowError[row] = count ? sum / count : 0;
  }

  return { net, codes, rowError, curve, bestEpoch: best.epoch, valLoss: best.loss, testLoss: evaluate(test), train, test };
}

function jacobiEigen(matrix, size) {
  const A = Float64Array.from(matrix);
  const V = new Float64Array(size * size);
  for (let i = 0; i < size; i++) V[i * size + i] = 1;
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0;
    for (let p = 0; p < size; p++) for (let q = p + 1; q < size; q++) off += A[p * size + q] ** 2;
    if (off < 1e-12) break;
    for (let p = 0; p < size; p++) {
      for (let q = p + 1; q < size; q++) {
        const apq = A[p * size + q];
        if (Math.abs(apq) < 1e-15) continue;
        const theta = (A[q * size + q] - A[p * size + p]) / (2 * apq);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < size; k++) {
          const akp = A[k * size + p];
          const akq = A[k * size + q];
          A[k * size + p] = c * akp - s * akq;
          A[k * size + q] = s * akp + c * akq;
        }
        for (let k = 0; k < size; k++) {
          const apk = A[p * size + k];
          const aqk = A[q * size + k];
          A[p * size + k] = c * apk - s * aqk;
          A[q * size + k] = s * apk + c * aqk;
        }
        for (let k = 0; k < size; k++) {
          const vkp = V[k * size + p];
          const vkq = V[k * size + q];
          V[k * size + p] = c * vkp - s * vkq;
          V[k * size + q] = s * vkp + c * vkq;
        }
      }
    }
  }
  const order = Array.from({ length: size }, (_, i) => i).sort((i, j) => A[j * size + j] - A[i * size + i]);
  return { values: order.map((i) => A[i * size + i]), vectors: order.map((i) => Array.from({ length: size }, (_, k) => V[k * size + i])) };
}

function pcaBaseline(data, trainRows, testRows, k) {
  const mean = new Float64Array(F);
  for (const row of trainRows) for (let j = 0; j < F; j++) mean[j] += data.X[row * F + j];
  mean.forEach((_, j) => (mean[j] /= trainRows.length));
  const cov = new Float64Array(F * F);
  for (const row of trainRows) {
    for (let a = 0; a < F; a++) {
      const da = data.X[row * F + a] - mean[a];
      for (let b = 0; b < F; b++) cov[a * F + b] += da * (data.X[row * F + b] - mean[b]);
    }
  }
  cov.forEach((_, i) => (cov[i] /= trainRows.length - 1));
  const { vectors, values } = jacobiEigen(cov, F);
  const basis = vectors.slice(0, k);
  const project = (row) => basis.map((v) => v.reduce((s, vj, j) => s + vj * (data.X[row * F + j] - mean[j]), 0));

  let sum = 0;
  let count = 0;
  for (const row of testRows) {
    const z = project(row);
    for (let j = 0; j < F; j++) {
      if (!data.M[row * F + j]) continue;
      const recon = mean[j] + basis.reduce((s, v, c) => s + v[j] * z[c], 0);
      sum += (recon - data.X[row * F + j]) ** 2;
      count++;
    }
  }
  const total = values.reduce((s, v) => s + v, 0);
  return {
    testLoss: sum / count,
    explained: values.slice(0, k).reduce((s, v) => s + v, 0) / total,
    codes: (rows) => rows.map(project)
  };
}

function neighborRanks(points, dims, n) {
  const ranks = [];
  const neighbors = [];
  for (let i = 0; i < n; i++) {
    const dist = new Float64Array(n);
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let d = 0; d < dims; d++) s += (points[i * dims + d] - points[j * dims + d]) ** 2;
      dist[j] = i === j ? Infinity : s;
    }
    const order = Array.from({ length: n }, (_, j) => j).sort((a, b) => dist[a] - dist[b]);
    const rank = new Int32Array(n);
    order.forEach((j, r) => (rank[j] = r + 1));
    ranks.push(rank);
    neighbors.push(order);
  }
  return { ranks, neighbors };
}

function structureMetrics(data, sample, latentCodes, dims, K = 10) {
  const n = sample.length;
  const input = new Float64Array(n * F);
  sample.forEach((row, i) => {
    for (let j = 0; j < F; j++) input[i * F + j] = data.X[row * F + j];
  });
  const high = neighborRanks(input, F, n);
  const low = neighborRanks(latentCodes, dims, n);

  let trust = 0;
  let cont = 0;
  let agreeLow = 0;
  let agreeHigh = 0;
  for (let i = 0; i < n; i++) {
    const highSet = new Set(high.neighbors[i].slice(0, K));
    const lowSet = new Set(low.neighbors[i].slice(0, K));
    for (const j of lowSet) if (!highSet.has(j)) trust += high.ranks[i][j] - K;
    for (const j of highSet) if (!lowSet.has(j)) cont += low.ranks[i][j] - K;
    const label = data.disposition[sample[i]];
    for (const j of lowSet) agreeLow += data.disposition[sample[j]] === label;
    for (const j of highSet) agreeHigh += data.disposition[sample[j]] === label;
  }
  const norm = 2 / (n * K * (2 * n - 3 * K - 1));
  return {
    trustworthiness: 1 - norm * trust,
    continuity: 1 - norm * cont,
    knnLatent: agreeLow / (n * K),
    knnInput: agreeHigh / (n * K)
  };
}

if (!isMainThread) {
  const data = prepareData();
  const latent = workerData.latent;
  const result = train(data, latent);
  const pca = pcaBaseline(data, result.train, result.test, latent);

  const random = mulberry32(SEED + 7);
  const sample = [...result.test];
  const pool = Array.from({ length: data.n }, (_, i) => i).filter((i) => data.split[i] !== 2);
  while (sample.length < 1800) sample.push(pool[Math.floor(random() * pool.length)]);
  const aeSample = new Float64Array(sample.length * latent);
  sample.forEach((row, i) => {
    for (let d = 0; d < latent; d++) aeSample[i * latent + d] = result.codes[row * latent + d];
  });
  const pcaSample = Float64Array.from(pca.codes(sample).flat());

  parentPort.postMessage({
    done: true,
    latent,
    bestEpoch: result.bestEpoch,
    epochsRun: result.curve.length,
    curve: result.curve,
    valLoss: result.valLoss,
    testLoss: result.testLoss,
    pcaTestLoss: pca.testLoss,
    pcaExplained: pca.explained,
    autoencoder: structureMetrics(data, sample, aeSample, latent),
    pca: structureMetrics(data, sample, pcaSample, latent),
    codes: result.codes,
    rowError: result.rowError
  });
} else {
  const data = prepareData();
  const counts = [0, 0, 0];
  data.split.forEach((s) => counts[s]++);
  let missing = 0;
  data.M.forEach((m) => (missing += 1 - m));
  console.log(`rows ${data.n} · train ${counts[0]} · val ${counts[1]} · test ${counts[2]} · missing cells ${missing}`);

  const results = await Promise.all([2, 3, 4].map((latent) => new Promise((resolve, reject) => {
    const worker = new Worker(HERE, { workerData: { latent } });
    worker.on('message', (msg) => (msg.done ? resolve(msg) : console.log(msg.progress)));
    worker.on('error', reject);
  })));

  const round = (v, d = 4) => Math.round(v * 10 ** d) / 10 ** d;
  const summary = results.map((r) => ({
    latent: r.latent,
    epochs: r.epochsRun,
    bestEpoch: r.bestEpoch,
    valMse: round(r.valLoss),
    testMse: round(r.testLoss),
    pcaTestMse: round(r.pcaTestLoss),
    pcaExplained: round(r.pcaExplained, 3),
    autoencoder: Object.fromEntries(Object.entries(r.autoencoder).map(([k, v]) => [k, round(v, 3)])),
    pca: Object.fromEntries(Object.entries(r.pca).map(([k, v]) => [k, round(v, 3)]))
  }));
  console.log(JSON.stringify(summary, null, 1));
  writeFileSync(METRICS_PATH, JSON.stringify(summary, null, 1));

  const chosen = results.find((r) => r.latent === 3);
  const n = data.n;
  const pos = chosen.codes;
  const center = [0, 1, 2].map((d) => {
    const axis = Float64Array.from({ length: n }, (_, i) => pos[i * 3 + d]).sort();
    return axis[n >> 1];
  });
  const radii = Float64Array.from({ length: n }, (_, i) => Math.hypot(pos[i * 3] - center[0], pos[i * 3 + 1] - center[1], pos[i * 3 + 2] - center[2])).sort();
  const scale = radii[Math.floor(n * 0.97)];
  const errorsSorted = Float64Array.from(chosen.rowError).sort();
  const rarity = (e) => {
    let lo = 0;
    let hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (errorsSorted[mid] < e) lo = mid + 1;
      else hi = mid;
    }
    return lo / n;
  };

  const num = (v, d) => {
    const x = Number(v);
    return v === '' || !Number.isFinite(x) ? -1 : round(x, d);
  };
  const points = [];
  const names = {};
  data.rows.forEach((r, i) => {
    for (let d = 0; d < 3; d++) points.push(round(Math.tanh(((pos[i * 3 + d] - center[d]) / scale) * 1.1) * 0.94, 3));
    points.push(data.disposition[i], num(r.koi_prad, 2), num(r.koi_teq, 0), num(r.koi_period, 3), round(rarity(chosen.rowError[i]), 3));
    const name = (r.kepler_name || '').trim();
    if (/^[A-Za-z0-9 .\-]{1,32}$/.test(name)) names[i] = name;
  });

  const best3 = summary.find((s) => s.latent === 3);
  writeFileSync(OUT_PATH, JSON.stringify({
    version: 2,
    source: 'NASA Exoplanet Archive, KOI cumulative table',
    model: 'denoising autoencoder 24-96-48-24-3-24-48-96-12, swish, AdamW, cosine schedule, early stopping',
    features: FEATURES,
    metrics: best3,
    stride: 8,
    fields: ['x', 'y', 'z', 'disposition', 'prad', 'teq', 'period', 'rarity'],
    count: n,
    points,
    names
  }));
  console.log(`guardadas ${n} posiciones y ${Object.keys(names).length} nombres`);
}
