(function () {
  'use strict';

  const GESTURES = ['pointerdown', 'touchstart', 'keydown'];
  let waiting = false;

  function loops() {
    return Array.prototype.filter.call(document.querySelectorAll('video[autoplay][loop]'), v => !v.controls);
  }

  function prime(video) {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
  }

  function start(video) {
    if (!video.paused || video.ended && !video.loop) return;
    prime(video);
    const go = video.play();
    if (go && typeof go.catch === 'function') go.catch(() => armGesture());
  }

  function kick() {
    if (document.hidden) return;
    loops().forEach(start);
  }

  function onGesture() {
    waiting = false;
    GESTURES.forEach(name => window.removeEventListener(name, onGesture, true));
    kick();
  }

  function armGesture() {
    if (waiting) return;
    waiting = true;
    GESTURES.forEach(name => window.addEventListener(name, onGesture, { capture: true, passive: true }));
  }

  function init() {
    loops().forEach(video => {
      prime(video);
      video.addEventListener('stalled', () => { if (video.paused) start(video); });
      if (video.readyState >= 2) start(video);
      else video.addEventListener('canplay', () => start(video), { once: true });
    });
  }

  document.addEventListener('visibilitychange', kick);
  window.addEventListener('pageshow', kick);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
