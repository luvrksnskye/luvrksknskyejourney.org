const KEY = 'journal.settings';
const DEFAULTS = Object.freeze({ timeSync: true, overrideHour: 12, overrideMinute: 0, showMessage: true });

export const DAY_START = 6;
export const NIGHT_START = 18;
export const ICON_HOURS = Object.freeze({ morning: 6, noon: 12, dusk: 18, night: 0 });

const wrapHour = (hour) => ((Math.floor(hour) % 24) + 24) % 24;

export function themeFromHour(hour) {
  const h = wrapHour(hour);
  return h >= DAY_START && h < NIGHT_START ? 'day' : 'night';
}

export function segmentFromHour(hour) {
  const h = wrapHour(hour);
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 14) return 'noon';
  if (h >= 14 && h < 20) return 'dusk';
  return 'night';
}

const intIn = (value, min, max, fallback) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
};

function sanitize(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    timeSync: typeof src.timeSync === 'boolean' ? src.timeSync : DEFAULTS.timeSync,
    overrideHour: intIn(src.overrideHour, 0, 23, DEFAULTS.overrideHour),
    overrideMinute: intIn(src.overrideMinute, 0, 59, DEFAULTS.overrideMinute),
    showMessage: typeof src.showMessage === 'boolean' ? src.showMessage : DEFAULTS.showMessage,
  };
}

function load() {
  try {
    return sanitize(JSON.parse(localStorage.getItem(KEY) || '{}'));
  } catch {
    return { ...DEFAULTS };
  }
}

let settings = load();
const listeners = new Set();
let lastStamp = '';

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {}
}

function realTime() {
  const now = new Date();
  return { hour: now.getHours(), minute: now.getMinutes() };
}

export function currentTime() {
  return settings.timeSync ? realTime() : { hour: settings.overrideHour, minute: settings.overrideMinute };
}

export const isSynced = () => settings.timeSync;
export const wantsMessages = () => settings.showMessage;

const stampOf = (time) => `${settings.timeSync}|${time.hour}:${time.minute}`;

function emit(source) {
  const time = currentTime();
  lastStamp = stampOf(time);
  const detail = {
    ...time,
    synced: settings.timeSync,
    theme: themeFromHour(time.hour),
    segment: segmentFromHour(time.hour),
    source,
  };
  listeners.forEach((fn) => fn(detail));
}

function commit(next, source) {
  settings = sanitize(next);
  save();
  emit(source);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setManualTime(hour, minute = 0) {
  commit({ ...settings, timeSync: false, overrideHour: wrapHour(hour), overrideMinute: minute }, 'manual');
}

export function setSync(on) {
  if (on === settings.timeSync) return;
  if (on) {
    commit({ ...settings, timeSync: true }, 'sync');
    return;
  }
  const now = realTime();
  commit({ ...settings, timeSync: false, overrideHour: now.hour, overrideMinute: now.minute }, 'sync');
}

export function resetTime() {
  commit({ ...DEFAULTS }, 'reset');
}

function tick() {
  if (!settings.timeSync) return;
  if (stampOf(realTime()) !== lastStamp) emit('tick');
}

lastStamp = stampOf(currentTime());
setInterval(tick, 1000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) tick();
});
window.addEventListener('storage', (e) => {
  if (e.key !== KEY) return;
  settings = load();
  emit('storage');
});
