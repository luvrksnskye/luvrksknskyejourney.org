const IMG_URL = '/assets/images/mouse/cursor.ico';
const SIZE = [10, 20];
const BURST = 5;

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const lerp = (a, b, f) => (b - a) * f + a;

function spawn(x, y) {
  const s = rand(SIZE[0], SIZE[1]);
  const sx = Math.floor(x - s / 2) + rand(-5, 5);
  const sy = Math.floor(y - s / 2) + rand(-5, 5);
  const fx = sx + rand(-40, 40);
  const fy = sy + rand(-40, 40);

  const img = document.createElement('img');
  img.src = IMG_URL;
  img.style.cssText = `
    pointer-events:none; position:fixed;
    width:${s}px; left:${sx}px; top:${sy}px;
    user-select:none; z-index:var(--z-cursor, 1000000);
  `;
  document.body.appendChild(img);

  let f = 0;
  const iv = setInterval(() => {
    const nx = Math.floor(lerp(sx, fx, f));
    const ny = Math.floor(lerp(sy, fy, f));
    img.style.left = `${nx}px`;
    img.style.top = `${ny}px`;
    img.style.opacity = 1 - f;
    f += 0.01;
    if (f > 1) {
      clearInterval(iv);
      img.remove();
    }
  }, 10);
}

document.body.addEventListener('click', (e) => {
  const scale = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
  for (let i = 0; i < BURST; i++) spawn(e.clientX / scale, e.clientY / scale);
});
