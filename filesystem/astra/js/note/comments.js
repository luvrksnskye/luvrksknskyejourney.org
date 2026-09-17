const ENDPOINT = 'https://now-playing.luvrksnskye.workers.dev/wall';
const SITE_KEY = '0x4AAAAAAEzpsH0hodI4jomx';
const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=';
const STICKER_DIR = '/personal/about-me/assets/images/stickers/pom/';
const STICKERS = Array.from({ length: 15 }, (_, i) => `pom-${String(i + 2).padStart(2, '0')}`);
const TOPIC = /^note:[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BODY_MAX = 140;
const NAME_MAX = 24;
const TOKEN_WAIT_MS = 12000;
const NAME_KEY = 'skye-wall-name';
const STICKER_KEY = 'skye-wall-sticker';
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const MESSAGES = {
  blocked_content: "That note has words the wall can't keep. Try saying it another way.",
  no_links: 'Links are not allowed here.',
  no_contact: 'Please leave out emails and phone numbers.',
  spam: 'That looks a little like spam. Try again?',
  cooldown: 'You already left a note recently. Come back in a bit.',
  wall_full: 'The wall is resting for today. Come back tomorrow.',
  rate_limited: 'Too many tries. Wait a minute and try again.',
  verification_failed: "We couldn't verify you. Please try again.",
  invalid_body: 'Your note needs 1 to 140 characters.',
  invalid_name: 'Names can be up to 24 characters.',
  invalid_sticker: 'Pick a sticker first.',
  invalid_topic: 'This page cannot take notes.',
  topic_not_found: 'Notes for this page are not open yet.',
  wall_unavailable: 'The wall is offline right now.',
  network: 'Signal lost. Check your connection and try again.'
};

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const length = (value) => [...value].length;
const tidy = (value) => value.replace(/\s+/g, ' ').trim();

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function read(key) {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function since(uts) {
  if (!Number.isFinite(uts) || uts <= 0) return '';
  const s = Math.max(0, Date.now() / 1000 - uts);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)} d ago`;
  const date = new Date(uts * 1000);
  return `${MONTHS[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}`;
}

function stickerImg(id, className) {
  const img = el('img', className);
  img.src = `${STICKER_DIR}${STICKERS.includes(id) ? id : STICKERS[0]}.gif`;
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';
  return img;
}

function fail(code) {
  return Object.assign(new Error(code), { code });
}

export class NoteComments {
  constructor(section) {
    this.section = section;
    this.topic = section.dataset.topic ?? '';
    this.state = section.querySelector('[data-comments-state]');
    this.list = section.querySelector('[data-comments-list]');
    this.form = section.querySelector('[data-comments-form]');
    this.body = section.querySelector('[data-body]');
    this.count = section.querySelector('[data-count]');
    this.name = section.querySelector('[data-name]');
    this.trap = section.querySelector('[data-trap]');
    this.stickers = section.querySelector('[data-stickers]');
    this.captcha = section.querySelector('[data-captcha]');
    this.submitButton = section.querySelector('[data-submit]');
    this.formState = section.querySelector('[data-form-state]');
    this.ids = new Set();
    this.next = null;
    this.loading = false;
    this.sending = false;
    this.token = '';
    this.waiters = [];
    this.turnstile = null;
    this.widget = null;
    const saved = read(STICKER_KEY);
    this.sticker = STICKERS.includes(saved) ? saved : STICKERS[0];
  }

  get ready() {
    return (
      TOPIC.test(this.topic) &&
      this.topic.length <= 69 &&
      this.section.dataset.enabled === 'on' &&
      [this.state, this.list, this.form, this.body, this.count, this.name, this.trap, this.stickers, this.captcha, this.submitButton, this.formState].every(Boolean)
    );
  }

  mount() {
    if (!this.ready) return;
    this.section.hidden = false;
    this.form.hidden = true;
    this.buildStickers();
    this.name.value = read(NAME_KEY).slice(0, NAME_MAX);
    this.updateCount();
    this.bind();

    new IntersectionObserver((entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      this.load();
    }, { rootMargin: '400px 0px' }).observe(this.section);
  }

  buildStickers() {
    this.choices = STICKERS.map((id, index) => {
      const button = el('button', 'nt-sticker');
      button.type = 'button';
      button.dataset.id = id;
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-label', `Sticker ${index + 1}`);
      button.append(stickerImg(id));
      return button;
    });
    this.stickers.replaceChildren(...this.choices);
    this.pick(this.sticker, false);
  }

  bind() {
    this.stickers.addEventListener('click', (e) => {
      const choice = e.target.closest('.nt-sticker');
      if (choice) this.pick(choice.dataset.id, true);
    });
    this.stickers.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault();
      const step = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
      const index = (STICKERS.indexOf(this.sticker) + step + STICKERS.length) % STICKERS.length;
      this.pick(STICKERS[index], true);
      this.choices[index].focus();
    });
    this.body.addEventListener('input', () => this.updateCount());
    this.form.addEventListener('submit', (e) => this.submit(e));
    const warm = () => this.prepareVerify();
    this.form.addEventListener('focusin', warm, { once: true });
    this.form.addEventListener('pointerenter', warm, { once: true });
  }

  pick(id, remember) {
    this.sticker = STICKERS.includes(id) ? id : STICKERS[0];
    for (const choice of this.choices) {
      const on = choice.dataset.id === this.sticker;
      choice.setAttribute('aria-checked', String(on));
      choice.tabIndex = on ? 0 : -1;
    }
    if (remember) write(STICKER_KEY, this.sticker);
  }

  updateCount() {
    const left = BODY_MAX - length(this.body.value);
    this.count.textContent = String(left);
    this.count.classList.toggle('is-full', left <= 0);
  }

  say(text, tone = '') {
    this.formState.textContent = text;
    this.formState.dataset.tone = tone;
  }

  url(params = {}) {
    const url = new URL(ENDPOINT);
    url.searchParams.set('topic', this.topic);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    return url;
  }

  async load() {
    if (this.loading) return;
    this.loading = true;
    try {
      const res = await fetch(this.url(this.next ? { before: this.next } : {}), {
        headers: { accept: 'application/json' },
        cache: 'no-cache',
        credentials: 'omit',
        referrerPolicy: 'no-referrer'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw fail(data?.error || 'network');
      const notes = Array.isArray(data?.notes) ? data.notes : [];
      if (notes.some((n) => n?.topic !== this.topic)) throw fail('topic_not_found');
      this.next = typeof data?.next === 'string' ? data.next : null;
      this.list.append(...notes.filter((n) => n?.id && !this.ids.has(n.id)).map((n) => this.row(n)));
      this.renderOlder();
      this.form.hidden = false;
      this.state.textContent = this.ids.size ? '' : 'no notes yet. be the first.';
    } catch (err) {
      if (!this.ids.size) this.state.textContent = MESSAGES[err.code] || MESSAGES.network;
    } finally {
      this.loading = false;
    }
  }

  renderOlder() {
    this.older?.remove();
    this.older = null;
    if (!this.next) return;
    this.older = el('button', 'st-tab nt-older', 'older notes');
    this.older.type = 'button';
    this.older.addEventListener('click', () => this.load(), { once: true });
    this.list.after(this.older);
  }

  meta(note) {
    const meta = el('div', 'nt-note-meta');
    meta.append(el('b', '', note.owner ? 'skye' : typeof note.name === 'string' && note.name ? note.name : 'anon'));
    if (note.owner) meta.append(el('span', 'nt-note-badge', 'owner'));
    const created = Number(note.createdAt);
    const time = el('time', '', since(created));
    if (created > 0) time.dateTime = new Date(created * 1000).toISOString();
    meta.append(time);
    return meta;
  }

  row(note, fresh = false) {
    this.ids.add(note.id);
    const li = el('li', note.owner ? 'nt-note is-owner' : 'nt-note');
    if (fresh && !still) li.classList.add('is-new');
    const bubble = el('div', 'nt-note-bubble');
    bubble.append(this.meta(note), el('p', 'nt-note-text', String(note.body ?? '')));

    const replies = Array.isArray(note.replies) ? note.replies.filter((r) => r?.id) : [];
    if (replies.length) {
      const list = el('ol', 'nt-replies');
      for (const reply of replies) {
        const item = el('li', reply.owner ? 'nt-reply is-owner' : 'nt-reply');
        item.append(this.meta(reply), el('p', 'nt-note-text', String(reply.body ?? '')));
        list.append(item);
      }
      bubble.append(list);
    }

    li.append(stickerImg(note.sticker, 'nt-note-sticker'), bubble);
    return li;
  }

  prepareVerify() {
    if (this.turnstile) return this.turnstile;
    this.turnstile = new Promise((resolve) => {
      const callback = `__noteTurnstile${Date.now()}`;
      window[callback] = () => {
        delete window[callback];
        resolve(window.turnstile ?? null);
      };
      const script = document.createElement('script');
      script.src = TURNSTILE_SRC + callback;
      script.async = true;
      script.onerror = () => resolve(null);
      document.head.append(script);
    }).then((api) => {
      if (!api) return null;
      this.widget = api.render(this.captcha, {
        sitekey: SITE_KEY,
        action: 'echo-wall',
        theme: 'dark',
        size: 'flexible',
        appearance: 'interaction-only',
        'refresh-expired': 'auto',
        callback: (token) => {
          this.token = token;
          this.waiters.splice(0).forEach((done) => done(token));
        },
        'expired-callback': () => {
          this.token = '';
        },
        'error-callback': () => {
          this.token = '';
          this.waiters.splice(0).forEach((done) => done(''));
        }
      });
      return api;
    });
    return this.turnstile;
  }

  waitToken() {
    if (this.token) return Promise.resolve(this.token);
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
      } catch {}
    }
  }

  async submit(e) {
    e.preventDefault();
    if (this.sending) return;

    const body = tidy(this.body.value);
    const name = tidy(this.name.value);
    if (!body || length(body) > BODY_MAX) return this.say(MESSAGES.invalid_body, 'error');
    if (length(name) > NAME_MAX) return this.say(MESSAGES.invalid_name, 'error');

    this.sending = true;
    this.submitButton.disabled = true;
    try {
      this.say('verifying…');
      const api = await this.prepareVerify();
      const token = api ? await this.waitToken() : '';
      if (!token) throw fail('verification_failed');

      this.say('sending…');
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ topic: this.topic, body, name, sticker: this.sticker, token, website: this.trap.value }),
        cache: 'no-store',
        credentials: 'omit',
        referrerPolicy: 'no-referrer'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.note?.id) throw fail(data?.error || 'network');
      if (data.note.topic !== this.topic) throw fail('topic_not_found');

      write(NAME_KEY, name);
      this.body.value = '';
      this.updateCount();
      this.list.prepend(this.row(data.note, true));
      this.state.textContent = '';
      this.say('saved. thank you for leaving a trace.', 'ok');
    } catch (err) {
      this.say(MESSAGES[err.code] || MESSAGES.network, 'error');
    } finally {
      this.sending = false;
      this.submitButton.disabled = false;
      this.resetVerify();
    }
  }
}
