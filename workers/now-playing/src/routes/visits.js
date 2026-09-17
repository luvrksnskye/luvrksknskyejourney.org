import { json, fail, clientIp, throttled, readJson, sendSnapshot } from '../lib/http.js';
import { fingerprint, keyedHash } from '../lib/crypto.js';

const PAGES = new Set(['about']);
const PAYLOAD_MAX = 128;
const DAILY_CAP = 5_000;
const BOTS = /bot|crawl|spider|slurp|headless|lighthouse|preview|scan|monitor|curl|wget|python|java\/|go-http|httpclient|axios|node-fetch|facebookexternalhit|embedly/i;

const today = () => new Date().toISOString().slice(0, 10);

async function visitorHash(env, request, page, day) {
  const agent = (request.headers.get('user-agent') ?? '').slice(0, 256);
  return keyedHash(env.WALL_ADMIN_KEY, 'visit-counter:visitor:v1', `${page}|${day}|${clientIp(request)}|${agent}`);
}

async function readPage(request) {
  const { data, error } = await readJson(request, PAYLOAD_MAX);
  if (error) return { error };
  if (Object.keys(data).some((key) => key !== 'page')) return { error: [400, 'invalid_request'] };
  if (!PAGES.has(data.page)) return { error: [400, 'invalid_page'] };
  return { page: data.page };
}

async function counts(env, page, day) {
  const [total, daily] = await env.DB.batch([
    env.DB.prepare('SELECT total FROM visit_totals WHERE page = ?1').bind(page),
    env.DB.prepare('SELECT count FROM visit_days WHERE page = ?1 AND day = ?2').bind(page, day)
  ]);
  return {
    page,
    total: Number(total.results?.[0]?.total ?? 0),
    today: Number(daily.results?.[0]?.count ?? 0)
  };
}

async function record(request, env, access) {
  const { page, error } = await readPage(request);
  if (error) return fail(error[0], error[1], access);

  const day = today();
  const agent = request.headers.get('user-agent') ?? '';
  const fetchSite = request.headers.get('sec-fetch-site');
  const human = agent && !BOTS.test(agent) && (!fetchSite || fetchSite === 'cross-site' || fetchSite === 'same-site' || fetchSite === 'same-origin');

  let counted = false;
  if (human) {
    const visitor = await visitorHash(env, request, page, day);
    const seen = await env.DB.prepare(
      `INSERT INTO visit_seen (visitor, day)
       SELECT ?1, ?2
       WHERE (SELECT COALESCE(SUM(count), 0) FROM visit_days WHERE page = ?3 AND day = ?2) < ?4
       ON CONFLICT (visitor) DO NOTHING`
    ).bind(visitor, day, page, DAILY_CAP).run();

    if (seen.meta?.changes) {
      counted = true;
      const now = Math.floor(Date.now() / 1000);
      await env.DB.batch([
        env.DB.prepare('UPDATE visit_totals SET total = total + 1, updated_at = ?2 WHERE page = ?1').bind(page, now),
        env.DB.prepare(
          `INSERT INTO visit_days (page, day, count) VALUES (?1, ?2, 1)
           ON CONFLICT (page, day) DO UPDATE SET count = count + 1`
        ).bind(page, day),
        env.DB.prepare('DELETE FROM visit_seen WHERE day < ?1').bind(day)
      ]);
    }
  }

  return json(200, { ...(await counts(env, page, day)), counted }, access);
}

export async function handleVisits(request, env, ctx, { url, access }) {
  if (!access) return fail(403, 'origin_not_allowed');
  if (await throttled(env.LIMITER, clientIp(request))) return fail(429, 'rate_limited', { 'retry-after': '60', ...access });
  if (!env.DB || !env.WALL_ADMIN_KEY) return fail(503, 'counter_unavailable', access);

  if (request.method === 'POST') return record(request, env, access);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return fail(405, 'method_not_allowed', { allow: 'GET, HEAD, POST, OPTIONS', ...access });
  }

  const page = url.searchParams.get('page');
  if (!PAGES.has(page) || [...url.searchParams.keys()].some((key) => key !== 'page')) return fail(400, 'invalid_page', access);

  const body = JSON.stringify(await counts(env, page, today()));
  return sendSnapshot(request, { body, etag: await fingerprint(body) }, { ...access, 'cache-control': 'public, max-age=30' });
}
