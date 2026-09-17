import { still, clamp, easeOut, loop, watchVisible, countTo, pageScale } from '../core/env.js?v=3';
import { stamp } from '../core/time.js?v=3';

const NS = 'http://www.w3.org/2000/svg';

const svgEl = (name, attrs, parent) => {
  const node = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  parent.append(node);
  return node;
};

function typeInto(el, text) {
  if (!el) return;
  clearInterval(el.typing);
  if (still) {
    el.textContent = text;
    return;
  }
  let i = 0;
  el.textContent = '';
  el.classList.add('is-typing');
  el.typing = setInterval(() => {
    el.textContent = text.slice(0, ++i);
    if (i >= text.length) {
      clearInterval(el.typing);
      el.classList.remove('is-typing');
    }
  }, 24);
}

export function startModules(section) {
  const graph = section.querySelector('[data-graph]');
  const svg = section.querySelector('[data-wires]');
  const core = section.querySelector('[data-core]');
  const inputs = [...section.querySelectorAll('.md-inputs [data-node]')];
  const output = section.querySelector('[data-node="astra"]');
  if (!graph || !svg || !core) return { update() {} };

  const counts = {};
  const strands = new Map();
  const labels = new Map();
  const sparks = [];
  let beat = 0;

  function layout() {
    if (getComputedStyle(svg).display === 'none') return;
    const box = graph.getBoundingClientRect();
    const scale = pageScale();
    const W = box.width / scale;
    const H = box.height / scale;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.replaceChildren();
    strands.clear();
    labels.clear();

    const local = (r) => ({
      left: (r.left - box.left) / scale,
      right: (r.right - box.left) / scale,
      top: (r.top - box.top) / scale,
      cy: (r.top + r.height / 2 - box.top) / scale,
      h: r.height / scale
    });
    const c = local(core.getBoundingClientRect());

    inputs.forEach((node, index) => {
      const key = node.dataset.node;
      const n = local(node.getBoundingClientRect());
      const x1 = n.right + 4;
      const x2 = c.left;
      const lines = clamp(Math.ceil((counts[key] ?? 1) / 3), 1, 6);
      const list = [];
      for (let s = 0; s < lines; s++) {
        const spread = (s - (lines - 1) / 2) * 3;
        const ty = c.cy + (index - (inputs.length - 1) / 2) * 7 + spread * 0.6;
        const mid = x1 + (x2 - x1) * 0.5;
        const d = `M${x1} ${n.cy + spread} C${mid} ${n.cy + spread} ${mid} ${ty} ${x2} ${ty}`;
        list.push(svgEl('path', { class: 'md-strand', d }, svg));
      }
      strands.set(key, list);
      const text = svgEl('text', { class: 'md-value', x: x1 + 14, y: n.cy - 8 }, svg);
      text.textContent = counts[key] != null ? String(counts[key]) : '·';
      labels.set(key, text);
    });

    if (output) {
      const o = local(output.getBoundingClientRect());
      const x1 = c.right;
      const x2 = o.left - 4;
      const mid = (x1 + x2) / 2;
      const d = `M${x1} ${c.cy} C${mid} ${c.cy} ${mid} ${o.cy} ${x2} ${o.cy}`;
      strands.set('astra', [svgEl('path', { class: 'md-strand is-out', d }, svg)]);
    }
  }

  const ticker = loop((now, dt) => {
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t += dt / s.dur;
      const p = s.path.getPointAtLength(easeOut(clamp(s.t)) * s.len);
      s.dot.setAttribute('x', p.x - 2);
      s.dot.setAttribute('y', p.y - 2);
      if (s.t >= 1) {
        s.dot.remove();
        sparks.splice(i, 1);
        if (s.then) s.then();
      }
    }
    beat = Math.max(0, beat - dt * 1.8);
    core.style.setProperty('--beat', beat.toFixed(3));
    if (!sparks.length && beat === 0) ticker.running = false;
  });

  function spark(path, dur, then) {
    if (still || !path) return;
    const dot = svgEl('rect', { class: 'md-spark', width: 4, height: 4 }, svg);
    sparks.push({ dot, path, t: 0, len: path.getTotalLength(), dur, then });
    ticker.running = true;
  }

  function fire(key) {
    const list = strands.get(key);
    if (!list) return;
    spark(list[Math.floor(Math.random() * list.length)], 0.9, () => {
      beat = 1;
      spark(strands.get('astra')?.[0], 0.7);
    });
  }

  const hot = (key, on) => {
    strands.get(key)?.forEach((p) => p.classList.toggle('is-hot', on));
    labels.get(key)?.classList.toggle('is-hot', on);
    strands.get('astra')?.forEach((p) => p.classList.toggle('is-hot', on));
    output?.classList.toggle('is-hot', on);
  };

  inputs.forEach((node) => {
    const key = node.dataset.node;
    const on = () => {
      hot(key, true);
      fire(key);
    };
    const off = () => hot(key, false);
    node.addEventListener('pointerenter', on);
    node.addEventListener('focus', on);
    node.addEventListener('pointerleave', off);
    node.addEventListener('blur', off);
  });

  let idle = 0;
  watchVisible(graph, (visible) => {
    clearInterval(idle);
    if (!visible || still) return;
    idle = setInterval(() => fire(inputs[Math.floor(Math.random() * inputs.length)].dataset.node), 2400);
  });

  new ResizeObserver(() => requestAnimationFrame(layout)).observe(graph);
  document.fonts?.ready.then(() => requestAnimationFrame(layout));

  const live = (key) => section.querySelector(`[data-live="${key}"]`);
  let aboutTimer = 0;

  return {
    update(site) {
      Object.assign(counts, site.counts);
      ['journal', 'gallery', 'blog', 'changelog', 'credits'].forEach((key) => {
        countTo(section.querySelector(`[data-count="${key}"]`), site.counts[key]);
      });
      layout();

      const latest = (kind) => site.records.find((r) => r.kind === kind && r.at != null);
      const j = latest('journal');
      const b = latest('blog');
      const c = latest('changelog');
      const oldest = site.records.filter((r) => r.kind === 'gallery' && r.label).at(-1);

      onFirstSight(() => {
        typeInto(live('journal'), j ? `last · ${j.title} · ${stamp(j.at)}` : 'the diary is quiet');
        typeInto(live('gallery'), oldest ? `oldest · ${oldest.label.toLowerCase()}` : 'the wheel is loading');
        typeInto(live('blog'), b ? `last · ${b.title}` : 'no posts found');
        typeInto(live('changelog'), c ? `last beat · ${stamp(c.at)}` : 'no beats found');
        typeInto(live('credits'), 'artists, games, fonts, friends');

        const lines = Object.entries(site.about?.currently || {}).map(([k, v]) => `${k} · ${v}`);
        clearInterval(aboutTimer);
        if (!lines.length) {
          typeInto(live('about'), 'not saying right now');
          return;
        }
        let n = 0;
        typeInto(live('about'), lines[0]);
        if (still || lines.length < 2) return;
        watchVisible(graph, (visible) => {
          clearInterval(aboutTimer);
          if (visible) aboutTimer = setInterval(() => typeInto(live('about'), lines[++n % lines.length]), 3800);
        });
      });
    }
  };

  function onFirstSight(run) {
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      run();
    }, { rootMargin: '0px 0px -15% 0px' });
    io.observe(graph);
  }
}
