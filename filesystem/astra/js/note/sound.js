const KEY = 'skye-note:sound';
const FADE = 1400;

export function mountMusic(button) {
  const src = button?.dataset.music;
  if (!button || !src) return;

  const audio = new Audio(src);
  audio.loop = true;
  audio.preload = 'none';
  audio.volume = 0;

  const label = button.querySelector('[data-music-label]');
  let wanted = localStorage.getItem(KEY) !== 'off';
  let fading = 0;

  const paint = () => {
    button.classList.toggle('is-on', wanted && !audio.paused);
    if (label) label.textContent = wanted ? 'sound off' : 'sound on';
    button.setAttribute('aria-pressed', String(wanted));
  };

  const fade = (to) => {
    cancelAnimationFrame(fading);
    const from = audio.volume;
    const started = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - started) / FADE);
      audio.volume = from + (to - from) * t;
      if (t < 1) fading = requestAnimationFrame(step);
      else if (to === 0) audio.pause();
    };
    fading = requestAnimationFrame(step);
  };

  const play = async () => {
    if (!wanted) return;
    try {
      await audio.play();
      fade(0.22);
    } catch {
      /* the browser wants a gesture first */
    }
    paint();
  };

  const wake = () => {
    play();
    removeEventListener('pointerdown', wake);
    removeEventListener('keydown', wake);
  };

  button.hidden = false;
  button.addEventListener('click', () => {
    wanted = !wanted;
    localStorage.setItem(KEY, wanted ? 'on' : 'off');
    if (wanted) play();
    else fade(0);
    paint();
  });

  addEventListener('pointerdown', wake, { once: true, passive: true });
  addEventListener('keydown', wake, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) audio.pause();
    else play();
  });

  paint();
  play();
}

export function mountLoop(host) {
  const video = host?.querySelector('video');
  if (!video) return;
  const quiet = matchMedia('(prefers-reduced-motion: reduce)');
  const decide = () => {
    if (quiet.matches || document.hidden) video.pause();
    else video.play().catch(() => {});
  };
  quiet.addEventListener('change', decide);
  document.addEventListener('visibilitychange', decide);
  video.addEventListener('loadeddata', () => host.classList.add('is-live'), { once: true });
  decide();
}
