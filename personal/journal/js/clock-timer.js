import {
  ICON_HOURS,
  currentTime,
  isSynced,
  resetTime,
  segmentFromHour,
  setManualTime,
  setSync,
  subscribe,
} from './journal-time.js?v=1';

const SPIN_MS = 1400;
const SNAP_MS = 380;
const DRAG_THRESHOLD_DEG = 3;

const $ = (id) => document.getElementById(id);

const ui = {
  panel: $('clockPanel'),
  overlay: $('clockOverlay'),
  toggle: $('clockToggle'),
  face: $('clockFace'),
  hourHand: $('clockHourHand'),
  minuteHand: $('clockMinuteHand'),
  particles: $('clockParticles'),
  timeDisplay: $('clockTimeDisplay'),
  subtitle: $('clockSubtitle'),
  syncCheckbox: $('clockSyncCheckbox'),
  resetBtn: $('clockResetBtn'),
  close: document.querySelector('#clockPanel [data-close-clock]'),
  icons: document.querySelectorAll('#clockFace [data-time-icon]'),
  glows: document.querySelectorAll('#clockFace [data-glow]'),
};

let inMotion = false;

const SFX = {
  play(name) {
    document.querySelectorAll('audio[id^="clock-sfx-"]').forEach((a) => {
      if (a.id !== `clock-sfx-${name}`) {
        try { a.pause(); a.currentTime = 0; } catch {}
      }
    });
    const el = $(`clock-sfx-${name}`);
    if (!el) return;
    try {
      el.pause();
      el.currentTime = 0;
      el.play().catch(() => {});
    } catch {}
  },
};

