import { onSeen } from '../core/env.js?v=3';

function splitWords(el) {
  let i = 0;
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType !== Node.TEXT_NODE) {
        walk(child);
        return;
      }
      const parts = child.textContent.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      parts.forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.append(part);
          return;
        }
        const word = document.createElement('span');
        word.className = 'sa-word';
        word.style.setProperty('--i', i++);
        word.textContent = part;
        frag.append(word);
      });
      child.replaceWith(frag);
    });
  };
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  walk(el);
  el.querySelectorAll('.sa-word').forEach((w) => w.setAttribute('aria-hidden', 'true'));
}

export function startReveal() {
  document.querySelectorAll('[data-split]').forEach((title) => {
    splitWords(title);
    onSeen(title, (el) => el.classList.add('is-seen'));
  });

  const groups = [
    '.st-badge',
    '.sa-eyebrow',
    '.sa-lede',
    '.sa-sub',
    '.dk-status',
    '.dk-console',
    '.cp-window',
    '.md-node',
    '.md-core',
    '.tm-card',
    '.tx-actions',
    '.tx-foot'
  ];
  document.querySelectorAll(groups.join(',')).forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.matches(groups.join(',')));
    el.classList.add('sa-reveal');
    el.style.setProperty('--i', el.closest('.dk') ? [...document.querySelectorAll('.dk .sa-reveal')].length + 2 : siblings.indexOf(el));
    onSeen(el, (target) => target.classList.add('is-seen'));
  });

  document.querySelectorAll('.st-title, .cp-quote').forEach((el) => {
    onSeen(el, (target) => target.classList.add('is-seen'), '0px 0px -20% 0px');
  });
}
