import { cores } from './memories.js?v=5';
import { sfx }   from './sfx.js?v=5';
import { Music } from './music.js?v=5';

const $ = (id) => document.getElementById(id);

const _loaded = new Map();
function loadScript(src) {
  if (_loaded.has(src)) return _loaded.get(src);
  const p = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = () => res();
    s.onerror = () => rej(new Error('failed to load ' + src));
    document.head.appendChild(s);
  });
  _loaded.set(src, p);
  return p;
}

class MemoryArchive {
  constructor() {
    this.phase          = 'gate';
    this.selectedCore   = -1;
    this.selectedMemory = 0;
    this._entered       = false;

    this.dom = {
      gate:            $('gate'),
      gateBtn:         $('gateBtn'),
      transition:      $('transition'),
      transitionVideo: $('transitionVideo'),
      overview:        $('overviewLayer'),
      focus:           $('focusLayer'),
      tip:             $('tip'),
      tipText:         $('tipText'),
      canvas:          $('clockCanvas'),
      host:            $('clockHost'),
      scrub:           $('scrub'),
      scrubKnob:       $('scrubKnob'),
      idxList:         $('idxList'),
      sigilRail:       $('sigilRail'),
      framePhoto:      $('framePhoto'),
      frameIcon:       $('frameIcon'),
      frameBtn:        $('frameBtn'),
      lightbox:        $('lightbox'),
      lightboxClose:   $('lightboxClose'),
      lightboxPhoto:   $('lightboxPhoto'),
      lightboxCaption: $('lightboxCaption'),
      coreLabel:       $('coreLabel'),
      memoryTitle:     $('memoryTitle'),
      memoryDate:      $('memoryDate'),
      memoryCat:       $('memoryCat'),
      memoryNote:      $('memoryNote'),
      backBtn:         $('backBtn'),
      ctaOpen:         $('ctaOpen'),
      musicToggle:     $('musicToggle'),
      musicAudio:      $('musicAudio'),
    };

    this.music = new Music(this.dom.musicAudio, this.dom.musicToggle);
  }

  async start() {
    this.buildSigilRail();
    this.bindEvents();
    this.bootClock();
  }

  buildSigilRail() {
    const frag = document.createDocumentFragment();
    cores.forEach((c, i) => {
      const img = document.createElement('img');
      img.src = c.icon;
      img.alt = c.title;
      img.dataset.core = i;
      img.addEventListener('mouseenter', () => sfx.play('selection', 0.22));
      img.addEventListener('click', () => this.focusCore(i));
      frag.appendChild(img);
    });
    this.dom.sigilRail.appendChild(frag);
  }

  rebuildTimelineIndex() {
    const core = cores[this.selectedCore];
    const list = this.dom.idxList;
    list.innerHTML = '';

    if (!core || core.memories.length === 0) return;

    const frag = document.createDocumentFragment();
    core.memories.forEach((m, i) => {
      const li = document.createElement('li');
      li.className = 'mg-index-row';
      li.dataset.index = i;
      li.innerHTML = `
        <span class="mg-index-name">${m.title}</span>
        <span class="mg-index-dot"></span>
      `;
      li.addEventListener('mouseenter', () => sfx.play('selection', 0.22));
      li.addEventListener('click', () => this.selectMemory(i));
      frag.appendChild(li);
    });
    list.appendChild(frag);
  }

