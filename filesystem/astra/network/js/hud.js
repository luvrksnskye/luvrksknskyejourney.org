import { svg, el, $, pad, signed, clamp, damp, TAU } from './core.js?v=2';

export const hud = (function () {
  'use strict';


  const live = {};
  let fluxCtx = null, fluxW = 0, fluxH = 0;
  const fluxBins = new Float32Array(40);
  const fluxTarget = new Float32Array(40);

  function mark(gid) {
    const g = document.getElementById(gid);
    if (!g) return;
    g.innerHTML = '';
    g.appendChild(svg('circle', { cx: 20, cy: 20, r: 17 }));
    g.appendChild(svg('rect', { x: 8.2, y: 8.2, width: 23.6, height: 23.6, transform: 'rotate(45 20 20)' }));
    g.appendChild(svg('path', { d: 'M1.6 20h8.4M30 20h8.4' }));
    g.appendChild(svg('path', { d: 'M20 1.6v5M20 33.4v5' }));
    const dot = svg('circle', { cx: 20, cy: 20, r: 2.1 });
    dot.setAttribute('fill', 'currentColor');
    dot.setAttribute('stroke', 'none');
    g.appendChild(dot);
    g.setAttribute('color', '#ffffff');
  }

  function reticle() {
    const g = document.getElementById('reticle-art');
    if (!g) return;
    g.innerHTML = '';

    const b = 26, o = 12;
    [[o, o, 1, 1], [160 - o, o, -1, 1], [o, 160 - o, 1, -1], [160 - o, 160 - o, -1, -1]]
      .forEach(([x, y, sx, sy]) => {
        g.appendChild(svg('path', { d: `M${x} ${y + sy * b}L${x} ${y}L${x + sx * b} ${y}` }));
      });

    const ring = svg('g', { class: 'spin' });
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * TAU;
      const long = i % 6 === 0;
      const r0 = long ? 52 : 56, r1 = 60;
      ring.appendChild(svg('path', {
        d: `M${80 + Math.cos(a) * r0} ${80 + Math.sin(a) * r0}L${80 + Math.cos(a) * r1} ${80 + Math.sin(a) * r1}`,
        'stroke-opacity': long ? 0.85 : 0.35
      }));
    }
    g.appendChild(ring);

    const inner = svg('g', { class: 'spin-r' });
    [[8, 54], [110, 38], [196, 62], [290, 30]].forEach(([from, span]) => {
      const a0 = from * Math.PI / 180, a1 = (from + span) * Math.PI / 180, r = 43;
      const large = span > 180 ? 1 : 0;
      inner.appendChild(svg('path', {
        d: `M${80 + Math.cos(a0) * r} ${80 + Math.sin(a0) * r}A${r} ${r} 0 ${large} 1 ${80 + Math.cos(a1) * r} ${80 + Math.sin(a1) * r}`,
        'stroke-opacity': 0.55
      }));
    });
    g.appendChild(inner);

    g.appendChild(svg('path', { d: 'M80 62v10M80 88v10M62 80h10M88 80h10', 'stroke-opacity': 0.9 }));
    g.appendChild(svg('circle', { cx: 80, cy: 80, r: 3.2, 'stroke-opacity': 0.9 }));
  }

  function stability() {
    const s = document.getElementById('gauge-stability');
    if (!s) return;
    s.innerHTML = '';
    const C = 75, R = 60;

    const ticks = svg('g', { stroke: '#8e8e8e' });
    for (let i = 0; i < 180; i++) {
      const a = (i / 180) * TAU - Math.PI / 2;
      const long = i % 15 === 0;
      const r0 = long ? R - 11 : R - 5;
      ticks.appendChild(svg('path', {
        d: `M${C + Math.cos(a) * r0} ${C + Math.sin(a) * r0}L${C + Math.cos(a) * R} ${C + Math.sin(a) * R}`,
        'stroke-width': long ? 1.1 : 0.7,
        'stroke-opacity': long ? 0.9 : 0.3
      }));
    }
    s.appendChild(ticks);
    s.appendChild(svg('circle', { cx: C, cy: C, r: R - 15, stroke: '#2e2e2e', 'stroke-width': 1 }));

    const arc = svg('path', { stroke: '#ffffff', 'stroke-width': 2.2, 'stroke-linecap': 'butt' });
    s.appendChild(arc);
    live.stabArc = arc;
    live.stabC = C; live.stabR = R - 15;

    s.appendChild(svg('rect', { x: C - 33, y: C - 9, width: 66, height: 18, stroke: '#565656', 'stroke-width': 1, fill: '#000000' }));
    const t = svg('text', {
      x: C, y: C + 4, 'text-anchor': 'middle',
      fill: '#c9c9c9', 'font-family': 'Departure Mono, monospace',
      'font-size': '7.5', 'letter-spacing': '1.2'
    });
    t.textContent = 'STABILITY';
    s.appendChild(t);

    [[-1, '-30', 'end'], [1, '-30', 'start']].forEach(([dir, txt, anchor]) => {
      const x = C + dir * (R + 9);
      const lab = svg('text', {
        x: x, y: C - R + 8, 'text-anchor': anchor,
        fill: '#565656', 'font-family': 'Departure Mono, monospace', 'font-size': '7'
      });
      lab.textContent = txt;
      s.appendChild(lab);
    });

    const v = svg('text', {
      x: C, y: C + 22, 'text-anchor': 'middle',
      fill: '#ffffff', 'font-family': 'Departure Mono, monospace',
      'font-size': '11', 'letter-spacing': '1'
    });
    v.textContent = '100.0';
    s.appendChild(v);
    live.stabVal = v;
  }

  function bearing() {
    const s = document.getElementById('gauge-bearing');
    if (!s) return;
    s.innerHTML = '';
    const C = 65, R = 55;

    s.appendChild(svg('circle', { cx: C, cy: C, r: R, stroke: '#2e2e2e', 'stroke-width': 1 }));

    const rose = svg('g');
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * TAU - Math.PI / 2;
      const long = i % 9 === 0;
      const r0 = long ? R - 13 : R - 6;
      rose.appendChild(svg('path', {
        d: `M${C + Math.cos(a) * r0} ${C + Math.sin(a) * r0}L${C + Math.cos(a) * (R - 1)} ${C + Math.sin(a) * (R - 1)}`,
        stroke: '#8e8e8e', 'stroke-width': long ? 1.2 : 0.7,
        'stroke-opacity': long ? 0.95 : 0.32
      }));
    }
    s.appendChild(rose);
    live.rose = rose;
    live.roseC = C;

    s.appendChild(svg('path', { d: `M${C} 2L${C - 4.5} 10L${C + 4.5} 10Z`, stroke: '#ffffff', 'stroke-width': 1, fill: '#ffffff' }));
    s.appendChild(svg('path', { d: `M${C - 22} ${C}h44M${C} ${C - 22}v44`, stroke: '#2e2e2e', 'stroke-width': 1 }));

    const v = svg('text', {
      x: C, y: C + 4, 'text-anchor': 'middle',
      fill: '#ffffff', 'font-family': 'Departure Mono, monospace', 'font-size': '12'
    });
    v.textContent = '000';
    s.appendChild(v);
    live.bearVal = v;
  }

  function depth() {
    const s = document.getElementById('gauge-depth');
    if (!s) return;
    s.innerHTML = '';
    const X = 58, TOP = 14, BOT = 226;

    s.appendChild(svg('path', { d: `M${X} ${TOP}V${BOT}`, stroke: '#8e8e8e', 'stroke-width': 1 }));

    for (let i = 0; i <= 60; i++) {
      const y = TOP + (i / 60) * (BOT - TOP);
      const major = i % 6 === 0;
      s.appendChild(svg('path', {
        d: `M${X} ${y}h${major ? 11 : 6}`,
        stroke: '#8e8e8e', 'stroke-width': major ? 1.1 : 0.7,
        'stroke-opacity': major ? 0.9 : 0.3
      }));
      if (major) {
        const t = svg('text', {
          x: X + 15, y: y + 3, fill: '#565656',
          'font-family': 'Departure Mono, monospace', 'font-size': '7.5'
        });
        t.textContent = pad(100 - i * (100 / 60), 3);
        s.appendChild(t);
      }
    }

    [0.18, 0.46, 0.78].forEach(f => {
      const y = TOP + f * (BOT - TOP);
      s.appendChild(svg('path', { d: `M${X - 6} ${y}l-7 -4.5v9Z`, stroke: '#565656', 'stroke-width': 1 }));
    });

    const g = svg('g');
    g.appendChild(svg('rect', { x: 2, y: -8, width: 42, height: 16, stroke: '#ffffff', 'stroke-width': 1, fill: '#000000' }));
    const t = svg('text', {
      x: 23, y: 4, 'text-anchor': 'middle', fill: '#ffffff',
      'font-family': 'Departure Mono, monospace', 'font-size': '9.5'
    });
    t.textContent = '000.0';
    g.appendChild(t);
    g.appendChild(svg('path', { d: `M44 0l9 -5.5v11Z`, stroke: '#ffffff', 'stroke-width': 1, fill: '#ffffff' }));
    s.appendChild(g);
    live.tapeG = g; live.tapeVal = t; live.tapeTop = TOP; live.tapeBot = BOT;
  }

  function flux() {
    const c = $('#flux');
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = c.getBoundingClientRect();
    fluxW = Math.max(120, Math.round(rect.width || 240));
    fluxH = 44;
    c.width = fluxW * dpr;
    c.height = fluxH * dpr;
    fluxCtx = c.getContext('2d');
    fluxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawFlux(t, energy) {
    if (!fluxCtx) return;
    const cols = fluxBins.length;
    const cw = fluxW / cols;
    const cell = 3;

    for (let i = 0; i < cols; i++) {
      if ((Math.floor(t * 12) + i * 7) % 23 === 0) {
        const bias = 1 - Math.abs(i / cols - 0.32) * 1.35;
        fluxTarget[i] = Math.max(0.05, Math.min(1, (Math.sin(i * 1.7 + t * 0.8) * 0.3 + 0.5) * bias * (0.45 + energy)));
      }
      fluxBins[i] += (fluxTarget[i] - fluxBins[i]) * 0.14;
    }

    fluxCtx.clearRect(0, 0, fluxW, fluxH);
    fluxCtx.fillStyle = '#ffffff';
    const rows = Math.floor(fluxH / cell) - 1;
    for (let i = 0; i < cols; i++) {
      const h = Math.round(fluxBins[i] * rows);
      for (let r = 0; r < h; r++) {
        fluxCtx.globalAlpha = 0.20 + (r / rows) * 0.75;
        fluxCtx.fillRect(Math.round(i * cw) + 1, fluxH - 3 - r * cell, Math.max(1, cw - 2), 1.6);
      }
    }
    fluxCtx.globalAlpha = 0.24;
    fluxCtx.fillRect(0, fluxH - 1, fluxW, 1);
    fluxCtx.globalAlpha = 1;
  }

  let stabSmooth = 1;

  function update(m, dt, t) {

    const target = clamp(m.fps / 60, 0, 1);
    stabSmooth = damp(stabSmooth, target, 1.4, dt);
    const pct = stabSmooth * 100;

    if (live.stabArc) {
      const C = live.stabC, R = live.stabR;
      const a0 = -Math.PI / 2;
      const a1 = a0 + stabSmooth * TAU * 0.999;
      const large = stabSmooth > 0.5 ? 1 : 0;
      live.stabArc.setAttribute('d',
        `M${C + Math.cos(a0) * R} ${C + Math.sin(a0) * R}A${R} ${R} 0 ${large} 1 ${C + Math.cos(a1) * R} ${C + Math.sin(a1) * R}`);
    }
    if (live.stabVal) live.stabVal.textContent = pad(pct, 3, 1);

    if (live.rose) live.rose.setAttribute('transform', `rotate(${-m.azm} ${live.roseC} ${live.roseC})`);
    if (live.bearVal) live.bearVal.textContent = pad(m.azm, 3);

    if (live.tapeG) {
      const f = clamp(1 - (m.dst - 40) / 340, 0, 1);
      const y = live.tapeTop + (1 - f) * (live.tapeBot - live.tapeTop);
      live.tapeG.setAttribute('transform', `translate(0 ${y.toFixed(1)})`);
      live.tapeVal.textContent = pad(m.dst, 3, 1);
    }

    setText('#r-fov', pad(m.fov, 3, 2) + '°');
    setText('#r-dst', pad(m.dst, 4, 1) + ' u');
    setText('#r-azm', pad(m.azm, 3, 3) + '°');
    setText('#r-elv', signed(m.elv, 2, 3) + '°');
    setText('#r-fps', pad(m.fps, 2, 1));
    setText('#b-r', pad(m.dst / 10, 2, 3));
    setText('#b-l', pad(Math.abs(m.elv) * 3, 3));

    drawFlux(t, clamp(m.energy || 0, 0, 1));
  }

  const cache = new Map();
  function setText(sel, txt) {
    let n = cache.get(sel);
    if (n === undefined) { n = $(sel); cache.set(sel, n); }
    if (n && n.textContent !== txt) n.textContent = txt;
  }

  const labelPool = [];
  const leaderPool = [];
  let labelsRoot = null, leadersRoot = null;

  function ensurePools(n) {
    if (!labelsRoot) { labelsRoot = $('#labels'); leadersRoot = $('#leaders'); }
    if (!labelsRoot || !leadersRoot) return false;
    while (labelPool.length < n) {
      const box = el('div', { class: 'lbl' }, [
        el('span', { class: 'n' }), el('span', { class: 'd' })
      ]);
      box.hidden = true;
      labelsRoot.appendChild(box);
      labelPool.push(box);

      const g = svg('g');
      const ld = svg('path', { class: 'ld' });
      const tk = svg('path', { class: 'tick' });
      g.appendChild(ld); g.appendChild(tk);
      g.setAttribute('visibility', 'hidden');
      leadersRoot.appendChild(g);
      leaderPool.push({ g: g, ld: ld, tk: tk });
    }
    return true;
  }

  function labels(items, W, H) {
    if (!ensurePools(items.length)) return;

    for (let i = 0; i < labelPool.length; i++) {
      const box = labelPool[i], lead = leaderPool[i];
      const it = items[i];
      if (!it) {
        if (!box.hidden) { box.hidden = true; lead.g.setAttribute('visibility', 'hidden'); }
        continue;
      }

      const right = it.x < W * 0.52;
      const reach = Math.min(118, Math.max(46, W * 0.09));
      const lx = it.x + (right ? reach : -reach);
      const ly = it.y - (it.rise || 0);

      box.hidden = false;
      box.className = 'lbl' + (it.hot ? ' hot' : '') + (it.sel ? ' sel' : '') + (it.fav ? ' fav' : '');
      box.children[0].textContent = it.title;
      box.children[1].textContent = it.domain;
      box.style.left = right ? lx + 'px' : 'auto';
      box.style.right = right ? 'auto' : (W - lx) + 'px';
      box.style.top = ly + 'px';

      const mx = it.x + (right ? reach * 0.42 : -reach * 0.42);
      lead.g.setAttribute('visibility', 'visible');
      lead.ld.setAttribute('class', it.hot || it.sel ? 'ld ld-hot' : 'ld');
      lead.ld.setAttribute('d', `M${it.x.toFixed(1)} ${it.y.toFixed(1)}L${mx.toFixed(1)} ${ly.toFixed(1)}L${lx.toFixed(1)} ${ly.toFixed(1)}`);
      lead.tk.setAttribute('d', `M${(it.x - 3).toFixed(1)} ${it.y.toFixed(1)}h6M${it.x.toFixed(1)} ${(it.y - 3).toFixed(1)}v6`);
      lead.tk.setAttribute('stroke-opacity', it.hot || it.sel ? '0.9' : '0.45');
    }
  }

  function build() {
    mark('mark-art');
    mark('boot-mark-art');
    reticle();
    stability();
    bearing();
    depth();
    flux();
  }

  window.addEventListener('resize', () => { flux(); }, { passive: true });

  return { build, update, labels, flux };
})();
