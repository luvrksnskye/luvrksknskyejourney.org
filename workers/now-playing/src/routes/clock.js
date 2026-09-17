import { fail, clientIp, throttled, readCache, writeCache, sendSnapshot } from '../lib/http.js';
import { fingerprint } from '../lib/crypto.js';
import { lastfm } from '../services/lastfm.js';

const WINDOW_DAYS = 14;
const PAGE_SIZE = 200;
const MAX_PAGES = 10;
const FRESH_MS = 30 * 60_000;
const FALLBACK_MS = 12 * 3_600_000;
const CACHE_KEY = 'https://now-playing.cache/clock';

let memo = null;
let inflight = null;

function zoneOf(value) {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: value }).resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

async function build(env) {
  if (!env.LASTFM_API_KEY || !env.LASTFM_USER) throw new Error('config');
  const timeZone = zoneOf(env.TIMEZONE || 'UTC');
  const format = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone });
  const from = Math.floor(Date.now() / 1000) - WINDOW_DAYS * 86_400;
  const hours = new Array(24).fill(0);
  let total = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await lastfm(env, {
      method: 'user.getrecenttracks',
      user: env.LASTFM_USER,
      limit: String(PAGE_SIZE),
      page: String(page),
      from: String(from)
    });
    const feed = data?.recenttracks ?? {};
    for (const item of [feed.track].flat()) {
      const uts = Number.parseInt(item?.date?.uts, 10);
      if (!Number.isFinite(uts)) continue;
      const part = format.formatToParts(new Date(uts * 1000)).find((entry) => entry.type === 'hour');
      const hour = Number(part?.value) % 24;
      if (!Number.isInteger(hour)) continue;
      hours[hour] += 1;
      total += 1;
    }
    const pages = Number.parseInt(feed['@attr']?.totalPages, 10);
    if (!Number.isFinite(pages) || page >= pages) break;
  }

  const body = JSON.stringify({ timeZone, days: WINDOW_DAYS, total, hours, updatedAt: Math.floor(Date.now() / 1000) });
  return { body, etag: await fingerprint(body), at: Date.now() };
}

function refresh(env, ctx) {
  if (!inflight) {
    inflight = build(env)
      .then((entry) => {
        memo = entry;
        ctx.waitUntil(writeCache(CACHE_KEY, entry, FALLBACK_MS));
        return entry;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

async function snapshot(env, ctx) {
  if (!memo || Date.now() - memo.at >= FRESH_MS) {
    const edge = await readCache(CACHE_KEY);
    if (edge && (!memo || edge.at > memo.at)) memo = edge;
  }
  const age = memo ? Date.now() - memo.at : Infinity;
  if (age < FRESH_MS) return memo;
  if (age < FALLBACK_MS) {
    ctx.waitUntil(refresh(env, ctx).catch(() => null));
    return memo;
  }
  return refresh(env, ctx);
}

export async function handleClock(request, env, ctx, { access }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return fail(405, 'method_not_allowed', { allow: 'GET, HEAD, OPTIONS', ...access });
  }
  if (!access) return fail(403, 'origin_not_allowed');
  if (await throttled(env.LIMITER, clientIp(request))) return fail(429, 'rate_limited', { 'retry-after': '60', ...access });

  try {
    const entry = await snapshot(env, ctx);
    return sendSnapshot(request, entry, { ...access, 'cache-control': 'private, max-age=300' });
  } catch {
    return fail(502, 'upstream_unavailable', { 'retry-after': '60', ...access });
  }
}
