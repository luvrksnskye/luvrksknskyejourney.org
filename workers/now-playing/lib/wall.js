import {
  json,
  fail,
  encode,
  digest,
  toHex,
  clientIp,
  throttled,
  fingerprint,
  readCache,
  writeCache,
  dropCache,
  sendSnapshot,
  allowedHostnames
} from './http.js';
import { sanitize, length, moderate } from './moderation.js';
import { latestTrack } from './now-playing.js';

const STICKERS = new Set(Array.from({ length: 15 }, (_, i) => `pom-${String(i + 2).padStart(2, '0')}`));
const BODY_MAX = 140;
const NAME_MAX = 24;
const PAYLOAD_MAX = 4_096;
const TOKEN_MAX = 2_048;
const PAGE_SIZE = 30;
const REPLY_LIMIT = 300;
const ADMIN_PAGE = 100;
const COOLDOWN_S = 10 * 60;
const DAILY_CAP = 300;
const FRESH_MS = 10_000;
const OWNER_NAME = 'skye';
const OWNER_HASH = '0'.repeat(32);
const CACHE_KEY = 'https://now-playing.cache/wall/latest';
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const ACTION = 'echo-wall';
const TIMEOUT_MS = 5_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const CURSOR = /^(\d{1,12}):([0-9a-f-]{36})$/;
const NOTE_PATH = /^\/wall\/([0-9a-f-]{36})$/;

const COLUMNS = [
  'id', 'created_at', 'name', 'body', 'sticker', 'owner', 'parent_id',
  'track_name', 'track_artist', 'track_album', 'track_url', 'track_image', 'track_thumb',
  'track_live', 'track_played_at'
].join(', ');

const INSERT_COLUMNS = `id, created_at, name, body, sticker, owner, parent_id,
  track_name, track_artist, track_album, track_url, track_image, track_thumb,
  track_live, track_played_at, author_hash`;

let latest = null;

function shape(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    name: row.name,
    body: row.body,
    sticker: row.sticker,
    owner: row.owner === 1,
    parentId: row.parent_id ?? null,
    track: row.track_name
      ? {
          name: row.track_name,
          artist: row.track_artist,
          album: row.track_album,
          url: row.track_url,
          image: row.track_image,
          thumb: row.track_thumb,
          live: row.track_live === 1,
          playedAt: row.track_played_at
        }
      : null
  };
}

function rowValues({ id, now, name, body, sticker, owner, parentId, track, author }) {
  return [
    id, now, name, body, sticker, owner ? 1 : 0, parentId,
    track?.name ?? null, track?.artist ?? null, track?.album || null, track?.url ?? null,
    track?.image ?? null, track?.thumb ?? null, track?.live ? 1 : 0, track?.playedAt ?? null,
    author
  ];
}

function noteFrom(values) {
  const [id, created_at, name, body, sticker, owner, parent_id,
    track_name, track_artist, track_album, track_url, track_image, track_thumb,
    track_live, track_played_at] = values;
  return shape({
    id, created_at, name, body, sticker, owner, parent_id,
    track_name, track_artist, track_album, track_url, track_image, track_thumb,
    track_live, track_played_at
  });
}

async function attachReplies(env, notes) {
  for (const note of notes) note.replies = [];
  if (!notes.length) return notes;

  const ids = notes.map((note) => note.id);
  const marks = ids.map((_, i) => `?${i + 1}`).join(', ');
  const { results = [] } = await env.DB.prepare(
    `SELECT ${COLUMNS} FROM notes
     WHERE hidden = 0 AND parent_id IN (${marks})
     ORDER BY created_at ASC, id ASC LIMIT ?${ids.length + 1}`
  ).bind(...ids, REPLY_LIMIT).all();

  const byId = new Map(notes.map((note) => [note.id, note]));
  for (const row of results) byId.get(row.parent_id)?.replies.push(shape(row));
  return notes;
}

