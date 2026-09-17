import { countTo, onSeen } from './core/env.js?v=3';
import { loadSite, loadWords } from './data/site.js?v=3';
import { loadVisits } from './data/visits.js?v=3';
import { startHud } from './ui/hud.js?v=3';
import { startReveal } from './ui/reveal.js?v=3';
import { startBackdrop } from './ui/backdrop.js?v=3';
import { startDeck } from './ui/deck.js?v=3';
import { startCapsule } from './ui/capsule.js?v=3';
import { startModules } from './ui/modules.js?v=3';
import { startTelemetry } from './ui/telemetry.js?v=3';
import { startSound } from './ui/sound.js?v=4';

const $ = (selector) => document.querySelector(selector);

startHud();
startReveal();
startBackdrop($('.sa-backdrop'));
startSound($('[data-sound]'));

const deck = startDeck($('#deck'));
startCapsule($('#capsule'));
const modules = startModules($('#parts'));
const telemetry = startTelemetry($('#heartbeat'));

loadSite().then((site) => {
  countTo($('[data-count="pieces"]'), site.records.length);
  deck.update(site);
  modules.update(site);
  telemetry.update(site);

  onSeen($('#parts'), () => {
    loadWords(site).then((words) => {
      document.querySelectorAll('[data-count="words"]').forEach((el) => countTo(el, words, 2400));
    }).catch(() => {});
  }, '40% 0px');
}).catch(() => {
  document.body.dataset.offline = 'true';
});

loadVisits().then(({ total }) => {
  document.querySelectorAll('[data-visits]').forEach((el) => countTo(el, total));
  document.querySelectorAll('[data-visits-wrap]').forEach((el) => { el.hidden = false; });
}).catch(() => {});
