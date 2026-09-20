const LEGACY_URL = '/filesystem/blogs/data/posts.json';
const ASTRA_POSTS_URL = '/filesystem/astra/data/posts.json';
const ASTRA_GRAPH_URL = '/filesystem/astra/data/graph.json';
const ASTRA_MANIFEST_URL = '/filesystem/astra/data/manifest.json';
const DEFAULT_COVER = '/filesystem/astra/assets/note-cover.svg';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CATEGORIES = new Set(['personal', 'guides', 'software', 'art', 'science', 'hardware']);
const DATE = /^(\d{4})(?:-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?)?$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STAGES = new Set(['nebula', 'protostar', 'main-sequence', 'giant', 'remnant']);
const MAX_BYTES = 1024 * 1024;

import { openNetwork } from './network/index.js?v=8';

let grid;

function safePath(value) {
  return typeof value === 'string'
    && value.length <= 512
    && /^\/[A-Za-z0-9/_.#-]*$/.test(value)
    && !value.includes('..')
    && !value.includes('//');
}

const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

function dateLabel(date) {
  const match = DATE.exec(date);
  if (!match) return '';
  const [, year, month, day] = match;
  if (!month) return year;
  const name = MONTHS[Number(month) - 1];
  return day ? `${name} ${Number(day)}, ${year}` : `${name} ${year}`;
}

async function fetchBuffer(url) {
  const response = await fetch(url, { cache: 'no-cache', credentials: 'same-origin', redirect: 'error' });
  if (!response.ok) throw new Error(`${url} ${response.status}`);
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_BYTES) throw new Error(`${url} is too large`);
  return buffer;
}

const parse = (buffer) => JSON.parse(new TextDecoder().decode(buffer));

async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function legacyPost(raw) {
  if (!raw || !safePath(raw.url) || !safePath(raw.image) || !DATE.test(raw.date ?? '')) return null;
  return {
    title: text(raw.title, 160),
    date: raw.date,
    description: text(raw.description, 400),
    tags: Array.isArray(raw.tags) ? raw.tags.map((t) => text(t, 32)).filter(Boolean).slice(0, 8) : [],
    category: CATEGORIES.has(raw.category) ? raw.category : 'personal',
    image: raw.image,
    alt: text(raw.alt, 160) || 'Post preview',
    url: raw.url,
    label: text(raw.label, 40) || 'Read More →'
  };
}

function astraPost(raw) {
  if (!raw || raw.listed !== true || !safePath(raw.url) || !CATEGORIES.has(raw.domain)) return null;
  if (raw.date !== undefined && !DATE.test(raw.date)) return null;
  const title = text(raw.title, 160);
  if (!title) return null;
  const cover = raw.cover && safePath(raw.cover.src) ? raw.cover : null;
  const banner = safePath(raw.banner ?? '') ? raw.banner : null;
  return {
    id: ID.test(raw.id ?? '') ? raw.id : '',
    stage: STAGES.has(raw.stage) ? raw.stage : 'main-sequence',
    plainTitle: title,
    title: raw.lang === 'es' ? `${title} (ESP)` : title,
    date: raw.date ?? '',
    description: text(raw.summary, 400),
    tags: Array.isArray(raw.tags) ? raw.tags.map((t) => text(t, 32)).filter(Boolean).slice(0, 8) : [],
    category: raw.domain,
    image: banner ?? (cover ? cover.src : DEFAULT_COVER),
    alt: cover ? text(cover.alt, 160) : '',
    url: raw.url,
    label: 'Read More →'
  };
}

async function loadLegacy() {
  const data = parse(await fetchBuffer(LEGACY_URL));
  if (data?.format !== 'blog-posts/1' || !Array.isArray(data.posts)) throw new Error('unknown blog posts format');
  return data.posts.map(legacyPost).filter(Boolean);
}

function astraStar(raw) {
  if (!raw || !safePath(raw.url) || !ID.test(raw.id ?? '') || !CATEGORIES.has(raw.domain)) return null;
  const title = text(raw.title, 160);
  if (!title) return null;
  return {
    id: raw.id,
    plainTitle: title,
    url: raw.url,
    category: raw.domain,
    stage: STAGES.has(raw.stage) ? raw.stage : 'main-sequence',
    description: text(raw.summary, 400),
    kind: text(raw.type, 32)
  };
}

async function loadVerified(url, manifest, name) {
  const expected = manifest?.files?.[name];
  if (!/^[0-9a-f]{64}$/.test(expected?.sha256 ?? '')) return null;
  const buffer = await fetchBuffer(url);
  if (buffer.byteLength !== expected.bytes || (await sha256Hex(buffer)) !== expected.sha256) {
    throw new Error(`${name} does not match its manifest`);
  }
  return parse(buffer);
}

