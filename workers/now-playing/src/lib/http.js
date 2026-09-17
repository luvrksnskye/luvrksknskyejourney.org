export const JSON_TYPE = 'application/json; charset=utf-8';

const BASE_HEADERS = Object.freeze({
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
  'cross-origin-resource-policy': 'cross-origin',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  vary: 'Origin'
});

const encoder = new TextEncoder();

export const encode = (text) => encoder.encode(text);

export function respond(status, body, headers = {}) {
  return new Response(body, { status, headers: { ...BASE_HEADERS, ...headers } });
}

export function json(status, data, headers = {}) {
  return respond(status, JSON.stringify(data), {
    'content-type': JSON_TYPE,
    'cache-control': 'no-store',
    ...headers
  });
}

export function fail(status, code, headers = {}) {
  return json(status, { error: code }, headers);
}

export function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export function allowedHostnames(env) {
  const hosts = new Set();
  for (const origin of allowedOrigins(env)) {
    try {
      hosts.add(new URL(origin).hostname);
    } catch {}
  }
  return hosts;
}

export function cors(request, env, methods) {
  const origin = request.headers.get('origin');
  if (!origin || !allowedOrigins(env).includes(origin)) return null;
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': methods,
    'access-control-allow-headers': 'accept, authorization, content-type, if-none-match',
    'access-control-max-age': '86400'
  };
}

export function clientIp(request) {
  return request.headers.get('cf-connecting-ip') ?? 'unknown';
}

export async function throttled(limiter, key) {
  if (typeof limiter?.limit !== 'function') return false;
  try {
    const { success } = await limiter.limit({ key });
    return !success;
  } catch {
    return false;
  }
}

export function matches(header, etag) {
  if (!header) return false;
  if (header.trim() === '*') return true;
  return header.split(',').some((value) => value.trim().replace(/^W\//, '') === etag);
}

export async function readJson(request, maxBytes) {
  const type = request.headers.get('content-type') ?? '';
  if (!type.toLowerCase().startsWith('application/json')) return { error: [415, 'unsupported_media_type'] };
  if (Number(request.headers.get('content-length') ?? 0) > maxBytes) return { error: [413, 'payload_too_large'] };

  const text = await request.text();
  if (encode(text).length > maxBytes) return { error: [413, 'payload_too_large'] };
  try {
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { error: [400, 'invalid_request'] };
    return { data };
  } catch {
    return { error: [400, 'invalid_json'] };
  }
}

export async function readCache(key) {
  try {
    const hit = await caches.default.match(key);
    if (!hit) return null;
    const at = Number(hit.headers.get('x-snapshot-at'));
    const etag = hit.headers.get('etag');
    if (!Number.isFinite(at) || !etag) return null;
    return { body: await hit.text(), etag, at };
  } catch {
    return null;
  }
}

export async function writeCache(key, entry, ttlMs) {
  try {
    await caches.default.put(key, new Response(entry.body, {
      headers: {
        'content-type': JSON_TYPE,
        'cache-control': `public, max-age=${Math.max(1, Math.round(ttlMs / 1000))}`,
        etag: entry.etag,
        'x-snapshot-at': String(entry.at)
      }
    }));
  } catch {}
}

export async function dropCache(key) {
  try {
    await caches.default.delete(key);
  } catch {}
}

export function remember(map, key, value, limit) {
  map.delete(key);
  map.set(key, value);
  while (map.size > limit) map.delete(map.keys().next().value);
}

export function sendSnapshot(request, entry, headers) {
  const merged = { ...headers, etag: entry.etag };
  if (matches(request.headers.get('if-none-match'), entry.etag)) return respond(304, null, merged);
  return respond(200, request.method === 'HEAD' ? null : entry.body, { 'content-type': JSON_TYPE, ...merged });
}
