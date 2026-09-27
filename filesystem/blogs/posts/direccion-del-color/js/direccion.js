const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const MODULES = {
  tree: () => import('./figures/tree.js?v=1'),
  compass: () => import('./figures/compass.js?v=1'),
  orange: () => import('./figures/orange.js?v=1'),
  address: () => import('./figures/address.js?v=1'),
  morph: () => import('./figures/morph.js?v=1'),
  page: () => import('./figures/page.js?v=1'),
  value: () => import('./figures/value.js?v=1'),
  shadow: () => import('./figures/shadow.js?v=1'),
  contrast: () => import('./figures/contrast.js?v=1'),
  sky: () => import('./figures/sky.js?v=1'),
  names: () => import('./figures/names.js?v=1'),
  shade: () => import('./figures/shade.js?v=1')
};

function boot() {
  const overlay = $('#ddBoot');
  const title = $('.dd-title');
  const done = () => {
    overlay?.classList.add('is-done');
    title?.classList.add('is-in');
  };
  if (!overlay || still) {
    done();
    return;
  }
  const timer = setTimeout(done, 1100);
  overlay.addEventListener('click', () => {
    clearTimeout(timer);
    done();
  }, { once: true });
}

function title() {
  const heading = $('.dd-title');
  if (!heading) return;
  const words = heading.textContent.trim().split(/\s+/);
  heading.setAttribute('aria-label', words.join(' '));
  heading.replaceChildren(...words.flatMap((word, i) => {
    const span = document.createElement('span');
    span.className = 'dd-word';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = word;
    span.style.transitionDelay = `${180 + i * 110}ms`;
    if (i === words.length - 1) span.style.color = 'var(--sec-ink, currentColor)';
    return i ? [document.createTextNode(' '), span] : [span];
  }));
}

function backgroundVideo() {
  const video = $('#ddVideo');
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
  const play = () => video.play().catch(() => {
    const retry = () => video.play().catch(() => {});
    addEventListener('pointerdown', retry, { once: true, passive: true });
    addEventListener('keydown', retry, { once: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else play();
  });
  play();
}

function player() {
  const host = $('#ddPlayer');
  if (!host) return;
  import('./player.js?v=1')
    .then((module) => module.mount(host))
    .catch(() => host.remove());
}

function accents() {
  for (const section of $$('[data-section]')) {
    if (section.dataset.accent) section.style.setProperty('--sec', section.dataset.accent);
    if (section.dataset.ink) section.style.setProperty('--sec-ink', section.dataset.ink);
  }
  for (const link of $$('#ddRail a[data-accent]')) link.style.setProperty('--c', link.dataset.accent);
}

function progress() {
  const ring = $('#ddProgress');
  const text = $('#ddProgressText');
  if (!ring) return;
  const length = 2 * Math.PI * 15.5;
  ring.style.strokeDasharray = length.toFixed(2);
  let queued = false;
  const update = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    ring.style.strokeDashoffset = (length * (1 - ratio)).toFixed(2);
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
  const nav = $('#ddRail');
  const toggle = $('#ddRailToggle');
  const hudSection = $('#ddHudSection');
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
      const section = entry.target;
      for (const [key, link] of links) {
        if (key === section.id) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
      if (hudSection) hudSection.textContent = section.dataset.section;
      if (section.dataset.accent) document.body.style.setProperty('--accent', section.dataset.accent);
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('[data-section]').forEach((section) => observer.observe(section));
}

const spaced = (value) => String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

function counters() {
  const run = (el) => {
    const target = Number(el.dataset.count);
    if (still) {
      el.textContent = spaced(target);
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / 1700);
      el.textContent = spaced(target * (1 - (1 - t) ** 4));
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
  const targets = $$('.dd-head, .dd-aside, .dd-paper, .dd-figure, .dd-quote, .dd-voice, .dd-epigraph');
  targets.forEach((el) => el.classList.add('dd-reveal'));
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      entry.target.classList.add('is-in');
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  targets.forEach((el) => observer.observe(el));
}

function sky() {
  const video = $('#ddVideo');
  const swatch = $('#ddSky');
  const label = $('#ddSkyText');
  if (!video || !swatch) return;
  const start = () => import('./munsell.js?v=1').then(async (m) => {
    const lut = await m.loadLut();
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 27;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const out = {};
    const read = () => {
      if (document.hidden || video.readyState < 2) return;
      ctx.drawImage(video, 0, 0, 48, 27);
      const { data } = ctx.getImageData(0, 0, 48, 14);
      let a = 0;
      let b = 0;
      let v = 0;
      let r = 0;
      let g = 0;
      let bl = 0;
      let n = 0;
      for (let i = 0; i < data.length; i += 4) {
        m.lookupInto(lut, data[i], data[i + 1], data[i + 2], out);
        if (out.c < 4 || out.h < 55 || out.h > 80) continue;
        a += out.a;
        b += out.b;
        v += out.v;
        r += data[i];
        g += data[i + 1];
        bl += data[i + 2];
        n++;
      }
      if (!n) return;
      a /= n;
      b /= n;
      v /= n;
      const hue = ((Math.atan2(b, a) / m.TAU) * 100 + 100) % 100;
      label.textContent = m.notation(m.snapHue(hue), v, Math.hypot(a, b), 1).replace(/\/(\d+)\.\d$/, '/$1');
      swatch.style.setProperty('--sky', m.rgbToHex(r / n, g / n, bl / n));
    };
    read();
    setInterval(read, 1400);
  }).catch(() => {
    label.textContent = '--';
  });
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 2500 });
  else setTimeout(start, 1200);
}

function lazyModules() {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      const load = MODULES[entry.target.dataset.module];
      load?.()
        .then((module) => module.mount(entry.target))
        .catch((error) => {
          console.error(entry.target.dataset.module, error);
          const figure = entry.target.closest('.dd-figure') || entry.target;
          const readout = figure.querySelector('[data-role="readout"]');
          if (readout) readout.textContent = 'esta figura no pudo cargar, prueba recargando la página';
        });
    }
  }, { rootMargin: '500px 0px' });
  $$('[data-module]').forEach((el) => observer.observe(el));
}

title();
accents();
boot();
backgroundVideo();
player();
progress();
rail();
counters();
reveal();
sky();
lazyModules();
