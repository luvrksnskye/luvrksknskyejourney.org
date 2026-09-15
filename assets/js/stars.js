const container = document.querySelector('.stars');
if (container) {
  const COUNT = 500;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < COUNT; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    s.style.left = `calc(${Math.random() * 100} * var(--vw, 1vw))`;
    s.style.top = `calc(${Math.random() * 100} * var(--vh, 1vh))`;
    s.style.animationDelay = `${Math.random() * 10}s`;
    s.style.animationDuration = `${5 + Math.random() * 5}s`;
    frag.appendChild(s);
  }
  container.appendChild(frag);
}
