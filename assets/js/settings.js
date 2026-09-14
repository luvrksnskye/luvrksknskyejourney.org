import { sfx } from '/assets/js/audio.js';

sfx.register('open', '/assets/audio/sfx/click.wav');
sfx.register('close', '/assets/audio/sfx/exit.wav');

const overlay = document.getElementById('modalOverlay');
const panels = document.querySelectorAll('.modal-panel');

function openPanel(panelType) {
  sfx.play('open');
  const panel = document.getElementById(`${panelType}Panel`);
  if (!panel) return;
  panels.forEach((p) => {
    p.style.display = 'none';
    p.classList.remove('active');
  });
  panel.style.display = 'block';
  overlay.classList.add('active');
  void panel.offsetWidth;
  panel.classList.add('active');
}

function closePanel() {
  sfx.play('close');
  overlay.classList.remove('active');
  panels.forEach((p) => p.classList.remove('active'));
  setTimeout(() => panels.forEach((p) => (p.style.display = 'none')), 300);
}

document.addEventListener('click', (e) => {
  const item = e.target.closest('.menu-item[data-panel]');
  if (item) openPanel(item.dataset.panel);
});

overlay?.addEventListener('click', (e) => {
  if (e.target === overlay) closePanel();
});

document.querySelectorAll('.modal-panel .close-button').forEach((btn) => {
  btn.addEventListener('click', closePanel);
});

document.querySelectorAll('.modal-panel').forEach((p) => {
  p.addEventListener('click', (e) => e.stopPropagation());
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePanel();
});
