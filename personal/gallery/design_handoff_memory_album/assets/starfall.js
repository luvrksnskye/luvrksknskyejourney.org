const starfield = document.querySelector('.starfall-container .starfield');
if (starfield) {
  const segments = [
    { x: [0, 33], y: [0, 33] },   { x: [33, 66], y: [0, 33] },   { x: [66, 100], y: [0, 33] },
    { x: [0, 33], y: [33, 66] },  { x: [33, 66], y: [33, 66] },  { x: [66, 100], y: [33, 66] },
    { x: [0, 33], y: [66, 100] }, { x: [33, 66], y: [66, 100] }, { x: [66, 100], y: [66, 100] },
  ];
  const perSegment = 1;

  const frag = document.createDocumentFragment();
  segments.forEach((seg) => {
    for (let i = 0; i < perSegment; i++) {
      const star = document.createElement('div');
      star.className = 'falling-star';
      const x = seg.x[0] + Math.random() * (seg.x[1] - seg.x[0]);
      const y = seg.y[0] + Math.random() * (seg.y[1] - seg.y[0]);
      const delay = Math.random() * 9999;
      const duration = 3000 + (Math.random() * 1000 - 500);
      star.style.left = `${x}%`;
      star.style.top = `${y}%`;
      star.style.animationDelay = `${delay}ms`;
      star.style.animationDuration = `${duration}ms`;
      star.style.opacity = 0.75 + Math.random() * 0.5;
      frag.appendChild(star);
    }
  });
  starfield.appendChild(frag);
}
