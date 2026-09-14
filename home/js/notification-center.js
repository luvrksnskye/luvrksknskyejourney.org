const KEY_LIST = 'skye.notifications';
const KEY_SEEDED = 'skye.notifications.seededV2';

const ICON_BASE = '/assets/images/icons/ui/';

const TOAST_LIFETIME_MS = 6500;
const TOAST_STAGGER_MS = 1600;

const SEEDS = [
  {
    id: 'welcome-v1',
    tag: 'welcome',
    tagLabel: 'welcome',
    icon: 'Handbook_Adventurer.png',
    title: '✦ Welcome to Skye Journey!',
    hint: 'A little guide from Skye, tap to read',
    body: `<p>Hi, wanderer! I'm <b>Skye</b> (she/they) - a smol artist and dev who built this little home on the web. Make yourself comfortable, this place is yours to explore too.</p>
<ul class="notif-list-lines">
  <li>Use the <b>Filesystem</b> nav on the left for the public rooms - about, blog, changelog, resources.</li>
  <li>The <b>Personal</b> section is the softer half - journal, friends, safe space, guestbook.</li>
  <li>Some pages autoplay <b>sound</b>; allow audio in your browser for the full feel.</li>
  <li>If anything looks broken after an update, hit <b>CTRL+F5</b> to bust your cache.</li>
  <li>Intended viewing size is <b>1080px on desktop</b>. Mobile is best-effort. iOS autoplay is quirky.</li>
  <li>Some of the assets are mine, so pleasecheck the <b>Credits</b> room.</li>
</ul>
<p>This site is a work in progress, always. Thanks for being here. ✦</p>`,
    date: new Date().toISOString(),
    read: false,
  },
  {
    id: 'update-v2-4',
    tag: 'update',
    tagLabel: 'update',
    icon: 'UI_Icon_Intee_DailyEvent_0.png',
    title: '✦ v2.4 — big cleanup pass',
    hint: 'Everything inside got tidier',
    body: `<p>The site's internals got a <b>massive tidy-up</b>. Nothing looks different, but everything is lighter and less broken.</p>
<ul class="notif-list-lines">
  <li>~470 files renamed to kebab-case, no more weird spaces.</li>
  <li>jQuery is out; the music player and planner are vanilla now.</li>
  <li>Fonts and CSS tokens live in one shared place.</li>
  <li>Fixed a pile of dead links and broken onclicks.</li>
</ul>
<p>Full story lives in the <b>changelog</b> if you're curious.</p>`,
    date: '2026-09-09T14:50:00Z',
    read: false,
  },
  {
    id: 'tip-journal-clock',
    tag: 'tip',
    tagLabel: 'tip',
    icon: 'UI_BtnIcon_Handbook.png',
    title: '✦ Little tip — the Journal clock',
    hint: 'Drag the hour, jump to a scene',
    body: `<p>Head to <b>Personal → Journal</b> for the diary entries and the clock timer. You can drag the golden hour hand to change the time of day, or hit one of the four icons on the dial to jump to <b>morning / noon / dusk / night</b>. Whatever you pick sets the background scene too.</p>`,
    date: '2026-09-09T15:00:00Z',
    read: false,
  },
];

