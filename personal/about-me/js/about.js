import { Music, sfx } from './audio.js?v=9';
import { fragments } from './fragments.js?v=9';
import { Backdrop } from './backdrop.js?v=7';
import { CrystalField } from './crystal.js?v=19';
import { ScrollDriver } from './scroll.js?v=6';
import { motion, sparkle, wipe, spotlight, frame, still } from './fx.js?v=8';
import { boot } from './boot.js?v=8';
import { OrbitMap } from './orbit.js?v=15';
import { StatusBoard } from './status.js?v=21';
import { EchoWall } from './wall.js?v=6';

const $ = (id) => document.getElementById(id);

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
scrollTo(0, 0);

motion();

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

let pointer = { x: 0, y: 0, t: -Infinity };
addEventListener('pointerdown', (e) => {
  pointer = { x: e.clientX, y: e.clientY, t: performance.now() };
}, { passive: true });

function burst(el) {
  if (performance.now() - pointer.t < 700) {
    sparkle(pointer.x, pointer.y);
    return;
  }
  const r = el.getBoundingClientRect();
  sparkle(r.left + r.width / 2, r.top + r.height / 2);
}

const field = new CrystalField({
  stage: $('shards'),
  section: $('field'),
  panel: $('panel'),
  intro: $('fieldIntro'),
  onBuild: (layout) => withGlass((glass) => glass.start(layout.entries)),
  onHover: (frag) => sfx.play(frag.glow, 0.22),
  onSelect: (frag, shard) => {
    sfx.play(frag.sound, 0.42);
    burst(shard);
  },
  onStep: (dir, go) => wipe(dir, go),
  onClear: () => {}
});

const orbit = new OrbitMap({
  host: $('orbit'),
  card: $('nodeCard'),
  onPick: (entry) => {
    sfx.play('crystalselectedsoft', 0.2);
    burst(entry.g);
  }
});

const status = new StatusBoard({
  nowPlaying: $('nowPlaying'),
  rightNow: $('rightNow'),
  stats: $('stats'),
  loves: $('loves')
});

spotlight(document.querySelectorAll('.ab-card, .ab-node-card'));

const frames = [...document.querySelectorAll('.ab-frame')].map((el) => ({ el, view: frame(el) }));

function drawFrames(section) {
  for (const { el, view } of frames) {
    if (section.contains(el)) view.draw();
  }
}

const rail = document.querySelector('.ab-rail');
const railCursor = document.createElement('span');
railCursor.className = 'ab-rail-cursor';
railCursor.setAttribute('aria-hidden', 'true');
rail.append(railCursor);
let railStage = 'arrival';

function moveRailCursor(name = railStage) {
  railStage = name;
  const mark = rail.querySelector(`li[data-stage="${name}"]`);
  if (!mark) return;
  const y = mark.getBoundingClientRect().top - rail.getBoundingClientRect().top + mark.offsetHeight / 2 - 3.5;
  motion().then((gsap) => {
    if (gsap && !still) gsap.to(railCursor, { y, duration: 0.9, ease: 'expo.out', overwrite: true });
    else railCursor.style.transform = `translateY(${y}px)`;
  });
}

addEventListener('resize', () => moveRailCursor());

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

const INTROS = {
  systems: () => {
    orbit.intro();
    drawFrames($('systems'));
  },
  status: () => {
    status.intro();
    drawFrames($('status'));
  }
};

new EchoWall({ host: $('echoWall') });

const scroll = new ScrollDriver({
  onStage: (name) => {
    moveRailCursor(name);
    backdrop.setStage(name);
    music.duck(name === 'fragments');
    if (name === 'fragments') shatter();
    else field.clear();
  },
  onDescend: () => backdrop.update(),
  onReveal: (name) => {
    if (name === 'fragments') shatter();
    INTROS[name]?.();
  }
});

const STAGE_ORDER = [...document.querySelectorAll('.ab-rail-marks li[data-stage]')].map((li) => li.dataset.stage);
let jumping = false;

document.querySelector('.ab-rail-marks').addEventListener('click', (e) => {
  const mark = e.target.closest('li[data-stage]');
  const stage = mark && document.querySelector(`.ab-stage[data-stage="${mark.dataset.stage}"]`);
  if (!stage || jumping || mark.dataset.stage === railStage) return;
  let top = stage.offsetTop;
  if (stage === $('field')) top += (stage.offsetHeight - innerHeight) / 2;
  const dir = STAGE_ORDER.indexOf(mark.dataset.stage) >= STAGE_ORDER.indexOf(railStage) ? 1 : -1;
  jumping = true;
  field.clear();
  wipe(dir, () => scrollTo({ top, behavior: 'instant' })).finally(() => {
    jumping = false;
  });
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

boot($('boot'));
moveRailCursor('arrival');
backdrop.prime();
scroll.begin();
music.start();
