import { $, bus, clamp, say } from './core.js?v=1';

export const audio = (function () {
  'use strict';


  let node = null, btn = null, ico = null, lab = null, vol = null, volN = null;
  let ctx = null, analyser = null, bins = null;
  let status = 'unknown';
  let level = 0;
  let wanted = false;

  function setStatus(next) {
    if (status === next) return;
    status = next;
    paint();
    bus.emit('audio', status);
  }

  function paint() {
    if (!btn) return;
    btn.classList.toggle('playing', status === 'playing');
    btn.classList.toggle('dead', status === 'absent');
    btn.disabled = status === 'absent';
    if (status === 'absent') { ico.textContent = '×'; lab.textContent = 'NO SIGNAL'; }
    else if (status === 'playing') { ico.textContent = '||'; lab.textContent = 'ASTRA THEME'; }
    else { ico.textContent = '>'; lab.textContent = 'PLAY'; }
  }

  function wireAnalyser() {
    if (analyser || !node) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
      const src = ctx.createMediaElementSource(node);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.82;
      bins = new Uint8Array(analyser.frequencyBinCount);
      src.connect(analyser);
      analyser.connect(ctx.destination);
    } catch (_) {

      analyser = null;
    }
  }

  function applyVolume(v) {
    const g = clamp(v, 0, 100) / 100;
    if (node) node.volume = g * g;
    if (volN) volN.textContent = String(Math.round(v)).padStart(2, '0');
    try { localStorage.setItem('skye-astra:vol', String(Math.round(v))); } catch (_) {}
  }

  async function play() {
    if (!node || status === 'absent') return false;
    wanted = true;
    wireAnalyser();
    if (ctx && ctx.state === 'suspended') { try { await ctx.resume(); } catch (_) {} }
    try {
      await node.play();
      setStatus('playing');
      return true;
    } catch (err) {
      if (err && (err.name === 'NotSupportedError' || node.error)) setStatus('absent');
      else setStatus('ready');
      return false;
    }
  }

  function pause() {
    wanted = false;
    if (node) node.pause();
    if (status !== 'absent') setStatus('ready');
  }

  function toggle() {
    if (status === 'playing') { pause(); say('audio held'); }
    else play().then(ok => say(ok ? 'astra theme, loop engaged' : 'no track in assets/audio'));
  }

  function mute() {
    if (!node) return;
    node.muted = !node.muted;
    say(node.muted ? 'audio muted' : 'audio live');
  }

  function bump(delta) {
    if (!vol) return;
    vol.value = String(clamp(Number(vol.value) + delta, 0, 100));
    applyVolume(Number(vol.value));
  }

  function energy() {
    if (!analyser || status !== 'playing') { level *= 0.92; return level; }
    analyser.getByteFrequencyData(bins);
    let sum = 0;
    for (let i = 0; i < bins.length; i++) sum += bins[i];
    const avg = sum / bins.length / 255;
    level += (avg - level) * 0.25;
    return level;
  }

  function init() {
    node = $('#track');
    btn = $('#a-toggle');
    ico = $('#a-ico');
    lab = $('#a-lab');
    vol = $('#a-vol');
    volN = $('#a-vol-n');
    if (!node || !btn) return;

    let saved = 55;
    try { const s = localStorage.getItem('skye-astra:vol'); if (s != null) saved = clamp(Number(s), 0, 100); } catch (_) {}
    vol.value = String(saved);
    applyVolume(saved);

    node.addEventListener('error', () => setStatus('absent'));
    node.addEventListener('stalled', () => { if (!node.duration) setStatus('absent'); });
    node.addEventListener('canplay', () => { if (status !== 'playing') setStatus('ready'); });
    node.addEventListener('playing', () => setStatus('playing'));
    node.addEventListener('pause', () => { if (status === 'playing') setStatus('ready'); });

    setTimeout(() => {
      if (status === 'unknown') {
        setStatus(node.networkState === 3  ? 'absent' : 'ready');
      }
    }, 2200);

    btn.addEventListener('click', toggle);
    vol.addEventListener('input', () => applyVolume(Number(vol.value)));

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && status === 'playing') { node.pause(); }
      else if (!document.hidden && wanted && status !== 'absent') { node.play().catch(() => {}); }
    });

    paint();
  }

  return {
    init, play, pause, toggle, mute, bump, energy,
    get status() { return status; },

    get time() {
      return node && status === 'playing' && !node.paused ? node.currentTime : null;
    }
  };
})();
