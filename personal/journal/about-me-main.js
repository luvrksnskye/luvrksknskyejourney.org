const SETTINGS_KEY = 'journal.settings';
const DEFAULT_SETTINGS = {
  timeSync: true,
  theme: 'day',
  showMessage: true,
};

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

const mainBackground = document.getElementById('mainBackground');
const transitionVideo = document.getElementById('transitionVideo');
const secondBackground = document.getElementById('secondBackground');
const transition = document.getElementById('transition');
const messageOverlay = document.getElementById('messageOverlay');
const transitionMessage = document.getElementById('transitionMessage');

mainBackground.classList.add('background-element');
secondBackground.classList.add('background-element');
transitionVideo.classList.add('transition-video');

secondBackground.style.opacity = 0;
let isFirstBackground = true;
let lastTransitionHour = null;
let isTransitioning = false;
let intervalId = null;

transition.load();

function showMessage(isNight) {
  const settings = loadSettings();
  if (!settings.showMessage) return;

  transitionMessage.textContent = isNight ? "It's night time!" : 'Good morning!';
  messageOverlay.style.opacity = 0;
  messageOverlay.style.display = 'block';
  requestAnimationFrame(() => messageOverlay.classList.add('visible'));

  setTimeout(() => {
    messageOverlay.classList.remove('visible');
    setTimeout(() => { messageOverlay.style.display = 'none'; }, 500);
  }, 3000);
}

function triggerTransition() {
  if (isTransitioning) return;
  isTransitioning = true;

  const switchingToNight = isFirstBackground;
  showMessage(switchingToNight);

  const outBg = switchingToNight ? mainBackground : secondBackground;
  const inBg = switchingToNight ? secondBackground : mainBackground;

  requestAnimationFrame(() => { transitionVideo.style.opacity = 1; });
  setTimeout(() => { outBg.style.opacity = 0; }, 500);

  transition.currentTime = 0;
  transition.play().catch((err) => console.log('Error playing transition:', err));

  transition.onended = () => {
    transitionVideo.style.opacity = 0;
    setTimeout(() => {
      inBg.style.opacity = 1;
      isFirstBackground = !switchingToNight;
      isTransitioning = false;
    }, 500);
  };
}

function applyThemeInstant(theme) {
  const wantDay = theme === 'day';
  mainBackground.style.opacity = wantDay ? 1 : 0;
  secondBackground.style.opacity = wantDay ? 0 : 1;
  isFirstBackground = wantDay;
}

function setTheme(target, { animate = true } = {}) {
  const wantDay = target === 'day';
  if (wantDay === isFirstBackground && !isTransitioning) return;
  if (animate) triggerTransition();
  else applyThemeInstant(target);
}

function checkTime() {
  if (isTransitioning) return;
  const settings = loadSettings();
  if (!settings.timeSync) return;

  const now = new Date();
  const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const hours = estTime.getHours();
  const minutes = estTime.getMinutes();

  if (hours === lastTransitionHour) return;

  if (hours === 7 && minutes === 0 && !isFirstBackground) {
    lastTransitionHour = hours;
    triggerTransition();
  } else if (hours === 19 && minutes === 0 && isFirstBackground) {
    lastTransitionHour = hours;
    triggerTransition();
  }

  if (lastTransitionHour === null) {
    const shouldBeNight = hours >= 19 || hours < 7;
    if (shouldBeNight && isFirstBackground) triggerTransition();
    else if (!shouldBeNight && !isFirstBackground) triggerTransition();
  }
}

function startTimeSync() {
  if (intervalId !== null) return;
  intervalId = setInterval(checkTime, 5000);
  checkTime();
}

function stopTimeSync() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  lastTransitionHour = null;
}

const initial = loadSettings();
if (initial.timeSync) {
  startTimeSync();
} else {
  applyThemeInstant(initial.theme);
}

window.journalTheme = { setTheme, startTimeSync, stopTimeSync, loadSettings };
