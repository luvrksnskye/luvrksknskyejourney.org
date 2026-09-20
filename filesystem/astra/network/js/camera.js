import { state, bus, clamp, damp, lerp, smooth, shortAngle, TAU } from './core.js?v=1';

export const camera = (function () {
  'use strict';


  const EL_MIN = -1.42, EL_MAX = 1.42;
  const D_MIN = 14, D_MAX = 420;

  const rig = {
    theta: 0.62,
    phi: 0.26,
    dist: 196,
    target: { x: 0, y: 0, z: 0 },
    pos: { x: 0, y: 0, z: 0 },
    fov: 46,
    roll: 0
  };

  const want = {
    theta: rig.theta, phi: rig.phi, dist: rig.dist,
    target: { x: 0, y: 0, z: 0 }, fov: 46, roll: 0
  };

  const vel = { theta: 0, phi: 0, dist: 0 };
  const keys = Object.create(null);

  let flight = null;
  let idle = 0;
  let canvas = null;
  let W = 1, H = 1;
  const drag = { on: false, id: null, pan: false, x: 0, y: 0, moved: 0 };
  const pinch = { on: false, d0: 0, dist0: 0 };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  function attach(cv) {
    canvas = cv;
    resize();

    cv.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    cv.addEventListener('wheel', onWheel, { passive: false });
    cv.addEventListener('contextmenu', e => e.preventDefault());

    cv.addEventListener('touchstart', onTouch, { passive: false });
    cv.addEventListener('touchmove', onTouch, { passive: false });
    cv.addEventListener('touchend', () => { pinch.on = false; }, { passive: true });

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
    window.addEventListener('resize', resize, { passive: true });
  }

  function resize() {
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
  }

  function onDown(e) {
    if (e.button === 1) return;
    drag.on = true; drag.id = e.pointerId;
    drag.pan = e.button === 2 || e.shiftKey;
    drag.x = e.clientX; drag.y = e.clientY; drag.moved = 0;
    canvas.classList.add('dragging');
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    idle = 0;
  }

  function onMove(e) {
    const r = canvas.getBoundingClientRect();
    bus.emit('pointer', { x: e.clientX - r.left, y: e.clientY - r.top, W: r.width, H: r.height });

    if (!drag.on || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    idle = 0;

    if (drag.pan) {
      panBy(-dx, dy);
    } else {
      want.theta -= dx * 0.0042;
      want.phi = clamp(want.phi + dy * 0.0034, EL_MIN, EL_MAX);
      vel.theta = -dx * 0.0016;
      vel.phi = dy * 0.0012;
    }
    flight = null;
    e.preventDefault();
  }

  function onUp(e) {
    if (!drag.on) return;
    canvas.classList.remove('dragging');
    const wasClick = drag.moved < 6;
    drag.on = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    if (wasClick && !drag.pan) {
      const r = canvas.getBoundingClientRect();
      bus.emit('click', { x: e.clientX - r.left, y: e.clientY - r.top });
    }
  }

  function onWheel(e) {
    e.preventDefault();
    const step = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    want.dist = clamp(want.dist * (1 + clamp(step, -220, 220) * 0.0012), D_MIN, D_MAX);
    flight = null;
    idle = 0;
  }

  function onTouch(e) {
    if (e.touches.length === 2) {
      const a = e.touches[0], b = e.touches[1];
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      if (!pinch.on) { pinch.on = true; pinch.d0 = d; pinch.dist0 = want.dist; }
      else if (pinch.d0 > 0) {
        want.dist = clamp(pinch.dist0 * (pinch.d0 / Math.max(1, d)), D_MIN, D_MAX);
      }
      drag.on = false;
      flight = null;
      idle = 0;
      e.preventDefault();
    } else {
      pinch.on = false;
    }
  }

  function panBy(dx, dy) {
    const s = want.dist * 0.0016;
    const ct = Math.cos(rig.theta), st = Math.sin(rig.theta);
    want.target.x += (-ct * dx) * s;
    want.target.z += (st * dx) * s;
    want.target.y += dy * s;
    const lim = 260;
    want.target.x = clamp(want.target.x, -lim, lim);
    want.target.y = clamp(want.target.y, -lim, lim);
    want.target.z = clamp(want.target.z, -lim, lim);
  }

  function onKeyDown(e) {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (['w', 'a', 's', 'd', 'q', 'e', 'r', 'f', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(k) > -1) {
      if (!isTyping(e.target)) { e.preventDefault(); idle = 0; }
    }
  }
  function isTyping(t) {
    return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  }

  function flyTo(p, dist, opts) {
    const o = opts || {};
    const dur = reduced.matches ? 0.01 : (o.dur || 1.05);
    const nextTheta = o.theta != null ? o.theta : rig.theta + shortAngle(rig.theta, Math.atan2(p.x, p.z) + 0.85);
    flight = {
      t: 0, dur: dur,
      from: {
        theta: rig.theta, phi: rig.phi, dist: rig.dist,
        x: rig.target.x, y: rig.target.y, z: rig.target.z
      },
      to: {
        theta: nextTheta,
        phi: o.phi != null ? o.phi : clamp(0.20 + (p.y / 160), EL_MIN, EL_MAX),
        dist: clamp(dist == null ? 46 : dist, D_MIN, D_MAX),
        x: p.x, y: p.y, z: p.z
      }
    };
    idle = 0;
  }

  function frameAll() {
    flight = null;
    want.target.x = want.target.y = want.target.z = 0;
    want.dist = 152;
    want.phi = 0.26;
    idle = 0;
  }

  function update(dt) {
    const boost = keys['shift'] ? 2.6 : 1;

    const ox = (keys['a'] || keys['arrowleft'] ? 1 : 0) - (keys['d'] || keys['arrowright'] ? 1 : 0);
    const oy = (keys['w'] || keys['arrowup'] ? 1 : 0) - (keys['s'] || keys['arrowdown'] ? 1 : 0);
    const oz = (keys['f'] ? 1 : 0) - (keys['r'] ? 1 : 0);

    if (ox || oy || oz) { flight = null; idle = 0; }
    want.theta += ox * 1.25 * boost * dt;
    want.phi = clamp(want.phi - oy * 0.85 * boost * dt, EL_MIN, EL_MAX);
    want.dist = clamp(want.dist * (1 + oz * 1.15 * boost * dt), D_MIN, D_MAX);

    const rl = (keys['q'] ? 1 : 0) - (keys['e'] ? 1 : 0);
    if (rl) { want.roll = clamp(want.roll + rl * 0.55 * dt, -0.42, 0.42); idle = 0; }
    else want.roll = damp(want.roll, 0, 1.6, dt);

    if (!drag.on) {
      want.theta += vel.theta;
      want.phi = clamp(want.phi + vel.phi, EL_MIN, EL_MAX);
      vel.theta *= 0.90;
      vel.phi *= 0.90;
      if (Math.abs(vel.theta) < 1e-5) vel.theta = 0;
      if (Math.abs(vel.phi) < 1e-5) vel.phi = 0;
    }

    idle += dt;
    if (state.autoOrbit && !reduced.matches && idle > 3.2 && !flight) {
      want.theta += 0.026 * dt * Math.min(1, (idle - 3.2) * 0.5);
    }

    if (flight) {
      flight.t += dt;
      const t = smooth(clamp(flight.t / flight.dur, 0, 1));
      const f = flight.from, g = flight.to;
      want.theta = lerp(f.theta, g.theta, t);
      want.phi = lerp(f.phi, g.phi, t);
      want.dist = lerp(f.dist, g.dist, t);
      want.target.x = lerp(f.x, g.x, t);
      want.target.y = lerp(f.y, g.y, t);
      want.target.z = lerp(f.z, g.z, t);
      if (flight.t >= flight.dur) flight = null;
    }

    const L = 9.5;
    rig.theta = damp(rig.theta, want.theta, L, dt);
    rig.phi = damp(rig.phi, want.phi, L, dt);
    rig.dist = damp(rig.dist, want.dist, L * 0.72, dt);
    rig.roll = damp(rig.roll, want.roll, L, dt);
    rig.target.x = damp(rig.target.x, want.target.x, L * 0.8, dt);
    rig.target.y = damp(rig.target.y, want.target.y, L * 0.8, dt);
    rig.target.z = damp(rig.target.z, want.target.z, L * 0.8, dt);

    const bt = performance.now() * 0.00013;
    const br = reduced.matches ? 0 : 1;
    const bx = Math.sin(bt * 1.7) * 0.5 + Math.sin(bt * 0.9) * 0.3;
    const by = Math.cos(bt * 1.3) * 0.4;

    want.fov = 44 + clamp((rig.dist - 40) / 380, 0, 1) * 6;
    rig.fov = damp(rig.fov, want.fov, 3.2, dt);

    const cp = Math.cos(rig.phi), sp = Math.sin(rig.phi);
    rig.pos.x = rig.target.x + Math.sin(rig.theta) * cp * rig.dist + bx * br;
    rig.pos.y = rig.target.y + sp * rig.dist + by * br;
    rig.pos.z = rig.target.z + Math.cos(rig.theta) * cp * rig.dist;

    return rig;
  }

  return {
    rig, want, attach, update, flyTo, frameAll, resize,
    get idle() { return idle; },
    nudge() { idle = 0; },
    setDistance(d) { want.dist = clamp(d, D_MIN, D_MAX); },
    get keys() { return keys; }
  };
})();
