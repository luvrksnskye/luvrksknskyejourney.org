import { covers, coverSearch } from './profile.js?v=9';

const ITUNES = 'https://itunes.apple.com/search';
const STORE = 'skye-cover-cache-v2';
const OLD_STORES = ['skye-cover-cache-v1'];
const HIT_TTL = 14 * 86400000;
const MISS_TTL = 6 * 3600000;
const MAX_ENTRIES = 400;
const LIMIT = 18;
const WINDOW = 60000;
const COOLDOWN = 300000;
const MIN_SCORE = 0.8;

const SCRIPT = /[぀-ヿ㐀-鿿가-힯]/;
const JUNK = /\s*[([【][^)\]】]*(soundtrack|\bost\b|official|oficial|v[ií]deo|audio|lyrics?|letra|\bmv\b|remaster|\bhd\b|\b4k\b|visuali[sz]er|full ver|extended|\bfrom\b)[^)\]】]*[)\]】]/gi;
const QUOTES = /[“”„‟"«»]/g;
const SWAPPED = /soundtrack|\bost\b/i;
const STOP = new Set(['and', 'the', 'feat', 'ft', 'with']);

const stamps = [];
const inflight = new Map();
let chain = Promise.resolve();
let blockedUntil = 0;
let cache = null;

const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function cleanTrack({ name = '', artist = '' }) {
  const rawArtist = artist.trim();
  let who = rawArtist;
  const roman = rawArtist.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (roman && SCRIPT.test(roman[1])) who = roman[2].trim();
  const lead = who.split(/\s*(?:,|&|\bx\b|\bfeat\.?\s|\bft\.?\s)\s*/i)[0].trim() || who;

  let title = name.trim();
  for (const label of new Set([rawArtist, who, lead])) {
    if (!label) continue;
    const pattern = escape(label);
    title = title
      .replace(new RegExp(`\\s*[-–—|]\\s*${pattern}\\s*$`, 'i'), '')
      .replace(new RegExp(`^\\s*${pattern}\\s*[-–—|]\\s*`, 'i'), '');
  }

  title = title
    .replace(JUNK, '')
    .replace(/^.*?\bsoundtrack\b\s*[-–—]\s*(\d+\s*[-–—.]\s*)?/i, '')
    .replace(/\s+(feat\.?|ft\.?)\s.*$/i, '')
    .replace(/\s+con\s+[^,]+,.*$/i, '')
    .replace(QUOTES, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return { title: title || name.trim(), artist: who, lead };
}

function norm(value = '') {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[([【].*?[)\]】]/g, ' ')
    .replace(/\b(feat|ft)\b.*$/, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function words(value) {
  return norm(value).split(' ').filter((word) => word && !STOP.has(word) && (word.length > 1 || SCRIPT.test(word)));
}

export function titleScore(want, got) {
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

export function artistMatch(want, got) {
  const known = new Set(words(want));
  if (words(got).some((word) => known.has(word))) return true;
  const a = norm(want).replace(/ /g, '');
  const b = norm(got).replace(/ /g, '');
  return a.length >= 4 && b.length >= 4 && (a.includes(b) || b.includes(a));
}

export function pickBest(candidates, want) {
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

function lookup(table, track) {
  const artist = (track.artist || '').toLowerCase().trim();
  for (const label of [track.album, track.name]) {
    if (!label) continue;
    const key = `${artist}|${label.toLowerCase().trim()}`;
    const hit = Object.entries(table).find(([name]) => name.toLowerCase().trim() === key);
    if (hit) return hit[1];
  }
  return null;
}

export const manualCover = (track) => lookup(covers, track) || '';

function itunesPair(url) {
  if (typeof url !== 'string') return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.mzstatic.com')) return null;
  } catch (_) {
    return null;
  }
  return {
    image: url.replace(/\/\d+x\d+bb\./, '/600x600bb.'),
    thumb: url.replace(/\/\d+x\d+bb\./, '/160x160bb.')
  };
}

function store() {
  if (cache) return cache;
  cache = new Map();
  try {
    for (const old of OLD_STORES) localStorage.removeItem(old);
    const saved = JSON.parse(localStorage.getItem(STORE) || '[]');
    const now = Date.now();
    for (const [key, entry] of saved) {
      if (entry && now - entry.at < (entry.image ? HIT_TTL : MISS_TTL)) cache.set(key, entry);
    }
  } catch (_) {}
  return cache;
}

function persist() {
  try {
    const entries = [...store()].slice(-MAX_ENTRIES);
    localStorage.setItem(STORE, JSON.stringify(entries));
  } catch (_) {}
}

function remember(key, art) {
  const map = store();
  map.delete(key);
  map.set(key, { image: art?.image ?? null, thumb: art?.thumb ?? null, at: Date.now() });
  while (map.size > MAX_ENTRIES) map.delete(map.keys().next().value);
  persist();
}

async function slot() {
  for (;;) {
    const now = Date.now();
    while (stamps.length && now - stamps[0] > WINDOW) stamps.shift();
    if (stamps.length < LIMIT) {
      stamps.push(now);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, WINDOW - (now - stamps[0]) + 50));
  }
}

async function searchItunes(want) {
  await slot();
  const url = new URL(ITUNES);
  url.search = new URLSearchParams({
    term: `${want.lead || want.artist} ${want.title}`,
    media: 'music',
    entity: 'song',
    limit: '5'
  }).toString();
  const res = await fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer' });
  if (res.status === 403 || res.status === 429) {
    blockedUntil = Date.now() + COOLDOWN;
    throw new Error(String(res.status));
  }
  if (!res.ok) throw new Error(String(res.status));
  const data = await res.json();
  const candidates = (data?.results ?? []).map((item) => ({
    title: item.trackName,
    artist: item.artistName,
    art: itunesPair(item.artworkUrl100)
  }));
  return pickBest(candidates, want);
}

export const coverKey = (track) => `${norm(track.artist)}|${norm(track.album || cleanTrack(track).title)}`;

export function findCover(track) {
  if (!track?.name || !track.artist) return Promise.resolve(null);
  const key = coverKey(track);
  const known = store().get(key);
  if (known) return Promise.resolve(known.image ? { image: known.image, thumb: known.thumb } : null);
  if (inflight.has(key)) return inflight.get(key);

  const job = (chain = chain.then(async () => {
    if (Date.now() < blockedUntil) return null;
    try {
      const hint = lookup(coverSearch, track);
      let art = await searchItunes(hint?.artist && hint?.title ? cleanTrack({ name: hint.title, artist: hint.artist }) : cleanTrack(track));
      if (!art && !hint && SWAPPED.test(track.artist)) {
        art = await searchItunes(cleanTrack({ name: track.artist, artist: track.name }));
      }
      remember(key, art);
      return art;
    } catch (_) {
      return null;
    }
  })).finally(() => inflight.delete(key));

  inflight.set(key, job);
  return job;
}
