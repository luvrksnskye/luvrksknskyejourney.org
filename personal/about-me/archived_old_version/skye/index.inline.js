const skyeNavSound = new Audio('music/ui-phone-start-4.wav');
const skyeMainFrame = document.getElementById('skyeMainFrame');

function loadSkyePage(url) {
  skyeNavSound.currentTime = 0;
  skyeNavSound.play().catch(() => {});
  if (!skyeMainFrame) return;
  skyeMainFrame.style.opacity = '0';
  setTimeout(() => {
    skyeMainFrame.src = url;
    skyeMainFrame.style.opacity = '1';
  }, 300);
}

document.querySelectorAll('.label-item[data-skye-page]').forEach((el) => {
  el.addEventListener('click', () => loadSkyePage(el.dataset.skyePage));
});

skyeMainFrame?.addEventListener('load', () => {
  skyeMainFrame.style.opacity = '1';
});

document.getElementById('cover')?.addEventListener('click', () => {
  if (typeof passportOpen === 'function') passportOpen();
});
