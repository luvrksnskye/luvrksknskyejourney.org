import { formatNumber } from '../core/env.js?v=3';

const IDLE = {
  kicker: 'standing by',
  title: 'select a module',
  value: 'the station keeps watch while I sleep'
};

export function startDeck(section) {
  const console = section.querySelector('[data-deck]');
  if (!console) return { update() {} };

  const commands = [...console.querySelectorAll('[data-cmd]')];
  const leader = console.querySelector('[data-leader]');
  const leaderEnd = console.querySelector('[data-leader-end]');
  const read = console.querySelector('.dk-core-read');
  const kicker = console.querySelector('[data-deck-kicker]');
  const title = console.querySelector('[data-deck-title]');
  const value = console.querySelector('[data-deck-value]');
  const values = {};
  let active = -1;

  function aim(cmd) {
    const box = console.getBoundingClientRect();
    const r = cmd.getBoundingClientRect();
    const x = ((r.left + r.width / 2 - box.left) / box.width) * 600;
    const y = ((r.top + r.height / 2 - box.top) / box.height) * 600;
    const dx = x - 300;
    const dy = y - 300;
    const len = Math.hypot(dx, dy) || 1;
    const sx = 300 + (dx / len) * 160;
    const sy = 300 + (dy / len) * 160;
    leader.setAttribute('x1', sx.toFixed(1));
    leader.setAttribute('y1', sy.toFixed(1));
    leader.setAttribute('x2', x.toFixed(1));
    leader.setAttribute('y2', y.toFixed(1));
    leaderEnd.setAttribute('cx', sx.toFixed(1));
    leaderEnd.setAttribute('cy', sy.toFixed(1));
  }

  function show(kick, head, line) {
    read.classList.remove('is-swapping');
    void read.offsetWidth;
    read.classList.add('is-swapping');
    kicker.textContent = kick;
    title.textContent = head;
    value.textContent = line;
  }

  function select(index) {
    if (index === active) return;
    active = index;
    commands.forEach((cmd, i) => cmd.classList.toggle('is-active', i === index));
    console.classList.toggle('has-active', index >= 0);
    if (index < 0) {
      show(IDLE.kicker, IDLE.title, IDLE.value);
      return;
    }
    const cmd = commands[index];
    aim(cmd);
    const key = cmd.dataset.cmd;
    show(`module ${String(index + 1).padStart(2, '0')} · ${cmd.querySelector('small').textContent}`, cmd.querySelector('span').textContent, values[key] || cmd.dataset.desc);
  }

  commands.forEach((cmd, i) => {
    cmd.addEventListener('pointerenter', () => select(i));
    cmd.addEventListener('focus', () => select(i));
  });

  console.addEventListener('pointerleave', () => {
    if (!console.contains(document.activeElement)) select(-1);
  });

  console.addEventListener('keydown', (e) => {
    const n = commands.length;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      commands[(Math.max(active, -1) + 1) % n].focus();
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      commands[(active - 1 + n) % n].focus();
    }
    if (e.key === 'Escape') {
      document.activeElement.blur();
      select(-1);
    }
  });

  addEventListener('resize', () => {
    if (active >= 0) aim(commands[active]);
  });

  return {
    update(site) {
      const { counts, records } = site;
      const latest = (kind) => records.find((r) => r.kind === kind && r.at != null);
      const journal = latest('journal');
      const blog = latest('blog');
      values.capsule = 'why I built this place';
      values.parts = `${formatNumber(Object.values(counts).reduce((a, b) => a + b, 0))} parts linked`;
      values.heartbeat = `${formatNumber(records.length)} pieces kept`;
      values.trace = 'leave something behind';
      values.journal = journal ? `${counts.journal} entries · last: ${journal.title}` : `${counts.journal} entries`;
      values.gallery = `${counts.gallery} memories kept`;
      values.blog = blog ? `${counts.blog} posts · last: ${blog.title}` : `${counts.blog} posts`;
      values.about = site.about?.currently?.building ? `currently building ${site.about.currently.building}` : 'who I am';
    }
  };
}
