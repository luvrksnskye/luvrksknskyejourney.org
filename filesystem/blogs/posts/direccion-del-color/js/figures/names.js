import { loadNames, still } from '../munsell.js?v=1';

const ROWS = 'ABCDEFGHIJ';
const ORDER = ['es', 'en', 'ja', 'zh'];
const LANG_LABEL = { es: 'español', en: 'english', ja: '日本語', zh: '中文' };

const chipName = (chip) => (chip.c === 0 ? `N ${chip.v}` : `${chip.h} ${chip.v}/${chip.c}`);

class Names {
  constructor(host, data) {
    this.host = host;
    this.data = data;
    this.figure = host.closest('.dd-figure');
    this.stage = host.querySelector('[data-role="stage"]');
    this.grid = host.querySelector('[data-role="grid"]');
    this.tip = host.querySelector('[data-role="tip"]');
    this.legend = host.querySelector('[data-role="legend"]');
    this.fociButton = host.querySelector('[data-role="foci"]');
    this.langButtons = [...host.querySelectorAll('[data-lang]')];
    this.lang = 'es';
    this.compare = false;
    this.labels = [];
    this.byNumber = new Map(data.chips.map((chip) => [chip.n, chip]));
    this.termOf = {};
    for (const key of ORDER) {
      const map = new Map();
      data.languages[key].terms.forEach((term, t) => term.chips.forEach((n) => map.has(n) || map.set(n, t)));
      this.termOf[key] = map;
    }
    this.build();
    this.langButtons.forEach((button) => button.addEventListener('click', () => this.setLang(button.dataset.lang)));
    this.fociButton.addEventListener('click', () => {
      this.compare = !this.compare;
      this.fociButton.setAttribute('aria-pressed', String(this.compare));
      this.paint();
    });
    new ResizeObserver(() => this.placeLabels()).observe(this.grid);
    this.paint(true);
  }

  build() {
    const cells = new Map(this.data.chips.map((chip) => [`${chip.row}${chip.col}`, chip]));
    this.cells = new Map();
    const nodes = [];
    for (const row of ROWS) {
      for (let col = 0; col <= 40; col++) {
        const chip = cells.get(`${row}${col}`);
        const cell = document.createElement('span');
        cell.className = 'dd-names-chip';
        if (!chip) {
          cell.classList.add('is-gap');
        } else {
          cell.style.setProperty('--c', `#${chip.srgb}`);
          cell.style.setProperty('--d', `${still ? 0 : col * 9}ms`);
          cell.dataset.n = String(chip.n);
          cell.setAttribute('role', 'gridcell');
          cell.setAttribute('aria-label', chipName(chip));
          this.cells.set(chip.n, cell);
        }
        nodes.push(cell);
      }
    }
    this.grid.replaceChildren(...nodes);
    this.grid.addEventListener('pointermove', (e) => this.hover(e));
    this.grid.addEventListener('pointerdown', (e) => this.hover(e));
    this.grid.addEventListener('pointerleave', () => {
      this.tip.hidden = true;
      this.hot?.classList.remove('is-hot');
      this.hot = null;
    });
  }

  setLang(lang) {
    if (lang === this.lang) return;
    this.lang = lang;
    this.langButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    if (this.compare) {
      this.compare = false;
      this.fociButton.setAttribute('aria-pressed', 'false');
    }
    this.paint();
  }

  paint(first = false) {
    const language = this.data.languages[this.lang];
    const termOf = this.termOf[this.lang];
    const focusCount = new Map();
    if (this.compare) {
      for (const key of ORDER) {
        for (const term of this.data.languages[key].terms) {
          for (const n of term.focus) focusCount.set(n, (focusCount.get(n) || 0) + 1);
        }
      }
    }
    const foci = new Set(language.terms.flatMap((t) => t.focus));
    for (const [n, cell] of this.cells) {
      const named = termOf.has(n);
      cell.classList.toggle('is-off', !this.compare && !named);
      cell.classList.toggle('is-focus', !this.compare && foci.has(n));
      const count = focusCount.get(n);
      if (this.compare && count) {
        cell.dataset.mark = String(count);
        cell.classList.add('is-focus');
      } else {
        delete cell.dataset.mark;
      }
      if (this.compare && !count) cell.classList.add('is-off');
    }
    this.renderLabels(first);
    this.renderLegend();
  }

