const KEY = 'journal.settings';
const DEFAULTS = { timeSync: true, overrideHour: 12, overrideMinute: 0 };

const ICON_HOURS = { morning: 6, noon: 12, dusk: 18, night: 0 };

const SFX = {
  play: (name) => {
    document.querySelectorAll('audio[id^="clock-sfx-"]').forEach((a) => {
      if (a.id !== `clock-sfx-${name}`) {
        try { a.pause(); a.currentTime = 0; } catch {}
      }
    });
    const el = document.getElementById(`clock-sfx-${name}`);
    if (!el) return;
    try {
      el.pause();
      el.currentTime = 0;
      el.play().catch(() => {});
    } catch {}
  },
};

function load() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(next) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}

function hourToAngle(hour, minute = 0) {
  const total = hour + minute / 60;
  return ((total - 12) * 15 + 360) % 360;
}

function angleToHour(angle) {
  const norm = ((angle % 360) + 360) % 360;
  const total = (norm / 15 + 12) % 24;
  const hour = Math.floor(total);
  const minute = Math.floor((total - hour) * 60);
  return { hour, minute };
}

function iconFromHour(hour) {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 14) return 'noon';
  if (h >= 14 && h < 20) return 'dusk';
  return 'night';
}

function themeFromHour(hour) {
  const h = ((hour % 24) + 24) % 24;
  return h >= 7 && h < 19 ? 'day' : 'night';
}

function formatTime(hour, minute) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

let state = load();

function refs() {
  return {
    panel: document.getElementById('clockPanel'),
    overlay: document.getElementById('clockOverlay'),
    toggle: document.getElementById('clockToggle'),
    face: document.getElementById('clockFace'),
    hourHand: document.getElementById('clockHourHand'),
    minuteHand: document.getElementById('clockMinuteHand'),
    particles: document.getElementById('clockParticles'),
    timeDisplay: document.getElementById('clockTimeDisplay'),
    subtitle: document.getElementById('clockSubtitle'),
    syncCheckbox: document.getElementById('clockSyncCheckbox'),
    resetBtn: document.getElementById('clockResetBtn'),
    close: document.querySelector('#clockPanel [data-close-clock]'),
    icons: document.querySelectorAll('#clockFace [data-time-icon]'),
    glows: document.querySelectorAll('#clockFace [data-glow]'),
  };
}

function getEffectiveTime() {
  if (state.timeSync) {
    const now = new Date();
    return { hour: now.getHours(), minute: now.getMinutes() };
  }
  return { hour: state.overrideHour, minute: state.overrideMinute };
}

function setHourAngle(angle, { animate = false } = {}) {
  const { hourHand } = refs();
  if (!hourHand) return;
  hourHand.classList.toggle('is-animating', animate);
  hourHand.style.setProperty('--rot', `${angle}deg`);
}

function setMinuteAngle(angle, { animate = false } = {}) {
  const { minuteHand } = refs();
  if (!minuteHand) return;
  minuteHand.classList.toggle('is-animating', animate);
  minuteHand.style.setProperty('--rot', `${angle}deg`);
}

function refreshMinute({ animate = false } = {}) {
  const { minute } = getEffectiveTime();
  setMinuteAngle(minute * 6, { animate });
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

function updateIcons(activeIcon) {
  const { glows } = refs();
  glows.forEach((glow) => {
    const active = glow.dataset.glow === activeIcon;
    glow.classList.toggle('is-active', active);
    if (active) ensureSparks(glow);
  });
}

function updateDisplay() {
  const { timeDisplay, subtitle, syncCheckbox } = refs();
  const { hour, minute } = getEffectiveTime();
  if (timeDisplay) timeDisplay.textContent = formatTime(hour, minute);
  if (subtitle) {
    subtitle.textContent = state.timeSync
      ? 'following real time (EST)'
      : 'manual — moved by hand';
  }
  if (syncCheckbox) syncCheckbox.checked = state.timeSync;
  updateIcons(iconFromHour(hour));
}

function burstParticles({ count = 26 } = {}) {
  const { particles, face } = refs();
  if (!particles || !face) return;
  const size = face.getBoundingClientRect().width;
  const radius = size * 0.3;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const dist = radius + Math.random() * radius * 0.6;
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    p.style.animationDelay = `${Math.random() * 0.15}s`;
    p.style.width = p.style.height = `${4 + Math.random() * 4}px`;
    particles.appendChild(p);
    setTimeout(() => p.remove(), 1600);
  }
}

function flashDial() {
  const { face } = refs();
  if (!face) return;
  face.classList.add('is-landing');
  setTimeout(() => face.classList.remove('is-landing'), 1000);
}

function applyTheme() {
  const theme = window.journalTheme;
  if (!theme) return;
  const effective = getEffectiveTime();
  theme.setTheme(themeFromHour(effective.hour), { animate: true });
}

function openPanel() {
  const { panel, overlay } = refs();
  panel?.classList.add('is-open');
  overlay?.classList.add('is-open');
  SFX.play('open');
  const { hour, minute } = getEffectiveTime();
  setHourAngle(hourToAngle(hour, minute), { animate: false });
  refreshMinute();
  updateDisplay();
}

function closePanel() {
  const { panel, overlay } = refs();
  panel?.classList.remove('is-open');
  overlay?.classList.remove('is-open');
  SFX.play('close');
}

function silentTurnOffSync() {
  if (!state.timeSync) return;
  state = { ...state, timeSync: false };
  save(state);
  window.journalTheme?.stopTimeSync();
  const { syncCheckbox } = refs();
  if (syncCheckbox) syncCheckbox.checked = false;
}

