const PREF_KEY = 'skye-about:sound';
const FADE_IN_MS = 2400;
const FADE_OUT_MS = 700;

function readPref() {
  try {
    return localStorage.getItem(PREF_KEY);
  } catch {
    return null;
  }
}

function savePref(value) {
  try {
    localStorage.setItem(PREF_KEY, value);
  } catch {}
}

export async function startSound(button) {
  if (!button) return;
  const label = button.querySelector('[data-sound-state]');

  let config;
  try {
    config = await (await fetch(new URL('../../data/playlist.json?v=2', import.meta.url))).json();
  } catch {
    button.hidden = true;
    return;
  }

  const tracks = (config.tracks || []).filter((t) => typeof t.src === 'string' && t.src.startsWith('/') && typeof t.title === 'string');
  if (!tracks.length) {
    button.hidden = true;
    return;
  }

  const target = Math.min(1, Math.max(0, Number(config.volume) || 0.2));
  const audio = new Audio();
  audio.preload = 'auto';
  audio.loop = tracks.length === 1;
  audio.volume = 0;

  let index = 0;
  let on = false;
  let fading = 0;

  const render = () => {
    button.setAttribute('aria-pressed', String(on));
    label.textContent = on ? tracks[index].title : 'sound off';
    button.title = on ? 'turn the music off' : 'turn the music on';
  };

  const fade = (to, ms, done) => {
    cancelAnimationFrame(fading);
    const from = audio.volume;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / ms);
      try {
        audio.volume = from + (to - from) * t;
      } catch {}
      if (t < 1) fading = requestAnimationFrame(step);
      else done?.();
    };
    fading = requestAnimationFrame(step);
  };

  const load = (i) => {
    index = (i + tracks.length) % tracks.length;
    audio.src = tracks[index].src;
  };

  const play = async () => {
    if (!audio.src) load(index);
    try {
      await audio.play();
      on = true;
      fade(target, FADE_IN_MS);
    } catch {
      on = false;
    }
    render();
  };

  const stop = () => {
    on = false;
    render();
    fade(0, FADE_OUT_MS, () => audio.pause());
  };

  audio.addEventListener('ended', () => {
    if (audio.loop) return;
    load(index + 1);
    if (on) play();
  });

  audio.addEventListener('error', () => {
    if (!on || tracks.length === 1) return;
    load(index + 1);
    play();
  });

  button.addEventListener('click', () => {
    if (on) {
      savePref('off');
      stop();
    } else {
      savePref('on');
      play();
    }
  });

  render();

  if (readPref() === 'off') return;
  await play();
  if (on) return;
  const first = (event) => {
    if (event.target instanceof Element && event.target.closest('[data-sound]')) return;
    removeEventListener('pointerdown', first);
    removeEventListener('keydown', first);
    if (!on) play();
  };
  addEventListener('pointerdown', first);
  addEventListener('keydown', first);
}
