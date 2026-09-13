const navigateToHome = () => {
  window.location.href = 'home/index.html';
};

const enter = document.querySelector('.enter');
enter?.addEventListener('click', navigateToHome);
enter?.addEventListener('touchend', (e) => {
  e.preventDefault();
  navigateToHome();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') navigateToHome();
});

const bgVideo = document.querySelector('.video-background video');
if (bgVideo) {
  bgVideo.addEventListener('loadeddata', () => {
    bgVideo.style.opacity = '1';
  });
}

const musicControl = document.getElementById('musicControl');
const musicIcon = document.getElementById('musicIcon');
const backgroundMusic = document.getElementById('backgroundMusic');

musicControl?.addEventListener('click', () => {
  if (!backgroundMusic) return;
  if (backgroundMusic.paused) {
    backgroundMusic.play().catch(() => {});
    musicControl.classList.remove('muted');
    musicIcon.src = 'assets/special-icons/music-icon.png';
  } else {
    backgroundMusic.pause();
    musicControl.classList.add('muted');
    musicIcon.src = 'assets/special-icons/music-icon-mute.png';
  }
});

document.querySelector('.menu-item[data-panel="updates"]')?.addEventListener('click', (e) => {
  e.currentTarget.classList.add('updates-clicked');
});
