import { motion, still } from './fx.js?v=8';
import { lastfm, discs, statusCafe, loves } from './profile.js?v=10';
import { findCover, manualCover } from './cover.js?v=3';
import { ListeningClock } from './clock.js?v=3';

const POLL = 15000;
const MAX_POLL = 300000;
const HISTORY_CAP = 600;
const EMPTY = 'EMPTY SLOT';
const ABOUT_URL = 'data/about.json';
const TEXT_MAX = 80;
const ROWS_MAX = 12;
const CURRENTLY = ['reading', 'playing', 'drawing', 'watching', 'learning'];
const STATS = ['pronouns', 'age', 'height', 'coffee or tea', 'fav color'];

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function fillRows(host, list) {
  host.replaceChildren(...list.map(({ key, value }) => {
    const li = el('li', value ? '' : 'is-empty');
    const text = el('span', 'v', value || EMPTY);
    text.dataset.text = text.textContent;
    li.append(el('span', 'k', key), text);
    return li;
  }));
  return [...host.querySelectorAll('.v')];
}

const blank = (keys) => keys.map((key) => ({ key, value: '' }));

function readRows(source, fallback) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return fallback;
  return Object.entries(source)
    .filter(([key, value]) => key.trim() && (typeof value === 'string' || typeof value === 'number'))
    .slice(0, ROWS_MAX)
    .map(([key, value]) => ({ key: key.trim().slice(0, 24), value: String(value).trim().slice(0, TEXT_MAX) }));
}

function photoUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim(), document.baseURI);
    return url.protocol === 'https:' || url.origin === location.origin ? url.href : '';
  } catch (_) {
    return '';
  }
}

async function loadAbout() {
  try {
    const res = await fetch(ABOUT_URL, { cache: 'no-cache', credentials: 'omit' });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    return {
      currently: readRows(data?.currently, blank(CURRENTLY)),
      stats: readRows(data?.stats, blank(STATS)),
      photo: photoUrl(data?.photo)
    };
  } catch (_) {
    return { currently: blank(CURRENTLY), stats: blank(STATS), photo: '' };
  }
}

function fillPhoto(anchor, src) {
  if (!src) {
    const empty = el('figure', 'ab-photo is-empty');
    empty.append(el('span', '', 'PHOTO SOON'));
    anchor.before(empty);
    return;
  }
  const figure = el('figure', 'ab-photo');
  const img = el('img');
  img.alt = "Skye's profile picture";
  img.decoding = 'async';
  img.addEventListener('load', () => figure.classList.add('is-ready'));
  img.addEventListener('error', () => {
    figure.replaceChildren(el('span', '', 'PHOTO SOON'));
    figure.classList.add('is-empty');
  });
  img.src = src;
  figure.append(img);
  anchor.before(figure);
}