function setupIconClicks() {
  const { icons, hourHand } = refs();
  icons.forEach((icon) => {
    icon.addEventListener('click', () => {
      const target = icon.dataset.timeIcon;
      const targetHour = ICON_HOURS[target];
      const current = getEffectiveTime();
      const currentAngle = hourToAngle(current.hour, current.minute);
      const targetAngle = hourToAngle(targetHour, 0);
      let delta = targetAngle - currentAngle;
      if (delta <= 0) delta += 360;
      const finalAngle = currentAngle + delta + 720;

      silentTurnOffSync();

      hourHand.classList.add('is-animating');
      hourHand.style.setProperty('--rot', `${finalAngle}deg`);
      setMinuteAngle(0, { animate: true });
      SFX.play('tick-spin');

      const { subtitle, timeDisplay } = refs();
      if (subtitle) subtitle.textContent = 'moving...';
      if (timeDisplay) timeDisplay.textContent = formatTime(targetHour, 0);

      setTimeout(() => {
        hourHand.classList.remove('is-animating');
        hourHand.style.setProperty('--rot', `${targetAngle}deg`);
        const { minuteHand } = refs();
        minuteHand?.classList.remove('is-animating');
        state = { ...state, overrideHour: targetHour, overrideMinute: 0 };
        save(state);
        updateIcons(iconFromHour(targetHour));
        updateDisplay();
        applyTheme();
        flashDial();
        burstParticles();
        SFX.play('land');
      }, 1400);
    });
  });
}

function setupDrag() {
  const { hourHand, face } = refs();
  if (!hourHand || !face) return;

  let dragging = false;
  let center = { x: 0, y: 0 };
  let startPointerAngle = 0;
  let startHandAngle = 0;
  let currentAngle = 0;

  const rawAngle = (p) => {
    const dx = p.clientX - center.x;
    const dy = p.clientY - center.y;
    return (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  };

  const onDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    dragging = true;
    hourHand.classList.add('is-dragging');
    hourHand.classList.remove('is-animating');
    const rect = face.getBoundingClientRect();
    center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

    const now = getEffectiveTime();
    startHandAngle = hourToAngle(now.hour, now.minute);
    hourHand.style.setProperty('--rot', `${startHandAngle}deg`);

    const p = e.touches ? e.touches[0] : e;
    startPointerAngle = rawAngle(p);
    currentAngle = startHandAngle;

    silentTurnOffSync();
    SFX.play('tick');
    e.preventDefault();
  };

  const onMove = (e) => {
    if (!dragging) return;
    const p = e.touches ? e.touches[0] : e;
    const delta = rawAngle(p) - startPointerAngle;
    currentAngle = startHandAngle + delta;
    hourHand.style.setProperty('--rot', `${currentAngle}deg`);
    const { hour, minute } = angleToHour(currentAngle);
    updateIcons(iconFromHour(hour));
    setMinuteAngle(minute * 6);
    const { timeDisplay } = refs();
    if (timeDisplay) timeDisplay.textContent = formatTime(hour, minute);
    e.preventDefault?.();
  };

  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    hourHand.classList.remove('is-dragging');
    const snapped = angleToHour(currentAngle);
    const snapAngle = hourToAngle(snapped.hour, 0);
    hourHand.classList.add('is-animating');
    hourHand.style.setProperty('--rot', `${snapAngle}deg`);
    setMinuteAngle(0, { animate: true });
    state = { ...state, overrideHour: snapped.hour, overrideMinute: 0 };
    save(state);
    updateIcons(iconFromHour(snapped.hour));
    updateDisplay();
    applyTheme();
    setTimeout(() => {
      hourHand.classList.remove('is-animating');
      const { minuteHand } = refs();
      minuteHand?.classList.remove('is-animating');
      flashDial();
      burstParticles();
      SFX.play('land');
    }, 380);
  };

  hourHand.addEventListener('mousedown', onDown);
  hourHand.addEventListener('touchstart', onDown, { passive: false });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchend', onUp);
}

function setupControls() {
  const { toggle, overlay, close, syncCheckbox, resetBtn } = refs();
  toggle?.addEventListener('click', openPanel);
  overlay?.addEventListener('click', closePanel);
  close?.addEventListener('click', closePanel);

  document.addEventListener('keydown', (e) => {
    const panel = document.getElementById('clockPanel');
    if (e.key === 'Escape' && panel?.classList.contains('is-open')) closePanel();
  });

  syncCheckbox?.addEventListener('change', () => {
    const prev = state.timeSync;
    state = { ...state, timeSync: syncCheckbox.checked };
    save(state);
    if (state.timeSync && !prev) window.journalTheme?.startTimeSync();
    else if (!state.timeSync && prev) window.journalTheme?.stopTimeSync();
    const { hour, minute } = getEffectiveTime();
    setHourAngle(hourToAngle(hour, minute), { animate: true });
    updateDisplay();
    if (!state.timeSync) applyTheme();
    SFX.play('tick');
  });

  resetBtn?.addEventListener('click', () => {
    state = { ...DEFAULTS };
    save(state);
    window.journalTheme?.startTimeSync();
    const { hour, minute } = getEffectiveTime();
    setHourAngle(hourToAngle(hour, minute), { animate: true });
    updateDisplay();
    SFX.play('tick');
  });
}

function startMinuteTicker() {
  setInterval(() => {
    refreshMinute();
    if (state.timeSync) updateDisplay();
  }, 30000);
}

function spawnAmbientParticles() {
  const layer = document.getElementById('clockAmbient');
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

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('clockPanel')) return;

  const { hour, minute } = getEffectiveTime();
  setHourAngle(hourToAngle(hour, minute), { animate: false });
  refreshMinute();
  updateDisplay();

  setupIconClicks();
  setupDrag();
  setupControls();
  startMinuteTicker();
  spawnAmbientParticles();

  if (!state.timeSync) applyTheme();
});