function load() {
  try {
    const raw = localStorage.getItem(KEY_LIST);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch { return null; }
}

function save(list) {
  try { localStorage.setItem(KEY_LIST, JSON.stringify(list)); } catch {}
}

function seedIfEmpty() {
  const existing = load();
  const seeded = localStorage.getItem(KEY_SEEDED);
  if (seeded && existing) return { list: existing, freshSeeds: [] };
  const list = [...SEEDS];
  save(list);
  try { localStorage.setItem(KEY_SEEDED, '1'); } catch {}
  return { list, freshSeeds: SEEDS };
}

const SFX_COOLDOWN_MS = 3500;
let lastSfxAt = 0;

const SFX = {
  play() {
    const now = Date.now();
    if (now - lastSfxAt < SFX_COOLDOWN_MS) return;
    const el = document.getElementById('notif-sfx');
    if (!el) return;
    try { el.pause(); el.currentTime = 0; el.play().catch(() => {}); lastSfxAt = now; } catch {}
  },
};

function formatRelative(iso) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

function makeToast(n) {
  const toast = document.createElement('div');
  toast.className = 'notif-toast';
  toast.dataset.id = n.id;
  toast.setAttribute('role', 'status');

  const icon = document.createElement('div');
  icon.className = 'toast-icon';
  const img = document.createElement('img');
  img.src = `${ICON_BASE}${n.icon}`;
  img.alt = '';
  icon.appendChild(img);

  const text = document.createElement('div');
  text.className = 'toast-text';
  const title = document.createElement('div');
  title.className = 'toast-title';
  title.textContent = n.title;
  const hint = document.createElement('div');
  hint.className = 'toast-hint';
  hint.textContent = n.hint || 'tap to read';
  text.appendChild(title);
  text.appendChild(hint);

  const progress = document.createElement('div');
  progress.className = 'toast-progress';
  progress.style.animationDuration = `${TOAST_LIFETIME_MS}ms`;

  toast.appendChild(icon);
  toast.appendChild(text);
  toast.appendChild(progress);
  return toast;
}

function showToast(n, { onClick } = {}) {
  const stack = document.getElementById('notif-toasts');
  if (!stack) return;
  const toast = makeToast(n);
  stack.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('is-in'));
  });

  SFX.play();

  const dismiss = () => {
    toast.classList.remove('is-in');
    toast.classList.add('is-out');
    setTimeout(() => toast.remove(), 600);
  };

  const timer = setTimeout(dismiss, TOAST_LIFETIME_MS);

  toast.addEventListener('click', () => {
    clearTimeout(timer);
    dismiss();
    onClick?.(n);
  });
}

function renderCard(n) {
  const card = document.createElement('div');
  card.className = `notif-card${n.read ? '' : ' unread'}`;
  card.dataset.id = n.id;
  card.setAttribute('role', 'button');
  card.tabIndex = 0;

  const iconWrap = document.createElement('div');
  iconWrap.className = 'notif-icon';
  const img = document.createElement('img');
  img.src = `${ICON_BASE}${n.icon}`;
  img.alt = '';
  img.loading = 'lazy';
  iconWrap.appendChild(img);

  const text = document.createElement('div');
  text.className = 'notif-text';

  const title = document.createElement('div');
  title.className = 'notif-title';
  title.textContent = n.title;

  const body = document.createElement('div');
  body.className = 'notif-body';
  body.innerHTML = n.body;

  const meta = document.createElement('div');
  meta.className = 'notif-meta';
  const tag = document.createElement('span');
  tag.className = `notif-tag tag-${n.tag || 'update'}`;
  tag.textContent = n.tagLabel || n.tag || 'note';
  const date = document.createElement('span');
  date.className = 'notif-date';
  date.textContent = formatRelative(n.date);
  meta.appendChild(tag);
  meta.appendChild(date);

  text.appendChild(title);
  text.appendChild(body);
  text.appendChild(meta);

  const dismiss = document.createElement('button');
  dismiss.className = 'notif-dismiss';
  dismiss.type = 'button';
  dismiss.setAttribute('aria-label', 'Dismiss notification');
  dismiss.textContent = '×';

  card.appendChild(iconWrap);
  card.appendChild(text);
  card.appendChild(dismiss);

  return card;
}

function renderPanelList(list, mount) {
  mount.innerHTML = '';
  if (!list.length) {
    const empty = document.createElement('div');
    empty.className = 'notif-empty';
    empty.textContent = 'no notifications ✦ all caught up';
    mount.appendChild(empty);
    return;
  }
  const ordered = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
  ordered.forEach((n) => mount.appendChild(renderCard(n)));
}

