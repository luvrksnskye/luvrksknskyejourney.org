import { fail, clientIp, throttled, sendSnapshot } from '../lib/http.js';
import { snapshot, MAX_PAGE } from '../services/lastfm.js';

function parsePage(url) {
  const raw = url.searchParams.get('page');
  if (raw === null) return 1;
  if (!/^\d{1,3}$/.test(raw)) return null;
  const page = Number(raw);
  return page >= 1 && page <= MAX_PAGE ? page : null;
}

export async function handleNowPlaying(request, env, ctx, { url, access }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return fail(405, 'method_not_allowed', { allow: 'GET, HEAD, OPTIONS', ...access });
  }
  if (!access) return fail(403, 'origin_not_allowed');

  const page = parsePage(url);
  if (page === null) return fail(400, 'invalid_page', access);
  if (await throttled(env.LIMITER, clientIp(request))) return fail(429, 'rate_limited', { 'retry-after': '60', ...access });

  let result;
  try {
    result = await snapshot(env, ctx, page);
  } catch {
    return fail(502, 'upstream_unavailable', { 'retry-after': '30', ...access });
  }

  const { entry, state, timing } = result;
  return sendSnapshot(request, entry, {
    ...access,
    'cache-control': `private, max-age=${timing.browser}`,
    'x-snapshot': state
  });
}