async function loadEdges(manifest) {
  const data = await loadVerified(ASTRA_GRAPH_URL, manifest, 'graph.json');
  if (data?.format !== 'astra-graph/1' || !Array.isArray(data.edges)) return [];
  return data.edges
    .filter((edge) => ID.test(edge?.from ?? '') && ID.test(edge?.to ?? ''))
    .slice(0, 4000)
    .map((edge) => ({ from: edge.from, to: edge.to }));
}

async function loadAstra() {
  const manifest = parse(await fetchBuffer(ASTRA_MANIFEST_URL));
  if (manifest?.format !== 'astra-manifest/1') return { posts: [], stars: [], edges: [] };
  const data = await loadVerified(ASTRA_POSTS_URL, manifest, 'posts.json');
  if (data?.format !== 'astra-posts/1' || !Array.isArray(data.posts)) throw new Error('unknown astra posts format');
  const posts = data.posts.map(astraPost).filter(Boolean);
  const stars = data.posts.map(astraStar).filter(Boolean);
  const edges = await loadEdges(manifest).catch(() => []);
  return { posts, stars, edges };
}

function el(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

function icon(name) {
  return el('span', 'material-icons', name);
}

function card(post) {
  const item = el('div', 'item smallarge');
  item.dataset.category = post.category;

  const win = el('div', 'window-muuri');
  const header = el('div', 'window-muuri-header cardsHeader');
  const handle = el('div', 'drag-handle');
  handle.append(icon('drag_indicator'));
  const controls = el('div', 'window-muuri-controls');
  controls.append(icon('minimize'), icon('crop_square'), icon('close'));
  header.append(handle, controls);

  const content = el('div', 'window-muuri-content');
  const img = el('img', 'preview-image');
  img.src = post.image;
  img.alt = post.alt;
  img.decoding = 'async';

  const footer = el('div', 'footer');
  const link = el('a', 'link', post.label);
  link.href = post.url;
  footer.append(el('span', 'tag', post.tags.map((t) => `#${t}`).join(' ')), link);

  const title = el('h3', 'title');
  if (post.stage) {
    const mark = el('span', 'star-mark');
    mark.dataset.stage = post.stage;
    mark.dataset.domain = post.category;
    mark.title = post.stage;
    title.append(mark);
  }
  title.append(document.createTextNode(post.title));
  content.append(img, title, el('div', 'date', dateLabel(post.date)), el('div', 'description', post.description), footer);
  win.append(header, content);
  item.append(win);
  img.addEventListener('load', () => grid?.refreshItems(item).layout(), { once: true });
  return item;
}

function merge(legacy, astra) {
  const byUrl = new Map();
  for (const post of legacy) byUrl.set(post.url, post);
  for (const post of astra) {
    if (!byUrl.has(post.url)) byUrl.set(post.url, post);
  }
  return [...byUrl.values()].sort((a, b) => b.date.localeCompare(a.date));
}

function initMuuri() {
  grid = new Muuri('.grid', {
    dragEnabled: true,
    dragHandle: '.cardsHeader',
    showDuration: 600,
    showEasing: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    visibleStyles: {
      opacity: '1',
      transform: 'scale(1)'
    },
    hiddenStyles: {
      opacity: '0',
      transform: 'scale(0.5)'
    },
    layout: {
      fillGaps: true
    }
  });

  window.addEventListener('load', () => grid.refreshItems().layout());
}

function applyFilters(categoryFilter, searchText) {
  const search = searchText.toLowerCase();
  grid.filter((item) => {
    const element = item.getElement();
    const categoryMatch = !categoryFilter || categoryFilter === 'all' || element.dataset.category === categoryFilter;
    if (!search) return categoryMatch;
    const haystack = ['.tag', '.title', '.description']
      .map((selector) => element.querySelector(selector)?.textContent.toLowerCase() ?? '')
      .join(' ');
    return categoryMatch && haystack.includes(search);
  });
}

function handleFiltering() {
  const buttons = document.querySelectorAll('.option-box');
  const searchInput = document.getElementById('search-filter');
  const selected = () => document.querySelector('.option-box.selected')?.dataset.value ?? 'all';

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('selected'));
      button.classList.add('selected');
      applyFilters(button.dataset.value, searchInput?.value.trim() ?? '');
    });
  });

  searchInput?.addEventListener('input', () => applyFilters(selected(), searchInput.value.trim()));
}

function handleViews(stars, edges) {
  const enter = document.querySelector('[data-view="network"]');
  if (!enter) return;
  enter.addEventListener('click', () => openNetwork(stars, edges));
}

async function start() {
  const host = document.querySelector('[data-grid]');
  if (!host) return;

  const [legacy, astra] = await Promise.allSettled([loadLegacy(), loadAstra()]);
  if (legacy.status === 'rejected') console.warn('blog posts:', legacy.reason);
  if (astra.status === 'rejected') console.warn('astra posts:', astra.reason);

  const station = astra.value ?? { posts: [], stars: [], edges: [] };
  const posts = merge(legacy.value ?? [], station.posts);
  host.replaceChildren(...posts.map(card));
  initMuuri();
  handleFiltering();
  handleViews(station.stars, station.edges);
}

start();
