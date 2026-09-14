import { motion, still } from './fx.js?v=8';
import { wall, stickers, discs } from './profile.js?v=10';
import { findCover, manualCover } from './cover.js?v=4';

const STICKER_DIR = 'assets/images/stickers/pom/';
const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=';
const BODY_MAX = 140;
const NAME_MAX = 24;
const REFRESH_MS = 45000;
const TOKEN_WAIT_MS = 12000;
const NAME_KEY = 'skye-wall-name';
const STICKER_KEY = 'skye-wall-sticker';
const OWNER_KEY = 'skye-wall-owner';
const NEAR_BOTTOM = 90;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const MESSAGES = {
  blocked_content: "That note has words the wall can't keep. Try saying it another way.",
  no_links: 'Links are not allowed on the wall.',
  no_contact: 'Please leave out emails and phone numbers.',
  spam: 'That looks a little like spam. Try again?',
  cooldown: 'You already left a note recently. Come back in a bit.',
  wall_full: 'The wall is resting for today. Come back tomorrow.',
  rate_limited: 'Too many tries. Wait a minute and try again.',
  verification_failed: "We couldn't verify you. Please try again.",
  invalid_body: 'Your note needs 1 to 140 characters.',
  invalid_name: 'Names can be up to 24 characters.',
  invalid_sticker: 'Pick a sticker first.',
  parent_not_found: 'That note is gone, so it cannot get a reply.',
  unauthorized: 'Owner session ended. Unlock again.',
  wall_unavailable: 'The wall is offline right now.',
  network: 'Signal lost. Check your connection and try again.'
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function since(uts) {
  if (!uts) return '';
  const s = Math.max(0, Date.now() / 1000 - uts);
  if (s < 60) return 'JUST NOW';
  if (s < 3600) return `${Math.floor(s / 60)} MIN AGO`;
  if (s < 86400) return `${Math.floor(s / 3600)} H AGO`;
  if (s < 604800) return `${Math.floor(s / 86400)} D AGO`;
  const date = new Date(uts * 1000);
  return `${MONTHS[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}`;
}

function readStore(storage, key) {
  try {
    return storage.getItem(key) || '';
  } catch (_) {
    return '';
  }
}

function writeStore(storage, key, value) {
  try {
    if (value) storage.setItem(key, value);
    else storage.removeItem(key);
  } catch (_) {}
}

const stickerSrc = (id) => STICKER_DIR + (stickers.includes(id) ? id : stickers[0]) + '.gif';
const length = (value) => [...value].length;
const tidy = (value) => value.replace(/\s+/g, ' ').trim();

export class EchoWall {
  constructor({ host }) {
    this.host = host;
    this.threads = new Map();
    this.etag = '';
    this.next = null;
    this.loading = false;
    this.sending = false;
    this.visible = false;
    this.started = false;
    this.token = '';
    this.widget = null;
    this.waiters = [];
    this.turnstile = null;
    this.owner = false;
    this.ownerKey = readStore(sessionStorage, OWNER_KEY);
    this.replyTo = null;
    const saved = readStore(localStorage, STICKER_KEY);
    this.sticker = stickers.includes(saved) ? saved : stickers[0];

    this.build();
    this.bind();
    if (this.ownerKey) this.unlock(this.ownerKey, true);
  }

  get online() {
    return Boolean(wall.endpoint);
  }

  build() {
    this.root = el('div', 'ab-wall');

    this.scroller = el('div', 'ab-wall-scroll');
    this.scroller.tabIndex = 0;
    this.scroller.setAttribute('role', 'log');
    this.scroller.setAttribute('aria-label', 'Notes left on the wall');
    this.older = el('button', 'ab-wall-older', 'LOAD OLDER');
    this.older.type = 'button';
    this.older.hidden = true;
    this.log = el('ol', 'ab-wall-log');
    this.empty = el('p', 'ab-wall-empty', this.online ? 'NO NOTES YET. BE THE FIRST.' : 'THE WALL IS OFFLINE.');
    this.scroller.append(this.older, this.log, this.empty);

    this.form = el('form', 'ab-wall-form');
    this.form.noValidate = true;

    this.ownerBar = el('div', 'ab-wall-owner');
    this.ownerBar.hidden = true;
    this.ownerInput = el('input', 'ab-wall-owner-key');
    this.ownerInput.type = 'password';
    this.ownerInput.autocomplete = 'off';
    this.ownerInput.spellcheck = false;
    this.ownerInput.placeholder = 'owner key';
    this.ownerInput.setAttribute('aria-label', 'Owner key');
    this.ownerUnlock = el('button', 'ab-wall-owner-btn', 'UNLOCK');
    this.ownerUnlock.type = 'button';
    this.ownerState = el('span', 'ab-wall-owner-state', 'POSTING AS SKYE');
    this.ownerLock = el('button', 'ab-wall-owner-btn', 'LOCK');
    this.ownerLock.type = 'button';
    this.ownerBar.append(this.ownerInput, this.ownerUnlock, this.ownerState, this.ownerLock);

    this.picker = el('div', 'ab-wall-picker');
    this.picker.setAttribute('role', 'radiogroup');
    this.picker.setAttribute('aria-label', 'Choose a sticker');
    this.choices = stickers.map((id, index) => {
      const button = el('button', 'ab-wall-choice');
      button.type = 'button';
      button.dataset.id = id;
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-label', `Sticker ${index + 1}`);
      const img = el('img');
      img.src = stickerSrc(id);
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      button.append(img);
      return button;
    });
    this.picker.append(...this.choices);

    this.replying = el('div', 'ab-wall-replying');
    this.replying.hidden = true;
    this.replyingText = el('span');
    this.replyCancel = el('button', 'ab-wall-owner-btn', 'CANCEL');
    this.replyCancel.type = 'button';
    this.replying.append(this.replyingText, this.replyCancel);

    const fields = el('div', 'ab-wall-fields');
    this.name = el('input', 'ab-wall-name');
    this.name.type = 'text';
    this.name.maxLength = NAME_MAX;
    this.name.placeholder = 'name (optional)';
    this.name.autocomplete = 'nickname';
    this.name.value = readStore(localStorage, NAME_KEY).slice(0, NAME_MAX);
    this.name.setAttribute('aria-label', 'Your name');

    const note = el('div', 'ab-wall-note');
    this.body = el('textarea', 'ab-wall-body');
    this.body.rows = 2;
    this.body.maxLength = BODY_MAX;
    this.body.placeholder = 'leave a note for skye';
    this.body.setAttribute('aria-label', 'Your note');
    this.count = el('span', 'ab-wall-count', `0/${BODY_MAX}`);
    note.append(this.body, this.count);
    fields.append(this.name, note);

    this.trap = el('input', 'ab-wall-trap');
    this.trap.type = 'text';
    this.trap.name = 'website';
    this.trap.tabIndex = -1;
    this.trap.autocomplete = 'off';
    this.trap.setAttribute('aria-hidden', 'true');

    this.verify = el('div', 'ab-wall-verify');

    const actions = el('div', 'ab-wall-actions');
    this.status = el('p', 'ab-wall-status');
    this.status.setAttribute('aria-live', 'polite');
    this.send = el('button', 'ab-wall-send', 'SEND');
    this.send.type = 'submit';
    actions.append(this.status, this.send);

    this.form.append(this.ownerBar, this.picker, this.replying, fields, this.trap, this.verify, actions);
    this.root.append(this.scroller, this.form);
    this.host.replaceChildren(this.root);

    this.pick(this.sticker, false);
    if (location.hash === '#owner') this.ownerBar.hidden = false;
    this.applyMode();
  }

  bind() {
    this.picker.addEventListener('click', (e) => {
      const choice = e.target.closest('.ab-wall-choice');
      if (choice) this.pick(choice.dataset.id, true);
    });
    this.picker.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault();
      const step = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
      const index = (stickers.indexOf(this.sticker) + step + stickers.length) % stickers.length;
      this.pick(stickers[index], true);
      this.choices[index].focus();
    });

    this.body.addEventListener('input', () => this.updateCount());
    this.body.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        this.form.requestSubmit();
      }
    });
    this.form.addEventListener('submit', (e) => this.submit(e));
    const warmVerify = () => {
      if (!this.owner) this.prepareVerify();
    };
    this.form.addEventListener('focusin', warmVerify);
    this.form.addEventListener('pointerenter', warmVerify);
    this.older.addEventListener('click', () => this.loadOlder());

    this.ownerUnlock.addEventListener('click', () => this.unlock(this.ownerInput.value.trim(), false));
    this.ownerInput.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      this.unlock(this.ownerInput.value.trim(), false);
    });
    this.ownerLock.addEventListener('click', () => this.lock());
    this.replyCancel.addEventListener('click', () => this.setReply(null));
    this.log.addEventListener('click', (e) => {
      const button = e.target.closest('.ab-wall-reply-btn');
      if (!button || !this.owner) return;
      this.setReply({ id: button.dataset.id, name: button.dataset.name });
    });
    addEventListener('hashchange', () => {
      if (location.hash === '#owner') this.ownerBar.hidden = false;
    });

    new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (this.visible) this.start();
    }, { rootMargin: '200px 0px' }).observe(this.host);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.visible) this.refresh();
    });
    setInterval(() => {
      if (this.visible && !document.hidden) this.refresh();
    }, REFRESH_MS);
    setInterval(() => this.tick(), 60000);
  }

  applyMode() {
    this.root.classList.toggle('is-owner', this.owner);
    this.ownerInput.hidden = this.owner;
    this.ownerUnlock.hidden = this.owner;
    this.ownerState.hidden = !this.owner;
    this.ownerLock.hidden = !this.owner;
    this.name.hidden = this.owner;
    this.body.placeholder = this.owner ? 'write as skye' : 'leave a note for skye';

    const closed = !this.online || (!this.owner && !wall.turnstileSiteKey);
    this.form.classList.toggle('is-offline', closed);
    this.send.disabled = closed || this.sending;
    if (closed && !this.owner) this.say(this.online ? 'NOTES OPEN SOON' : MESSAGES.wall_unavailable);
  }

  ownerUrl() {
    const url = new URL(wall.endpoint);
    url.pathname = url.pathname.replace(/\/?$/, '/owner');
    return url;
  }

  async unlock(key, silent) {
    if (!this.online || key.length < 16) {
      if (!silent) this.say('That key did not work.', 'error');
      return;
    }
    try {
      const res = await fetch(this.ownerUrl(), {
        headers: { accept: 'application/json', authorization: `Bearer ${key}` },
        cache: 'no-store',
        credentials: 'omit',
        referrerPolicy: 'no-referrer'
      });
      if (!res.ok) throw new Error(String(res.status));
      this.owner = true;
      this.ownerKey = key;
      writeStore(sessionStorage, OWNER_KEY, key);
      this.ownerInput.value = '';
      this.ownerBar.hidden = false;
      this.applyMode();
      this.say('POSTING AS SKYE', 'ok');
    } catch (_) {
      this.lock();
      if (!silent) this.say('That key did not work.', 'error');
    }
  }

  lock() {
    this.owner = false;
    this.ownerKey = '';
    writeStore(sessionStorage, OWNER_KEY, '');
    this.setReply(null);
    this.applyMode();
  }

  setReply(target) {
    this.replyTo = target && this.threads.has(target.id) ? target : null;
    this.replying.hidden = !this.replyTo;
    this.replyingText.textContent = this.replyTo ? `REPLYING TO ${(this.replyTo.name || 'anon').toUpperCase()}` : '';
    if (this.replyTo) this.body.focus();
  }

  pick(id, remember) {
    this.sticker = stickers.includes(id) ? id : stickers[0];
    for (const choice of this.choices) {
      const on = choice.dataset.id === this.sticker;
      choice.setAttribute('aria-checked', String(on));
      choice.tabIndex = on ? 0 : -1;
    }
    if (remember) writeStore(localStorage, STICKER_KEY, this.sticker);
  }

  updateCount() {
    const used = length(this.body.value);
    this.count.textContent = `${used}/${BODY_MAX}`;
    this.count.classList.toggle('is-full', used >= BODY_MAX);
  }

  start() {
    if (this.started || !this.online) return;
    this.started = true;
    this.refresh(true);
  }

  endpoint(params = {}) {
    const url = new URL(wall.endpoint);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    return url;
  }

  async refresh(first = false) {
    if (!this.online || this.loading) return;
    this.loading = true;
    try {
      const headers = { accept: 'application/json' };
      if (this.etag) headers['if-none-match'] = this.etag;
      const res = await fetch(this.endpoint(), { headers, cache: 'no-cache', credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (res.status === 304) return;
      if (!res.ok) throw new Error(String(res.status));
      this.etag = res.headers.get('etag') || '';
      const data = await res.json();
      const notes = Array.isArray(data?.notes) ? data.notes : [];
      if (first) {
        this.next = data?.next || null;
        this.older.hidden = !this.next;
      }
      this.append(notes.slice().reverse(), !first);
      if (first) this.scrollToEnd(false);
    } catch (_) {
      if (first) this.empty.textContent = 'SIGNAL LOST.';
    } finally {
      this.loading = false;
      this.empty.hidden = this.threads.size > 0;
    }
  }

  async loadOlder() {
    if (!this.next || this.loading) return;
    this.loading = true;
    this.older.disabled = true;
    this.older.textContent = 'LOADING';
    try {
      const res = await fetch(this.endpoint({ before: this.next }), { headers: { accept: 'application/json' }, credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      this.next = data?.next || null;
      const before = this.scroller.scrollHeight;
      const rows = (Array.isArray(data?.notes) ? data.notes : []).slice().reverse()
        .filter((note) => note?.id && !this.threads.has(note.id))
        .map((note) => this.row(note));
      this.log.prepend(...rows);
      this.scroller.scrollTop += this.scroller.scrollHeight - before;
    } catch (_) {}
    this.loading = false;
    this.older.disabled = false;
    this.older.textContent = 'LOAD OLDER';
    this.older.hidden = !this.next;
  }

  append(notes, animate) {
    const pinned = this.scroller.scrollHeight - this.scroller.scrollTop - this.scroller.clientHeight < NEAR_BOTTOM;
    const rows = [];
    for (const note of notes) {
      if (!note?.id) continue;
      if (this.threads.has(note.id)) {
        this.syncReplies(note.id, note.replies, animate);
        continue;
      }
      const row = this.row(note);
      if (animate && !still) row.classList.add('is-new');
      rows.push(row);
    }
    if (rows.length) {
      this.log.append(...rows);
      this.empty.hidden = true;
    }
    if (pinned && (rows.length || animate)) this.scrollToEnd(animate);
  }

  syncReplies(id, replies, animate) {
    const thread = this.threads.get(id);
    if (!thread || !Array.isArray(replies)) return;
    for (const reply of replies) {
      if (!reply?.id || thread.ids.has(reply.id)) continue;
      thread.ids.add(reply.id);
      const item = this.replyRow(reply);
      if (animate && !still) item.classList.add('is-new');
      thread.list.append(item);
    }
    thread.list.hidden = thread.ids.size === 0;
  }

  scrollToEnd(smooth) {
    this.scroller.scrollTo({ top: this.scroller.scrollHeight, behavior: smooth && !still ? 'smooth' : 'auto' });
  }

  meta(note) {
    const meta = el('div', 'ab-wall-meta');
    const author = el('b', 'ab-wall-author', note.owner ? 'skye' : note.name || 'anon');
    meta.append(author);
    if (note.owner) meta.append(el('span', 'ab-wall-badge', 'OWNER'));
    const time = el('span', 'ab-wall-time', since(note.createdAt));
    time.dataset.at = String(note.createdAt || '');
    meta.append(time);
    return meta;
  }

  row(note) {
    const li = el('li', note.owner ? 'ab-wall-msg is-owner' : 'ab-wall-msg');
    li.dataset.id = note.id;

    const sticker = el('img', 'ab-wall-sticker');
    sticker.src = stickerSrc(note.sticker);
    sticker.alt = '';
    sticker.loading = 'lazy';
    sticker.decoding = 'async';

    const bubble = el('div', 'ab-wall-bubble');
    const meta = this.meta(note);
    const reply = el('button', 'ab-wall-reply-btn', 'REPLY');
    reply.type = 'button';
    reply.dataset.id = note.id;
    reply.dataset.name = note.owner ? 'skye' : note.name || 'anon';
    meta.append(reply);
    bubble.append(meta, el('p', 'ab-wall-text', note.body));
    if (note.track?.name) bubble.append(this.song(note.track));

    const list = el('ol', 'ab-wall-replies');
    list.hidden = true;
    li.append(sticker, bubble, list);

    this.threads.set(note.id, { list, ids: new Set() });
    this.syncReplies(note.id, note.replies, false);
    return li;
  }

  replyRow(note) {
    const li = el('li', note.owner ? 'ab-wall-reply is-owner' : 'ab-wall-reply');
    li.dataset.id = note.id;
    li.append(this.meta(note), el('p', 'ab-wall-text', note.body));
    if (note.track?.name) li.append(this.song(note.track));
    return li;
  }

  song(track) {
    const chip = el(track.url ? 'a' : 'div', 'ab-wall-song');
    if (track.url) {
      chip.href = track.url;
      chip.target = '_blank';
      chip.rel = 'noopener';
    }
    chip.title = [track.name, track.artist].filter(Boolean).join(' · ');

    const cover = el('span', 'ab-wall-cover');
    const img = el('img');
    img.alt = '';
    img.decoding = 'async';
    const fallback = discs[0] || '';
    const toDisc = () => {
      if (fallback && img.getAttribute('src') !== fallback) {
        img.src = fallback;
        cover.classList.add('is-disc');
      }
    };
    let rescued = false;
    img.addEventListener('error', () => {
      if (rescued || img.getAttribute('src') === fallback) return toDisc();
      rescued = true;
      findCover(track).then((found) => {
        const next = found?.thumb || found?.image;
        if (next && next !== img.getAttribute('src')) {
          img.src = next;
          cover.classList.remove('is-disc');
        } else {
          toDisc();
        }
      });
    });
    const real = track.thumb || track.image || manualCover(track);
    img.src = real || fallback;
    cover.classList.toggle('is-disc', !real);
    if (!real) {
      findCover(track).then((found) => {
        if (!found) return;
        img.src = found.thumb || found.image;
        cover.classList.remove('is-disc');
      });
    }
    cover.append(img);

    const text = el('span', 'ab-wall-song-text');
    text.append(
      el('span', 'ab-wall-song-label', track.live ? 'SKYE WAS LISTENING TO' : 'SKYE HAD JUST PLAYED'),
      el('span', 'ab-wall-song-name', track.name),
      el('span', 'ab-wall-song-artist', track.artist || '')
    );
    chip.append(cover, text);
    return chip;
  }

  tick() {
    for (const time of this.log.querySelectorAll('.ab-wall-time')) {
      time.textContent = since(Number(time.dataset.at));
    }
  }

  say(text, tone = '') {
    this.status.textContent = text;
    this.status.dataset.tone = tone;
  }

  prepareVerify() {
    if (!wall.turnstileSiteKey || this.turnstile) return this.turnstile;
    this.turnstile = new Promise((resolve) => {
      const callback = `__wallTurnstile${Date.now()}`;
      window[callback] = () => {
        delete window[callback];
        resolve(window.turnstile ?? null);
      };
      const script = document.createElement('script');
      script.src = TURNSTILE_SRC + callback;
      script.async = true;
      script.defer = true;
      script.onerror = () => resolve(null);
      document.head.append(script);
    }).then((api) => {
      if (!api) return null;
      this.widget = api.render(this.verify, {
        sitekey: wall.turnstileSiteKey,
        action: 'echo-wall',
        theme: 'dark',
        size: 'flexible',
        appearance: 'interaction-only',
        'refresh-expired': 'auto',
        callback: (token) => {
          this.token = token;
          this.waiters.splice(0).forEach((resolve) => resolve(token));
        },
        'expired-callback': () => {
          this.token = '';
        },
        'error-callback': () => {
          this.token = '';
          this.waiters.splice(0).forEach((resolve) => resolve(''));
        }
      });
      return api;
    });
    return this.turnstile;
  }

  async waitToken() {
    if (this.token) return this.token;
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(''), TOKEN_WAIT_MS);
      this.waiters.push((token) => {
        clearTimeout(timer);
        resolve(token);
      });
    });
  }

  resetVerify() {
    this.token = '';
    if (window.turnstile && this.widget !== null) {
      try {
        window.turnstile.reset(this.widget);
      } catch (_) {}
    }
  }

  async post(payload, headers) {
    const res = await fetch(wall.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json', ...headers },
      body: JSON.stringify(payload),
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer'
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.note) throw Object.assign(new Error('post'), { code: data?.error || 'network' });
    return data.note;
  }

  async submit(e) {
    e.preventDefault();
    if (this.sending || !this.online) return;

    const body = tidy(this.body.value);
    if (!body || length(body) > BODY_MAX) return this.say(MESSAGES.invalid_body, 'error');

    this.sending = true;
    this.send.disabled = true;

    try {
      let note;
      if (this.owner) {
        this.say('SENDING');
        note = await this.post(
          { body, sticker: this.sticker, parentId: this.replyTo?.id ?? null },
          { authorization: `Bearer ${this.ownerKey}` }
        );
      } else {
        const name = tidy(this.name.value);
        if (length(name) > NAME_MAX) throw Object.assign(new Error('name'), { code: 'invalid_name' });
        if (!wall.turnstileSiteKey) throw Object.assign(new Error('offline'), { code: 'wall_unavailable' });
        this.say('VERIFYING');
        const api = await this.prepareVerify();
        const token = api ? await this.waitToken() : '';
        if (!token) throw Object.assign(new Error('verify'), { code: 'verification_failed' });
        this.say('SENDING');
        note = await this.post({ body, name, sticker: this.sticker, token, website: this.trap.value });
        writeStore(localStorage, NAME_KEY, name);
      }

      this.body.value = '';
      this.updateCount();
      this.etag = '';
      if (note.parentId) {
        this.syncReplies(note.parentId, [note], true);
        this.setReply(null);
      } else {
        this.append([note], true);
        this.scrollToEnd(true);
        this.celebrate();
      }
      this.say(this.owner ? 'POSTED AS SKYE.' : 'SAVED. YOUR NOTE HOLDS THE SONG SKYE WAS PLAYING.', 'ok');
    } catch (err) {
      if (err.code === 'unauthorized') this.lock();
      this.say(MESSAGES[err.code] || MESSAGES.network, 'error');
    } finally {
      this.sending = false;
      this.send.disabled = this.form.classList.contains('is-offline');
      if (!this.owner) this.resetVerify();
    }
  }

  async celebrate() {
    if (still) return;
    const gsap = await motion();
    const row = this.log.lastElementChild;
    if (!gsap || !row) return;
    gsap.fromTo(row.querySelector('.ab-wall-sticker'), { scale: 0.4, rotation: -18 }, { scale: 1, rotation: 0, duration: 0.7, ease: 'back.out(2.4)' });
  }
}
