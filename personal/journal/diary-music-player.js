const $ = (sel) => document.querySelector(sel);
const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const fmt = (secs) => {
  if (!Number.isFinite(secs)) return '--:--';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs - m * 60);
  return `${pad(m)}:${pad(s)}`;
};

const albums = [
 'Nihility and Causality', 'Lacebark pine', 'Drifter', 'Resonance', 'Memory reboot', 'Offline', "River's end",
  "See, i'm sorry", 'Snowfall', 'GOTH', 'Clouds', 'Afte dark', 'The ghost',
  'Minecraft', 'Key', 'Mine on venus', 'Subwoofer lullaby',
];

const trackNames = [
  'Wuthering Waves OST', 'Whitepine OST', 'Hallow', 'HOME', 'VØJ', 'L0WS', 'Thenian', 'Nectry', 'Øneheart','Sidewalks and skeletons', 'PASTEL GOTH', 'Mr.Kitty', 'Trevor something',
  'C418', 'C418', 'C418', 'C418',
];

const trackUrl = [
  'diary-music-player/diary-songs/ww.mp3',
  'diary-music-player/diary-songs/lacebark-pine.mp3',
  'diary-music-player/diary-songs/drifter.mp3',
  'diary-music-player/diary-songs/home-resonance.mp3',
  'diary-music-player/diary-songs/memory-reboot.mp3',
  'diary-music-player/diary-songs/offline.mp3',
  'diary-music-player/diary-songs/rivers-end.mp3',
  'diary-music-player/diary-songs/see-im-sorry.mp3',
  'diary-music-player/diary-songs/snowfall.mp3',
  'diary-music-player/diary-songs/goth.mp3',
  'diary-music-player/diary-songs/clouds.mp3',
  'diary-music-player/diary-songs/after-dark.mp3',
  'diary-music-player/diary-songs/the-ghost.mp3',
  'diary-music-player/diary-songs/minecraft.mp3',
  'diary-music-player/diary-songs/key.mp3',
  'diary-music-player/diary-songs/mice-on-venus.mp3',
  'diary-music-player/diary-songs/subwoofer-lullaby.mp3'
];

const albumArtworks = albums.map((_, i) => `_${i + 1}`);

const isAutoplay = true;
const isPlaylistLoop = true;

document.addEventListener('DOMContentLoaded', () => {
  const playerTrack = $('#player-track');
  const bgArtwork = $('#bg-artwork');
  const albumName = $('#album-name');
  const trackName = $('#track-name');
  const albumArt = $('#album-art');
  const sArea = $('#s-area');
  const seekBar = $('#seek-bar');
  const trackTime = $('#track-time');
  const insTime = $('#ins-time');
  const sHover = $('#s-hover');
  const playPauseButton = $('#play-pause-button');
  const icon = playPauseButton?.querySelector('i');
  const tProgress = $('#current-time');
  const tTime = $('#track-length');
  if (!playerTrack || !playPauseButton) return;

  const audio = new Audio();
  audio.autoplay = isAutoplay;
  let currIndex = -1;
  let buffInterval = null;
  let tFlag = false;
  let nTime = 0;
  let bTime = 0;
  let seekLoc = 0;
  let seekT = 0;

  const setIcon = (cls) => { if (icon) icon.className = cls; };

  function playPause() {
    setTimeout(() => {
      if (audio.paused) {
        playerTrack.classList.add('active');
        albumArt.classList.add('active');
        checkBuffering();
        setIcon('fas fa-pause');
        audio.play().catch(() => {});
      } else {
        playerTrack.classList.remove('active');
        albumArt.classList.remove('active');
        clearInterval(buffInterval);
        albumArt.classList.remove('buffering');
        setIcon('fas fa-play');
        audio.pause();
      }
    }, 300);
  }

  function showHover(event) {
    const rect = sArea.getBoundingClientRect();
    seekT = event.clientX - rect.left;
    seekLoc = audio.duration * (seekT / rect.width);
    sHover.style.width = `${seekT}px`;
    insTime.textContent = fmt(seekLoc);
    insTime.style.left = `${seekT}px`;
    insTime.style.marginLeft = '-21px';
    insTime.style.display = 'block';
    insTime.style.opacity = '1';
  }

  function hideHover() {
    sHover.style.width = '0';
    insTime.textContent = '00:00';
    insTime.style.left = '0px';
    insTime.style.marginLeft = '0px';
    insTime.style.display = 'none';
  }

  function playFromClickedPos() {
    audio.currentTime = seekLoc;
    seekBar.style.width = `${seekT}px`;
    hideHover();
  }

  function updateCurrTime() {
    nTime = Date.now();
    if (!tFlag) {
      tFlag = true;
      trackTime.classList.add('active');
    }
    tProgress.textContent = fmt(audio.currentTime);
    tTime.textContent = fmt(audio.duration);
    const playProgress = (audio.currentTime / audio.duration) * 100;
    if (Number.isFinite(playProgress)) trackTime.classList.add('active');
    else trackTime.classList.remove('active');
    seekBar.style.width = `${playProgress || 0}%`;

    if (playProgress === 100) {
      setIcon('fas fa-play');
      seekBar.style.width = '0';
      tProgress.textContent = '00:00';
      albumArt.classList.remove('buffering', 'active');
      clearInterval(buffInterval);
      if (currIndex < albums.length - 1) {
        selectTrack(1);
      } else if (isPlaylistLoop) {
        currIndex = -1;
        selectTrack(1);
      }
    }
  }

  function checkBuffering() {
    clearInterval(buffInterval);
    buffInterval = setInterval(() => {
      if (nTime === 0 || bTime - nTime > 1000) albumArt.classList.add('buffering');
      else albumArt.classList.remove('buffering');
      bTime = Date.now();
    }, 100);
  }

  function selectTrack(flag) {
    if (flag === 0 || flag === 1) currIndex += 1;
    else currIndex -= 1;

    if (currIndex > -1 && currIndex < albums.length) {
      setIcon(flag === 0 ? 'fas fa-play' : 'fas fa-pause');
      if (flag !== 0) albumArt.classList.remove('buffering');

      seekBar.style.width = '0';
      trackTime.classList.remove('active');
      tProgress.textContent = '00:00';
      tTime.textContent = '00:00';

      audio.src = trackUrl[currIndex];
      nTime = 0;
      bTime = Date.now();

      if (flag !== 0 || isAutoplay) {
        audio.play().catch(() => {});
        playerTrack.classList.add('active');
        albumArt.classList.add('active');
        clearInterval(buffInterval);
        checkBuffering();
      }

      albumName.textContent = albums[currIndex];
      trackName.textContent = trackNames[currIndex];

      albumArt.querySelectorAll('img.active').forEach((img) => img.classList.remove('active'));
      const artwork = document.getElementById(albumArtworks[currIndex]);
      artwork?.classList.add('active');
      if (artwork) bgArtwork.style.backgroundImage = `url(${artwork.getAttribute('src')})`;
    } else {
      if (flag === 0 || flag === 1) currIndex -= 1;
      else currIndex += 1;
    }
  }

  selectTrack(0);
  playPauseButton.addEventListener('click', playPause);
  sArea.addEventListener('mousemove', showHover);
  sArea.addEventListener('mouseout', hideHover);
  sArea.addEventListener('click', playFromClickedPos);
  audio.addEventListener('timeupdate', updateCurrTime);
  $('#play-previous')?.addEventListener('click', () => selectTrack(-1));
  $('#play-next')?.addEventListener('click', () => selectTrack(1));
});