function updateSummary(summary, list) {
  if (!summary) return;
  const dot = summary.querySelector('.dot');
  const badge = summary.querySelector('.badge');
  const preview = summary.querySelector('.preview');
  const unread = list.filter((n) => !n.read).length;

  if (dot) {
    dot.classList.toggle('is-empty', unread === 0);
    dot.textContent = String(unread);
  }
  if (badge) {
    badge.classList.toggle('is-empty', unread === 0);
    badge.textContent = unread === 1 ? '1 new' : `${unread} new`;
  }
  if (preview) {
    const latest = [...list].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    preview.textContent = latest ? latest.title.replace(/^\s*[✦✧]\s*/, '') : '';
  }
  summary.classList.toggle('has-unread', unread > 0);
}

function spawnMotes() {
  const layer = document.getElementById('notifMotes');
  if (!layer || layer.childElementCount > 0) return;
  const COUNT = 32;
  for (let i = 0; i < COUNT; i++) {
    const m = document.createElement('span');
    const size = 1.4 + Math.random() * 2.6;
    m.style.width = `${size}px`;
    m.style.height = `${size}px`;
    m.style.left = `${Math.random() * 100}%`;
    m.style.animationDuration = `${12 + Math.random() * 14}s`;
    m.style.animationDelay = `-${Math.random() * 22}s`;
    m.style.setProperty('--drift', `${(Math.random() - 0.5) * 80}px`);
    m.style.setProperty('--peak', `${0.5 + Math.random() * 0.45}`);
    layer.appendChild(m);
  }
}

function openPanel() {
  const panel = document.getElementById('notif-panel');
  const overlay = document.getElementById('notif-panel-overlay');
  const list = load() || [];
  const mount = panel?.querySelector('.notif-panel-list');
  if (mount) renderPanelList(list, mount);
  spawnMotes();
  panel?.classList.add('is-open');
  overlay?.classList.add('is-open');
}

function closePanel() {
  const panel = document.getElementById('notif-panel');
  const overlay = document.getElementById('notif-panel-overlay');
  panel?.classList.remove('is-open');
  overlay?.classList.remove('is-open');
}

function wire(summary) {
  const overlay = document.getElementById('notif-panel-overlay');
  const panel = document.getElementById('notif-panel');
  const closeBtn = panel?.querySelector('.close');
  const markAll = panel?.querySelector('.mark-all');
  const clearAll = panel?.querySelector('.clear-all');
  const listMount = panel?.querySelector('.notif-panel-list');

  summary?.addEventListener('click', openPanel);
  overlay?.addEventListener('click', closePanel);
  closeBtn?.addEventListener('click', closePanel);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel?.classList.contains('is-open')) closePanel();
  });

  listMount?.addEventListener('click', (e) => {
    const card = e.target.closest('.notif-card');
    if (!card) return;
    const id = card.dataset.id;

    if (e.target.closest('.notif-dismiss')) {
      const list = load() || [];
      const next = list.filter((n) => n.id !== id);
      save(next);
      renderPanelList(next, listMount);
      updateSummary(summary, next);
      return;
    }

    card.classList.toggle('expanded');
    if (card.classList.contains('unread')) {
      card.classList.remove('unread');
      const list = load() || [];
      const next = list.map((n) => (n.id === id ? { ...n, read: true } : n));
      save(next);
      updateSummary(summary, next);
    }
  });

  markAll?.addEventListener('click', () => {
    const list = load() || [];
    const next = list.map((n) => ({ ...n, read: true }));
    save(next);
    renderPanelList(next, listMount);
    updateSummary(summary, next);
  });

  clearAll?.addEventListener('click', () => {
    save([]);
    renderPanelList([], listMount);
    updateSummary(summary, []);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const summary = document.getElementById('notif-summary');
  const { list, freshSeeds } = seedIfEmpty();
  updateSummary(summary, list);
  wire(summary);

  freshSeeds.forEach((n, i) => {
    setTimeout(() => showToast(n, { onClick: openPanel }), 1200 + i * TOAST_STAGGER_MS);
  });
});

window.SkyeNotify = function push(n) {
  const list = load() || [];
  const entry = { id: `custom-${Date.now()}`, read: false, date: new Date().toISOString(), ...n };
  const next = [entry, ...list.filter((x) => x.id !== entry.id)];
  save(next);
  const summary = document.getElementById('notif-summary');
  updateSummary(summary, next);
  showToast(entry, { onClick: openPanel });
};
