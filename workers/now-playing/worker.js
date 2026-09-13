const PATH = '/now-playing';
const API = 'https://ws.audioscrobbler.com/2.0/';
const ITUNES = 'https://itunes.apple.com/search';
const DEEZER = 'https://api.deezer.com/search';
const PER_PAGE = 30;
const MAX_PAGE = 500;
const TIMEOUT_MS = 4_000;
const ART_BUDGET = 8;
const ART_TTL_MS = 7 * 86_400_000;
const ART_MISS_TTL_MS = 3_600_000;
const ART_MEMO_LIMIT = 800;
const MEMO_PAGES = 6;
const BLANK_ART = '2a96cbd8b46e442fc41c2b86b821562f';
const TRACK_HOSTS = new Set(['www.last.fm', 'last.fm']);
const LASTFM_IMAGE_HOSTS = new Set(['lastfm.freetls.fastly.net']);
const JSON_TYPE = 'application/json; charset=utf-8';

const TIMING = Object.freeze({
  head: { fresh: 12_000, revalidate: 60_000, fallback: 3_600_000, browser: 10 },
  tail: { fresh: 300_000, revalidate: 1_800_000, fallback: 21_600_000, browser: 120 }
});

const BASE_HEADERS = Object.freeze({
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
  'cross-origin-resource-policy': 'cross-origin',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  vary: 'Origin'
});

const encoder = new TextEncoder();
const memo = new Map();
const inflight = new Map();
const artMemo = new Map();

function safeUrl(value, allow) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && allow(url.hostname) ? url.href : null;
  } catch {
    return null;
  }
}

const trackUrl = (value) => safeUrl(value, (host) => TRACK_HOSTS.has(host));
const imageUrl = (value) => safeUrl(value, (host) => LASTFM_IMAGE_HOSTS.has(host) || host.endsWith('.mzstatic.com') || host.endsWith('.dzcdn.net'));

function clean(value, max = 256) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function remember(map, key, value, limit) {
  map.delete(key);
  map.set(key, value);
  while (map.size > limit) map.delete(map.keys().next().value);
}

