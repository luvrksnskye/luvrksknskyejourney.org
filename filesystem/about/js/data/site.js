import { remember } from '../core/cache.js?v=3';
import { parseLongDate, monthIndex } from '../core/time.js?v=3';

const HOUR = 3600000;
const BORN_YEAR = 2005;

const SOURCES = {
  journal: '/personal/journal/index.html',
  blog: '/filesystem/blogs/index.html',
  changelog: '/filesystem/changelog/js/timeline.js',
  credits: '/filesystem/credits/index.html',
  gallery: '/personal/gallery/js/memories.js',
  about: '/personal/about-me/data/about.json'
};

async function fetchText(url) {
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) throw new Error(`${url} ${response.status}`);
  return response.text();
}

const parse = (html) => new DOMParser().parseFromString(html, 'text/html');

const squash = (text) => String(text || '').replace(/\s+/g, ' ').trim();

const resolve = (href, base) => new URL(href, location.origin + base).pathname;

const PROPER = { css: 'CSS', html: 'HTML', skye: 'Skye', journey: 'Journey' };

const sentenceCase = (text) => squash(text)
  .toLowerCase()
  .replace(/\p{L}+/gu, (word) => PROPER[word] || word)
  .replace(/^([¿¡"'(]*)(\p{L})/u, (m, a, b) => a + b.toUpperCase());

async function journal() {
  const doc = parse(await fetchText(SOURCES.journal));
  return [...doc.querySelectorAll('.entry a[data-diary-entry]')].map((a) => {
    const found = a.querySelector('b')?.textContent.match(/(\d{2})\.(\d{2})\.(\d{2})/);
    const title = squash([...a.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent).join(' '));
    return {
      kind: 'journal',
      title,
      at: found ? Date.UTC(2000 + Number(found[3]), Number(found[1]) - 1, Number(found[2])) : null,
      href: SOURCES.journal,
      source: resolve(a.getAttribute('href'), '/personal/journal/')
    };
  });
}

async function blog() {
  const doc = parse(await fetchText(SOURCES.blog));
  return [...doc.querySelectorAll('.item')].map((item) => {
    const link = item.querySelector('a.link');
    const href = link ? resolve(link.getAttribute('href'), '/filesystem/blogs/') : SOURCES.blog;
    return {
      kind: 'blog',
      title: sentenceCase(item.querySelector('.title')?.textContent).replace(/\s*\((esp|eng)\)\s*$/i, ''),
      at: parseLongDate(item.querySelector('.date')?.textContent),
      href,
      source: href
    };
  }).filter((r) => r.title);
}

async function changelog() {
  const code = await fetchText(SOURCES.changelog);
  const pattern = /date:\s*["'`]([^"'`]+)["'`],\s*title:\s*["'`]([^"'`]+)["'`]/g;
  return [...code.matchAll(pattern)].map(([, date, title]) => ({
    kind: 'changelog',
    title: squash(title),
    at: parseLongDate(date),
    href: '/filesystem/changelog/index.html'
  }));
}

function memoryDate(label, previous) {
  const text = String(label).toUpperCase();
  const decade = text.match(/(EARLY|MID|LATE)?\s*((?:19|20)\d)0S/);
  if (decade) {
    const offset = { EARLY: 2, MID: 5, LATE: 8 }[decade[1]] ?? 5;
    return Date.UTC(Number(decade[2] + '0') + offset, 6, 1);
  }
  const year = text.match(/\b(19|20)\d{2}\b/);
  if (year) {
    const month = monthIndex(text);
    return Date.UTC(Number(year[0]), month < 0 ? 6 : month, 1);
  }
  const age = text.match(/AGE\s+(\d+)/);
  if (age) return Date.UTC(BORN_YEAR + Number(age[1]), 11, 1);
  return previous;
}

async function gallery() {
  const { allMemories } = await import(SOURCES.gallery);
  let previous = null;
  return allMemories.map((m) => {
    previous = memoryDate(m.date, previous);
    return {
      kind: 'gallery',
      title: sentenceCase(m.title),
      label: squash(m.date),
      at: previous,
      core: m.coreLabel,
      href: '/personal/gallery/index.html'
    };
  });
}

async function credits() {
  const doc = parse(await fetchText(SOURCES.credits));
  const names = new Set([...doc.querySelectorAll('.wrapper .name')].map((n) => squash(n.textContent).toLowerCase()));
  names.delete('');
  return names.size;
}

async function about() {
  return JSON.parse(await fetchText(SOURCES.about));
}

const settle = async (task, fallback) => {
  try {
    return await task();
  } catch {
    return fallback;
  }
};

function safeHref(href) {
  try {
    const url = new URL(href, location.origin);
    return url.origin === location.origin ? url.pathname + url.hash : '/';
  } catch {
    return '/';
  }
}

const clean = (site) => ({
  ...site,
  records: (site.records || []).map((r) => ({ ...r, href: safeHref(r.href), source: r.source ? safeHref(r.source) : undefined }))
});

export function loadSite() {
  return loadRaw().then(clean);
}

function loadRaw() {
  return remember('site-v3', HOUR, async () => {
    const [j, b, c, g, names, me] = await Promise.all([
      settle(journal, []),
      settle(blog, []),
      settle(changelog, []),
      settle(gallery, []),
      settle(credits, 0),
      settle(about, null)
    ]);
    const records = [...j, ...b, ...c, ...g].sort((x, y) => (y.at ?? 0) - (x.at ?? 0));
    return {
      records,
      counts: { journal: j.length, blog: b.length, changelog: c.length, gallery: g.length, credits: names },
      cores: new Set(g.map((m) => m.core)).size,
      about: me
    };
  });
}

function countWords(html) {
  const doc = parse(html);
  doc.querySelectorAll('script, style, noscript, nav, header, footer, #nav2-wrapper, [aria-hidden="true"]').forEach((n) => n.remove());
  const text = doc.body?.textContent || '';
  return (text.match(/\p{L}[\p{L}\p{M}'’-]*/gu) || []).length;
}

export function loadWords(site) {
  const pages = [...new Set(site.records.map((r) => r.source).filter(Boolean))];
  return remember('words-v1', 12 * HOUR, async () => {
    const totals = await Promise.all(pages.map((page) => settle(async () => countWords(await fetchText(page)), 0)));
    return totals.reduce((sum, n) => sum + n, 0);
  });
}
