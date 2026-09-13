import { motion, still } from './fx.js?v=8';
import { lastfm, statusCafe, rightNow, stats, loves } from './profile.js?v=3';

const API = 'https://ws.audioscrobbler.com/2.0/';
const BLANK_ART = '2a96cbd8b46e442fc41c2b86b821562f';
const POLL = 30000;
const EMPTY = 'EMPTY SLOT';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function ago(uts) {
  if (!uts) return 'LAST PLAYED';
  const s = Math.max(0, Date.now() / 1000 - uts);
  if (s < 90) return 'PLAYED JUST NOW';
  if (s < 3600) return `PLAYED ${Math.round(s / 60)} MIN AGO`;
  if (s < 86400) return `PLAYED ${Math.round(s / 3600)} H AGO`;
  return `PLAYED ${Math.round(s / 86400)} D AGO`;
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

class NowPlaying {
  constructor(host) {
    this.key = '';
    this.timer = 0;

    const root = el('div', 'ab-np is-offline');
    const art = el('div', 'ab-np-art');
    this.img = el('img');
    this.img.alt = '';
    this.img.decoding = 'async';
    this.img.addEventListener('load', () => this.img.classList.add('is-ready'));
    art.append(this.img, el('span', 'ab-np-noart'));

    const meta = el('div', 'ab-np-meta');
    const state = el('span', 'ab-np-state');
    this.stateText = el('span', '', 'SIGNAL OFFLINE');
    state.append(el('b', 'ab-np-dot'), this.stateText);

    this.title = el('a', 'ab-np-title', EMPTY);
    this.title.target = '_blank';
    this.title.rel = 'noopener';
    this.artist = el('span', 'ab-np-artist', '');

    const bars = el('span', 'ab-np-bars');
    for (let i = 0; i < 12; i++) {
      const bar = el('i');
      bar.style.animationDelay = `${(i * 137) % 900}ms`;
      bars.append(bar);
    }

    meta.append(state, this.title, this.artist, bars);
    root.append(art, meta);
    this.root = root;
    host.replaceChildren(root);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.enabled) this.poll();
    });
  }

  get enabled() {
    return Boolean(lastfm.user && lastfm.apiKey);
  }

  start() {
    if (!this.enabled) {
      this.offline('LINK PENDING');
      return;
    }
    this.poll();
  }

  async poll() {
    clearTimeout(this.timer);
    if (document.hidden) return;
    try {
      const params = new URLSearchParams({
        method: 'user.getrecenttracks',
        user: lastfm.user,
        api_key: lastfm.apiKey,
        format: 'json',
        limit: '1'
      });
      const res = await fetch(`${API}?${params}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const tracks = data?.recenttracks?.track;
      const track = Array.isArray(tracks) ? tracks[0] : tracks;
      if (track) await this.show(track);
      else this.offline('NO SIGNAL');
    } catch (_) {
      this.offline('SIGNAL LOST');
    }
    this.timer = setTimeout(() => this.poll(), POLL);
  }

  offline(label) {
    this.root.classList.remove('is-live');
    this.root.classList.add('is-offline');
    this.stateText.textContent = label;
  }

  async show(track) {
    const live = track['@attr']?.nowplaying === 'true';
    const name = track.name || '';
    const artist = track.artist?.['#text'] || track.artist?.name || '';
    const art = (track.image || []).map((image) => image['#text']).filter(Boolean).pop() || '';

    this.root.classList.remove('is-offline');
    this.root.classList.toggle('is-live', live);
    this.stateText.textContent = live ? 'LISTENING NOW' : ago(Number(track.date?.uts));

    const key = `${name}|${artist}`;
    if (key === this.key) return;
    this.key = key;

    this.title.href = track.url || `https://www.last.fm/user/${encodeURIComponent(lastfm.user)}`;
    this.title.title = name;
    this.artist.textContent = artist;

    this.img.classList.remove('is-ready');
    if (art && !art.includes(BLANK_ART)) {
      this.img.src = art;
      this.root.classList.add('has-art');
    } else {
      this.img.removeAttribute('src');
      this.root.classList.remove('has-art');
    }

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
    this.values = [...fillRows(nowHost, rightNow), ...fillRows(statsHost, stats)];
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
