const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const MODULES = {
  cube: () => import('./cube.js?v=3'),
  kepler90: () => import('./lightcurve.js?v=4').then((m) => ({ mount: m.mountOverview })),
  fold: () => import('./lightcurve.js?v=4').then((m) => ({ mount: m.mountFold })),
  sonify: () => import('./sonify.js?v=3'),
  topology: () => import('./topology.js?v=3'),
  starmap: () => import('./starmap.js?v=2'),
  periodogram: () => import('./periodogram.js?v=4')
};

function boot() {
  const overlay = $('#dgBoot');
  if (!overlay) return;
  const done = () => overlay.classList.add('is-done');
  if (still) {
    done();
    return;
  }
  const timer = setTimeout(done, 1200);
  overlay.addEventListener('click', () => {
    clearTimeout(timer);
    done();
  }, { once: true });
}

function backgroundVideo() {
  const video = $('#dgVideo');
  if (!video) return;
  const saveData = navigator.connection?.saveData === true;
  if (still || saveData) {
    video.removeAttribute('autoplay');
    video.pause();
    if (saveData) {
      video.querySelectorAll('source').forEach((source) => source.remove());
      video.load();
    }
    return;
  }
  const play = () => video.play().catch(() => {});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else play();
  });
  play();
}

function player() {
  const host = document.getElementById('dgPlayer');
  if (!host) return;
  import('./player.js?v=4')
    .then((module) => module.mount(host))
    .catch(() => host.remove());
}

function clock() {
  const el = $('#dgClock');
  if (!el) return;
  const format = new Intl.DateTimeFormat('es', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  });
  const tick = () => {
    el.textContent = format.format(new Date());
  };
  tick();
  setInterval(tick, 1000);
}

function progress() {
  const bar = $('#dgProgress');
  const text = $('#dgProgressText');
  if (!bar) return;
  let queued = false;
  const update = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    bar.style.setProperty('--p', ratio.toFixed(4));
    text.textContent = String(Math.round(ratio * 100)).padStart(3, '0');
  };
  addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }, { passive: true });
  addEventListener('resize', update);
  update();
}

function rail() {
  const nav = $('#dgRail');
  const toggle = $('#dgRailToggle');
  const hudSection = $('#dgHudSection');
  const links = new Map($$('a', nav).map((a) => [a.getAttribute('href').slice(1), a]));

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const id = entry.target.id;
      for (const [key, link] of links) {
        if (key === id) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
      if (hudSection) hudSection.textContent = entry.target.dataset.section;
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('[data-section]').forEach((section) => observer.observe(section));
}

const spaced = (value, decimals) => {
  const [whole, fraction] = value.toFixed(decimals).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return fraction ? `${grouped}.${fraction}` : grouped;
};

function counters() {
  const run = (el) => {
    const target = Number(el.dataset.count);
    const decimals = Number(el.dataset.decimals || 0);
    if (still) {
      el.textContent = spaced(target, decimals);
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / 1800);
      el.textContent = spaced(target * (1 - (1 - t) ** 4), decimals);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      run(entry.target);
    }
  }, { threshold: 0.4 });
  $$('[data-count]').forEach((el) => observer.observe(el));
}

function reveal() {
  if (still) return;
  const targets = $$('.dg-head, .dg-aside, .dg-paper, .dg-figure, .dg-quote, .dg-voice, .dg-tool');
  targets.forEach((el) => el.classList.add('dg-reveal'));
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      entry.target.classList.add('is-in');
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  targets.forEach((el) => observer.observe(el));
}

function lazyModules() {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      const load = MODULES[entry.target.dataset.module];
      load?.()
        .then((module) => module.mount(entry.target))
        .catch(() => {
          const figure = entry.target.closest('.dg-figure') || entry.target;
          const readout = figure.querySelector('[data-role="readout"]');
          if (readout) readout.textContent = 'esta figura no pudo cargar, prueba recargando la página';
        });
    }
  }, { rootMargin: '400px 0px' });
  $$('[data-module]').forEach((el) => observer.observe(el));
}

boot();
backgroundVideo();
clock();
player();
progress();
rail();
counters();
reveal();
lazyModules();
