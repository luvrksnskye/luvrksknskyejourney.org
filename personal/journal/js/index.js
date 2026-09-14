const pageFlipSound = new Audio('/assets/audio/sfx/sound-effect.mp3');
const diaryFrame = document.getElementById('diaryFrame');

function loadPage(url) {
  pageFlipSound.currentTime = 0;
  pageFlipSound.play().catch(() => {});
  if (!diaryFrame) return;
  diaryFrame.style.opacity = '0';
  setTimeout(() => {
    diaryFrame.src = url;
    diaryFrame.style.opacity = '1';
  }, 300);
}

document.querySelectorAll('a[data-diary-entry]').forEach((a) => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    loadPage(a.getAttribute('href'));
  });
});

diaryFrame?.addEventListener('load', () => {
  diaryFrame.style.opacity = '1';
});

function updateClock() {
  const el = document.getElementById('digital-clock');
  if (!el) return;
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  el.textContent = `${h}:${m}:${s}`;
}

setInterval(updateClock, 1000);
updateClock();


const BOOKMARKS_KEY = 'diary.bookmarks';

function loadBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch { return new Set(); }
}

function saveBookmarks(set) {
  try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...set])); } catch {}
}

function entryHref(entry) {
  return entry.querySelector('a[data-diary-entry]')?.getAttribute('href') || '';
}

function entryHaystack(entry) {
  const a = entry.querySelector('a[data-diary-entry]');
  const title = (entry.dataset.title || '').toLowerCase();
  const text = (a?.textContent || '').toLowerCase();
  return `${title} ${text}`;
}

function applyMemoFilter({ query, favOnly, category, bookmarks }) {
  const memo = document.getElementById('memo');
  if (!memo) return 0;
  const q = query.trim().toLowerCase();
  let visible = 0;
  memo.querySelectorAll('.month').forEach((month) => {
    let shown = 0;
    month.querySelectorAll('.entry').forEach((entry) => {
      const href = entryHref(entry);
      const isFav = bookmarks.has(href);
      const entryCat = entry.dataset.category || '';
      const catOk = !category || category === 'all' || entryCat === category;
      const matches = !q || entryHaystack(entry).includes(q);
      const passesFav = !favOnly || isFav;
      const show = catOk && matches && passesFav;
      entry.classList.toggle('is-hidden', !show);
      if (show) shown++;
    });
    month.classList.toggle('is-hidden', shown === 0);
    visible += shown;
  });
  const empty = document.getElementById('memoEmpty');
  if (empty) empty.hidden = visible > 0;
  return visible;
}

function moveChipSlider(activeChip) {
  const slider = document.querySelector('.journal-search .chip-slider');
  if (!slider || !activeChip) return;
  const parent = slider.parentElement;
  const chipRect = activeChip.getBoundingClientRect();
  const parentRect = parent.getBoundingClientRect();
  const x = chipRect.left - parentRect.left;
  slider.style.width = `${chipRect.width}px`;
  slider.style.transform = `translateX(${x}px)`;
  slider.classList.add('is-ready');
}

function burstEntry(entry) {
  entry.classList.remove('is-bursting');
  void entry.offsetWidth;
  entry.classList.add('is-bursting');
  setTimeout(() => entry.classList.remove('is-bursting'), 750);
}


function initDiaryTools() {
  const memo = document.getElementById('memo');
  if (!memo) return;
  const search = document.getElementById('entrySearch');
  const favToggle = document.getElementById('favToggle');
  const catChips = document.querySelectorAll('.journal-search .chip.cat');
  const bookmarks = loadBookmarks();
  let activeCategory = 'all';

  const runFilter = () => applyMemoFilter({
    query: search?.value || '',
    favOnly: favToggle?.getAttribute('aria-pressed') === 'true',
    category: activeCategory,
    bookmarks,
  });

  memo.querySelectorAll('.entry').forEach((entry) => {
    const href = entryHref(entry);
    const btn = entry.querySelector('.fav-btn');
    if (!btn) return;
    btn.setAttribute('aria-pressed', bookmarks.has(href) ? 'true' : 'false');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const next = !bookmarks.has(href);
      if (next) bookmarks.add(href);
      else bookmarks.delete(href);
      saveBookmarks(bookmarks);
      btn.setAttribute('aria-pressed', next ? 'true' : 'false');
      if (next) burstEntry(entry);
      runFilter();
    });
  });

  search?.addEventListener('input', runFilter);

  favToggle?.addEventListener('click', () => {
    const next = favToggle.getAttribute('aria-pressed') !== 'true';
    favToggle.setAttribute('aria-pressed', next ? 'true' : 'false');
    runFilter();
  });

  const setActiveChip = (chip) => {
    catChips.forEach((c) => {
      const active = c === chip;
      c.classList.toggle('is-active', active);
      c.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    moveChipSlider(chip);
  };

  catChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      activeCategory = chip.dataset.cat;
      setActiveChip(chip);
      runFilter();
    });
  });

  const initial = document.querySelector('.journal-search .chip.cat.is-active') || catChips[0];
  if (initial) requestAnimationFrame(() => moveChipSlider(initial));
  window.addEventListener('resize', () => {
    const current = document.querySelector('.journal-search .chip.cat.is-active');
    if (current) moveChipSlider(current);
  });
}

initDiaryTools();
