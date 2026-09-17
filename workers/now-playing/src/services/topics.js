import { readCache, writeCache } from '../lib/http.js';
import { fingerprint } from '../lib/crypto.js';

export const WALL_TOPIC = 'wall';

const NOTE_TOPIC = /^note:[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TOPIC_MAX = 69;
const POSTS_PATH = '/filesystem/astra/data/posts.json';
const POSTS_MAX_BYTES = 1_000_000;
const FRESH_MS = 5 * 60_000;
const TIMEOUT_MS = 4_000;
const CACHE_KEY = 'https://now-playing.cache/astra/topics';

let memo = null;

export function parseTopic(value) {
  if (value === undefined || value === null || value === '') return WALL_TOPIC;
  if (typeof value !== 'string' || value.length > TOPIC_MAX) return null;
  return value === WALL_TOPIC || NOTE_TOPIC.test(value) ? value : null;
}

async function fetchTopics(env) {
  if (!env.SITE_ORIGIN) throw new Error('site origin is not configured');
  const response = await fetch(new URL(POSTS_PATH, env.SITE_ORIGIN), {
    redirect: 'error',
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`posts ${response.status}`);
  const text = await response.text();
  if (text.length > POSTS_MAX_BYTES) throw new Error('posts too large');
  const data = JSON.parse(text);
  if (data?.format !== 'astra-posts/1' || !Array.isArray(data.posts)) throw new Error('posts format');
  const topics = data.posts
    .filter((post) => post && post.comments === true && typeof post.id === 'string')
    .map((post) => `note:${post.id}`)
    .filter((topic) => topic.length <= TOPIC_MAX && NOTE_TOPIC.test(topic));
  return [...new Set(topics)].sort();
}

async function knownTopics(env, ctx) {
  if (memo && Date.now() - memo.at < FRESH_MS) return memo.topics;

  const edge = await readCache(CACHE_KEY);
  if (edge && Date.now() - edge.at < FRESH_MS) {
    memo = { topics: new Set(JSON.parse(edge.body)), at: edge.at };
    return memo.topics;
  }

  const list = await fetchTopics(env);
  const body = JSON.stringify(list);
  const entry = { body, etag: await fingerprint(body), at: Date.now() };
  memo = { topics: new Set(list), at: entry.at };
  ctx.waitUntil(writeCache(CACHE_KEY, entry, FRESH_MS));
  return memo.topics;
}

export async function topicExists(env, ctx, topic) {
  if (topic === WALL_TOPIC) return true;
  return (await knownTopics(env, ctx)).has(topic);
}