  renderLabels(first) {
    this.labels.forEach((label) => label.remove());
    this.labels = [];
    if (this.compare) return;
    const language = this.data.languages[this.lang];
    language.terms.forEach((term, k) => {
      const anchor = term.focus[0] ?? term.chips[0];
      if (anchor === undefined) return;
      const label = document.createElement('span');
      label.className = 'dd-names-label';
      label.lang = this.lang === 'zh' ? 'zh' : this.lang === 'ja' ? 'ja' : this.lang;
      label.append(term.word);
      if (term.reading || this.lang !== 'es') {
        const small = document.createElement('small');
        small.textContent = term.reading || term.gloss;
        label.append(small);
      }
      label.dataset.anchor = String(anchor);
      if (!first && !still) label.style.animationDelay = `${120 + k * 40}ms`;
      this.stage.append(label);
      this.labels.push(label);
    });
    this.placeLabels();
  }

  placeLabels() {
    const taken = [];
    for (const label of this.labels) {
      const cell = this.cells.get(Number(label.dataset.anchor));
      if (!cell) continue;
      let x = cell.offsetLeft + cell.offsetWidth / 2;
      let y = cell.offsetTop - cell.offsetHeight * 0.9;
      for (const [tx, ty] of taken) {
        if (Math.abs(tx - x) < 64 && Math.abs(ty - y) < 20) y -= 22;
      }
      taken.push([x, y]);
      x = Math.min(this.grid.offsetLeft + this.grid.offsetWidth - 30, Math.max(this.grid.offsetLeft + 30, x));
      label.style.left = `${x}px`;
      label.style.top = `${y}px`;
    }
  }

  renderLegend() {
    const language = this.data.languages[this.lang];
    if (this.compare) {
      const span = document.createElement('span');
      span.textContent = 'el número dentro de cada ficha dice cuántos de los cuatro idiomas la eligieron como el mejor ejemplo de una palabra';
      this.legend.replaceChildren(span);
      return;
    }
    const items = language.terms.map((term) => {
      const span = document.createElement('span');
      const swatch = document.createElement('i');
      const focus = this.byNumber.get(term.focus[0] ?? term.chips[0]);
      swatch.style.background = focus ? `#${focus.srgb}` : '#ccc';
      span.append(swatch, term.reading ? `${term.word} ${term.reading}` : term.word);
      if (this.lang !== 'es') span.title = term.gloss;
      return span;
    });
    const note = document.createElement('span');
    note.textContent = `· ${language.label}, ${language.terms.length} palabras`;
    this.legend.replaceChildren(...items, note);
  }

  hover(e) {
    const cell = e.target.closest('.dd-names-chip[data-n]');
    if (!cell) {
      this.tip.hidden = true;
      return;
    }
    if (cell !== this.hot) {
      this.hot?.classList.remove('is-hot');
      this.hot = cell;
      cell.classList.add('is-hot');
      const chip = this.byNumber.get(Number(cell.dataset.n));
      const swatch = document.createElement('i');
      swatch.style.background = `#${chip.srgb}`;
      const title = document.createElement('b');
      title.textContent = chipName(chip);
      const list = document.createElement('dl');
      for (const key of ORDER) {
        const t = this.termOf[key].get(chip.n);
        const term = t === undefined ? null : this.data.languages[key].terms[t];
        const dt = document.createElement('dt');
        dt.textContent = LANG_LABEL[key];
        const dd = document.createElement('dd');
        dd.textContent = term ? `${term.word}${term.reading ? ` ${term.reading}` : ''}${term.focus.includes(chip.n) ? ' · foco' : ''}` : '·';
        list.append(dt, dd);
      }
      this.tip.replaceChildren(swatch, title, list);
    }
    const x = cell.offsetLeft + cell.offsetWidth / 2;
    const y = cell.offsetTop + cell.offsetHeight / 2;
    this.tip.style.left = `${x}px`;
    this.tip.style.top = `${y}px`;
    this.tip.classList.toggle('is-flipped', x > this.stage.clientWidth * 0.62);
    this.tip.hidden = false;
  }
}

export async function mount(host) {
  const data = await loadNames();
  return new Names(host, data);
}