function pickLastfmArt(images) {
  if (!Array.isArray(images)) return null;
  const url = images.map((entry) => entry?.['#text']).filter(Boolean).at(-1);
  if (!url || url.includes(BLANK_ART)) return null;
  const image = imageUrl(url.replace(/\/i\/u\/[^/]+\//, '/i/u/300x300/'));
  if (!image) return null;
  return { image, thumb: imageUrl(url.replace(/\/i\/u\/[^/]+\//, '/i/u/174s/')) ?? image };
}

function normalize(item) {
  const playedAt = Number.parseInt(item?.date?.uts, 10);
  const art = pickLastfmArt(item?.image);
  return {
    name: clean(item?.name),
    artist: clean(item?.artist?.['#text'] ?? item?.artist?.name),
    album: clean(item?.album?.['#text']),
    url: trackUrl(item?.url),
    image: art?.image ?? null,
    thumb: art?.thumb ?? null,
    playedAt: Number.isFinite(playedAt) ? playedAt : null,
    live: item?.['@attr']?.nowplaying === 'true'
  };
}

async function lastfm(env, params) {
  const url = new URL(API);
  url.search = new URLSearchParams({ ...params, api_key: env.LASTFM_API_KEY, format: 'json' }).toString();
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': 'now-playing-worker' },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`upstream ${response.status}`);
  const data = await response.json();
  if (data?.error) throw new Error(`upstream ${data.error}`);
  return data;
}

const SCRIPT = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/;
const JUNK = /\s*[([【][^)\]】]*(soundtrack|\bost\b|official|video|audio|lyric|\bmv\b|remaster|\bhd\b|\b4k\b|visuali[sz]er|full ver|extended)[^)\]】]*[)\]】]/gi;
const STOP = new Set(['and', 'the', 'feat', 'ft', 'with']);
const MIN_SCORE = 0.8;

const escapeRe = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function cleanTrack({ name = '', artist = '' }) {
  const rawArtist = artist.trim();
  let who = rawArtist;
  const roman = rawArtist.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (roman && SCRIPT.test(roman[1])) who = roman[2].trim();

  let title = name.trim();
  for (const label of new Set([rawArtist, who])) {
    if (!label) continue;
    const pattern = escapeRe(label);
    title = title
      .replace(new RegExp(`\\s*[-–—|]\\s*${pattern}\\s*$`, 'i'), '')
      .replace(new RegExp(`^\\s*${pattern}\\s*[-–—|]\\s*`, 'i'), '');
  }

  title = title
    .replace(JUNK, '')
    .replace(/^.*?\bsoundtrack\b\s*[-–—]\s*(\d+\s*[-–—.]\s*)?/i, '')
    .replace(/\s+(feat\.?|ft\.?)\s.*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return { title: title || name.trim(), artist: who };
}

function norm(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[([【].*?[)\]】]/g, ' ')
    .replace(/\b(feat|ft)\b.*$/, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function words(value) {
  return norm(value).split(' ').filter((word) => word && !STOP.has(word) && (word.length > 1 || SCRIPT.test(word)));
}

function titleScore(want, got) {
  const a = norm(want);
  const b = norm(got);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.startsWith(b) || b.startsWith(a)) return 0.86;
  const left = new Set(a.split(' '));
  const right = new Set(b.split(' '));
  let shared = 0;
  for (const word of left) if (right.has(word)) shared++;
  return shared / (left.size + right.size - shared);
}

function artistMatch(want, got) {
  const known = new Set(words(want));
  return words(got).some((word) => known.has(word));
}

function pickBest(candidates, want) {
  let top = null;
  let score = 0;
  for (const candidate of candidates) {
    if (!candidate?.art || !candidate.title || !candidate.artist) continue;
    if (!artistMatch(want.artist, candidate.artist)) continue;
    const next = titleScore(want.title, candidate.title);
    if (next > score) {
      top = candidate;
      score = next;
    }
  }
  return score >= MIN_SCORE ? top.art : null;
}

async function getJson(url) {
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': 'Mozilla/5.0 (compatible; now-playing-worker)' },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`upstream ${response.status}`);
  return response.json();
}

function itunesPair(url) {
  if (typeof url !== 'string') return null;
  const image = imageUrl(url.replace(/\/\d+x\d+bb\./, '/600x600bb.'));
  if (!image) return null;
  return { image, thumb: imageUrl(url.replace(/\/\d+x\d+bb\./, '/160x160bb.')) ?? image };
}

async function itunesArt(want) {
  const url = new URL(ITUNES);
  url.search = new URLSearchParams({ term: `${want.artist} ${want.title}`, media: 'music', entity: 'song', limit: '5' }).toString();
  const data = await getJson(url);
  return pickBest((data?.results ?? []).map((item) => ({
    title: item?.trackName,
    artist: item?.artistName,
    art: itunesPair(item?.artworkUrl100)
  })), want);
}

async function deezerArt(want) {
  const url = new URL(DEEZER);
  url.search = new URLSearchParams({ q: `${want.artist} ${want.title}`, limit: '5' }).toString();
  const data = await getJson(url);
  return pickBest((data?.data ?? []).map((item) => {
    const image = imageUrl(item?.album?.cover_xl ?? item?.album?.cover_big ?? '');
    return {
      title: item?.title,
      artist: item?.artist?.name,
      art: image ? { image, thumb: imageUrl(item?.album?.cover_medium ?? '') ?? image } : null
    };
  }), want);
}

async function lookupArt(env, track) {
  const want = cleanTrack(track);
  try {
    const data = track.album
      ? await lastfm(env, { method: 'album.getinfo', artist: want.artist, album: track.album, autocorrect: '1' })
      : await lastfm(env, { method: 'track.getinfo', artist: want.artist, track: want.title, autocorrect: '1' });
    const art = pickLastfmArt((data?.album ?? data?.track?.album)?.image);
    if (art) return art;
  } catch {}
  for (const source of [itunesArt, deezerArt]) {
    try {
      const art = await source(want);
      if (art) return art;
    } catch {}
  }
  return null;
}

const artKey = (track) => `${track.artist}\u0000${track.album || track.name}`.toLowerCase();

async function resolveArt(env, tracks, previous) {
  const carried = new Map();
  for (const old of previous ?? []) {
    if (old?.image) carried.set(artKey(old), { image: old.image, thumb: old.thumb ?? old.image });
  }

  const now = Date.now();
  const pending = new Map();
  for (const track of tracks) {
    if (track.image || !track.artist) continue;
    const key = artKey(track);
    const known = artMemo.get(key) ?? (carried.has(key) ? { ...carried.get(key), at: now } : null);
    if (known && now - known.at < (known.image ? ART_TTL_MS : ART_MISS_TTL_MS)) {
      if (known.image) Object.assign(track, { image: known.image, thumb: known.thumb });
      continue;
    }
    if (!pending.has(key) && pending.size < ART_BUDGET) pending.set(key, track);
  }

  await Promise.allSettled([...pending].map(async ([key, track]) => {
    const art = await lookupArt(env, track);
    remember(artMemo, key, { image: art?.image ?? null, thumb: art?.thumb ?? null, at: Date.now() }, ART_MEMO_LIMIT);
  }));

  for (const track of tracks) {
    if (track.image) continue;
    const known = artMemo.get(artKey(track));
    if (known?.image) Object.assign(track, { image: known.image, thumb: known.thumb });
  }
}

async function fingerprint(body) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(body)));
  let hex = '';
  for (let i = 0; i < 12; i++) hex += digest[i].toString(16).padStart(2, '0');
  return `"${hex}"`;
}

