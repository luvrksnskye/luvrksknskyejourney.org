const PATH = '/now-playing';
const API = 'https://ws.audioscrobbler.com/2.0/';
const FRESH_MS = 30_000;
const REVALIDATE_MS = 120_000;
const FALLBACK_MS = 3_600_000;
const TIMEOUT_MS = 4_000;
const SNAPSHOT_KEY = 'https://now-playing.cache/snapshot';
const BLANK_ART = '2a96cbd8b46e442fc41c2b86b821562f';
const TRACK_HOSTS = new Set(['www.last.fm', 'last.fm']);
const IMAGE_HOSTS = new Set(['lastfm.freetls.fastly.net']);
const JSON_TYPE = 'application/json; charset=utf-8';

const BASE_HEADERS = Object.freeze({
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
  'cross-origin-resource-policy': 'cross-origin',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  vary: 'Origin'
});

const encoder = new TextEncoder();

let memo = null;
let inflight = null;

function safeUrl(value, hosts) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && hosts.has(url.hostname) ? url.href : null;
  } catch {
    return null;
  }
}

function clean(value, max = 256) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function normalize(data) {
  const list = data?.recenttracks?.track;
  const item = Array.isArray(list) ? list[0] : list;
  if (!item || typeof item !== 'object') return { live: false, track: null };

  const image = Array.isArray(item.image)
    ? item.image.map((entry) => entry?.['#text']).filter(Boolean).at(-1)
    : null;
  const playedAt = Number.parseInt(item.date?.uts, 10);

  return {
    live: item['@attr']?.nowplaying === 'true',
    track: {
      name: clean(item.name),
      artist: clean(item.artist?.['#text'] ?? item.artist?.name),
      album: clean(item.album?.['#text']),
      url: safeUrl(item.url, TRACK_HOSTS),
      image: image && !image.includes(BLANK_ART) ? safeUrl(image, IMAGE_HOSTS) : null,
      playedAt: Number.isFinite(playedAt) ? playedAt : null
    }
  };
}

async function fingerprint(body) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(body)));
  let hex = '';
  for (let i = 0; i < 12; i++) hex += digest[i].toString(16).padStart(2, '0');
  return `"${hex}"`;
}

async function pull(env) {
  if (!env.LASTFM_API_KEY || !env.LASTFM_USER) throw new Error('config');

  const url = new URL(API);
  url.search = new URLSearchParams({
    method: 'user.getrecenttracks',
    user: env.LASTFM_USER,
    api_key: env.LASTFM_API_KEY,
    limit: '1',
    format: 'json'
  }).toString();

  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': 'now-playing-worker' },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`upstream ${response.status}`);

  const data = await response.json();
  if (data?.error) throw new Error(`upstream ${data.error}`);

  const body = JSON.stringify(normalize(data));
  return { body, etag: await fingerprint(body), at: Date.now() };
}

async function readEdge() {
  try {
    const hit = await caches.default.match(SNAPSHOT_KEY);
    if (!hit) return null;
    const at = Number(hit.headers.get('x-snapshot-at'));
    const etag = hit.headers.get('etag');
    if (!Number.isFinite(at) || !etag) return null;
    return { body: await hit.text(), etag, at };
  } catch {
    return null;
  }
}

async function writeEdge(entry) {
  try {
    await caches.default.put(SNAPSHOT_KEY, new Response(entry.body, {
      headers: {
        'content-type': JSON_TYPE,
        'cache-control': `public, max-age=${FALLBACK_MS / 1000}`,
        etag: entry.etag,
        'x-snapshot-at': String(entry.at)
      }
    }));
  } catch {}
}

function refresh(env, ctx) {
  if (!inflight) {
    inflight = pull(env)
      .then((entry) => {
        memo = entry;
        ctx.waitUntil(writeEdge(entry));
        return entry;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

async function snapshot(env, ctx) {
  let entry = memo;
  if (!entry || Date.now() - entry.at >= FRESH_MS) {
    const edge = await readEdge();
    if (edge && (!entry || edge.at > entry.at)) entry = memo = edge;
  }

  const age = entry ? Date.now() - entry.at : Infinity;
  if (age < FRESH_MS) return { entry, state: 'fresh' };

  if (age < REVALIDATE_MS) {
    ctx.waitUntil(refresh(env, ctx).catch(() => null));
    return { entry, state: 'stale' };
  }

  try {
    return { entry: await refresh(env, ctx), state: 'miss' };
  } catch (error) {
    if (entry && age < FALLBACK_MS) return { entry, state: 'fallback' };
    throw error;
  }
}

function cors(request, env) {
  const origin = request.headers.get('origin');
  if (!origin) return null;
  const allowed = String(env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (!allowed.includes(origin)) return null;
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, HEAD, OPTIONS',
    'access-control-allow-headers': 'accept, if-none-match',
    'access-control-max-age': '86400'
  };
}

async function throttled(request, env) {
  if (typeof env.LIMITER?.limit !== 'function') return false;
  try {
    const { success } = await env.LIMITER.limit({ key: request.headers.get('cf-connecting-ip') ?? 'unknown' });
    return !success;
  } catch {
    return false;
  }
}

function matches(header, etag) {
  if (!header) return false;
  if (header.trim() === '*') return true;
  return header.split(',').some((value) => value.trim().replace(/^W\//, '') === etag);
}

function respond(status, body, headers = {}) {
  return new Response(body, { status, headers: { ...BASE_HEADERS, ...headers } });
}

function fail(status, code, headers = {}) {
  return respond(status, JSON.stringify({ error: code }), {
    'content-type': JSON_TYPE,
    'cache-control': 'no-store',
    ...headers
  });
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname !== PATH) return fail(404, 'not_found');

    const access = cors(request, env);
    if (request.method === 'OPTIONS') return respond(access ? 204 : 403, null, access ?? {});
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return fail(405, 'method_not_allowed', { allow: 'GET, HEAD, OPTIONS', ...access });
    }
    if (!access) return fail(403, 'origin_not_allowed');
    if (await throttled(request, env)) return fail(429, 'rate_limited', { 'retry-after': '60', ...access });

    let result;
    try {
      result = await snapshot(env, ctx);
    } catch {
      return fail(502, 'upstream_unavailable', { 'retry-after': '30', ...access });
    }

    const { entry, state } = result;
    const headers = {
      ...access,
      etag: entry.etag,
      'cache-control': 'private, max-age=15',
      'x-snapshot': state
    };
    if (matches(request.headers.get('if-none-match'), entry.etag)) return respond(304, null, headers);
    return respond(200, request.method === 'HEAD' ? null : entry.body, { 'content-type': JSON_TYPE, ...headers });
  }
};