function fillLoves(host, groups) {
  host.replaceChildren(...groups.map(({ group, items }) => {
    const box = el('section', 'ab-love-group');
    const list = el('ul');
    const filled = items.filter(Boolean);
    if (filled.length) list.append(...filled.map((item) => el('li', 'ab-chip', item)));
    else list.append(el('li', 'ab-chip is-empty', EMPTY));
    box.append(el('h4', '', group.toUpperCase()), list);
    return box;
  }));
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function since(uts) {
  if (!uts) return '';
  const s = Math.max(0, Date.now() / 1000 - uts);
  if (s < 90) return 'JUST NOW';
  if (s < 3600) return `${Math.round(s / 60)} MIN AGO`;
  if (s < 86400) return `${Math.round(s / 3600)} H AGO`;
  if (s < 604800) return `${Math.round(s / 86400)} D AGO`;
  const date = new Date(uts * 1000);
  return `${MONTHS[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}`;
}

const trackKey = (track) => `${track.playedAt ?? 'live'}|${track.name}|${track.artist}`;

function discFor(track) {
  if (!discs.length) return '';
  let hash = 2166136261;
  for (const ch of `${track.artist}|${track.album || track.name}`.toLowerCase()) {
    hash = Math.imul(hash ^ ch.codePointAt(0), 16777619) >>> 0;
  }
  return discs[hash % discs.length];
}

function art(className, src, fallback, track) {
  const box = el('span', className);
  const img = el('img');
  img.alt = '';
  img.decoding = 'async';
  img.addEventListener('load', () => img.classList.add('is-ready'));
  const toDisc = () => {
    if (fallback && img.getAttribute('src') !== fallback) {
      img.src = fallback;
      box.classList.add('is-disc');
    } else {
      box.classList.remove('has-art');
    }
  };
  let rescued = !track;
  img.addEventListener('error', () => {
    if (rescued || img.getAttribute('src') === fallback) return toDisc();
    rescued = true;
    findCover(track).then((found) => {
      const next = found?.thumb || found?.image;
      if (next && next !== img.getAttribute('src')) {
        img.src = next;
        box.classList.remove('is-disc');
      } else {
        toDisc();
      }
    });
  });
  box.append(img);
  const first = src || fallback;
  if (first) {
    img.src = first;
    box.classList.add('has-art');
    box.classList.toggle('is-disc', !src);
  }
  return { box, img, fallback };
}

function upgrade(thumb, track) {
  findCover(track).then((found) => {
    if (!found || !thumb.box.classList.contains('is-disc')) return;
    thumb.img.classList.remove('is-ready');
    thumb.img.src = found.thumb || found.image;
    thumb.box.classList.add('has-art');
    thumb.box.classList.remove('is-disc');
  });
}

class NowPlaying {
  constructor(host) {
    this.heroKey = '';
    this.timer = 0;
    this.fails = 0;
    this.page = 1;
    this.pages = 1;
    this.total = 0;
    this.primed = false;
    this.loading = false;
    this.rows = new Map();

    const root = el('div', 'ab-np is-offline');

    const hero = el('div', 'ab-np-hero');
    this.glow = el('img', 'ab-np-glow');
    this.glow.alt = '';
    this.glow.setAttribute('aria-hidden', 'true');
    this.glow.addEventListener('load', () => this.glow.classList.add('is-ready'));

    const cover = el('div', 'ab-np-art');
    this.img = el('img');
    this.img.alt = '';
    this.img.decoding = 'async';
    this.img.addEventListener('load', () => this.img.classList.add('is-ready'));
    const heroDisc = () => {
      if (this.fallback && this.img.getAttribute('src') !== this.fallback) {
        this.img.src = this.fallback;
        this.glow.src = this.fallback;
        root.classList.add('is-disc');
      } else {
        root.classList.remove('has-art');
      }
    };
    this.img.addEventListener('error', () => {
      const track = this.heroTrack;
      if (!track || this.rescuedFor === track || this.img.getAttribute('src') === this.fallback) return heroDisc();
      this.rescuedFor = track;
      findCover(track).then((found) => {
        if (this.heroTrack !== track) return;
        const next = found?.image || found?.thumb;
        if (next && next !== this.img.getAttribute('src')) {
          this.img.src = next;
          this.glow.src = next;
          root.classList.remove('is-disc');
        } else {
          heroDisc();
        }
      });
    });
    cover.append(this.img, el('span', 'ab-np-noart'));

    const meta = el('div', 'ab-np-meta');
    meta.setAttribute('aria-live', 'polite');
    const state = el('span', 'ab-np-state');
    this.stateText = el('span', '', 'SIGNAL OFFLINE');
    state.append(el('b', 'ab-np-dot'), this.stateText);

    this.title = el('a', 'ab-np-title', EMPTY);
    this.title.target = '_blank';
    this.title.rel = 'noopener';
    this.artist = el('span', 'ab-np-artist', '');
    this.album = el('span', 'ab-np-album', '');

    const bars = el('span', 'ab-np-bars');
    for (let i = 0; i < 12; i++) {
      const bar = el('i');
      bar.style.animationDelay = `${(i * 137) % 900}ms`;
      bars.append(bar);
    }

    meta.append(state, this.title, this.artist, this.album, bars);
    this.clockHost = el('div');
    hero.append(this.glow, cover, meta, this.clockHost);
    this.clock = new ListeningClock(this.clockHost);

    const history = el('section', 'ab-np-history');
    history.setAttribute('aria-label', 'Listening history');
    const head = el('div', 'ab-np-history-head');
    this.totalText = el('em', '', '');
    head.append(el('span', '', 'HISTORY'), this.totalText);

    this.scroller = el('div', 'ab-np-scroll');
    this.scroller.tabIndex = 0;
    this.list = el('ol', 'ab-np-list');
    this.sentinel = el('div', 'ab-np-sentinel');
    this.more = el('button', 'ab-np-more', 'LOAD MORE');
    this.more.type = 'button';
    this.more.hidden = true;
    this.more.addEventListener('click', () => this.loadMore());
    this.scroller.append(this.list, this.sentinel, this.more);
    history.append(head, this.scroller);

    root.append(hero, history);
    this.root = root;
    host.replaceChildren(root);

    new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) this.loadMore();
      },
      { root: this.scroller, rootMargin: '0px 0px 200px 0px' }
    ).observe(this.sentinel);

    setInterval(() => this.tick(), 30000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.enabled) this.poll();
    });
  }

  get enabled() {
    return Boolean(lastfm.endpoint);
  }

  start() {
    if (!this.enabled) {
      this.offline('LINK PENDING');
      return;
    }
    this.poll();
  }

  schedule() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.poll(), Math.min(MAX_POLL, POLL * 2 ** this.fails));
  }

  async request(page) {
    const url = new URL(lastfm.endpoint);
    if (page > 1) url.searchParams.set('page', String(page));
    const res = await fetch(url, {
      headers: { accept: 'application/json' },
      cache: 'no-cache',
      credentials: 'omit',
      referrerPolicy: 'no-referrer'
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  }

  async poll() {
    clearTimeout(this.timer);
    if (document.hidden) return;
    try {
      const data = await this.request(1);
      this.fails = 0;
      const tracks = Array.isArray(data?.tracks) ? data.tracks : data?.track ? [data.track] : [];
      if (data?.pages) this.pages = Math.max(this.page, data.pages);
      this.total = data?.total || this.total;
      if (tracks[0]?.name) {
        await this.show(tracks[0], Boolean(data.live));
        this.merge(tracks, 'top');
      } else {
        this.offline('NO SIGNAL');
      }
      this.primed = true;
      this.sync();
    } catch (_) {
      this.fails = Math.min(this.fails + 1, 4);
      this.offline('SIGNAL LOST');
    }
    this.schedule();
  }

  async loadMore() {
    if (!this.primed || this.loading || this.page >= this.pages || this.rows.size >= HISTORY_CAP) return;
    this.loading = true;
    this.more.disabled = true;
    this.more.textContent = 'LOADING';
    try {
      const data = await this.request(this.page + 1);
      this.page += 1;
      if (data?.pages) this.pages = Math.max(this.page, data.pages);
      this.merge(Array.isArray(data?.tracks) ? data.tracks : [], 'bottom');
    } catch (_) {}
    this.loading = false;
    this.more.disabled = false;
    this.more.textContent = 'LOAD MORE';
    this.sync();
  }

  sync() {
    this.more.hidden = this.page >= this.pages || this.rows.size >= HISTORY_CAP;
    this.totalText.textContent = this.total ? `${this.total.toLocaleString('en-US')} SCROBBLES` : '';
  }

  row(track) {
    const li = el('li');
    li.dataset.key = trackKey(track);
    const link = el(track.url ? 'a' : 'div', 'ab-np-row');
    if (track.url) {
      link.href = track.url;
      link.target = '_blank';
      link.rel = 'noopener';
    }
    const own = track.thumb || track.image || manualCover(track);
    const thumb = art('ab-np-thumb', own, discFor(track), track);
    if (!own) upgrade(thumb, track);
    const text = el('span', 'ab-np-row-text');
    text.append(el('span', 'ab-np-row-name', track.name), el('span', 'ab-np-row-artist', track.artist));
    const time = el('span', 'ab-np-row-time', since(track.playedAt));
    time.dataset.uts = String(track.playedAt ?? '');
    link.append(thumb.box, text, time);
    li.append(link);
    return { li, thumb };
  }

  merge(tracks, where) {
    const fresh = [];
    for (const track of tracks) {
      if (track.live || !track.name) continue;
      const key = trackKey(track);
      const known = this.rows.get(key);
      if (known) {
        const src = track.thumb || track.image;
        const box = known.thumb.box;
        if (src && (!box.classList.contains('has-art') || box.classList.contains('is-disc'))) {
          known.thumb.img.src = src;
          box.classList.add('has-art');
          box.classList.remove('is-disc');
        }
        continue;
      }
      const entry = this.row(track);
      this.rows.set(key, entry);
      fresh.push(entry.li);
    }
    if (!fresh.length) return;

    if (where === 'top') {
      if (this.primed && !still) fresh.forEach((li, i) => {
        li.classList.add('is-new');
        li.style.animationDelay = `${i * 70}ms`;
      });
      this.list.prepend(...fresh);
    } else {
      this.list.append(...fresh);
    }

    while (this.rows.size > HISTORY_CAP && this.list.lastElementChild) {
      const last = this.list.lastElementChild;
      this.rows.delete(last.dataset.key);
      last.remove();
    }
  }

  tick() {
    for (const time of this.list.querySelectorAll('.ab-np-row-time')) {
      time.textContent = since(Number(time.dataset.uts));
    }
    if (this.heroPlayedAt && !this.root.classList.contains('is-live') && !this.root.classList.contains('is-offline')) {
      this.stateText.textContent = `PLAYED ${since(this.heroPlayedAt)}`;
    }
  }

  offline(label) {
    this.root.classList.remove('is-live');
    this.root.classList.add('is-offline');
    this.stateText.textContent = label;
  }

  async show(track, live) {
    const name = track.name;
    const artist = track.artist || '';
    this.heroTrack = track;

    this.root.classList.remove('is-offline');
    this.root.classList.toggle('is-live', live);
    this.heroPlayedAt = live ? null : track.playedAt;
    this.stateText.textContent = live ? 'LISTENING NOW' : track.playedAt ? `PLAYED ${since(track.playedAt)}` : 'LAST PLAYED';

    const song = `${name}|${artist}`;
    const found = this.foundFor === song ? this.found : null;
    const real = track.image || track.thumb || manualCover(track) || found?.image || '';
    this.fallback = discFor(track);
    const src = real || this.fallback;
    this.root.classList.toggle('is-disc', !real);
    const key = `${live}|${name}|${artist}|${src}`;
    if (key === this.heroKey) return;
    const sameSong = this.heroKey.split('|').slice(1, 3).join('|') === `${name}|${artist}`;
    this.heroKey = key;

    this.title.href = track.url || `https://www.last.fm/user/${encodeURIComponent(lastfm.user)}`;
    this.title.title = name;
    this.artist.textContent = artist;
    this.album.textContent = track.album || '';

    if (src && this.img.getAttribute('src') !== src) {
      this.img.classList.remove('is-ready');
      this.glow.classList.remove('is-ready');
      this.img.src = src;
      this.glow.src = src;
      this.root.classList.add('has-art');
    } else if (!src) {
      this.img.removeAttribute('src');
      this.glow.removeAttribute('src');
      this.root.classList.remove('has-art');
    }

    if (!real && this.lookupFor !== song) {
      this.lookupFor = song;
      findCover(track).then((art) => {
        if (!art || this.lookupFor !== song) return;
        this.found = art;
        this.foundFor = song;
        const image = art.image || art.thumb;
        this.heroKey = `${this.root.classList.contains('is-live')}|${song}|${image}`;
        this.img.classList.remove('is-ready');
        this.glow.classList.remove('is-ready');
        this.img.src = image;
        this.glow.src = image;
        this.root.classList.add('has-art');
        this.root.classList.remove('is-disc');
      });
    }

    if (sameSong) return;
    const gsap = still ? null : await motion();
    if (gsap) {
      this.title.textContent = '';
      gsap.to(this.title, { duration: 0.8, overwrite: true, scrambleText: { text: name, chars: 'lowerCase', speed: 0.7 } });
    } else {
      this.title.textContent = name;
    }
  }
}

class CafeStatus {
  constructor(anchor) {
    this.ready = false;
    this.root = el('div', 'ab-cafe is-loading');
    this.face = el('span', 'ab-cafe-face', '✦');
    const body = el('div', 'ab-cafe-body');
    this.text = el('p', 'ab-cafe-text', 'SYNCING STATUS');
    this.meta = el('a', 'ab-cafe-meta', 'STATUS.CAFE');
    this.meta.target = '_blank';
    this.meta.rel = 'noopener';
    body.append(this.text, this.meta);
    this.root.append(this.face, body);
    anchor.before(this.root);
  }

  async load() {
    if (!statusCafe.user) {
      this.root.remove();
      return;
    }
    const user = encodeURIComponent(statusCafe.user);
    this.meta.href = `https://status.cafe/users/${user}`;
    try {
      const res = await fetch(`https://status.cafe/users/${user}/status.json`);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (!data.content) throw new Error('empty');
      this.face.textContent = data.face || '✦';
      this.text.textContent = data.content;
      this.text.dataset.text = data.content;
      this.meta.textContent = data.timeAgo ? `STATUS.CAFE · ${data.timeAgo.toUpperCase()}` : 'STATUS.CAFE';
      this.root.classList.remove('is-loading');
      this.ready = true;
    } catch (_) {
      this.root.classList.remove('is-loading');
      this.root.classList.add('is-offline');
      this.text.textContent = 'STATUS OFFLINE';
    }
  }
}

export class StatusBoard {
  constructor({ nowPlaying, rightNow: nowHost, stats: statsHost, loves: lovesHost }) {
    this.values = [...fillRows(nowHost, blank(CURRENTLY)), ...fillRows(statsHost, blank(STATS))];
    this.aboutReady = loadAbout().then(({ currently, stats: sheet, photo }) => {
      this.values = [...fillRows(nowHost, currently), ...fillRows(statsHost, sheet)];
      fillPhoto(statsHost, photo);
    });
    fillLoves(lovesHost, loves);
    this.cafe = new CafeStatus(nowHost);
    this.cafeReady = this.cafe.load();
    this.player = new NowPlaying(nowPlaying);
    this.player.start();
    this.introduced = false;
  }

  async intro() {
    if (this.introduced) return;
    this.introduced = true;
    await this.aboutReady;
    const gsap = still ? null : await motion();
    if (!gsap) return;
    this.values.forEach((value, i) => {
      value.textContent = '';
      gsap.to(value, { duration: 0.9, delay: 0.35 + i * 0.06, scrambleText: { text: value.dataset.text, chars: '01/<>_', speed: 0.6 } });
    });

    await this.cafeReady;
    if (!this.cafe.ready) return;
    const message = this.cafe.text.dataset.text;
    this.cafe.text.textContent = '';
    gsap.to(this.cafe.text, { duration: 1.4, delay: 0.2, scrambleText: { text: message, chars: 'lowerCase', speed: 0.5 } });
  }
}