  bindEvents() {
    document.querySelectorAll('[data-action]').forEach((el) => {
      const act = el.dataset.action;
      el.addEventListener('mouseenter', () => sfx.play('selection', 0.22));
      el.addEventListener('click', () => {
        if (act === 'prev') this.stepMemory(-1);
        if (act === 'next') this.stepMemory(+1);
      });
    });

    this.dom.gate.addEventListener('click', (e) => {
      if (e.target === this.dom.gate) this.playRippleAndEnter(e);
    });
    this.dom.gateBtn.addEventListener('click', (e) => this.playRippleAndEnter(e));
    this.dom.gateBtn.addEventListener('mouseenter', () => sfx.play('selection', 0.22));

    this.dom.ctaOpen.addEventListener('click',      () => this.focusCore(0));
    this.dom.ctaOpen.addEventListener('mouseenter', () => sfx.play('selection', 0.22));
    this.dom.backBtn.addEventListener('click',      () => this.unfocus());
    this.dom.backBtn.addEventListener('mouseenter', () => sfx.play('selection', 0.22));

    this.dom.musicToggle.addEventListener('click', () => this.music.toggle());
    this.dom.musicToggle.addEventListener('mouseenter', () => sfx.play('selection', 0.22));

    this.dom.scrub.addEventListener('pointerdown', (e) => this.scrubDown(e));

    this.dom.frameBtn.addEventListener('click', () => this.openLightbox());
    this.dom.frameBtn.addEventListener('mouseenter', () => sfx.play('selection', 0.18));

    this.dom.lightboxClose.addEventListener('click', () => this.closeLightbox());

    this._onKey = (e) => {
      if (!this.dom.lightbox.hidden) {
        if (e.key === 'Escape') this.closeLightbox();
        return;
      }
      if (this.selectedCore < 0) return;
      if (e.key === 'Escape') this.unfocus();
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') this.stepMemory(+1);
      else if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   this.stepMemory(-1);
    };
    document.addEventListener('keydown', this._onKey);

    this.dom.transitionVideo.addEventListener('ended', () => this.endTransition());
    window.addEventListener('beforeunload', () => this.dispose());
  }

  async bootClock() {
    try {
      await loadScript('js/clock3d.js');
      for (let i = 0; i < 40 && !window.MemoryClock; i++) {
        await new Promise((r) => setTimeout(r, 40));
      }
      if (!window.MemoryClock) throw new Error('MemoryClock not available');
      this.clock3d = await window.MemoryClock.init(this.dom.canvas, {
        memories: cores,
        basePath: 'assets/images/',
        onHover:  (i, x, y) => this.showTip(i, x, y),
        onSelect: (i) => { if (i >= 0) this.focusCore(i); },
      });
      this.clock3d.setPaused(this.phase !== 'album');
    } catch (e) {
      console.warn('[gallery] clock init failed:', e);
    }
  }