async function listNotes(env, cursor) {
  const statement = cursor
    ? env.DB.prepare(
        `SELECT ${COLUMNS} FROM notes
         WHERE parent_id IS NULL AND hidden = 0 AND (created_at < ?1 OR (created_at = ?1 AND id < ?2))
         ORDER BY created_at DESC, id DESC LIMIT ?3`
      ).bind(cursor.at, cursor.id, PAGE_SIZE + 1)
    : env.DB.prepare(
        `SELECT ${COLUMNS} FROM notes WHERE parent_id IS NULL AND hidden = 0
         ORDER BY created_at DESC, id DESC LIMIT ?1`
      ).bind(PAGE_SIZE + 1);

  const { results = [] } = await statement.all();
  const notes = await attachReplies(env, results.slice(0, PAGE_SIZE).map(shape));
  const last = notes.at(-1);
  return {
    notes,
    next: results.length > PAGE_SIZE && last ? `${last.createdAt}:${last.id}` : null
  };
}

function parseCursor(raw) {
  if (raw === null) return { ok: true, cursor: null };
  const match = CURSOR.exec(raw);
  if (!match || !UUID.test(match[2])) return { ok: false };
  return { ok: true, cursor: { at: Number(match[1]), id: match[2] } };
}

async function latestSnapshot(env, ctx) {
  if (latest && Date.now() - latest.at < FRESH_MS) return latest;
  const edge = await readCache(CACHE_KEY);
  if (edge && Date.now() - edge.at < FRESH_MS) {
    latest = edge;
    return edge;
  }
  const body = JSON.stringify(await listNotes(env, null));
  latest = { body, etag: await fingerprint(body), at: Date.now() };
  ctx.waitUntil(writeCache(CACHE_KEY, latest, FRESH_MS));
  return latest;
}

function invalidate(ctx) {
  latest = null;
  ctx.waitUntil(dropCache(CACHE_KEY));
}

async function readPayload(request) {
  const type = request.headers.get('content-type') ?? '';
  if (!type.toLowerCase().startsWith('application/json')) return { error: [415, 'unsupported_media_type'] };
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > PAYLOAD_MAX) return { error: [413, 'payload_too_large'] };

  const text = await request.text();
  if (encode(text).length > PAYLOAD_MAX) return { error: [413, 'payload_too_large'] };
  try {
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { error: [400, 'invalid_request'] };
    return { data };
  } catch {
    return { error: [400, 'invalid_json'] };
  }
}

async function verifyHuman(env, token, ip) {
  if (typeof token !== 'string' || !token || token.length > TOKEN_MAX) return false;
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', token);
  form.append('remoteip', ip);
  form.append('idempotency_key', crypto.randomUUID());
  try {
    const response = await fetch(VERIFY_URL, { method: 'POST', body: form, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) return false;
    const result = await response.json();
    if (result?.success !== true) return false;
    if (result.metadata?.result_with_testing_key === true) return env.TURNSTILE_ALLOW_TEST_KEYS === 'true';
    return result.action === ACTION && allowedHostnames(env).has(result.hostname);
  } catch {
    return false;
  }
}

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', typeof secret === 'string' ? encode(secret) : secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function authorHash(env, ip) {
  const master = await hmacKey(env.WALL_ADMIN_KEY);
  const derived = await crypto.subtle.sign('HMAC', master, encode('echo-wall:author:v1'));
  const key = await hmacKey(derived);
  const day = new Date().toISOString().slice(0, 10);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, encode(`${ip}|${day}`)));
  return toHex(mac.slice(0, 16));
}

async function bearerMatches(request, secret) {
  const match = /^Bearer\s+(\S+)$/.exec(request.headers.get('authorization') ?? '');
  if (!match || typeof secret !== 'string' || secret.length < 16) return false;
  const [given, expected] = await Promise.all([digest(match[1]), digest(secret)]);
  if (typeof crypto.subtle.timingSafeEqual === 'function') return crypto.subtle.timingSafeEqual(given, expected);
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given[i] ^ expected[i];
  return diff === 0;
}

