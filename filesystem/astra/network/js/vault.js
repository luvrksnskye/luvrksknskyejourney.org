import { rng, state } from './core.js?v=1';

const GRAPH = '/filesystem/astra/data/graph.json';
const PEERS = 'data/peers.json?v=1';

const DIRS = [[0.00, 0.58, -0.81], [0.82, 0.24, 0.52], [-0.78, 0.30, 0.55], [0.10, -0.74, -0.66]];
const STAGES = { nebula: 0.7, protostar: 0.95, 'main-sequence': 1.25, giant: 1.7, remnant: 0.8 };

const R_HOME = 62;
const PEER_OFFSET = [205, 6, -30];

const STOP = new Set(('a an the of and or to in on is it as by for that which what why how you your i my we not no be are was ' +
  'were with from at into over under about out up down this these those its his her their them they he she do does did has ' +
  'have had can could will would should than then so if but also more most much very one two three el la los las de del y o ' +
  'que en un una para por con sin es son fue como mas muy sobre entre este esta esto').split(' '));

const nodes = [];
const edges = [];
const bySlug = new Map();
const categories = [];
const stats = { nodes: 0, links: 0, loose: 0, pub: 0, astra: 0, apollo: 0 };
const df = new Map();

let maxCat = 1;
let radius = 1;
let loaded = false;
let ok = false;
let peerName = '';

function tokens(str) {
  return String(str).toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ').split(/[\s-]+/)
    .filter(w => w.length > 2 && !STOP.has(w));
}

async function grab(url) {
  try {
    const res = await fetch(url, { credentials: 'omit', cache: 'no-cache' });
    if (!res.ok) return null;
    const body = await res.json();
    return body && typeof body === 'object' ? body : null;
  } catch (_) {
    return null;
  }
}

function safeText(value, cap) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069\ufeff]/g, '').slice(0, cap).trim();
}

function ownPath(url) {
  const clean = safeText(url, 300);
  return /^\/[^/\\]/.test(clean) ? clean : '';
}

function place(station, groupIndex, i, count) {
  const dir = DIRS[groupIndex % DIRS.length];
  const off = station === 'ASTRA' ? [0, 0, 0] : PEER_OFFSET;
  const spread = 14 + Math.min(count, 40) * 0.42;
  const rand = rng(0xA57A + groupIndex * 977 + i * 31);
  const g = i * 2.399963229728653;
  const y = count === 1 ? 0 : 1 - (i / (count - 1)) * 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  return {
    x: dir[0] * R_HOME + off[0] + Math.cos(g) * r * spread + (rand() - 0.5) * spread * 0.5,
    y: dir[1] * R_HOME * 0.66 + off[1] + y * spread * 0.72 + (rand() - 0.5) * spread * 0.45,
    z: dir[2] * R_HOME + off[2] + Math.sin(g) * r * spread + (rand() - 0.5) * spread * 0.5
  };
}

function readStation(graph, station) {
  const list = Array.isArray(graph && graph.nodes) ? graph.nodes : [];
  const groups = new Map();

  list.forEach(raw => {
    const slug = safeText(raw && raw.id, 120).toLowerCase();
    if (!slug || bySlug.has(slug)) return;
    const domain = safeText(raw.domain, 40).toLowerCase() || 'unfiled';
    if (!groups.has(domain)) groups.set(domain, []);
    groups.get(domain).push({ slug: slug, raw: raw });
  });

  let group = station === 'ASTRA' ? 0 : 2;
  for (const [domain, members] of groups) {
    members.forEach((m, i) => {
      const raw = m.raw;
      const spot = place(station, group, i, members.length);
      const node = {
        id: nodes.length,
        slug: m.slug,
        title: safeText(raw.title, 200) || m.slug,
        type: safeText(raw.type, 40).toLowerCase(),
        stage: safeText(raw.stage, 30).toLowerCase(),
        abstract: safeText(raw.summary, 600),
        url: ownPath(raw.url),
        tags: Array.isArray(raw.tags) ? raw.tags.map(t => safeText(t, 40)).filter(Boolean).slice(0, 12) : [],
        listed: raw.listed !== false,
        featured: raw.featured === true,
        date: safeText(raw.date, 30),
        vis: raw.listed === false ? 'quiet' : 'public',
        status: 'published',
        domain: station === 'ASTRA' ? domain : 'peer:' + domain,
        domainName: domain.toUpperCase(),
        station: station,
        x: spot.x,
        y: spot.y,
        z: spot.z,
        weight: STAGES[safeText(raw.stage, 30).toLowerCase()] || 1,
        links: [],
        loose: [],
        deg: 0,
        sealed: station !== 'ASTRA',
        related: Array.isArray(raw.related) ? raw.related.map(r => safeText(r, 120).toLowerCase()) : []
      };
      nodes.push(node);
      bySlug.set(node.slug, node);
    });
    group++;
  }

  const seen = new Set();
  (Array.isArray(graph && graph.edges) ? graph.edges : []).forEach(e => {
    const a = bySlug.get(safeText(e && e.from, 120).toLowerCase());
    const b = bySlug.get(safeText(e && e.to, 120).toLowerCase());
    if (!a || !b || a === b) return;
    const key = a.id < b.id ? a.id + ':' + b.id : b.id + ':' + a.id;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ a: a.id, b: b.id, kind: 'link', cross: a.station !== b.station });
    a.links.push(b.id); b.links.push(a.id);
    a.deg++; b.deg++;
  });

  nodes.forEach(a => {
    a.related.forEach(slug => {
      const b = bySlug.get(slug);
      if (!b || b === a || a.links.indexOf(b.id) > -1) return;
      const key = a.id < b.id ? a.id + ':' + b.id : b.id + ':' + a.id;
      if (seen.has(key)) return;
      seen.add(key);
      edges.push({ a: a.id, b: b.id, kind: 'loose', cross: a.station !== b.station });
      a.loose.push(b.id); b.loose.push(a.id);
    });
  });
}

