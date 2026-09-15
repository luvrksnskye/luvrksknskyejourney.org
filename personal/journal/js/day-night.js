import { currentTime, subscribe, themeFromHour, wantsMessages } from './journal-time.js?v=1';

const SCENE_FADE_MS = 1200;
const MESSAGE_MS = 3000;
const MESSAGES = { day: 'Good morning!', night: "It's night time!" };

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const scenes = {
  day: { layer: document.getElementById('mainBackground'), video: document.getElementById('mainVideo') },
  night: { layer: document.getElementById('secondBackground'), video: document.getElementById('secondVideo') },
};
const splash = { layer: document.getElementById('transitionVideo'), video: document.getElementById('transition') };
const overlay = document.getElementById('messageOverlay');
const messageText = document.getElementById('transitionMessage');

let current = null;
let busy = false;
let messageTimer = 0;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const playQuietly = (video) => video?.play?.().catch(() => {});

function showScene(theme) {
  for (const [name, scene] of Object.entries(scenes)) {
    const active = name === theme;
    scene.layer?.classList.remove('is-under');
    scene.layer?.classList.toggle('is-active', active);
    if (active) playQuietly(scene.video);
    else scene.video?.pause();
  }
  current = theme;
  document.body.dataset.scene = theme;
}

function announce(theme) {
  if (!wantsMessages() || !overlay || !messageText) return;
  clearTimeout(messageTimer);
  messageText.textContent = MESSAGES[theme];
  messageText.style.animation = 'none';
  void messageText.offsetWidth;
  messageText.style.animation = '';
  overlay.classList.remove('visible');
  overlay.style.opacity = '0';
  overlay.style.display = 'flex';
  requestAnimationFrame(() => overlay.classList.add('visible'));
  messageTimer = setTimeout(() => {
    overlay.classList.remove('visible');
    messageTimer = setTimeout(() => { overlay.style.display = 'none'; }, 500);
  }, MESSAGE_MS);
}

function splashIsUsable() {
  const video = splash.video;
  return Boolean(video && splash.layer && !reducedMotion.matches && !video.error && video.readyState >= 1);
}

function splashDuration() {
  const d = splash.video?.duration;
  return Number.isFinite(d) && d > 0 ? d * 1000 : 0;
}

function playSplash() {
  return new Promise((resolve) => {
    const video = splash.video;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      video.removeEventListener('ended', finish);
      video.removeEventListener('error', finish);
      resolve();
    };
    video.addEventListener('ended', finish);
    video.addEventListener('error', finish);
    setTimeout(finish, Math.min(splashDuration() + 400 || 4000, 6000));
    try { video.currentTime = 0; } catch {}
    splash.layer.classList.add('is-playing');
    video.play().catch(finish);
  });
}

async function transitionTo(theme) {
  busy = true;
  const from = scenes[current];
  const to = scenes[theme];

  announce(theme);
  playQuietly(to.video);

  let splashDone = Promise.resolve();
  if (splashIsUsable()) {
    splashDone = playSplash();
    const duration = splashDuration();
    await wait(duration ? Math.max(0, duration / 2 - SCENE_FADE_MS / 2) : 500);
  }

  from.layer.classList.add('is-under');
  from.layer.classList.remove('is-active');
  to.layer.classList.add('is-active');
  current = theme;
  document.body.dataset.scene = theme;

  await wait(SCENE_FADE_MS);
  from.layer.classList.remove('is-under');
  from.video?.pause();

  await splashDone;
  splash.layer?.classList.remove('is-playing');
  busy = false;
  reconcile();
}

function reconcile() {
  const wanted = themeFromHour(currentTime().hour);
  if (current === null || document.hidden) {
    if (!busy) showScene(wanted);
    return;
  }
  if (busy || wanted === current) return;
  transitionTo(wanted);
}

subscribe(reconcile);
document.addEventListener('visibilitychange', () => {
  if (document.hidden || !current) return;
  playQuietly(scenes[current].video);
  reconcile();
});
reconcile();