function readNoteFields(data, access) {
  const sticker = typeof data.sticker === 'string' ? data.sticker : '';
  if (!STICKERS.has(sticker)) return { error: fail(400, 'invalid_sticker', access) };
  const body = sanitize(data.body);
  if (!body || length(body) > BODY_MAX) return { error: fail(400, 'invalid_body', access) };
  return { sticker, body };
}

async function createVisitorNote(request, env, ctx, access) {
  const ip = clientIp(request);
  if (await throttled(env.WALL_LIMITER, ip)) return fail(429, 'rate_limited', { 'retry-after': '60', ...access });
  if (!env.DB || !env.TURNSTILE_SECRET || !env.WALL_ADMIN_KEY) return fail(503, 'wall_unavailable', access);

  const { data, error } = await readPayload(request);
  if (error) return fail(error[0], error[1], access);
  if (typeof data.website === 'string' && data.website.trim()) return fail(400, 'invalid_request', access);
  if (data.parentId !== undefined && data.parentId !== null) return fail(403, 'replies_owner_only', access);

  const fields = readNoteFields(data, access);
  if (fields.error) return fields.error;
  const name = sanitize(data.name);
  if (length(name) > NAME_MAX) return fail(400, 'invalid_name', access);

  if (!(await verifyHuman(env, data.token, ip))) return fail(403, 'verification_failed', access);

  const flagged = moderate(fields.body) ?? moderate(name);
  if (flagged) return fail(422, flagged, access);

  const [author, track] = await Promise.all([authorHash(env, ip), latestTrack(env, ctx)]);
  const now = Math.floor(Date.now() / 1000);
  const values = rowValues({ id: crypto.randomUUID(), now, name, body: fields.body, sticker: fields.sticker, owner: false, parentId: null, track, author });

  const outcome = await env.DB.prepare(
    `INSERT INTO notes (${INSERT_COLUMNS})
     SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16
     WHERE NOT EXISTS (SELECT 1 FROM notes WHERE author_hash = ?16 AND created_at > ?17)
       AND (SELECT COUNT(*) FROM notes WHERE created_at > ?18 AND owner = 0) < ?19`
  ).bind(...values, now - COOLDOWN_S, now - 86_400, DAILY_CAP).run();

  if (!outcome.meta?.changes) {
    const recent = await env.DB.prepare('SELECT created_at FROM notes WHERE author_hash = ?1 AND created_at > ?2 ORDER BY created_at DESC LIMIT 1')
      .bind(author, now - COOLDOWN_S)
      .first();
    if (recent) {
      const wait = Math.max(1, recent.created_at + COOLDOWN_S - now);
      return fail(429, 'cooldown', { 'retry-after': String(wait), ...access });
    }
    return fail(429, 'wall_full', { 'retry-after': '3600', ...access });
  }

  invalidate(ctx);
  return json(201, { note: noteFrom(values) }, access);
}

async function createOwnerNote(request, env, ctx, access) {
  if (await throttled(env.LIMITER, clientIp(request))) return fail(429, 'rate_limited', { 'retry-after': '60', ...access });
  if (!env.DB || !env.WALL_OWNER_KEY) return fail(503, 'wall_unavailable', access);
  if (!(await bearerMatches(request, env.WALL_OWNER_KEY))) return fail(401, 'unauthorized', access);

  const { data, error } = await readPayload(request);
  if (error) return fail(error[0], error[1], access);

  const fields = readNoteFields(data, access);
  if (fields.error) return fields.error;

  const parentId = data.parentId ?? null;
  if (parentId !== null && (typeof parentId !== 'string' || !UUID.test(parentId))) return fail(400, 'invalid_parent', access);

  const track = await latestTrack(env, ctx);
  const now = Math.floor(Date.now() / 1000);
  const values = rowValues({ id: crypto.randomUUID(), now, name: OWNER_NAME, body: fields.body, sticker: fields.sticker, owner: true, parentId, track, author: OWNER_HASH });

  const outcome = parentId
    ? await env.DB.prepare(
        `INSERT INTO notes (${INSERT_COLUMNS})
         SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16
         WHERE EXISTS (SELECT 1 FROM notes WHERE id = ?7 AND parent_id IS NULL AND hidden = 0)`
      ).bind(...values).run()
    : await env.DB.prepare(
        `INSERT INTO notes (${INSERT_COLUMNS})
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)`
      ).bind(...values).run();

  if (!outcome.meta?.changes) return fail(404, 'parent_not_found', access);

  invalidate(ctx);
  return json(201, { note: noteFrom(values) }, access);
}