  playRippleAndEnter(e) {
    if (this._entered) return;
    this._entered = true;
    const btn = this.dom.gateBtn;
    if (btn && e) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'mg-ripple';
      ripple.style.left = ((e.clientX ?? rect.left + rect.width / 2) - rect.left) + 'px';
      ripple.style.top  = ((e.clientY ?? rect.top  + rect.height / 2) - rect.top)  + 'px';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    }
    setTimeout(() => this.enter(), 240);
  }

  enter() {
    sfx.play('select', 0.6);
    this.phase = 'transition';
    this.dom.gate.classList.add('is-leaving');
    this.dom.transition.hidden = false;
    this._transitionTimer = setTimeout(() => this.endTransition(), 3400);
    setTimeout(() => this.dom.gate.remove(), 700);
    this.music.start();
  }

  endTransition() {
    clearTimeout(this._transitionTimer);
    if (this.phase === 'album') return;
    this.phase = 'album';
    this.dom.transition.hidden = true;
    this.clock3d?.setPaused(false);
  }

  focusCore(i) {
    if (i < 0 || i >= cores.length) return;
    if (i === this.selectedCore) return;
    sfx.play('select', 0.55);
    this.selectedCore   = i;
    this.selectedMemory = 0;
    this.dom.tip.style.opacity = '0';
    this.clock3d?.focus(i);
    this.dom.overview.classList.add('is-hidden');
    this.dom.focus.hidden = false;
    this.rebuildTimelineIndex();
    this.renderFocus();
  }

  unfocus() {
    if (this.selectedCore < 0) return;
    sfx.play('leave', 0.45);
    this.selectedCore   = -1;
    this.selectedMemory = 0;
    this.clock3d?.unfocus();
    this.dom.focus.hidden = true;
    this.dom.overview.classList.remove('is-hidden');
  }

  selectMemory(j) {
    const core = cores[this.selectedCore];
    if (!core || j < 0 || j >= core.memories.length) return;
    if (j === this.selectedMemory) return;
    sfx.play('gear', 0.4);
    this.selectedMemory = j;
    this.renderFocus();
  }

  stepMemory(delta) {
    const core = cores[this.selectedCore];
    if (!core || core.memories.length === 0) return;
    const n = core.memories.length;
    const next = (this.selectedMemory + delta + n) % n;
    if (next === this.selectedMemory) return;
    sfx.play('gear', 0.4);
    this.selectedMemory = next;
    this.renderFocus();
  }

  renderFocus() {
    const core = cores[this.selectedCore];
    if (!core) return;
    const m = core.memories[this.selectedMemory];

    this.dom.coreLabel.textContent = core.title;
    this.dom.frameIcon.src = core.icon;

    if (!m) {
      this.dom.memoryTitle.textContent = 'COMING SOON';
      this.dom.memoryDate.textContent  = '';
      this.dom.memoryCat.textContent   = core.title;
      this.dom.memoryNote.textContent  = 'This core is still waiting for its first memory.';
      this.dom.framePhoto.removeAttribute('src');
      return;
    }

    this.dom.memoryTitle.textContent = m.title;
    this.dom.memoryDate.textContent  = m.date;
    this.dom.memoryCat.textContent   = core.title;
    this.dom.memoryNote.textContent  = m.note;
    if (m.photo) this.dom.framePhoto.src = m.photo;
    else this.dom.framePhoto.removeAttribute('src');

    this.dom.idxList.querySelectorAll('.mg-index-row').forEach((el) => {
      el.classList.toggle('is-active', Number(el.dataset.index) === this.selectedMemory);
    });
    this.dom.sigilRail.querySelectorAll('img').forEach((el) => {
      el.classList.toggle('is-active', Number(el.dataset.core) === this.selectedCore);
    });
    const activeRow = this.dom.idxList.querySelector('.mg-index-row.is-active');
    activeRow?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  openLightbox() {
    const core = cores[this.selectedCore];
    const m = core?.memories[this.selectedMemory];
    if (!m?.photo) return;
    sfx.play('select', 0.35);
    this.dom.lightboxPhoto.src = m.photo;
    this.dom.lightboxPhoto.alt = m.title;
    this.dom.lightboxCaption.textContent = `${m.title} · ${m.date}`;
    this.dom.lightbox.hidden = false;
  }

  closeLightbox() {
    if (this.dom.lightbox.hidden) return;
    sfx.play('leave', 0.28);
    this.dom.lightbox.hidden = true;
    this.dom.lightboxPhoto.removeAttribute('src');
  }

  showTip(i, x, y) {
    const tip = this.dom.tip;
    if (i < 0 || this.selectedCore >= 0) {
      tip.style.opacity = '0';
      return;
    }
    const c = cores[i];
    if (!c) return;
    if (this.dom.tipText.textContent !== c.title) this.dom.tipText.textContent = c.title;
    tip.style.transform = `translate(-50%, -140%) translate(${x}px, ${y}px)`;
    tip.style.opacity = '1';
  }

  scrubDown(e) {
    e.preventDefault();
    const startX = e.clientX;
    let last = startX;
    const knob = this.dom.scrubKnob;

    const move = (ev) => {
      this.clock3d?.spin((ev.clientX - last) * 0.011);
      last = ev.clientX;
      const dx = Math.max(-120, Math.min(120, ev.clientX - startX));
      knob.style.transform = `translateX(${dx}px)`;
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      knob.style.transition = 'transform 600ms cubic-bezier(.2,.8,.25,1)';
      knob.style.transform = 'translateX(0)';
      setTimeout(() => { knob.style.transition = ''; }, 620);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  dispose() {
    clearTimeout(this._transitionTimer);
    document.removeEventListener('keydown', this._onKey);
    this.music.dispose();
    this.clock3d?.dispose?.();
  }
}

const app = new MemoryArchive();
const boot = () => app.start().catch(e => console.error('[gallery] start failed:', e));
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
