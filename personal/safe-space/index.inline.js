const flipSfx = new Audio('/assets/sound-effects/fliptab.mp3');

document.querySelectorAll('.side a[href][target="page"]').forEach((a) => {
  a.addEventListener('click', () => {
    flipSfx.currentTime = 0;
    flipSfx.play().catch(() => {});
  });
});