async function checkOwner(request, env, access) {
  if (!access) return fail(403, 'origin_not_allowed');
  if (await throttled(env.LIMITER, clientIp(request))) return fail(429, 'rate_limited', { 'retry-after': '60', ...access });
  if (request.method !== 'GET') return fail(405, 'method_not_allowed', { allow: 'GET, OPTIONS', ...access });
  if (!env.WALL_OWNER_KEY || !(await bearerMatches(request, env.WALL_OWNER_KEY))) return fail(401, 'unauthorized', access);
  return json(200, { owner: true }, access);
}

async function listAll(env) {
  const { results = [] } = await env.DB.prepare(
    `SELECT ${COLUMNS}, hidden FROM notes ORDER BY created_at DESC, id DESC LIMIT ?1`
  ).bind(ADMIN_PAGE).all();
  return json(200, { notes: results.map((row) => ({ ...shape(row), hidden: row.hidden === 1 })) });
}

async function setHidden(request, env, ctx, id) {
  const { data, error } = await readPayload(request);
  if (error) return fail(error[0], error[1]);
  if (typeof data.hidden !== 'boolean') return fail(400, 'invalid_request');
  const outcome = await env.DB.prepare('UPDATE notes SET hidden = ?1 WHERE id = ?2').bind(data.hidden ? 1 : 0, id).run();
  if (!outcome.meta?.changes) return fail(404, 'not_found');
  invalidate(ctx);
  return json(200, { id, hidden: data.hidden });
}

export async function handleWall(request, env, ctx, { url, access }) {
  if (url.pathname === '/wall/owner') return checkOwner(request, env, access);

  if (url.pathname === '/wall/admin' || NOTE_PATH.test(url.pathname)) {
    if (await throttled(env.LIMITER, clientIp(request))) return fail(429, 'rate_limited', { 'retry-after': '60' });
    if (!env.DB || !(await bearerMatches(request, env.WALL_ADMIN_KEY))) return fail(401, 'unauthorized');
    if (url.pathname === '/wall/admin') {
      return request.method === 'GET' ? listAll(env) : fail(405, 'method_not_allowed', { allow: 'GET' });
    }
    const id = NOTE_PATH.exec(url.pathname)[1];
    if (!UUID.test(id)) return fail(400, 'invalid_id');
    return request.method === 'PATCH' ? setHidden(request, env, ctx, id) : fail(405, 'method_not_allowed', { allow: 'PATCH' });
  }

  if (url.pathname !== '/wall') return fail(404, 'not_found', access ?? {});

  if (request.method === 'POST') {
    if (!access) return fail(403, 'origin_not_allowed');
    return request.headers.has('authorization')
      ? createOwnerNote(request, env, ctx, access)
      : createVisitorNote(request, env, ctx, access);
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return fail(405, 'method_not_allowed', { allow: 'GET, POST, OPTIONS', ...access });
  }

  if (!access) return fail(403, 'origin_not_allowed');
  if (await throttled(env.LIMITER, clientIp(request))) return fail(429, 'rate_limited', { 'retry-after': '60', ...access });
  if (!env.DB) return fail(503, 'wall_unavailable', access);

  const parsed = parseCursor(url.searchParams.get('before'));
  if (!parsed.ok) return fail(400, 'invalid_cursor', access);

  const headers = { ...access, 'cache-control': 'private, max-age=5' };
  if (!parsed.cursor) return sendSnapshot(request, await latestSnapshot(env, ctx), headers);

  const body = JSON.stringify(await listNotes(env, parsed.cursor));
  return sendSnapshot(request, { body, etag: await fingerprint(body) }, headers);
}
