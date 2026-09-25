import { $, el, state, store, bus, clamp, deg, met, say, breathe, makeGrain } from './core.js?v=2';
import { data } from './vault.js?v=2';
import { gl } from './gl.js?v=2';
import { hud } from './hud.js?v=2';
import { camera } from './camera.js?v=2';
import { audio } from './audio.js?v=2';
import { ask } from './ask.js?v=2';
import { intro } from './intro.js?v=2';
import { ui } from './ui.js?v=2';
import { backdrop } from './backdrop.js?v=2';

(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { state.optics.trails = false; state.autoOrbit = false; }

  const t0 = performance.now();
  let last = t0, fps = 60, frames = 0, fpsAcc = 0, glReady = false;
  let grainNode = null, grainT = 0;
  let stageNode = null, stageW = 1, stageH = 1;
  let graphFound = false;

  const S = data.stats;

  function logRow(out, label, value, tone) {
    const line = el('span', { class: 'bl' + (tone ? ' bl-' + tone : '') });
    line.appendChild(el('span', { class: 'bl-k', text: label }));
    if (value != null) {
      line.appendChild(el('span', { class: 'bl-dots', 'aria-hidden': 'true' }));
      line.appendChild(el('b', { text: String(value) }));
    }
    out.appendChild(line);
    out.scrollTop = out.scrollHeight;
  }

  function bootLines() {
    const rows = [
      ['station 01 · skye journey', 'v0.5.0', null, 110],
      ['read the published graph', graphFound ? 'ok' : 'missing', null, 220],
      ['notes', String(S.astra).padStart(3, '0'), null, 150],
      ['links', String(S.links).padStart(3, '0'), null, 130],
      ['close pairs, never linked', String(S.loose).padStart(3, '0'), null, 150],
      ['mirrored stations', S.apollo ? S.apollo + ' sealed' : 'none', null, 230]
    ];
    if (!S.nodes) rows.push(['nothing is published yet, so the lattice is empty', null, 'note', 240]);
    else rows.push([S.pub + ' of ' + S.astra + ' notes are listed on the blog', null, 'note', 240]);
    return rows;
  }

  function typeLog() {
    const out = $('#boot-log');
    const engage = $('#engage');
    const note = $('#boot-note');
    if (!out) return;

    let shown = false;
    function reveal() {
      if (shown) return;
      shown = true;
      engage.hidden = false;
      note.hidden = false;
      engage.focus({ preventScroll: true });
    }
    setTimeout(reveal, reduced ? 60 : 2600);

    const rows = bootLines();
    let i = 0;
    (function next() {
      if (i >= rows.length) {
        logRow(out, 'lattice ready', null, 'done');
        reveal();
        return;
      }
      const [label, value, tone, wait] = rows[i++];
      logRow(out, label, value, tone);
      setTimeout(next, reduced ? 20 : wait);
    })();
  }

  let armed = false, gone = false;

  function armEngage() {
    if (armed) return;
    armed = true;
    $('#engage').addEventListener('click', go);
    window.addEventListener('keydown', onArmKey);
    const boot = $('#boot');
    boot.addEventListener('pointerup', go);
    boot.addEventListener('click', go);
  }

  function onArmKey(e) {
    if (gone || e.key === 'Tab') return;
    e.preventDefault();
    go();
  }

  function go() {
    if (gone) return;
    gone = true;
    window.removeEventListener('keydown', onArmKey);

    const b = $('#boot');
    b.classList.add('gone');
    setTimeout(() => { b.hidden = true; }, 560);

    state.booted = true;
    audio.play();

    if (!store.get('intro', 0) && gl.ready) startIntro();
    else enterStation(true);
  }

  function startIntro() {
    $('#hud').classList.add('pre');
    intro.start();
  }

  function enterStation(fly) {
    state.phase = 'station';
    bus.emit('phase', 'station');
    $('#hud').classList.remove('pre');
    $('#nothing').hidden = S.nodes > 0;
    if (fly) camera.flyTo({ x: 0, y: 0, z: 0 }, 128, { dur: reduced ? 0.01 : 2.4, phi: 0.22 });
    say(S.nodes
      ? S.astra + ' notes · ' + S.links + ' links'
      : 'the vault has nothing published yet');
    breathe(1);
  }

  bus.on('intro-done', () => enterStation(true));
  bus.on('replay-intro', () => {
    if (state.phase !== 'station') return;
    store.set('intro', 0);
    $('#nothing').hidden = true;
    startIntro();
  });
  bus.on('degraded', () => {
    say('dropped a layer to keep the frame steady');
  });

  function measure() {
    if (!stageNode) return;
    const r = stageNode.getBoundingClientRect();
    stageW = Math.max(1, r.width);
    stageH = Math.max(1, r.height);
  }

  const metrics = { fps: 60, dst: 0, azm: 0, elv: 0, fov: 46, energy: 0 };

  function loop(now) {
    requestAnimationFrame(loop);
    const dt = clamp((now - last) / 1000, 0.0005, 0.05);
    last = now;
    if (document.hidden) return;

    frames++; fpsAcc += dt;
    if (fpsAcc > 0.35) { fps = frames / fpsAcc; frames = 0; fpsAcc = 0; }

    if (state.phase === 'intro' && intro.running) {
      intro.update(dt);
      return;
    }

    const rig = camera.update(dt);

    if (glReady) {
      gl.frame(rig, dt);
      gl.degrade(fps, dt);
      hud.labels(ui.labelSet(stageW, stageH), stageW, stageH);
    }

    metrics.fps = fps;
    metrics.dst = rig.dist;
    metrics.azm = deg(rig.theta);
    metrics.elv = rig.phi * 180 / Math.PI;
    metrics.fov = rig.fov;
    metrics.energy = audio.energy();

    hud.update(metrics, dt, (now - t0) / 1000);

    const clock = $('#m-met');
    if (clock) clock.textContent = met(now - t0);

    if (grainNode && state.optics.grain) {
      grainT += dt;
      if (grainT > 0.05) {
        grainT = 0;
        grainNode.style.transform =
          'translate(' + ((Math.random() * 60) | 0) + 'px,' + ((Math.random() * 60) | 0) + 'px)';
      }
    }
  }

  async function start() {
    grainNode = $('#film-grain');
    stageNode = $('#stage');
    measure();
    window.addEventListener('resize', measure, { passive: true });
    document.documentElement.style.setProperty('--grain-src', 'url(' + makeGrain(180) + ')');

    say('reading the published graph');
    await data.load();
    graphFound = data.ok;

    hud.build();
    audio.init();
    ask.init();
    ui.init();

    const cv = $('#gl');
    camera.attach(cv);

    const ok = await gl.init(cv);
    if (!ok) {
      cv.hidden = true;
      $('#fallback2d').hidden = false;
      say('no webgl context, the index and the controls still work');
    } else {
      glReady = true;
      if (!store.get('intro', 0)) intro.prepare();
      await backdrop.init();
    }

    armEngage();
    requestAnimationFrame(loop);
    typeLog();
  }

  bus.on('audio', s => {
    if (s === 'absent' && state.booted && state.phase === 'station') {
      say('the track is missing from assets/audio');
    }
  });

  window.astra = { state: state, data: data, ask: ask, backdrop: backdrop, ui: ui };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
