const flipSfx = new Audio('/assets/audio/sfx/fliptab.mp3');

document.querySelectorAll('.side a[href][target="page"]').forEach((a) => {
  a.addEventListener('click', () => {
    flipSfx.currentTime = 0;
    flipSfx.play().catch(() => {});
  });
});
