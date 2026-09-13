import { Music, sfx } from './audio.js?v=8';
import { fragments } from './fragments.js?v=9';
import { Backdrop } from './backdrop.js?v=5';
import { CrystalField } from './crystal.js?v=16';
import { ScrollDriver } from './scroll.js?v=5';

const $ = (id) => document.getElementById(id);

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
scrollTo(0, 0);

const music = new Music($('trackA'));
const backdrop = new Backdrop();

const glassReady = import('./glass.js?v=17')
  .then(({ Glass }) => new Glass({
    canvas: $('glass'),
    videos: [...document.querySelectorAll('.ab-panel-bg video')]
  }))
  .catch(() => null);

function withGlass(fn) {
  glassReady.then((glass) => {
    if (!glass) return;
    try {
      fn(glass);
    } catch (_) {}
  });
}

const field = new CrystalField({
  stage: $('shards'),
  section: $('field'),
  panel: $('panel'),
  intro: $('fieldIntro'),
  onBuild: (layout) => withGlass((glass) => glass.start(layout.entries)),
  onHover: (frag) => sfx.play(frag.glow, 0.22),
  onSelect: (frag) => sfx.play(frag.sound, 0.42),
  onClear: () => {}
});

let shattered = false;

function shatter() {
  if (shattered) return;
  shattered = true;
  document.body.dataset.shattered = 'true';
  field.reveal();
  withGlass((glass) => glass.reveal());
}

new IntersectionObserver(
  ([entry]) => withGlass((glass) => glass.setActive(entry.isIntersecting)),
  { rootMargin: '25% 0px' }
).observe($('field'));

document.addEventListener('visibilitychange', () => backdrop.sleep(document.hidden));

const scroll = new ScrollDriver({
  onStage: (name) => {
    backdrop.setStage(name);
    music.duck(name === 'fragments');
    if (name === 'fragments') shatter();
    else field.clear();
  },
  onDescend: () => backdrop.update(),
  onReveal: (name) => {
    if (name === 'fragments') shatter();
  }
});

const toggle = $('audioToggle');
toggle.setAttribute('aria-pressed', String(!music.muted));
toggle.addEventListener('click', () => {
  const muted = music.toggleMuted();
  toggle.setAttribute('aria-pressed', String(!muted));
});

const GESTURES = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
let warmed = false;

function openSound() {
  if (!warmed) {
    warmed = true;
    sfx.warm(fragments.flatMap((frag) => [frag.sound, frag.glow]));
  }
  music.unlock();
}

for (const type of GESTURES) {
  addEventListener(type, openSound, { passive: true });
}

backdrop.prime();
scroll.begin();
music.start();
