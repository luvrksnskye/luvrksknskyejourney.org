(() => {
  const SELECTOR = '[title]';
  const DELAY = 10;
  const FADE = 10;

  const tip = document.createElement('div');
  tip.id = 's-m-t-tooltip';
  const inner = document.createElement('div');
  tip.appendChild(inner);
  Object.assign(tip.style, {
    position: 'absolute',
    display: 'none',
    pointerEvents: 'none',
    opacity: '0',
    transition: `opacity ${FADE}ms linear`,
  });

  const attach = () => {
    document.body.appendChild(tip);

    let showTimer = null;
    let activeEl = null;
    let savedTitle = '';

    const move = (e) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const rect = tip.getBoundingClientRect();
      let x = e.clientX + 12;
      let y = e.clientY + 12;
      if (x + rect.width > w) x = Math.max(0, e.clientX - rect.width - 12);
      if (y + rect.height > h) y = Math.max(0, e.clientY - rect.height - 12);
      tip.style.left = `${x + window.scrollX}px`;
      tip.style.top = `${y + window.scrollY}px`;
    };

    const show = (el, e) => {
      const title = el.getAttribute('title');
      if (!title) return;
      activeEl = el;
      savedTitle = title;
      el.setAttribute('data-smt-title', title);
      el.removeAttribute('title');
      inner.textContent = title;
      tip.style.display = 'block';
      move(e);
      clearTimeout(showTimer);
      showTimer = setTimeout(() => { tip.style.opacity = '1'; }, DELAY);
    };

    const hide = () => {
      clearTimeout(showTimer);
      tip.style.opacity = '0';
      setTimeout(() => { tip.style.display = 'none'; }, FADE);
      if (activeEl && savedTitle) {
        activeEl.setAttribute('title', savedTitle);
        activeEl.removeAttribute('data-smt-title');
      }
      activeEl = null;
      savedTitle = '';
    };

    document.addEventListener('mouseover', (e) => {
      const el = e.target.closest(SELECTOR);
      if (el && el.hasAttribute('title')) show(el, e);
    });

    document.addEventListener('mousemove', (e) => {
      if (tip.style.display === 'block') move(e);
    });

    document.addEventListener('mouseout', (e) => {
      const el = e.target.closest('[data-smt-title]');
      if (el && !el.contains(e.relatedTarget)) hide();
    });

    document.addEventListener('click', hide);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();
