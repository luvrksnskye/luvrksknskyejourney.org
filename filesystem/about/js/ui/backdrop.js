import { still } from '../core/env.js?v=3';

export async function startBackdrop(root) {
  const video = root?.querySelector('.sa-backdrop-video');
  if (!video) return;

  let config;
  try {
    config = await (await fetch(new URL('../../data/backdrops.json?v=4', import.meta.url))).json();
  } catch {
    return;
  }

  const wanted = new URLSearchParams(location.search).get('bg');
  const key = Object.hasOwn(config.options, wanted) ? wanted : config.default;
  const option = config.options[key];
  if (!option) return;

  video.addEventListener('loadeddata', () => {
    video.classList.add('is-ready');
    if (still) video.pause();
  }, { once: true });

  video.preload = 'auto';
  video.src = option.src;
  root.dataset.backdrop = key;

  const sync = () => {
    if (still) return;
    if (document.hidden) video.pause();
    else video.play().catch(() => {});
  };
  document.addEventListener('visibilitychange', sync);
  sync();
}