const normalize = (angle) => ((angle % 360) + 360) % 360;
const hourToAngle = (hour, minute = 0) => normalize((hour + minute / 60 - 12) * 15);
const formatTime = (hour, minute) => `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

function angleToTime(angle) {
  const total = (normalize(angle) / 15 + 12) % 24;
  const hour = Math.floor(total);
  return { hour, minute: Math.floor((total - hour) * 60) };
}

const angleToNearestHour = (angle) => Math.round(normalize(angle) / 15 + 12) % 24;

function rotationOf(el) {
  const value = Number(el?.dataset.rot);
  return Number.isFinite(value) ? value : 0;
}

function rotate(el, angle, { animate = false, forward = false, extraTurns = 0 } = {}) {
  if (!el) return;
  const prev = rotationOf(el);
  let delta = ((normalize(angle) - normalize(prev) + 540) % 360) - 180;
  if (forward && delta <= 0) delta += 360;
  const next = prev + delta + extraTurns * 360;
  el.classList.toggle('is-animating', animate);
  el.dataset.rot = String(next);
  el.style.setProperty('--rot', `${next}deg`);
}

function setRotationRaw(el, angle) {
  el.dataset.rot = String(angle);
  el.style.setProperty('--rot', `${angle}deg`);
}

function ensureSparks(glow) {
  if (glow.dataset.sparksReady) return;
  glow.dataset.sparksReady = '1';
  const SPARKS = 6;
  for (let i = 0; i < SPARKS; i++) {
    const s = document.createElement('span');
    s.className = 'spark';
    s.style.setProperty('--seed', `${(360 / SPARKS) * i}deg`);
    s.style.animationDelay = `${(i / SPARKS) * 3.4}s`;
    glow.appendChild(s);
  }
}

function setGlow(segment) {
  ui.glows.forEach((glow) => {
    const active = glow.dataset.glow === segment;
    glow.classList.toggle('is-active', active);
    if (active) ensureSparks(glow);
  });
}

function paintTime({ hour, minute }, { animate = false } = {}) {
  rotate(ui.hourHand, hourToAngle(hour, minute), { animate });
  rotate(ui.minuteHand, minute * 6, { animate, forward: !animate });
  if (ui.timeDisplay) ui.timeDisplay.textContent = formatTime(hour, minute);
  setGlow(segmentFromHour(hour));
}

function paintMode() {
  if (ui.subtitle) ui.subtitle.textContent = isSynced() ? 'following your local time' : 'manual, set by hand';
  if (ui.syncCheckbox) ui.syncCheckbox.checked = isSynced();
}

function burstParticles(count = 26) {
  if (!ui.particles || !ui.face) return;
  const radius = ui.face.offsetWidth * 0.3;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const dist = radius + Math.random() * radius * 0.6;
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    p.style.animationDelay = `${Math.random() * 0.15}s`;
    p.style.width = p.style.height = `${4 + Math.random() * 4}px`;
    ui.particles.appendChild(p);
    setTimeout(() => p.remove(), 1600);
  }
}

function land() {
  ui.face?.classList.add('is-landing');
  setTimeout(() => ui.face?.classList.remove('is-landing'), 1000);
  burstParticles();
  SFX.play('land');
}

function settle(hour) {
  ui.hourHand?.classList.remove('is-animating');
  ui.minuteHand?.classList.remove('is-animating');
  inMotion = false;
  setManualTime(hour, 0);
  land();
}

function spinTo(segment) {
  if (inMotion || !(segment in ICON_HOURS)) return;
  const hour = ICON_HOURS[segment];
  inMotion = true;
  rotate(ui.hourHand, hourToAngle(hour), { animate: true, forward: true, extraTurns: 2 });
  rotate(ui.minuteHand, 0, { animate: true, forward: true });
  if (ui.subtitle) ui.subtitle.textContent = 'moving...';
  if (ui.timeDisplay) ui.timeDisplay.textContent = formatTime(hour, 0);
  setGlow(segmentFromHour(hour));
  SFX.play('tick-spin');
  setTimeout(() => settle(hour), SPIN_MS);
}

function setupIcons() {
  ui.icons.forEach((icon) => {
    icon.addEventListener('click', () => spinTo(icon.dataset.timeIcon));
  });
}

function setupDrag() {
  const hand = ui.hourHand;
  if (!hand || !ui.face) return;

  let pointerId = null;
  let center = { x: 0, y: 0 };
  let lastPointer = 0;
  let startHand = 0;
  let angle = 0;
  let moved = false;

  const pointerAngle = (e) => (Math.atan2(e.clientY - center.y, e.clientX - center.x) * 180) / Math.PI + 90;

  hand.addEventListener('pointerdown', (e) => {
    if (inMotion || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const rect = ui.face.getBoundingClientRect();
    center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    pointerId = e.pointerId;
    inMotion = true;
    moved = false;
    startHand = rotationOf(hand);
    lastPointer = pointerAngle(e);
    angle = startHand;
    hand.classList.remove('is-animating');
    hand.classList.add('is-dragging');
    hand.setPointerCapture(pointerId);
    SFX.play('tick');
    e.preventDefault();
  });

  hand.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pointerId) return;
    const raw = pointerAngle(e);
    angle += ((raw - lastPointer + 540) % 360) - 180;
    lastPointer = raw;
    if (Math.abs(angle - startHand) > DRAG_THRESHOLD_DEG) moved = true;
    setRotationRaw(hand, angle);
    const time = angleToTime(angle);
    rotate(ui.minuteHand, time.minute * 6);
    if (ui.timeDisplay) ui.timeDisplay.textContent = formatTime(time.hour, time.minute);
    setGlow(segmentFromHour(time.hour));
  });

  const release = (e) => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    hand.classList.remove('is-dragging');
    if (!moved) {
      inMotion = false;
      paintTime(currentTime(), { animate: true });
      paintMode();
      return;
    }
    const hour = angleToNearestHour(angle);
    rotate(hand, hourToAngle(hour), { animate: true });
    rotate(ui.minuteHand, 0, { animate: true });
    if (ui.timeDisplay) ui.timeDisplay.textContent = formatTime(hour, 0);
    setGlow(segmentFromHour(hour));
    setTimeout(() => settle(hour), SNAP_MS);
  };

  hand.addEventListener('pointerup', release);
  hand.addEventListener('pointercancel', release);
}

function setupKeyboard() {
  ui.hourHand?.addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (!step || inMotion) return;
    e.preventDefault();
    const { hour } = currentTime();
    setManualTime(hour + step, 0);
    SFX.play('tick');
  });
}

function openPanel() {
  ui.panel?.classList.add('is-open');
  ui.overlay?.classList.add('is-open');
  paintTime(currentTime());
  paintMode();
  SFX.play('open');
  ui.close?.focus({ preventScroll: true });
}

function closePanel() {
  if (!ui.panel?.classList.contains('is-open')) return;
  ui.panel.classList.remove('is-open');
  ui.overlay?.classList.remove('is-open');
  SFX.play('close');
  ui.toggle?.focus({ preventScroll: true });
}

function setupControls() {
  ui.toggle?.addEventListener('click', openPanel);
  ui.overlay?.addEventListener('click', closePanel);
  ui.close?.addEventListener('click', closePanel);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });
  ui.syncCheckbox?.addEventListener('change', () => {
    if (inMotion) {
      ui.syncCheckbox.checked = isSynced();
      return;
    }
    setSync(ui.syncCheckbox.checked);
    SFX.play('tick');
  });
  ui.resetBtn?.addEventListener('click', () => {
    if (inMotion) return;
    resetTime();
    SFX.play('tick');
  });
}

function spawnAmbientParticles() {
  const layer = $('clockAmbient');
  if (!layer || layer.childElementCount > 0) return;
  const COUNT = 26;
  for (let i = 0; i < COUNT; i++) {
    const p = document.createElement('span');
    p.className = 'ambient-particle';
    const size = 1.4 + Math.random() * 2.4;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDuration = `${11 + Math.random() * 12}s`;
    p.style.animationDelay = `-${Math.random() * 20}s`;
    p.style.setProperty('--drift', `${(Math.random() - 0.5) * 60}px`);
    p.style.setProperty('--peak', `${0.55 + Math.random() * 0.4}`);
    layer.appendChild(p);
  }
}

function init() {
  if (!ui.panel) return;
  paintTime(currentTime());
  paintMode();
  setupIcons();
  setupDrag();
  setupKeyboard();
  setupControls();
  spawnAmbientParticles();
  subscribe((time) => {
    if (inMotion) return;
    paintTime(time, { animate: time.source !== 'tick' });
    paintMode();
  });
}

init();