function tracksOf(entry) {
  if (!entry) return null;
  if (entry.tracks) return entry.tracks;
  try {
    return JSON.parse(entry.body)?.tracks ?? null;
  } catch {
    return null;
  }
}

async function pull(env, page, previous) {
  if (!env.LASTFM_API_KEY || !env.LASTFM_USER) throw new Error('config');

  const data = await lastfm(env, {
    method: 'user.getrecenttracks',
    user: env.LASTFM_USER,
    limit: String(PER_PAGE),
    page: String(page)
  });

  const feed = data?.recenttracks ?? {};
  const tracks = [feed.track]
    .flat()
    .filter((item) => item && typeof item === 'object')
    .map(normalize)
    .filter((track) => track.name && (page === 1 || !track.live));

  await resolveArt(env, tracks, tracksOf(previous));

  const attr = feed['@attr'] ?? {};
  const total = Number.parseInt(attr.total, 10);
  const pages = Number.parseInt(attr.totalPages, 10);
  const body = JSON.stringify({
    live: tracks[0]?.live === true,
    track: tracks[0] ?? null,
    tracks,
    page,
    pages: Number.isFinite(pages) ? Math.max(1, Math.min(pages, MAX_PAGE)) : 1,
    total: Number.isFinite(total) ? total : 0
  });

  return { body, tracks, etag: await fingerprint(body), at: Date.now() };
}

const edgeKey = (page) => `https://now-playing.cache/page/${page}`;

async function readEdge(page) {
  try {
    const hit = await caches.default.match(edgeKey(page));
    if (!hit) return null;
    const at = Number(hit.headers.get('x-snapshot-at'));
    const etag = hit.headers.get('etag');
    if (!Number.isFinite(at) || !etag) return null;
    return { body: await hit.text(), etag, at };
  } catch {
    return null;
  }
}

async function writeEdge(page, entry, timing) {
  try {
    await caches.default.put(edgeKey(page), new Response(entry.body, {
      headers: {
        'content-type': JSON_TYPE,
        'cache-control': `public, max-age=${timing.fallback / 1000}`,
        etag: entry.etag,
        'x-snapshot-at': String(entry.at)
      }
    }));
  } catch {}
}

function refresh(env, ctx, page, timing) {
  if (!inflight.has(page)) {
    const job = pull(env, page, memo.get(page))
      .then((entry) => {
        remember(memo, page, entry, MEMO_PAGES);
        ctx.waitUntil(writeEdge(page, entry, timing));
        return entry;
      })
      .finally(() => inflight.delete(page));
    inflight.set(page, job);
  }
  return inflight.get(page);
}

async function snapshot(env, ctx, page) {
  const timing = page === 1 ? TIMING.head : TIMING.tail;
  let entry = memo.get(page);
  if (!entry || Date.now() - entry.at >= timing.fresh) {
    const edge = await readEdge(page);
    if (edge && (!entry || edge.at > entry.at)) {
      entry = edge;
      remember(memo, page, edge, MEMO_PAGES);
    }
  }

  const age = entry ? Date.now() - entry.at : Infinity;
  if (age < timing.fresh) return { entry, state: 'fresh', timing };

  if (age < timing.revalidate) {
    ctx.waitUntil(refresh(env, ctx, page, timing).catch(() => null));
    return { entry, state: 'stale', timing };
  }

  try {
    return { entry: await refresh(env, ctx, page, timing), state: 'miss', timing };
  } catch (error) {
    if (entry && age < timing.fallback) return { entry, state: 'fallback', timing };
    throw error;
  }
}

function parsePage(url) {
  const raw = url.searchParams.get('page');
  if (raw === null) return 1;
  if (!/^\d{1,3}$/.test(raw)) return null;
  const page = Number(raw);
  return page >= 1 && page <= MAX_PAGE ? page : null;
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
    const url = new URL(request.url);
    if (url.pathname !== PATH) return fail(404, 'not_found');

    const access = cors(request, env);
    if (request.method === 'OPTIONS') return respond(access ? 204 : 403, null, access ?? {});
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return fail(405, 'method_not_allowed', { allow: 'GET, HEAD, OPTIONS', ...access });
    }
    if (!access) return fail(403, 'origin_not_allowed');

    const page = parsePage(url);
    if (page === null) return fail(400, 'invalid_page', access);
    if (await throttled(request, env)) return fail(429, 'rate_limited', { 'retry-after': '60', ...access });

    let result;
    try {
      result = await snapshot(env, ctx, page);
    } catch {
      return fail(502, 'upstream_unavailable', { 'retry-after': '30', ...access });
    }

    const { entry, state, timing } = result;
    const headers = {
      ...access,
      etag: entry.etag,
      'cache-control': `private, max-age=${timing.browser}`,
      'x-snapshot': state
    };
    if (matches(request.headers.get('if-none-match'), entry.etag)) return respond(304, null, headers);
    return respond(200, request.method === 'HEAD' ? null : entry.body, { 'content-type': JSON_TYPE, ...headers });
  }
};
