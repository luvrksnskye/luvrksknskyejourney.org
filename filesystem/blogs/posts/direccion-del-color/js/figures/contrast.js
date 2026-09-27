const GRAY = '#939393';

class Contrast {
  constructor(host) {
    this.host = host;
    const q = (role) => host.querySelector(`[data-role="${role}"]`);
    this.field = q('field');
    this.chips = [q('chip-a'), q('chip-b')];
    this.bridge = q('bridge');
    this.join = q('join');
    this.readout = q('readout');
    this.positions = [[0.2, 0.5], [0.8, 0.5]];
    this.chips.forEach((chip) => {
      chip.style.background = GRAY;
    });
    this.bridge.style.background = GRAY;
    this.place();

    this.chips.forEach((chip, k) => {
      let drag = null;
      chip.addEventListener('pointerdown', (e) => {
        drag = { x: e.clientX, y: e.clientY, start: [...this.positions[k]] };
        chip.setPointerCapture(e.pointerId);
      });
      chip.addEventListener('pointermove', (e) => {
        if (!drag) return;
        const rect = this.field.getBoundingClientRect();
        const nx = drag.start[0] + (e.clientX - drag.x) / rect.width;
        const ny = drag.start[1] + (e.clientY - drag.y) / rect.height;
        this.positions[k] = [Math.min(0.94, Math.max(0.06, nx)), Math.min(0.8, Math.max(0.2, ny))];
        this.place();
      });
      const end = () => {
        drag = null;
      };
      chip.addEventListener('pointerup', end);
      chip.addEventListener('pointercancel', end);
      chip.addEventListener('keydown', (e) => {
        const step = e.shiftKey ? 0.1 : 0.03;
        const [x, y] = this.positions[k];
        const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
        const move = moves[e.key];
        if (!move) return;
        e.preventDefault();
        this.positions[k] = [Math.min(0.94, Math.max(0.06, x + move[0])), Math.min(0.8, Math.max(0.2, y + move[1]))];
        this.place();
      });
    });

    this.join.addEventListener('click', () => {
      const on = this.join.getAttribute('aria-pressed') !== 'true';
      this.join.setAttribute('aria-pressed', String(on));
      this.bridge.classList.toggle('is-on', on);
      this.readout.textContent = on
        ? 'unidas por una franja del mismo gris, la diferencia casi desaparece'
        : 'las dos fichas son N 6, exactamente el mismo gris';
      this.place();
    });
  }

  place() {
    this.chips.forEach((chip, k) => {
      const [x, y] = this.positions[k];
      chip.style.left = `${x * 100}%`;
      chip.style.top = `${y * 100}%`;
    });
    const [a, b] = [...this.positions].sort((p, q) => p[0] - q[0]);
    const width = this.field.clientWidth;
    const height = this.field.clientHeight;
    const dx = (b[0] - a[0]) * width;
    const dy = (b[1] - a[1]) * height;
    const on = this.bridge.classList.contains('is-on');
    this.bridge.style.left = `${a[0] * 100}%`;
    this.bridge.style.top = `${a[1] * 100}%`;
    this.bridge.style.width = `${on ? Math.hypot(dx, dy) : 0}px`;
    this.bridge.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
  }
}

export function mount(host) {
  return new Contrast(host);
}
