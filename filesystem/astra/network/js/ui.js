import { $, $$, el, state, store, bus, MODES, say, breathe, clamp } from './core.js?v=2';
import { data } from './vault.js?v=2';
import { gl } from './gl.js?v=2';
import { camera } from './camera.js?v=2';
import { audio } from './audio.js?v=2';
import { ask } from './ask.js?v=2';
import { intro } from './intro.js?v=2';
import { backdrop } from './backdrop.js?v=2';

export const ui = (function () {
  'use strict';


  let panel, searchBox, qInput, results, helpBox, setBox, askBox, peerBox;
  let findHits = [], findIdx = 0;
  let cycleOrder = null, cyclePos = -1;

  function buildModes() {
    const ul = $('#modes');
    ul.innerHTML = '';
    MODES.forEach(m => {
      const b = el('button', {
        class: 'mode', type: 'button', role: 'tab',
        'data-mode': m.id, 'aria-selected': String(m.id === state.mode), title: m.blurb
      }, [
        el('span', { class: 'idx', text: m.key }),
        el('span', { class: 'nm', text: m.name })
      ]);
      b.addEventListener('click', () => setMode(m.id));
      ul.appendChild(el('li', null, [b]));
    });
  }

  function setMode(id) {
    if (!MODES.some(m => m.id === id) || state.mode === id) return;
    const was = state.mode;
    state.mode = id;
    $$('#modes .mode').forEach(b => b.setAttribute('aria-selected', String(b.dataset.mode === id)));
    const m = MODES.find(x => x.id === id);
    $('#m-mode').textContent = m.name;
    say(m.name.toLowerCase() + ', ' + m.blurb);

    peerBox.hidden = id !== 'arche';
    if (id === 'arche') {
      camera.flyTo({ x: 96, y: 12, z: -16 }, 292, { dur: 1.7, phi: 0.20 });
      paintPeer();
    } else if (was === 'arche') {
      camera.frameAll();
    }
    breathe(0.9);
    camera.nudge();
  }

  function buildCats() {
    const ul = $('#cats');
    ul.innerHTML = '';
    if (!data.categories.length) {
      ul.appendChild(el('li', { class: 'kept-none', text: 'no domains yet' }));
      return;
    }
    data.categories.forEach(c => {
      const meter = el('span', { class: 'meter' });
      const n = Math.max(3, Math.round((c.count / data.maxCat) * 18));
      for (let i = 0; i < 18; i++) meter.appendChild(el('i', { class: i < n ? 'on' : '' }));

      const b = el('button', {
        class: 'cat', type: 'button', 'data-cat': c.id,
        'aria-pressed': String(!state.off.has(c.id)),
        title: c.station === 'APOLLO' ? 'Apollo · ' + c.name : c.name
      }, [
        el('span', { class: 'cat-name', text: c.name }),
        el('span', { class: 'cat-n num', text: String(c.count).padStart(2, '0') }),
        meter
      ]);
      if (c.station === 'APOLLO') b.classList.add('peerdom');

      b.addEventListener('click', e => {
        if (e.shiftKey) solo(c.id);
        else toggleCat(c.id);
      });
      ul.appendChild(el('li', null, [b]));
    });
    paintCats();
  }

  function paintCats() {
    $$('#cats .cat').forEach(b => b.setAttribute('aria-pressed', String(!state.off.has(b.dataset.cat))));
    $('#cats-all').textContent = state.off.size ? 'ALL' : 'NONE';
    store.set('off', Array.from(state.off));
    gl.markDirty();
  }

  function toggleCat(id) {
    if (state.off.has(id)) state.off.delete(id); else state.off.add(id);
    paintCats();
    const on = data.categories.length - state.off.size;
    say(on + ' of ' + data.categories.length + ' domains showing');
    breathe(0.5);
  }

  function solo(id) {
    const only = state.off.size === data.categories.length - 1 && !state.off.has(id);
    state.off.clear();
    if (!only) data.categories.forEach(c => { if (c.id !== id) state.off.add(c.id); });
    paintCats();
    say(only ? 'all domains showing' : 'isolated: ' + id);
    breathe(0.6);
  }

  function allCats() {
    if (state.off.size) state.off.clear();
    else data.categories.forEach(c => state.off.add(c.id));
    paintCats();
    say(state.off.size ? 'all domains hidden' : 'all domains showing');
  }

  function isFav(nd) { return state.favourites.has(nd.slug); }

  function toggleFav(id) {
    const nd = data.nodes[id];
    if (!nd) return;
    if (state.favourites.has(nd.slug)) {
      state.favourites.delete(nd.slug);
      say('released, ' + data.titleOf(nd).toLowerCase());
    } else {
      state.favourites.add(nd.slug);
      say('kept, ' + data.titleOf(nd).toLowerCase());
    }
    store.set('fav', Array.from(state.favourites));
    paintKept();
    if (state.selected === id) paintFavBtn(nd);
    gl.markDirty();
    breathe(0.5);
  }

  function paintFavBtn(nd) {
    const b = $('#p-fav');
    const on = isFav(nd);
    b.setAttribute('aria-pressed', String(on));
    b.textContent = on ? '✓ KEPT' : '+ KEEP';
  }

  function paintKept() {
    const ul = $('#kept');
    ul.innerHTML = '';
    const list = Array.from(state.favourites)
      .map(s => data.bySlug.get(s))
      .filter(Boolean);

    $('#fav-n').textContent = String(list.length).padStart(2, '0');
    $('#fav-only').setAttribute('aria-pressed', String(state.favOnly));

    if (!list.length) {
      ul.appendChild(el('li', { class: 'kept-none', text: data.empty ? 'nothing to keep yet' : 'press K on a note to keep it' }));
      return;
    }
    list.slice(0, 8).forEach(nd => {
      const li = el('li', { class: 'kept-row' }, [
        el('button', { class: 'kept-go', type: 'button', text: data.titleOf(nd) }),
        el('button', { class: 'kept-x', type: 'button', 'aria-label': 'Release', text: '×' })
      ]);
      li.children[0].addEventListener('click', () => select(nd.id));
      li.children[0].addEventListener('mouseenter', () => hover(nd.id));
      li.children[0].addEventListener('mouseleave', () => hover(null));
      li.children[1].addEventListener('click', () => toggleFav(nd.id));
      ul.appendChild(li);
    });
    if (list.length > 8) {
      ul.appendChild(el('li', { class: 'kept-none', text: '+ ' + (list.length - 8) + ' more' }));
    }
  }

  function toggleFavOnly() {
    state.favOnly = !state.favOnly;
    if (state.favOnly && !state.favourites.size) {
      state.favOnly = false;
      say('nothing kept yet, press K on a note');
    } else {
      say(state.favOnly ? 'showing kept notes only' : 'showing everything');
    }
    paintKept();
    gl.markDirty();
    breathe(0.6);
  }

  function toggleIsolate(id) {
    const target = id == null ? state.selected : id;
    if (target == null) return;
    state.isolated = state.isolated === target ? null : target;
    $('#p-iso').setAttribute('aria-pressed', String(state.isolated != null));
    gl.markDirty();
    say(state.isolated != null
      ? 'isolated, ' + data.titleOf(data.nodes[target]).toLowerCase() + ' and its neighbours'
      : 'neighbourhood released');
    breathe(0.7);
  }

  function hover(id) {
    if (state.hovered === id) return;
    state.hovered = id;
    const cv = $('#gl');
    if (cv) cv.classList.toggle('over-node', id != null);
  }

  function select(id, opts) {
    const o = opts || {};
    if (id == null) {
      state.selected = null;
      state.isolated = null;
      panel.hidden = true;
      $('#reticle').classList.remove('locked');
      gl.markDirty();
      say('lock released');
      return;
    }
    state.selected = id;
    cyclePos = -1;
    renderPanel(data.nodes[id]);
    panel.hidden = false;
    $('#reticle').classList.add('locked');
    if (o.fly !== false) camera.flyTo(gl.worldOf(id), o.dist || 52);
    breathe(0.8);
  }

  function renderPanel(nd) {
    const sealed = nd.sealed && state.peer !== 'open';

    $('#p-domain').textContent = nd.domainName;
    $('#p-title').textContent = data.titleOf(nd);
    $('#p-slug').textContent = (nd.sealed ? nd.station.toLowerCase() + ':' : '') + nd.slug + '.md';
    panel.classList.toggle('sealed', sealed);

    const kind = $('#p-vis'), st = $('#p-status');
    kind.textContent = sealed ? '...' : (nd.type ? nd.type.toUpperCase() : 'NOTE');
    kind.className = !sealed && nd.featured ? 'hot' : '';
    st.textContent = sealed ? 'UNVERIFIED' : (nd.stage ? nd.stage.toUpperCase() : 'UNSTAGED');
    st.className = !sealed && nd.stage === 'giant' ? 'hot' : '';
    $('#p-deg').textContent = String(nd.deg).padStart(2, '0');
    $('#p-station').textContent = nd.station;
    $('#p-abstract').textContent = data.abstractOf(nd);

    const open = $('#p-open');
    open.hidden = sealed || !nd.url;
    if (!open.hidden) open.href = nd.url;

    paintFavBtn(nd);
    $('#p-iso').setAttribute('aria-pressed', String(state.isolated === nd.id));

    fillLinks($('#p-links'), nd.links, 'link');
    $('#p-lk-n').textContent = String(nd.links.length).padStart(2, '0');
    fillLinks($('#p-loose'), nd.loose, 'loose');
  }

  function fillLinks(ul, ids, kind) {
    ul.innerHTML = '';
    if (!ids.length) {
      ul.appendChild(el('li', { class: 'dim', text: kind === 'loose' ? 'the map has not written any suggestions yet' : 'no links yet' }));
      return;
    }
    ids.slice(0, 8).forEach(id => {
      const nd = data.nodes[id];
      const li = el('li', { tabindex: '0', role: 'button' }, [
        el('span', { class: 't', text: data.titleOf(nd) }),
        el('span', { class: 'w', text: nd.domainName.slice(0, 3) })
      ]);
      const go = () => select(id);
      li.addEventListener('click', go);
      li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      li.addEventListener('mouseenter', () => hover(id));
      li.addEventListener('mouseleave', () => hover(null));
      ul.appendChild(li);
    });
  }

  function peerSteps() {
    const n = data.stats.apollo;
    return [
      ['fetch arche.json', 'ok', 520],
      ['manifest ' + n + ' records', 'ok', 420],
      ['sha-256 every byte', 'match', 700],
      ['schema arche/1', 'valid', 380],
      ['scan for private leaks', 'none', 540],
      ['mirror the station', 'clean', 420]
    ];
  }

  function paintPeer() {
    const s = state.peer;
    const n = data.stats.apollo;
    const name = data.peerName || '';

    $('#peer-name').textContent = name ? name : 'NO STATION MIRRORED';
    $('#peer-state').textContent = !n ? 'NONE' : s === 'open' ? 'OPEN' : s === 'linking' ? 'LINKING' : 'SEALED';
    $('#m-net').textContent = !n ? 'NONE' : s === 'open' ? 'MIRROR OPEN' : s === 'linking' ? 'VERIFYING' : 'SEALED';
    peerBox.classList.toggle('open', s === 'open' && !!n);

    const btn = $('#peer-btn');
    btn.disabled = !n || s === 'linking';
    btn.children[1].textContent = s === 'open' ? 'SEAL THE LINK' : 'OPEN THE LINK';
    $('#peer-copy').textContent = !n
      ? 'No peer station is mirrored yet. When one is, its records sit here unreadable until every byte checks against its manifest.'
      : s === 'open'
        ? n + ' records verified against the manifest. Their titles, their summaries, and the links between the two vaults are readable.'
        : n + ' records held in the mirror, unverified. Their data is untrusted input until every byte checks against their manifest.';
  }

  function openLink() {
    if (state.peer === 'linking') return;
    if (!data.stats.apollo) return;
    if (state.peer === 'open') {
      state.peer = 'sealed';
      store.set('peer', 'sealed');
      $('#peer-log').textContent = '';
      paintPeer();
      refreshOpenViews();
      say('link sealed, the peer is a mirror again');
      return;
    }

    state.peer = 'linking';
    paintPeer();
    const log = $('#peer-log');
    log.textContent = '';
    breathe(1);

    const steps = peerSteps();
    let i = 0;
    (function step() {
      if (i >= steps.length) {
        state.peer = 'open';
        store.set('peer', 'open');
        log.textContent += '\nlink open, ' + data.stats.apollo + ' records readable';
        paintPeer();
        refreshOpenViews();
        say('arche link open, the mirrored vault is readable');
        breathe(1);
        camera.flyTo({ x: 150, y: 10, z: -22 }, 210, { dur: 1.9 });
        return;
      }
      const [label, result, wait] = steps[i++];
      const dots = '.'.repeat(Math.max(3, 30 - label.length));
      log.textContent += (log.textContent ? '\n' : '') + label + ' ' + dots + ' ' + result;
      setTimeout(step, wait);
    })();
  }

  function refreshOpenViews() {
    gl.markDirty();
    paintKept();
    if (state.selected != null) renderPanel(data.nodes[state.selected]);
    if (state.query) runQuery(state.query);
  }

  function cycle(dir) {
    if (!cycleOrder || cyclePos < 0) {
      cycleOrder = data.nodes.map((n, i) => i)
        .filter(i => gl.screenOf(i).on)
        .sort((a, b) => data.nodes[b].deg - data.nodes[a].deg);
      if (!cycleOrder.length) return;
      cyclePos = 0;
    } else {
      cyclePos = (cyclePos + dir + cycleOrder.length) % cycleOrder.length;
    }
    const id = cycleOrder[cyclePos];
    state.selected = id;
    renderPanel(data.nodes[id]);
    panel.hidden = false;
    $('#reticle').classList.add('locked');
    camera.flyTo(gl.worldOf(id), 58, { dur: 0.6 });
    say(data.titleOf(data.nodes[id]).toLowerCase());
  }

  function closeSearch() { searchBox.hidden = true; qInput.blur(); }

  function clearMatches() {
    state.matches = null;
    state.query = '';
    gl.markDirty();
    say('filter cleared, ' + data.stats.nodes + ' notes live');
  }

  function runQuery(q) {
    state.query = q;
    findHits = q.trim().length > 1 ? data.find(q, 12) : [];
    findIdx = 0;
    results.innerHTML = '';

    if (!q.trim().length) {
      state.matches = null;
      gl.markDirty();
      results.appendChild(el('li', { class: 'find-empty', text: data.empty ? 'nothing published yet, so there is nothing to find' : 'a word from a title, a summary or a tag' }));
      return;
    }
    if (!findHits.length) {
      state.matches = null;
      gl.markDirty();
      results.appendChild(el('li', { class: 'find-empty', text: 'nothing close enough on this page. the map that reads by meaning runs on my computer.' }));
      return;
    }

    state.matches = new Set(findHits.map(h => h.node.id));
    gl.markDirty();
    const top = findHits[0].score || 1;
    findHits.forEach((h, i) => {
      const li = el('li', { role: 'option', 'aria-selected': String(i === 0) }, [
        el('span', { class: 't', text: data.titleOf(h.node) }),
        el('span', { class: 'g', text: h.node.domainName }),
        el('span', { class: 's num', text: (h.score / top).toFixed(3) })
      ]);
      li.addEventListener('click', () => { findIdx = i; commitQuery(); });
      li.addEventListener('mouseenter', () => { findIdx = i; paintHits(); hover(h.node.id); });
      results.appendChild(li);
    });
    say(findHits.length + ' notes near "' + q.trim() + '", esc clears');
  }

  function paintHits() {
    $$('#find-results li').forEach((li, i) => li.setAttribute('aria-selected', String(i === findIdx)));
    const sel = results.children[findIdx];
    if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest' });
  }

  function commitQuery() {
    const h = findHits[findIdx];
    if (!h) return;
    closeSearch();
    select(h.node.id);
  }

  const SHEET = [
    ['NAVIGATE', [
      [['DRAG'], 'orbit the lattice'],
      [['SHIFT', 'DRAG'], 'pan the target'],
      [['WHEEL'], 'dolly in and out'],
      [['W', 'A', 'S', 'D'], 'orbit by keyboard'],
      [['R', 'F'], 'dolly'],
      [['Q', 'E'], 'roll the horizon'],
      [['SHIFT'], 'hold to boost'],
      [['SPACE'], 'auto-orbit on / off'],
      [['C'], 'recentre on the whole vault']
    ]],
    ['NOTES', [
      [['CLICK'], 'lock a note'],
      [['TAB'], 'cycle by degree'],
      [['K'], 'keep, or release'],
      [['I'], 'isolate its neighbourhood'],
      [['ENTER'], 'fly to the locked note'],
      [['ESC'], 'release, or clear a filter']
    ]],
    ['READ MODE', MODES.map(m => [[m.key], m.name.toLowerCase() + ', ' + m.blurb])],
    ['STATION', [
      [['/'], 'find a note by meaning'],
      [['A'], 'ask the station'],
      [['O'], 'optics'],
      [['H'], 'hide the interface'],
      [['M'], 'mute'],
      [['[', ']'], 'volume down / up'],
      [['?'], 'this sheet']
    ]]
  ];

  function buildSheet() {
    const root = $('#help-cols');
    root.innerHTML = '';
    SHEET.forEach(([title, rows]) => {
      const g = el('div', { class: 'sheet-group' }, [el('h3', { text: title })]);
      rows.forEach(([keys, desc]) => {
        const kb = el('span', { class: 'kb' });
        keys.forEach(k => kb.appendChild(el('kbd', { text: k })));
        g.appendChild(el('div', { class: 'sheet-row' }, [kb, el('span', { class: 'desc', text: desc })]));
      });
      root.appendChild(g);
    });
  }

  const OPTS = [
    ['bloom', 'Bloom', 'the halo around anything bright'],
    ['trails', 'Phosphor trails', 'the frame decays instead of clearing'],
    ['grain', 'Grain', 'film noise across the whole plate'],
    ['haze', 'Haze', 'the slow smoke between you and the far notes'],
    ['dust', 'Dust field', 'points of weather around the lattice'],
    ['grid', 'Ground grid', 'the reference plane under the lattice'],
    ['video', 'Backdrop', 'the looping film behind everything']
  ];

  function buildOpts() {
    const root = $('#opts');
    root.innerHTML = '';

    const row = (name, hint, get, set) => {
      const sw = el('button', { class: 'sw', type: 'button', 'aria-pressed': String(get()) });
      sw.textContent = get() ? 'ON' : 'OFF';
      sw.addEventListener('click', () => {
        set(!get());
        sw.setAttribute('aria-pressed', String(get()));
        sw.textContent = get() ? 'ON' : 'OFF';
        applyOptics();
      });
      root.appendChild(el('div', { class: 'opt' }, [
        el('div', null, [el('span', { class: 'lab', text: name }), el('span', { class: 'hint', text: hint })]),
        sw
      ]));
    };

    OPTS.forEach(([key, name, hint]) =>
      row(name, hint, () => !!state.optics[key], v => { state.optics[key] = v; }));
    row('Auto-orbit', 'drift when the station is left alone',
      () => state.autoOrbit, v => { state.autoOrbit = v; });

    const names = backdrop.names;
    if (names.length) {
      const pick = el('button', { class: 'sw wide', type: 'button', text: (backdrop.key || 'NONE').toUpperCase() });
      pick.addEventListener('click', () => {
        const at = names.indexOf(backdrop.key);
        const next = names[(at + 1) % names.length];
        if (backdrop.pick(next)) pick.textContent = next.toUpperCase();
      });
      root.appendChild(el('div', { class: 'opt' }, [
        el('div', null, [
          el('span', { class: 'lab', text: 'Which backdrop' }),
          el('span', { class: 'hint', text: names.length + ' loops, or ?bg= in the address' })
        ]),
        pick
      ]));
    }

    const replay = el('button', { class: 'sw wide', type: 'button', text: 'PLAY' });
    replay.addEventListener('click', () => { closeScrims(); bus.emit('replay-intro'); });
    root.appendChild(el('div', { class: 'opt' }, [
      el('div', null, [
        el('span', { class: 'lab', text: 'Arrival sequence' }),
        el('span', { class: 'hint', text: 'what ASTRA is, from the first light' })
      ]),
      replay
    ]));
  }

  function applyOptics() {
    $('#film-grain').hidden = !state.optics.grain;
    store.set('optics', state.optics);
    bus.emit('optics', state.optics);
  }

  const scrims = () => [searchBox, helpBox, setBox, askBox];
  const anyScrimOpen = () => scrims().some(s => !s.hidden);
  function closeScrims() {

    const a = document.activeElement;
    if (a && a.closest && a.closest('.scrim')) a.blur();
    scrims().forEach(s => { s.hidden = true; });
    qInput.blur();
  }

  function toggleScrim(box) {
    const open = box.hidden;
    closeScrims();
    box.hidden = !open;
    if (open) {
      if (box === searchBox) { qInput.focus(); qInput.select(); runQuery(qInput.value); }
      if (box === askBox) ask.open();
    }
  }

  const typing = t => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);

  function onKey(e) {
    if (state.phase === 'intro') {
      if (intro.key(e)) e.preventDefault();
      return;
    }

    const k = e.key;

    if (typing(e.target)) {
      if (k === 'Escape') { e.preventDefault(); closeScrims(); }
      else if (e.target === qInput) {
        if (k === 'ArrowDown') { e.preventDefault(); findIdx = Math.min(findHits.length - 1, findIdx + 1); paintHits(); }
        else if (k === 'ArrowUp') { e.preventDefault(); findIdx = Math.max(0, findIdx - 1); paintHits(); }
        else if (k === 'Enter') { e.preventDefault(); commitQuery(); }
      }
      return;
    }

    if (k === 'Escape') {
      if (anyScrimOpen()) closeScrims();
      else if (state.isolated != null) toggleIsolate(state.isolated);
      else if (state.matches) clearMatches();
      else if (state.favOnly) toggleFavOnly();
      else if (state.selected != null) select(null);
      return;
    }

    if (k === 'Tab') { e.preventDefault(); cycle(e.shiftKey ? -1 : 1); return; }

    if (k === '/' && !e.shiftKey) { e.preventDefault(); toggleScrim(searchBox); return; }
    if (k === '?' || (k === '/' && e.shiftKey)) { e.preventDefault(); toggleScrim(helpBox); return; }
    if (k === 'f' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); toggleScrim(searchBox); return; }
    if (e.metaKey || e.ctrlKey) return;

    const lower = k.toLowerCase();

    if (lower === 'a') { toggleScrim(askBox); return; }
    if (lower === 'o') { toggleScrim(setBox); return; }
    if (lower === 'k') { if (state.selected != null) toggleFav(state.selected); return; }
    if (lower === 'i') { toggleIsolate(null); return; }
    if (lower === 'h') {
      state.hudVisible = !state.hudVisible;
      $('#hud').classList.toggle('hidden', !state.hudVisible);
      say(state.hudVisible ? 'interface up' : 'interface down, h to restore');
      return;
    }
    if (lower === 'm') { audio.mute(); return; }
    if (k === '[') { audio.bump(-8); return; }
    if (k === ']') { audio.bump(8); return; }
    if (lower === 'c') { camera.frameAll(); select(null); say('framed: the whole vault'); return; }
    if (k === ' ') {
      e.preventDefault();
      state.autoOrbit = !state.autoOrbit;
      say(state.autoOrbit ? 'auto-orbit engaged' : 'auto-orbit held');
      buildOpts();
      return;
    }
    if (k === 'Enter' && state.selected != null) { camera.flyTo(gl.worldOf(state.selected), 34); return; }

    const m = MODES.find(x => x.key === k);
    if (m) setMode(m.id);
  }

  const placed = [];

  function labelSet(W, H) {
    const items = [];
    const want = [];

    if (state.selected != null) want.push({ id: state.selected, sel: true });
    if (state.hovered != null && state.hovered !== state.selected) want.push({ id: state.hovered, hot: true });

    if (state.selected != null) {
      data.nodes[state.selected].links.slice(0, 4).forEach(id => {
        if (!want.some(w => w.id === id)) want.push({ id: id });
      });
    } else if (state.matches) {
      let n = 0;
      for (const id of state.matches) {
        if (n++ >= 5) break;
        if (!want.some(w => w.id === id)) want.push({ id: id });
      }
    } else {
      const cand = [];
      for (let i = 0; i < data.nodes.length; i++) {
        const s = gl.screenOf(i);
        if (!s.on) continue;
        if (s.x < W * 0.16 || s.x > W * 0.84 || s.y < H * 0.18 || s.y > H * 0.82) continue;
        cand.push(i);
      }

      cand.sort((a, b) => {
        const fa = state.favourites.has(data.nodes[a].slug) ? 1 : 0;
        const fb = state.favourites.has(data.nodes[b].slug) ? 1 : 0;
        return (fb - fa) || (data.nodes[b].deg - data.nodes[a].deg);
      });
      cand.slice(0, 4).forEach(id => want.push({ id: id }));
    }

    placed.length = 0;
    for (const w of want) {
      const s = gl.screenOf(w.id);
      if (!s.on || s.x < 8 || s.x > W - 8 || s.y < 8 || s.y > H - 8) continue;

      let rise = 0;
      for (let guard = 0; guard < 8; guard++) {
        const y = s.y - rise;
        if (!placed.some(p => Math.abs(p.y - y) < 20 && Math.abs(p.x - s.x) < 190)) break;
        rise += 22;
      }
      placed.push({ x: s.x, y: s.y - rise });

      const nd = data.nodes[w.id];
      items.push({
        x: s.x, y: s.y, rise: rise,
        title: data.titleOf(nd),
        domain: nd.station === 'APOLLO' ? 'APOLLO' : nd.domainName,
        fav: state.favourites.has(nd.slug),
        hot: !!w.hot, sel: !!w.sel
      });
      if (items.length >= (W < 620 ? 2 : 8)) break;
    }
    return items;
  }

  function init() {
    panel = $('#panel');
    searchBox = $('#search');
    qInput = $('#q');
    results = $('#find-results');
    helpBox = $('#help');
    setBox = $('#settings');
    askBox = $('#ask');
    peerBox = $('#peer');

    buildModes();
    buildCats();
    buildSheet();
    buildOpts();
    paintKept();
    paintPeer();
    applyOptics();

    $('#t-nodes').textContent = String(data.stats.nodes).padStart(3, '0');
    $('#t-links').textContent = String(data.stats.links).padStart(3, '0');
    $('#t-loose').textContent = String(data.stats.loose).padStart(3, '0');
    $('#t-public').textContent = String(data.stats.pub).padStart(3, '0');

    $('#p-close').addEventListener('click', () => select(null));
    $('#p-fav').addEventListener('click', () => { if (state.selected != null) toggleFav(state.selected); });
    $('#p-iso').addEventListener('click', () => toggleIsolate(null));
    $('#cats-all').addEventListener('click', allCats);
    $('#fav-only').addEventListener('click', toggleFavOnly);
    $('#peer-btn').addEventListener('click', openLink);
    qInput.addEventListener('input', () => runQuery(qInput.value));

    $('#t-find').addEventListener('click', () => toggleScrim(searchBox));
    $('#t-ask').addEventListener('click', () => toggleScrim(askBox));
    $('#t-keys').addEventListener('click', () => toggleScrim(helpBox));
    $('#t-opt').addEventListener('click', () => toggleScrim(setBox));

    $$('.scrim').forEach(s => {
      s.addEventListener('pointerdown', e => { if (e.target === s) closeScrims(); });
    });

    bus.on('pointer', p => {
      if (!gl.ready || anyScrimOpen() || state.phase !== 'station') return;
      hover(gl.pickAt(p.x, p.y, 20));
    });
    bus.on('click', p => {
      if (!gl.ready || state.phase !== 'station') return;
      const id = gl.pickAt(p.x, p.y, 22);
      if (id != null) select(id);
      else if (state.selected != null) select(null);
    });
    bus.on('goto-node', id => { closeScrims(); select(id); });

    window.addEventListener('keydown', onKey);
  }

  return { init, setMode, select, hover, labelSet, toggleFav, paintPeer, closeScrims };
})();
