import { $, el, state, bus, say } from './core.js?v=2';
import { data } from './vault.js?v=2';

export const ask = (function () {
  'use strict';


  let handler = null;
  let box, input, sendBtn, log, statusEl;
  let busy = false;
  let seq = 0;

  function setHandler(fn) {
    handler = typeof fn === 'function' ? fn : null;
    paintStatus();
    bus.emit('ask-handler', !!handler);
    return !!handler;
  }

  function context() {
    const sel = state.selected != null ? data.nodes[state.selected] : null;
    return {
      mode: state.mode,
      selected: state.selected,
      selectedSlug: sel ? sel.slug : null,
      visibleDomains: data.categories.map(c => c.id).filter(id => !state.off.has(id)),
      favourites: Array.from(state.favourites),
      peer: state.peer,
      query: state.query
    };
  }

  function entry(kind, text, extra) {
    const node = el('li', { class: 'ask-row ask-' + kind });
    node.appendChild(el('span', { class: 'ask-mark', text: kind === 'q' ? '>' : '::' }));
    const body = el('div', { class: 'ask-body' });
    body.appendChild(el('p', { class: 'ask-text', text: text }));
    if (extra) body.appendChild(extra);
    node.appendChild(body);
    log.appendChild(node);
    log.scrollTop = log.scrollHeight;
    return node;
  }

  function sourceList(slugs) {
    const known = (slugs || [])
      .map(s => data.bySlug.get(String(s).replace(/\.md$/, '')))
      .filter(Boolean);
    if (!known.length) return null;

    const wrap = el('div', { class: 'ask-src' }, [
      el('span', { class: 'ask-src-cap', text: 'FROM' })
    ]);
    known.forEach(nd => {
      const b = el('button', { class: 'ask-chip', type: 'button' });
      b.textContent = data.titleOf(nd);
      b.addEventListener('click', () => bus.emit('goto-node', nd.id));
      wrap.appendChild(b);
    });
    return wrap;
  }

  async function submit() {
    const q = (input.value || '').trim();
    if (!q || busy) return;

    if (!handler) {
      paintStatus();
      say('question sector is not connected to a backend yet');
      return;
    }

    const mine = ++seq;
    busy = true;
    input.value = '';
    paintStatus();
    entry('q', q);
    const pending = entry('a', 'Thinking…');
    pending.classList.add('ask-pending');

    try {
      const res = await handler(q, context());
      if (mine !== seq) return;
      const answer = res && typeof res.answer === 'string' ? res.answer.trim() : '';
      pending.remove();
      if (!answer) {
        entry('a', 'The station returned nothing for that.').classList.add('ask-empty');
      } else {
        entry('a', answer, sourceList(res.sources));
      }
    } catch (err) {
      if (mine !== seq) return;
      pending.remove();
      const msg = err && err.message ? err.message : 'the station did not answer';
      entry('a', msg).classList.add('ask-error');
    } finally {
      if (mine === seq) { busy = false; paintStatus(); input.focus(); }
    }
  }

  function clear() {
    seq++;
    busy = false;
    log.innerHTML = '';
    paintStatus();
  }

  function paintStatus() {
    if (!statusEl) return;
    const connected = !!handler;
    statusEl.textContent = busy ? 'WORKING' : (connected ? 'CONNECTED' : 'NOT CONNECTED');
    statusEl.className = 'ask-status' + (connected ? ' on' : '') + (busy ? ' busy' : '');
    if (sendBtn) sendBtn.disabled = !connected || busy;
    if (input) {
      input.disabled = busy;
      input.placeholder = connected
        ? 'Ask the station about its notes'
        : 'not connected';
    }
    box.classList.toggle('offline', !connected);
  }

  function open() {
    box.hidden = false;
    paintStatus();
    input.focus();
  }
  function close() { box.hidden = true; input.blur(); }
  function toggle() { if (box.hidden) open(); else close(); }

  function init() {
    box = $('#ask');
    input = $('#ask-input');
    sendBtn = $('#ask-send');
    log = $('#ask-log');
    statusEl = $('#ask-status');
    if (!box) return;

    sendBtn.addEventListener('click', submit);
    $('#ask-clear').addEventListener('click', clear);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
    });

    paintStatus();
  }

  return { init, setHandler, submit, clear, open, close, toggle, context, get connected() { return !!handler; } };
})();