function index() {
  nodes.forEach(nd => {
    const counted = new Map();
    tokens([nd.title, nd.abstract, nd.domainName, nd.type, nd.tags.join(' '), nd.slug].join(' '))
      .forEach(w => counted.set(w, (counted.get(w) || 0) + 1));
    nd.vec = counted;
    for (const w of counted.keys()) df.set(w, (df.get(w) || 0) + 1);
  });

  const N = nodes.length || 1;
  nodes.forEach(nd => {
    let sum = 0;
    for (const [w, c] of nd.vec) {
      const weight = (1 + Math.log(c)) * Math.log(1 + N / (df.get(w) || 1));
      nd.vec.set(w, weight);
      sum += weight * weight;
    }
    const mag = Math.sqrt(sum) || 1;
    for (const [w, v] of nd.vec) nd.vec.set(w, v / mag);
  });
}

function summarise() {
  const byDomain = new Map();
  nodes.forEach(nd => {
    if (!byDomain.has(nd.domain)) byDomain.set(nd.domain, { id: nd.domain, name: nd.domainName, station: nd.station, count: 0, pub: 0 });
    const c = byDomain.get(nd.domain);
    c.count++;
    if (nd.listed) c.pub++;
  });
  categories.length = 0;
  for (const c of byDomain.values()) categories.push(c);
  maxCat = categories.reduce((m, c) => Math.max(m, c.count), 1);

  stats.nodes = nodes.length;
  stats.links = edges.filter(e => e.kind === 'link').length;
  stats.loose = edges.filter(e => e.kind === 'loose').length;
  stats.pub = nodes.filter(n => n.listed).length;
  stats.astra = nodes.filter(n => n.station === 'ASTRA').length;
  stats.apollo = nodes.length - stats.astra;

  radius = 1;
  nodes.forEach(n => { radius = Math.max(radius, Math.hypot(n.x, n.y, n.z)); });
}

async function load() {
  if (loaded) return data;
  loaded = true;

  const graph = await grab(GRAPH);
  ok = !!graph;
  readStation(graph, 'ASTRA');

  const peers = await grab(PEERS);
  const first = peers && Array.isArray(peers.stations) ? peers.stations[0] : null;
  if (first) {
    peerName = safeText(first.station, 40).toUpperCase();
    readStation(first, peerName || 'PEER');
  }

  index();
  summarise();
  return data;
}

function peerOpen() { return state.peer === 'open'; }

function find(query, limit) {
  const raw = tokens(query);
  if (!raw.length || !nodes.length) return [];

  const N = nodes.length;
  const q = new Map();
  raw.forEach(w => q.set(w, (q.get(w) || 0) + 1));

  let sum = 0;
  for (const [w, c] of q) {
    const weight = c * Math.log(1 + N / (df.get(w) || 1));
    q.set(w, weight);
    sum += weight * weight;
  }
  const mag = Math.sqrt(sum) || 1;
  const needle = query.toLowerCase().trim();

  const out = [];
  nodes.forEach(nd => {
    if (nd.sealed && !peerOpen()) return;
    let dot = 0;
    for (const [w, v] of q) {
      const nv = nd.vec.get(w);
      if (nv) dot += (v / mag) * nv;
    }
    const lit = nd.title.toLowerCase().indexOf(needle);
    if (lit > -1 && needle.length > 2) dot += 0.22 - Math.min(0.12, lit * 0.004);
    if (dot > 0.02) out.push({ node: nd, score: dot });
  });

  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit || 12);
}

function titleOf(nd) {
  return nd.sealed && !peerOpen() ? 'Unresolved record' : nd.title;
}

function abstractOf(nd) {
  if (nd.sealed && !peerOpen()) return 'Held in the mirror, unverified. Open the ARCHE link to check this record against its manifest and read it.';
  return nd.abstract || 'No summary in the front matter of this note.';
}

export const data = {
  nodes, edges, stats, bySlug, categories, find, titleOf, abstractOf, load,
  get maxCat() { return maxCat; },
  get radius() { return radius; },
  get peerName() { return peerName; },
  get empty() { return nodes.length === 0; },
  get ok() { return ok; },
  get: id => nodes[id]
};
