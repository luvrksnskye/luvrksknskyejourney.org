const TRACKS = [
  { title: 'The Space Lifeform Capture Station Theme 2', artist: 'HOYO-MiX · Genshin Impact', src: new URL('../assets/audio/capture-station-theme.mp3', import.meta.url).href },
  { title: 'Nod-Krai Main Theme Motif', artist: 'HOYO-MiX · Genshin Impact', src: new URL('../assets/audio/nod-krai-motif.mp3', import.meta.url).href }
];

const RING = 2 * Math.PI * 20;

export function mount(host) {
  const button = host.querySelector('[data-role="toggle"]');
  const ring = host.querySelector('[data-role="progress"]');

  const audio = new Audio();
  audio.volume = 0.4;
  audio.preload = 'none';
  ring.style.strokeDasharray = RING.toFixed(2);
  ring.style.strokeDashoffset = RING.toFixed(2);

  let index = 0;
  let misses = 0;

  const label = (state) => {
    const track = TRACKS[index];
    button.setAttribute('aria-label', `${state}: ${track.title}, ${track.artist}`);
    button.title = `${track.title} · ${track.artist}`;
  };

  const play = () => audio.play().then(() => {
    host.classList.add('is-playing');
    button.setAttribute('aria-pressed', 'true');
    label('pausar');
  }).catch(() => {
    host.classList.remove('is-playing');
    button.setAttribute('aria-pressed', 'false');
    label('reproducir');
  });

  const pause = () => {
    audio.pause();
    host.classList.remove('is-playing');
    button.setAttribute('aria-pressed', 'false');
    label('reproducir');
  };

  const load = (position, autoplay) => {
    index = (position + TRACKS.length) % TRACKS.length;
    audio.src = TRACKS[index].src;
    ring.style.strokeDashoffset = RING.toFixed(2);
    label(audio.paused ? 'reproducir' : 'pausar');
    if (autoplay) play();
  };

  button.addEventListener('click', () => {
    if (audio.paused) play();
    else pause();
  });

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    ring.style.strokeDashoffset = (RING * (1 - audio.currentTime / audio.duration)).toFixed(2);
  });

  audio.addEventListener('playing', () => {
    misses = 0;
  });

  audio.addEventListener('ended', () => {
    misses = 0;
    load(index + 1, true);
  });

  audio.addEventListener('error', () => {
    if (misses >= TRACKS.length - 1) {
      pause();
      button.setAttribute('aria-label', 'la música no se pudo cargar');
      button.title = 'la música no se pudo cargar';
      return;
    }
    misses++;
    load(index + 1, true);
  });

  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', play);
    navigator.mediaSession.setActionHandler('pause', pause);
    navigator.mediaSession.setActionHandler('nexttrack', () => load(index + 1, true));
    navigator.mediaSession.setActionHandler('previoustrack', () => load(index - 1, true));
    audio.addEventListener('playing', () => {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: TRACKS[index].title,
        artist: TRACKS[index].artist,
        album: 'Todo color tiene una dirección'
      });
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !audio.paused) {
      audio.pause();
      host.dataset.resume = 'yes';
    } else if (!document.hidden && host.dataset.resume === 'yes') {
      delete host.dataset.resume;
      play();
    }
  });

  const wake = () => {
    if (audio.paused) play();
  };
  const listen = (on) => {
    const method = on ? 'addEventListener' : 'removeEventListener';
    for (const type of ['pointerdown', 'keydown', 'wheel', 'touchstart']) {
      document[method](type, wake, { once: true, passive: true });
    }
  };
  audio.addEventListener('playing', () => listen(false), { once: true });

  host.hidden = false;
  load(0, false);
  play().then(() => {
    if (audio.paused) listen(true);
  });
}
